import type { BBNode } from "../types/bb";

interface OverviewPanelProps {
  root: BBNode;
  onSelect: (node: BBNode) => void;
}

const countDescendants = (node: BBNode): number => {
  if (!node.children || node.children.length === 0) {
    return 0;
  }
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
};

export const OverviewPanel = ({ root, onSelect }: OverviewPanelProps) => {
  const sections = (root.children ?? [])
    .filter((section) => section.type === "tree")
    .filter((section) => !section.name.startsWith("."));
  const formatOverviewName = (fullName?: string) => {
    if (!fullName) {
      return undefined;
    }
    return fullName.replace(/\s*\(.*\)\s*$/, "").trim();
  };

  if (sections.length === 0) {
    return <div className="overview-empty">No sections available.</div>;
  }

  return (
    <div className="overview-grid">
      {sections.map((section) => {
        const overviewName = formatOverviewName(section.fullName);
        return (
          <button
            key={section.id}
            type="button"
            className="overview-card"
            onClick={() => onSelect(section)}
          >
            <div className="overview-card__title">{section.name}</div>
            {overviewName && <div className="overview-card__subtitle">{overviewName}</div>}
            <div className="overview-card__meta">
              {section.children?.length ?? 0} top items · {countDescendants(section)} total entries
            </div>
          </button>
        );
      })}
    </div>
  );
};
