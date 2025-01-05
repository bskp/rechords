import * as React from 'react';
import {MouseEventHandler} from 'react';
import {NavLink, RouteComponentProps, withRouter} from 'react-router-dom';
import MetaContent from './MetaContent';
import {Song} from '../api/collections';

import Drawer from './Drawer';
import {navigateTo, userMayWrite, View} from '../api/helpers';
import classNames from 'classnames';

import {MdSell} from 'react-icons/md';
import {Meteor} from 'meteor/meteor';
import {Menu} from "/imports/ui/Menu";
import {ListGroup} from "/imports/ui/ListGroup";

interface ListProps extends RouteComponentProps {
  songs: Array<Song>;
  user: Meteor.User | null;
  filter?: string;
  hidden: boolean;
  hideOnMobile: MouseEventHandler<HTMLElement>
}

interface ListState {
    filter: string;
    active: boolean; // Focus is in filter input
    tags_open: boolean; // Tag menu opened manually (mobile)
    fuzzy_matches: Array<Song>;
    exact_matches: Array<Song>;
}

class List extends React.Component<ListProps, ListState> {
  refFilter: React.RefObject<HTMLInputElement>;

  constructor(props: ListProps) {
    super(props);
    this.state = {
      filter: props.filter || '',
      active: false,
      tags_open: false,
      fuzzy_matches: [],
      exact_matches: []
    };
    this.refFilter = React.createRef();
  };

  onChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    this.setFilter(event.currentTarget.value);
  };

  setFilter = (new_filter: string) => {
    const fuzzy : Song[] = [];
    const exact : Song[] = [];

    nextSong:
    for (const song of this.props.songs) {
      if (this.props.user === null && !song.checkTag('frei')) continue;
      if (this.props.user?.profile?.role == 'user' && (!song.checkTag('fini')) ) {
        // Display only songs which contain the tag "fini"
        continue;
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
      filter: new_filter,
      fuzzy_matches: fuzzy,
      exact_matches: exact
    });
  };

  onKeyDown = (event : React.KeyboardEvent) => {
    if (this.state.fuzzy_matches.length == 0) return;

    if (event.key == 'Enter') {
      const list = this.state.exact_matches.length ? this.state.exact_matches : this.state.fuzzy_matches;
      if (list.length == 0) return;

      if (event.shiftKey) {
        // Only navigate to song if shift is pressed with enter.
        const s = list[0];
        navigateTo(this.props.history, View.view, s);
        this.setFilter('');
      }

      this.refFilter?.current?.blur();
    }
  };

  onFocus = () => {
    this.setState({
      active: true
    });
  };

  onBlur = () => {
    this.setState({
      active: false
    });
  };

  toggleTagsOpen = () => {
    this.setState( s => ({tags_open: !s.tags_open}));
  };

  onTagClick = (event : React.MouseEvent) => {
    const tag = ' #' + event.currentTarget?.childNodes?.[0]?.textContent?.toLowerCase();

    let newFilter;
    if (this.state.filter.includes(tag)) {
      newFilter = this.state.filter.replace(tag, '');
    } else {
      newFilter = this.state.filter + tag;
    }
    this.setFilter(newFilter.replace('  ', ' ').trim());

    // compromise: close overlay after selecting one tag
    // is probably the most common case
    this.setState({tags_open: false});

    event.preventDefault();
  };


  render() {
    // Split list of filtered songs into groups.
    const grouper = (s : Song) => s.title[0];

    const groups = new Map<string, Array<Song>>();

    // Add exact matches
    if (this.state.filter.length &&
            this.state.exact_matches.length &&
            this.state.fuzzy_matches.length > 1
    ) {
      groups.set('im Titel', this.state.exact_matches);
    }

    // Add and group fuzzy matches
    for (const song of this.state.fuzzy_matches) {
      // Hack to hide all songs containing an 'privat'-tag
      if (!this.state.filter.includes('#privat')) {
        if (song.checkTag('privat')) continue;
      }

      const cat_label = grouper(song);

      if (!groups.has(cat_label)) {
        groups.set(cat_label, new Array<Song>());
      }
      groups.get(cat_label)?.push(song);
    }

    const filled = this.state.filter == '' ? '' : 'filled';

    const process_filtermenu = () => {
      let bucket: string;

      return (node: any) => {
        if (node.name == 'li') {
          const b = node.children.length > 1 ? <b>…</b> : null;
          return <li onMouseDown={this.onTagClick.bind(this)}>{node.children[0].data}{b}</li>;
        }

        if (node.name == 'h4') {
          bucket = node;
          return node;
        }

        if (node.name == 'ul') {
          node.children.unshift(bucket);
          return node;
        }
      };
    };


    const addSong = userMayWrite() ? <li>
      <h2><NavLink to="/new">+ Neues Lied</NavLink></h2>
    </li> : undefined;

    return (
      <Drawer id="list" open={true} className={classNames(
        'songlist',
        {hidden: this.props.hidden},
        {noscroll: this.state.tags_open}
      )}>
        <Menu filter={this.state.filter} setFilter={this.setFilter.bind(this)}/>
        <div className="filter">
          <input type="text"
                 placeholder="Lieder suchen…"
                 value={this.state.filter}
                 ref={this.refFilter}

                 onChange={this.onChange}
                 onFocus={this.onFocus}
                 onBlur={this.onBlur}
                 onKeyDown={this.onKeyDown}
          />
          <span className={'reset ' + filled} onClick={() => {
            this.setFilter('');
          }}>&times;</span>
          <span className="open-tags" onClick={this.toggleTagsOpen}><MdSell /></span>
        </div>
        <MetaContent
          replace={process_filtermenu()}
          className={classNames('filterMenu',
            {
              hidden: !this.state.active,
              open  : !this.props.hidden && this.state.tags_open
            })} // tag menu is fix positioned and would stay on top otherwise
          title="Schlagwortverzeichnis"
          songs={this.props.songs}
        />
        <ul className="scroll">
          {Array.from(groups, ([group, songs]) => {
                return <ListGroup user={this.props.user} label={group} songs={songs} key={group}
                                  onClickHandler={this.props.hideOnMobile}/>;
              }
          )}
          {addSong}
        </ul>
      </Drawer>
    );
  }
}

export default withRouter(List);  // injects history, location, match
