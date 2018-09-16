import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {Song} from '../api/collections';


interface ListItemProps {
    song: Song;
}
class ListItem extends React.Component<ListItemProps, {}> {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <li><NavLink to={`/view/${this.props.song.author_}/${this.props.song.title_}`}
                activeClassName="selected">{this.props.song.title}</NavLink></li>
        );
    }
}



interface ListGroupProps {
  songs: Array<Song>;
  label: String;
}
class ListGroup extends React.Component<ListGroupProps, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li key={this.props.label}>
                <h2>{this.props.label}</h2>
                <ul>
                    {this.props.songs.map((song) => 
                        <ListItem song={song} key={song._id} />
                    )}
                </ul>
            </li>
        )
    }
}



interface ListProps {
  songs: Array<Song>;
}
export default class List extends React.Component<ListProps, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        let tree = {};

        this.props.songs.forEach((song) => {
            if (tree[song.author] === undefined) {
                tree[song.author] = [];
            }
            tree[song.author].push(song);
        });

        let groups = [];
        for (let key in tree) {
            groups.push(key);
        }

        return (
            <aside id="list">
                <ul>
                    {groups.map((group) => 
                        <ListGroup label={group} songs={tree[group]} key={group}/>
                    )}
                    <li>
                        <h2><NavLink to="/new">+ Neues Lied</NavLink></h2>
                    </li>
                </ul>
            </aside>
        )
    }
}