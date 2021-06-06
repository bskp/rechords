
export const userMayWrite = () => {
  const role = Meteor.user().profile.role;
  return role == 'admin' || role == 'writer';
}