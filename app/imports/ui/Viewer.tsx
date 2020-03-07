import * as React from "react";
import * as ReactDOM from 'react-dom';
import { useParams, useLocation, useHistory, useRouteMatch } from 'react-router-dom';
import {  NavLink, RouteComponentProps } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod";
import { Song } from '../api/collections';
import Drawer from './Drawer';
import * as Abcjs from 'react-abcjs';

var Parser = require("html-react-parser");

interface ViewerProps extends RouteComponentProps {
  song: Song,
  songs: Array<Song>
}

interface ViewerStates {
  relTranspose: number,
  menuOpen: boolean,
  viewPortGtM: boolean,
  inlineReferences: boolean
}

// Only expose necessary handler for transpose setting, not complete component
export interface ITransposeHandler {
  increaseTranspose: Function
  decreaseTranspose: Function 
}

export default class Viewer extends React.Component<RouteComponentProps & ViewerProps, ViewerStates> implements
ITransposeHandler {
  constructor(props) {
    super(props);
    this.state = {
      relTranspose: this.getInitialTranspose(),
      menuOpen: false,
      viewPortGtM: window.innerWidth > 900,
      inlineReferences: false
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.song == prevProps.song) return;

    // Song has changed.
    window.scrollTo(0, 0)
    this.setState({
      relTranspose: this.getInitialTranspose(),
      menuOpen: false
    });
  }

  getInitialTranspose() {
    for (let tag of this.props.song.getTags()) {
      if (!tag.startsWith('transponierung:')) continue;
      let dT = parseInt(tag.split(':')[1], 10);
      return isNaN(dT) ? 0 : dT;
    }
    return 0;
  }

  updateDimensions = () => {
    this.setState({ viewPortGtM: window.innerWidth > 900 });
  };

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  handleContextMenu = event => {
    let m = this.props.match.params;
    this.props.history.push("/edit/" + m.author + "/" + m.title);
    event.preventDefault();
  };

  transposeSetter = pitch => {
    this.setState({ relTranspose: pitch });
  };

  increaseTranspose = () => {
    this.setState(function (state, props) {
      return { relTranspose: state.relTranspose + 1 }
    })
  };

  decreaseTranspose = () => {
    this.setState(function (state, props) {
      return { relTranspose: state.relTranspose - 1 }
    })
  };

  toggleMenu = () => {
    this.setState(function (state, props) {
      return { menuOpen: !state.menuOpen }
    })
  };

  toggleInlineReferences = () => {
    this.setState(state => ({ inlineReferences: !state.inlineReferences }))
  };

  render() {
    let chords = this.props.song.getChords();
    let chrodlib = new ChrodLib();
    let rmd_html = this.props.song.getHtml();

    let key = ChrodLib.guessKey(chords);

    // TODO: if key undef, write something there

    let dT = this.state.relTranspose;
    let responsive = this.state.viewPortGtM ? undefined : 'resize';

    // Parse HTML to react-vdom and replace chord values.
    let vdom = Parser(rmd_html, {
      replace: function (node) {
        if (node.name && node.name == 'i' && 'data-chord' in node.attribs) {
          let chord = node.attribs['data-chord'];
          let t = chrodlib.transpose(chord, key, dT);
          let chord_;
          if (t == null) {
            chord_ = <span className="before">{chord}</span>;
          } else {
            chord_ = <span className={"before " + t.className}>{t.base}<sup>{t.suff}</sup></span>;
          }
          return <i>{chord_}{node.children[0].data}</i>;
        }
        else if (node.name == 'pre') {
          if (node.children.length != 1) return node;
          let code = node.children[0];
          if (!('class' in code.attribs)) return node;
          let classes = code.attribs['class'];
          if (!(classes.includes('language-abc'))) return node;
          if (code.children.length != 1) return node;

          let abc = code.children[0].data;

          let regular = "Roboto 12";
          let bold = regular + " bold";

          return <div className="abc-notation">
            <Abcjs
              abcNotation={abc}
              parserParams={{
                  paddingtop: 0,
                  paddingbottom: 0,
                  paddingright: 0,
                  paddingleft: 0,
                  scale: 1,
                  add_classes: true,
                  visualTranspose: dT,
                  format: {
                    gchordfont: bold,
                    annotationfont: bold,
                    vocalfont: regular,
                    composerfont: regular,
                    footerfont: regular,
                    headerfont: regular,
                    historyfont: regular,
                    infofont: regular,
                    measurefont: regular,
                    partsfont: regular,
                    repeatfont: regular,
                    subtitlefont: regular,
                    tempofont: regular,
                    textfont: regular,
                    titlefont: regular,
                    voicefont: regular,
                    wordsfont: regular,
                  }
                }}
              engraverParams={{'responsive': responsive}}
              renderParams={{
                  viewportHorizontal: true,
                }}
              style={{width: '80%'}}
            />
          </div>
        }

        // if(domNode.attribs && 'class' in domNode.attribs) {
        //    let clazz = domNode.attribs['class']
        //    if(clazz == 'ref')
        //    {

        //    }
        // }
      }
    });

    // Idee: obige replace-funktion könnte vom TransposeSetter geholt werden. Dadurch könnte der relTranspose-Zustand völlig in 
    // den TransposeSetter wandern. 

    /*
    if (this.state.relTranspose != 0) {
      chordtable = (
        <table className="chordtable">
          <tbody>
            <tr>
              <td>Orig:</td>
              {chords.map((c, i) => <td key={i}>{c}</td>)}
            </tr>
            <tr>
              <td>Tran:</td>
              {chrodlib
                .transpose(chords, this.state.relTranspose)
                .map((c, i) => <td key={i}>{c}</td>)}
            </tr>
          </tbody>
        </table>
      );
    } else {
      chordtable = "";
    }
    */
    const s = this.props.song;

    let open;
    if (this.state.viewPortGtM) {
      open = true;
    }
    else {
      open = this.state.menuOpen;
    }

    this.enrichReferences(vdom);

    return (

      <>
        <div
          className="content"
          id="chordsheet"
          onContextMenu={this.handleContextMenu}
        >
          <TranposeSetter
            transposeSetter={this.transposeSetter}
            transpose={this.state.relTranspose}
            keym={key}
          />
          <section ref="html">
            {vdom}
          </section>
        <div className="mobile-footer"><NavLink to={`/edit/${s.author_}/${s.title_}`} id="edit">Bearbeiten…</NavLink></div>
        </div>
        <Drawer className="source-colors" onClick={this.handleContextMenu}>
          <h1>bearbeiten</h1>
          <p>Schneller:&nbsp;Rechtsklick!</p>
        </Drawer>
      </>
    );
  }

  private enrichReferences(vdom: any) {
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
          let visible = this.state.inlineReferences ? ' shown' : ' hidden'

          vdom[i] = React.cloneElement(elem,
            {
              'onClick': this.toggleInlineReferences,
              className: 'ref' + (this.state.inlineReferences ? ' open' : ' collapsed')
            });
          const refName = elem.props.children;
          if( typeof refName != 'string')
            continue

          let ref = 'sd-ref-' + refName.trim();
          let definition = sections_dict.get(ref)
          if( !definition ) {
              definition = <p>Referenz <em>{refName}</em> existiert nicht</p>
          }

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
}

