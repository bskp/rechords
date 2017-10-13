
var showdown = require('showdown');
var rmd = require('showdown-rechords');
var xss = require('xss');
var options = {
  whiteList: {
    a: ['href', 'title'],
    span: ['class'],
    h1: [],
    h2: [],
    h3: [],
    ul: ['class'],
    li: [],
    p: [],
    br: []
  }
};
const parser = new showdown.Converter({extensions: [rmd]});

showdown.setOption('simpleLineBreaks', true);
showdown.setOption('smoothLivePreview', true);
showdown.setOption('simplifiedAutoLink', true);
showdown.setOption('openLinksInNewWindow', true);

export default class RmdParser {
  constructor(md) {
    this.md = md;

    this.html = xss(parser.makeHtml(md), options);
    this.dom = new DOMParser().parseFromString(this.html, "text/html");

    this.title = '';
    this.author = '';

    let h1 = this.dom.getElementsByTagName('h1');
    if (h1.length > 0) {
      this.title = h1[0].innerText;
    }

    let h2 = this.dom.getElementsByTagName('h2');
    if (h2.length > 0) {
      this.author = h2[0].innerText;
    }

    this.tags = [];

    let tags = this.dom.getElementsByClassName('tags');
    if (tags.length > 0) {
      for (let tag of tags[0].children) {
        this.tags.push( tag.innerText );
      }
    }

  }
}
