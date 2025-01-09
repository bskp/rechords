import * as React from 'react';
import {useContext, useMemo, useState} from 'react';
import {NavLink, RouteComponentProps, withRouter} from 'react-router-dom';
import {Song} from '../../api/collections';

import Drawer from '../Drawer';
import {userMayWrite} from '../../api/helpers';
import classNames from 'classnames';

import {Meteor} from 'meteor/meteor';
import {Menu} from "./Menu";
import {ListGroup} from "./ListGroup";
import {MenuContext} from "/imports/ui/App";

interface ListProps extends RouteComponentProps {
  songs: Song[];
  user: Meteor.User | null;
  filter?: string;
}

const List = (props: ListProps) => {
  const [filter, setFilter] = useState('')

  const [fuzzyMatches, exactMatches] = useMemo(() => {
    let visibleSongs = props.songs

    if (props.user === null) {
      visibleSongs = visibleSongs.filter(song => song.checkTag('frei'));
    } else if (props.user.profile.role == 'user') {
      visibleSongs = visibleSongs.filter(song => props.user?.profile.role == 'user' && !song.checkTag('fini'));
    }

    if (!filter.includes('#privat')) {
      visibleSongs = visibleSongs.filter(song => !song.checkTag('privat'));
    }

    const exactMatches = visibleSongs.filter(song => song.title.toLowerCase().includes(filter.toLowerCase()));
    const words = filter.toLowerCase().split(/\s+/);
    const fuzzyMatches = visibleSongs.filter(song => words.every(word =>
      song.text.toLowerCase().includes(word) || song.author.toLowerCase().includes(word)
    ));

    return [fuzzyMatches, exactMatches]
  }, [props.songs, filter, props.user])

  // Split list of filtered songs into groups.
  const grouper = (s: Song) => s.title[0];
  const groups = new Map<string, Song[]>();

  // Add exact matches
  if (filter.length &&
    exactMatches.length &&
    fuzzyMatches.length > 1
  ) {
    groups.set('im Titel', exactMatches);
  }

  // Add and group fuzzy matches
  for (const song of fuzzyMatches) {
    const group = grouper(song);

    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)?.push(song);
  }

  const {showMenu} = useContext(MenuContext);

  const addSong = userMayWrite() ? <li>
    <h2><NavLink to="/new">+ Neues Lied</NavLink></h2>
  </li> : undefined;

  return (
    <Drawer id="list" open={true} className={classNames(
      'songlist',
      {hideOnMobile: !showMenu},
    )}>
      <Menu filter={filter} setFilter={setFilter.bind(this)}/>
      <ul className="scroll">
        {Array.from(groups, ([group, songs]) => {
            return <ListGroup user={props.user} label={group} songs={songs} key={group}/>;
          }
        )}
        {addSong}
      </ul>
    </Drawer>
  );
}

export default withRouter(List);  // injects history, location, match
