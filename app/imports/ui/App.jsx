import React, { Component } from 'react';
import { withTracker } from 'meteor/react-meteor-data';

import Songs, {Song} from '../api/collections.ts';

import List from './List.tsx';
import Viewer from './Viewer.tsx';
import Editor from './Editor.jsx';
import Progress from './Progress.tsx';
import Users from './Users.tsx';
import User from './User.tsx';
import HideSongList from './HideSongList';
import Login from './Login.tsx';
import MetaContent from './MetaContent';

import { BrowserRouter, Route, Switch, useHistory} from 'react-router-dom';
import DocumentTitle from 'react-document-title';
import { MobileMenu } from './MobileMenu.tsx'

const empty_song = {
    title: "Neues Lied",
    text: "Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil's so schön ist",
    author: "Unknown"
};

const nA404 = (
    <div className="content chordsheet-colors">
        <DocumentTitle title="Hölibu | 404" />
        <span id="logo">
            <h1>404</h1>
            <h2>n/A</h2>
        </span>
    </div>
)

AdminRoute = ({ render: render, ...rest }) => (
    <Route {...rest} render={(props) => (

        Meteor.user().profile.role == 'admin'
            ? render(props) : nA404
    )} />
)



// App component - represents the whole app
class App extends Component {

    constructor(props) {
        super(props);
        this.state = { songListHidden: false }
        this.viewerRef = React.createRef()
    }

    hideSongListOnMobile = () => {
        if (window.innerWidth > 900) return;
        this.setState({
            songListHidden: true
        });
    }

    hideSongList = (hide) => {
        this.setState({
            songListHidden: hide
        });
    }

    toggleSongList = () => {
        this.setState((state) => ({songListHidden: !state.songListHidden })); // ({}) can be used instead of {return {}}
    }

    render() {
        if (!this.props.user) {

            const aside = window.innerWidth > 900 ? <aside className="drawer open list-colors"> </aside> : undefined;
            return (
                <div id="body">
                    <DocumentTitle title="Hölibu" />
                    {aside}
                    <Login />
                </div>
            )
        }

        if (this.props.songsLoading) {
            return (
                <div id="body">
                    <DocumentTitle title="Hölibu" />
                    <aside className="drawer open list-colors">Lade Lieder…</aside>
                    <div className="content chordsheet-colors"> </div>
                </div>
            )
        }

        const getSong = (params) => {
            return Songs.findOne({
                author_: params.author,
                title_: params.title
            });

        }

        // If any song's title changes, the key for the <List /> changes and flushes all states.
        // This is required to update all internal "caching states" (matches etc.)
        const list_key = this.props.songs.map( s => s.title).join('-');

        return (
            <BrowserRouter>
            <>
                <MobileMenu 
                    transposeHandler = {this.viewerRef}
                    toggleMenu={this.toggleSongList}
                />
                <div id="body">
                <List 
                    songs={this.props.songs}
                    key={list_key}
                    hidden={this.state.songListHidden}
                    hideOnMobile={this.hideSongListOnMobile}
                    user={this.props.user}
                />
                <Switch>

                    <Route exact path='/' render={(props) => (
                                    <section className="content" id="home">
                                        <DocumentTitle title="Hölibu" />
                                        <img src="/icons/header.svg" />

                                        <p>Exakt wie Wikipedia. Einfach für Lieder. Mit Akkorden.</p>
                                    </section>
                    )} />


                    <Route path='/view/:author/:title' render={(routerProps) => {
                        let song = getSong(routerProps.match.params);

                        if (song === undefined) {
                            return nA404; 
                        }

                        return (
                            <>
                                <DocumentTitle title={"Hölibu | " + song.author + ": " + song.title}/>
                                <Viewer song={song}  ref={this.viewerRef} 
                                {...routerProps} />
                            </>
                        )
                    }} />

                    <AdminRoute path='/edit/:author/:title' render={(match) => {
                        let song = getSong(match.match.params);

                        if (song === undefined) {
                            return nA404;
                        }

                        // In any case, the editor is rendered. However, a re-render is triggered after the song's
                        // revisions have been loaded.
                        let editor = this.props.revisionsLoading ? <Editor song={song} /> : <Editor song={song} />;

                        return (
                            <>
                                <DocumentTitle title={"Hölibu | " + song.author + ": " + song.title + " (bearbeiten)"}/>
                                <HideSongList handle={this.hideSongList}/>
                                {editor}
                            </>
                        )
                    }} />

                    <Route path="/new" render={() => {
                        var song = new Song(empty_song);

                        return (
                            <>
                                <DocumentTitle title="Hölibu | Neues Lied" />
                                <HideSongList handle={this.hideSongList}/>
                                <Editor song={song} />
                            </>
                        )
                    }} />

                    <Route path="/progress" render={() => {
                        const content = this.props.revisionsLoading ? (
                            <div className="content chordsheet-colors">Lade Lieder-Fortschritt…</div>
                            ) : <Progress songs={this.props.songs} />;

                        return (
                            <>
                                <DocumentTitle title="Hölibu | Lieder-Fortschritt" />
                                {content}
                            </>
                        )
                    }} />

                    <Route path="/users" render={() => {
                        const users = Meteor.users.find().fetch();
                        return (
                            <>
                                <DocumentTitle title="Hölibu | Alle Benutzer" />
                                <Users users={users}/>
                            </>
                        )
                    }} />

                    <Route path="/user" render={() => {
                        const user = Meteor.user();
                        return (
                            <>
                                <DocumentTitle title={"Hölibu | " + user.profile.name} />
                                <User user={user} key={user._id} revisionsLoading={this.props.revisionsLoading}/>
                            </>
                        )
                    }} />

                    <Route component={NoMatch} />
                </Switch>
                </div>
            </>
            </BrowserRouter>
        );
    }
}

const NoMatch = ({ location }) => nA404;

export default withTracker(props => {
    const songHandle = Meteor.subscribe('songs');
    const revHandle = Meteor.subscribe('revisions');

    return {
        songsLoading: !songHandle.ready(),
        revisionsLoading: !revHandle.ready(),
        songs: Songs.find({}, { sort: { title: 1 } }).fetch(),
        user: Meteor.user()
    };
})(App);