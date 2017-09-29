/* vim: set tabstop=2:softtabstop=2 */
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

  showdown.setOption('simpleLineBreaks', true);
  showdown.setOption('smoothLivePreview', true);
  showdown.setOption('simplifiedAutoLink', true);
  showdown.setOption('openLinksInNewWindow', true);

  var Hypher = require('hypher'),
    german = require('hyphenation.de'),
    english = require('hyphenation.en-us'),
    h = new Hypher(english),
    lineRegex = /(.+?\n)/gi,
    wordRegex = /\S+ ?/gi,
    chordRegex = /\[(.+?)\]/gi;

  function parseLine (match, content) {
    // TODO: akkordzeile erkennen und anders behandeln
    return content.replace(wordRegex, parseWord) + '<br />';
  }

  function mergeCoupled (arr) {
    var pending = '',
        out = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].endsWith('_')) {
        pending = arr[i].replace('_', ' ');
        continue;
      }
      out.push(pending + arr[i]);
    }
    return out;
  }

  function parseWord (match) {
    var chords = [],
    text = match.replace(chordRegex, function (match, chord) {
      chords.push('\n<span·class="chord">' + chord + '</span>');
      return '';
    }),
    chunks = h.hyphenate(text),
    out = mergeCoupled(chunks).map(function (s) {
      return '\n<span·class="s">' + s + '</span>';
    }).join('');

    return chords.join('') + out;
  }

  // The following method will register the extension with showdown
  showdown.extension('showdown-rechords', function () {

    return [
      // Title
      {
        type: 'lang',
        regex: /([^\n]+)\n([^\n]+)\n=+\n/,
        replace: function (match, song, artist) {
          return '<h1>' + song + '</h1>\n<h2>' + artist + '</h2>\n\n';
        }
      },

      // Tags
      {
        type: 'lang',
        regex: /(#(\S+) *)+/,
        replace: function (tags) {
          return '<ul class="tags">' + tags.replace(/#(\S+) */g, function (match, tag) {
            return '\n    <li>' + tag + '</li>';
          }) + '\n</ul>';
        }
      },

      // Verses
      {
        type: 'lang',
        regex: /([^\n]+):\W*\n((.+\n)+)\n/gi,
        replace: function (match, id, content) {
          return '<h3>' + id + '</h3>\n<p>' + content.replace(lineRegex, parseLine).replace(/<br \/>$/, '') + '</p>';
        }
      }
    ];
  });
}));
