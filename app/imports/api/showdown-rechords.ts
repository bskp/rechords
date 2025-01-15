import { ShowdownExtension } from "showdown";

export const refPrefix = "sd-ref-";

function parseProsody(text: string) {
  // Prosodic annotations
  text = text.replace(/_/g, "<u>‿</u>");
  text = text.replace(/\B'\B/g, "<u>’</u>"); // "\B": negierte Wortgrenzen!
  return text;
}

function parseLine(_match: any, content: string) {
  if (content.match(/^\s*$/g)) return "</p>\n</div>\n<div>\n<p>";
  // Match bis zum Einsatz des ersten Akkords:
  let line = content.replace(
    /^([^[]+)/,
    (match: string) => "<i>" + parseProsody(match) + "</i>",
  );
  // Ab hier wird nun immer vom Akkord beginnend bis zum nächsten Akkord (exkl) gematcht
  line = line.replace(
    /\[([^\]]*)\]([^[]*)/gi,
    function (_: string, chord: string, text: string) {
      // Akkorde am Zeilenende ohne folgenden Text
      if (text.match(/^ *$/)) {
        text = " "; // Text wird als &nbps gesetzt als "Stamm" für den Akkord
      }
      // Line indents
      if (text.match(/^ ./)) {
        text = "     " + text.substring(1);
      }
      text = parseProsody(text);
      return '<i data-chord="' + chord + '">' + text + "</i>";
    },
  );
  return '<span class="line">' + line + "</span>\n";
}

// Title
export const title = {
  type: "lang",
  regex: /([^\n]+)\n([^\n]+\n)?=+\s*\n/,
  replace: function (_match: string, song: string, artist: string): string {
    artist = artist?.trim();
    const h2 = artist ? "<h2>" + artist + "</h2>\n" : "";
    return (
      '<div class="sd-header">\n<h1>' + song + "</h1>\n" + h2 + "</div>\n\n"
    );
  },
};

export const tags = {
  type: "lang",
  regex: /^\s*(#(\S+) *)+\s*$/gm,
  replace: function (tags: string): string {
    return (
      '<ul class="tags">' +
      tags.replace(
        /\s*#([^\s:]+)(?::(\S*))?\s*/g,
        (match: string, tag: string, value: string) => {
          if (value !== undefined) {
            tag += "<b>" + value + "</b>";
          }
          return "\n    <li>" + tag + "</li>";
        },
      ) +
      "\n</ul>"
    );
  },
};

// Verses
export const verseRegex = /(.*?): *\n((?:[^\n<>]*[^\n:<>]+\n\n?)+)/gi;
export const verses = {
  type: "lang",
  regex: verseRegex,

  replace: (_match: string, id: string, content: string): string => {
    let h3 = "";
    if (id) {
      h3 = "<h3>" + id + "</h3>\n";
    }

    content = content.replace(/\n$/, ""); // remove end-of-verse linebreaks
    content = content.replace(/\n{3,}/g, "\n\n"); // remove excessive line breaks
    content = content.replace(/(.*?)\n/g, parseLine);

    return `<section id="${refPrefix}${id}">
<div>${h3}<p>${content}</p>
</div>
</section>`;
  },
};

export const references = {
  type: "lang",
  regex: /-> *(.*?)(?:: *(.*))?\n/gm,
  replace: (_match: string, ref: string, annotation: string): string => {
    annotation = annotation ? annotation : "";
    // todo: inline reference html here
    return `<div class="ref"><strong>${ref}</strong>${annotation}</div>`;
  },
};

export const chordFrets = {
  type: "lang",
  regex: /\n\[([^\]]*)\]: +([0-9a-dx-]{6})\n( *[0-4-x ]{6}\n)?/gm,
  replace: (
    _match: string,
    label: string,
    frets: string,
    fingers: string,
  ): string => {
    const df = fingers ? ` data-fingers="${fingers.trim()}"` : "";
    return `<abbr class="chord" title="${frets}"${df}>${label}</abbr>`;
  },
};

export const showdownRechords: ShowdownExtensionExplicit[] = [
  title,
  tags,
  verses,
  references,
  chordFrets,
];

// Variadic Tuples. Noice :)
type little = [substring: string, ...p: string[]];
type all = [
  substring: string,
  ...p: string[],
  position: number,
  content: string,
];
type part = [substring: string, ...p: string[], position: number];

interface ShowdownExtensionExplicit extends ShowdownExtension {
  replace:
    | string
    | (
        | ((...a: little) => string)
        | ((...a: part) => string)
        | ((...a: all) => string)
      );
}
