import React from "react";
import { createRoot } from "react-dom/client";
import { Meteor } from "meteor/meteor";
import App from "/imports/ui/App";
import { createInstance, MatomoProvider } from "@datapunt/matomo-tracker-react";

// rspack has no equivalent of Meteor's eager .less loading, so every
// stylesheet is pulled in explicitly. The two *.import.less files are omitted
// on purpose: they hold variables and mixins and are @imported by the rest.
import "./main.less";
import "./viewer.less";
import "./tooltip.less";
import "./users.less";
import "./songlist.less";
import "./print.less";
import "./icons.less";
import "./gui-elements.less";
import "./login.less";
import "./fonts.less";
import "./fret.less";
import "./editor.less";
import "./drawer.less";
import "./chordsheet.less";
// The stylesheets under imports/ui are imported by their own components.

const matomoUrlBase = Meteor.settings.public.matomoUrlBase;
const app = matomoUrlBase ? (
  // @ts-ignore
  <MatomoProvider
    value={createInstance({
      urlBase: matomoUrlBase,
      siteId: 1,
      linkTracking: false, // optional, default value: true
    })}
  >
    <App />
  </MatomoProvider>
) : (
  <App />
);

Meteor.startup(() => {
  const container = document.getElementById("react-target");
  const root = createRoot(container!);
  root.render(app);
});
