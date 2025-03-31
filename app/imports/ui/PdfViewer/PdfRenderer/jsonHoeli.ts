import { Song } from "/imports/api/collections";

export function parseToIntermediateFormat(song: Song) {
  const mdHtml = new DOMParser().parseFromString(song.getHtml(), "text/html");

  const sections_ = mdHtml.body.children;

  const sections: {}[] = [];
  for (let i = 0; i < sections_.length; i++) {
    const el = sections_[i];
    if (el.tagName === "SECTION") {
      sections.push({ type: "chordblock", content: mapChordBlock(el) });
    } else if (el.tagName === "P") {
      sections.push({ type: "comment", content: el.textContent });
    } else if (el.tagName === "DIV" && el.classList.contains("ref")) {
      const [{ textContent: ref }, adm_] = el.childNodes;

      const adm = adm_?.textContent;
      if (sections_[i + 1].classList.contains("inlineReference")) {
        // todo
        sections.push({
          type: "repetition",
          content: mapChordBlock(sections_[i + 1]),
          ref,
          adm,
        });
        i++;
      } else {
        sections.push({ type: "repetition", ref, adm });
      }
    }
  }
  const author = song.author;
  const title = song.title;

  return { author, title, sections };
}
function mapChordBlock(section: Element) {
  let title = section.querySelector("h3")?.innerText;
  let lines = [];
  for (const p of section.querySelectorAll("p")) {
    for (const line of p.querySelectorAll("span.line")) {
      const fragments = Array.from(line.children).map((c) => ({
        text: c.innerText,
        chord: c.dataset?.chord,
      }));
      lines.push(fragments);
    }
    const l = lines[lines.length - 1];
    lines[lines.length - 1] = { ...l, canbreak: true };
  }
  return { title, lines };
}
