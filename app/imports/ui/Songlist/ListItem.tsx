import React, {useContext} from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { routePath, View } from "/imports/api/helpers";
import { Song } from "/imports/api/collections";
import { Meteor } from "meteor/meteor";
import {MenuContext} from "/imports/ui/App";

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
  const {setShowMenu} = useContext(MenuContext);

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
          <span
            onClick={toggleDarling}
            className={`darling ${isDarling ? "is_darling" : ""}`}
          >
            {isDarling ? <MdFavorite /> : <MdFavoriteBorder />}
          </span>
        )}
      </NavLink>
    </li>
  );
};

export default ListItem;