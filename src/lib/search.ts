import type { BBNode } from "../types/bb";

const isOverviewSection = (node: BBNode): boolean => {
  return (
    (node.type === "tree" || node.type === "blob") && !node.name.startsWith(".")
  );
};

export const normalizeSearchTerm = (value: string): string => {
  return value.trim().toLowerCase();
};

const getSearchableTerms = (node: BBNode): string[] => {
  return [node.name]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
};

const nodeMatchesNormalizedSearch = (
  node: BBNode,
  normalizedFilter: string,
): boolean => {
  if (!normalizedFilter) {
    return true;
  }

  return getSearchableTerms(node).some((term) =>
    term.includes(normalizedFilter),
  );
};

const filterTreeByNormalizedSearch = (
  node: BBNode,
  normalizedFilter: string,
): BBNode | null => {
  if (!normalizedFilter) {
    return node;
  }

  const children = node.children
    ?.map((child) => filterTreeByNormalizedSearch(child, normalizedFilter))
    .filter((child): child is BBNode => Boolean(child));

  if (
    nodeMatchesNormalizedSearch(node, normalizedFilter) ||
    (children?.length ?? 0) > 0
  ) {
    return { ...node, children };
  }

  return null;
};

export const nodeMatchesSearch = (node: BBNode, filter: string): boolean => {
  return nodeMatchesNormalizedSearch(node, normalizeSearchTerm(filter));
};

export const filterTreeBySearch = (
  node: BBNode,
  filter: string,
): BBNode | null => {
  return filterTreeByNormalizedSearch(node, normalizeSearchTerm(filter));
};

export const getOverviewSections = (root: BBNode, filter: string): BBNode[] => {
  const normalizedFilter = normalizeSearchTerm(filter);

  return (root.children ?? []).filter(isOverviewSection).filter((section) => {
    if (!normalizedFilter) {
      return true;
    }

    return Boolean(filterTreeByNormalizedSearch(section, normalizedFilter));
  });
};

export const hasDescendantOnlySearchMatch = (
  node: BBNode,
  filter: string,
): boolean => {
  const normalizedFilter = normalizeSearchTerm(filter);

  if (
    !normalizedFilter ||
    nodeMatchesNormalizedSearch(node, normalizedFilter)
  ) {
    return false;
  }

  return Boolean(
    node.children?.some((child) =>
      Boolean(filterTreeByNormalizedSearch(child, normalizedFilter)),
    ),
  );
};

export const collectExpandedIdsForFilter = (
  node: BBNode,
  filter: string,
): Set<string> => {
  const normalizedFilter = normalizeSearchTerm(filter);

  if (!normalizedFilter) {
    return new Set<string>();
  }

  const expanded = new Set<string>();

  const visit = (current: BBNode, ancestors: string[]) => {
    if (nodeMatchesNormalizedSearch(current, normalizedFilter)) {
      ancestors.forEach((ancestorId) => expanded.add(ancestorId));
    }

    current.children?.forEach((child) => {
      visit(child, [...ancestors, current.id]);
    });
  };

  visit(node, []);
  return expanded;
};
