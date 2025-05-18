import { Songbook, Songbooks } from "/imports/api/collections";
import * as React from "react";
import { Meteor } from "meteor/meteor";
import "./selectorStyle.less";

export const SongbookSelector = (props: {
  songbooks: string[];
  setSongbooks: (value: ((prevState: string[]) => string[]) | string[]) => void;
  user: Meteor.User | null;
}) => {
  const allSongbooks = Songbooks.find({
    $or: [{ owner: props.user?._id }, { name: "Lizenz Frei" }],
  }).fetch();

  const toggle = (id: string) =>
    props.setSongbooks((active) => {
      if (active.includes(id)) {
        active.splice(active.indexOf(id), 1);
      }
      active.push(id);
      return active;
    });

  const isActive = (id: string) =>
    props.songbooks.includes(id) ? "active" : undefined;

  return (
    <ul className="selector">
      {allSongbooks.length > 0 && (
        <li onClick={() => props.setSongbooks([])}>Alle</li>
      )}
      {allSongbooks.map((book: Songbook) => (
        <li className={isActive(book._id!)} onClick={() => toggle(book._id!)}>
          {book.name}
        </li>
      ))}
    </ul>
  );
};
