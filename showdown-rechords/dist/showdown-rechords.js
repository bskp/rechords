;/*! showdown-rechords 01-10-2017 *//* vim: set tabstop=2:softtabstop=2 */

module.exports = function showdownRechords() {

  require('source-map-support').install();

  var Hypher = require('hypher'),
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
      chords.push('<span class="chord">' + chord + '</span>');
      return '';
    }),
    chunks = h.hyphenate(text),
    out = mergeCoupled(chunks).map(function (s) {
      return '<span class="s">' + s + '</span>';
    }).join('');

    return chords.join('') + out;
  }

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
};

//# sourceMappingURL=showdown-rechords.js.map