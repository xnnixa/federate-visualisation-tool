import buildingBlocks from "../assets/building-blocks_structure.json";

export type BuildingBlockNode = {
  name: string;
  type: string;
  path: string;
  children?: BuildingBlockNode[];
};

export const BB_TAGS_README_URL =
  "https://raw.githubusercontent.com/CSA-FEDERATE/Proposed-BuildingBlocks/main/README.md";

export const parseBuildingBlocks = (data: BuildingBlockNode): BuildingBlockNode => {
  const parseNode = (node: BuildingBlockNode): BuildingBlockNode => {
    const { name, type, path, children } = node;
    const parsedNode: BuildingBlockNode = { name, type, path };
    if (children && children.length > 0) {
      parsedNode.children = children.map(parseNode);
    }
    return parsedNode;
  };

  return parseNode(data);
};

export const parseBBTagsFromReadme = (markdown: string): Record<string, string> => {
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
  readmeUrl: string = BB_TAGS_README_URL
): Promise<Record<string, string>> => {
  const response = await fetch(readmeUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch BB tags: ${response.status}`);
  }
  const markdown = await response.text();
  return parseBBTagsFromReadme(markdown);
};

export const getBuildingBlocks = (): BuildingBlockNode => {
  return parseBuildingBlocks(buildingBlocks);
};
