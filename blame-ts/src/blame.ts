import { Change, diffLines } from 'diff'

export interface IBlameLine<T> {
  origin: T extends string ? number : T
  value: string
}

export interface IExtractor<T> {
   getCode: (a: T) => string
   getOrigin: (a: T) => any
}

export function blame<T>( 
  codes: Array<T>,
  passedOptions?: IExtractor<T> ,
): Array<IBlameLine<T>> {

  const result: Array<IBlameLine<T>> = []
  const options: IExtractor<T> = Object.assign({}, passedOptions)

  codes.reverse().forEach((compareWith: T, codeIndex: number) => {
    const base: T = codes[codeIndex - 1]
    const compareWithCode: string =
      typeof compareWith === 'string'
        ? compareWith
        : options.getCode(compareWith)

    // Diff code
    let diffResults: Change[] = []
    const diffOptions = {
      newlineIsToken: false,
    }
    if (base) {
      const baseCode: string =
        typeof base === 'string' ? base : options.getCode(base)
      diffResults = diffLines(baseCode, compareWithCode, diffOptions)
    } else {
      diffResults = diffLines('', compareWithCode, diffOptions)
    }

    // Walk through diff result and check which parts needs to be updated
    let lineIndex = 0
    diffResults.forEach(
      (diffResult) => {
      if (diffResult.added) {
        diffResult.value
          .split('\n')
          .slice(0, diffResult.count)
          .forEach((line: string) => {
            // Add line to result
            result.splice(lineIndex, 0, {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              origin:
                typeof compareWith === 'string'
                  ? codes.length - codeIndex - 1
                  : options.getOrigin(compareWith),
              value: line.trimRight(),
            })
            lineIndex += 1
          })
      } else if (diffResult.removed) {
        // Remove lines from result
        result.splice(lineIndex, diffResult.count)
      } else {
        // Nothing to do as the code is already part of the result
        lineIndex += diffResult.count || 0
      }
    }
    )
  })

  return result
}
