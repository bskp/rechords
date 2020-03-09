/* vim: set tabstop=4:softtabstop=4 */

module.exports = function showdownRechords() {
  require('source-map-support').install(); // For mocha.

  function parseLine(match, content) {
    if( content.match(/^\s*$/g) )
      return "</p>\n</div>\n<div>\n<p>";
    var line = content.replace(/^([^\[]+)/, '<i>$1</i>');
    line = line.replace(/\[([^\]]*)\]([^\[]*)/gi, function(match, chord, text) {
      if (text === '') {
        text = ' ';
      }
      if (text.match(/^ ./)) {
        text = '     ' + text.substring(1);
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
        return '<div class="sd-header">\n<h1>' + song + '</h1>\n<h2>' + artist + '</h2>\n</div>\n\n';
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
      regex: /(.*?): *\n((?:[^\n<>]*[^\n:<>]+\n\n?)+)/gi,

      replace: function (match, id, content) {
        var h3 = '';
        if (id) {
          h3 = '<h3>' + id + '</h3>\n';
        }

        content = content.replace(/\n$/, ''); // remove end-of-verser linebreaks
        content = content.replace(/\n{3,}/g, '\n\n'); // remove excessive line breaks
        content = content.replace(/(.*?)\n/g, parseLine);

        var verse = '<section id="sd-ref-' + id + '">\n<div>\n' + 
        h3 + '<p>\n' + content + '</p>' + '\n</div>\n</section>';

        return verse;
      }
    },


    // References
    {
      type: 'lang',
      regex: /-> *(.*?)(?:: *(.*))?\n/gm,
      replace: function(match, ref, annotation) {
        annotation = annotation ? annotation : '';
        return '<div class="ref"><strong>' + ref + '</strong>' + annotation + '</div>';
      }
    },
  ];
};
