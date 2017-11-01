import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

var slug = require('slug')
import { Songs } from '../api/collections.js';


class ListItem extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        // Generate url-safe strings if missing
        /*
        if (!this.props.song.hasOwnProperty("author_") || !this.props.song.hasOwnProperty("title_")) {
            this.props.song.author_ = slug(this.props.song.author);
            this.props.song.title_ = slug(this.props.song.title);
            Songs.update(this.props.song._id, this.props.song);
        }
        */
        return (
            <li><NavLink to={`/view/${this.props.song.author_}/${this.props.song.title_}`}
                activeClassName="selected">{this.props.song.title}</NavLink></li>
        );
    }
}

ListItem.propTypes = {
    song: PropTypes.object.isRequired,
};


class ListGroup extends Component {
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
ListGroup.propTypes = {
    songs: PropTypes.array.isRequired,
    label: PropTypes.string.isRequired,
};

export default class List extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let groups = [];
        for (key in this.props.tree) {
            groups.push(key);
        }

        return (
            <aside>
                <ul>
                    {groups.map((group) => 
                        <ListGroup label={group} songs={this.props.tree[group]} key={group}/>
                    )}
                    <li>
                        <h2><NavLink to="/new">Add Song…</NavLink></h2>
                    </li>
                </ul>
            </aside>
        )
    }
}

List.propTypes = {
    tree: PropTypes.object.isRequired
}