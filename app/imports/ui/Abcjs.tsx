import * as React from "react";
import { useEffect, useRef } from "react";
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
  scrollHorizontal: true,
  staffwidth: 600,
  expandToWidest: true,
  jazzchords: true,
  selectTypes: false,
  responsive: undefined,
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("width", ref.current?.clientWidth);
    abcjs.renderAbc(target, props.abcNotation, {
      ...props.params,
      ...defaults,
      staffwidth: (ref.current?.clientWidth ?? 0) - 8,
    });
  });

  return (
    <div className="abc-notation">
      <div id={target} ref={ref} />
    </div>
  );
};
