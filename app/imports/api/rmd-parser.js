
var showdown = require('showdown');
var rmd = require('showdown-rechords');
const parser = new showdown.Converter({extensions: [rmd]});

showdown.setOption('simpleLineBreaks', true);
showdown.setOption('smoothLivePreview', true);
showdown.setOption('simplifiedAutoLink', true);
showdown.setOption('openLinksInNewWindow', true);

export default class RmdParser {
    constructor(source) {
        this.source = source;

        this.html = parser.makeHtml(source);
        /*
        this.author = match[1];
        this.title = match[2];
        */
    }
}

