import { Link } from "react-router-dom";
import {
  MdAccountCircle,
  MdClose,
  MdDarkMode,
  MdHome,
  MdLightMode,
  MdSearch,
  MdSell,
} from "react-icons/md";
import * as React from "react";
import { useContext, useState } from "react";
import { MenuContext, ThemeContext } from "../App";

import "./menuStyle.less";
import MetaContent from "/imports/ui/MetaContent";
import classNames from "classnames";
import classnames from "classnames";
import { Tooltip } from "react-tooltip";
import { navigateTo, View } from "/imports/api/helpers";

export function Menu(props: {
  filter: string;
  filterChanged: (filter: string) => void;
  onEnter: Function;
}) {
  const [showTags, setShowTags] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [skipBlurCheck, setSkipBlurCheck] = useState(false);

  const globalKeyHandler = (e: KeyboardEvent) => {
    const tagName = (e.target as Element)?.tagName;
    // Do not steal focus if already on <input>
    if (["INPUT", "TEXTAREA"].includes(tagName)) return;
    if(e.target.getAttribute('contenteditable')) return;


    // Ignore special keys
    if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return;

    if (e.key === "/") {
      e.preventDefault();
      setHasFocus(true);
    }
 };

  React.useEffect(() => {
    document.addEventListener("keydown", globalKeyHandler);
    return () => document.removeEventListener("keydown", globalKeyHandler);
  });

  const onTagClick = (event: React.MouseEvent<HTMLElement>) => {
    const tag =
      "#" + event.currentTarget?.childNodes?.[0]?.textContent?.toLowerCase();

    let newFilter;
    if (props.filter.includes(tag)) {
      newFilter = props.filter.replace(tag, "");
    } else {
      newFilter = props.filter + " " + tag;
    }
    props.filterChanged(newFilter.replace("  ", " ").trim());
    setShowTags(false);

    event.preventDefault();
  };

  const attachClickHandlers = () => {
    let bucket: string;

    return (node: any) => {
      if (node.name == "li") {
        const b = node.children.length > 1 ? <b>…</b> : null;
        return (
          <li onMouseDown={onTagClick}>
            {node.children[0].data}
            {b}
          </li>
        );
      }

      if (node.name == "h4") {
        bucket = node;
        return node;
      }

      if (node.name == "ul") {
        node.children.unshift(bucket);
        return node;
      }
    };
  };

  const showSearch = hasFocus || props.filter || showTags;
  const { themeDark, toggleTheme } = useContext(ThemeContext);
  const { setShowMenu } = useContext(MenuContext);

  const removeFocusAction = () => {
    props.filterChanged("");
    setShowTags(false);
    // escape fires no blur event (that's why it worked with 'X' icon)
    setHasFocus(false);
  };

  return (
    <>
      <menu
        className={classnames("iconmenu", { searching: showSearch })}
        onKeyDown={props.onKeyDown}
      >
        {showSearch ? (
          <>
            <input
              type="text"
              placeholder="Lieder suchen…"
              value={props.filter}
              onBlur={() => !skipBlurCheck && setHasFocus(false)}
              onFocus={() => setHasFocus(true)}
              onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Escape") {
                  removeFocusAction();
                } else if (event.key === "Enter") {
                  removeFocusAction();
                  props.onEnter();
                }
              }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                props.filterChanged(event.currentTarget.value);
              }}
              ref={(r) => {
                r && r.focus();
              }}
            />
            <MdClose
              className="interactive"
              onMouseDown={() => {
                props.filterChanged("");
                setShowTags(false);
              }}
            />
            <MdSell
              className="interactive hideUnlessMobile"
              onMouseDown={() => setSkipBlurCheck(true)}
              onClick={() => {
                setShowTags(!showTags);
                setSkipBlurCheck(false);
              }}
            />
          </>
        ) : (
          <li
            className="search"
            onClick={() => setHasFocus(true)}
            data-tooltip-content="Shortcut: /"
            data-tooltip-id="tt"
          >
            <MdSearch />
            <span>Suche…</span>
          </li>
        )}
        <li>
          <Link
            to="/"
            onClick={() => setShowMenu(false)}
            data-tooltip-content="Zur Startseite"
            data-tooltip-id="tt"
          >
            <MdHome />
          </Link>
        </li>
        <li>
          <Link
            to="/user"
            onClick={() => setShowMenu(false)}
            data-tooltip-content="Einstellungen"
            data-tooltip-id="tt"
          >
            <MdAccountCircle />
          </Link>
        </li>
        <li
          onClick={(_) => toggleTheme()}
          data-tooltip-content="Licht an/aus"
          data-tooltip-id="tt"
        >
          {themeDark ? <MdLightMode /> : <MdDarkMode />}
        </li>
      </menu>
      <MetaContent
        replace={attachClickHandlers()}
        className={classNames("filterMenu", {
          hideOnMobile: !showTags,
          hidden: !hasFocus && !showTags,
        })}
        title="Schlagwortverzeichnis"
      />
      <Tooltip
        globalCloseEvents={{ scroll: true, clickOutsideAnchor: true }}
        id="tt"
      />
    </>
  );
}
