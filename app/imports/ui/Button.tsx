import * as React from "react";
import classnames from "classnames";

type ButtonProps = {
  onClick: React.MouseEventHandler;
  children: React.ReactNode;
  phoneOnly?: boolean;
  hideOnPhone?: boolean;
};

export const Button: React.FunctionComponent<ButtonProps> = (props) => (
  <a
    onClick={props.onClick}
    className={classnames("iconbutton", {
      hideUnlessMobile: props.phoneOnly,
      hideOnMobile: props.hideOnPhone,
    })}
  >
    {props.children}
  </a>
);
