var showdown = require('showdown');
var ext = require('../src/showdown-rechords.js')

var fs = require('fs');
var converter = new showdown.Converter({ extensions: [ext] });
var cases = fs.readdirSync('cases/')
  .filter(filter());
cases.forEach(w => generate('cases/'+w));
    

function generate(file) {
  var name = file.replace('.md', ''),
    htmlPath =  name + '.html',
    //   html = fs.readFileSync(htmlPath, 'utf8'),
    mdPath =  name + '.md',
    md = fs.readFileSync(mdPath, 'utf8');
  var html = converter.makeHtml(md);
  fs.writeFileSync(htmlPath, html, 'utf8');

};

function filter() {
  return function (file) {
    var ext = file.slice(-3);
    return (ext === '.md');
  };
}