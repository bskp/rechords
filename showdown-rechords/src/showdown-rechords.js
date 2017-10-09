/* vim: set tabstop=2:softtabstop=2 */

module.exports = function showdownRechords() {

  require('source-map-support').install();

  var Hypher = require('hypher'),
    english = require('hyphenation.en-us'),
    h = new Hypher(english),
    lineRegex = /(.+?)(\n\n?)/gi,
    wordRegex = /\S+ ?/gi,
    chordRegex = /\[(.+?)\]/gi;

  function parseLine (match, content, nl) {
    // TODO: akkordzeile erkennen und anders behandeln
    var line = content.replace(wordRegex, parseWord);
    if (nl.length > 1) {
      return line + '\n</p><p>';
    } else {
      return line + '<br>';
    }
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
      // regex: /([^\n]+): *\n((.+[^:] *\n)+)(\n+(?=([^\n]+: *\n|\n|$))|$)/gi,
      // Wouldn't a regex like this do the job?
      regex: /(?:(.+): *\n)?(([^:\n]+(\n{1,2}|$))+)(?!\n{3,}|\n{2,}[^:]+:)/gi,
      // However, don't get what the three arguments are...
      replace: function (match, id, content) {
        console.log(JSON.stringify({
          match: match,
          id: id,
          content: content
        }));
        var id_string = '';
        if(id) {
          id_string = '<h3>' + id + '</h3>\n';
        }
        //verse.replace('<br /><br />', '</p><p>');
          var verse = id_string +'<p>' + content.replace(lineRegex, parseLine) + '</p>';
        verse = verse.replace(/<br \/>\s*<\/p>/g, '\n</p>');
        return verse;
      }
    }
  ];
};
