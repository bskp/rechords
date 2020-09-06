import * as React from 'react';
import { withRouter, NavLink, Link } from 'react-router-dom';
import MetaContent from './MetaContent';
import { Song } from '../api/collections';

import Drawer from './Drawer';


interface ListItemProps {
    song: Song;
    onClickHandler: Function;
    user: Meteor.User;
}
class ListItem extends React.Component<ListItemProps, {}> {
    constructor(props) {
        super(props);
    }

    toggleDarling = e => {
        const u = this.props.user;
        const id = this.props.song._id;

        if (u.profile.darlings.includes(id)) {
            u.profile.darlings = u.profile.darlings.filter( i => i != id );
        } 
        else {
            u.profile.darlings.push(id);
        }

        Meteor.call('saveUser', u, (error) => {
            console.log(error);
        });

        e.preventDefault();
    }

    render() {
        const u = this.props.user;

        if (!('darlings' in u.profile) || !(u.profile.darlings instanceof Array)) {
            u.profile.darlings = [];
            Meteor.call('saveUser', u, (error) => {
                console.log(error);
            });
            
        } 

        const darlings = u.profile.darlings;

        const is_darling = darlings.includes(this.props.song._id) ? 'is_darling' : '';

        const darling_or_not = <span onClick={this.toggleDarling} className={"darling " + is_darling}>{darling_icon}</span>
        
        return (
            <li><NavLink onClick={this.props.onClickHandler} to={`/view/${this.props.song.author_}/${this.props.song.title_}`}
                activeClassName="selected">
                    <span className="title">{this.props.song.title}</span>
                    <span className="author">{this.props.song.author}</span>
                    {darling_or_not}
                </NavLink>
            </li>
        );
    }
}

const darling_icon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
    </svg>
)



interface ListGroupProps {
  songs: Array<Song>;
  user: Meteor.User;
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
                        <ListItem song={song} user={this.props.user} key={song._id} onClickHandler={this.props.onClickHandler}/>
                    )}
                </ul>
            </li>
        )
    }
}


interface ListProps {
  songs: Array<Song>;
  user: Meteor.User;
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
            fuzzy_matches: [],
            exact_matches: []
        }
    }

    keyHandler = (e : KeyboardEvent) => {
        if (this.props.hidden) return;

        if (e.key == 'Escape') {
            this.setFilter('');
            this.refs.filter.blur();
            e.preventDefault();
            return
        } 

        // Do not steal focus if on <input>
        if( e.target?.tagName == 'INPUT' ) return;

        // Ignore special keys
        if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return;

        // Check if the pressed key has a printable representation
        if (e.key && e.key.length === 1) {
            this.refs.filter.focus();
        }
    }

    componentDidMount() {
        document.addEventListener("keydown", this.keyHandler, {});
        this.setFilter('');
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.keyHandler);
    }

    onChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        this.setFilter(event.currentTarget.value);
    }

    setFilter = (new_filter) => {
        let fuzzy = Array<Song>();
        let exact = Array<Song>();

        nextSong:
        for (let song of this.props.songs) {
            if (this.props.user.profile.role == 'user' && 
                (!song.checkTag('fini')) ) {
                    // Display only songs which contain the tag "fini"
                    continue nextSong;
                }

            // Check filter words
            for (let filter of new_filter.split(' ')) {
                filter = filter.toLowerCase();

                if (!song.title.toLowerCase().includes(filter) &&
                    !song.text.toLowerCase().includes(filter) &&
                    !song.author.toLowerCase().includes(filter)) {
                    continue nextSong;
                }
            }

            // It's a match!
            fuzzy.push(song);

            if (song.title.toLowerCase().includes(new_filter.toLowerCase())) {
                exact.push(song);
            }
        }

        this.setState({
          'filter': new_filter,
          fuzzy_matches: fuzzy,
          exact_matches: exact
        });

        event.preventDefault();
      };

    onKeyDown = (event : React.KeyboardEvent) => {
        if (this.state.fuzzy_matches.length == 0) return;

        if (event.key == 'Enter') {
            let list = this.state.exact_matches.length ? this.state.exact_matches : this.state.fuzzy_matches;
            if (list.length == 0) return;

            if (event.shiftKey) {
                // Only navigate to song if shift is pressed with enter.
                let s = list[0];
                this.props.history.push('/view/' + s.author_ + '/' + s.title_);
                this.setFilter('');
            }

            this.refs.filter.blur();
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

        let newFilter;
        if (this.state.filter.includes(tag)) {
            newFilter = this.state.filter.replace(tag, '');
        } else {
            newFilter = this.state.filter + tag + ' '
        }
        this.setFilter(newFilter.replace('  ', ' ').trim());

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
            groups.set("Titel", this.state.exact_matches);
        }

        // Add and group fuzzy matches
        for (let song of this.state.fuzzy_matches) {
            // Hack to hide all songs containing an 'privat'-tag
            if (!this.state.filter.includes('#privat')) {
                if (song.checkTag('privat')) continue;
            }

            let cat_label = grouper(song);

            if (!groups.has(cat_label)) {
                groups.set(cat_label, new Array<Song>());
            }
            groups.get(cat_label).push(song);
        }

        let active = this.state.active ? '' : 'hidden';
        let filled = this.state.filter == '' ? '' : 'filled';

        const process_filtermenu = () => {
            let bucket;

            return (node) => {
                if (node.name == 'li') {
                    let b = node.children.length > 1 ? <b>…</b> : null;
                    return <li onMouseDown={this.onTagClick.bind(this)}>{node.children[0].data}{b}</li>
                }

                if (node.name == 'h4') {
                    bucket = node;
                    return node;
                }

                if (node.name == 'ul') {
                    node.children.unshift(bucket);
                    return node;
                }
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
                    <span className={'reset ' + filled} onClick={(e)=>{this.setFilter('')}}>&times;</span>
                </div>

                <MetaContent 
                    replace={process_filtermenu()}
                    className={'filterMenu ' + active} 
                    title="Schlagwortverzeichnis" 
                    songs={this.props.songs}
                    />
                <ul>
                    {Array.from(groups, ([group, songs]) => {
                            return <ListGroup user={this.props.user} label={group} songs={songs} key={group} onClickHandler={this.props.hideOnMobile}/>
                        }
                    )}
                    <li>
                        <h2><NavLink to="/new">+ Neues Lied</NavLink></h2>
                    </li>
                </ul>
                <Link to="/user" className="username">{Meteor.user().profile.name}</Link>
            </Drawer>
        )
    }
}

export default withRouter(List);  // injects history, location, match