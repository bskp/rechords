import * as React from 'react';
import { withRouter, NavLink } from 'react-router-dom';
import MetaContent from './MetaContent';
import { Song } from '../api/collections';

import Drawer from './Drawer';


interface ListItemProps {
    song: Song;
    onClickHandler: Function;
}
class ListItem extends React.Component<ListItemProps, {}> {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <li><NavLink onClick={this.props.onClickHandler} to={`/view/${this.props.song.author_}/${this.props.song.title_}`}
                activeClassName="selected">
                <span className="title">{this.props.song.title}</span>
                <span className="author">{this.props.song.author}</span>
                </NavLink></li>
        );
    }
}



interface ListGroupProps {
  songs: Array<Song>;
  label: string;
  onClickHandler: Function;
}
class ListGroup extends React.Component<ListGroupProps, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li key={this.props.label}>
                <h2 className="huge">{this.props.label}</h2>
                <ul>
                    {this.props.songs.map((song) => 
                        <ListItem song={song} key={song._id} onClickHandler={this.props.onClickHandler}/>
                    )}
                </ul>
            </li>
        )
    }
}


interface ListProps {
  songs: Array<Song>;
  filter?: String;
  hidden: boolean;
  hideOnMobile: Function;
}
interface ListState {
    filter: string;
    active: boolean;
    fuzzy_matches: Array<Song>;
    exact_matches: Array<Song>;
}

class List extends React.Component<ListProps, ListState> {
    constructor(props) {
        super(props);
        this.state = {
            filter: props.filter || '',
            active: false,
            fuzzy_matches: this.props.songs,
            exact_matches: []
        }
    }

    keyHandler = (e : KeyboardEvent) => {
        // Focus grabber
        if (this.props.hidden) return;

        if (e.key == 'Escape') {
            this.setState({
                filter: '',
            });
            this.refs.filter.blur();
            e.preventDefault();
        } 
        else if (e.key == 'KeyDown') {

        }
        else {
            // Check if the pressed key has a printable representation
            if (e.key && e.key.length === 1 && !e.metaKey) {
                this.refs.filter.focus();
            }
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keyHandler);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.keyHandler);
    }

    onChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        let filters = event.currentTarget.value;
        let fuzzy = Array<Song>();
        let exact = Array<Song>();

        nextSong:
        for (let song of this.props.songs) {
            for (let filter of filters.split(' ')) {
                filter = filter.toLowerCase();

                if (!song.title.toLowerCase().includes(filter) &&
                    !song.text.toLowerCase().includes(filter) &&
                    !song.author.toLowerCase().includes(filter)) {
                    continue nextSong;
                }
            }

            // Hack to hide all songs containing an 'privat'-tag
            if (!this.state.filter.includes('#privat')) {
                for (let tag of song.getTags()) {
                    if (tag.startsWith('privat')) continue;
                }
            }

            // It's a match!
            fuzzy.push(song);

            if (song.title.toLowerCase().includes(filters.toLowerCase())) {
                exact.push(song);
            }
        }

        this.setState({
          'filter': filters,
          fuzzy_matches: fuzzy,
          exact_matches: exact
        });

        event.preventDefault();
      };

    onKeyDown = (event : React.KeyboardEvent) => {
        if (this.state.fuzzy_matches.length == 0) return;

        let navigate = (s : Song) => {
            this.props.history.push('/view/' + s.author_ + '/' + s.title_);
            this.setState({
                filter: '',
                fuzzy_matches: this.props.songs,
                exact_matches: []
            });
            this.refs.filter.blur();
        }

        if (event.key == 'Enter') {
            let list = this.state.exact_matches.length ? this.state.exact_matches : this.state.fuzzy_matches;
            if (list.length == 0) return;
            navigate(list[0]);
        }
    }

    onFocus = () => {
        this.setState({
            active: true
        });
    }

    onBlur = () => {
        this.setState({
            active: false
        });
    }

    onTagClick = (event : React.MouseEvent) => {
        let tag = '#' + event.currentTarget.childNodes[0].textContent.toLowerCase();

        this.setState( (state) => {
            let newFilter;
            if (state.filter.includes(tag)) {
                newFilter = state.filter.replace(tag, '');
            } else {
                newFilter = state.filter + tag + ' '
            }
            return {
                filter: newFilter.replace('  ', ' ').trim()
            }
        });
        event.preventDefault();
    }


    render() {
        // Split list of filtered songs into groups.
        let grouper = (s : Song) => s.title[0];

        let groups = new Map<string, Array<Song>>();

        // Add exact matches
        if (this.state.filter.length && 
            this.state.exact_matches.length && 
            this.state.fuzzy_matches.length > 1
            ) {
            groups.set("Im Titel", this.state.exact_matches);
        }

        // Add and group fuzzy matches
        for (let song of this.state.fuzzy_matches) {
            let cat_label = grouper(song);

            if (!groups.has(cat_label)) {
                groups.set(cat_label, new Array<Song>());
            }
            groups.get(cat_label).push(song);
        }

        let active = this.state.active ? '' : 'hidden';
        let filled = this.state.filter == '' ? '' : 'filled';

        const process_filtermenu = (node) => {
            if (node.name == 'li') {
                let b = node.children.length > 1 ? <b>…</b> : null;
                return <li onMouseDown={this.onTagClick.bind(this)}>{node.children[0].data}{b}</li>
            }

        }

        return (
            <Drawer id="list" open={true} className={"songlist " + (this.props.hidden ? 'hidden' : '')}>
                <div className="filter">
                    <input type="text" 
                        placeholder="Filtern…" 
                        value={this.state.filter} 
                        ref="filter"
                        onChange={this.onChange}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}
                        onKeyDown={this.onKeyDown}
                        />
                    <span className={'reset ' + filled} onClick={(e)=>{this.setState({filter: ''})}}>&times;</span>
                </div>

                <MetaContent 
                    replace={process_filtermenu}
                    className={'filterMenu ' + active} 
                    title="Schlagwortverzeichnis" 
                    songs={this.props.songs}
                    />
                <ul>
                    {Array.from(groups, ([group, songs]) => {
                            return <ListGroup label={group} songs={songs} key={group} onClickHandler={this.props.hideOnMobile}/>
                        }
                    )}
                    <li>
                        <h2><NavLink to="/new">+ Neues Lied</NavLink></h2>
                    </li>
                </ul>
            </Drawer>
        )
    }
}

export default withRouter(List);  // injects history, location, match