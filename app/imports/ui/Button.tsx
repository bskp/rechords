import * as React from 'react';
import {MouseEventHandler} from 'react';

type ButtonProps = {
  onClick: MouseEventHandler,
  children: React.ReactNode

}
export const Button: React.FunctionComponent<ButtonProps> = props =>
  <a onClick={props.onClick} className="iconbutton">
    {props.children}
  </a>;
