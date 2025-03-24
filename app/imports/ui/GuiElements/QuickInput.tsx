import * as React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { FunctionComponent } from "react";

export type keysEvent =
  | React.MouseEvent<Element, MouseEvent>
  | React.KeyboardEvent<HTMLInputElement>
  | KeyboardEvent;

export const useListener = (
  target: EventTarget,
  type: keyof GlobalEventHandlersEventMap,
  listener,
  options?,
): (() => void) => {
  target.addEventListener(type, listener, options);
  // returning deregistering lambda (consistent with useEffect)
  return () => {
    target.removeEventListener(type, listener);
  };
};
type dec = [(e: keysEvent) => boolean, string, string, number, number];
// const arrowIcons:[string,string][] = [
//   ['u', 'd'],
//   ['uu','dd'],
//   ['U︎','D'],
//   ['UU', 'DD'],
// ]
const updowns: dec[] = [
  [mult1, "*", "/", 1.2, 2],
  [mult2, "*", "/", 2, 3],
  [inc0, "+", "-", 0.1, 0.5],
  [() => true, "+", "-", 1, 1],
];

export const QuickInput: FunctionComponent<{
  id: string;
  value: number;
  onChange: (a: number) => void;
}> = ({ onChange, value, id }) => {
  const [mod, setMod] = useState(updowns[3]);

  useEffect(() => {
    const abc = new AbortController();
    const opt = { signal: abc.signal };

    const listener: any = (e) => {
      setMod(decider(e));
    };
    const deregisters = [
      useListener(document, "keydown", listener, opt),
      useListener(document, "keyup", listener, opt),
      useListener(window, "blur", listener, opt),
    ];

    // Alternatively
    // deregisters.forEach(d => d())
    return () => {
      abc.abort();
    };
  });

  const up = (e: keysEvent) => {
    e.preventDefault();
    const op = decider(e);
    onChange(Math.round(eval(value + op[1] + op[3]) * 10) / 10);
  };

  const down = (e: keysEvent) => {
    e.preventDefault();
    const op = decider(e);
    onChange(Math.round(eval(value + op[2] + op[3]) * 10) / 10);
  };

  const handleKey = (keyEvent: React.KeyboardEvent<HTMLInputElement>) => {
    if (keyEvent.key == "ArrowUp") {
      up(keyEvent);
    } else if (keyEvent.key == "ArrowDown") {
      down(keyEvent);
    }
  };

  const intensity = 1.2;
  return (
    <input
      type="number"
      min="1"
      max="200"
      onKeyDown={handleKey}
      id={id}
      onFocus={(ev) => ev.target.select()}
      value={value}
      onChange={(ev) => onChange(parseFloat(ev.currentTarget.value))}
    />
  );
};

function inc0(keyEvent: keysEvent) {
  return keyEvent.shiftKey;
}

function mult2(keyEvent: keysEvent) {
  return keyEvent.metaKey || keyEvent.ctrlKey;
}

function mult1(keyEvent: keysEvent) {
  return keyEvent.altKey;
}

function decider(e: keysEvent): dec {
  for (const ud of updowns) {
    if (ud[0](e)) return ud;
  }
}
