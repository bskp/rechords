import * as React from 'react';
import abcjs, {AbcVisualParams} from 'abcjs';

const regular = 'Roboto 12';
const bold = regular + ' bold';

const defaults: AbcVisualParams = {
  add_classes       : true,
  paddingtop        : 0,
  paddingbottom     : 0,
  paddingright      : 0,
  paddingleft       : 0,
  viewportHorizontal: true,
  format            : {
    gchordfont    : bold,
    annotationfont: bold,
    vocalfont     : regular,
    composerfont  : regular,
    footerfont    : regular,
    headerfont    : regular,
    historyfont   : regular,
    infofont      : regular,
    measurefont   : regular,
    partsfont     : regular,
    repeatfont    : regular,
    subtitlefont  : regular,
    tempofont     : regular,
    textfont      : regular,
    titlefont     : regular,
    voicefont     : regular,
    wordsfont     : regular,
  },
};

export const Abcjs = (props: {
  abcNotation: string,
  params: AbcVisualParams
}) => {
  const target = 'abcjs-result-' + Date.now() + Math.random();
  abcjs.renderAbc(target,
    props.abcNotation,
    {...props.params, ...defaults});

  return <div className="abc-notation">
    <div id={target} style={{width: '100%'}}/>
  </div>;
};
