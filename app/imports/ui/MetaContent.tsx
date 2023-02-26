import { Song } from '../api/collections';
import * as React from 'react';
import { DetailedReactHTMLElement } from 'react';
import parse, { DOMNode, domToReact } from 'html-react-parser';


interface Props {
  title: string;
  className?: string;
  songs: Array<Song>;
  replace?: (
    domNode: DOMNode
  ) => JSX.Element | Record<string,unknown> | void | undefined | null | false;
}

export default class MetaContent extends React.Component<Props, {}> {
  content: ReturnType<typeof domToReact>;

  constructor(props) {
    super(props);

    const matches : Array<Song> = this.props.songs.filter((song : Song) => {
      return song.author == 'Meta' && song.title == this.props.title;
    });
    if (matches.length == 0) {
      this.content = <span>No match for {this.props.title}!</span>;

    } else {
      const html = matches[0].getHtml();

      this.content = parse(html, {replace: this.props.replace});
    }
  }


  render() {
    return (
      <div className={this.props.className}>{this.content}</div>
    );
  }

}
