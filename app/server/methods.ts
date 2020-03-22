import Songs, {Song, Revisions, rmd_version} from '../imports/api/collections';
import { check } from 'meteor/check'
import { useReducer } from 'react';

Meteor.methods({


    sendResetEmail(user_id : string) {
        Accounts.sendResetPasswordEmail(user_id);
    },

    saveUser(user: Meteor.User, new_secret : string) {
        const syncUpdate = Meteor.wrapAsync(Meteor.users.update, Meteor.users);

        try {
            syncUpdate(user._id, {$set: user}, {upsert: true});
        }
        catch (e) {
            if (e.code == 11000) {
                throw new Meteor.Error('users.dup_key', e, 'der Wert wird bereits verwendet');
            } else {
                console.log('re-thrown error: ', e);
                throw e;
            }
        }

        if (new_secret == '') return;
        // Set a new 4-word-secret:

        // fetches the (possibly) newly generated user id.
        let id = Accounts.findUserByEmail(user.emails[0].address)._id;

        let chunks = new_secret.trim().split(' ');
        if (chunks.length != 4) throw new Meteor.Error('users.invalid_secret', '', 'Gib vier Wörter an, getrennt durch Leerschläge');

        const [new_first_word, ...secret_words] = chunks;
        Accounts.setUsername(id, new_first_word);
        Accounts.setPassword(id, secret_words.join('-'));
    },

    saveSong(remoteObject: Object) {
        //  Attach helpers
        let song : Song = new Song(remoteObject);

        // Parse server-side
        song.parse(song.text);

        check(song.title, String);
        check(song.title_, String);
        check(song.author, String);
        check(song.author_, String);
        check(song.tags, Array);
        check(song.text, String);

        delete song.revision_cache;  // aka. transient field!

        const user_id = Meteor.userId();
        song.last_editor = user_id;

        // Check for modifications
        let storedSong = Songs.findOne(song._id);
        if (storedSong != undefined && 
            storedSong.text == song.text &&
            'parsed_rmd_version' in storedSong &&
            storedSong.parsed_rmd_version == rmd_version) return true;

        // Save Song
        if ('_id' in song) {
            if (song.text.match(/^\s*$/) != null) {
                Songs.remove(song._id);

                // early return, don't create revision
                return false;

            } else {
                Songs.update(song._id, song);
            }
        } else {
            Songs.insert(song);
        }


        // Create Revision
        let rev = {
            timestamp: new Date(),
            ip: this.connection.clientAddress,
            of: song._id,
            text: song.text,
            editor: user_id
        }

        console.log('rev: ', rev);

        Revisions.insert(rev);
        return true;
    }

  });
