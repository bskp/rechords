import Songs, {Song} from '../imports/api/collections.js';
import { Revisions } from '../imports/api/collections.js';
import { check } from 'meteor/check'
var slug = require('slug')

Meteor.methods({

    saveSong(song: Song) {
        //  Attach helpers
        song = Songs._transform(song);

        // Parse server-side
        song.parse(song.text);

        check(song.title, String);
        check(song.title_, String);
        check(song.author, String);
        check(song.author_, String);
        check(song.tags, Array);
        check(song.text, String);

        // Check for modifications
        let storedSong = Songs.findOne(song._id);
        if (storedSong != undefined && storedSong.text == song.text) return true;

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
            text: song.text
        }

        Revisions.insert(rev);
        return true;
    }

  });
