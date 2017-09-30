import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {NavLink} from 'react-router-dom';

var slug = require('slug')
import {Songs} from '../api/collections.js';


class ListItem extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        // Generate url-safe strings if missing
        if (!this.props.song.hasOwnProperty("author_") || !this.props.song.hasOwnProperty("title_")) {
            this.props.song.author_ = slug(this.props.song.author);
            this.props.song.title_ = slug(this.props.song.title);
            Songs.update(this.props.song._id, this.props.song);
        }
        return (
            <li><NavLink to={`/s/${this.props.song.author_}/${this.props.song.title_}`}
                         activeClassName="selected">{this.props.song.title}</NavLink></li>
        );
    }
}

ListItem.propTypes = {
    song: PropTypes.object.isRequired,
};

export default class List extends Component {

    render() {
        return (
            <aside>
                <ul>
                    {this.props.songs.map((song) => (
                        <ListItem song={song} key={song._id}/>
                    ))}
                    <li>
                        <NavLink to="/new">New Song…</NavLink>
                    </li>
                </ul>
            </aside>
        )
    }
}
