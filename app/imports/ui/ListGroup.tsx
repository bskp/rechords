import {Song} from "/imports/api/collections";
import * as React from "react";
import {MouseEventHandler} from "react";
import classNames from "classnames";
import {ListItem} from "/imports/ui/ListItem";
import { Meteor } from "meteor/meteor";

export function ListGroup(props: {
  songs: Array<Song>;
  user: Meteor.User | null;
  label: string;
  onClickHandler: MouseEventHandler<HTMLElement>

}) {
  const classes = classNames(
    'huge',
    {'wordy': props.label.length > 5}
  );

  return (
    <li key={props.label}>
      <h2 className={classes}>{props.label}</h2>
      <ul>
        {props.songs.map((song) =>
          <ListItem song={song} user={props.user} key={song._id} onClickHandler={props.onClickHandler}/>
        )}
      </ul>
    </li>
  );
}