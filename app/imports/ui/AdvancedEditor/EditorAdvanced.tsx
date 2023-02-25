import * as React from 'react';
import {Component} from 'react';
import {Revision, Song} from '../../api/collections';
import {Prompt, RouteComponentProps, withRouter} from 'react-router-dom';
import {RevBrowserAdvanced} from './RevBrowserAdvanced';
import Preview from '../Preview';
import Drawer from '../Drawer';
import {Cancel, Ok} from '../Icons.jsx';
import {ISourceOptions, SourceAdvanced} from './SourceAdvanced';
import {IModule} from 'redux-dynamic-modules';
import {connect, ConnectedProps} from 'react-redux';
import {navigateTo, View} from '../../api/helpers';
import { MobileMenuShallow } from '../MobileMenu';

type EditorAdvancedProps = {
  song: Song
}
class EditorAdvancedState {
  md: string
  sourceOptions: ISourceOptions
}




const connector = connect(
  (state: IEditorStates) => ({ tab: state.tab, dirty: state.dirty }),
  {
    dispatchToggleTabRev: () => ({ type: 'tab/toggle' }),
    dispatchDirty: (s: boolean) => ({ type: (s ? 'dirty/set' : 'dirty/reset') })
  }
);




class EditorAdvanced_ extends Component<EditorAdvancedProps & RouteComponentProps & ConnectedProps<typeof connector>, EditorAdvancedState> {
  mdServer: string;

  readonly state: EditorAdvancedState = {
    md: this.props.song.text,
    sourceOptions: {blame: false, fullRev: false, name: false, date: false, showWhitespace: false, }
  };
  constructor(props) {
    super(props);

    this.mdServer = props.song.text;
  }

  handleContextMenu = (event) => {
    if (this.props.tab) {
      this.props.dispatchToggleTabRev();
      event.preventDefault();
      return;
    }


    Meteor.call('saveSong', this.props.song, (error, isValid) => {
      if (error !== undefined) {
        console.log(error);
      } else {
        this.props.dispatchDirty(false);
      }

      if (isValid) {
        navigateTo(this.props.history, View.view, this.props.song);
      } else {
        navigateTo(this.props.history, View.home);
      }
    });

    event.preventDefault();
  }

  update = (md_) => {
    this.setState({
      md: md_,
    });
    this.props.dispatchDirty(md_ != this.mdServer);
  }

  render() {

    const revs = this.props.song.getRevisions();

    const prompt = <Prompt
      when={this.props.dirty && revs.length > 0}
      message={'Du hast noch ungespeicherte Änderungen. Verwerfen?'}
    />;

    const source = <SourceAdvanced md={this.state.md}
      revs={revs}
      updateHandler={this.update}
      sourceOptions={this.state.sourceOptions}
      setSourceOptions={l => this.setState( prev => ({...prev, sourceOptions: l(prev.sourceOptions) }))}
      className="source-colors"
    />;

    if (!this.props.tab) {

      const versions = revs && revs.length ? (
        <Drawer id="revs" className="revision-colors" onClick={this.props.dispatchToggleTabRev}>
          <h1>Verlauf</h1>
          <p>Es existieren {revs.length} Versionen. Klicke, um diese zu durchstöbern!</p>
        </Drawer>
      ) : undefined;

      const dirtyLabel = this.props.dirty ? <span id="dirty" title="Ungesicherte Änderungen"></span> : <></>;
      // Bearbeiten mit Echtzeit-Vorschau
      return (
        <div id="editor" onContextMenu={this.handleContextMenu}>
          <MobileMenuShallow>
            <span onClick={this.handleContextMenu} id="plus"><Ok /></span>
            <span onClick={this.props.history.goBack} id="minus"><Cancel /></span>
          </MobileMenuShallow>

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


export interface IEditorStates {
  rev: Revision,
  revHover: Revision,
  dirty: boolean,
  tab: boolean
}

// Replace Redux with RxJs?
// Redux has way too much boilerplate und no typesafety
// since enveryting is just text

export function getEditorModule(): IModule<IEditorStates> {
  return {
    id: 'adEditor',
    reducerMap: {
      rev: revisionReducer,
      revHover: revisionHover,
      dirty: dirtyReducer,
      tab: tabReducer
    },
    // Actions to fire when this module is added/removed
    // initialActions: [],
    // finalActions: []
  };
}

export const revisionReducer = (state: Revision, action: { type: 'revision/set' | 'revision/reset'; payload: Revision; }) => {
  switch (action.type) {
  case 'revision/set': {
    return action.payload;
  }
  case 'revision/reset': {
    return null;
  }

  default: {
    return state || null;
  }
  }
};
export const revisionHover = (state: Revision, action: { type: 'revisionHover/set' | 'revisionHover/reset'; payload: Revision; }) => {
  switch (action.type) {
  case 'revisionHover/set': {
    return action.payload;
  }
  case 'revisionHover/reset': {
    return null;
  }

  default: {
    return state || null;
  }
  }
};
export const dirtyReducer = (state: boolean, action: { type: 'dirty/set' | 'dirty/reset' }) => {
  switch (action.type) {
  case 'dirty/set': {
    return true;
  }
  case 'dirty/reset': {
    return false;
  }

  default: {
    return state === undefined ? false : state;
  }
  }
};
export const tabReducer = (state: boolean, action: { type: 'tab/toggle' | 'tab/rev' }) => {
  switch (action.type) {
  case 'tab/toggle': {
    return !state;
  }
  case 'tab/rev': {
    return true;
  }

  default: {
    return state === undefined ? false : state;
  }
  }
};
