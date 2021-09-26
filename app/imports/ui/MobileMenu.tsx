import { Meteor } from 'meteor/meteor'
import * as React from 'react'
import { MouseEventHandler } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from './Icons.jsx'


import './mobileMenuStyle.less'

interface MobileMenuProps extends React.HTMLProps<HTMLElement> {
    toggleSongList: MouseEventHandler,
    songListHidden: boolean
}

export class MobileMenu extends React.Component<MobileMenuProps>  {
  constructor(props: MobileMenuProps ) {
    super(props)
  }

  render() {
    const toggle = ev => this.props.toggleSongList(ev)

    let classes = 'mobilemenu'
    if (!this.props.songListHidden) classes += ' hide-extensions'

    return <div className={classes} >
      <span onClick={toggle} id="menu"><Menu /></span>
      <span className="username"> 
        <Link onClick={toggle} to="/user">{Meteor.user().profile.name}</Link>
      </span>
    </div>

  }
}
