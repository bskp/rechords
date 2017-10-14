import { Songs } from 'collections.js';
import RmdParser from 'rmd-parser.js';
var slug = require('slug')

Meteor.methods({

    save(song) {
        check(song, Object);
        check(song.title, String);
        check(song.title_, String);
        check(song.author, String);
        check(song.author_, String);
        check(song.tags, Array);
        check(song.text, String);

        throw new Meteor.Error("asdf");

        if ('_id' in song) {
            if (song.text.match(/^\s*$/) == null) {
                Songs.update(song._id, song);
            } else {
                Songs.remove(song._id);
            }
        } else {
            Songs.insert(song);
        }
    }

  });