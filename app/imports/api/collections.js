import { Mongo } from 'meteor/mongo';

var showdown = require('showdown');
var rmd = require('showdown-rechords');
var DOMParser = require('xmldom').DOMParser;
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

export default Songs = new Mongo.Collection('songs');

Songs.helpers({

    getHtml() {
        if (!('html' in this)) {
            this.parse(this.text);
        }
        return this.html;
    },

    parse(md) {
        this.text = md;

        // Create HTML
        this.html = xss(converter.makeHtml(this.text), options);
        this.title = '';
        this.author = '';
        this.tags = [];

        // URL-compatible strings
        this.title_ = '';
        this.author_ = '';

        // this._id may be present or not, but is, most importantly: unaffected!

        // Set Metadata
        let dom = new DOMParser().parseFromString(this.html, "text/html");

        let h1 = dom.getElementsByTagName('h1');
        if (h1.length > 0) {
            this.title = h1[0].textContent;
            this.title_ = slug(this.title);
        }

        let h2 = dom.getElementsByTagName('h2');
        if (h2.length > 0) {
            this.author = h2[0].textContent;
            this.author_ = slug(this.author);
        }


        // Collect all tags
        this.tags = [];
        let uls = dom.getElementsByTagName('ul');
        for (i = 0; i < uls.length; i++) {
            let ul = uls[i];
            if (ul.getAttribute('class') != 'tags') continue;

            let lis = ul.getElementsByTagName('li');
            for (j = 0; j < lis.length; j++) {
                let li = lis[j];
                this.tags.push(li.textContent);
            }
        }

        // TODO verify.
    }

});
