import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { FC } from "react";
import { useRouteMatch } from "react-router-dom";
import Songs, { Playlists } from "../api/collections";
import * as React from "react";

export const PlaylistComponent: FC = () => {
  const match = useRouteMatch<{ playlistid: string }>();
  const { ready, playlist, songs } = useTracker(() => {
    const handle = Meteor.subscribe("playlists");
    const shandle = Meteor.subscribe("songs");
    const id = match.params.playlistid;
    const playlist = Playlists.findOne(id);
    let songs
    if (playlist) {
      songs = Songs.find({
        _id: { $in: playlist?.list.map((v) => v.songId) },
      }).fetch();
    }
    return { ready: handle.ready() && shandle.ready(), playlist, songs };
  });
  return (
    <>
      {ready && (
        <>
          <h1>{playlist?.name} </h1>
          <h2>{playlist?.timestamp.toString()}</h2>
          <ul>
            {songs?.map((s) => (
              <li>
                {s.author} {s.title}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};
