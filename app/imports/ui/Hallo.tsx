import * as React from 'react'

import { withRouter } from 'react-router-dom'
import { Song } from '../api/collections'
import { Header } from './Icons'

import './halloStyle.less'

import 'moment/locale/de'
import MetaContent from './MetaContent'
import { Meteor } from 'meteor/meteor'

interface HalloProps {
    songs: Array<Song>
    user: Meteor.User
}

class Hallo extends React.Component<HalloProps> {

  constructor(props) {
    super(props)
  }


  render() {
    return (
      <div className="content" id="hallo">
        <p><em>Hölibu und Wikipedia hatten ein Kind zusammen – herausgekommen ist das…</em></p>
        <Header />
        <MetaContent songs={this.props.songs} title="Hallo" />
      </div>
    )
  }
}

export default withRouter(Hallo)
