import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import Songs, { Revisions } from "../imports/api/collections";
import "../imports/api/methods.ts";

Meteor.publish("songs", function () {
  // todo: some kind of collection
  if (Meteor.user()?.profile) {
    return Songs.find({});
  } else {
    return Songs.find({ tags: "lizenz:frei" });
  }
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
