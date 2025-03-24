import * as React from "react";
import { FunctionComponent } from "react";
import { QuickInput } from "./QuickInput";

const defaultProps = { max: 10, min: 1, onChange: () => undefined };

export type SliderWithInputProps = {
  max: number;
  min: number;
  value: number;
  onChange: (v: number) => void;
  id?: string;
};

export const SliderWithInput: FunctionComponent<SliderWithInputProps> = (p) => {
  const id = p.id || React.useId();
  return (
    <>
      <div className="slidecontainer">
        <input
          type="range"
          min={p.min}
          max={p.max}
          value={p.value}
          className="slider"
          id="myRange"
          onChange={(v) => p.onChange(parseInt(v.currentTarget.value))}
        ></input>
      </div>
      <QuickInput id={id} onChange={p.onChange} value={p.value} />
    </>
  );
};

SliderWithInput.defaultProps = defaultProps;
