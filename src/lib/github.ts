import type { BBGraph, BBNode, RepoMeta, RepoTreeResponse } from "../types/bb";

const defaultMeta: RepoMeta = {
  owner: "CSA-FEDERATE",
  repo: "Proposed-BuildingBlocks",
  branch: "main",
  baseUrl: "https://github.com/CSA-FEDERATE/Proposed-BuildingBlocks",
};

const apiBase = "https://api.github.com";

const getHeaders = () => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const fetchRepoTree = async (meta: RepoMeta = defaultMeta) => {
  const url = `${apiBase}/repos/${meta.owner}/${meta.repo}/git/trees/${meta.branch}?recursive=1`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`Failed to fetch repo tree: ${response.status}`);
  }
  const data = (await response.json()) as RepoTreeResponse;
  return data;
};

const fetchFallbackTree = async (): Promise<RepoTreeResponse> => {
  const response = await fetch("/sample-tree.json");
  if (!response.ok) {
    throw new Error("Failed to load fallback data.");
  }
  return (await response.json()) as RepoTreeResponse;
};

const ensureRoot = (nodes: BBNode[]): BBNode => {
  const root: BBNode = {
    id: "root",
    name: "FEDERATE Building Blocks",
    path: "",
    type: "tree",
    children: [],
  };
  nodes.forEach((node) => {
    if (node.path === "") {
      return;
    }
    const parts = node.path.split("/");
    let current = root;
    parts.forEach((part, index) => {
      if (!current.children) {
        current.children = [];
      }
      let next = current.children.find((child) => child.name === part);
      if (!next) {
        const path = parts.slice(0, index + 1).join("/");
        next = {
          id: path,
          name: part,
          path,
          type: index === parts.length - 1 ? node.type : "tree",
          children: [],
        };
        current.children.push(next);
      }
      current = next;
    });
  });
  return root;
};

const flattenGraph = (root: BBNode) => {
  const nodes: BBNode[] = [];
  const edges: { from: string; to: string }[] = [];

  const walk = (node: BBNode) => {
    nodes.push(node);
    node.children?.forEach((child) => {
      edges.push({ from: node.id, to: child.id });
      walk(child);
    });
  };

  walk(root);
  return { nodes, edges };
};

const fetchReadmeSnippet = async (meta: RepoMeta, path: string) => {
  const readmePath = path ? `${path}/README.md` : "README.md";
  const url = `${apiBase}/repos/${meta.owner}/${meta.repo}/contents/${readmePath}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    return undefined;
  }
  const data = (await response.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") {
    return undefined;
  }
  const decoded = atob(data.content.replace(/\n/g, ""));
  const snippet = decoded.split("\n").slice(0, 6).join("\n");
  return snippet;
};

const fetchReadmeContent = async (meta: RepoMeta, path: string) => {
  const readmePath = path ? `${path}/README.md` : "README.md";
  const url = `${apiBase}/repos/${meta.owner}/${meta.repo}/contents/${readmePath}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    return undefined;
  }
  const data = (await response.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") {
    return undefined;
  }
  return atob(data.content.replace(/\n/g, ""));
};

const extractFullName = (snippet?: string) => {
  if (!snippet) {
    return undefined;
  }
  const lines = snippet.split("\n").map((line) => line.trim());
  const titleLine = lines.find((line) => line.startsWith("#"));
  if (!titleLine) {
    return undefined;
  }
  const title = titleLine.replace(/^#+\s*/, "").trim();
  return title || undefined;
};

const parseTagMap = (content?: string) => {
  if (!content) {
    return new Map<string, string>();
  }
  const lines = content.split("\n");
  const tagMap = new Map<string, string>();
  let inSection = false;
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes("bb tags")) {
      inSection = true;
      continue;
    }
    if (trimmed.startsWith("## ") && inTable) {
      break;
    }
    if (!inSection) {
      continue;
    }
    if (trimmed.startsWith("|") && trimmed.includes("|")) {
      inTable = true;
      const cells = trimmed
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      if (cells.length < 2 || cells[0].toLowerCase() === "tag") {
        continue;
      }
      if (cells[0].replace(/-/g, "").length === 0) {
        continue;
      }
      const [tag, description] = cells;
      if (tag && description) {
        tagMap.set(tag, description);
      }
    } else if (inTable && trimmed.length === 0) {
      break;
    }
  }
  return tagMap;
};

export const buildGraph = async (meta: RepoMeta = defaultMeta): Promise<BBGraph> => {
  let tree: RepoTreeResponse;
  let fallbackUsed = false;
  try {
    tree = await fetchRepoTree(meta);
  } catch (err) {
    if (err instanceof Error && err.message.includes("403")) {
      tree = await fetchFallbackTree();
      fallbackUsed = true;
    } else {
      throw err;
    }
  }
  const nodes = tree.tree.map((entry) => ({
    id: entry.path,
    name: entry.path.split("/").pop() ?? entry.path,
    path: entry.path,
    type: entry.type,
  }));

  const root = ensureRoot(nodes);
  const rootReadme = await fetchReadmeContent(meta, "");
  const tagMap = parseTagMap(rootReadme);

  const rootChildren = root.children ?? [];
  await Promise.all(
    rootChildren.slice(0, 40).map(async (child) => {
      if (child.type === "tree") {
        child.readmeSnippet = await fetchReadmeSnippet(meta, child.path);
        child.fullName = tagMap.get(child.name) ?? extractFullName(child.readmeSnippet);
      }
    })
  );

  const { nodes: flatNodes, edges } = flattenGraph(root);
  return { nodes: flatNodes, edges, root, fallbackUsed };
};

export const getRepoMeta = (): RepoMeta => ({ ...defaultMeta });
