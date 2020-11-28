"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blame = void 0;
const diff_1 = require("diff");
function blame(codes, passedOptions) {
    const result = [];
    const options = Object.assign({}, passedOptions);
    codes.reverse().forEach((compareWith, codeIndex) => {
        const base = codes[codeIndex - 1];
        const compareWithCode = typeof compareWith === 'string'
            ? compareWith
            : options.getCode(compareWith);
        // Diff code
        let diffResults = [];
        const diffOptions = {
            newlineIsToken: false,
        };
        if (base) {
            const baseCode = typeof base === 'string' ? base : options.getCode(base);
            diffResults = diff_1.diffLines(baseCode, compareWithCode, diffOptions);
        }
        else {
            diffResults = diff_1.diffLines('', compareWithCode, diffOptions);
        }
        // Walk through diff result and check which parts needs to be updated
        let lineIndex = 0;
        for (const diffResult of diffResults) {
            if (diffResult.added) {
                for (const line of diffResult.value.split('\n').slice(0, diffResult.count)) {
                    // Add line to result
                    result.splice(lineIndex, 0, {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        origin: typeof compareWith === 'string'
                            ? codes.length - codeIndex - 1
                            : options.getOrigin(compareWith),
                        value: line.trimRight(),
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
    });
    return result;
}
exports.blame = blame;
//# sourceMappingURL=blame.js.map