import * as React from "react";
import * as ReactDOM from 'react-dom';
import { withRouter, NavLink, RouteComponentProps } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod";
import { Song } from '../api/collections';
import Drawer from './Drawer';

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

class Viewer extends React.Component<RouteComponentProps & ViewerProps, ViewerStates> {
  constructor(props) {
    super(props);
    this.state = {
      relTranspose: this.getInitialTranspose(),
      menuOpen: false,
      viewPortGtM: window.innerWidth > 900,
      inlineReferences: true
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

    // Parse HTML to react-vdom and replace chord values.
    let vdom = Parser(rmd_html, {
      replace: function (domNode) {
        if (domNode.name && domNode.name == 'i' && 'data-chord' in domNode.attribs) {
          let chord = domNode.attribs['data-chord'];
          let t = chrodlib.transpose(chord, key, dT);
          let chord_;
          if (t == null) {
            chord_ = <span className="before">{chord}</span>;
          } else {
            chord_ = <span className={"before " + t.className}>{t.base}<sup>{t.suff}</sup></span>;
          }
          return <i>{chord_}{domNode.children[0].data}</i>;
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
        <div className="content-footer"><NavLink to={`/edit/${s.author_}/${s.title_}`} >Edit</NavLink></div>
        </div>
        <Drawer className="source-colors hide-m" onClick={this.handleContextMenu}>
          <h1>bearbeiten</h1>
          <p>Schneller:&nbsp;Rechtsklick!</p>
        </Drawer>
      </>
    );
  }

  private enrichReferences(vdom: any) {
    let referencee = new Map<String, any>();
    for (let elem of vdom) {
      if (elem.props) {
        let id = elem.props.id;
        if (id && id.startsWith('sd-ref')) {
          referencee.set(id, elem);
        }
      }
    }
    for (let i = 0; i < vdom.length; i++) {
      let elem = vdom[i];
      if (elem.props) {
        let className = elem.props.className;
        if (className == 'ref') {
          elem = vdom[i] = React.cloneElement(elem,
            {
              'onClick': this.toggleInlineReferences,
            });
          let visible = this.state.inlineReferences ? ' shown' : ' hidden'
          const refName = elem.props.children;
          if( typeof refName != 'string')
            continue

          let ref = 'sd-ref-' + refName.trim();
          let defintion = referencee.get(ref)
          if( !defintion ) {
              defintion = <p>Referenz <em>{refName}</em> existiert nicht</p>
          }
          vdom.splice(i + 1, 0,
            React.cloneElement(defintion,
              { id: null, className: 'inlineReference' + visible })
          );
        }
      }
    }
  }
}

export default withRouter(Viewer); // injects history, location, match
