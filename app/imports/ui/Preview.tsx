import Songs, {Song} from '../api/collections.js';
import * as React from 'react';

interface P {
  md: string;
  song: Song;
}

export default class Preview extends React.Component<P, {}> {

  constructor(props : P) {
    super(props);
  }

  render() {
    if (this.props.md) {
      this.props.song.parse(this.props.md);
    }

    return (
      <section
        className="content"
        id="chordsheet"
        ref="html"
        dangerouslySetInnerHTML={{ __html: this.props.song.getHtml() }}
      />
    )
  }
}