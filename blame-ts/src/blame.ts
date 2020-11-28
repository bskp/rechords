import { Change, diffLines } from 'diff'

export interface IBlameLine<T> {
  origin: T extends string ? number : T
  value: string
}

export interface IExtractor<T,S> {
   getCode: (a: T) => string
   getOrigin: (a: T) => S
}

/**
 * 
 * @param snapshots idx=0 => most recent snapshot (what is seen in the editor), idx=length-1 => oldest snapshot 
 * @param passedOptions 
 */
export function blame<T,S>( 
  snapshots: Array<T>,
  passedOptions?: IExtractor<T,S> ,
): Array<IBlameLine<T>> {

  const result: Array<IBlameLine<T>> = []
  const options: IExtractor<T,S> = Object.assign({}, passedOptions)

  snapshots.reverse()

  for( const [codeIndex, compareWith] of snapshots.entries()) { //(compareWith: T, codeIndex: number) => {
    const base: T = snapshots[codeIndex - 1]
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
    for( const diffResult of diffResults ) {
      if (diffResult.added) {
        for( const line of diffResult.value.split('\n').slice(0, diffResult.count) ) {
            // Add line to result
            result.splice(lineIndex, 0, {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              origin:
                typeof compareWith === 'string'
                  ? snapshots.length - codeIndex - 1
                  : options.getOrigin(compareWith),
              value: line.trimRight(),
            })
            lineIndex += 1
          }
      } else if (diffResult.removed) {
        // Remove lines from result
        result.splice(lineIndex, diffResult.count)
      } else {
        // Nothing to do as the code is already part of the result
        lineIndex += diffResult.count || 0
      }
    }
  })

  return result
}
