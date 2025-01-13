import * as React from "react";
import classnames from "classnames";

type ButtonProps = {
  onClick: React.MouseEventHandler;
  children: React.ReactNode;
  phoneOnly?: boolean;
};

export const Button: React.FunctionComponent<ButtonProps> = (props) => (
  <a
    onClick={props.onClick}
    className={classnames("iconbutton", { phoneOnly: props.phoneOnly })}
  >
    {props.children}
  </a>
);
