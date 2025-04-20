import { FC, useContext, useEffect, useRef } from "react";
import * as React from "react";
import YouTube from "react-youtube";
import { linInterpolation } from "./time2line";
import { VideoContext } from "/imports/ui/App";

export const YtInter: FC<{
  data: string;
  selectedLine: { selectedLine: number };
  onTimeChange?: (t?: number) => void;
  onLineChange?: (t?: number) => void;
  maxLine: number;
}> = ({
  data,
  selectedLine: currentLine,
  onTimeChange,
  onLineChange,
  maxLine,
}) => {
  const { isActive } = useContext(VideoContext);

  const yPlayer = useRef<YouTube>(null);
  const { ytId, anchors: anchors_ } = extractData(data);

  useEffect(() => {
    setInterval(async () => {
      const internalPlayer = yPlayer.current?.internalPlayer;
      if (internalPlayer) {
        const duration = await internalPlayer.getDuration();
        const time = await internalPlayer.getCurrentTime();

        const anchors = [[-1, -1], ...anchors_, [duration, maxLine]];

        if (typeof onTimeChange === "function") {
          onTimeChange(time);
        }
        if (typeof onLineChange === "function") {
          const estimatedLine = linInterpolation(
            anchors,
            time,
            (l) => l[1],
            (l) => l[0]
          );
          onLineChange(estimatedLine);
        }
      }
    }, 50);
  }, []);

  useEffect(() => {
    console.log(currentLine);
    const internalPlayer = yPlayer.current?.internalPlayer;
    if (!currentLine.selectedLine || !internalPlayer) {
      return;
    }

    internalPlayer.getDuration().then((duration) => {
      const anchors = [[0, -1], ...anchors_, [maxLine+1,duration+1]];
      const estimatedTime = linInterpolation(
        anchors,
        currentLine.selectedLine,
        (l) => l[0],
        (l) => l[1]
      );
      yPlayer.current?.internalPlayer?.seekTo(estimatedTime ?? 0, true);
    });
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

export function extractData(data: string): {
  ytId: string;
  anchors: [number, number][];
} {
  const [ytId, ..._anchors] = data.split("\n");
  const anchors = _anchors
  .map((line) => line.split(/\s+/).map(parseFloat))
  .filter(line => line.every(Number.isFinite)) ;
  // @ts-ignore
  return { ytId, anchors };
}

export function appendTime(
  md: string,
  lastTime: number,
  selectedLine: number
): string | undefined {
  const rgx = /~~~yt\n(.*)\n~~~/s;
  const match = md.match(rgx);
  if (!match) return;
  const data = match[1];

  const { ytId, anchors } = extractData(data);
  anchors.push([selectedLine, Math.round(lastTime * 10) / 10]);

  anchors.sort(([a, _], [b, __]) => a - b);

  const ytOut = `~~~yt
${ytId}
${anchors.map((line) => line.join(" ")).join("\n")}
~~~`;

  return md.replace(rgx, ytOut);
}
