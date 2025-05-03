import Songs, {
  Song,
  Revisions,
  rmd_version,
  Playlist,
  Playlists,
} from "./collections";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Mongo } from "meteor/mongo";
import OptionalId = Mongo.OptionalId;

Meteor.methods({
  saveUser(user: Meteor.User, new_secret: string) {
    const syncUpdate = Meteor.wrapAsync(Meteor.users.update, Meteor.users);

    try {
      syncUpdate(user._id, { $set: user }, { upsert: true });
    } catch (e: any) {
      if (e.code == 11000) {
        throw new Meteor.Error(
          "users.dup_key",
          e,
          "der Wert wird bereits verwendet"
        );
      } else {
        console.log("re-thrown error: ", e);
        throw e;
      }
    }

    if (new_secret === undefined || new_secret == "") return;
    // Set a new 4-word-secret:

    // fetches the (possibly) newly generated user id.
    const id = Accounts.findUserByEmail(user.emails?.[0]?.address ?? "")?._id;

    const chunks = new_secret.trim().split(" ");
    if (chunks.length != 4)
      throw new Meteor.Error(
        "users.invalid_secret",
        "",
        "Gib vier Wörter an, getrennt durch Leerschläge"
      );

    const [new_first_word, ...secret_words] = chunks;
    Accounts.setUsername(id!, new_first_word);
    Accounts.setPassword(id!, secret_words.join("-"));
  },

  saveSong(remoteObject: OptionalId<Song>) {
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
    const storedSong = Songs.findOne(song._id);
    if (storedSong != undefined && storedSong.text == song.text) {
      // Content has not changed.
      if (
        storedSong?.parsed_rmd_version != rmd_version &&
        song._id !== undefined
      ) {
        Songs.update(song._id, song);
      }
      return true; // early return, don't create revision
    }

    const user_id = Meteor.userId() ?? undefined;
    song.last_editor = user_id;

    // Save Song
    if ("_id" in song && song._id !== undefined) {
      if (song.isEmpty()) {
        Songs.remove(song._id);

        return false; // early return, don't create revision
      } else {
        Songs.update(song._id, song);
      }
    } else {
      delete song._id;
      song._id = Songs.insert(song);
    }

    // Create Revision
    const rev = {
      timestamp: new Date(),
      ip: this.connection?.clientAddress ?? "Unknown",
      of: song._id,
      text: song.text,
      editor: user_id,
    };

    Revisions.insert(rev);
    return true;
  },

  createPlaylist(playlistName: string) {
    const user_id = Meteor.userId();

    if (user_id) {
      Playlists.insert({
        ownerid: user_id,
        name: playlistName,
        list: [],
        timestamp: new Date(),
      });
    }
  },
  updatePlaylist(playlist: Playlist) {
    const user_id = Meteor.userId();

    if (user_id) {
      if (playlist.ownerid !== user_id) {
        throw new Meteor.Error("not your playlist");
      }
      Playlists.update(
        { _id: playlist._id, ownerid: playlist.ownerid },
        playlist
      );
    }
  },
  removePlaylist(playlistId: string) {
    const user_id = Meteor.userId();
    if (user_id) {
      Playlists.remove({ _id: playlistId, ownerid: user_id });
    }
  },
});
