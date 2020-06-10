import * as React from "react";
import {  NavLink, RouteComponentProps } from "react-router-dom";
import TranposeSetter from "./TransposeSetter.jsx";
import ChrodLib from "../api/libchrod";
import { Song } from '../api/collections';
import Drawer from './Drawer';
import { Abcjs } from './Abcjs'
import { MobileMenu } from "./MobileMenu";
import { ColumnExpander } from "./ColumnGrid.js";
import Kord from "./Kord.js";

import { LayoutH, LayoutV, Day, Night, Sharp, Flat } from './Icons.jsx';

var Parser = require("html-react-parser");

interface ViewerProps extends RouteComponentProps {
  song: Song,
  toggleTheme: Function,
  themeDark: boolean
}

interface ViewerStates {
  relTranspose: number,
  inlineReferences: boolean,
  showChords: boolean,
  columns: boolean
}

export default class Viewer extends React.Component<RouteComponentProps & ViewerProps, ViewerStates> {
  constructor(props) {
    super(props);

    this.state = {
      relTranspose: this.getInitialTranspose(),
      inlineReferences: false,
      showChords: true,
      columns: false

    };
  }

  refChordsheet = React.createRef<HTMLDivElement>()

  componentDidUpdate(prevProps) {
    if (this.props.song == prevProps.song) return;

    // Song has changed.
    this.refChordsheet.current?.scrollTo(0, 0)
    this.setState({
      relTranspose: this.getInitialTranspose(),
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

  handleContextMenu = event => {
    if (Meteor.user().profile.role == 'admin') {
      let m = this.props.match.params;
      this.props.history.push("/edit/" + m.author + "/" + m.title);
    }
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

  toggleChords = () => {
    this.setState( state => ({ showChords: !state.showChords }));
  };

  toggleColumns = () => {
    this.setState( state => ({ columns: !state.columns }));
  };

  toggleInlineReferences = () => {
    this.setState(state => ({ inlineReferences: !state.inlineReferences }))
  };

  render() {
    let chords = this.props.song.getChords();
    let chrodlib = new ChrodLib();
    let rmd_html = this.props.song.getHtml();

    let key_tag = this.props.song.checkTag("tonart");
    let key = key_tag && ChrodLib.parseTag(key_tag);
    if (key == null) {
      key = ChrodLib.guessKey(chords);
    }

    let dT = this.state.relTranspose;

    // Parse HTML to react-vdom and replace chord values.
    let vdom = Parser(rmd_html, {
      replace:  (node) => {

        if (node.name && node.name == 'i' && 'data-chord' in node.attribs) {
          if(!this.state.showChords)
            return;
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
          if (node.children.length != 1) 
            return node;
          let code = node.children[0];
          if (!('class' in code.attribs))
            return node;
          let classes = code.attribs['class'];
          if (!(classes.includes('language-abc')))
            return node;
          if (code.children.length != 1) 
            return node;

          if (this.state.showChords) {
            let abc = code.children[0].data;

            return <Abcjs
              abcNotation={abc}
              parserParams={{
                  visualTranspose: dT,
                }}
            />
          } else {
            return <></>
          }
        }
        // Insert fret diagrams
        else if (node.name == 'abbr') {
          const chord = node.children[0].data;
          const c = chrodlib.transpose(chord, key, 0);
          const style = dT != this.getInitialTranspose() ? {opacity: 0.5} : undefined;

          return <span className='chord-container' style={style}>
              <strong>{c.base}<sup>{c.suff}</sup></strong>
              <Kord frets={node.attribs.title} fingers={node.attribs['data-fingers']} />
            </span>
        }
        // Remove process tags for read-only-users
        else if (node.name == 'ul' && node.attribs?.['class'] == 'tags' 
                 && Meteor.user().profile.role != 'admin') {
          const hide: string[] = ['fini', '+', 'check', 'wip'];
          node.children = node.children.filter((child) => {
            if (child?.name == 'li' && hide.includes(child?.children[0].data)) return false;
            return true;
          });
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

    this.enrichReferences(vdom);

    const settings = <aside id="rightSettings">
          {this.state.showChords? <TranposeSetter
            onDoubleClick={this.toggleChords}
            transposeSetter={this.transposeSetter}
            transpose={this.state.relTranspose}
            keym={key} id="transposer"
          />
          :
          <div onClick={this.toggleChords} className="rightSettingsButton"><span>Chords</span></div> }
          <div onClick={this.props.toggleTheme} id={'theme-toggler'} >
            {this.props.themeDark ? <Day /> : <Night />}
          </div>
          <div onClick={this.toggleColumns} id={'layout-toggler'} >
            {this.state.columns ? <LayoutH /> : <LayoutV />}
          </div>
          </aside>
    

    const drawer = Meteor.user().profile.role == 'admin' ? (
        <Drawer className="source-colors" onClick={this.handleContextMenu}>
          <h1>bearbeiten</h1>
          <p>Schneller:&nbsp;Rechtsklick!</p>
        </Drawer>
    ) : undefined;

    const footer = Meteor.user().profile.role == 'admin' ? (
        <div className="mobile-footer"><NavLink to={`/edit/${s.author_}/${s.title_}`} id="edit">Bearbeiten…</NavLink></div>
    ) : undefined;

    return (

      <>
        <div className="extend mobilemenu" >
            <span onClick={ _ => this.increaseTranspose()} id="plus"><Sharp /></span>
            <span onClick={ _ => this.decreaseTranspose()} id="minus"><Flat /></span>
            <span onClick={ _ => this.props.toggleTheme()} id="theme-toggler">
              {this.props.themeDark ? <Day /> : <Night />}
            </span>
        </div>

        <div
          className={'content' + (this.showMultiColumns() ? ' multicolumns':'')}
          id="chordsheet" ref={this.refChordsheet}
          onContextMenu={this.handleContextMenu}
        >
          <section id="chordsheetContent">
            <ChordSheet showMultiColumns={this.showMultiColumns()} song={this.props.song} >
              {vdom}
            </ChordSheet>
          </section>
          {footer}
        </div>
        {settings}
        {drawer}
      </>
    );
  }

  private showMultiColumns() {
    return this.state.columns;
  }

  // TODO: Outsource to helper class/ function
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
          const key = 'ref_'+i;
          const visible = this.state.inlineReferences ? ' shown' : ' hidden'

          let refName = React.Children.toArray(elem.props.children)[0].props.children;
          if( typeof refName != 'string')
            continue

          // TODO: merge reference an content into one section so they don't break apart in column view
          let ref = 'sd-ref-' + refName.trim();
          let definition = sections_dict.get(ref)
          if( !definition ) {
            vdom[i] = React.cloneElement(elem,
              {
                'onClick': this.toggleInlineReferences,
                className: 'ref collapsed',
                key: key,
                id: key
              });
          } else {
            vdom[i] = React.cloneElement(elem,
              {
                'onClick': this.toggleInlineReferences,
                className: 'ref' + (this.state.inlineReferences ? ' open' : ' collapsed'),
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
  }


}
function splitSongVdom(vdom: React.ReactElement[]): React.ReactElement[] {
  const sheetHeader = vdom.filter(el => el.props?.className == 'sd-header')
    .map(el => React.cloneElement(el))

  const sheetContent = vdom.filter(el => el.props?.className != 'sd-header')
    .filter(el => typeof el == 'object')
    .map(el => React.cloneElement(el))

  // @ts-ignore
  return [sheetHeader, sheetContent];

}
const ChordSheet = (props: React.PropsWithChildren<{showMultiColumns: boolean, song: Song}> ) => {

  const vdom = props.children;
  if (props.showMultiColumns) {
    const [sheetHeader, sheetContent]: React.ReactNode[] = splitSongVdom(vdom);

    return <ColumnExpander song_id={props.song?._id} header={sheetHeader}>
      {sheetContent}
    </ColumnExpander>
  } else {
    return vdom;
  }

}

