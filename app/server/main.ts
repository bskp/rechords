import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import Songs, { Songbooks, Revisions } from "../imports/api/collections";
import "../imports/api/methods.ts";

Meteor.publish("songs", function () {
  const allowedSongbooks =
    Meteor.user() === undefined
      ? []
      : Songbooks.find({ owners: Meteor.user()!._id }).map(
          (songbook) => songbook.name_,
        );

  allowedSongbooks.push("lizenz-frei");

  if (!["admin", "writer"].includes(Meteor.user()?.profile.role)) {
    return Songs.find({
      tags: "fini",
      $or: [
        { songbook_: { $in: allowedSongbooks } },
        {
          author_: "meta",
          title: /^[^!]/i,
        },
      ],
    });
  }

  return Songs.find({
    $or: [
      { songbook_: { $in: allowedSongbooks } },
      {
        author_: "meta",
        title: /^[^!]/i,
      },
    ],
  });
});

Meteor.publish("revisions", function () {
  if (Meteor.user()?.profile) {
    return Revisions.find({});
  } else {
    const songids = Songs.find(
      { tags: "lizenz:frei" } /* , { fields: { _id: 1 } }*/,
    ).fetch();
    return Revisions.find({ of: { $in: songids.map((s) => s._id) } });
  }
});

Meteor.startup(async () => {
  if (Songbooks.find().count() === 0) {
    if (Meteor.isServer) {
      Songbooks.createIndex({ name_: 1 }, { unique: true });
    }
    const frei = "lizenz-frei";
    Songbooks.insert({
      name: "Lizenz Frei",
      name_: frei,
      owners: [],
      reader_can_invite: true,
    });
    Songs.update(
      { tags: "lizenz:frei" },
      { $set: { songbook_: frei } },
      { multi: true },
    );
    const hoelibu = "hoelibu";
    Songbooks.insert({
      name: "Hoelibu",
      name_: hoelibu,
      owners: [],
      reader_can_invite: true,
    });
    Songs.update(
      { songbook_: { $exists: false } },
      { $set: { songbook_: hoelibu } },
      { multi: true },
    );
  }

  if (Meteor.users.find().count() === 0) {
    Accounts.createUser({
      username: "le",
      email: "bitte_noch_anpassen@chabis.ruebli",
      password: "coq-est-mort",
      profile: { name: "Housi", role: "admin" },
    });
  }
});

Meteor.publish(null, function () {
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

  if (Meteor.user()?.profile.role == "admin")
    return Meteor.users.find({}, fields);

  return Meteor.users.find({ _id: this.userId }, fields);
});
