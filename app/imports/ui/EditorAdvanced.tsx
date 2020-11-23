import blamejs from 'blame-js/build';
import * as React from 'react';
import { Component } from 'react';
import Songs, { Revision, Revisions, Song } from '../api/collections.js';
import { withRouter, Prompt, RouteComponentProps } from 'react-router-dom';
import Source from './Source.jsx';
import RevBrowserAdvanced from './RevBrowserAdvanced.js';
import Preview from './Preview';
import Drawer from './Drawer';
import { Ok, Cancel } from './Icons.jsx';
import { SourceAdvanced } from './SourceAdvanced';

type EditorAdvancedProps = {
  song: Song
}
 class EditorAdvancedState {
   md: string
   versionTab: boolean
   dirty: boolean
}

class EditorAdvanced extends Component<EditorAdvancedProps & RouteComponentProps, EditorAdvancedState> {
  mdServer: string;

    readonly state: EditorAdvancedState = {
      md: this.props.song.text,
      versionTab: false,
      dirty: false
    };
  constructor(props) {
    super(props);

    this.mdServer = props.song.text;
  }

  handleContextMenu = (event) => {
    if (this.state.versionTab) {
      this.toggleRevTab();
      event.preventDefault();
      return;
    }

    this.props.song.parse(this.state.md)

    Meteor.call('saveSong', this.props.song, (error, isValid) => {
      if (error !== undefined) {
        console.log(error);
      } else {
        this.setState({
          dirty: false,
        });
      }

      if (isValid) {
        this.props.history.push('/view/' + this.props.song.author_ + '/' + this.props.song.title_);
      } else {
        this.props.history.push('/');
      }
    });

    event.preventDefault();
  }

  update = (md_) => {
    this.setState({
      md: md_,
      dirty: md_ != this.mdServer
    });
  }

  toggleRevTab = () => {
    this.setState((prevState, props) => {
      return {
        versionTab: !prevState.versionTab
      }
    });
  }

  render() {

    let revs = this.props.song.getRevisions();
    const blame_versions = revs.map( v => ({commit: v, code: v.text}) )
     
    let prompt = <Prompt
            when={this.state.dirty && revs > 0}
            message={"Du hast noch ungespeicherte Änderungen. Verwerfen?"}
          />

    if (this.state.versionTab == false) {

      let versions = revs ? (
        <Drawer id="revs" className="revision-colors" onClick={this.toggleRevTab}>
          <h1>Verlauf</h1>
          <p>Es existieren {revs.length} Versionen. Klicke, um diese zu durchstöbern!</p>
        </Drawer>
      ) : undefined;

      let dirtyLabel = this.state.dirty ? <span id="dirty" title="Ungesicherte Änderungen"></span> : undefined;

      // Bearbeiten mit Echtzeit-Vorschau
      return (
        <div id="editor" onContextMenu={this.handleContextMenu}>
          <div className="extend mobilemenu" >
              <span onClick={this.handleContextMenu} id="plus"><Ok /></span>
              <span onClick={this.props.history.goBack} id="minus"><Cancel /></span>
          </div>

          <Drawer onClick={this.handleContextMenu} className="list-colors">
            <h1>sichern<br />&amp; zurück</h1>
            <p>Schneller: Rechtsklick!</p>
          </Drawer>

          {dirtyLabel}
          <Preview md={this.state.md} song={this.props.song} updateHandler={this.update}/>
          <SourceAdvanced md={this.state.md} blamelines={getBlameLines(blame_versions)} updateHandler={this.update} className="source-colors" />

          {versions}
          {prompt}
        </div>
      );

    } else {
      // Versionen vergleichen
      return (
        <div id="editor" onContextMenu={this.handleContextMenu}>

          <Drawer className="chordsheet-colors" onClick={this.toggleRevTab}>
            <h1>zurück</h1>
            <p>…und weiterbearbeiten!</p>
          </Drawer>


          {/* <Blame versions={blame_versions}  className="source-colors">
            <span className="label">Version in Bearbeitung</span>
          </Blame> */}
          <SourceAdvanced md={this.state.md} blamelines={getBlameLines(blame_versions)} updateHandler={this.update} className="source-colors" />
          {/* <Source md={this.state.md} updateHandler={this.update} className="source-colors">
            <span className="label">Version in Bearbeitung</span>
          </Source> */}
          <RevBrowserAdvanced song={this.props.song} />
          {prompt}
        </div>
      );

    }
  }
}

export default withRouter(EditorAdvanced);  // injects history, location, match

interface BlameProps {
  versions: {code: string, commit: string}[]
  className: string
}

class Blame extends Component<BlameProps> {

  render() {
    const versions = this.props.versions
    
    const line_list = getBlameLines(versions)

    const rows = line_list.map( r => <tr><td>{r.origin}</td><td>{r.value}</td></tr>) 

    return <div className={"content " + this.props.className}>
          {this.props.children}
    <table>{rows}</table>
    </div>
  }
}

function getBlameLines(versions) {
  return blamejs(versions,{getCode: a => a.code, getOrigin: b => b.commit })
}