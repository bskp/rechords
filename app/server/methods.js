import { Songs } from '../imports/api/collections.js';
import { check } from 'meteor/check'
var slug = require('slug')

Meteor.methods({

    saveSong(song) {
        //  Attach helpers
        song = Songs._transform(song);
        song.parse(song.text);

        check(song.title, String);
        check(song.title_, String);
        check(song.author, String);
        check(song.author_, String);
        check(song.tags, Array);
        check(song.text, String);

        if ('_id' in song) {
            if (song.text.match(/^\s*$/) == null) {
                Songs.update(song._id, song);
            } else {
                Songs.remove(song._id);
            }
        } else {
                Songs.remove(song._id);
            Songs.insert(song);
        }

        return song._id;
    }

  });