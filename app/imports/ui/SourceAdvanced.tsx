import * as React from 'react';
import { Component } from 'react';
import { Revision } from '../api/collections';

import * as moment from 'moment';
import "moment/locale/de";
import { Diff, diffChars } from 'diff';
import { convertDiff } from './RevBrowserAdvanced';
import { blame } from 'blame-ts/';
import { IBlameLine } from '../../../blame-ts/dist/blame';

interface SourceAdvancedProps {
  md: string;
  updateHandler: Function;
  readOnly: boolean;
  className: string;
  // todo:origin is anobjectwith revision tag, user and caption
  revs?: Revision[]
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

    const content = this.textAreaRef.current?.value || this.props.md

    const contentLines = content?.split('\n');
    let blamelines = [];
    const pb = getBlameLines(this.props.revs);
    if (contentLines && pb) {
      blamelines = pb.map((l, idx) => {
        if (contentLines[idx] == l.value) {
          return <div className="annoline" data-revid={l.origin._id}>{lt.getLineDisplay(l.origin)}</div>
        } else {
          return <div dava-revid="*">*</div>
        }
      });
    }

    


    const A: React.FunctionComponent<{ lid: string }> = p => {
      const [visible, setVisible] = React.useState<boolean>(false)
      return <div className='annotation' key={p.lid} onClick={e => setVisible(p => !p)}>
        <div style={{ position: "relative" }}>
          {console.log(visible)}
          <div className={'hover ' + (visible ? '' : 'hidden')}>
            {this.getDiff(p.lid)}
            </div>
        </div>
        {p.children}
      </div>
    }
    const blamelines_grouped = grouping(blamelines, 'data-revid', A)


  
      

    return (
      <div className={"content source-adv " + this.props.className}>
          {this.props.children}
        <div style={style} className="blameColumn">{blamelines_grouped}</div>  
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
  private getDiff(last_id: string) {
    const revs = this.props.revs;
    if( revs && revs.length ) {
      const idx = revs.findIndex( v => v._id === last_id )
        if( idx > 0 ) {
            const diff = diffChars( revs[idx-1].text, revs[idx].text )
            return diff.map(d => convertDiff(d) )
        }

    }
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
      case 0: r = Meteor.users.findOne( origin.editor)?.profile.name || origin.editor || '???'  ; break;
      case 1: r = moment(origin.timestamp).format('lll'); break;
      case 2: r = origin.ip; break;
      default: r = "___"
    }

    this.lastId = origin._id
    this.sameCount += 1

    return r

  }


  
}

function grouping(elements: React.ReactElement[], attribute: string, A: React.FunctionComponent<{lid: string}>  ): React.ReactElement[] {
  let returnvalue = []
  let last_id: string = null
  let currentParent: React.ReactElement = null
  // Maybe it was better to create a map first
  // not push directly into the children of the reactelements
  for( const el of elements ) {
    if(el.props[attribute] != last_id ) {
      last_id = el.props[attribute]
      returnvalue.push( currentParent )
      currentParent = <A lid={last_id}>{[]}</A>
    }
    currentParent.props.children.push( el )

  }
  return returnvalue;
}

function getBlameLines(versions: Revision[]): IBlameLine<Revision>[] {
  return blame(versions,{getCode: (a: Revision) => a.text, getOrigin: (b: Revision) => b })
}