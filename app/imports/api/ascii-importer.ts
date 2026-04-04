export function convertToHoelibuSyntax(text: string) {
  const out = [];
  const lines: string[] = text.split(/\r?\n/);

  let lastChordMap: Map<number, string> | null = null;
  for (const line of lines) {
    if (isChordLine(line)) {
      if (lastChordMap != null) {
        out.push(pair(lastChordMap, ""));
      }
      lastChordMap = parseChords(line);
    } else {
      if (lastChordMap) {
        out.push(pair(lastChordMap, line));
        lastChordMap = null;
      } else {
        out.push(line);
      }
    }
  }
  return out.join("\n");
}

const matchChord = /^[A-H](#|b)?(?:maj|min|m|M|aug|dim|sus2|sus4|7|maj7|min7|m7|M7|add9|6|9|11|13)?(?:(#|b)\d+)?(?:(#|b)\d+)?(?:\/[A-G](#|b)?)?$/i
function isChordLine(str: string) {
  const parts = str.trim().split(/\s+/);
  let numChords = 0,
    numNonChords = 0;

  for (const part of parts) {
    if (matchChord.test(part)) {
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
  let match: RegExpExecArray | null;
  while ((match = re.exec(str))) {
    returnValue.set(match.index, match[0]);
  }
  return returnValue;
}

function pair(map: Map<number, string>, str: string) {
  let output = "";
  if (str.length === 0 || map.size > str.length) {
    return Array.from(map.values())
      .map(c => `[${c}]`)
      .join("");
  }
  for (let i = 0; i < str.length; i++) {
    if (map.has(i)) {
      output += `[${map.get(i)}]`;
      map.delete(i)
    }
    output += str.charAt(i);
  }
  output += [...map.values()].map(chord => `[${chord}]`).join();
  return output;
}
