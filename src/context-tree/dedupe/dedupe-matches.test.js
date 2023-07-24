import { dedupeMatches } from "./dedupe-matches";
import { cloneDeep } from "lodash";

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

  const clone = cloneDeep(input);

  const deduped = dedupeMatches(input);

  expect(deduped.sectionsWithMatches).toHaveLength(1);
  expect(deduped.branches[0].sectionsWithMatches).toHaveLength(1);

  expect(input).toEqual(clone);
});
