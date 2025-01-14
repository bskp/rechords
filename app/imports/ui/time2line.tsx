// actually the same twice with different selectors

export function linInterpolation<T>(
  anchors: T[],
  x: number,
  selectorX: (v: T) => number,
  selectorY: (v: T) => number,
) {
  for (let i = 1; i < anchors.length; i++) {
    const current = anchors[i];
    const currentX = selectorX(current);

    if (currentX > x) {
      const prev = anchors[i - 1];
      const prevX = selectorX(prev);
      const deltaL = currentX - prevX;

      const ratio = (x - prevX) / deltaL;

      const prevY = selectorY(prev);
      return prevY + ratio * (selectorY(current) - prevY);
    }
  }
}

export type Anchor = {
  sectionId: string;
  relLineNumber: number;
};

export type TimeRef = {
  time: number;
  anchor: Anchor;
};
