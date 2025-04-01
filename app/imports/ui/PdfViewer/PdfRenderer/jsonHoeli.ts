import { Song } from "/imports/api/collections";

export type Fragment = {
  chord?: string;
  text?: string;
};
export type Line = { fragments: Fragment[]; canbreak?: boolean };

export type ChordBlock = {
  type: "chordblock";
  content: { title?: string; lines: Line[] };
};
export type Comment = {
  type: "comment";
  content: string;
};

export type Repetition = {
  type: "repetition";
  content: {
    ref: string;
    adm?: string;
    title?: string;
    lines?: Line[];
  };
};

export type AllBlocks = ChordBlock | Comment | Repetition;

export type BlockTypes  = AllBlocks['type']

export function parseToIntermediateFormat(song: Song) {
  const mdHtml = new DOMParser().parseFromString(song.getHtml(), "text/html");

  const sections_ = mdHtml.body.children;

  const sections: AllBlocks[] = [];
  for (let i = 0; i < sections_.length; i++) {
    const el = sections_[i];
    if (el.tagName === "SECTION") {
      sections.push({ type: "chordblock", content: mapChordBlock(el) });
    } else if (el.tagName === "P" && el.textContent) {
      sections.push({ type: "comment", content: el.textContent });
    } else if (el.tagName === "DIV" && el.classList.contains("ref")) {
      const [{ textContent: ref }, adm_] = el.childNodes;
      if (ref) {
        const adm = adm_?.textContent || undefined;
        if (sections_[i + 1].classList.contains("inlineReference")) {
          sections.push({
            type: "repetition",
            content: {
              ...mapChordBlock(sections_[i + 1]),
              ref,
              adm,
            },
          });
          i++;
        } else {
          sections.push({ type: "repetition", content: { ref, adm } });
        }
      }
    }
  }
  const author = song.author;
  const title = song.title;

  return { author, title, sections };
}
function mapChordBlock(section: Element) {
  let title = section.querySelector("h3")?.innerText;
  let lines: Line[] = [];
  for (const p of section.querySelectorAll("p")) {
    for (const line of p.querySelectorAll("span.line")) {
      const fragments = Array.from(line.children).map((c) => ({
        text: (c as HTMLSpanElement).innerText,
        chord: (c as HTMLSpanElement).dataset?.chord,
      }));
      lines.push({ fragments });
    }
    const l = lines[lines.length - 1];
    lines[lines.length - 1] = { ...l, canbreak: true };
  }
  return { title, lines };
}
