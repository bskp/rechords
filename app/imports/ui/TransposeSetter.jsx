import React, { Component } from "react";
import ChrodLib from "../api/libchrod.js";
import PropTypes from "prop-types";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "rc-tooltip/assets/bootstrap.css";

var intervals = new Map([
  [0, "Original"],
  [1, "Kl. Sekunde"],
  [2, "Gr. Sekunde"],
  [3, "Kl. Terz"],
  [4, "Gr. Terz"],
  [5, "Quart"],
  [6, "Tritonus"],
  [7, "Quint"],
  [8, "Kl. Sext"],
  [9, "Gr. Sext"],
  [10, "Kl. Sept"],
  [11, "Gr. Sept"],
  [12, "Oktave "],
  [13, "Kl. None"],
  [14, "Gr. None"],
  [15, "Kl. Dezime"],
  [16, "Gr. Dezime"],
  [17, "Kl. Undezime"]
]);

export default class TranposeSetter extends Component {
  constructor(props) {
    super(props);
  }

  handleSlider = value => {
    this.props.transposeSetter(Number.parseInt(value));
  };

  static equivalentShift(pitch) {
    let pit = Number.parseInt(pitch);
    let int = pit / 12;
    let add = Math.ceil(Math.abs(int)) * 12;
    let op = add - Math.abs(pit); // because of the idiotic (unnecessary intervals >12)
    let str = this.intFromPitch(op * Math.sign(pit) * -1);
    return str;
  }

  tipFormatter = v => {
    return v;
  }

  // Inherited from React.Component
  render() {
    // TODO: make object and calculate resulting key
    let marks = {
      "-7": -7,
      '-3': -3,
      // TODO: key here
      0: 'Original',
      3: "+3",
      7: "+7"
    };
    if ( this.props.keym) {
      let key = this.props.keym;
      let keys = {};
      let libChrod = new ChrodLib();
      for (var i=-7; i<=7; i++) {
        let keyobj = libChrod.shift(key, i);
        keys[i] = keyobj.key;  
        if (i==0) { keys[i]+=" "+key.scale}
      }
      marks = keys;
    }
    return (
      <div onDoubleClick={this.props.onDoubleClick} id={this.props.id}>
          <Slider
            id="typeinp"
            min={-7}
            max={7}
            name="relTranspose"
            value={this.props.transpose}
            onChange={this.handleSlider}
            marks = {marks}
            step={1}
            tipFormatter = {this.tipFormatter}
            dots
            vertical={true}
          />
      </div>
    );
  }
  /**
   * 
   * @param {number} i 
   */
  static intFromPitch(i) {
    let vz = i < 0 ? "-" : "+";
    return vz + Math.abs(i) + " Halbtöne = " + vz + intervals.get(Math.abs(i));
  }
}

TranposeSetter.propTypes = {
  transposeSetter: PropTypes.func,
  transpose: PropTypes.number,
  key: PropTypes.string
};
