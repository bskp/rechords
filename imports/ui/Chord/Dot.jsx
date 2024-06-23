import React from 'react';
import PropTypes from 'prop-types';

const positions = {
  string: [ 50, 40, 30, 20, 10, 0 ],
  fret: [ -6, 6, 18, 30, 42, 54 ],
};

const offset = {
  4: 0,
  6: -1
};

const getStringPosition = (string, strings) =>
  positions.string[ string + offset[strings] ];

const radius = {
  muted: 2.5,
  open: 2.5,
  fret: 5
};

const Dot = ({ string, fret, finger, strings, lite }) => {
  const x = getStringPosition(string, strings);
  const y = positions.fret[fret < 0 ? 0 : fret];

  if (fret === -1) return <g class='dot muted'>
    <line 
      x1={x - radius.muted}
      x2={x + radius.muted}
      y1={y - radius.muted}
      y2={y + radius.muted}
    />
    <line 
      x1={x + radius.muted}
      x2={x - radius.muted}
      y1={y - radius.muted}
      y2={y + radius.muted}
    />
  </g>;

  return <g className={'dot' + (fret === 0 ? ' open' : '')}>
    <circle
      cx={x}
      cy={y}
      r={fret === 0 ? radius.open : radius.fret}
    />
    { !lite && finger > 0 && fret !== 0 &&
      <text
        x={x}
        y={y + radius.fret/2}
      >{ finger }</text>}
  </g>;
};

Dot.propTypes = {
  string: PropTypes.number,
  fret: PropTypes.number,
  finger: PropTypes.oneOf([ 0, 1, 2, 3, 4, 5 ]),
  strings: PropTypes.number.isRequired,
  lite: PropTypes.bool
};

Dot.defaultProps = {
  fret: 0,
  lite: false
};

export default Dot;
