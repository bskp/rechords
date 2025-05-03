import { FC } from "react";
import * as React from "react";
import { Playlists, Song } from "../api/collections";
import { Meteor } from "meteor/meteor";
import ListItem from "./Songlist/ListItem";
import MetaContent from "./MetaContent";
import { useTracker } from "meteor/react-meteor-data";
import { NavLink } from "react-router-dom";

export const Omnilist: FC<{ songs: Song[] }> = ({ songs }) => {
  const user = Meteor.user();

  if (user) {
    const addPlayList = (name: string) => {
      Meteor.call("createPlaylist", name);
    };
    const { darlings } = user.profile;

    const loved = songs.filter((s) => darlings.includes(s._id));
    const authors = songs.reduce(
      (group, v) => {
        group[v.author_] = (group[v.author_] ?? 0) + 1;
        return group;
      },
      {} as Record<string, number>
    );

    const { ready, playlists } = useTracker(() => {
      const playlistshandle = Meteor.subscribe("playlists");
      return {
        ready: playlistshandle.ready(),
        playlists: Playlists.find({}).fetch(),
      };
    });

    const removePlayList = (_id: string): void => {
      Meteor.call("removePlaylist", _id);
    };

    return (
      <div id="omnilist">
        <section>
          <h3>Loved</h3>
          <ul>
            {loved.map((s) => (
              <ListItem song={s} user={user}></ListItem>
            ))}
          </ul>
        </section>
        <section>
          <h3>Top Artists</h3>
          <ul>
            {Object.entries(authors)
              .sort((a, b) => -a[1] + b[1])
              .slice(0, 20)
              .map((s) => (
                <li>
                  <NavLink to={`/view/${s[0]}`}>
                    {s[0]} {s[1]}
                  </NavLink>
                </li>
              ))}
          </ul>
        </section>
        <section className="breit">
          <h3>Tags</h3>
          <MetaContent className="taglist" title="Schlagwortverzeichnis" />
        </section>
        <section>
          <h3>My Playlists</h3>
          <ul>
            {ready ? (
              [
                playlists.map((p) => (
                  <li>
                    <NavLink to={`/playlist/${p._id}`}> {p.name} </NavLink> 
                    <span onClick={() => removePlayList(p._id)}>x</span>
                  </li>
                )),
                <li>
                  <input
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") {
                        addPlayList(ev.currentTarget.value);
                        ev.currentTarget.value = "";
                      }
                    }}
                  ></input>
                </li>,
              ]
            ) : (
              <>
                <li>...</li>
                <li>...</li>
              </>
            )}
          </ul>
        </section>
        <section>lsdlflll</section>
        <section>asdfsdfs</section>
      </div>
    );
  }
};
