import Slider from "rc-slider/lib/Slider";
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
  const id = p.id || React.useId()
  return (
    <>
      <Slider {...p} />
      <QuickInput id={id} onChange={p.onChange} value={p.value} />
    </>
  );
};

SliderWithInput.defaultProps = defaultProps;
