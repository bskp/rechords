
export function extractData(data: string): {
  ytId: string;
  anchors: [number, number][];
} {
  const [ytId, ..._anchors] = data.split("\n");
  const anchors = _anchors.map((line) => line.split(/\s+/).map(parseFloat));
  return { ytId, anchors };
}
