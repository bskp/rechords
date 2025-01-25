import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import Songs, { Revisions } from "../imports/api/collections";
import "../imports/api/methods.ts";

import initialSongs from "./songs.json";
import initialRevisions from "./revisions.json";

Meteor.publish("songs", function () {
  return Songs.find({});
});

Meteor.publish("revisions", function () {
  return Revisions.find({});
});

Meteor.startup(async () => {
  const count = await Meteor.users.find().countAsync();
  if (count === 0) {
    Accounts.createUser({
      username: "le",
      email: "bitte_noch_anpassen@chabis.ruebli",
      password: "coq-est-mort",
      profile: { name: "Housi", role: "admin" },
    });
    Accounts.createUser({
      username: "la",
      email: "bitte_@chabis.ruebli",
      password: "pendeuse-est-morte",
      profile: { name: "Fritz", role: "writer" },
    });
    Accounts.createUser({
      username: "ce",
      email: "anpassen@chabis.ruebli",
      password: "poulet-est-mort",
      profile: { name: "Peschä", role: "user" },
    });
    // const list = new Set(initialRevisions.map(({ editor }) => editor)).values()
    // .map( s => s);
    for (const rev of initialRevisions) {
      Revisions.insertAsync(rev);
    }
    for (const song of initialSongs) {
      Songs.insertAsync(song);
    }
  }
});

Meteor.publish(null, async function () {
  if (!this.userId) {
    this.ready();
    return;
  }

  const fields = {
    fields: {
      createdAt: 1,
      emails: 1,
      username: 1,
      profile: 1,
    },
  };

  if ((await Meteor.userAsync())?.profile.role == "admin")
    return Meteor.users.find({}, fields);

  return Meteor.users.find({ _id: this.userId }, fields);
});
