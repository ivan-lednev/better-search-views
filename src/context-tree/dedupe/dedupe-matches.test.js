import { dedupeMatches } from "./dedupe-matches";

test("Removes neighboring identical matches without mutating the tree", () => {
  const input = {
    sectionsWithMatches: [
      {
        text: "foo",
        cache: {
          position: {
            start: {
              offset: 0,
            },
            end: {
              offset: 1,
            },
          },
        },
      },
      {
        text: "foo",
        cache: {
          position: {
            start: {
              offset: 0,
            },
            end: {
              offset: 1,
            },
          },
        },
      },
    ],
    branches: [
      {
        branches: [],
        sectionsWithMatches: [
          {
            text: "foo",
            cache: {
              position: {
                start: {
                  offset: 0,
                },
                end: {
                  offset: 1,
                },
              },
            },
          },
          {
            text: "foo",
            cache: {
              position: {
                start: {
                  offset: 0,
                },
                end: {
                  offset: 1,
                },
              },
            },
          },
        ],
      },
    ],
  };

  const deduped = dedupeMatches(input);

  expect(deduped.sectionsWithMatches).toHaveLength(1);
  expect(deduped.branches[0].sectionsWithMatches).toHaveLength(1);

  expect(input.sectionsWithMatches).toHaveLength(2);
  expect(input.branches[0].sectionsWithMatches).toHaveLength(2);
});
