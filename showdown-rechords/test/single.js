/**
 * This is the default test case
 * The way you test your code is up to you
 * In showdown, we use this particular setup
 */
// TODO: make common module
(function (filename) {
  if (arguments.length === 0)  {}
  // do nothing
  else {
    grunt.log.writeln(filename);
  }
  


  require('source-map-support').install();
  var showdown = require('showdown'),
      ext = require('../src/showdown-rechords.js');
  require('chai').should();

  var fs = require('fs'),
  // TODO: I did not yet figure out how 
  // to pass argumements from grunt to the simplemocha task
  // Therefore one task is hardcoded
  // The filename is hardcoded overwriting the filter function (see below)
      converter = new showdown.Converter({extensions: [ext]}),
      cases = fs.readdirSync('test/cases/')
        .filter(filter())
        .map(map('test/cases/')),
      issues = fs.readdirSync('test/issues/')
        .filter(filter())
        .map(map('test/issues/'));

  // Test cases
  describe('Rechords Extension testcases', function () {
    for (var i = 0; i < cases.length; ++i) {
      it(cases[i].name, assertion(cases[i], converter));
    }
  });

  function filter() {
    return function (file) {
      // HERE: change the name to current dev test
      return (file === 'chords_only.md');
    };
  }

  function map(dir) {
    return function (file) {
      var name = file.replace('.md', ''),
        htmlPath = dir + name + '.html',
        html = fs.readFileSync(htmlPath, 'utf8'),
        mdPath = dir + name + '.md',
        md = fs.readFileSync(mdPath, 'utf8');

      return {
        name:     name,
        input:    md,
        expected: html
      };
    };
  }

  //Normalize input/output
  function normalize(testCase) {

    // Normalize line returns
    testCase.expected = testCase.expected.replace(/\r/g, '');
    testCase.actual = testCase.actual.replace(/\r/g, '');

    // Ignore all leading/trailing whitespace
    testCase.expected = testCase.expected.split('\n').map(function (x) {
      return x.trim();
    }).join('\n');
    testCase.actual = testCase.actual.split('\n').map(function (x) {
      return x.trim();
    }).join('\n');

    // Remove extra lines
    testCase.expected = testCase.expected.trim();

    // One bracketed statement per line for easier diffability (@rom)
    testCase.expected = testCase.expected.replace(/([^\n])(<[^/])/g, '$1\n$2');
    testCase.actual = testCase.actual.replace(/([^\n])(<[^/])/g, '$1\n$2');

    // Convert whitespace to a visible character so that it shows up on error reports
    testCase.expected = testCase.expected.replace(/ /g, '·');
    testCase.expected = testCase.expected.replace(/\n/g, '•\n');
    testCase.actual = testCase.actual.replace(/ /g, '·');
    testCase.actual = testCase.actual.replace(/\n/g, '•\n');

    return testCase;
  }

  function assertion(testCase, converter) {
    return function () {
      testCase.actual = converter.makeHtml(testCase.input);
      testCase = normalize(testCase);

      // Compare
      testCase.actual.should.equal(testCase.expected);
    };
  }

  module.exports = {
    assertion: assertion,
    cases: cases,
    issues: issues
  };
})();
