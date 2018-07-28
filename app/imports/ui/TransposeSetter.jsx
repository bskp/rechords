import React, { Component } from "react";
import ChrodLib from "../api/libchrod.js";
import PropTypes from "prop-types";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "rc-tooltip/assets/bootstrap.css";
const createSliderWithTooltip = Slider.createSliderWithTooltip;

// Javascript style "static" import
var abs = Math.abs,
  sign = Math.sign;
var intervalls = new Map([
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
    let initialTranspose = this.props.intialTranspose
      ? this.props.intialTranspose
      : 0;
    this.state = { relTranspose: initialTranspose };
  }

  doSomething = event => {
    console.log(event);
    const target = event.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
    this.props.doshit(Number.parseInt(value));
  };

  handleSlider = value => {
    this.setState({
      relTranspose: value
    });
    this.props.doshit(Number.parseInt(value));
  };

  static equivalentShift(pitch) {
    let pit = Number.parseInt(pitch);
    let int = pit / 12;
    let add = Math.ceil(abs(int)) * 12;
    let op = add - abs(pit); // because of the idiotic (unnecessary intervals >12)
    let str = this.intFromPitch(op * sign(pit) * -1);
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
      <div id="transposer">
          <Slider
            id="typeinp"
            min={-7}
            max={7}
            name="relTranspose"
            value={this.state.relTranspose}
            onChange={this.handleSlider}
            marks = {marks}
            step={1}
            tipFormatter = {this.tipFormatter}
            dots
            vertical={true}
          />
        {/*<span>{TranposeSetter.intFromPitch(this.state.relTranspose)}</span> */}
        {/* &#8644;
        <span id="equiv">
          {TranposeSetter.equivalentShift(this.state.relTranspose)}
        </span> */}
        {/*<span>{JSON.stringify(this.state)}</span>*/}
      </div>
    );
  }
  /**
   * 
   * @param {number} i 
   */
  static intFromPitch(i) {
    let vz = i < 0 ? "-" : "+";
    return vz + Math.abs(i) + " Halbtöne = " + vz + intervalls.get(Math.abs(i));
  }
}

// ToDO: convert to tsx
TranposeSetter.propTypes = {
  doshit: PropTypes.func,
  initialTranspose: PropTypes.number,
  key: PropTypes.string
};
