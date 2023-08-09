const matchchord = /^\(?([a-h](#|b)?)(-|\+|m?(?!aj))([^a-z](.*))?$/i;

export function convertToHoelibuSyntax(text: string) {

  const out = [];

  const lines: string[] = text.split(/\r?\n/);

  let lastChordMap: Map<number, string> = null;
  for (const line of lines) {
    if (isChordLine(line)) {
      lastChordMap = parseChords(line);
    } else {
      if (lastChordMap) {
        out.push( pair(lastChordMap, line) );
        lastChordMap = null;
      } else {
        out.push(line);
      }
    }
  }
  return out.join('\n');
}

function isChordLine(str: string) {

  const parts = str.trim().split(/\s+/);

  let numChords = 0, numNonChords = 0;

  for (const part of parts) {
    // console.log(matchchord.exec(part))
    if (matchchord.test(part)) {
      numChords++;
    } else {
      numNonChords++;
    }
  }
  return numChords > numNonChords;

}

function parseChords(str: string) {
  const re = /\S+/g;
  const returnValue = new Map();
  let match: RegExpExecArray;
  while ((match = re.exec(str))) {
    returnValue.set(match.index, match[0]);
  }
  return returnValue;
}

function pair(map: Map<number, string>, str: string) {
  let output = '';
  if (map.size > str.length) {
    return Array.from(map.values())
      .map(c => `[${c}]`)
      .join('');
  }
  for (let i = 0; i < str.length; i++) {
    if (map.has(i)) {
      output += `[${map.get(i)}]`;
    }
    output += str.charAt(i);
  }
  return output;
}

