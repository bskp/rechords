import fs from 'fs'
import {showdownRechords} from '../src/showdown-rechords'
import showdown from 'showdown'
import {TestCase} from './types'
import chai from 'chai'
/**
 * This is the default test case
 * The way you test your code is up to you
 * In showdown, we use this particular setup
 */
(function (filename) {

  require('source-map-support').install();
  chai.should();

    const converter = new showdown.Converter({extensions:[showdownRechords]}),
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
    return function (file: string) {
      var ext = file.slice(-3);
      return (ext === '.md');
    };
  }

  function map(dir: string) {
    return function (file: string) {
      var name = file.replace('.md', ''),
        htmlPath = dir + name + '.html',
        html = fs.readFileSync(htmlPath, 'utf8'),
        mdPath = dir + name + '.md',
        md = fs.readFileSync(mdPath, 'utf8');

      return {
        name: name,
        input: md,
        expected: html,
        actual: ''
      };
    };
  }


  //Normalize input/output
  function normalize(testCase: TestCase): TestCase {

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

  function assertion(testCase: TestCase , converter: { makeHtml: (arg0: any) => any; }) {
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
