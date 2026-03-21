import { useEffect, useState } from "react";

import type { BBNode, RepoMeta } from "../types/bb";

interface DetailPanelProps {
  node?: BBNode;

  meta: RepoMeta;

  onViewInTree?: (node: BBNode) => void;
}

const README_RAW_BASE =
  "https://raw.githubusercontent.com/CSA-FEDERATE/Proposed-BuildingBlocks/main";

const fetchReadme = async (path: string): Promise<string | null> => {
  try {
    const normalizedPath = path.replaceAll("\\", "/");

    const url = `${README_RAW_BASE}/${normalizedPath}/README.md`;

    const response = await fetch(url);

    if (!response.ok) return null;

    const text = await response.text();

    return text

      .split("\n")

      .filter((line) => {
        const trimmed = line.trim();

        return !trimmed.startsWith("<!--") && !trimmed.startsWith("![");
      })

      .join("\n")

      .trim();
  } catch {
    return null;
  }
};

export const DetailPanel = ({
  node,

  meta,

  onViewInTree,
}: DetailPanelProps) => {
  const realBaseUrl = "https://github.com/CSA-FEDERATE/Proposed-BuildingBlocks";

  const [readmeResult, setReadmeResult] = useState<{
    path: string;

    content: string | null;
  } | null>(null);

  useEffect(() => {
    if (!node?.path || node.type !== "tree") return;

    let cancelled = false;

    fetchReadme(node.path).then((content) => {
      if (!cancelled) {
        setReadmeResult({ path: node.path, content });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [node?.path, node?.type]);

  const readme =
    readmeResult?.path === node?.path ? (readmeResult?.content ?? null) : null;

  const readmeLoading =
    node?.type === "tree" && !!node?.path && readmeResult?.path !== node?.path;

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

  const pathParts = node.path ? node.path.split("/").filter(Boolean) : [];

  const isFolder = node.type === "tree";

  const folderChildren = node.children?.filter((c) => c.type === "tree") ?? [];

  const fileChildren = node.children?.filter((c) => c.type === "blob") ?? [];

  return (
    <div className="detail-panel">
      <h2>
        {isFolder ? "📁" : "📄"} {node.name}
      </h2>

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
          <strong>Type:</strong> {isFolder ? "Folder" : "File"}
        </div>

        {isFolder && (
          <div>
            <strong>Contents:</strong> {folderChildren.length} folder
            {folderChildren.length !== 1 ? "s" : ""}, {fileChildren.length} file
            {fileChildren.length !== 1 ? "s" : ""}
          </div>
        )}

        {pathParts.length > 0 && (
          <div>
            <strong>Depth:</strong> Level {pathParts.length}
          </div>
        )}
      </div>

      {readmeLoading && (
        <div className="detail-panel__readme-loading">Loading README…</div>
      )}

      {readme && (
        <div className="detail-panel__readme">
          <strong>README</strong>

          <pre className="detail-panel__snippet">{readme}</pre>
        </div>
      )}

      {node.images && node.images.length > 0 && (
        <div className="detail-panel__images">
          <strong>Images</strong>

          <div className="detail-panel__image-gallery">
            {node.images.map((img, i) => (
              <div key={i} className="detail-panel__image-item">
                <img
                  src={img.local}
                  alt={img.url.split("/").pop() || "Image"}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {isFolder && folderChildren.length > 0 && (
        <div className="detail-panel__children">
          <strong>Sub-blocks</strong>

          <ul className="detail-panel__children-list">
            {folderChildren.map((child) => (
              <li key={child.id} className="detail-panel__child-item">
                📁 {child.name}
              </li>
            ))}
          </ul>
        </div>
      )}

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
