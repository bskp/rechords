import Songs, {Revisions} from '../imports/api/collections.ts';

Meteor.publish('songs', function () {
    return Songs.find({});
});

Meteor.publish('revisions', function () {
    return Revisions.find({});
});

Meteor.publish(null, function () {
    if (!this.userId) {
      this.ready();
      return;
    }

    const fields = {fields: {
      'createdAt': 1,
      'emails': 1,
      'username': 1,
      'profile': 1
    }};

    if (Meteor.user().profile.role == 'admin') 
      return Meteor.users.find({}, fields);

    return Meteor.users.find({ _id: this.userId }, fields);
  });
