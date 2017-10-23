import Songs from '../imports/api/collections.js';

Meteor.publish('songs', function () {
    return Songs.find({});
});