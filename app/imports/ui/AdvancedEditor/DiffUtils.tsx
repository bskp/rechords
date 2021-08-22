import * as React from 'react';
import { Change } from 'diff';
import { ReactElement } from 'react';
import { ConvertDiffOptions } from './RevBrowserAdvanced';

export function reduceDiff(changes: Change[], options: ConvertDiffOptions): ReactElement[] {
  const all: ReactElement[] = [];

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    let classNames = 'diff ';
    let value = change.value;
    const enhanceWhiteSpace = () => {
      value = value.replaceAll(/[^\S\n]/gm, '·');
      value = value.replaceAll(/\n/g, '¶\n');
    };
    if (change.added) {
      classNames += 'added';
    } else if (change.removed) {
      classNames += 'removed';
    }

    if (options?.showWhitespace) {
      enhanceWhiteSpace();
    }

    const changeS = value.split('\n');

    for (let i = 0; i < changeS.length; i++) {

      if (i > 0)
        all.push(<br />);
      const changeE = changeS[i];
      // Splitting by newlines has the following effect:
      // "a\nb\n".split('\n') -> ['a','b','']
      // ignoring empty string at the end fixes this
      if( i < changeS.length-1 || changeE.length > 0 ) 
      {
        all.push(<span className={classNames}>{changeE}</span>);
      }
    }
  }
  return all;
}
