import { FC, useContext, useEffect, useRef } from "react";
import * as React from "react";
import YouTube from "react-youtube";
import { linInterpolation } from "./time2line";
import { VideoContext } from "/imports/ui/App";
import { extractData } from "../api/extractData";

export const YtInter: FC<{
  data: string;
  selectedLine: { selectedLine: number };
  onTimeChange?: (t?: number) => void;
  onLineChange?: (t?: number) => void;
}> = ({ data, selectedLine: currentLine, onTimeChange, onLineChange }) => {
  const { isActive } = useContext(VideoContext);

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
          (l) => l[1],
          (l) => l[0],
        );
        onLineChange(estimatedLine);
      }
    }, 50);
  }, []);

  useEffect(() => {
    console.log(currentLine);
    if (!currentLine.selectedLine) {
      return;
    }
    const estimatedTime = linInterpolation(
      anchors,
      currentLine.selectedLine,
      (l) => l[0],
      (l) => l[1],
    );
    yPlayer.current?.internalPlayer?.seekTo(estimatedTime ?? 0, true);
  }, [currentLine]);

  useEffect(() => {
    console.log("playvideo");
    yPlayer.current?.internalPlayer?.playVideo();
    // otherwise the iframe consumes global keyboard events
    yPlayer.current?.container?.blur();
  }, [isActive]);

  if (isActive) {
    return <YouTube videoId={ytId} ref={yPlayer} />;
  }
};

export function appendTime(
  md: string,
  lastTime: number,
  selectedLine: number,
): string | undefined {
  const rgx = /~~~yt\n(.*)\n~~~/s;
  const match = md.match(rgx);
  if (!match) return;
  const data = match[1];

  const { ytId, anchors: anchors_ } = extractData(data);
  const anchorMap = new Map(anchors_)
  // anchors.push([selectedLine, Math.round(lastTime * 10) / 10]);
  // avoid duplicate
  anchorMap.set(selectedLine, Math.round(lastTime*10)/10)

  const anchors = [...anchorMap.entries()]
  anchors.sort(([a, _], [b, __]) => a - b);

  const ytOut = `~~~yt
${ytId}
${anchors.map((line) => line.join(" ")).join("\n")}
~~~`;

  return md.replace(rgx, ytOut);
}
