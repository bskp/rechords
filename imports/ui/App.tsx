import React, { useState, useEffect, useMemo } from 'react';
import { createStore } from 'redux-dynamic-modules-core';
import { Provider } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';

import Songs, { Song } from '../api/collections';
import TrackingDocumentTitle from './TrackingDocumentTitle';
import Hallo from '/imports/ui/Hallo';
import {withTracker} from "meteor/react-meteor-data";

const empty_song = {
    title: 'Neues Lied',
    text: 'Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil\'s so schön ist',
    author: 'Unknown'
};

const nA404 = (
    <div className="content chordsheet-colors">
        <TrackingDocumentTitle title="Hölibu | 404" track_as="error-404" />
        <span id="logo">
      <h1>404</h1>
      <h2>n/A</h2>
    </span>
    </div>
);

const NA400 = () => (
    <div className="content chordsheet-colors">
        <TrackingDocumentTitle title="Hölibu | 400" track_as="error-400" />
        <span id="logo">
      <h1>400</h1>
      <h2>n/A</h2>
    </span>
    </div>
);

const WriterRoute = ({ render, ...rest }) => (
    <Route {...rest} render={(props) => {
        const role = Meteor.user()?.profile.role;
        return (role === 'admin' || role === 'writer') ? render(props) : nA404;
    }} />
);

const AdminRoute = ({ render, ...rest }) => (
    <Route {...rest} render={(props) => (
        Meteor.user()?.profile.role === 'admin' ? render(props) : nA404
    )} />
);

const App = (props) => {
    const [songListHidden, setSongListHidden] = useState(false);
    const [swapTheme, setSwapTheme] = useState(false);
    const [themeTransition, setThemeTransition] = useState(false);

    //const store = useMemo(() => createStore({}), []);
    const store = createStore({});

    useEffect(() => {
        const ut = Meteor.user()?.profile.theme ?? 'auto';
        let themeDark = false;
        if (ut === 'auto') themeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (ut === 'dark') themeDark = true;
        if (swapTheme) themeDark = !themeDark;

        const theme = (themeDark ? 'dark' : 'light') + (themeTransition ? ' transition' : '');
        document.documentElement.classList.value = theme;
    }, [swapTheme, themeTransition]);

    const hideSongListOnMobile = () => {
        if (window.innerWidth > 700) return;
        setSongListHidden(true);
    };

    const hideSongList = (hide) => {
        setSongListHidden(hide);
    };

    const toggleSongList = () => {
        setSongListHidden((prev) => !prev);
    };

    const toggleTheme = () => {
        setSwapTheme((prev) => !prev);
        setThemeTransition(true);
        Meteor.setTimeout(() => {
            setThemeTransition(false);
        }, 1000);
    };

    if (!Meteor.user()) {
        const aside = window.innerWidth > 900 ? <aside className="drawer open list-colors">&nbsp;</aside> : undefined;
        return (
            <div id="body" className="light">
                <TrackingDocumentTitle title="Hölibu" track_as="/no-login" />
                {aside}
            </div>
        );
    }

    if (props.songsLoading) {
        return (
            <div id="body" className="light">
                <aside className="drawer open list-colors">Lade Lieder…</aside>
                <div className="content chordsheet-colors">&nbsp;</div>
            </div>
        );
    }

    const getSong = (params) => {
        if (params.author === '-') {
            return Songs.findOne({ title_: params.title });
        }
        return Songs.findOne({ author_: params.author, title_: params.title });
    };

    return (
        <BrowserRouter>
            <Provider store={store}>
                <div id="body">
                    <Switch>
                        <Route exact path="/">
                            <TrackingDocumentTitle title="Hölibu 3000" />
                            <ErrorBoundary fallback={<NA400 />}>
                                <Hallo songs={props.songs} revisionsLoading={props.revisionsLoading} />
                            </ErrorBoundary>
                        </Route>
                        <Route>
                            {nA404}
                        </Route>
                    </Switch>
                </div>
            </Provider>
        </BrowserRouter>
    );
};

export default withTracker(async () => {
    const songHandle = Meteor.subscribe('songs');
    const revHandle = Meteor.subscribe('revisions');

    return {
        songsLoading: !songHandle.ready(),
        revisionsLoading: !revHandle.ready(),
        songs: Songs.find({}, { sort: { title: 1 } }).fetch(),
    };
})(App);
