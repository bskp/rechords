import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withTracker } from 'meteor/react-meteor-data';
import { CSSTransitionGroup } from 'react-transition-group'

import Songs from '../api/collections.js';

import List from './List.jsx';
import Viewer from './Viewer.jsx';
import Editor from './Editor.jsx';
import Collapsed from './Collapsed.jsx';

import { BrowserRouter, Route, Switch } from 'react-router-dom';
import DocumentTitle from 'react-document-title';

const empty_song = {
    title: "New Song",
    text: "Titel\nInterpret\n========\n\n#Schlagwort\n\nText ohne vorangehenden Titel mit Doppelpunkt ist einfach Kommentar.\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\nref:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil's so schön ist",
    author: "Unknown"
};

const nA404 = (
    <div className="container">
        <DocumentTitle title="Hölibu | 404" />
        <aside id="list">&nbsp;</aside>
        <div className="content chordsheet">
            <span id="logo">
                <h1>404</h1>
                <h2>n/A</h2>
            </span>
        </div>
    </div>
)

const logo = (
    <div className="content chordsheet">
        <span id="logo">
            <h2>Hölibu</h2>
            <h1>3000</h1>
        </span>
    </div>
)


// App component - represents the whole app
class App extends Component {

    constructor(props) {
        super(props);
    }

    getSongTree() {
        let filter = {};
        let out = {};

        this.props.songs.forEach((song) => {
            if (out[song.author] === undefined) {
                out[song.author] = [];
            }
            out[song.author].push(song);
        });
        return out;
    }

    render() {
        if (this.props.dataLoading) {
            return (
                <div className="container">
                    <DocumentTitle title="Hölibu 3000" />
                    <aside id="list" />
                    {logo}
                </div>
            )
        }

        let list = (<List tree={this.getSongTree()} />);

        const getSong = (params) => {
            return song = Songs.findOne({
                author_: params.author,
                title_: params.title
            });

        }

        return (
            <BrowserRouter>
                <Switch>
                    <Route exact path='/' render={(props) => (
                            <div className="container">
                                <DocumentTitle title="Hölibu 3000" />
                                {list}
                                {logo}
                            </div>
                    )} />


                    <Route path='/view/:author/:title' render={(match) => {
                        let song = getSong(match.match.params);

                        if (song === undefined) {
                            return nA404; 
                        }

                        return (
                            <div className="container">
                                <DocumentTitle title={"Hölibu | " + song.author + ": " + song.title}/>
                                {list}
                                <Viewer song={song} />
                            </div>
                        )
                    }} />

                    <Route path='/edit/:author/:title' render={(match) => {
                        let song = getSong(match.match.params);

                        if (song === undefined) {
                            return na404;
                        }

                        song = Songs._transform(song);

                        return (
                            <>
                                <DocumentTitle title={"Hölibu | " + song.author + ": " + song.title + " (bearbeiten)"}/>
                                <Editor song={song} />
                            </>
                        )
                    }} />

                    <Route path="/new" render={() => {
                        song = Songs._transform(empty_song);
                        return (
                            <>
                                <DocumentTitle title="Hölibu | Neues Lied" />
                                <Editor song={song} />
                            </>
                        )
                    }} />

                    <Route component={NoMatch} />
                </Switch>
            </BrowserRouter>
        );
    }
}

const NoMatch = ({ location }) => (
    <div>
        <h3>No match for <code>{location.pathname}</code></h3>
    </div>
)

App.propTypes = {
    dataLoading: PropTypes.bool.isRequired,
    songs: PropTypes.array.isRequired,
};

export default withTracker(props => {
    const songHandle = Meteor.subscribe('songs');
    const revHandle = Meteor.subscribe('revisions');

    return {
        dataLoading: !songHandle.ready() && !revHandle.ready(),
        songs: Songs.find({}, { sort: { title: 1 } }).fetch(),
    };
})(App);