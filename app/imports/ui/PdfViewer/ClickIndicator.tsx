import * as React from "react";
import { useState } from "react";

import "./ClickIndicatorStyle.css";
import { ReactSVG } from "react-svg";

const width = 100,
  height = 100;

const style: React.CSSProperties = {
  position: "absolute",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  pointerEvents: "none",
  width: width + "px",
  height: height + "px",
  animation: "growAndFade 1s",
};

export const useClickIndicator: () => [
  React.MouseEventHandler,
  React.FunctionComponent<Record<string, never>>,
] = () => {
  const [clicked, setClick] = useState([]);
  const handler: React.MouseEventHandler = (e) => {
    setClick([e.clientX, e.clientY]);
  };

  const Comp: React.FunctionComponent<null> = () =>
    clicked.length ? (
      <div
        style={{
          ...style,
          left: clicked[0] - width / 2,
          right: clicked[1] - height / 2,
        }}
        onAnimationEnd={() => setClick([])}
      >
        <ReactSVG src="/svg/pdf.svg" />
      </div>
    ) : (
      <></>
    );

  return [handler, Comp];
};
