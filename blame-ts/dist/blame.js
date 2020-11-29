"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blame = exports.StringExtractor = void 0;
const diff_1 = require("diff");
class StringExtractor {
    getCode(a) {
        return a;
    }
    getOrigin(a, idx) {
        return idx;
    }
}
exports.StringExtractor = StringExtractor;
/**
 *
 * @param snapshots idx=0 => most recent snapshot (what is seen in the editor), idx=length-1 => oldest snapshot
 * @param extractor
 */
function blame(snapshots, extractor) {
    const result = [];
    let result_ = [];
    const getString = extractor.getCode;
    const getOrigin = extractor.getOrigin; // idx will be ignored
    snapshots.reverse();
    for (const [codeIndex, snapshot] of snapshots.entries()) { //(compareWith: T, codeIndex: number) => {
        const baseCode = codeIndex > 0 ? getString(snapshots[codeIndex - 1]) : '';
        const previousOrigin = codeIndex > 0 ? getOrigin(snapshots[codeIndex - 1], snapshots.length - codeIndex) : undefined;
        const newerCode = getString(snapshot);
        const diffResults = diff_1.diffLines(baseCode, newerCode, diffOptions);
        console.log(diffResults);
        // Walk through diff result and check which parts needs to be updated
        let lineIndex = 0;
        for (const [didx, diffResult] of diffResults.entries()) {
            if (diffResult.added) {
                const lines = diffResult.value.split('\n');
                for (const [lidx, line] of lines.slice(0, diffResult.count).entries()) {
                    // Add line to result
                    result.splice(lineIndex, 0, {
                        origin: getOrigin(snapshot, snapshots.length - codeIndex - 1),
                        value: line.trimRight(),
                        diffentry: didx,
                        lineindiff: lineIndex,
                        previousOrigin,
                        diff: diffResults
                    });
                    lineIndex += 1;
                }
            }
            else if (diffResult.removed) {
                // Remove lines from result
                result.splice(lineIndex, diffResult.count);
            }
            else {
                // Nothing to do as the code is already part of the result
                lineIndex += diffResult.count || 0;
            }
        }
        if (codeIndex < snapshots.length - 1) {
            result_ = result.slice();
        }
    }
    return result;
}
exports.blame = blame;
const diffOptions = {
    newlineIsToken: false,
};
//# sourceMappingURL=blame.js.map