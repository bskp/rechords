import * as React from "react";
import {NavLink, RouteComponentProps} from "react-router-dom";
import TranposeSetter from "./TransposeSetter";
import ChrodLib from "../api/libchrod";
import {Song} from '../api/collections';
import Drawer from './Drawer';
import {navigateCallback, routePath, userMayWrite, View} from '../api/helpers';
import Sheet from './Sheet';

import {Conveyor, ConveyorActive, Day, Flat, LayoutH, LayoutV, Night, Printer, Sharp} from './Icons.jsx';
import {Button} from "./Button";


interface SongRouteParams {
  author: string
  title: string
}
interface ViewerProps extends RouteComponentProps<SongRouteParams> {
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
  constructor(props) {
    super(props);

    this.state = {
      relTranspose: this.getInitialTranspose(),
      inlineReferences: false,
      showChords: true,
      columns: false,
      autoscroll: undefined
    };

  }

  refChordsheet = React.createRef<HTMLDivElement>()
  duration_s = undefined;

  updateDuration() {
    let duration : string = this.props.song.getTag('dauer');
    if (duration) {
      let chunks = duration.split(':');
      this.duration_s = 60*Number(chunks[0]) + Number(chunks[1]);
    } else {
      this.duration_s = undefined;
    }
  }

  componentDidMount() {
    this.updateDuration();
  }

  componentDidUpdate(prevProps) {
    if (this.props.song._id == prevProps.song._id) return;

    // Song has changed.
    this.refChordsheet.current?.scrollTo(0, 0)
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
    for (let tag of this.props.song.getTags()) {
      if (!tag.startsWith('transponierung:')) continue;
      let dT = parseInt(tag.split(':')[1], 10);
      return isNaN(dT) ? 0 : dT;
    }
    return 0;
  }

  handleContextMenu: React.MouseEventHandler<HTMLElement> = event => {
    if (userMayWrite()) {
      let m = this.props.match.params;
      // @ts-ignore
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

  toggleAutoScroll = () => {
    this.setAutoScroll( this.state.autoscroll == undefined );
  }

  setAutoScroll = (target_state) => {
    let divElement = this.refChordsheet.current;

    this.setState( state => {
        // Start autoscroll
        if (state.autoscroll == undefined && target_state == true) {
          // default values
          let delay_ms = 133;
          let step_pixels = 1;

          // use custom values, if a "dauer"-tag is present for the song.
          // duration_s is set in #updateDuration
          if (this.duration_s) {
            let scroll_distance = divElement.scrollHeight - divElement.clientHeight;
            delay_ms = this.duration_s*1000/scroll_distance;
          }

          if (delay_ms < 50) {
            // Most browser/devices cannot keep up with scroll events over 20fps.
            // For faster scrolling, we therefore take bigger steps.
            step_pixels = Math.ceil(50/delay_ms);
            delay_ms = delay_ms*step_pixels;
          }

          const callback = () => {
            divElement?.scrollBy(0, step_pixels);
          }

          return { autoscroll: Meteor.setInterval(callback, delay_ms) };
        }

        // Stop autoscroll
        if (state.autoscroll != undefined && target_state == false) {
          Meteor.clearInterval(state.autoscroll);
          return { autoscroll: undefined };
        }
    });

  }

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

    // Establish this songs' key

    let key_tag = this.props.song.getTag("tonart");
    let key = key_tag && ChrodLib.parseTag(key_tag);

    if (!key) {
      key = ChrodLib.guessKey(this.props.song.getChords());
    }

    const settings = <aside id="rightSettings">
        <TranposeSetter
            onDoubleClick={this.toggleChords}
            transposeSetter={this.transposeSetter}
            transpose={this.state.relTranspose}
            keym={key}
          />
        <Button onClick={this.toggleAutoScroll}>
          {this.state.autoscroll ? <ConveyorActive /> : <Conveyor />}
        </Button>
        <Button onClick={this.props.toggleTheme}>
          {this.props.themeDark ? <Day /> : <Night />}
        </Button>
        <Button onClick={this.toggleColumns}>
          {this.state.columns ? <LayoutH /> : <LayoutV />}
        </Button>
      </aside>


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
        <div className="extend mobilemenu" >
            <span onClick={ _ => this.increaseTranspose()} id="plus"><Sharp /></span>
            <span onClick={ _ => this.decreaseTranspose()} id="minus"><Flat /></span>
            <span onClick={this.toggleAutoScroll} id={'scroll-toggler'} className={this.state.autoscroll ? 'active' : ''}>
              <Conveyor />
            </span>

            <span onClick={ _ => this.props.toggleTheme(undefined)} id="theme-toggler">
              {this.props.themeDark ? <Day /> : <Night />}
            </span>
        </div>

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

