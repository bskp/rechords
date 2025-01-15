import * as React from 'react';
import parse, {DOMNode, domToReact} from 'html-react-parser';
import {Song} from '../api/collections';
import {Abcjs} from './Abcjs';
import Kord from './Kord';
import {userMayWrite} from '../api/helpers';
import * as DH from 'domhandler';
import {CSSProperties, useState} from "react";
import {Tablature} from 'abcjs';
import Chord_ from "/imports/api/libchr0d/chord";

type DomOut = React.JSX.Element | object | void | undefined | null | false

type SheetProps = {
  song: Song,
  transpose?: number,
  hideChords?: boolean,
  processVdom?: (vdom: any) => any,
  style?: CSSProperties,
  multicolumns?: boolean
};
const Sheet = ({song, transpose, hideChords, processVdom, style}: SheetProps) => {

  const [inlineRefs, setInlineRefs] = useState(true);
  const toggleInlineRefs = () => setInlineRefs(!inlineRefs);

  const enrichReferences = (vdom: JSX.Element[]) => {
    const sections_dict = new Map<string, React.JSX.Element>();
    for (let i = 0; i < vdom.length; i++) {
      const elem = vdom[i];
      if (elem.props) {
        const id = elem.props.id;
        if (id && id.startsWith('sd-ref')) {
          sections_dict.set(id, elem);  // add section to dictionary
        }
      }
    }

    for (let i = 0; i < vdom.length; i++) {
      const elem = vdom[i];
      {
        if (elem?.props?.className == 'ref') {
          const key = 'ref_' + i;
          const visible = inlineRefs ? ' shown' : ' hidden';

          const firstChild = React.Children.toArray(elem.props.children)[0] as Partial<React.ReactElement>;
          const refName = firstChild?.props?.children;
          if (typeof refName != 'string')
            continue;

          // TODO: merge reference an content into one section so they don't break apart in column view
          const ref = 'sd-ref-' + refName.trim();
          const definition = sections_dict.get(ref);
          if (!definition) {
            vdom[i] = React.cloneElement(elem,
              {
                'onClick': () => {
                  console.log('sf');
                  toggleInlineRefs();
                },
                className: 'ref collapsed',
                key: key,
                id: key
              });
          } else {
            vdom[i] = React.cloneElement(elem,
              {
                'onClick': toggleInlineRefs,
                className: 'ref' + (inlineRefs ? ' open' : ' collapsed'),
                key: key,
                id: key
              });

            vdom.splice(i + 1, 0,
              React.cloneElement(definition, {
                id: null,
                key: definition.key + '-clone-' + i,
                className: 'inlineReference' + visible
              })
            );
          }
        }
      }
    }
    return vdom;
  };  // enrichReferences


  const rmd_html = song.getHtml();

  const key_tag = song.getTag('tonart');

  // Postprocessing on each node from the dom-to-react parser
  const populateReactNodes = (node: DOMNode): DomOut => {

    if (!(node instanceof DH.Element && node.attribs)) return node;

    // <i>
    if (node.name && node.name == 'i') {
      if (hideChords) return;  // swallow the chord

      let chord_ = null;
      if ('data-chord' in node.attribs) {
        const chord = node.attribs['data-chord'];
        const t = Chord_.from(chord)?.transposed(transpose ?? 0);
        if (t === undefined) {
          chord_ = <span className="before">{chord}</span>;
        } else {
          chord_ = <span className={'before ' + t.toStringClasses()}>{t.toStringKey()}<sup>{t.toStringTensionsAndSlash()}</sup></span>;
        }
      }
      return <i>{chord_}<span>{domToReact(node.children)}</span></i>;
    }

    // Abcjs
    else if (node.name == 'pre') {

      if (node.children.length != 1)
        return node;

      const code = node.firstChild as DH.Element;
      if (!('class' in code.attribs))
        return node;

      const classes = code.attribs['class'];
      if (!(classes.includes('language-abc')))
        return node;

      if (code.children.length != 1)
        return node;

      if (hideChords) {
        return <></>;


      } else {
        const tablature: Tablature[] = []
        if (classes.includes('tab')) {
          tablature.push({instrument: 'guitar'})
        }
        const abc = (code.firstChild as DH.DataNode)?.data;
        return <Abcjs abcNotation={abc} params={{visualTranspose: transpose, tablature}}/>;

      }
    }

    // Fret diagrams
    else if (node.name == 'abbr') {
      const chord = (node.firstChild as DH.DataNode).data;
      const c = Chord_.from(chord)

      return <span className='chord-container'>
        <strong>{c?.toStringKey()}<sup>{c?.toStringTensionsAndSlash()}</sup></strong>
        <Kord frets={node.attribs.title} fingers={node.attribs['data-fingers']}/>
      </span>;
    }

    // Remove process tags for read-only-users
    else if (node.name == 'ul' && node.attribs?.['class'] == 'tags' && !userMayWrite()) {
      const hide: string[] = ['fini', '+', 'check', 'wip'];
      node.children = node.children.filter((child) => {
        if ((child as DH.Element)?.name == 'li' && hide.includes(((child as DH.NodeWithChildren)?.firstChild as DH.DataNode)?.data)) return false;
        return true;
      });
    }
  };

  let postprocess = (vdom: DOMNode) => populateReactNodes(vdom);

  if (processVdom !== undefined) {
    postprocess = (vdom) => processVdom(populateReactNodes(vdom));
  }

  let vdom = parse(rmd_html, {replace: postprocess}) as JSX.Element[];

  vdom = enrichReferences(vdom);

  return (
    <section id="chordsheetContent" style={style}>{vdom}</section>
  );
};

export default Sheet;
