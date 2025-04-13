import * as React from "react";
import { FunctionComponent, memo } from "react";

interface LineProps {
  height?: number;
  width?: number;
  lineHeight?: number;
}

export const Lines: FunctionComponent<LineProps> = memo(
  ({ height = 20, width = 10, lineHeight = 4 }) => {
    const numLines = Math.max(
      1,
      Math.round(height / lineHeight - 2 * Math.random()),
    );

    const idxes = [...new Array(numLines).keys()];
    return (
      <>
        {idxes
          .map((i) => (i + 0.5) * lineHeight)
          .map((h) => (
            <line className="medium" key={h} y1={h} y2={h} x1={0} x2={width} />
          ))}
      </>
    );
  },
);
Lines.displayName = "SvgLines";
interface ColumnProps {
  numCols?: number;
  height?: number;
  width?: number;
  gap?: number;
  colWidth?: number;
  wrapSvg?: boolean;
}

export const Columns: FunctionComponent<ColumnProps> = memo(
  ({
    numCols = 2,
    height = 30,
    width = 20,
    gap = 1,
    colWidth,
    wrapSvg = true,
  }) => {
    const idxes = [...new Array(numCols).keys()];
    if (colWidth) {
      width = colWidth * numCols + (numCols + 3) * gap;
    } else {
      colWidth = (width - (numCols + 3) * gap) / numCols;
    }
    const elements = idxes.map((idx) => (
      <g
        key={idx}
        transform={`translate(${2 * gap + idx * (gap + colWidth)} ${2 * gap})`}
      >
        <Lines height={height - 4 * gap} width={colWidth} />
      </g>
    ));
    if (wrapSvg) {
      return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {elements}
        </svg>
      );
    } else {
      return <>{elements}</>;
    }
  },
);
Columns.displayName = "SvgColumns";

export const Landscape = (
  <svg width="100%" viewBox={`0 0 50 30 `}>
    <Columns height={30} width={50} numCols={4} gap={3} wrapSvg={false} />
  </svg>
);

export const Portrait = (
  <svg width="100%" viewBox={`0 0 30 50`}>
    <Columns height={50} width={30} numCols={2} gap={3} wrapSvg={false} />
  </svg>
);
