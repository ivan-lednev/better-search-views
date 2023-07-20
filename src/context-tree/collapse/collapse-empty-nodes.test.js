import { collapseEmptyNodes } from "./collapse-empty-nodes";

test("collapse empty nodes with 2 leaves", () => {
  expect(
    collapseEmptyNodes({
      text: "file",
      sectionsWithMatches: [],
      childLists: [],
      childHeadings: [
        {
          text: "empty 1",
          sectionsWithMatches: [],
          childLists: [],
          headingCache: { position: { start: { line: 1 } } },
          childHeadings: [
            {
              text: "empty 1.1",
              sectionsWithMatches: [],
              childLists: [],
              headingCache: { position: { start: { line: 2 } } },
              childHeadings: [
                {
                  text: "empty 1.1.1",
                  sectionsWithMatches: [],
                  childLists: [],
                  headingCache: { position: { start: { line: 3 } } },
                  childHeadings: [
                    {
                      text: "empty 1.1.1.1",
                      sectionsWithMatches: [],
                      childLists: [],
                      childHeadings: [],
                    },
                    {
                      text: "empty 1.1.1.2",
                      sectionsWithMatches: [],
                      childLists: [],
                      childHeadings: [],
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
    childHeadings: [
      {
        breadcrumbs: [
          { text: "empty 1", position: { start: { line: 1 } } },
          { text: "empty 1.1", position: { start: { line: 2 } } },
        ],
        text: "empty 1.1.1",
        childHeadings: [
          {
            text: "empty 1.1.1.1",
            sectionsWithMatches: [],
            childLists: [],
            childHeadings: [],
          },
          {
            text: "empty 1.1.1.2",
            sectionsWithMatches: [],
            childLists: [],
            childHeadings: [],
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
      childHeadings: [],
      childLists: [
        {
          text: "empty 1",
          listItemCache: { position: { start: { line: 1 } } },
          childLists: [
            {
              text: "empty 1.1",
              listItemCache: { position: { start: { line: 2 } } },
              childLists: [
                {
                  text: "empty 1.1.1",
                  listItemCache: { position: { start: { line: 3 } } },
                  childLists: [
                    {
                      text: "empty 1.1.1.1",
                    },
                    {
                      text: "empty 1.1.1.2",
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
    childLists: [
      {
        breadcrumbs: [{ text: "empty 1" }, { text: "empty 1.1" }],
        text: "empty 1.1.1",
      },
    ],
  });
});
