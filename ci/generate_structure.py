#!/usr/bin/env python3
"""
Generate a JSON structure representing the folder and file hierarchy
of a directory, and prefetch images from READMEs.
"""

import json
import re
import urllib.request
from pathlib import Path
from sys import argv


# GitHub raw content base
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/CSA-FEDERATE/Proposed-BuildingBlocks/main"


def extract_image_urls_from_readme(content: str, folder_path: str) -> list[str]:
    """Extract image URLs from README content, converting relative to absolute."""
    urls = set()
    # Match markdown images: ![alt](url)
    for match in re.finditer(r'!\[.*?\]\(([^)]+)\)', content):
        url = match.group(1).strip()
        if url.startswith("http"):
            urls.add(url)
        else:
            # Convert relative to absolute GitHub raw URL
            normalized_path = folder_path.replace("\\", "/")
            absolute_url = f"{GITHUB_RAW_BASE}/{normalized_path}/{url.lstrip('/')}"
            urls.add(absolute_url)
    return list(urls)


def download_image(url: str, output_dir: Path) -> str | None:
    """Download image and return local filename, or None on failure."""
    try:
        with urllib.request.urlopen(url) as response:
            if response.status != 200:
                return None
            data = response.read()
            # Guess extension from URL or content-type
            ext = ""
            if "." in url.split("/")[-1]:
                ext = "." + url.split("/")[-1].split(".")[-1].lower()
            elif "jpeg" in response.headers.get("content-type", ""):
                ext = ".jpg"
            elif "png" in response.headers.get("content-type", ""):
                ext = ".png"
            elif "svg" in response.headers.get("content-type", ""):
                ext = ".svg"
            # Fallback to .bin if unknown
            if not ext:
                ext = ".bin"
            # Sanitize name
            name = url.split("/")[-1].split("?")[0] or "image"
            name = re.sub(r'[^A-Za-z0-9._-]', '_', name)
            filename = f"{name}{ext}"
            # Ensure unique
            counter = 1
            base = filename
            while (output_dir / filename).exists():
                stem = Path(base).stem
                ext = Path(base).suffix
                filename = f"{stem}_{counter}{ext}"
                counter += 1
            (output_dir / filename).write_bytes(data)
            return filename
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return None


def traverse_directory(root_path, relative_to=None, is_root=False, images_dir=None):
    """
    Recursively traverse a directory and build a hierarchical structure.
    
    Args:
        root_path: Path object of the directory to traverse
        relative_to: Path object to compute relative paths from
        is_root: Whether this is the root node

    Returns:
        Dictionary representing the directory structure
    """
    if relative_to is None:
        relative_to = root_path.parent
    
    # Get the relative path
    rel_path = root_path.relative_to(relative_to)
    
    # For root node, use empty string instead of the directory name
    if is_root:
        path_str = ""
    else:
        path_str = str(rel_path)

    # Build the node
    node = {
        "name": root_path.name,
        "type": "directory" if root_path.is_dir() else "file",
        "path": path_str
    }
    
    # If it's a directory, add children
    if root_path.is_dir():
        children = []
        images = []
        try:
            # Sort entries: directories first, then files, alphabetically
            entries = sorted(root_path.iterdir(), 
                           key=lambda x: (not x.is_dir(), x.name.lower()))
            
            for entry in entries:
                # Skip hidden files and .git directory
                if entry.name.startswith('.'):
                    continue
                    
                child_node = traverse_directory(entry, relative_to, images_dir=images_dir)
                children.append(child_node)
            
            # Look for README.md and prefetch images
            readme_path = root_path / "README.md"
            if readme_path.is_file() and images_dir:
                try:
                    readme_content = readme_path.read_text(encoding="utf-8")
                    image_urls = extract_image_urls_from_readme(readme_content, str(rel_path))
                    for url in image_urls:
                        filename = download_image(url, images_dir)
                        if filename:
                            images.append({"url": url, "local": f"/assets/images/{filename}"})
                except Exception as e:
                    print(f"Failed to process README images for {rel_path}: {e}")
            
            if children:
                node["children"] = children
            if images:
                node["images"] = images
        except PermissionError:
            # If we can't read a directory, note it
            node["error"] = "Permission denied"
    
    return node


def main(pathname: str, output_file: Path) -> int:
    """Traverse the given directory and save its structure to a JSON file.

    Args:
        pathname (str): Path to the directory to traverse
        output_file (Path): Path to the output JSON file

    Returns:
        int: exit code
    """
    
    # Path to directory
    dir_path = Path(pathname)
    
    if not dir_path.exists():
        print(f"Error: {dir_path} does not exist")
        return 1
    
    print(f"Traversing: {dir_path}")
    
    # Ensure images output directory exists
    images_dir = output_file.parent.parent / "public" / "assets" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate the structure
    structure = traverse_directory(dir_path, relative_to=dir_path, is_root=True, images_dir=images_dir)

    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(structure, f, indent=2, ensure_ascii=False)
    
    print(f"Structure saved to: {output_file}")
    
    # Also print some statistics
    def count_nodes(node):
        count = {"files": 0, "directories": 0}
        if node["type"] == "file":
            count["files"] = 1
        else:
            count["directories"] = 1
            if "children" in node:
                for child in node["children"]:
                    child_count = count_nodes(child)
                    count["files"] += child_count["files"]
                    count["directories"] += child_count["directories"]
        return count
    
    stats = count_nodes(structure)
    print("\nStatistics:")
    print(f"  Directories: {stats['directories']}")
    print(f"  Files: {stats['files']}")
    print(f"  Total items: {stats['files'] + stats['directories']}")
    
    return 0


if __name__ == "__main__":
    pathname = argv[1]
    output_file = Path(pathname).parent / argv[2]
    exit(main(pathname, output_file))
