/**
 * Showdown's Extension boilerplate
 *
 * A boilerplate from where you can easily build extensions
 * for showdown
 */
(function (extension) {

  // UML - Universal Module Loader
  // This enables the extension to be loaded in different environments
  if (typeof showdown !== 'undefined') {
    // global (browser or nodejs global)
    extension(showdown);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['showdown'], extension);
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    module.exports = extension(require('showdown'));
  } else {
    // showdown was not found so we throw
    throw Error('Could not find showdown library');
  }

}(function (showdown) {

  //This is the extension code per se

  // Here you have a safe sandboxed environment where you can use "static code"
  // that is, code and data that is used accros instances of the extension itself
  // If you have regexes or some piece of calculation that is immutable
  // this is the best place to put them.
  require('source-map-support').install();

  var Hypher = require('hypher'),
    german = require('hyphenation.de'),
    english = require('hyphenation.en-us'),
    h = new Hypher(english),
    verseRegex = /([^\n]+):\W*\n((.+\n)+)\n/gi,
    lineRegex = /(.+?\n)/gi,
    wordRegex = /\S+/gi,
    chordRegex = /\[(.+?)\]/gi;

  function parseVerse (match, id, content) {
    return '<h3>' + id + '</h3>\n<p>\n' + content.replace(lineRegex, parseLine) + '</p>';
  }

  function parseLine (match, content) {
    // TODO: akkordzeile erkennen und anders behandeln
    return content.replace(wordRegex, parseWord) + '<br />\n';
  }

  function parseWord (match) {
    match += ' ';  // re-append swallowed space
    // TODO: akkorde herausfischen (nicht nur löschen, wie jetzt), und vor der
    // jeweiligen silbe einsetzen.
    var text = match.replace(chordRegex, ''),
        out = h.hyphenate(text).map(function (s) {
      return '<span·class="s">' + s + '</span>\n';
    }).join('');

    return out;
  }

  // The following method will register the extension with showdown
  showdown.extension('showdown-rechords', function () {

    return {
      type: 'lang', //or output
      filter: function (text, converter, options) {
        // your code here
        // ...
        // text is the text being parsed
        // converter is an instance of the converter
        // ...
        // don't forget to return the altered text. If you don't, nothing will appear in the output
        return text.replace(verseRegex, parseVerse);
      }
    };
  });
}));
