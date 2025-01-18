import React, { Component, MouseEventHandler } from "react";
import ChrodLib from "../api/libchrod";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "rc-tooltip/assets/bootstrap.css";

const intervals = new Map([
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
  [17, "Kl. Undezime"],
]);

type TransposeSetterProps = {
  transposeSetter: (halfTones: number) => void;
  transpose: number;
  keym: { key: string; scale: string };
  onDoubleClick: MouseEventHandler;
};

export default class TransposeSetter extends Component<
  TransposeSetterProps,
  never
> {
  constructor(props) {
    super(props);
  }

  handleSlider = (value) => {
    this.props.transposeSetter(Number.parseInt(value, 10));
  };

  render() {
    const keys = {};
    if (this.props.keym) {
      const key = this.props.keym;
      const libChrod = new ChrodLib();
      for (let i = -7; i <= 7; i++) {
        const keyobj = libChrod.shift(key, i);
        keys[i] = keyobj.key;
        if (i == 0) {
          keys[i] += " " + key.scale;
        }
      }
    }
    return (
      <div onDoubleClick={this.props.onDoubleClick} id="transposer">
        <Slider
          min={-7}
          max={7}
          value={this.props.transpose}
          onChange={this.handleSlider}
          marks={keys}
          step={1}
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
    const vz = i < 0 ? "-" : "+";
    return vz + Math.abs(i) + " Halbtöne = " + vz + intervals.get(Math.abs(i));
  }
}
