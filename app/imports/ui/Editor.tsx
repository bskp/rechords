import * as React from 'react';
import {Component, MouseEventHandler} from 'react';
import {withRouter, Prompt, RouteComponentProps} from 'react-router-dom';

import Source from './Source';
import RevBrowser from './RevBrowser';
import Preview from './Preview';
import Drawer from './Drawer';
import {Song} from '../api/collections';
import {Meteor} from 'meteor/meteor';
import {navigateTo, View} from '../api/helpers';
import {MobileMenuShallow} from './MobileMenu';
import {convertToHoelibuSyntax} from '../api/ascii-importer';
import {ReactSVG} from "react-svg";

type EditorProps = { song: Song } & RouteComponentProps
type EditorState = {
  md: string,
  revisionsTab: boolean,
  dirty: boolean
}

class Editor extends Component<EditorProps, EditorState> {
  mdServer: string;

  constructor(props: EditorProps) {
    super(props);
    this.state = {
      md: props.song.text,
      revisionsTab: false,
      dirty: false
    };

    this.mdServer = props.song.text;
  }

  handleContextMenu: MouseEventHandler = (event) => {
    if (this.state.revisionsTab) {
      this.toggleRevTab();
      event.preventDefault();
      return;
    }

    this.props.song.parse(this.state.md);

    Meteor.call('saveSong', this.props.song, (error: any, isValid: boolean) => {
      if (error !== undefined) {
        console.error(error);
      } else {
        this.setState({
          dirty: false,
        });
      }

      if (isValid) {
        navigateTo(this.props.history, View.view, this.props.song);
      } else {
        navigateTo(this.props.history, View.home);
      }
    });

    event.preventDefault();
  };

  handlePaste = (text: string) => {
    return convertToHoelibuSyntax(text);
  };

  update = (md_) => {
    this.setState({
      md: md_,
      dirty: md_ != this.mdServer
    });
  };

  toggleRevTab = () => {
    this.setState((prevState) => {
      return {
        revisionsTab: !prevState.revisionsTab
      };
    });
  };

  render() {

    const revs = this.props.song.getRevisions();

    const prompt = <Prompt
      when={this.state.dirty && revs.length > 0}
      message={'Du hast noch ungespeicherte Änderungen. Verwerfen?'}
    />;

    if (!this.state.revisionsTab) {

      const versions = revs ? (
        <Drawer id="revs" className="revision-colors" onClick={this.toggleRevTab}>
          <h1>Verlauf</h1>
          <p>Es existieren {revs.length} Versionen. Klicke, um diese zu durchstöbern!</p>
        </Drawer>
      ) : undefined;

      const dirtyLabel = this.state.dirty ? <span id="dirty" title="Ungesicherte Änderungen"></span> : undefined;

      // Bearbeiten mit Echtzeit-Vorschau
      return (
        <div id="editor" onContextMenu={this.handleContextMenu}>
          <MobileMenuShallow>
            <span onClick={this.handleContextMenu} id="plus"><ReactSVG src='/svg/ok.svg'/></span>
            <span onClick={this.props.history.goBack} id="minus"><ReactSVG src={'/svg/cancel.svg'}/></span>
          </MobileMenuShallow>

          <Drawer onClick={this.handleContextMenu} className="list-colors">
            <h1>sichern<br/>&amp; zurück</h1>
            <p>Schneller: Rechtsklick!</p>
          </Drawer>

          {dirtyLabel}
          <Preview md={this.state.md} song={this.props.song} updateHandler={this.update}/>
          <Source
            md={this.state.md}
            updateHandler={this.update}
            className="source-colors"

            onPasteInterceptor={this.handlePaste}
          />

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

          <Source
            md={this.state.md}
            updateHandler={this.update}
            className="source-colors"
          >
            <span className="label">Version in Bearbeitung</span>
          </Source>
          <RevBrowser song={this.props.song}/>
          {prompt}
        </div>
      );

    }
  }
}


export default withRouter(Editor);  // injects history, location, match
