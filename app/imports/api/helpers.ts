import { generatePath } from "react-router-dom";
import { Song } from "./collections";
import { History } from "history";

export const userMayWrite = () => {
  const role = Meteor.user()?.profile?.role;
  return role == "admin" || role == "writer";
};

export enum View {
  view = "view",
  edit = "edit",
  print = "print",
  home = "/",
}

export const routePath = (view: View, song: Song) => {
  return generatePath("/:view/:author/:title", {
    view: view,
    author: song.author_,
    title: song.title_,
  });
};

export const navigateTo = (history: History, view: View, song?: Song) => {
  if (song === undefined) {
    history.push(view);
    return;
  }

  history.push(routePath(view, song));
};

export const navigateCallback = (history: History, view: View, song?: Song) => {
  return () => navigateTo(history, view, song);
};

export const currentFocusOnInput = (e: KeyboardEvent) => {
  const tagName = (e.target as Element)?.tagName;
  // Do not steal focus if already on <input>
  if (["INPUT", "TEXTAREA"].includes(tagName)) return true;
  if ((e.target as Element).getAttribute("contenteditable")) return true;

  // Ignore special keys
  if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return true;
  return false;
};
