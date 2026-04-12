import Songs, { Song, Revisions, rmd_version } from "./collections";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Mongo } from "meteor/mongo";
import { Random } from "meteor/random";
import { getRoleByUserId, readProfile, hasWritePermission } from "./auth";
import OptionalId = Mongo.OptionalId;

Meteor.methods({
  async saveUser(user: Meteor.User, new_secret: string) {
    const callerId = Meteor.userId();
    if (!callerId) {
      throw new Meteor.Error("not-authorized", "Login required");
    }

    const callerRole = await getRoleByUserId(callerId);
    if (callerRole !== "admin") {
      throw new Meteor.Error("not-authorized", "Only admins can edit users");
    }

    const targetId = user._id;

    const email = user.emails?.[0]?.address?.trim().toLowerCase();
    check(email, String);

    const profile = readProfile(user.profile);

    const profileName = profile.name ?? "";
    check(profileName, String);

    const profileTheme = profile.theme ?? "auto";
    check(profileTheme, String);

    const safeRole = profile.role ?? "user";

    let id = targetId;

    if (!id) {
      id = await Accounts.createUser({
        email,
        username: `pending-${Random.id(10)}`,
        password: Random.secret(24),
        profile: {
          name: profileName,
          theme: profileTheme,
          role: safeRole ?? "user",
        },
      });
    }

    const setFields: Record<string, unknown> = {
      emails: [{ address: email, verified: false }],
      "profile.name": profileName,
      "profile.theme": profileTheme,
    };
    if (safeRole) {
      setFields["profile.role"] = safeRole;
    }

    try {
      await Meteor.users.updateAsync(id, { $set: setFields });
    } catch (e: unknown) {
      const duplicateKeyError =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: number }).code === 11000;

      if (duplicateKeyError) {
        const keyValue =
          typeof e === "object" && e !== null && "keyValue" in e
            ? (e as { keyValue?: Record<string, string> }).keyValue
            : undefined;

        throw new Meteor.Error(
          "users.dup_key",
          `der Wert "${Object.values(keyValue ?? {}).join(", ")}" wird bereits verwendet (${Object.keys(keyValue ?? {}).join(", ")})`,
        );
      } else {
        console.log("re-thrown error: ", e);
        throw e;
      }
    }

    if (new_secret === undefined || new_secret == "") return;
    // Set a new 4-word-secret:

    // fetches the (possibly) newly generated user id.
    const chunks = new_secret.trim().split(" ");
    if (chunks.length != 4)
      throw new Meteor.Error(
        "users.invalid_secret",
        "",
        "Gib vier Wörter an, getrennt durch Leerschläge",
      );

    const [new_first_word, ...secret_words] = chunks;
    Accounts.setUsername(id!, new_first_word);
    await Accounts.setPasswordAsync(id!, secret_words.join("-"));
  },

  async saveOwnUser(user: Meteor.User) {
    const callerId = Meteor.userId();
    if (!callerId) {
      throw new Meteor.Error("not-authorized", "Login required");
    }

    const email = user.emails?.[0]?.address?.trim().toLowerCase();
    check(email, String);

    const profile = readProfile(user.profile);
    const profileName = profile.name ?? "";
    check(profileName, String);

    const profileTheme = profile.theme ?? "auto";
    check(profileTheme, String);

    try {
      await Meteor.users.updateAsync(callerId, {
        $set: {
          emails: [{ address: email, verified: false }],
          "profile.name": profileName,
          "profile.theme": profileTheme,
        },
      });
    } catch (e: unknown) {
      const duplicateKeyError =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: number }).code === 11000;

      if (duplicateKeyError) {
        const keyValue =
          typeof e === "object" && e !== null && "keyValue" in e
            ? (e as { keyValue?: Record<string, string> }).keyValue
            : undefined;

        throw new Meteor.Error(
          "users.dup_key",
          `der Wert "${Object.values(keyValue ?? {}).join(", ")}" wird bereits verwendet (${Object.keys(keyValue ?? {}).join(", ")})`,
        );
      }

      throw e;
    }
  },

  async saveSong(remoteObject: OptionalId<Song>) {
    const role = await getRoleByUserId(this.userId);
    if (!hasWritePermission(role)) {
      throw new Meteor.Error(
        "not-authorized",
        "Missing writer or admin permissions",
      );
    }

    //  Attach helpers
    const song: Song = new Song(remoteObject);

    // Parse server-side
    song.parse(song.text);

    check(song.title, String);
    check(song.title_, String);
    check(song.author, String);
    check(song.author_, String);
    check(song.tags, Array);
    check(song.text, String);

    delete song.revision_cache; // aka. transient field!

    // Check for modifications
    const storedSong = await Songs.findOneAsync(song._id);
    if (storedSong != undefined && storedSong.text == song.text) {
      // Content has not changed.
      if (
        storedSong?.parsed_rmd_version != rmd_version &&
        song._id !== undefined
      ) {
        await Songs.updateAsync(song._id, song);
      }
      return true; // early return, don't create revision
    }

    const user_id = this.userId ?? undefined;
    song.last_editor = user_id;

    // Save Song
    if ("_id" in song && song._id !== undefined) {
      if (song.isEmpty()) {
        await Songs.removeAsync(song._id);

        return false; // early return, don't create revision
      } else {
        await Songs.updateAsync(song._id, song);
      }
    } else {
      delete song._id;
      song._id = await Songs.insertAsync(song);
    }

    // Create Revision
    const rev = {
      timestamp: new Date(),
      ip: this.connection?.clientAddress ?? "Unknown",
      of: song._id,
      text: song.text,
      editor: user_id,
    };

    await Revisions.insertAsync(rev);
    return true;
  },
});
