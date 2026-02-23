import type { BBNode, RepoMeta } from "../types/bb";

interface DetailPanelProps {
  node?: BBNode;
  meta: RepoMeta;
}

export const DetailPanel = ({ node, meta }: DetailPanelProps) => {
    const realBaseUrl = "https://github.com/CSA-FEDERATE/Proposed-BuildingBlocks";
  if (!node) {
    return (
      <div className="detail-panel__empty">
        Select a Building Block folder or file to view details.
      </div>
    );
  }

  const link = node.path
    ? `${realBaseUrl}/tree/${meta.branch}/${node.path}`
    : meta.baseUrl;
  const snippet = node.readmeSnippet
    ? node.readmeSnippet
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return !trimmed.startsWith("<!--") && !trimmed.startsWith("![");
        })
        .join("\n")
        .trim()
    : "";

  return (
    <div className="detail-panel">
      <h2>{node.name}</h2>
      {node.fullName && <div className="detail-panel__title">{node.fullName}</div>}
      <div className="detail-panel__meta">
        <div>
          <strong>Path:</strong> {node.path || "/"}
        </div>
        <div>
          <strong>Type:</strong> {node.type}
        </div>
      </div>
      {snippet && <pre className="detail-panel__snippet">{snippet}</pre>}
      <a href={link} target="_blank" rel="noreferrer">
        View on GitHub
      </a>
    </div>
  );
};
