import "./SettingIconsStyle.less"
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
}

export const Columns: FunctionComponent<ColumnProps> = memo(
  ({ numCols = 2, height = 30, width = 20, gap = 1, colWidth }) => {
    const idxes = [...new Array(numCols).keys()];
    if (colWidth) {
      width = colWidth * numCols + (numCols + 3) * gap;
    } else {
      colWidth = (width - (numCols + 3) * gap) / numCols;
    }
    return (
      <svg width={width} height={height}>
        {idxes.map((idx) => (
          <g
            key={idx}
            transform={`translate(${2 * gap + idx * (gap + colWidth)} ${2 * gap})`}
          >
            <Lines height={height - 4 * gap} width={colWidth} />
          </g>
        ))}
      </svg>
    );
  },
);
Columns.displayName = "SvgColumns";

const height = 50;
const width = 35;

export const Landscape = (
  <svg height={width} width={height}>
    <rect x={0} y={0} width={height} height={width} className="bold" />
    <Columns height={width} width={height} numCols={4} gap={3} />
  </svg>
);

export const Portrait = (
  <svg height={height} width={width}>
    <rect x={0} y={0} width={width} height={height} className="bold" />
    <Columns height={height} width={width} numCols={2} gap={3} />
  </svg>
);
