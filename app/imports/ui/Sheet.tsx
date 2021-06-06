import * as React from 'react';
import parse, { domToReact } from 'html-react-parser';
import ChrodLib from "../api/libchrod";
import { Song } from '../api/collections';
import { Abcjs } from './Abcjs'
import Kord from "./Kord.js";
import { userMayWrite } from '../api/helpers';
import { Element } from 'domhandler/lib/node';

type SheetProps = {
    song: Song,
    transpose?: number,
    hideChords?: boolean,
    processVdom?: (vdom: any) => any,
    style?: Object
}

const Sheet = ({ song, transpose, hideChords, processVdom, style }: SheetProps) => {

    const [inlineRefs, setInlineRefs] = React.useState(true);

    const toggleInlineRefs = () => setInlineRefs(!inlineRefs);

    const enrichReferences = (vdom: any) => {
        let sections_dict = new Map<String, any>();
        for (let i = 0; i < vdom.length; i++) {
            let elem = vdom[i];
            if (elem.props) {
                let id = elem.props.id;
                if (id && id.startsWith('sd-ref')) {
                    sections_dict.set(id, elem);  // add section to dictionary
                }
            }
        }

        for (let i = 0; i < vdom.length; i++) {
            let elem = vdom[i];
            if (elem.props) {
                if (elem.props.className == 'ref') {
                    const key = 'ref_' + i;
                    const visible = inlineRefs ? ' shown' : ' hidden'

                    let refName = React.Children.toArray(elem.props.children)[0].props.children;
                    if (typeof refName != 'string')
                        continue

                    // TODO: merge reference an content into one section so they don't break apart in column view
                    let ref = 'sd-ref-' + refName.trim();
                    let definition = sections_dict.get(ref)
                    if (!definition) {
                        vdom[i] = React.cloneElement(elem,
                            {
                                'onClick': toggleInlineRefs,
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
    }  // enrichReferences


    const chords = song.getChords();
    const chrodlib = new ChrodLib();
    const rmd_html = song.getHtml();

    const key_tag = song.getTag("tonart");
    let key = key_tag && ChrodLib.parseTag(key_tag);
    if (key == null) {
      key = ChrodLib.guessKey(chords);
    }


    // Postprocessing on each node from the dom-to-react parser
    const populate_react_nodes = (node: any) => {  
      
      if (!(node instanceof Element && node.attribs)) return node;

        // <i>
        if (node.name && node.name == 'i') {
          if (hideChords) return;  // swallow the chord

          let chord_ = null;
          if ('data-chord' in node.attribs){
            let chord = node.attribs['data-chord'];
            let t = chrodlib.transpose(chord, key, transpose);
            if (t == null) {
              chord_ = <span className="before">{chord}</span>;
            } else {
              chord_ = <span className={"before " + t.className}>{t.base}<sup>{t.suff}</sup></span>;
            }
          }
          return <i>{chord_}<span>{domToReact(node.children)}</span></i>;
        }

        // Abcjs
        else if (node.name == 'pre') {

          if (node.children.length != 1) 
            return node;

          let code = node.children[0] as Element;
          if (!('class' in code.attribs))
            return node;

          let classes = code.attribs['class'];
          if (!(classes.includes('language-abc')))
            return node;

          if (code.children.length != 1) 
            return node;

          if (hideChords) {
              return <></>

          } else {
            const abc = code.children[0].data;
            return <Abcjs abcNotation={abc} parserParams={{ visualTranspose: transpose, }} /> 

          }
        }

        // Fret diagrams
        else if (node.name == 'abbr') {
          const chord = node.children[0].data;
          const c = chrodlib.transpose(chord, key, 0);

          return <span className='chord-container'>
              <strong>{c.base}<sup>{c.suff}</sup></strong>
              <Kord frets={node.attribs.title} fingers={node.attribs['data-fingers']} />
            </span>
        }

        // Remove process tags for read-only-users
        else if (node.name == 'ul' && node.attribs?.['class'] == 'tags' && !userMayWrite()) {
          const hide: string[] = ['fini', '+', 'check', 'wip'];
          node.children = node.children.filter((child) => {
            if (child?.name == 'li' && hide.includes(child?.children[0].data)) return false;
            return true;
          });
        }
    };

    let postprocess = (vdom) => populate_react_nodes( vdom );

    if (processVdom !== undefined) {
      postprocess = (vdom) => processVdom( populate_react_nodes(vdom) );
    }

    let vdom = parse(rmd_html, {replace: postprocess})

    if (inlineRefs) vdom = enrichReferences(vdom);

    return (
      <section id="chordsheetContent" style={style}>
        {vdom}
      </section>
    )

}

export default Sheet;