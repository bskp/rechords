import * as React from 'react';
import { Component } from 'react';
import { Revision } from '../api/collections';

import * as moment from 'moment';
import "moment/locale/de";

interface SourceAdvancedProps {
  md: string;
  updateHandler: Function;
  readOnly: boolean;
  className: string;
  // todo:origin is anobjectwith revision tag, user and caption
  blamelines?: {origin: string, value: string}[]
}

export class SourceAdvanced extends Component<SourceAdvancedProps> {
  textAreaRef: React.RefObject<HTMLTextAreaElement>;

  constructor(props) {
    super(props);
    this.textAreaRef = React.createRef()
  }

  callUpdateHandler = () => {
    if ('updateHandler' in this.props) {
      this.props.updateHandler(this.textAreaRef?.current.value);
    }
  }

  render() {
    // Height estimation
    let rowsMatch = this.props.md.match(/\n/g)

    let rows: number;
    if (rowsMatch != null) {
        rows = rowsMatch.length * 1.4 + 10;
    }

    rows = Math.max(50, rows);

    let style = {
        minHeight: rows + 'em',
    }



    const lt = new LineTracker()

    const content = this.textAreaRef.current?.value// || this.props.md

    const contentLines = content?.split('\n');
    let blamelines = [];
    const pb = this.props.blamelines;
    if (contentLines && pb) {
      blamelines = pb.map((l, idx) => {
        if (contentLines[idx] == l.value) {
          return <div>{lt.getLineDisplay(l.origin)}</div>
        } else {
          return <div>*</div>
        }
      });
    }
  
      

    return (
      <div className={"content source-adv " + this.props.className}>
          {this.props.children}
        <div style={style} className="blameColumn">{blamelines}</div>  
        <textarea 
          ref={this.textAreaRef}
          onChange={this.callUpdateHandler} 
          value={this.props.md} 
          style={style} 
          readOnly={this.props.readOnly}
        />
      </div>
    )
  }
}


class LineTracker {
  sameCount = 0
  lastId: string
  getLineDisplay(origin: Revision): string{
    if(!origin) {
      return ""
    }
    if( this.lastId != origin._id) {
      this.sameCount = 0;
    }

    let r;

    switch( this.sameCount ) {
      case 0: r = Meteor.users.findOne( origin.editor)?.profile.name || origin.editor; break;
      case 1: r = moment(origin.timestamp).format('lll'); break;
      case 2: r = origin.ip; break;
      default: r = "___"
    }

    this.lastId = origin._id
    this.sameCount += 1

    return r

  }
  
}