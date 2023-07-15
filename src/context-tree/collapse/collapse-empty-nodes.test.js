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
          childHeadings: [
            {
              text: "empty 1.1",
              sectionsWithMatches: [],
              childLists: [],
              childHeadings: [
                {
                  text: "empty 1.1.1",
                  sectionsWithMatches: [],
                  childLists: [],
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
        breadcrumbs: ["empty 1", "empty 1.1"],
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
          childLists: [
            {
              text: "empty 1.1",
              childLists: [
                {
                  text: "empty 1.1.1",
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
        breadcrumbs: ["empty 1", "empty 1.1"],
        text: "empty 1.1.1"
      },
    ],
  });
});

test.todo("mixed");
