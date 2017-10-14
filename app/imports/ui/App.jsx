import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {createContainer} from 'meteor/react-meteor-data';

import {Songs} from '../api/collections.js';

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
        this.state = {editing: false};
    }

    setEditing = (editing) => {
        this.setState({editing: editing});
    }

    render() {
        return (
            <BrowserRouter>
                <div className="container">
                    <Switch>
                        <Route exact path='/' render={(props) => (
                            <div className="content">
                                <h1>hallo zusammen!</h1>
                            </div>
                        )}/>

                        <Route path='/s/:author/:title' render={(match) => {
                            let song = Songs.findOne({
                                author_: match.match.params.author,
                                title_: match.match.params.title
                            });

                            if (song === undefined) {
                                return (<h2>gibts nicht.</h2>)
                            }

                            if (this.state.editing) {
                                return <Editor song={song} modeCallback={this.setEditing}/>
                            } else {
                                // this is Ugly: Props are implicit. ARRRRG...
                                return <Viewer song={song} modeCallback={this.setEditing} />
                            }
                        }}/>

                        <Route path="/new" render={() => {
                            return <Editor song={empty_song} modeCallback={this.setEditing}/>
                        }}/>
                    </Switch>


                    <List songs={this.props.songs}/>
                </div>
            </BrowserRouter>
        );
    }
}

App.propTypes = {
    songs: PropTypes.array.isRequired,
};

export default createContainer(() => {
    return {
        songs: Songs.find({}).fetch(),
    };
}, App);

