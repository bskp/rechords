import * as React from 'react';
import { PureComponent } from 'react';

const  abcjs  = require('abcjs');



// Typescript Version of https://github.com/rigobauer/react-abcjs

interface AbcjsProps {
    abcNotation: string,
    parserParams: unknown,
    engraverParams: unknown,
    renderParams: unknown,
}

const  regular = 'Roboto 12';
const  bold = regular + ' bold';

export class Abcjs extends PureComponent<AbcjsProps> {
  uniqueNumber = Date.now() + Math.random();

  static defaultProps = {
    abcNotation: '',
    parserParams: {
      paddingtop: 0,
      paddingbottom: 0,
      paddingright: 0,
      paddingleft: 0,
      add_classes: true,
      format: {
        gchordfont: bold,
        annotationfont: bold,
        vocalfont: regular,
        composerfont: regular,
        footerfont: regular,
        headerfont: regular,
        historyfont: regular,
        infofont: regular,
        measurefont: regular,
        partsfont: regular,
        repeatfont: regular,
        subtitlefont: regular,
        tempofont: regular,
        textfont: regular,
        titlefont: regular,
        voicefont: regular,
        wordsfont: regular,
      }
    },
    engraverParams: {},
    renderParams: { viewportHorizontal: true },
  };

  renderAbcNotation(abcNotation, parserParams, engraverParams, renderParams) {
    const res = abcjs.renderAbc(
      'abcjs-result-' + this.uniqueNumber,
      abcNotation,
      {...Abcjs.defaultProps.parserParams, ...parserParams},
      engraverParams,
      {...Abcjs.defaultProps.renderParams, ...renderParams}
    );
  }

  componentDidMount() {
    const { abcNotation, parserParams, engraverParams, renderParams } = this.props;
    this.renderAbcNotation(abcNotation, parserParams, engraverParams, renderParams);
  }

  componentDidUpdate() {
    const { abcNotation, parserParams, engraverParams, renderParams } = this.props;
    this.renderAbcNotation(abcNotation, parserParams, engraverParams, renderParams);
  }

  render() {
    return (
      <div className="abc-notation">
        <div id={'abcjs-result-' + this.uniqueNumber} style={{ width: '100%' }} />
      </div>
    );
  }
}
