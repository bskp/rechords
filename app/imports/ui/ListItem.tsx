import * as React from "react";
import {MdFavorite, MdFavoriteBorder} from "react-icons/md";
import {NavLink} from "react-router-dom";
import {routePath, View} from "/imports/api/helpers";
import {Song} from "/imports/api/collections";
import {MouseEventHandler} from "react";
import { Meteor } from "meteor/meteor";

interface ListItemProps {
  song: Song;
  onClickHandler: MouseEventHandler<HTMLAnchorElement>;
  user: Meteor.User | null;
}

export class ListItem extends React.Component<ListItemProps> {
  constructor(props: ListItemProps) {
    super(props);
  }

  toggleDarling = (e: React.MouseEvent<HTMLElement>) => {
    const u = this.props.user;
    const id = this.props.song._id;

    if (u?.profile.darlings.includes(id)) {
      u.profile.darlings = u.profile.darlings.filter((i: string) => i != id);
    } else {
      u?.profile.darlings.push(id);
    }

    Meteor.call('saveUser', u, (error: any) => {
      console.log(error);
    });

    e.preventDefault();
  };

  render() {
    const u = this.props.user;

    if (u && (!('darlings' in u.profile) || !(u.profile.darlings instanceof Array))) {
      u.profile.darlings = [];
      Meteor.call('saveUser', u, (error: any) => {
        console.log(error);
      });
    }

    const darlings = u?.profile?.darlings ?? [];

    const is_darling = darlings.includes(this.props.song._id);

    const toggler = is_darling ?
      <span onClick={this.toggleDarling} className='darling is_darling'><MdFavorite/></span> :
      <span onClick={this.toggleDarling} className='darling'><MdFavoriteBorder/></span>
    const darling_or_not = u ? toggler : undefined;

    return (
      <li><NavLink onClick={this.props.onClickHandler} to={routePath(View.view, this.props.song)}
                   activeClassName="selected">
        <span className="title">{this.props.song.title}</span>
        <span className="author">{this.props.song.author}</span>
        {darling_or_not}
      </NavLink>
      </li>
    );
  }
}