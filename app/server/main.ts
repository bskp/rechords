import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import Songs, { Revisions } from "../imports/api/collections";
import "../imports/api/methods.ts";

Meteor.publish("songs", function () {
  if (this.userId) {
    return Songs.find({});
  } else {
    return Songs.find({
      $or: [
        { tags: "lizenz:frei" },
        {
          author_: "meta",
          title: /^[^!]/i,
        },
      ],
    });
  }
});

Meteor.publish("revisions", function () {
  if (this.userId) {
    return Revisions.find({});
  } else {
    this.ready();
  }
});

Meteor.startup(async () => {
  const userCount = await Meteor.users.rawCollection().countDocuments();
  if (userCount === 0) {
    Accounts.createUser({
      username: "le",
      email: "bitte_noch_anpassen@chabis.ruebli",
      password: "coq-est-mort",
      profile: { name: "Housi", role: "admin" },
    });
  }

  if ((await Songs.find({}).countAsync()) === 0) {
    try {
      const seedData = JSON.parse(Assets.getText("seed-songs.json"));
      seedData.forEach((song: any) => {
        console.log(Meteor.call('saveSong', song))
      });
      console.log(`Seeded ${seedData.length} public domain songs`);
    } catch (e) {
      console.log("No seed songs found:", e);
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

  const user = await Meteor.users.findOneAsync({ _id: this.userId });
  if (user?.profile?.role == "admin")
    return Meteor.users.find({}, fields);

  return Meteor.users.find({ _id: this.userId }, fields);
});
