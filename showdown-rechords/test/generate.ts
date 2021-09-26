import showdown from 'showdown'
import ext from '../src/showdown-rechords'

import fs from 'fs'
import path from 'path'

var converter = new showdown.Converter({ extensions: [ext] });
var cases = fs.readdirSync(path.join(__dirname, 'cases'))
  .filter(filter());
cases.forEach(w => generate(path.join(__dirname, 'cases',w)));
    

function generate(file: string) {
  var name = file.replace('.md', ''),
    htmlPath =  name + '.html',
    //   html = fs.readFileSync(htmlPath, 'utf8'),
    mdPath =  name + '.md',
    md = fs.readFileSync(mdPath, 'utf8');
  var html = converter.makeHtml(md);
  fs.writeFileSync(htmlPath, html, 'utf8');

};

function filter() {
  return function (file: string ) {
    var ext = file.slice(-3);
    return (ext === '.md');
  };
}