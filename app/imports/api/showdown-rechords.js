"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showdownRechords = exports.chordFrets = exports.references = exports.verses = exports.verseRegex = exports.tags = exports.title = exports.refPrefix = void 0;
exports.refPrefix = 'sd-ref-';
function parseProsody(text) {
    // Prosodic annotations
    text = text.replace(/_/g, '<u>‿</u>');
    text = text.replace(/\B'\B/g, '<u>’</u>'); // "\B": negierte Wortgrenzen!
    return text;
}
function parseLine(_match, content) {
    if (content.match(/^\s*$/g))
        return '</p>\n</div>\n<div>\n<p>';
    // Match bis zum Einsatz des ersten Akkords:
    var line = content.replace(/^([^[]+)/, function (match) { return '<i>' + parseProsody(match) + '</i>'; });
    // Ab hier wird nun immer vom Akkord beginnend bis zum nächsten Akkord (exkl) gematcht
    line = line.replace(/\[([^\]]*)\]([^[]*)/gi, function (_, chord, text) {
        // Akkorde am Zeilenende ohne folgenden Text
        if (text.match(/^ *$/)) {
            text = ' '; // Text wird als &nbps gesetzt als "Stamm" für den Akkord
        }
        // Line indents
        if (text.match(/^ ./)) {
            text = '     ' + text.substring(1);
        }
        text = parseProsody(text);
        return '<i data-chord="' + chord + '">' + text + '</i>';
    });
    return '<span class="line">' + line + '</span>\n';
}
// Title
exports.title = {
    type: 'lang',
    regex: /([^\n]+)\n([^\n]+\n)?=+\s*\n/,
    replace: function (match, song, artist) {
        artist = artist === null || artist === void 0 ? void 0 : artist.trim();
        var h2 = artist ? '<h2>' + artist + '</h2>\n' : '';
        return '<div class="sd-header">\n<h1>' + song + '</h1>\n' + h2 + '</div>\n\n';
    }
};
exports.tags = {
    type: 'lang',
    regex: /^\s*(#(\S+) *)+\s*$/gm,
    replace: function (tags) {
        return ('<ul class="tags">' +
            tags.replace(/\s*#([^\s:]+)(?::(\S*))?\s*/g, function (match, tag, value) {
                if (value !== undefined) {
                    tag += '<b>' + value + '</b>';
                }
                return '\n    <li>' + tag + '</li>';
            }) +
            '\n</ul>');
    }
};
// Verses
exports.verseRegex = /(.*?): *\n((?:[^\n<>]*[^\n:<>]+\n\n?)+)/gi;
exports.verses = {
    type: 'lang',
    regex: exports.verseRegex,
    replace: function (match, id, content) {
        var h3 = '';
        if (id) {
            h3 = '<h3>' + id + '</h3>\n';
        }
        content = content.replace(/\n$/, ''); // remove end-of-verse linebreaks
        content = content.replace(/\n{3,}/g, '\n\n'); // remove excessive line breaks
        content = content.replace(/(.*?)\n/g, parseLine);
        return "<section id=\"".concat(exports.refPrefix).concat(id, "\">\n<div>").concat(h3, "<p>").concat(content, "</p>\n</div>\n</section>");
    }
};
exports.references = {
    type: 'lang',
    regex: /-> *(.*?)(?:: *(.*))?\n/gm,
    replace: function (match, ref, annotation) {
        annotation = annotation ? annotation : '';
        return "<div class=\"ref\"><strong>".concat(ref, "</strong>").concat(annotation, "</div>");
    }
};
exports.chordFrets = {
    type: 'lang',
    regex: /\n\[([^\]]*)\]: +([0-9a-dx-]{6})\n( *[0-4-x ]{6}\n)?/gm,
    replace: function (match, label, frets, fingers) {
        var df = fingers ? " data-fingers=\"".concat(fingers.trim(), "\"") : '';
        return "<abbr class=\"chord\" title=\"".concat(frets, "\"").concat(df, ">").concat(label, "</abbr>");
    }
};
exports.showdownRechords = [exports.title, exports.tags, exports.verses, exports.references, exports.chordFrets];
