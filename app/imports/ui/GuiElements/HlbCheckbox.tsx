import * as React from "react";

export const HlbCheckbox = (
  props: {
    value: boolean;
    setter: (a: boolean) => void;
  } & React.PropsWithChildren,
) => {
  const id = React.useId();
  return (
    <>
      <input
        id={id}
        checked={props.value}
        type="checkbox"
        onClick={(e) => props.setter(e.currentTarget.checked)}
      />
      <label
        htmlFor={id}
        title="Repeat text of each Reference?"
        className="fullwidth"
      >
        <Cross></Cross> {props.children}
      </label>
    </>
  );
};

export const Cross: React.FC = () => (
  <svg width="20px" height="20px">
    <rect className="box" x="0" y="0" width="20px" height="20px" />
    <line className="cross" x1="4" y1="4" x2="16px" y2="16px" />
    <line className="cross" x1="4" y2="4" x2="16px" y1="16px" />
  </svg>
);
