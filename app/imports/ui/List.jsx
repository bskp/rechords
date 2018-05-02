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
            <aside id="list">
                <ul>
                    {groups.map((group) => 
                        <ListGroup label={group} songs={this.props.tree[group]} key={group}/>
                    )}
                    <li>
                        <h2><NavLink to="/new">+ Neues Lied</NavLink></h2>
                    </li>
                </ul>
            </aside>
        )
    }
}

List.propTypes = {
    tree: PropTypes.object.isRequired
}