import { describe, expect, it } from "vitest";
import {
  collectExpandedIdsForFilter,
  filterTreeBySearch,
  getOverviewSections,
  hasDescendantOnlySearchMatch,
  nodeMatchesSearch,
} from "../src/lib/search";
import type { BBNode } from "../src/types/bb";

const createNode = (
  overrides: Partial<BBNode> & Pick<BBNode, "id" | "name" | "path" | "type">,
): BBNode => ({
  children: [],
  ...overrides,
});

const root = createNode({
  id: "root",
  name: "FEDERATE",
  path: "",
  type: "tree",
  children: [
    createNode({
      id: "root/platform",
      name: "Platform",
      path: "Platform",
      type: "tree",
      children: [
        createNode({
          id: "root/platform/alpha",
          name: "Alpha",
          path: "Platform/Alpha",
          type: "tree",
          children: [
            createNode({
              id: "root/platform/alpha/ml",
              name: "Model-Development-and-Training",
              path: "Platform/Alpha/Model-Development-and-Training",
              type: "tree",
            }),
          ],
        }),
      ],
    }),
    createNode({
      id: "root/ops",
      name: "Operations",
      path: "Operations",
      type: "tree",
      children: [
        createNode({
          id: "root/ops/logs",
          name: "Logs",
          path: "Operations/Logs",
          type: "blob",
        }),
      ],
    }),
    createNode({
      id: "root/.hidden",
      name: ".hidden",
      path: ".hidden",
      type: "tree",
      children: [
        createNode({
          id: "root/.hidden/secret",
          name: "Secret Match",
          path: ".hidden/Secret Match",
          type: "blob",
        }),
      ],
    }),
  ],
});

describe("shared search helpers", () => {
  it("matches node names case-insensitively", () => {
    const platformNode = root.children?.[0];

    expect(platformNode).toBeDefined();
    expect(nodeMatchesSearch(platformNode!, "platform")).toBe(true);
    expect(nodeMatchesSearch(platformNode!, "PLATFORM")).toBe(true);
    expect(nodeMatchesSearch(platformNode!, "missing")).toBe(false);
  });

  it("keeps ancestor branches in tree results when a descendant matches", () => {
    const filtered = filterTreeBySearch(root, "training");

    expect(filtered).not.toBeNull();
    expect(filtered?.children).toHaveLength(1);
    expect(filtered?.children?.[0].name).toBe("Platform");
    expect(filtered?.children?.[0].children).toHaveLength(1);
    expect(filtered?.children?.[0].children?.[0].name).toBe("Alpha");
    expect(filtered?.children?.[0].children?.[0].children).toHaveLength(1);
    expect(filtered?.children?.[0].children?.[0].children?.[0].name).toBe(
      "Model-Development-and-Training",
    );
  });

  it("returns overview sections when either the section or a descendant matches", () => {
    expect(
      getOverviewSections(root, "training").map((node) => node.name),
    ).toEqual(["Platform"]);

    expect(getOverviewSections(root, "logs").map((node) => node.name)).toEqual([
      "Operations",
    ]);
  });

  it("marks overview sections that match only through descendants", () => {
    const platformNode = root.children?.[0];
    const operationsNode = root.children?.[1];

    expect(platformNode).toBeDefined();
    expect(operationsNode).toBeDefined();

    expect(hasDescendantOnlySearchMatch(platformNode!, "training")).toBe(true);
    expect(hasDescendantOnlySearchMatch(platformNode!, "platform")).toBe(false);
    expect(hasDescendantOnlySearchMatch(operationsNode!, "logs")).toBe(true);
    expect(hasDescendantOnlySearchMatch(operationsNode!, "operations")).toBe(
      false,
    );
    expect(hasDescendantOnlySearchMatch(platformNode!, "")).toBe(false);
  });

  it("keeps hidden overview sections excluded even if descendants match", () => {
    expect(getOverviewSections(root, "secret")).toEqual([]);
  });

  it("expands ancestor ids for matching descendants using shared semantics", () => {
    const expandedIds = collectExpandedIdsForFilter(root, "training");

    expect(Array.from(expandedIds)).toEqual([
      "root",
      "root/platform",
      "root/platform/alpha",
    ]);
  });
});
