import { collapseEmptyNodes } from "./collapse-empty-nodes";

test("collapse empty nodes with 2 leaves", () => {
  expect(
    collapseEmptyNodes({
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
    })
  ).toMatchObject({
    branches: [
      {
        breadcrumbs: [
          { text: "empty 1", position: { start: { line: 1 } } },
          { text: "empty 1.1", position: { start: { line: 2 } } },
        ],
        text: "empty 1.1.1",
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
  });
});

test("collapse empty list items", () => {
  expect(
    collapseEmptyNodes({
      text: "file",
      sectionsWithMatches: [],
      branches: [
        {
          text: "empty 1",
          cacheItem: { position: { start: { line: 1 } } },
          branches: [
            {
              text: "empty 1.1",
              cacheItem: { position: { start: { line: 2 } } },
              branches: [
                {
                  text: "empty 1.1.1",
                  cacheItem: { position: { start: { line: 3 } } },
                  branches: [
                    {
                      text: "empty 1.1.1.1",
                      branches: [],
                    },
                    {
                      text: "empty 1.1.1.2",
                      branches: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  ).toMatchObject({
    branches: [
      {
        breadcrumbs: [{ text: "empty 1" }, { text: "empty 1.1" }],
        text: "empty 1.1.1",
      },
    ],
  });
});
