import {Link} from "react-router-dom";
import {MdAccountCircle, MdClose, MdDarkMode, MdHome, MdLightMode, MdSearch} from "react-icons/md";
import * as React from "react";
import {ThemeContext} from "./App";

import './menuStyle.less';
import {useEffect, useRef, useState} from "react";

export function Menu(props: { filter: string, setFilter: (filter: string) => void }) {
  const [searching, setSearching] = useState(false);
  const refFilter = useRef<HTMLInputElement>(null);

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key == 'Escape') {
      props.setFilter('');
      refFilter.current?.blur();

      e.preventDefault();
      return;
    }

    // Do not steal focus if on <input>
    if ((e.target as Element)?.tagName == 'INPUT') return;

    // Ignore special keys
    if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return;

    // Check if the pressed key has a printable representation
    if (e.key && e.key.length === 1) {
      refFilter.current?.focus();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  })

  const onChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    props.setFilter(event.currentTarget.value);
  };

  return (
    <ThemeContext.Consumer>
      {({themeDark, toggleTheme}) =>
        searching ? <menu className="iconmenu">
            <input type="text"
                   placeholder="Lieder suchen…"
                   value={props.filter}
                   onBlur={() => setSearching(true)}
                   onChange={onChange}
                   ref={r => {
                     r && r.focus();
                     refFilter.current = r
                   }}
            />
            <div><MdClose onClick={() => {setSearching(false); props.setFilter('');}/></div>
          </menu>
          : <menu className="iconmenu">
            <li className="search" onClick={() => setSearching(true)}><MdSearch/><span>Suche…</span></li>
            <li><Link to="/"><MdHome/></Link></li>
            <li><Link to="/user"><MdAccountCircle/></Link></li>
            <li onClick={_ => toggleTheme()}>
              {themeDark ? <MdLightMode/> : <MdDarkMode/>}
            </li>
          </menu>
      }
    </ThemeContext.Consumer>)
}