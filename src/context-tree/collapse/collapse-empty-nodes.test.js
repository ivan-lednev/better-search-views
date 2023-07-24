import { collapseEmptyNodes } from "./collapse-empty-nodes";
import { cloneDeep } from "lodash";

test("collapse empty nodes with 2 leaves, don't mutate original", () => {
  const input = {
    text: "file",
    sectionsWithMatches: [],
    branches: [
      {
        text: "empty 1",
        sectionsWithMatches: [],
        cacheItem: { position: { start: { line: 1 } } },
        branches: [
          {
            text: "empty 1.1",
            sectionsWithMatches: [],
            cacheItem: { position: { start: { line: 2 } } },
            branches: [
              {
                text: "empty 1.1.1",
                sectionsWithMatches: [],
                cacheItem: { position: { start: { line: 3 } } },
                branches: [
                  {
                    text: "empty 1.1.1.1",
                    sectionsWithMatches: [],
                    branches: [],
                  },
                  {
                    text: "empty 1.1.1.2",
                    sectionsWithMatches: [],
                    branches: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const clone = cloneDeep(input);

  const collapsed = collapseEmptyNodes(input);

  expect(collapsed).toMatchObject({
    breadcrumbs: [
      { text: "empty 1", position: { start: { line: 1 } } },
      { text: "empty 1.1", position: { start: { line: 2 } } },
      { text: "empty 1.1.1", position: { start: { line: 3 } } },
    ],
    branches: [
      {
        text: "empty 1.1.1.1",
        sectionsWithMatches: [],
        branches: [],
      },
      {
        text: "empty 1.1.1.2",
        sectionsWithMatches: [],
        branches: [],
      },
    ],
  });

  expect(input).toEqual(clone);
});
