import React, { Component } from "react";
import PropTypes from "prop-types";

export default class TranposeSetter extends Component {
  constructor(props) {
    super(props);
    this.transpose = 2;
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

  // Inherited from React.Component
  render() {
    // TODO: make object and calculate resulting key
    const options = [];
    const selection = 2; //convertthis.props.selection;
    let intervalls = new Map([
      [0, "Nulline"],
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

    for (var i = -17; i <= 17; i++) {
      var selected = false;
      if (i === selection) {
        const selected = true;
      }
      let vz = (i<0?'-':'+');
      let desc = vz+Math.abs(i)+' / '+vz+intervalls.get(Math.abs(i));
      options.push({ key: i , desc: desc});
    }
    return (
      <div name="transposer">
        <select
          name="relTranspose"
          onChange={this.doSomething}
          type="number"
          id="relativeTransposeInput"
          defaultValue="0"
        >
          {options.map(o => (
            <option key={o.key} value={o.key}>
              {o.desc}
            </option>
          ))}
        </select>
        <span>{JSON.stringify(this.state)}</span>
      </div>
    );
  }
}

TranposeSetter.propTypes = {
  doshit: React.PropTypes.func
};
