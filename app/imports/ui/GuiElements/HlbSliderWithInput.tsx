import * as React from "react";
import { FunctionComponent } from "react";
import { HlbInput } from "./HlbInput";
import "./HlbSliderWithInputStyle.less"

const defaultProps = { max: 10, min: 1, onChange: () => undefined };

export type SliderWithInputProps = {
  max: number;
  min: number;
  value: number;
  onChange: (v: number) => void;
  id?: string;
  step?: number;
};

export const HlbSliderWithInput: FunctionComponent<SliderWithInputProps> = (props) => {
  const p = {...defaultProps, ...props}
  const id = p.id || React.useId();
  return (
    <>
      <div className="slidecontainer">
        <input
          type="range"
          step={p.step || 1}
          min={p.min}
          max={p.max}
          value={p.value}
          className="slider"
          onChange={(v) => p.onChange(parseFloat(v.currentTarget.value))}
        ></input>
      </div>
      <HlbInput id={id} onChange={p.onChange} value={p.value} />
    </>
  );
};

