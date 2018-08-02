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
        return (
          '<ul class="tags">' +
          tags.replace(/\s*#(\S+)\s*/g, function (match, tag) {
            return '\n    <li>' + tag + '</li>';
          }) +
          '\n</ul>'
        );
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
        var verse = h3 + '<p>\n' + content.replace(/(.*?)\n/g, parseLine) + '</p>';
        console.log("{" + verse + "}");

        // Fix last lines
        verse = verse.replace(/<br \/>\n<br \/>/g, '\n</p>\n<p>'); // 2x line break -> paragraph break
        verse = verse.replace(/<p>\s*?<\/p>/g, ''); // drop empty paragraphs
        verse = verse.replace(/(<br \/>)*\s*?<\/p>/g, '\n</p>\n'); // Normalize <br /> and whitespace at paragraph ends
        return verse;
      }
    }
  ];
};
