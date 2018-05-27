/* vim: set tabstop=2:softtabstop=2 */

module.exports = function showdownRechords() {

  require('source-map-support').install();

  var Hypher = require('hypher'),
    // TODO: recognize language by heur. or tag
    english = require('hyphenation.en-us'),
    h = new Hypher(english);

  /**
   * Merges every array item ending with '_' with its successor.
   * @param {Array<String>} arr Array of Strings
   */
  function mergeCoupled(arr) {
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

  function parseLine(match, content) {
    // TODO: akkordzeile erkennen und anders behandeln
    var line = content.replace(/\S+ ?/gi, parseWord);
    return line + '<br />'; // line is allowed to be empty.
  }

  function backMap(chunks) {
    var out = [];
    for (var i = 0; i < chunks.length; i++) {
      var c = chunks[i];
      for (var j = 0; j < c.length; j++) {
        out.push(i);
      }
    }
    return out;


  }

  function parseWord(match) {
    // TODO: support multiple chords per word. Currently, all chords bubble up
    // up to the beginning of the word, instead of staying with their syllable.
    // TODO: make chords a class?

    var chords = [], chunks = [];
    var chunkidx = 0;

    var isChord = match[0];

    for (var i = 0; i < match.length; i++ ) {
      if match

    }






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
      regex: /^\s*(#(\S+) *)+\s*$/gm,
      replace: function (tags) {
        return '<ul class="tags">' + tags.replace(/\s*#(\S+)\s*/g, function (match, tag) {
          return '\n    <li>' + tag + '</li>';
        }) + '\n</ul>';
      }
    },

    // Verses
    {
      type: 'lang',
      regex: /([^\n:]+): *\n((.+[^:] *\n)+)(\n+(?=([^\n]+: *\n|\n|$))|$)/gi,

      replace: function (match, id, content) {
        var h3 = '';
        if (id) {
          h3 = '<h3>' + id + '</h3>\n';
        }

        // Process line
        var verse = h3 + '<p>' + content.replace(/(.*?)\n/g, parseLine) + '</p>';

        // Fix last lines
        verse = verse.replace(/(<br \/>)+\s*<\/p>/g, '\n</p>'); // Trim all linebreaks at verse-ends
        verse = verse.replace(/<br \/><br \/>/g, '\n</p><p>'); // 2x line break -> paragraph break
        return verse;
      }
    }
  ];
};
