import React, {Component} from 'react';
import PropTypes from 'prop-types';

import { withTracker } from 'meteor/react-meteor-data';

import Songs from '../api/collections.js';

import List from './List.jsx';
import Viewer from './Viewer.jsx';
import Editor from './Editor.jsx';

import {BrowserRouter, Route, Switch} from 'react-router-dom';

const empty_song = {
    title: "New Song",
    text: "Enter lyrics to get started!",
    author: "Unknown"
};


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
        let list = ( <p>Geduld...</p>);
        if (!this.props.dataLoading) {
            list = (<List tree={this.getSongTree()}/>);
            //list = (<em>fettich.  </em>);
        }

        return (
            <BrowserRouter>
                <div className="container">
                    {list}

                    <Switch>
                        <Route exact path='/' render={(props) => (
                            <div className="content">
                                <h1>hallo zusammen!</h1>
                            </div>
                        )}/>

                        <Route path='/view/:author/:title' render={(match) => {
                            let song = Songs.findOne({
                                author_: match.match.params.author,
                                title_: match.match.params.title
                            });

                            if (song === undefined) {
                                return (<h2>404. {match.match.params.title}</h2>)
                            }
                            return <Viewer song={song} />
                        }}/>

                        <Route path='/edit/:author/:title' render={(match) => {
                            let song = Songs.findOne({
                                author_: match.match.params.author,
                                title_: match.match.params.title
                            });

                            if (song === undefined) {
                                return (<h2>404. {match.match.params.title}</h2>)
                            }
                            return <Editor song={song} />
                        }}/>

                        <Route path="/new" render={() => {
                            return <Editor song={empty_song} />
                        }}/>

                        <Route component={NoMatch}/>
                    </Switch>
                </div>
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
  const handle = Meteor.subscribe('songs');

  return {
    //currentUser: Meteor.user(),
    dataLoading: !handle.ready(),
    songs: Songs.find({}, {sort: {title: 1}}).fetch(),
  };
})(App);