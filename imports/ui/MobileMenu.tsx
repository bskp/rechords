import classNames from 'classnames';
import {ReactElementLike} from 'prop-types';
import * as React from 'react';
import {FC, MouseEventHandler, useRef} from 'react';
import {useScrollHideEffectRef} from '../api/helpers';
import { MdManageSearch } from 'react-icons/md';


import './mobileMenuStyle.less';

interface MobileMenuProps extends React.HTMLProps<HTMLElement> {
    toggleSongList: MouseEventHandler,
    songListHidden: boolean
}


export const MobileMenu: FC<MobileMenuProps> = (p) => {

  const toggle: MouseEventHandler = ev => p.toggleSongList(ev);

  const classes = classNames(
    'mobilemenu', 
    {'hide-extensions': !p.songListHidden}
  );
  React.useEffect( () =>{
    document.documentElement.classList.toggle('noscroll',!p.songListHidden);}, [p.songListHidden]);

  const ref = useRef();
  useScrollHideEffectRef(ref, 64);

  return <div className={classes} ref={ref}>
    <span onClick={toggle} id="menu"><MdManageSearch /></span>
  </div>;
};


export const MobileMenuShallow: FC<{children: ReactElementLike[]}> = ({children}) => {

  const ref = useRef(null);
  
  useScrollHideEffectRef(ref, 64);


  const classes = classNames(
    'mobilemenu', 
    'extend' 
  );


  return <div className={classes} ref={ref}>
    {children}
  </div>;
};


