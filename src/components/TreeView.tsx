import { useEffect, useMemo, useRef, useState } from "react";
import type { BBNode } from "../types/bb";

interface TreeViewProps {
  root: BBNode;
  onSelect: (node: BBNode) => void;
  filter: string;
  selectedId?: string;
  expandedIds?: Set<string>;
}

const matchesFilter = (node: BBNode, filter: string): boolean => {
  if (!filter) {
    return true;
  }
  return node.name.toLowerCase().includes(filter.toLowerCase());
};

const filterTree = (node: BBNode, filter: string): BBNode | null => {
  if (!filter) {
    return node;
  }
  const children = node.children
    ?.map((child) => filterTree(child, filter))
    .filter((child): child is BBNode => Boolean(child));

  if (matchesFilter(node, filter) || (children && children.length > 0)) {
    return { ...node, children };
  }
  return null;
};

const NodeRow = ({
  node,
  depth,
  onSelect,
  selectedId,
  expandedIds,
}: {
  node: BBNode;
  depth: number;
  onSelect: (node: BBNode) => void;
  selectedId?: string;
  expandedIds?: Set<string>;
}) => {
  const [expanded, setExpanded] = useState(depth < 1 || expandedIds?.has(node.id));
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = selectedId === node.id;

  useEffect(() => {
    if (expandedIds?.has(node.id) || selectedId === node.id) {
      // TODO FIX THIS: KAN-42
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(true);
    }
  }, [expandedIds, node.id, selectedId]);

  return (
    <div className="tree-node">
      <button
        type="button"
        className={`tree-node__row ${isSelected ? "is-selected" : ""}`}
        onClick={() => onSelect(node)}
        style={{ paddingLeft: `${depth * 16}px` }}
        data-node-id={node.id}
      >
        {hasChildren ? (
          <button
            className="tree-node__toggle"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="tree-node__toggle" />
        )}
        <span className={node.type === "tree" ? "tree-node__folder" : "tree-node__file"}>
          {node.name}
        </span>
      </button>
      {expanded &&
        node.children?.map((child) => (
          <NodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
            expandedIds={expandedIds}
          />
        ))}
    </div>
  );
};

export const TreeView = ({ root, onSelect, filter, selectedId, expandedIds }: TreeViewProps) => {
  const filtered = useMemo(() => filterTree(root, filter), [root, filter]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedId || !containerRef.current) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const target = containerRef.current?.querySelector(
        `[data-node-id="${CSS.escape(selectedId)}"]`
      );
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, filtered]);

  if (!filtered) {
    return <div className="tree-empty">No matching nodes.</div>;
  }

  return (
    <div className="tree-view" ref={containerRef}>
      {filtered.children?.map((child) => (
        <NodeRow
          key={child.id}
          node={child}
          depth={0}
          onSelect={onSelect}
          selectedId={selectedId}
          expandedIds={expandedIds}
        />
      ))}
    </div>
  );
};
