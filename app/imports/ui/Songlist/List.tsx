import * as React from "react";
import { useContext, useMemo, useState } from "react";
import {
  NavLink,
  RouteComponentProps,
  useHistory,
  withRouter,
} from "react-router-dom";
import { Song } from "../../api/collections";

import Drawer from "../Drawer";
import { routePath, userMayWrite, View } from "../../api/helpers";
import classNames from "classnames";

import { Meteor } from "meteor/meteor";
import { Menu } from "./Menu";
import { ListGroupItem } from "./ListGroupItem";
import { MenuContext } from "/imports/ui/App";

interface ListProps extends RouteComponentProps {
  songs: Song[];
  user: Meteor.User | null;
  filter?: string;
}

const List = (props: ListProps) => {
  const [filter, setFilter] = useState("");

  // todo: upgrade to new react-router -> useNavigate can be used
  const history = useHistory();

  const [fuzzyMatches, exactMatches] = useMemo(() => {
    let visibleSongs = props.songs;

    if (!["admin", "writer"].includes(props.user?.profile.role)) {
      visibleSongs = visibleSongs.filter((song) => song.checkTag("fini"));
    }

    if (!filter.includes("#privat")) {
      visibleSongs = visibleSongs.filter((song) => !song.checkTag("privat"));
    }

    const exactMatches = visibleSongs.filter((song) =>
      song.title.toLowerCase().includes(filter.toLowerCase()),
    );

    const words = filter.toLowerCase().split(/\s+/);
    const fuzzyMatches = visibleSongs.filter((song) =>
      words.every(
        (word) =>
          song.text.toLowerCase().includes(word) ||
          song.author.toLowerCase().includes(word),
      ),
    );

    return [fuzzyMatches, exactMatches];
  }, [props.songs, filter, props.user]);

  // Split list of filtered songs into groups.
  const grouper = (s: Song) => s.title[0];
  const groups = new Map<string, Song[]>();

  // Add exact matches
  if (filter.length && exactMatches.length && fuzzyMatches.length > 1) {
    groups.set("im Titel", exactMatches);
  }

  const navigateToFirstMatch = () => {
    let song;
    if (exactMatches.length > 0) {
      song = exactMatches[0];
    } else if (fuzzyMatches.length > 0) {
      song = fuzzyMatches[0];
    }
    if (song) {
      const newUrl = routePath(View.view, song);
      showMenu;
      history.push(newUrl);
    }
  };

  // Add and group fuzzy matches
  for (const song of fuzzyMatches) {
    const group = grouper(song);

    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)?.push(song);
  }

  const { showMenu } = useContext(MenuContext);

  const addSong = userMayWrite() ? (
    <li>
      <NavLink className="newSong" to="/new">
        + Neues Lied
      </NavLink>
    </li>
  ) : undefined;

  return (
    <Drawer
      id="list"
      open={true}
      className={classNames("songlist", { hideOnMobile: !showMenu })}
    >
      <Menu
        onEnter={navigateToFirstMatch}
        filter={filter}
        filterChanged={(e) => setFilter(e)}
      />
      <ul className="scroll">
        {addSong}
        {Array.from(groups, ([group, songs]) => {
          return (
            <ListGroupItem
              user={props.user}
              label={group}
              songs={songs}
              key={group}
            />
          );
        })}
      </ul>
      {props.user === null && (
        <div className="callToLogin">
          <NavLink to="/login">Melde dich an</NavLink>, um alle Lieder zu sehen!
        </div>
      )}
    </Drawer>
  );
};

export default withRouter(List); // injects history, location, match
