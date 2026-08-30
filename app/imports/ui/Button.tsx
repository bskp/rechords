import * as React from "react";
import classnames from "classnames";

type ButtonProps = {
  onClick: React.MouseEventHandler;
  children: React.ReactNode;
  phoneOnly?: boolean;
  hideOnPhone?: boolean;
  /** Draws the icon in the accent colour, for a setting that is switched on. */
  active?: boolean;
};

export const Button: React.FunctionComponent<ButtonProps> = (props) => (
  <a
    onClick={props.onClick}
    className={classnames("iconbutton", {
      hideUnlessMobile: props.phoneOnly,
      hideOnMobile: props.hideOnPhone,
      active: props.active,
    })}
  >
    {props.children}
  </a>
);
