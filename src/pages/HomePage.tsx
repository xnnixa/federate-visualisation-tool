import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const normalizePath = (path: string): string => path.replaceAll("\\", "/");

const toBBNode = (
  node: BuildingBlockNode,
  bbTagFullNames: Record<string, string>,
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

const getPathSegments = (pathname: string): string[] => {
  if (pathname === "/" || pathname === "") {
    return [];
  }
  return pathname.split("/").filter(Boolean).map(decodeURIComponent);
};

const collectExpandedIdsForFilter = (
  node: BBNode,
  filter: string,
): Set<string> => {
  const normalizedFilter = filter.trim().toLowerCase();

  if (!normalizedFilter) {
    return new Set<string>();
  }

  const expanded = new Set<string>();

  const visit = (current: BBNode, ancestors: string[]) => {
    const selfMatches = current.name.toLowerCase().includes(normalizedFilter);

    if (selfMatches) {
      ancestors.forEach((ancestorId) => expanded.add(ancestorId));
    }

    current.children?.forEach((child) => {
      visit(child, [...ancestors, current.id]);
    });
  };

  visit(node, []);
  return expanded;
};

export const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [graph, setGraph] = useState<BBGraph | null>(null);
  const [selected, setSelected] = useState<BBNode | undefined>();
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<"overview" | "tree">("overview");
  const [theme, setTheme] = useState<"light" | "dark">("light"); // dark mode: store current theme state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const meta: RepoMeta = useMemo(
    () => ({ owner: "", repo: "", branch: "main", baseUrl: "" }),
    [],
  );

  const pathSegments = useMemo(
    () => getPathSegments(location.pathname),
    [location.pathname],
  );

  const { currentRoot, navigationStack } = useMemo(() => {
    if (!graph) {
      return { currentRoot: null, navigationStack: [] };
    }

    const stack: BBNode[] = [];
    let current = graph.root;

    for (const segment of pathSegments) {
      if (current.children) {
        const found = current.children.find((child) => child.name === segment);
        if (found) {
          stack.push(current);
          current = found;
        } else {
          return { currentRoot: graph.root, navigationStack: [] };
        }
      } else {
        return { currentRoot: current, navigationStack: stack };
      }
    }

    return { currentRoot: current, navigationStack: stack };
  }, [graph, pathSegments]);

  const handleOverviewSelect = (node: BBNode) => {
    if (node.children && node.children.length > 0) {
      const newPath = [...pathSegments, node.name]
        .map(encodeURIComponent)
        .join("/");
      navigate(`/${newPath}`);
      setSelected(node);
    } else {
      setSelected(node);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      navigate("/");
    } else {
      const newPath = pathSegments
        .slice(0, index + 1)
        .map(encodeURIComponent)
        .join("/");
      navigate(`/${newPath}`);
    }

    setSelected(undefined);
    setFilter("");
  };

  const handleViewInTree = (node: BBNode) => {
    setSelected(node);
    setView("tree");
    setFilter("");
  };

  const selectedExpandedIds = useMemo(() => {
    if (!selected?.path) {
      return new Set<string>();
    }

    const parts = selected.path.split("/");
    const ids = parts.map((_, index) => parts.slice(0, index + 1).join("/"));
    return new Set(ids);
  }, [selected?.path]);

  const filterExpandedIds = useMemo(() => {
    if (!currentRoot) {
      return new Set<string>();
    }

    return collectExpandedIdsForFilter(currentRoot, filter);
  }, [currentRoot, filter]);

  const expandedIds = useMemo(() => {
    return new Set([...selectedExpandedIds, ...filterExpandedIds]);
  }, [selectedExpandedIds, filterExpandedIds]);

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
    return (
      <div className="state state--error">Failed to load data. {error}</div>
    );
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
                  onClick={() => handleBreadcrumbClick(index - 1)}
                >
                  {node.name}
                </button>
              </span>
            ))}
          </>
        ) : null}
        {navigationStack.length > 0 && (
          <span className="breadcrumbs__separator">/</span>
        )}
        <span className="breadcrumbs__current">{currentRoot.name}</span>
      </nav>
    );
  };

  return (
    <div className={`layout ${theme === "dark" ? "theme-dark" : ""}`}>
      {" "}
      {/* dark mode: add theme-dark class to root layout when dark mode is active */}
      <header className="header">
        <div>
          <h1>FEDERATE Building Block Explorer</h1>
          <p>Clickable overview of the FEDERATE Building Block landscape.</p>
        </div>
        <div className="header__actions">
          <div className="view-toggle" aria-label="View mode">
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

          <button
            type="button"
            className="theme-toggle" // dark mode: add a dedicated class for styling the toggle button
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            } // dark mode: switch between light and dark theme
            aria-label={
              theme === "light" ? "Enable dark mode" : "Enable light mode"
            } // dark mode: accessible label that changes based on current theme
          >
            {theme === "light" ? " Dark" : " Light"}{" "}
            {/* dark mode: button text/icon changes with current theme */}
          </button>

          <SearchBar value={filter} onChange={setFilter} />
        </div>
      </header>
      {graph.fallbackUsed && (
        <div className="banner">
          Using fallback sample data because GitHub API access was rate-limited.
          Set <code>VITE_GITHUB_TOKEN</code> to load the full repository tree.
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
                filter={filter}
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
          <DetailPanel
            node={selected}
            meta={meta}
            onViewInTree={handleViewInTree}
          />
        </aside>
      </main>
    </div>
  );
};
