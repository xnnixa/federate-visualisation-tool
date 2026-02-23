export type RepoEntryType = "blob" | "tree";

export interface RepoEntry {
  path: string;
  type: RepoEntryType;
  sha: string;
  url: string;
}

export interface RepoTreeResponse {
  sha: string;
  truncated: boolean;
  tree: RepoEntry[];
}

export interface BBNode {
  id: string;
  name: string;
  fullName?: string;
  path: string;
  type: RepoEntryType;
  children?: BBNode[];
  readmeSnippet?: string;
}

export interface BBEdge {
  from: string;
  to: string;
}

export interface BBGraph {
  nodes: BBNode[];
  edges: BBEdge[];
  root: BBNode;
  fallbackUsed?: boolean;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  branch: string;
  baseUrl: string;
}
