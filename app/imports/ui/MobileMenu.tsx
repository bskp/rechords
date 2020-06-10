import * as React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from './Icons.jsx';

import './MobileMenu.less'

interface MobileMenuProps extends React.HTMLProps<HTMLElement> {
    toggleSongList: Function,
    songListHidden: boolean
}

export class MobileMenu extends React.Component<MobileMenuProps>  {

    constructor(props) {
        super(props);
    }

    render() {
        const toggle = _ => this.props.toggleSongList();

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
