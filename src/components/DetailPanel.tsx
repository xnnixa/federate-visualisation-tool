import type { BBNode, RepoMeta } from "../types/bb";

interface DetailPanelProps {
  node?: BBNode;
  meta: RepoMeta;
  onViewInTree?: (node: BBNode) => void;
}

export const DetailPanel = ({ node, meta, onViewInTree }: DetailPanelProps) => {
  const realBaseUrl = "https://github.com/CSA-FEDERATE/Proposed-BuildingBlocks";
  if (!node) {
    return (
      <div className="detail-panel">
        <div className="detail-panel__empty">
          Select a Building Block folder or file to view details.
        </div>
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

  const pathParts = node.path ? node.path.split("/").filter(Boolean) : [];

  return (
    <div className="detail-panel">
      <h2>{node.name}</h2>
      {node.fullName && (
        <div className="detail-panel__title">{node.fullName}</div>
      )}

      {pathParts.length > 0 && (
        <nav className="detail-panel__hierarchy" aria-label="Node hierarchy">
          {pathParts.map((part, i) => (
            <span key={i} className="detail-panel__hierarchy-step">
              {i > 0 && <span className="detail-panel__hierarchy-sep">›</span>}
              <span
                className={
                  i === pathParts.length - 1
                    ? "detail-panel__hierarchy-current"
                    : "detail-panel__hierarchy-ancestor"
                }
              >
                {part}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="detail-panel__meta">
        <div>
          <strong>Path:</strong> {node.path || "/"}
        </div>
        <div>
          <strong>Type:</strong> {node.type === "tree" ? "Folder" : "File"}
        </div>
      </div>
      {snippet && <pre className="detail-panel__snippet">{snippet}</pre>}
      <div className="detail-panel__actions">
        {onViewInTree && (
          <button
            type="button"
            className="detail-panel__button"
            onClick={() => onViewInTree(node)}
          >
            View in tree view
          </button>
        )}
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="detail-panel__button detail-panel__button--secondary"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
};
