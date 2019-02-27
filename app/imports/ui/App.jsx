import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withTracker } from 'meteor/react-meteor-data';
import { CSSTransitionGroup } from 'react-transition-group'

import Songs, {Song} from '../api/collections.js';

import List from './List.tsx';
import Viewer from './Viewer.jsx';
import Editor from './Editor.jsx';
import Collapsed from './Collapsed.jsx';

import { BrowserRouter, Route, Switch } from 'react-router-dom';
import DocumentTitle from 'react-document-title';

const empty_song = {
    title: "Neues Lied",
    text: "Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil's so schön ist",
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

    render() {
        if (this.props.dataLoading) {
            return (
                <div className="container">
                    <DocumentTitle title="Hölibu" />
                    <aside id="list" />
                    {logo}
                </div>
            )
        }

        let list = (<List songs={this.props.songs}/>);

        const getSong = (params) => {
            return Songs.findOne({
                author_: params.author,
                title_: params.title
            });

        }

        return (
            <BrowserRouter>
                <Switch>

                    <Route exact path='/' render={(props) => (
                            <div className="container">
                                <DocumentTitle title="Hölibu" />
                                <List songs={this.props.songs}/>
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
                                <List songs={this.props.songs}/>
                                <Viewer song={song} />
                            </div>
                        )
                    }} />

                    <Route path='/edit/:author/:title' render={(match) => {
                        let song = getSong(match.match.params);

                        if (song === undefined) {
                            return na404;
                        }

                        return (
                            <>
                                <DocumentTitle title={"Hölibu | " + song.author + ": " + song.title + " (bearbeiten)"}/>
                                <Editor song={song} />
                            </>
                        )
                    }} />

                    <Route path="/new" render={() => {
                        var song = new Song(empty_song);

                        return (
                            <>
                                <DocumentTitle title="Hölibu | Neues Lied" />
                                <Editor song={song} />
                            </>
                        )
                    }} />

                    <Route path="/:filter" render={(match) => {
                        return (
                            <>
                                <DocumentTitle title="Hölibu" />
                                <List songs={this.props.songs} filter={match.match.params.filter} />
                                {logo}
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