import { describe, it } from 'mocha'
import { expect } from 'chai'
import blamejs from './index'

describe('blamejs', () => {
  it('is a function', () => {
    expect(blamejs).to.be.a('function')
  })

  it('returns array containing every line and its origin', () => {
    const codes: Array = [
      {
        id: '0',
        code: `
          REPORT test.

          WRITE 'a'.
        `,
      },
      {
        id: '1',
        code: `
          REPORT test.

          WRITE 'b'.
          WRITE 'c'.
          WRITE 'd'.
        `,
      },
      {
        id: '2',
        code: `
          REPORT test.

          WRITE 'a'.
          WRITE 'c'.
        `,
      },
    ]
    const options: Object = {
      getCode: (item: Object): string => item.code,
      getOrigin: (item: Object): string => item.id,
    }

    expect(blamejs(codes, options)).to.be.a('Array').and.deep.equal([
      {
        origin: '2',
        value: '',
      },
      {
        origin: '2',
        value: '          REPORT test.',
      },
      {
        origin: '2',
        value: '',
      },
      {
        origin: '0',
        value: "          WRITE 'a'.",
      },
      {
        origin: '2',
        value: '',
      },
    ])
  })

  it('returns array containing every line and its index', () => {
    const codes: Array = [
      `
        REPORT test.

        WRITE 'a'.
        WRITE 'd'.
      `,
      `
        REPORT test.

        WRITE 'b'.
        WRITE 'c'.
        WRITE 'd'.
      `,
      `
        REPORT test.

        WRITE 'a'.
        WRITE 'c'.
      `,
    ]

    expect(blamejs(codes)).to.be.a('Array').and.deep.equal([
      {
        origin: 2,
        value: '',
      },
      {
        origin: 2,
        value: '        REPORT test.',
      },
      {
        origin: 2,
        value: '',
      },
      {
        origin: 0,
        value: "        WRITE 'a'.",
      },
      {
        origin: 1,
        value: "        WRITE 'd'.",
      },
      {
        origin: 2,
        value: '',
      },
    ])
  })

  it('returns array containing every line and its origin with trimmed source code', () => {
    const codes: Array = [
      {
        id: '0',
        code: `
          REPORT test2.

          WRITE 'a'.
          WRITE 'd'.
        `,
      },
      {
        id: '1',
        code: `
          REPORT test2.

          WRITE 'b'.
          WRITE 'c'.
          WRITE 'd'.
        `,
      },
      {
        id: '2',
        code: `
          REPORT test.

          WRITE 'a'.
          WRITE 'c'.
        `,
      },
    ]
    const options: Object = {
      getCode: (item: Object): string => item.code,
      getOrigin: (item: Object): string => item.id,
    }

    expect(blamejs(codes, options)).to.be.a('Array').and.deep.equal([
      {
        origin: '2',
        value: '',
      },
      {
        origin: '1',
        value: '          REPORT test2.',
      },
      {
        origin: '2',
        value: '',
      },
      {
        origin: '0',
        value: "          WRITE 'a'.",
      },
      {
        origin: '1',
        value: "          WRITE 'd'.",
      },
      {
        origin: '2',
        value: '',
      },
    ])
  })
})
