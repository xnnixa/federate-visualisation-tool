import { useEffect, useMemo, useState } from "react";
import { DetailPanel } from "../components/DetailPanel";
import { OverviewPanel } from "../components/OverviewPanel";
import { SearchBar } from "../components/SearchBar";
import { TreeView } from "../components/TreeView";
import type { BBGraph, BBNode, RepoMeta } from "../types/bb";
import {
  fetchBBTags,
  getBuildingBlocks,
  type BuildingBlockNode,
} from "../lib/parser";

const toRepoEntryType = (type: BuildingBlockNode["type"]): BBNode["type"] =>
  type === "file" ? "blob" : "tree";

const normalizePath = (path: string): string => path.replace(/\\/g, "/");


const toBBNode = (
  node: BuildingBlockNode,
  bbTagFullNames: Record<string, string>
): BBNode => {
  const normalizedPath = normalizePath(node.path);
  return {
    id: normalizedPath || node.name,
    name: node.name,
    fullName: bbTagFullNames[node.name],
    path: normalizedPath,
    type: toRepoEntryType(node.type),
    children: node.children?.map((child) => toBBNode(child, bbTagFullNames)),
  };
};

const buildGraphFromRoot = (root: BBNode): BBGraph => {
  const nodes: BBNode[] = [];
  const edges: BBGraph["edges"] = [];
  const visit = (node: BBNode) => {
    nodes.push(node);
    node.children?.forEach((child) => {
      edges.push({ from: node.id, to: child.id });
      visit(child);
    });
  };
  visit(root);
  return { nodes, edges, root, fallbackUsed: false };
};

export const HomePage = () => {
  const [graph, setGraph] = useState<BBGraph | null>(null);
  const [selected, setSelected] = useState<BBNode | undefined>();
  const [selectedChild, setSelectedChild] = useState<BBNode | undefined>();
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"overview" | "tree">("overview");
  const [pendingTreeJump, setPendingTreeJump] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const meta: RepoMeta = useMemo(
    () => ({ owner: "", repo: "", branch: "main", baseUrl: "" }),
    []
  );
  const handleOverviewSelect = (node: BBNode) => {
    setSelected(node);
    setSelectedChild(undefined); // Reset child selection when parent changes
    setPendingTreeJump(true);
  };

  const handleSubtreeSelect = (node: BBNode) => {
    console.log("Selected child node from subtree:", node);
    setSelectedChild(node);
  };
  const handleEnterTree = () => {
    setView("tree");
    setPendingTreeJump(false);
    setFilter("");
  };
  const expandedIds = useMemo(() => {
    if (!selected?.path) {
      return new Set<string>();
    }
    const parts = selected.path.split("/");
    const ids = parts.map((_, index) => parts.slice(0, index + 1).join("/"));
    return new Set(ids);
  }, [selected?.path]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const localRoot = getBuildingBlocks();
        let bbTagFullNames: Record<string, string> = {};

        try {
          bbTagFullNames = await fetchBBTags();
        } catch {
          bbTagFullNames = {};
        }

        const root = toBBNode(localRoot, bbTagFullNames);
        setGraph(buildGraphFromRoot(root));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return <div className="state">Loading Building Blocks...</div>;
  }

  if (error) {
    return <div className="state state--error">Failed to load data. {error}</div>;
  }

  if (!graph) {
    return <div className="state">No data available.</div>;
  }

  const mainBlockView = () => {
    return (
        <>
          <section className="tree-panel">
            {view === "overview" ? (
                <><h3 className="subtree-title">Main Blocks</h3>
                  <OverviewPanel root={graph.root} onSelect={handleOverviewSelect} selectedId={selected?.id}/>
                </>
            ) : (
                <TreeView
                    root={graph.root}
                    filter={filter}
                    onSelect={setSelected}
                    selectedId={selected?.id}
                    expandedIds={expandedIds}/>
            )}
          </section>
          <aside className="detail-panel-wrapper">
            <DetailPanel node={selected} meta={meta}/>
          </aside>
        </>
    )
  }

  const subBlockView = () => {
    if (view === "overview") {
    return (
        <>
        <section className="tree-panel">
          {selected?.children && selected.children.length > 0 ? (
              <div className="subtree-content">
                <h3 className="subtree-title">Children of {selected.name}</h3>
                    <OverviewPanel root={selected} onSelect={handleSubtreeSelect} selectedId={selectedChild?.id} />
              </div>
          ) : (
              <div className="subtree-empty">
                {selected
                    ? "No children available for this item."
                    : "Select an item to view its children."}
              </div>
          )}
        </section>
          <aside className="detail-panel-wrapper">
            <DetailPanel node={selectedChild} meta={meta}/>
          </aside>
        </>
    )
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>FEDERATE Building Block Explorer</h1>
          <p>Clickable overview of the FEDERATE Building Block landscape.</p>
        </div>
        <div className="header__actions">
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`view-toggle__button ${view === "overview" ? "is-active" : ""}`}
              onClick={() => {
                setView("overview");
                setPendingTreeJump(false);
              }}
            >
              Overview
            </button>
            <button
              type="button"
              className={`view-toggle__button ${view === "tree" ? "is-active" : ""}`}
              onClick={() => {
                setView("tree");
                setPendingTreeJump(false);
              }}
            >
              Tree
            </button>
          </div>
          {view === "overview" && pendingTreeJump && (
            <button type="button" className="view-toggle__button is-active" onClick={handleEnterTree}>
              Enter Tree
            </button>
          )}
          <SearchBar value={filter} onChange={setFilter} />
        </div>
      </header>
      {graph.fallbackUsed && (
        <div className="banner">
          Using fallback sample data because GitHub API access was rate-limited. Set{" "}
          <code>VITE_GITHUB_TOKEN</code> to load the full repository tree.
        </div>
      )}
      <main className="main">
        {mainBlockView()}
        {subBlockView()}
      </main>
    </div>
  );
};
