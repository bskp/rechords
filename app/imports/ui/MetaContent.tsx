import { Song } from '../api/collections.js';
import * as React from 'react';


interface Props {
  title: String;
  songs: Array<Song>;
}

export default class MetaContent extends React.Component<Props, {}> {
    content: object;
    other: object;

    constructor(props) {
        super(props);
        let { title, ...other } = props;
        this.other = other;
        
        let matches : Array<Song> = this.props.songs.filter((song : Song) => {
            return song.author == 'Meta' && song.title == this.props.title;
        })
        if (matches.length == 0) {
            this.content = <span>No match for {this.props.title}!</span>;
        } else {
            this.content = matches[0].getVirtualDom();
        }
    }


    render() {
        return (
            <div {...this.other}>{this.content}</div>
        );
    }

}