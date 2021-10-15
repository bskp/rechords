import {generatePath} from "react-router-dom";
import {Song} from "./collections";
import {History} from 'history';

export const userMayWrite = () => {
  const role = Meteor.user().profile.role;
  return role == 'admin' || role == 'writer';
}

export enum View {
  view = "view",
  edit = "edit",
  print = "print",
  home = "/"
}

export const routePath = (view: View, song: Song) => {
  return generatePath("/:view/:author/:title", {
    view: view,
    author: song.author_,
    title: song.title_
  });
}

export const navigateTo = (history: History, view: View, song?: Song) => {
  if (song === undefined) {
    history.push(view);
  }

  history.push(routePath(view, song));
}

export const navigateCallback = (history: History, view: View, song?: Song) => {
  return () => navigateTo(history, view, song);
}
