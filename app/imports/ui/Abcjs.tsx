import * as React from 'react'
import { PureComponent } from 'react'

const  abcjs  = require("abcjs");



// Typescript Version of https://github.com/rigobauer/react-abcjs

interface AbcjsProps {
    abcNotation: string,
    parserParams: object,
    engraverParams: object,
    renderParams: object,
}

export class Abcjs extends PureComponent<AbcjsProps> {
    uniqueNumber = Date.now() + Math.random()

    static defaultProps = {
        abcNotation: '',
        parserParams: {},
        engraverParams: { responsive: 'resize' },
        renderParams: { viewportHorizontal: true },
    }

    renderAbcNotation(abcNotation, parserParams, engraverParams, renderParams) {
        const res = abcjs.renderAbc(
            'abcjs-result-' + this.uniqueNumber,
            abcNotation,
            parserParams,
            engraverParams,
            renderParams
        )
    }

    componentDidMount() {
        const { abcNotation, parserParams, engraverParams, renderParams } = this.props
        this.renderAbcNotation(abcNotation, parserParams, engraverParams, renderParams)
    }

    componentDidUpdate() {
        const { abcNotation, parserParams, engraverParams, renderParams } = this.props
        this.renderAbcNotation(abcNotation, parserParams, engraverParams, renderParams)
    }

    render() {
        return (
            <div style={{ width: '100%' }} className="abc-notation">
                <div id={'abcjs-result-' + this.uniqueNumber} style={{ width: '100%' }} />
            </div>
        )
    }
}
