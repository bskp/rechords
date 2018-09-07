/* vim: set tabstop=4:softtabstop=4 */

module.exports = function showdownRechords() {
  require('source-map-support').install(); // For mocha.

  function parseLine(match, content) {
    var line = content.replace(/^([^\[]+)/, '<i>$1</i>');
    line = line.replace(/\[([^\]]*)\]([^\[]*)/gi, function(match, chord, text) {
      if (text === '') {
        text = ' ';
      }
      return '<i data-chord="' + chord + '">' + text + '</i>';
    });
    return '<span class="line">' + line + '</span>\n';
  }

  return [
    // Title
    {
      type: 'lang',
      regex: /([^\n]+)\n([^\n]+)\n=+\s*\n/,
      replace: function (match, song, artist) {
        return '<h1>' + song + '</h1>\n<h2>' + artist + '</h2>\n\n';
      }
    },

    // Tags
    {
      type: 'lang',
      regex: /^\s*(#(\S+) *)+\s*$/gm,
      replace: function (tags) {
        return (
          '<ul class="tags">' +
          tags.replace(/\s*#([^\s:]+)(?::(\S*))?\s*/g, function (match, tag, value) {
            if (value !== undefined) {
              tag += '<b>' + value + '</b>';
            }
            return '\n    <li>' + tag + '</li>';
          }) +
          '\n</ul>'
        );
      }
    },

    // Verses
    {
      type: 'lang',
      regex: /(.*?): *\n((?:[^\n:\-<>]*\n)+)/gi,

      replace: function (match, id, content) {
        var h3 = '';
        if (id) {
          h3 = '<h3>' + id + '</h3>\n';
        }

        content = content.replace(/\n$/, ''); // remove end-of-verser linebreaks
        content = content.replace(/\n{3,}/g, '\n\n'); // remove excessive line breaks
        content = content.replace(/(.*?)\n/g, parseLine);

        var verse = h3 + '<p>\n' + content + '</p>';

        return verse;
      }
    },


    // References
    {
      type: 'lang',
      regex: /-> *(.*)\n/gm,
      replace: function(match, ref) {
        return '<div class="ref">' + ref + '</div>';
      }
    },
  ];
};
