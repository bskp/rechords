import React from "react";
import { createRoot } from "react-dom/client";
import { Meteor } from "meteor/meteor";
import App from "/imports/ui/App";
import { createInstance, MatomoProvider } from "@datapunt/matomo-tracker-react";

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
