import React, { useContext } from "react";
import { MdFavorite, MdFavoriteBorder, MdPendingActions } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { routePath, View } from "/imports/api/helpers";
import { Song } from "/imports/api/collections";
import { Meteor } from "meteor/meteor";
import { MenuContext } from "/imports/ui/App";
import classNames from "classnames";

interface ListItemProps {
  song: Song;
  user: Meteor.User | null;
}

const ListItem: React.FC<ListItemProps> = ({ song, user }) => {
  const toggleDarling = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (!user || !song._id) return;

    Meteor.call("toggleDarling", song._id, (error: unknown) => {
      if (error) {
        console.error(error);
      }
    });
  };

  const isDarling = user?.profile?.darlings?.includes(song._id) ?? false;
  const { setShowMenu } = useContext(MenuContext);

  return (
    <li>
      <NavLink
        onClick={() => setShowMenu(false)}
        to={routePath(View.view, song)}
        className={({ isActive }) => (isActive ? "selected" : "")}
      >
        <span className="title">{song.title}</span>
        <span className="author">{song.author}</span>
        {user && (
          <span
            onClick={toggleDarling}
            className={classNames({
              darling: true,
              is_darling: isDarling,
            })}
          >
            {isDarling ? <MdFavorite /> : <MdFavoriteBorder />}
          </span>
        )}
        {!song.checkTag("fini") && <MdPendingActions />}
      </NavLink>
    </li>
  );
};

export default ListItem;
