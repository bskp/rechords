import * as React from 'react';
import {FunctionComponent} from 'react';

import {RouteComponentProps, withRouter} from 'react-router-dom';
import {Song} from '../api/collections';
import {Header} from './Icons';

import './halloStyle.less';

import 'moment/locale/de';
import MetaContent from './MetaContent';
import {Meteor} from 'meteor/meteor';

interface HalloProps extends RouteComponentProps<any> {
    songs: Array<Song>;
    user: Meteor.User;
    revisionsLoading: boolean;
}

const Hallo: FunctionComponent<HalloProps> = (props) =>
  (
    <div className="content" id="hallo">
      <p><em>Hölibu und Wikipedia hatten ein Kind zusammen – herausgekommen ist das…</em></p>
      <Header />
      <MetaContent songs={props.songs} title="Hallo" />
    </div>
  );

export default withRouter(Hallo);
