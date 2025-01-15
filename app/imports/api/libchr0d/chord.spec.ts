import {describe, it} from "node:test";
import Chord_ from "/imports/api/libchr0d/chord";
import assert from 'assert';

describe('Chord', () => {
  it('should parse B7 correctly', ()=> {
    assert.equal(Chord_.from("(B7)"), null)
  })
})