import * as React from 'react';
import {NavLink, RouteComponentProps} from 'react-router-dom';
import TransposeSetter from './TransposeSetter';
import ChrodLib from '../api/libchrod';
import {Song} from '../api/collections';
import Drawer from './Drawer';
import {routePath, userMayWrite, View} from '../api/helpers';
import { MobileMenuShallow } from './MobileMenu';
import Sheet from './Sheet';

import {Button} from './Button';
import {ReactSVG} from "react-svg";
import { Meteor } from 'meteor/meteor';


export interface SongRouteParams {
  author: string
  title: string
}
interface ViewerProps extends RouteComponentProps<Partial<SongRouteParams>> {
  song: Song,
  toggleTheme: React.MouseEventHandler<HTMLDivElement>,
  themeDark: boolean
}

interface ViewerStates {
  relTranspose: number,
  inlineReferences: boolean,
  showChords: boolean,
  columns: boolean,
  autoscroll: any
}

export default class Viewer extends React.Component<ViewerProps, ViewerStates> {
  constructor(props: ViewerProps) {
    super(props);

    this.state = {
      relTranspose: this.getInitialTranspose(),
      inlineReferences: false,
      showChords: true,
      columns: false,
      autoscroll: undefined
    };

  }

  refChordsheet = React.createRef<HTMLDivElement>();
  duration_s = undefined;

  updateDuration() {
    const duration : string = this.props.song.getTag('dauer');
    if (duration) {
      const chunks = duration.split(':');
      this.duration_s = 60*Number(chunks[0]) + Number(chunks[1]);
    } else {
      this.duration_s = undefined;
    }
  }

  componentDidMount() {
    this.updateDuration();
  }

  componentDidUpdate(prevProps: ViewerProps) {
    if (this.props.song._id == prevProps.song._id) return;

    // Song has changed.
    this.refChordsheet.current?.scrollTo(0, 0);
    this.setState({
      relTranspose: this.getInitialTranspose(),
    });
    this.setAutoScroll(false);
    this.updateDuration();
  }

  componentWillUnmount() {
    this.setAutoScroll(false);
  }

  getInitialTranspose() {
    for (const tag of this.props.song.getTags()) {
      if (!tag.startsWith('transponierung:')) continue;
      const dT = parseInt(tag.split(':')[1], 10);
      return isNaN(dT) ? 0 : dT;
    }
    return 0;
  }

  handleContextMenu: React.MouseEventHandler<HTMLElement> = event => {
    if (userMayWrite()) {
      const m = this.props.match.params;
      this.props.history.push('/edit/' + m.author + '/' + m.title);
    }
    event.preventDefault();
  };

  transposeSetter = (pitch: number) => {
    this.setState({ relTranspose: pitch });
  };

  increaseTranspose = () => {
    this.setState(state => ({relTranspose: state.relTranspose + 1}));
  };

  decreaseTranspose = () => {
    this.setState(state => ({relTranspose: state.relTranspose - 1}));
  };

  toggleAutoScroll = () => {
    this.setAutoScroll( this.state.autoscroll == undefined );
  };

  setAutoScroll = (target_state: boolean) => {
    // Determine the correct content-scrolling container
    const chordsheet: HTMLDivElement = this.refChordsheet.current!;
    let scrollContainer: Element;
    if (chordsheet.scrollHeight > chordsheet.clientHeight) {
      // div#chordsheet is overflowing (on Desktop/Tablet)
      scrollContainer = chordsheet;
    } else {
      // body is overflowing (on Phone)
      scrollContainer = window.document.scrollingElement!;
    }

    this.setState( state => {
      // Start autoscroll
      if (state.autoscroll == undefined && target_state == true) {
        // default values
        let delay_ms = 133;
        let step_pixels = 1;

        // use custom values, if a "dauer"-tag is present for the song.
        // duration_s is set in #updateDuration
        if (this.duration_s) {
          const scroll_distance = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          delay_ms = this.duration_s*1000/scroll_distance;
        }

        if (delay_ms < 50) {
          // Most browser/devices cannot keep up with scroll events over 20fps.
          // For faster scrolling, we therefore take bigger steps.
          step_pixels = Math.ceil(50/delay_ms);
          delay_ms = delay_ms*step_pixels;
        }

        const callback = () => {
          scrollContainer?.scrollBy(0, step_pixels);
        };

        return { autoscroll: Meteor.setInterval(callback, delay_ms) };
      }

      // Stop autoscroll
      if (state.autoscroll != undefined && target_state == false) {
        Meteor.clearInterval(state.autoscroll);
        return { autoscroll: undefined };
      }
    });

  };

  toggleChords = () => {
    this.setState( state => ({ showChords: !state.showChords }));
  };

  toggleColumns = () => {
    this.setState( state => ({ columns: !state.columns }));
  };

  toggleInlineReferences = () => {
    this.setState(state => ({ inlineReferences: !state.inlineReferences }));
  };

  render() {

    // Establish this songs' key

    const key_tag = this.props.song.getTag('tonart');
    let key = key_tag && ChrodLib.parseTag(key_tag);

    if (!key) {
      key = ChrodLib.guessKey(this.props.song.getChords());
    }

    const settings = <aside id="rightSettings">
      <TransposeSetter
        onDoubleClick={this.toggleChords}
        transposeSetter={this.transposeSetter}
        transpose={this.state.relTranspose}
        keym={key}
      />
      <Button onClick={this.toggleAutoScroll}>
        {this.state.autoscroll ?
          <ReactSVG src='/svg/conveyor_active.svg'/>
          :
          <ReactSVG src='/svg/conveyor.svg'/>
        }
      </Button>
      <Button onClick={this.props.toggleTheme}>
        {this.props.themeDark ? <ReactSVG src='/svg/sun.svg'/> : <ReactSVG src='/svg/moon.svg' />}
      </Button>
      <Button onClick={this.toggleColumns}>
        {this.state.columns ? <ReactSVG src='/svg/layout_horizontal.svg' /> : <ReactSVG src='/svg/layout_vertical.svg'/>}
      </Button>
    </aside>;


    const drawer = userMayWrite() ? (
      <Drawer className="source-colors" onClick={this.handleContextMenu}>
        <h1>bearbeiten</h1>
        <p>Schneller:&nbsp;Rechtsklick!</p>
      </Drawer>
    ) : undefined;

    const footer = userMayWrite() ? (
      <div className="mobile-footer"><NavLink to={routePath(View.edit, this.props.song)} id="edit">Bearbeiten…</NavLink></div>
    ) : undefined;

    return (

      <>
        <MobileMenuShallow>
          <span onClick={ _ => this.increaseTranspose()} id="plus"><ReactSVG src={'/svg/sharp.svg'} /></span>
          <span onClick={ _ => this.decreaseTranspose()} id="minus"><ReactSVG src={'/svg/flat.svg'} /></span>
          <span onClick={this.toggleAutoScroll} id={'scroll-toggler'} className={this.state.autoscroll ? 'active' : ''}>
            <ReactSVG src='/svg/conveyor.svg' />
          </span>

          <span onClick={ _ => this.props.toggleTheme(undefined)} id="theme-toggler">
            {this.props.themeDark ? <ReactSVG src='/svg/sun.svg' /> : <ReactSVG src='/svg/moon.svg' />}
          </span>
        </MobileMenuShallow>

        <div
          className={'content' + (this.showMultiColumns() ? ' multicolumns':'')}
          id="chordsheet" ref={this.refChordsheet}
          onContextMenu={this.handleContextMenu}
        >
          <Sheet

            multicolumns={this.showMultiColumns()}
            song={this.props.song}
            transpose={this.state.relTranspose}
            hideChords={!this.state.showChords} />
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
}

