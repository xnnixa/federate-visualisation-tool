import type { BBNode } from "../types/bb";
import {
  getOverviewSections,
  hasDescendantOnlySearchMatch,
} from "../lib/search";

interface OverviewPanelProps {
  root: BBNode;
  filter: string;
  onSelect: (node: BBNode) => void;
  selectedId?: string;
}

const countDescendants = (node: BBNode): number => {
  if (!node.children || node.children.length === 0) {
    return 0;
  }

  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0,
  );
};

export const OverviewPanel = ({
  root,
  filter,
  onSelect,
  selectedId,
}: OverviewPanelProps) => {
  const sections = getOverviewSections(root, filter);

  if (sections.length === 0) {
    return <div className="overview-empty">No matching sections.</div>;
  }

  return (
    <div className="overview-grid">
      {sections.map((section) => {
        const isSelected = selectedId === section.id;
        const isFile = section.type === "blob";
        const hasNestedMatch = hasDescendantOnlySearchMatch(section, filter);

        const childNames = section.children
          ?.filter((c) => c.type === "tree")
          .slice(0, 4)
          .map((c) => c.name);
        const hiddenCount =
          (section.children?.filter((c) => c.type === "tree").length ?? 0) -
          (childNames?.length ?? 0);

        return (
          <button
            key={section.id}
            type="button"
            className={`overview-card ${isSelected ? "is-selected" : ""}`}
            onClick={() => onSelect(section)}
          >
            <div className="overview-card__header">
              <span className="overview-card__type-badge">
                {isFile ? "📄 File" : "📁 Folder"}
              </span>
            </div>

            <div className="overview-card__title">{section.name}</div>

            {section.briefDescription && (
              <div className="overview-card__description">
                {section.briefDescription}
              </div>
            )}

            {section.path && (
              <div className="overview-card__path">{section.path}</div>
            )}

            {hasNestedMatch && (
              <div className="overview-card__hint">
                Match found in nested items
              </div>
            )}

            {!isFile && (
              <div className="overview-card__meta">
                {section.children?.length ?? 0} top items ·{" "}
                {countDescendants(section)} total entries
              </div>
            )}

            {childNames && childNames.length > 0 && (
              <div className="overview-card__children-preview">
                {childNames.map((name) => (
                  <span key={name} className="overview-card__child-tag">
                    {name}
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span className="overview-card__child-more">
                    +{hiddenCount} more
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
