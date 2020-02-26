import * as React from 'react';
import { withRouter, NavLink } from 'react-router-dom';
import MetaContent from './MetaContent';
import { Song } from '../api/collections';

import Drawer from './Drawer';


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
                        <ListItem song={song} key={song._id} />
                    )}
                </ul>
            </li>
        )
    }
}


interface ListProps {
  songs: Array<Song>;
  filter?: String;
  open: boolean;
  hidden: boolean;
}
interface ListState {
    filter: string;
    active: boolean;
}

class List extends React.Component<ListProps, ListState> {
    constructor(props) {
        super(props);
        this.state = {
            filter: props.filter || '',
            active: false
        }
    }

    private last_matched_song : Song;

    keyHandler = (e : KeyboardEvent) => {
        // Focus grabber
        if (this.props.hidden) return;

        if (e.key == 'Escape') {
            this.setState({
                filter: '',
            });
            this.refs.filter.blur();
            e.preventDefault();
        } else {
            // Check if the pressed key has a printable representation
            if (e.key && e.key.length === 1) {
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
        this.setState({
          filter: event.currentTarget.value
        });
        event.preventDefault();
      };

    onKeyDown = (event : React.KeyboardEvent) => {
        if (event.key == 'Enter' && this.last_matched_song) {
            let s = this.last_matched_song;
            this.props.history.push('/view/' + s.author_ + '/' + s.title_);
            this.setState({
                filter: '',
            });
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

        this.setState( (state, props) => {
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
        let tree = {};
        let groups = [];

        let filters = this.state.filter.split(' ');

        this.props.songs.forEach((song) => {
            for (let filter of filters) {
                filter = filter.toLowerCase();

                if (!song.title.toLowerCase().includes(filter) &&
                    !song.text.toLowerCase().includes(filter) &&
                    !song.author_.toLowerCase().includes(filter)) {
                    return;
                }
            }

            // Hack to hide all songs containing an 'privat'-tag
            if (!this.state.filter.includes('#privat')) {
                for (let tag of song.getTags()) {
                    if (tag.startsWith('privat')) return;
                }
            }


            let categories = [song.title[0]];

            for (let cat of categories) {
                if (tree[cat] === undefined) {
                    tree[cat] = [];
                    groups.push(cat);
                }

                tree[cat].push(song);
                this.last_matched_song = song;
            }

        });

        let active = this.state.active ? '' : 'hidden';
        let filled = this.state.filter == '' ? '' : 'filled';

        const process_filtermenu = (node) => {
            if (node.name == 'li') {
                let b = node.children.length > 1 ? <b>…</b> : null;
                return <li onMouseDown={this.onTagClick.bind(this)}>{node.children[0].data}{b}</li>
            }

        }

        return (
            <Drawer id="list" open={this.props.open} className={"songlist " + (this.props.hidden ? 'hidden' : '')}>
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
                    {groups.map((group) => 
                        <ListGroup label={group} songs={tree[group]} key={group}/>
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