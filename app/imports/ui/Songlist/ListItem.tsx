import React, { useContext, useState } from "react";
import { MdFavorite, MdFavoriteBorder, MdPendingActions } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { routePath, View } from "/imports/api/helpers";
import { Playlist, Playlists, Song } from "/imports/api/collections";
import { Meteor } from "meteor/meteor";
import { MenuContext } from "/imports/ui/App";
import classNames from "classnames";
import { useTracker } from "meteor/react-meteor-data";

interface ListItemProps {
  song: Song;
  user: Meteor.User | null;
}

const ListItem: React.FC<ListItemProps> = ({ song, user }) => {
  const toggleDarling = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (!user) return;

    const { profile } = user;
    if (!profile || !Array.isArray(profile.darlings)) {
      user.profile = { ...profile, darlings: [] };
    }

    const { darlings } = user.profile;

    if (darlings.includes(song._id)) {
      user.profile.darlings = darlings.filter((id) => id !== song._id);
    } else {
      user.profile.darlings.push(song._id);
    }

    Meteor.call("saveUser", user, (error: any) => {
      if (error) {
        console.error(error);
      }
    });
  };

  const isDarling = user?.profile?.darlings?.includes(song._id) ?? false;
  const { setShowMenu } = useContext(MenuContext);
  const [showContext, setShowContext] = useState(false);

  const { playlists } = useTracker(() => {
    const pl = Meteor.subscribe("playlists");
    return { ready: pl.ready, playlists: Playlists.find({}).fetch() };
  });

  function add(playlist: Playlist, songId: string): void {
    playlist.list.push({ songId });
    Meteor.call("updatePlaylist", playlist);
  }

  function remove(playlist: Playlist, songId: string): void {
    const idx = playlist.list.findIndex(s => s.songId===songId)
    playlist.list.splice(idx,1)
    Meteor.call("updatePlaylist", playlist);
  }

  return (
    <li>
      <NavLink
        onClick={() => setShowMenu(false)}
        to={routePath(View.view, song)}
        activeClassName="selected"
      >
        <span className="title">{song.title}</span>
        <span className="author">{song.author}</span>
        {user && (
          <>
            <span
              onClick={toggleDarling}
              className={classNames({
                darling: true,
                is_darling: isDarling,
              })}
            >
              {isDarling ? <MdFavorite /> : <MdFavoriteBorder />}
            </span>
            <span
              onClick={(e) => {
                e.preventDefault();
                setShowContext(!showContext);
              }}
            >
              {!showContext ? "+" : "-"}
            </span>
          </>
        )}

        {!song.checkTag("fini") && <MdPendingActions />}
      </NavLink>
      <div className="ctxmenu-wrapper">
        <div className={classNames("ctxmenu", { open: showContext })}>
          <ul>
            {playlists.map((p) => (
              <li>
                {p.name}
                {p.list.find((v) => v.songId === song._id) ? (
                  <span onClick={() => remove(p, song._id!)}>-</span>
                ) : (
                  <span onClick={() => add(p, song._id!)}>+</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
};

export default ListItem;
