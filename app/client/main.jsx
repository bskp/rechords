import React from 'react';
import {Meteor} from 'meteor/meteor';
import {render} from 'react-dom';
import {createInstance, MatomoProvider} from '@datapunt/matomo-tracker-react';
import App from '../imports/ui/App.tsx';

const matomoUrlBase = Meteor.settings.public.matomoUrlBase;
const app = matomoUrlBase ? (
  <MatomoProvider value={createInstance({
    urlBase: matomoUrlBase,
    siteId: 1,
    linkTracking: false, // optional, default value: true
  })}>
    <App/>
  </MatomoProvider>
) : <App/>;

Meteor.startup(() => {
  render(app, document.getElementById('app'));
});


