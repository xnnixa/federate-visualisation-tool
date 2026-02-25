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
  const [navigationStack, setNavigationStack] = useState<BBNode[]>([]);
  const [currentRoot, setCurrentRoot] = useState<BBNode | null>(null);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"overview" | "tree">("overview");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const meta: RepoMeta = useMemo(
    () => ({ owner: "", repo: "", branch: "main", baseUrl: "" }),
    []
  );

  const handleOverviewSelect = (node: BBNode) => {
    // Navigate into the node if it has children
    if (node.children && node.children.length > 0) {
      setNavigationStack((prev) => [...prev, currentRoot!]);
      setCurrentRoot(node);
      setSelected(node); // Keep the folder selected to show its details
    } else {
      // Just select the node if it has no children
      setSelected(node);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Go back to the root
      setCurrentRoot(graph?.root || null);
      setNavigationStack([]);
    } else {
      // Go back to a specific level
      const targetNode = navigationStack[index];
      setCurrentRoot(targetNode);
      setNavigationStack((prev) => prev.slice(0, index));
    }
    setSelected(undefined);
    setFilter("");
  };

  const handleViewInTree = (node: BBNode) => {
    setSelected(node);
    setView("tree");
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
        const builtGraph = buildGraphFromRoot(root);
        setGraph(builtGraph);
        setCurrentRoot(builtGraph.root);
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

  if (!graph || !currentRoot) {
    return <div className="state">No data available.</div>;
  }

  const renderBreadcrumbs = () => {
    return (
      <nav className="breadcrumbs">
        {navigationStack.length > 0 ? (
          <>
            <button
              type="button"
              className="breadcrumbs__item"
              onClick={() => handleBreadcrumbClick(-1)}
            >
              Root
            </button>
            {navigationStack.map((node, index) => (
              <span key={node.id}>
                <span className="breadcrumbs__separator">/</span>
                <button
                  type="button"
                  className="breadcrumbs__item"
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {node.name}
                </button>
              </span>
            ))}
            <span className="breadcrumbs__separator">/</span>
          </>
        ) : null}
        <span className="breadcrumbs__current">{currentRoot.name}</span>
      </nav>
    );
  };

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
              onClick={() => setView("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              className={`view-toggle__button ${view === "tree" ? "is-active" : ""}`}
              onClick={() => setView("tree")}
            >
              Tree
            </button>
          </div>
          <SearchBar value={filter} onChange={setFilter} />
        </div>
      </header>
      {graph.fallbackUsed && (
        <div className="banner">
          Using fallback sample data because GitHub API access was rate-limited. Set{" "}
          <code>VITE_GITHUB_TOKEN</code> to load the full repository tree.
        </div>
      )}
      {renderBreadcrumbs()}
      <main className="main">
        <section className="tree-panel">
          {view === "overview" ? (
            <>
              <h3 className="subtree-title">{currentRoot.name}</h3>
              <OverviewPanel
                root={currentRoot}
                onSelect={handleOverviewSelect}
                selectedId={selected?.id}
              />
            </>
          ) : (
            <TreeView
              root={currentRoot}
              filter={filter}
              onSelect={setSelected}
              selectedId={selected?.id}
              expandedIds={expandedIds}
            />
          )}
        </section>
        <aside className="detail-panel-wrapper">
          <DetailPanel node={selected} meta={meta} onViewInTree={handleViewInTree}/>
        </aside>
      </main>
    </div>
  );
};
