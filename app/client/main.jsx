import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
 
const instance = createInstance({
  urlBase: Meteor.settings.public.matomoUrlBase,
  siteId: 1,
  linkTracking: false, // optional, default value: true
})

import App from '../imports/ui/App.tsx';

Meteor.startup(() => {
  render((
    <MatomoProvider value={instance}>
      <App />
    </MatomoProvider>
  ), document.getElementById('app'));
  document.get
});
