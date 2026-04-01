import type { BBNode } from "../types/bb";
import {
  formatOverviewName,
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
        const overviewName = formatOverviewName(section.fullName);
        const isSelected = selectedId === section.id;
        const isFile = section.type === "blob";
        const hasNestedMatch = hasDescendantOnlySearchMatch(section, filter);

        return (
          <button
            key={section.id}
            type="button"
            className={`overview-card ${isSelected ? "is-selected" : ""} ${isFile ? "is-file" : "is-folder"}`}
            onClick={() => onSelect(section)}
          >
            <div className="overview-card__header">
              <span
                className={`overview-card__type-badge ${isFile ? "type-file" : "type-folder"}`}
              >
                {isFile ? "File" : "Folder"}
              </span>
            </div>
            <div className="overview-card__title">{section.name}</div>

            {overviewName && (
              <div className="overview-card__subtitle">{overviewName}</div>
            )}

            {hasNestedMatch && (
              <div className="overview-card__hint">
                Match found in nested items
              </div>
            )}

            {!isFile && (
              <div className="overview-card__meta">
                {section.children?.length ?? 0} items ·{" "}
                {countDescendants(section)} total
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
