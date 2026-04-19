import { generatePath, NavigateFunction } from "react-router";
import { Song } from "./collections";
import { getUser, hasWritePermission } from "./auth";

export const userMayWrite = () => {
  const role = getUser()?.profile.role;
  return hasWritePermission(role);
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
  // Do not steal focus if already on <input>
  if (["INPUT", "TEXTAREA"].includes(tagName)) return true;
  if ((e.target as Element).getAttribute("contenteditable")) return true;

  // Ignore special keys
  if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return true;
  return false;
};
