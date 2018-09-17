import * as React from 'react';
import { NavLink } from 'react-router-dom';
import MetaContent from './MetaContent';
import {Song} from '../api/collections';
import Autosuggest = require('react-autosuggest');


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


const renderSuggestion = suggestion => (
    <span className="tags"><li>{suggestion}</li></span>
);


interface ListProps {
  songs: Array<Song>;
}
interface ListState {
    filter: String;
    suggestions: Array<any>;
}
export default class List extends React.Component<ListProps, ListState> {
    constructor(props) {
        super(props);
        this.state = {
            filter: '',
            suggestions: []
        }

    }

    onSuggestionsFetchRequested = ({ value, reason }) => {
        let matches = new Set<string>();
        /*
        if (value.startsWith('#')) {
            value = value.substr(1);
        }
        this.props.songs.forEach((song) => {
            song.getTags().forEach((tag) => {
                if (tag.startsWith(value)) matches.add(tag);
            });
        });
        */

        this.setState({
            suggestions: Array.from(matches)
          });
    }

    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    }

    onChange = (event, { newValue }) => {
        this.setState({
          filter: newValue
        });
      };

    getSuggestionValue = (s : string) => {
        return "#" + s + " ";
    }

    render() {
        let tree = {};

        this.props.songs.forEach((song) => {
            if (!song.title.toLowerCase().includes(this.state.filter.toLowerCase()) &&
                !song.text.toLowerCase().includes(this.state.filter.toLowerCase()) &&
                !song.author_.toLowerCase().includes(this.state.filter.toLowerCase())) {
                return;
            }

            // Hack to hide all songs containing an 'archiv'-tag
            if (song.getTags().includes('archiv') && this.state.filter != '#archiv') {
                return;
            }

            if (tree[song.author] === undefined) {
                tree[song.author] = [];
            }
            tree[song.author].push(song);
        });

        let groups = [];
        for (let key in tree) {
            groups.push(key);
        }

        // Autosuggest will pass through all these props to the input.
        const inputProps = {
            placeholder: 'Filtern…',
            value: this.state.filter,
            onChange: this.onChange,
            className: 'filter'
        };

        const as = <Autosuggest 
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={this.getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    inputProps={inputProps}
        />;


        return (
            <aside id="list">
                {as}
                <MetaContent className="filterMenu" title="Schlagwortverzeichnis" songs={this.props.songs}/>
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