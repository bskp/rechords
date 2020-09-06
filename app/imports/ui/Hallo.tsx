import * as React from 'react';

import { withRouter, Link } from 'react-router-dom';
import Songs, { Revisions, Song } from '../api/collections.js';
import { Header } from './Icons';

import './Hallo.less'

import "moment/locale/de";
import MetaContent from './MetaContent';

class Hallo extends React.Component<{ revisionsLoading : boolean, songs : Array<Song>, user : Meteor.User}, {}> {

    constructor(props) {
        super(props);
    }


    render() {

        if (!this.props.revisionsLoading) {
        }

        let song_ids = [];
        

        const song_links = song_ids.map( ( id ) => {
            let s = Songs.findOne(id);
            return s ? <li key={'sl' + s._id}><Link to={'/view/' + s.author_ + '/' + s.title_}>{s.title}</Link></li> : undefined;
        });

        return (
            <div className="content" id="hallo">
                <p><em>Hölibu und Wikipedia hatten ein Kind zusammen – herausgekommen ist das…</em></p>
                <Header />
                <MetaContent songs={this.props.songs} title="Hallo" />
            </div>
        );
    }
}

export default withRouter(Hallo);
