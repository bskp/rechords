import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withTracker } from 'meteor/react-meteor-data';

import Songs, {Song} from '../api/collections.ts';

import List from './List.tsx';
import Viewer from './Viewer.tsx';
import Editor from './Editor.jsx';
import Progress from './Progress.tsx';
import Drawer from './Drawer.tsx';
import HideSongList from './HideSongList';

import { BrowserRouter, Route, Switch, useHistory} from 'react-router-dom';
import DocumentTitle from 'react-document-title';
import { MobileMenu } from './MobileMenu.tsx'

const empty_song = {
    title: "Neues Lied",
    text: "Titel\nInterpret\n========\n\n#Schlagwort\n\n1:\nDas ist die [A]erste Strophe\nHat zum Teil auch [em]Akkorde\n\n\nNach zwei leeren Zeilen gilt jeglicher Text als Kommentar.\n\nRefrain:\nTra la lalala\nla la lala la la\n\n2:\nUnd noch eine weil's so schön ist",
    author: "Unknown"
};

const nA404 = (
    <div className="container">
        <DocumentTitle title="Hölibu | 404" />
        <aside id="list" className="drawer open"/>
        <div className="content chordsheet-colors">
            <span id="logo">
                <h1>404</h1>
                <h2>n/A</h2>
            </span>
        </div>
    </div>
)

const logo = (
    <div className="content chordsheet-colors">
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
        this.state = { songListHidden: false }
        this.viewerRef = React.createRef()
    }


    hideSongList = (hide) => {
        this.setState({
            songListHidden: hide
        });
    }

    toggleSongList = () => {
        this.setState((state) => {
            return {songListHidden: !state.songListHidden}
        });
    }

    render() {
        if (this.props.dataLoading) {
            return (
                <div id="body">
                    <DocumentTitle title="Hölibu" />
                    <aside className="drawer open list-colors">Lade Lieder…</aside>
                    {logo}
                </div>
            )
        }

        const getSong = (params) => {
            return Songs.findOne({
                author_: params.author,
                title_: params.title
            });

        }



        return (
            <BrowserRouter>
            <>
                <MobileMenu 
                    transposeHandler = {this.viewerRef}
                    toggleMenu={this.toggleSongList}
                />
                <div id="body">
                <List songs={this.props.songs} hidden={this.state.songListHidden} open={true}/>
                <Switch>
                    <Route exact path='/' render={(props) => (
                            <div className="container">
                                <DocumentTitle title="Hölibu" />
                                {logo}
                            </div>
                    )} />


                    <Route path='/view/:author/:title' render={(routerProps) => {
                        let song = getSong(routerProps.match.params);

                        if (song === undefined) {
                            return nA404; 
                        }

                        return (
                            <>
                                <DocumentTitle title={"Hölibu | " + song.author + ": " + song.title}/>
                                <Viewer song={song}  songs={this.props.songs} ref={this.viewerRef} 
                                {...routerProps} />
                            </>
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
                                <HideSongList handle={this.hideSongList}/>
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

                    <Route path="/progress" render={() => {
                        return (
                            <>
                                <DocumentTitle title="Hölibu | Überblick" />
                                <Progress songs={this.props.songs} />
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
        dataLoading: !songHandle.ready() || !revHandle.ready(),
        songs: Songs.find({}, { sort: { title: 1 } }).fetch(),
    };
})(App);