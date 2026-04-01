#!/usr/bin/env python3
"""
Generate a JSON structure representing the folder and file hierarchy
of a directory.
"""

import json
import re
from pathlib import Path
from sys import argv

# GitHub raw content base URL for image normalization
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/CSA-FEDERATE/Proposed-BuildingBlocks/main"


def extract_images(content: str) -> list[str] | None:
    """Extract markdown image URLs and convert to absolute GitHub raw URLs.
    
    Only supports: ![alt](/absolute/path.png)
    Ignores: relative paths, external URLs, HTML img tags
    
    Returns max 5 image URLs or None.
    """
    if not content:
        return None
    
    # Markdown image pattern: ![alt](path)
    pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
    matches = re.findall(pattern, content)
    
    images = []
    
    for alt, path in matches:
        # Skip external URLs
        if path.startswith('http://') or path.startswith('https://'):
            continue
        
        # Only support absolute paths starting with /
        if path.startswith('/'):
            # Normalize to GitHub raw URL
            full_url = f"{GITHUB_RAW_BASE}{path}"
            images.append(full_url)
        
        # Stop at 5 images
        if len(images) >= 5:
            break
    
    return images if images else None


def extract_brief_description(content: str) -> str | None:
    """Extract first meaningful paragraph from README content.
    
    Skips headings, images, badges, comments, tables, code fences.
    Returns truncated description (max 160 chars) or None.
    """
    if not content:
        return None
    
    # Skip patterns: headings, images, badges, comments, tables, code fences, dividers
    skip_prefixes = ('#', '![', '[![', '<!--', '|', '```', '---', '***', '- [', '1. ')
    
    paragraphs = []
    current = []
    
    for line in content.split('\n'):
        stripped = line.strip()
        if not stripped:
            if current:
                paragraphs.append(' '.join(current))
                current = []
            continue
        if any(stripped.startswith(p) for p in skip_prefixes):
            continue
        current.append(stripped)
    
    if current:
        paragraphs.append(' '.join(current))
    
    # First substantial paragraph (>10 chars)
    for p in paragraphs:
        clean = p.strip()
        if len(clean) > 10:
            return clean[:157] + "..." if len(clean) > 160 else clean
    
    return None


def traverse_directory(root_path, relative_to=None, is_root=False):
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
    
    # If it's a directory, add children and look for README
    if root_path.is_dir():
        children = []
        readme_content = None
        
        try:
            # Sort entries: directories first, then files, alphabetically
            entries = sorted(root_path.iterdir(), 
                           key=lambda x: (not x.is_dir(), x.name.lower()))
            
            for entry in entries:
                # Skip hidden files and .git directory
                if entry.name.startswith('.'):
                    continue
                
                # Check for README.md (case insensitive)
                if entry.is_file() and entry.name.lower() == 'readme.md':
                    try:
                        content = entry.read_text(encoding='utf-8')
                        # Truncate to 8000 characters with marker
                        if len(content) > 8000:
                            content = content[:8000] + "\n\n[Content truncated due to length...]"
                        readme_content = content
                    except (UnicodeDecodeError, IOError):
                        # Skip files that can't be read as text
                        pass
                    continue
                    
                child_node = traverse_directory(entry, relative_to)
                children.append(child_node)
            
            if children:
                node["children"] = children
                
            if readme_content:
                node["readmeContent"] = readme_content
                # Extract brief description for OverviewPanel cards
                brief_description = extract_brief_description(readme_content)
                if brief_description:
                    node["briefDescription"] = brief_description
                # Extract images for DetailPanel display
                images = extract_images(readme_content)
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
    
    # Generate the structure
    structure = traverse_directory(dir_path, relative_to=dir_path, is_root=True)

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
