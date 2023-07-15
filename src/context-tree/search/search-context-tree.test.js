import { searchContextTree } from "./search-context-tree";

test("Leaves only matching sections", () => {
  const tree = {
    text: "file",
    sectionsWithMatches: [
      {
        text: "foo bar",
      },
      {
        text: "bar",
      },
    ],
  };

  expect(searchContextTree(tree, "foo")).toEqual({
    text: "file",
    sectionsWithMatches: [{ text: "foo bar" }],
  });
});

test("Leaves out parent sections and sibling branches when there is a match in the child", () => {
  const tree = {
    text: "file",
    sectionsWithMatches: [
      {
        text: "bar",
      },
    ],
    childHeadings: [
      {
        text: "h1",
        sectionsWithMatches: [
          {
            text: "bar",
          },
        ],
        childHeadings: [
          {
            text: "h1.1",
            sectionsWithMatches: [
              {
                text: "foo",
              },
            ],
          },
        ],
      },
      {
        text: "h2",
        sectionsWithMatches: [
          {
            text: "bar",
          },
        ],
      },
    ],
  };

  expect(searchContextTree(tree, "foo")).toEqual({
    text: "file",
    sectionsWithMatches: [],
    childHeadings: [
      {
        text: "h1",
        sectionsWithMatches: [],
        childHeadings: [
          {
            text: "h1.1",
            sectionsWithMatches: [
              {
                text: "foo",
              },
            ],
          },
        ],
      },
    ],
  });
});

test("Works the same way with lists", () => {
  const tree = {
    text: "file",
    sectionsWithMatches: [
      {
        text: "bar",
      },
    ],
    childLists: [
      {
        text: "h1",
        sectionsWithMatches: [
          {
            text: "bar",
          },
        ],
        childLists: [
          {
            text: "h1.1",
            sectionsWithMatches: [
              {
                text: "foo",
              },
            ],
          },
        ],
      },
      {
        text: "h2",
        sectionsWithMatches: [
          {
            text: "bar",
          },
        ],
      },
    ],
  };

  expect(searchContextTree(tree, "foo")).toEqual({
    text: "file",
    sectionsWithMatches: [],
    childLists: [
      {
        text: "h1",
        sectionsWithMatches: [],
        childLists: [
          {
            text: "h1.1",
            sectionsWithMatches: [
              {
                text: "foo",
              },
            ],
          },
        ],
      },
    ],
  });
});
