import {Song} from "/imports/api/collections";
import * as React from "react";
import classNames from "classnames";
import {Meteor} from "meteor/meteor";
import ListItem from "/imports/ui/Songlist/ListItem";

export function ListGroup(props: {
  songs: Song[];
  user: Meteor.User | null;
  label: string;
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
          <ListItem song={song} user={props.user} key={song._id} />
        )}
      </ul>
    </li>
  );
}