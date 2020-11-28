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
        diffResults.forEach((diffResult) => {
            if (diffResult.added) {
                diffResult.value
                    .split('\n')
                    .slice(0, diffResult.count)
                    .forEach((line) => {
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
                });
            }
            else if (diffResult.removed) {
                // Remove lines from result
                result.splice(lineIndex, diffResult.count);
            }
            else {
                // Nothing to do as the code is already part of the result
                lineIndex += diffResult.count || 0;
            }
        });
    });
    return result;
}
exports.blame = blame;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYmxhbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQXdDO0FBWXhDLFNBQWdCLEtBQUssQ0FDbkIsS0FBZSxFQUNmLGFBQTZCO0lBRzdCLE1BQU0sTUFBTSxHQUF5QixFQUFFLENBQUE7SUFDdkMsTUFBTSxPQUFPLEdBQWtCLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0lBRS9ELEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFjLEVBQUUsU0FBaUIsRUFBRSxFQUFFO1FBQzVELE1BQU0sSUFBSSxHQUFNLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDcEMsTUFBTSxlQUFlLEdBQ25CLE9BQU8sV0FBVyxLQUFLLFFBQVE7WUFDN0IsQ0FBQyxDQUFDLFdBQVc7WUFDYixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUVsQyxZQUFZO1FBQ1osSUFBSSxXQUFXLEdBQWEsRUFBRSxDQUFBO1FBQzlCLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLGNBQWMsRUFBRSxLQUFLO1NBQ3RCLENBQUE7UUFDRCxJQUFJLElBQUksRUFBRTtZQUNSLE1BQU0sUUFBUSxHQUNaLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3pELFdBQVcsR0FBRyxnQkFBUyxDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUE7U0FDaEU7YUFBTTtZQUNMLFdBQVcsR0FBRyxnQkFBUyxDQUFDLEVBQUUsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUE7U0FDMUQ7UUFFRCxxRUFBcUU7UUFDckUsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFBO1FBQ2pCLFdBQVcsQ0FBQyxPQUFPLENBQ2pCLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDZixJQUFJLFVBQVUsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3BCLFVBQVUsQ0FBQyxLQUFLO3FCQUNiLEtBQUssQ0FBQyxJQUFJLENBQUM7cUJBQ1gsS0FBSyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDO3FCQUMxQixPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsRUFBRTtvQkFDeEIscUJBQXFCO29CQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUU7d0JBQzFCLDZEQUE2RDt3QkFDN0QsYUFBYTt3QkFDYixNQUFNLEVBQ0osT0FBTyxXQUFXLEtBQUssUUFBUTs0QkFDN0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxHQUFHLENBQUM7NEJBQzlCLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQzt3QkFDcEMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUU7cUJBQ3hCLENBQUMsQ0FBQTtvQkFDRixTQUFTLElBQUksQ0FBQyxDQUFBO2dCQUNoQixDQUFDLENBQUMsQ0FBQTthQUNMO2lCQUFNLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRTtnQkFDN0IsMkJBQTJCO2dCQUMzQixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDM0M7aUJBQU07Z0JBQ0wsMERBQTBEO2dCQUMxRCxTQUFTLElBQUksVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUE7YUFDbkM7UUFDSCxDQUFDLENBQ0EsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDO0FBN0RELHNCQTZEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYW5nZSwgZGlmZkxpbmVzIH0gZnJvbSAnZGlmZidcblxuZXhwb3J0IGludGVyZmFjZSBJQmxhbWVMaW5lPFQ+IHtcbiAgb3JpZ2luOiBUIGV4dGVuZHMgc3RyaW5nID8gbnVtYmVyIDogVFxuICB2YWx1ZTogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUV4dHJhY3RvcjxUPiB7XG4gICBnZXRDb2RlOiAoYTogVCkgPT4gc3RyaW5nXG4gICBnZXRPcmlnaW46IChhOiBUKSA9PiBhbnlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsYW1lPFQ+KCBcbiAgY29kZXM6IEFycmF5PFQ+LFxuICBwYXNzZWRPcHRpb25zPzogSUV4dHJhY3RvcjxUPiAsXG4pOiBBcnJheTxJQmxhbWVMaW5lPFQ+PiB7XG5cbiAgY29uc3QgcmVzdWx0OiBBcnJheTxJQmxhbWVMaW5lPFQ+PiA9IFtdXG4gIGNvbnN0IG9wdGlvbnM6IElFeHRyYWN0b3I8VD4gPSBPYmplY3QuYXNzaWduKHt9LCBwYXNzZWRPcHRpb25zKVxuXG4gIGNvZGVzLnJldmVyc2UoKS5mb3JFYWNoKChjb21wYXJlV2l0aDogVCwgY29kZUluZGV4OiBudW1iZXIpID0+IHtcbiAgICBjb25zdCBiYXNlOiBUID0gY29kZXNbY29kZUluZGV4IC0gMV1cbiAgICBjb25zdCBjb21wYXJlV2l0aENvZGU6IHN0cmluZyA9XG4gICAgICB0eXBlb2YgY29tcGFyZVdpdGggPT09ICdzdHJpbmcnXG4gICAgICAgID8gY29tcGFyZVdpdGhcbiAgICAgICAgOiBvcHRpb25zLmdldENvZGUoY29tcGFyZVdpdGgpXG5cbiAgICAvLyBEaWZmIGNvZGVcbiAgICBsZXQgZGlmZlJlc3VsdHM6IENoYW5nZVtdID0gW11cbiAgICBjb25zdCBkaWZmT3B0aW9ucyA9IHtcbiAgICAgIG5ld2xpbmVJc1Rva2VuOiBmYWxzZSxcbiAgICB9XG4gICAgaWYgKGJhc2UpIHtcbiAgICAgIGNvbnN0IGJhc2VDb2RlOiBzdHJpbmcgPVxuICAgICAgICB0eXBlb2YgYmFzZSA9PT0gJ3N0cmluZycgPyBiYXNlIDogb3B0aW9ucy5nZXRDb2RlKGJhc2UpXG4gICAgICBkaWZmUmVzdWx0cyA9IGRpZmZMaW5lcyhiYXNlQ29kZSwgY29tcGFyZVdpdGhDb2RlLCBkaWZmT3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgZGlmZlJlc3VsdHMgPSBkaWZmTGluZXMoJycsIGNvbXBhcmVXaXRoQ29kZSwgZGlmZk9wdGlvbnMpXG4gICAgfVxuXG4gICAgLy8gV2FsayB0aHJvdWdoIGRpZmYgcmVzdWx0IGFuZCBjaGVjayB3aGljaCBwYXJ0cyBuZWVkcyB0byBiZSB1cGRhdGVkXG4gICAgbGV0IGxpbmVJbmRleCA9IDBcbiAgICBkaWZmUmVzdWx0cy5mb3JFYWNoKFxuICAgICAgKGRpZmZSZXN1bHQpID0+IHtcbiAgICAgIGlmIChkaWZmUmVzdWx0LmFkZGVkKSB7XG4gICAgICAgIGRpZmZSZXN1bHQudmFsdWVcbiAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgLnNsaWNlKDAsIGRpZmZSZXN1bHQuY291bnQpXG4gICAgICAgICAgLmZvckVhY2goKGxpbmU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgLy8gQWRkIGxpbmUgdG8gcmVzdWx0XG4gICAgICAgICAgICByZXN1bHQuc3BsaWNlKGxpbmVJbmRleCwgMCwge1xuICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1jb21tZW50XG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgb3JpZ2luOlxuICAgICAgICAgICAgICAgIHR5cGVvZiBjb21wYXJlV2l0aCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgID8gY29kZXMubGVuZ3RoIC0gY29kZUluZGV4IC0gMVxuICAgICAgICAgICAgICAgICAgOiBvcHRpb25zLmdldE9yaWdpbihjb21wYXJlV2l0aCksXG4gICAgICAgICAgICAgIHZhbHVlOiBsaW5lLnRyaW1SaWdodCgpLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGxpbmVJbmRleCArPSAxXG4gICAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoZGlmZlJlc3VsdC5yZW1vdmVkKSB7XG4gICAgICAgIC8vIFJlbW92ZSBsaW5lcyBmcm9tIHJlc3VsdFxuICAgICAgICByZXN1bHQuc3BsaWNlKGxpbmVJbmRleCwgZGlmZlJlc3VsdC5jb3VudClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vdGhpbmcgdG8gZG8gYXMgdGhlIGNvZGUgaXMgYWxyZWFkeSBwYXJ0IG9mIHRoZSByZXN1bHRcbiAgICAgICAgbGluZUluZGV4ICs9IGRpZmZSZXN1bHQuY291bnQgfHwgMFxuICAgICAgfVxuICAgIH1cbiAgICApXG4gIH0pXG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuIl19