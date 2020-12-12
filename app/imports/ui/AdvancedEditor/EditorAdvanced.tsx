import * as React from 'react';
import { Component } from 'react';
import Songs, { Revision, Revisions, Song } from '../../api/collections.js';
import { withRouter, Prompt, RouteComponentProps } from 'react-router-dom';
import { RevBrowserAdvanced } from './RevBrowserAdvanced';
import Preview from '../Preview';
import Drawer from '../Drawer';
import { Ok, Cancel } from '../Icons.jsx';
import { SourceAdvanced } from './SourceAdvanced';
import { DynamicModuleLoader, IModule } from 'redux-dynamic-modules';
import { connect, ConnectedProps } from 'react-redux';

type EditorAdvancedProps = {
  song: Song
}
class EditorAdvancedState {
  md: string
}


const connector = connect(
  (state: IEditorStates) => ({ tab: state.tab, dirty: state.dirty }),
  {
    dispatchToggleTabRev: () => ({ type: 'tab/toggle' }),
    dispatchDirty: (s: boolean) => ({type: (s ? 'dirty/set' : 'dirty/reset')})
  }
)



class EditorAdvanced_ extends Component<EditorAdvancedProps & RouteComponentProps & ConnectedProps<typeof connector>, EditorAdvancedState> {
  mdServer: string;

  readonly state: EditorAdvancedState = {
    md: this.props.song.text,
  };
  constructor(props) {
    super(props);

    this.mdServer = props.song.text;
  }

  handleContextMenu = (event) => {
    if (this.props.tab) {
      this.props.dispatchToggleTabRev()
      event.preventDefault();
      return;
    }


    Meteor.call('saveSong', this.props.song, (error, isValid) => {
      if (error !== undefined) {
        console.log(error);
      } else {
        this.props.dispatchDirty(false)
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
    });
    this.props.dispatchDirty(md_ != this.mdServer)
  }


  render() {

    let revs = this.props.song.getRevisions();

    let prompt = <Prompt
      when={this.props.dirty && revs.length > 0}
      message={"Du hast noch ungespeicherte Änderungen. Verwerfen?"}
    />

    const source = <SourceAdvanced md={this.state.md} revs={revs} updateHandler={this.update} className="source-colors" />
    if (!this.props.tab) {

      let versions = revs && revs.length ? (
        <Drawer id="revs" className="revision-colors" onClick={this.props.dispatchToggleTabRev}>
          <h1>Verlauf</h1>
          <p>Es existieren {revs.length} Versionen. Klicke, um diese zu durchstöbern!</p>
        </Drawer>
      ) : undefined;

      const dirtyLabel = this.props.dirty ? <span id="dirty" title="Ungesicherte Änderungen"></span> : <></>;
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
          <Preview md={this.state.md} song={this.props.song} updateHandler={this.update} />
          {source}

          {versions}
          {prompt}
        </div>
      );

    } else {
      // Versionen vergleichen
      return (
        <div id="editor" onContextMenu={this.handleContextMenu}>

          <Drawer className="chordsheet-colors" onClick={this.props.dispatchToggleTabRev}>
            <h1>zurück</h1>
            <p>…und weiterbearbeiten!</p>
          </Drawer>


          {source}
          <RevBrowserAdvanced song={this.props.song} />
          {prompt}
        </div>
      );

    }
  }
}

export const EditorAdvanced = withRouter(connector(EditorAdvanced_));  // injects history, location, match

interface BlameProps {
  versions: { code: string, commit: string }[]
  className: string
}

class Blame extends Component<BlameProps> {

  render() {
    const versions = this.props.versions

    const line_list = getBlameLines(versions)

    const rows = line_list.map(r => <tr><td>{r.origin}</td><td>{r.value}</td></tr>)

    return <div className={"content " + this.props.className}>
      {this.props.children}
      <table>{rows}</table>
    </div>
  }
}

export interface IEditorStates {
  rev: Revision,
  dirty: boolean,
  tab: boolean
}

export function getEditorModule(): IModule<IEditorStates> {
  return {
    id: "adEditor",
    reducerMap: {
      rev: revisionReducer,
      dirty: dirtyReducer,
      tab: tabReducer
    },
    // Actions to fire when this module is added/removed
    // initialActions: [],
    // finalActions: []
  };
}

export const revisionReducer = (state: Revision, action: { type: 'revision/set'| 'revision/reset'; payload: any; }) => {
  switch (action.type) {
    case 'revision/set': {
      return action.payload;
    }
    case 'revision/reset': {
      return ''
    }

    default: {
      return state || null
    }
  }
}
export const dirtyReducer = (state: boolean, action: { type: 'dirty/set' | 'dirty/reset' }) => {
  switch (action.type) {
    case 'dirty/set': {
      return true
    }
    case 'dirty/reset': {
      return false
    }

    default: {
      return state === undefined ? false : state
    }
  }
}
export const tabReducer = (state: boolean, action: { type: 'tab/toggle'|'tab/rev' }) => {
  switch (action.type) {
    case 'tab/toggle': {
      return !state
    }
    case 'tab/rev': {
      return true;
    }

    default: {
      return state === undefined ? false : state
    }
  }
}