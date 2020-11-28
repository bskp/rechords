# blame-js

![npm](https://img.shields.io/npm/v/blame-js.svg)
![license](https://img.shields.io/npm/l/blame-js.svg)
![github-issues](https://img.shields.io/github/issues/hundeloh-consulting/blame-js.svg)
![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)

_blame-js_ compares an array of source codes and outputs information about where each line originates from.
Its behaviour is similar to the blame functionality that is integrated in _Git_.

![nodei.co](https://nodei.co/npm/blame-js.png?downloads=true&downloadRank=true&stars=true)

## Install

`npm install --save blame-js`

## Usage

Pay attention to the order of items in the array: the first one in the array is the newest. The items can either be simple texts or objects. 
The latter requires to pass an `getCode` and `getOrigin` function to be passed in the options (see example 2).
```javascript
const blamejs = require('blame-js');
// or alternatively in ES6 syntax:
// import blamejs from 'blame-js';

/*
Result:
[ { origin: 0, value: 'a' },
  { origin: 0, value: 'b' },
  { origin: 2, value: 'c' } ]
*/
blamejs([`a
b
c`,
`c`,
`a
b
c`
])

/*
Result:
[ { origin: 'Commit #3', value: 'a' },
  { origin: 'Commit #3', value: 'b' },
  { origin: 'Commit #1', value: 'c' } ]
*/
blamejs(
  [
    {
      commit: 'Commit #3',
      code: `a
b
c`,
    },
    {
      commit: 'Commit #2',
      code: `c`,
    },
    {
      commit: 'Commit #1',
      code: `a
b
c`,
    },
  ],
  {
    getCode: item => item.code,
    getOrigin: item => item.commit,
  },
)
```

## Running the tests

Mocha tests are implemented and you can run all tests via
```
npm run test
```

## Built With

* [diff](https://github.com/kpdecker/jsdiff) - a javascript text differencing implementation

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/hundeloh-consulting/blame-js/tags). 

## Authors

* **Julian Hundeloh** - *Initial work* - [jaulz](https://github.com/jaulz)

See also the list of [contributors](https://github.com/hundeloh-consulting/r3connect/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. 
