import * as React from 'react';
import {FunctionComponent} from 'react';

import {RouteComponentProps, withRouter} from 'react-router-dom';
import {Song} from '../api/collections';

import './halloStyle.less';

import 'moment/locale/de';
import MetaContent from './MetaContent';

interface HalloProps extends RouteComponentProps<any> {
    songs: Array<Song>;
    revisionsLoading: boolean;
}

const Hallo: FunctionComponent<HalloProps> = (props) =>
  (
    <div className="content" id="hallo">
      <p><em>Hölibu und Wikipedia hatten ein Kind zusammen – herausgekommen ist das…</em></p>
      <MetaContent songs={props.songs} title="Hallo" />
    </div>
  );

export default withRouter(Hallo);
