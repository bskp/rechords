import React from 'react'
import PropTypes from 'prop-types'

const offsets = {
  4: {
    x: 10,
    y: 10,
    length: 40
  },
  6: {
    x: 0,
    y: 0,
    length: 50
  }
}

const getNeckHorizonalLine = (pos, strings) =>
  `M ${offsets[strings].x} ${12 * pos} H ${offsets[strings].length}`

const getNeckVerticalLine = (pos, strings) =>
  `M ${offsets[strings].y + pos * 10} 0 V 48`

const getNeckPath = (strings, fretsOnChord) =>
  Array.apply(null, Array(fretsOnChord + 1)).map((_, pos) => getNeckHorizonalLine(pos, strings)).join(' ').concat(
    Array.apply(null, Array(strings)).map((_, pos) => getNeckVerticalLine(pos, strings)).join(' '))

const getBarreOffset = (strings, frets, baseFret, capo) => {
    let offset = -6;
    if (capo || frets[0] == 1) offset += -3;
    return offset;
}

const Neck = ({ tuning, frets, strings, fretsOnChord, baseFret, capo, lite }) => {
  return <g className='fret'>
    <path
      d={getNeckPath(strings, fretsOnChord)} />
    { baseFret === 1
      ? <rect
        width={offsets[strings].length}
        x={offsets[strings].x}
        y="-2"
        height="2"
      />
      : <text
        className='basefret'
        textAnchor='end'
        x={getBarreOffset(strings, frets, baseFret, capo)}
        y='10'
      >{baseFret}.</text> }
    { !lite &&
      <g>
        { tuning.slice().map((note, index) =>
          <text
            key={index}
            fontSize='0.3rem'
            fill='#444'
            fontFamily='Verdana'
            textAnchor='middle'
            x={offsets[strings].x + index * 10}
            y='53'
          >{note}</text>
        )}
      </g>
    }
  </g>
}

Neck.propTypes = {
  tuning: PropTypes.array,
  frets: PropTypes.array,
  capo: PropTypes.bool,
  strings: PropTypes.number.isRequired,
  baseFret: PropTypes.oneOf([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ]),
  fretsOnChord: PropTypes.number.isRequired,
  lite: PropTypes.bool
}

Neck.defaultProps = {
  baseFret: 1,
  lite: false
}

export default Neck
