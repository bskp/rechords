import { FC, useEffect, useRef } from "react";
import * as React from "react";
import YouTube from "react-youtube";
import { linInterpolation } from "./time2line";

export const YtInter: FC<{
  data: string;
  lineAction: { lineCnt?: number };
  onTimeChange?: (t?: number) => void;
  onLineChange?: (t?: number) => void;
}> = ({ data, lineAction, onTimeChange, onLineChange }) => {
  const yPlayer = useRef<YouTube>(null);
  const { ytId, anchors } = extractData(data);

  useEffect(() => {
    setInterval(async () => {
      const time = await yPlayer.current?.internalPlayer?.getCurrentTime();
      if (typeof onTimeChange === "function") {
        onTimeChange(time);
      }
      if (typeof onLineChange === "function") {
        const estimatedLine = linInterpolation(
          anchors,
          time,
          (l) => l[0],
          (l) => l[1],
        );
        onLineChange(estimatedLine);
      }
    }, 450);
  }, []);

  useEffect(() => {
    if (!lineAction) {
      return;
    }
    const estimatedTime = linInterpolation(
      anchors,
      lineAction.lineCnt,
      (l) => l[1],
      (l) => l[0],
    );
    yPlayer.current?.internalPlayer?.seekTo(estimatedTime, true);
  }, [lineAction]);
  return <YouTube videoId={ytId} ref={yPlayer} />;
};

export function extractData(data: string): {
  ytId: string;
  anchors: [number, number][];
} {
  const [ytId, ..._anchors] = data.split("\n");
  const anchors = _anchors.map((line) => line.split(/\s+/).map(parseFloat));
  return { ytId, anchors };
}

export function appendTime(
  md: string,
  lastTime: number,
  lineCnt: any,
): string | undefined {
  const rgx = /~~~yt\n(.*)\n~~~/s;
  const match = md.match(rgx);
  const data = match[1];
  if (!match) return;

  const { ytId, anchors } = extractData(data);
  anchors.push([Math.round(lastTime * 10) / 10, parseFloat(lineCnt)]);

  anchors.sort(([a, _], [b, __]) => a - b);

  const ytOut = `~~~yt
${ytId}
${anchors.map((line) => line.join(" ")).join("\n")}
~~~`;

  return md.replace(rgx, ytOut);
}
