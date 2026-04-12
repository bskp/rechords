import { generatePath, NavigateFunction } from "react-router-dom";
import { Song } from "./collections";
import { Meteor } from "meteor/meteor";

export const userMayWrite = () => {
  const role = Meteor.user()?.profile?.role;
  return role == "admin" || role == "writer";
};

export enum View {
  view = "view",
  edit = "edit",
  print = "print",
  pdf = "pdf",
  home = "/",
}

export const routePath = (view: View, song: Song) => {
  return generatePath("/:view/:author/:title", {
    view: view,
    author: song.author_,
    title: song.title_,
  });
};

export const navigateTo = (
  navigate: NavigateFunction,
  view: View,
  song?: Song,
) => {
  if (song === undefined) {
    navigate(view);
    return;
  }

  navigate(routePath(view, song));
};

export const navigateCallback = (
  navigate: NavigateFunction,
  view: View,
  song?: Song,
) => {
  return () => navigateTo(navigate, view, song);
};

export const currentFocusOnInput = (e: KeyboardEvent) => {
  const tagName = (e.target as Element)?.tagName;
  if (["INPUT", "TEXTAREA"].includes(tagName)) return true;
  if ((e.target as Element).getAttribute("contenteditable")) return true;

  if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return true;
  return false;
};
