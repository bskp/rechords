import * as React from "react";
import { useEffect } from "react";
import abcjs, { AbcVisualParams } from "abcjs";

const regular = "Roboto 12";
const bold = regular + " bold";

interface AbcTabParams {
  tablature?: {
    instrument: string;
    label?: string;
    tuning?: string[];
  }[];
}

const defaults: AbcVisualParams & AbcTabParams = {
  add_classes: true,
  paddingtop: 0,
  paddingbottom: 50,
  paddingright: 0,
  paddingleft: 0,
  viewportHorizontal: true,
  format: {
    gchordfont: bold,
    annotationfont: bold,
    vocalfont: regular,
    composerfont: regular,
    footerfont: regular,
    headerfont: regular,
    historyfont: regular,
    infofont: regular,
    measurefont: regular,
    partsfont: regular,
    repeatfont: regular,
    subtitlefont: regular,
    tempofont: regular,
    textfont: regular,
    titlefont: regular,
    voicefont: regular,
    wordsfont: regular,
  },
};

export const Abcjs = (props: {
  abcNotation: string;
  params: AbcVisualParams;
}) => {
  const target = "abcjs-result-" + Math.round(100000 * Math.random());

  useEffect(() => {
    abcjs.renderAbc(target, props.abcNotation, {
      ...props.params,
      ...defaults,
    });
  });

  return (
    <div className="abc-notation">
      <div id={target} style={{ width: "100%" }} />
    </div>
  );
};
