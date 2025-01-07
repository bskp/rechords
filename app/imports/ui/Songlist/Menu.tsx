import {Link} from "react-router-dom";
import {MdAccountCircle, MdClose, MdDarkMode, MdHome, MdLightMode, MdSearch, MdSell} from "react-icons/md";
import * as React from "react";
import {useContext, useState} from "react";
import {MenuContext, ThemeContext} from "../App";

import './menuStyle.less';
import MetaContent from "/imports/ui/MetaContent";
import classNames from "classnames";
import classnames from "classnames";
import {Tooltip} from "react-tooltip";

export function Menu(props: { filter: string, setFilter: (filter: string) => void }) {
  const [showTags, setShowTags] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  const onTagClick = (event: React.MouseEvent<HTMLElement>) => {
    const tag = '#' + event.currentTarget?.childNodes?.[0]?.textContent?.toLowerCase();

    let newFilter;
    if (props.filter.includes(tag)) {
      newFilter = props.filter.replace(tag, '');
    } else {
      newFilter = props.filter + ' ' + tag;
    }
    props.setFilter(newFilter.replace('  ', ' ').trim());
    setShowTags(false);

    event.preventDefault();
  }

  const attachClickHandlers = () => {
    let bucket: string;

    return (node: any) => {
      if (node.name == 'li') {
        const b = node.children.length > 1 ? <b>…</b> : null;
        return <li onMouseDown={onTagClick}>{node.children[0].data}{b}</li>;
      }

      if (node.name == 'h4') {
        bucket = node;
        return node;
      }

      if (node.name == 'ul') {
        node.children.unshift(bucket);
        return node;
      }
    };
  };

  const showSearch = hasFocus || props.filter || showTags;
  const {themeDark, toggleTheme} = useContext(ThemeContext);
  const {setShowMenu} = useContext(MenuContext);

  return <>
      <menu className={classnames(
        'iconmenu',
        {searching: showSearch}
      )}>
        {showSearch ? <>
            <input type="text"
                   placeholder="Lieder suchen…"
                   value={props.filter}
                   onBlur={() => setHasFocus(false)}
                   onFocus={() => setHasFocus(true)}
                   onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                     if (event.key === 'Escape') {
                       props.setFilter('');
                       setShowTags(false);
                     }
                   }}
                   onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                     props.setFilter(event.currentTarget.value)
                   }
                   ref={r => {
                     r && r.focus()
                   }}
            />
            <MdClose className="interactive" onMouseDown={() => {
              props.setFilter('');
              setShowTags(false)
            }}/>
            <MdSell className="interactive" onMouseDown={() => setShowTags(!showTags)}/>
          </>
          : <li className="search" onClick={() => setHasFocus(true)}><MdSearch/><span>Suche…</span></li>
        }
        <li><Link to="/" onClick={() => setShowMenu(false)} data-tooltip-content="Zur Startseite" data-tooltip-id="tt"><MdHome/></Link></li>
        <li><Link to="/user" onClick={() => setShowMenu(false)} data-tooltip-content="Einstellungen" data-tooltip-id="tt"><MdAccountCircle/></Link></li>
        <li onClick={_ => toggleTheme()} data-tooltip-content="Licht an/aus" data-tooltip-id="tt">
          {themeDark ? <MdLightMode/> : <MdDarkMode/>}
        </li>
      </menu>
      <MetaContent
        replace={attachClickHandlers()}
        className={classNames('filterMenu',
          {
            hideOnMobile: !showTags,
            hidden: !hasFocus && !showTags
          })}
        title="Schlagwortverzeichnis"
      />
      <Tooltip id="tt"/>
    </>
}

