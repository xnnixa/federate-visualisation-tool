import buildingBlocks from "../assets/building-blocks_structure.json";

export type BuildingBlockNode = {
  name: string;

  type: string;

  path: string;

  children?: BuildingBlockNode[];

  images?: Array<{ url: string; local: string }>;
};

export const BB_TAGS_README_URL =
  "https://raw.githubusercontent.com/CSA-FEDERATE/Proposed-BuildingBlocks/main/README.md";

export const parseBuildingBlocks = (
  data: BuildingBlockNode,
): BuildingBlockNode => {
  const parseNode = (node: BuildingBlockNode): BuildingBlockNode => {
    const { name, type, path, children, images } = node;

    const parsedNode: BuildingBlockNode = { name, type, path };

    if (children && children.length > 0) {
      parsedNode.children = children.map(parseNode);
    }

    if (images && images.length > 0) {
      parsedNode.images = images;
    }

    return parsedNode;
  };

  return parseNode(data);
};

export const parseBBTagsFromReadme = (
  markdown: string,
): Record<string, string> => {
  const lines = markdown.split(/\r?\n/);

  const tags: Record<string, string> = {};

  let inTable = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!inTable) {
      if (/^\|\s*Tag\s*\|\s*Description\s*\|?$/i.test(line)) {
        inTable = true;
      }

      continue;
    }

    if (/^\|?\s*-+\s*\|\s*-+/.test(line)) {
      continue;
    }

    if (!line.startsWith("|")) {
      break;
    }

    const cells = line

      .split("|")

      .map((cell) => cell.trim())

      .filter(Boolean);

    if (cells.length < 2) {
      continue;
    }

    const [tag, description] = cells;

    if (!tag || !description) {
      continue;
    }

    tags[tag] = description;
  }

  return tags;
};

export const fetchBBTags = async (
  readmeUrl: string = BB_TAGS_README_URL,
): Promise<Record<string, string>> => {
  const response = await fetch(readmeUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch BB tags: ${response.status}`);
  }

  const markdown = await response.text();

  return parseBBTagsFromReadme(markdown);
};

export const extractBriefDescription = (
  readmeContent: string,
): string | null => {
  if (!readmeContent) return null;

  const lines = readmeContent.split("\n");
  let description = "";
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip code blocks
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Skip headers, lists, links, images, HTML comments
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("[") ||
      trimmed.startsWith("![") ||
      trimmed.startsWith("<!--") ||
      trimmed === ""
    ) {
      continue;
    }

    // Found a text paragraph - take first sentence or up to 150 chars
    description = trimmed;
    const sentenceEnd = description.search(/[.!?]/);
    if (sentenceEnd > 0 && sentenceEnd < 150) {
      return description.substring(0, sentenceEnd + 1);
    } else if (description.length > 150) {
      return description.substring(0, 150) + "...";
    }
    break;
  }

  return description || null;
};

export const getBuildingBlocks = (): BuildingBlockNode => {
  return parseBuildingBlocks(buildingBlocks);
};
