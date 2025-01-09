import * as React from 'react';

import {withRouter} from 'react-router-dom';

import './halloStyle.less';

import 'moment/locale/de';
import MetaContent from './MetaContent';
import {ReactSVG} from "react-svg";

const Hallo = () =>
  (
    <div className="content" id="hallo">
      <p><em>Hölibu und Wikipedia hatten ein Kind zusammen – herausgekommen ist das…</em></p>
      <ReactSVG src='/svg/header.svg' />
      <MetaContent title="Hallo" />
    </div>
  );

export default withRouter(Hallo);
