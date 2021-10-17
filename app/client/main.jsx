import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'
import App from '../imports/ui/App.tsx';
 
const matomoUrlBase = Meteor.settings.public.matomoUrlBase;

let app

if( matomoUrlBase ) {

const instance = createInstance({
  urlBase: matomoUrlBase,
  siteId: 1,
  linkTracking: false, // optional, default value: true
})


    app = <MatomoProvider value={instance}>
      <App />
    </MatomoProvider>
} else {
  app = <App />
}
Meteor.startup(() => {
  render( app, document.getElementById('app'));
  document.get
});


