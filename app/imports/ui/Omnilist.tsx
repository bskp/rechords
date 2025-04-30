import { FC } from "react";
import * as React from "react";
import { Song } from "../api/collections";
import { Meteor } from "meteor/meteor";
import ListItem from "./Songlist/ListItem";
import MetaContent from "./MetaContent";

export const Omnilist: FC<{ songs: Song[] }> = ({ songs }) => {
  const user = Meteor.user();
  if (user) {
    const { darlings } = user.profile;

    const loved = songs.filter((s) => darlings.includes(s._id));
    const authors = songs.reduce(
      (group, v) => {
        group[v.author] = (group[v.author] ?? 0) + 1;
        return group;
      },
      {} as Record<string, number>
    );

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
              .slice(0,20)
              .map((s) => (
                <li>{s[0]} {s[1]}</li>
              ))}
          </ul>
        </section>
        <section className="breit">
            <h3>Tags</h3>
            <MetaContent
            title="Schlagwortverzeichnis"
          />

        </section>
        <section><h3>Playlists</h3>

        </section>
        <section>lsdlflll</section>
        <section>asdfsdfs</section>
      </div>
    );
  }
};
