"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const blame_1 = require("./blame");
describe('calculate', function () {
    it('add', function () {
        const result = 2 + 5;
        chai_1.expect(result).equal(7);
    });
});
describe('blame-only', function () {
    it('add-only forw', function () {
        const result = blame_1.blame(snapshots, new blame_1.StringExtractor());
        console.log(JSON.stringify(result));
    });
});
const snapshots = [
    "Pferdi\nHans\nLadial\nFranz\nKalala",
    "Pferdi\nHans\nFranz\n",
    "Pferdi\nFranz",
    "Franz\n",
];
//# sourceMappingURL=blame-diff.spec.js.map