import classNames from 'classnames'
import { Meteor } from 'meteor/meteor'
import { ReactElementLike } from 'prop-types'
import * as React from 'react'
import { useRef } from 'react'
import { PropsWithChildren } from 'react'
import { MouseEventHandler } from 'react'
import { FC } from 'react'
import { Link } from 'react-router-dom'
import { useScrollHideEffect, useScrollHideEffectRef } from '../api/helpers'
import { Menu } from './Icons.jsx'


import './mobileMenuStyle.less'

interface MobileMenuProps extends React.HTMLProps<HTMLElement> {
    toggleSongList: MouseEventHandler,
    songListHidden: boolean
}


export const MobileMenu: FC<MobileMenuProps> = (p) => {

  const toggle = ev => p.toggleSongList(ev)

  const classes = classNames(
    'mobilemenu', 
    {'hide-extensions': !p.songListHidden}
  )
  React.useEffect( () =>{
    document.documentElement.classList.toggle('noscroll',!p.songListHidden)}, [p.songListHidden])

  const ref = useRef()
  useScrollHideEffectRef(ref, 64)

  return <div className={classes} ref={ref}>
    <span onClick={toggle} id="menu"><Menu /></span>
    <span className="username"> 
      <Link onClick={toggle} to="/user">{Meteor.user().profile.name}</Link>
    </span>
  </div>
}


export const MobileMenuShallow: FC<{children: ReactElementLike[]}> = ({children}) => {

  const ref = useRef()
  
  useScrollHideEffectRef(ref, 64)


  const classes = classNames(
    'mobilemenu', 
    'extend' 
  )


  return <div className={classes} ref={ref}>
    {children}
  </div>
}


