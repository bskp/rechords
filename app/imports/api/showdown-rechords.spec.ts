import showdown from "showdown";
import { showdownRechords } from "./showdown-rechords";
import fs from "fs";
import path from "path";
import assert from "assert";
import { FilterXSS } from "xss";
import { options } from "./xss-filter-options";

const converter = new showdown.Converter({ extensions: [showdownRechords] });

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

describe("showdown-rechords", () => {
  cases.forEach((mdPath) => {
    it("Case: " + mdPath.replace(/^.*\//, ""), () => {
      const _actual = converter.makeHtml(fs.readFileSync(mdPath, "utf8"));
      const filter = new FilterXSS(options);
      const actual = filter.process(_actual);
      const expected = fs.readFileSync(mdPath.replace(".md", ".html"), "utf8");

      assert.equal(normalize(actual), normalize(expected));
    });
  });
});
