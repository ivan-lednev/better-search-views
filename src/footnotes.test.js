import {
  expandFootnoteSyntax,
  getFirstReferencePosition,
  getFootnoteDefinitionId,
} from "./footnotes";

const sectionOf = (contents, text) => {
  const start = contents.indexOf(text);
  return { position: { start: { offset: start }, end: { offset: start + text.length } } };
};

test("detects a footnote definition", () => {
  const contents = "body [^4] here\n\n[^4]: the note body";
  expect(getFootnoteDefinitionId(contents, sectionOf(contents, "[^4]: the note body"))).toBe("4");
  expect(getFootnoteDefinitionId(contents, sectionOf(contents, "body [^4] here"))).toBe(null);
});

test("finds the reference, not the definition", () => {
  const contents = "body [^4] here\n\n[^4]: the note body";
  expect(getFirstReferencePosition(contents, "4").start.offset).toBe(5);
});

test("handles named footnotes and regex-unsafe ids", () => {
  const contents = "a [^my-note(1)] b\n\n[^my-note(1)]: text";
  expect(getFootnoteDefinitionId(contents, sectionOf(contents, "[^my-note(1)]: text"))).toBe("my-note(1)");
  expect(getFirstReferencePosition(contents, "my-note(1)").start.offset).toBe(2);
});

test("expands a definition into renderable markdown", () => {
  const out = expandFootnoteSyntax("[^4]: ובהכי אתי שפיר");
  expect(out).toContain("ובהכי אתי שפיר");
  expect(out).not.toContain("[^4]:");
  expect(out).toContain('data-footnote-id="4"');
});

test("dedents continuation lines of a definition", () => {
  const out = expandFootnoteSyntax("[^4]: first\n    second line");
  expect(out).toContain("\nsecond line");
});

test("marks up references in body text", () => {
  const out = expandFootnoteSyntax("מלאכת השדה[^4], ובעבודות");
  expect(out).toContain("better-search-views-footnote-reference");
  expect(out).toContain("מלאכת השדה");
});

test("leaves code spans and fences alone", () => {
  expect(expandFootnoteSyntax("use `arr[^4]` here")).toBe("use `arr[^4]` here");
  expect(expandFootnoteSyntax("```\n[^4]: x\n```")).toBe("```\n[^4]: x\n```");
});

test("leaves wiki links and normal brackets alone", () => {
  const input = "see [[note|alias]] and [text](url)";
  expect(expandFootnoteSyntax(input)).toBe(input);
});
