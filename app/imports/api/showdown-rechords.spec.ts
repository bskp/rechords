import fs from "fs";
import path from "path";
import assert from "assert";
import { parseRechordsDown } from "./parseRechordsDown";

const normalize = (html: string) => {
  html = html.replace(/\r/g, ""); // Normalize line returns

  // Ignore all leading/trailing whitespace
  html = html
    .split("\n")
    .map((x) => x.trim())
    .join("\n");

  html = html.trim(); // Remove extra lines

  // One bracketed statement per line for easier diffability
  html = html.replace(/([^\n])(<[^/])/g, "$1\n$2");

  // Convert whitespace to a visible character so that it shows up on error reports
  html = html.replace(/ /g, "·");
  html = html.replace(/\n/g, "•\n");

  return html;
};

const cases = fs
  .readdirSync(path.join(__dirname, "showdown-cases"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => path.join(__dirname, "showdown-cases", f));

const showdown = describe("showdown-rechords", () => {
  cases.forEach((mdPath) => {
    it("Case: " + mdPath.replace(/^.*\//, ""), () => {
      const markdown = fs.readFileSync(mdPath, "utf8");
      const actual = parseRechordsDown(markdown);
      const expected = fs.readFileSync(mdPath.replace(".md", ".html"), "utf8");

      assert.equal(normalize(actual), normalize(expected));
    });
  });
});

export { showdown };
