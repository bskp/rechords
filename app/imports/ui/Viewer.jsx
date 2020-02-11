import React, { Component } from "react";
import PropTypes from "prop-types";
import { withRouter, NavLink } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod.js";
import { RmdHelpers } from "../api/collections.js";
import ReactDOM from 'react-dom';
import Drawer from '../ui/Drawer';
import {MobileMenu} from './MobileMenu.tsx'
import List from './List.tsx'


var Parser = require("html-react-parser");

class Viewer extends Component {
  constructor(props) {
    super(props);
    this.state = { relTranspose: 0, menuOpen: false, viewPortGtM: window.innerWidth > 900 };
  }

  componentDidUpdate(prevProps) {
    if (this.props.song == prevProps.song) return;
      
    // Song has changed.
    const node = ReactDOM.findDOMNode(this);
    node.children[0].scrollTop = 0;

    this.setState({ relTranspose: 0, menuOpen: false });
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
    this.setState( currentState => currentState.relTranspose++ );
  };

  decreaseTranspose = () => {
    this.setState( currentState => currentState.relTranspose-- );
  };

  toggleMenu = () => {
    this.setState( currentState => currentState.menuOpen = !currentState.menuOpen )
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
      replace: function(domNode) {
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
    if( this.state.viewPortGtM )
    {
      open = true;
    }
    else
    {
      open = this.state.menuOpen;
    }

    return (

      <>

        <div className="flex-vertical" id="viewer-maincontainer">
        <MobileMenu 
          increaseTranspose={this.increaseTranspose} 
          decreaseTranspose={this.decreaseTranspose}
          toggleMenu={this.toggleMenu}
        />
        <div id="body">
        <List songs={this.props.songs} open={open} />
      <div className="container">
        <div
          className="content"
          id="chordsheet"
          onContextMenu={this.handleContextMenu}
        >
          <section className="show-m">
            <TranposeSetter
              transposeSetter={this.transposeSetter}
              transpose={this.state.relTranspose}
              keym={key}
            />
          </section>
          <section ref="html">
            {vdom}
          </section>
        <div><NavLink to={`/edit/${s.author_}/${s.title_}`} >Edit</NavLink></div>
        </div>
      </div>
        <Drawer className="source-colors hide-m" onClick={this.handleContextMenu}>
          <h1>bearbeiten</h1>
          <p>Schneller:&nbsp;Rechtsklick!</p>
        </Drawer>
        </div>
        </div>
      </>
    );
  }
}

Viewer.propTypes = {
  song: PropTypes.object.isRequired
};

export default withRouter(Viewer); // injects history, location, match
