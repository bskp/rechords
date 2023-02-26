import {generatePath} from 'react-router-dom';
import {Song} from './collections';
import {History} from 'history';

export const userMayWrite = () => {
  const role = Meteor.user().profile.role;
  return role == 'admin' || role == 'writer';
};

export enum View {
  view = 'view',
  edit = 'edit',
  print = 'print',
  home = '/'
}

export const routePath = (view: View, song: Song) => {
  return generatePath('/:view/:author/:title', {
    view: view,
    author: song.author_,
    title: song.title_
  });
};

export const navigateTo = (history: History, view: View, song?: Song) => {
  if (song === undefined) {
    history.push(view);
  }

  history.push(routePath(view, song));
};

export const navigateCallback = (history: History, view: View, song?: Song) => {
  return () => navigateTo(history, view, song);
};

import { Ref, RefObject, useEffect, useRef, useState } from 'react';
/**
 * 
 * @param id 
 * @returns false, if id is undefined or not starting with ref-prefix
 */
import { refPrefix } from './showdown-rechords';
export const isRefId = (id: string): boolean => id && id.startsWith(refPrefix);



/**
 * Setting boolean flag after scroll
 * @returns 
 */
export const useScrollHideEffect = (): boolean => {
  const [showMenu, setShowMenu] = useState(true);

  type xy = [time: number, y: number]
  const last: React.MutableRefObject<[x:number,y:number]> = useRef();

  const hideIf = (current:xy) => {
    if(!last.current) {
      last.current = current;
      return;
    }
    const [[t0,y0],[t1,y1]] = [last.current,current];
    const dY = y1-y0, dT = t1-t0;
    if( dY > 100 && dT > 1000 ) {
      last.current = undefined;
      setShowMenu(false);
      return;
    } 
    if( dY < -100) {
      last.current = undefined;
      setShowMenu(true);
      return;
    }
  };

  useEffect(() => {
    const handler = (ev: Event) => {
      hideIf([ev.timeStamp,window.scrollY]);
    };
    document.addEventListener('scroll', handler);
    return () => document.removeEventListener('scroll',handler);
  },[]);

  return showMenu;
};


/**
 * Setting height direcly 
 * @returns 
 */

export const useScrollHideEffectRef = (ref: RefObject<HTMLElement>,maxheight: number): void => {

  const max = Math.max, min = Math.min;
  type xy = [time: number, y: number]

  useEffect(() => {
    // This only works if effect is called only once
    // -> giving [] as deps ensures this
    let last: xy;
    let height = maxheight;
    let ticking = false;

    const hideIf = (current:xy) => {
      if(!last) {
        last = current;
        return;
      }

      if(!ref.current) {return;}

      if(!ticking) { 
        requestAnimationFrame(() => {
          const [[t0,y0],[t1,y1]] = [last, current];
          const dY = -(max(0,y1)-max(0,y0)), dT = t1-t0;

          const newHeight = min(maxheight, max(height+ dY, 0) ); 
          console.log(y0,y1,newHeight, dY, height);
          if(height !== newHeight ) {
            height = newHeight;

            const relativeHeight = maxheight - newHeight;
            ref.current.style.transformOrigin = `left ${maxheight}px`;
            ref.current.style.transform = ` translateY(${-relativeHeight}px)`;

            last = undefined;
          }
          last = current;
          ticking =false;
        }); 
      }
      // a handle to requestAnimFrame was submitted...
      ticking = true;
    };
    const handler = (ev: Event) => {
      hideIf([ev.timeStamp,window.scrollY]);
    };
    document.addEventListener('scroll', handler);
    return () => document.removeEventListener('scroll',handler);
  },[]);
};
