import fs from "fs";
import path from "path";
import assert from "assert";
import { describe, it } from "node:test";
import { convertToHoelibuSyntax } from "./ascii-importer";

const cases = fs
  .readdirSync(path.join(__dirname, "ascii-cases"))
  .filter((f) => f.endsWith(".txt"))
  .map((f) => path.join(__dirname, "ascii-cases", f));

const ascii = describe("ascii-2-showdown", () => {
  cases.forEach((inPath) => {
    it("Case: " + inPath.replace(/^.*\//, ""), () => {
      const ascii = fs.readFileSync(inPath, "utf8");
      const actual = convertToHoelibuSyntax(ascii);
      const expectedMarkdown = fs.readFileSync(
        inPath.replace(/.txt$/, ".md"),
        "utf8",
      );

      assert.strictEqual(actual, expectedMarkdown);
    });
  });
});

export { ascii };
