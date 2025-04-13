import * as React from "react";
import { FunctionComponent } from "react";
import { HlbInput } from "./HlbInput";
import ReactSlider from "react-slider";

const defaultProps = { max: 10, min: 1, onChange: () => undefined };

export type SliderWithInputProps = {
  max: number;
  min: number;
  value: number;
  onChange: (v: number) => void;
  id?: string;
  step?: number;
};

export const HlbSliderWithInput: FunctionComponent<SliderWithInputProps> = (
  props,
) => {
  const p = { ...defaultProps, ...props };
  const id = p.id || React.useId();
  return (
    <>
      <ReactSlider
        min={p.min}
        max={p.max}
        value={p.value}
        step={p.step ?? 1}
        className="react-slider"
        onChange={(v) => p.onChange(v)}
      ></ReactSlider>
      <HlbInput id={id} onChange={p.onChange} value={p.value} />
    </>
  );
};
