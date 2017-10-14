
var showdown = require('showdown');
var rmd = require('showdown-rechords');
var slug = require('slug')
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
const converter = new showdown.Converter({ extensions: [rmd] });

showdown.setOption('simpleLineBreaks', true);
showdown.setOption('smoothLivePreview', true);
showdown.setOption('simplifiedAutoLink', true);
showdown.setOption('openLinksInNewWindow', true);

export default function parse(song) {
  // Create HTML
  song.html = xss(converter.makeHtml(song.text), options);
  song.title = '';
  song.author = '';
  song.tags = [];

  // URL-compatible strings
  song.title_ = '';
  song.author_ = '';

  // song._id may be present or not, but most importantly: unaffected!

  // Set Metadata
  let dom = new DOMParser().parseFromString(song.html, "text/html");

  let h1 = dom.getElementsByTagName('h1');
  if (h1.length > 0) {
    song.title = h1[0].innerText;
    song.title_ = slug(song.title);
  }

  let h2 = dom.getElementsByTagName('h2');
  if (h2.length > 0) {
    song.author = h2[0].innerText;
    song.author_ = slug(song.author);
  }

  let tags = dom.getElementsByClassName('tags');
  if (tags.length > 0) {
    for (let tag of tags[0].children) {
      song.tags.push(tag.innerText);
    }
  }

  return song;
}
