var showdown = require("showdown");
var rmd = require("showdown-rechords");
const parser = new showdown.Converter({ extensions: [rmd] });

showdown.setOption("simpleLineBreaks", true);
showdown.setOption("smoothLivePreview", true);
showdown.setOption("simplifiedAutoLink", true);
showdown.setOption("openLinksInNewWindow", true);

export default class RmdParser {
  constructor(md) {
    this.md = md;

    this.html = parser.makeHtml(md);
    this.dom = new DOMParser().parseFromString(this.html, "text/html");

    this.title = "";
    this.author = "";

    let h1 = this.dom.getElementsByTagName("h1");
    if (h1.length > 0) {
      this.title = h1[0].innerText;
    }

    let h2 = this.dom.getElementsByTagName("h2");
    if (h2.length > 0) {
      this.author = h2[0].innerText;
    }

    this.collectTags()
    this.collectChords()
  }

  collectTags() {
    this.tags = [];

    // This is bad variable naming even though it
    // is clear in case of javascript (enforced this)
    let tags = this.dom.getElementsByClassName("tags");
    if (tags.length > 0) {
      for (let tag of tags[0].children) {
        this.tags.push(tag.innerText);
      }
    }
  }
  collectChords() {
    this.chords = [];

    let chords = this.dom.getElementsByClassName("chord");
    console.log(chords)

    if (chords.length > 0) {
      for (let chord of chords) {
        this.chords.push(chord.innerText);
      }
    }
  }
}
