import { expect } from "chai";
import { blame, StringExtractor } from "./blame";

describe('calculate', function () {
    it('add', function () {
        const result = 2 + 5;
        expect(result).equal(7);
    });
});

describe('blame-only', function () {
    it('add-only forw', function () {
        const result = blame(snapshots, new StringExtractor())
        console.log(JSON.stringify(result))

    });
});

const snapshots = [
    "Pferdi\nHans\nLadial\nFranz\nKalala",
    "Pferdi\nHans\nFranz\n",
    "Pferdi\nFranz",
    "Franz\n",
]