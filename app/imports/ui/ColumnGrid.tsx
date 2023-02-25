import * as React from 'react';
import { increaseHeaderSpan, expandColumns } from '../api/expandColumns';

import './ColumnGridStyle.less';
import { DefaultSettingsStorage } from '../api/localStorageDefs';

import AwesomeDebouncePromise from 'awesome-debounce-promise';


const defaultColumnWidth = 480; // px


const debugColumns = false;
type ColumnExpanderProps = React.PropsWithChildren<{ header: React.ReactNode, scope?: string, song_id: string }>
type ColumnExpanderState = { columnWidth: number, height: number }

export class ColumnExpander extends React.Component<ColumnExpanderProps, ColumnExpanderState>
{
    settingsStorage = new DefaultSettingsStorage('columnExpanderV2')
    public static defaultProps = {
      scope: 'Expander'
    }

    dragStartPositionAndColumnWidth: number = null;
    hoveringColumn = false;
    childupdate: number;

    handleColumnDrag: React.MouseEventHandler<HTMLDivElement> = (event) => {
      const target = event.currentTarget;

      if(event.type == 'mousedown')
      {
        if( this.hoveringColumn )
          this.dragStartPositionAndColumnWidth = event.pageX - this.state.columnWidth;
      }
      if(event.type == 'mouseup')
      {
        this.dragStartPositionAndColumnWidth = null;
        this.settingsStorage.setValue( 'columnWidth', this.props.song_id, this.state.columnWidth );
        this.setState({});
      }
      if (event.type == 'mousemove') {
        if (this.dragStartPositionAndColumnWidth) {
          const newWidth = event.pageX-this.dragStartPositionAndColumnWidth;
          // console.log( newWidth)
          if (newWidth > 300 ) {
            this.setState(s => ({ columnWidth: newWidth }));
          }
        } else {
          const isColumn = target.classList.contains('ce-column') && target.id != 'ce-firstcolumn';
          const leftRel = event.clientX - target.offsetLeft;
          // console.log(target, leftRel)
          const prevHovering = this.hoveringColumn;
          if (isColumn) {
            this.hoveringColumn = leftRel < 20 || leftRel > this.state.columnWidth - 20;
          } else {
            this.hoveringColumn = false;
          }
          if (this.hoveringColumn != prevHovering)
            this.setState({});
        }
      }
    };

    constructor(props: Readonly<ColumnExpanderProps>) {
      super(props);
      this.childupdate = 0;
      this.state = {
        columnWidth: this.settingsStorage.getValue('columnWidth', this.props.song_id, defaultColumnWidth),
        height: window.innerHeight
      };
    }
    colRef: React.RefObject<HTMLDivElement> = React.createRef()
    headerRef: React.RefObject<HTMLDivElement> = React.createRef()

    

    private effect(prevProps: ColumnExpanderProps, prevState: ColumnExpanderState) {

      if ( this.colRef.current ) {
        // TODO: do this properly in react (now it's native js and react loses track of its elements )
        const spanCount = increaseHeaderSpan(this.headerRef.current);
            
        expandColumns(this.colRef.current, 10, idx => idx >= spanCount ? 'ce-fullColumn' : 'ce-halfColumn');
      }
      const songId = this.props.song_id;
      if (songId == prevProps.song_id) return;

      // TODO: shift click stores the value of the checkbox
      this.setStateFromStorage(songId);
    }

   debouncedHandleWindowResize = AwesomeDebouncePromise( (ev) => {
     console.log('called?');
     this.childupdate++;
     this.setState({height: window.innerHeight});   }, 100) 

   componentDidMount() { 
     this.effect(this.props, this.state);
     window.addEventListener('resize', this.debouncedHandleWindowResize );
   }

   componentWillUnmount() {
     window.removeEventListener('resize', this.debouncedHandleWindowResize);
   }
        

     

   shouldComponentUpdate(nextProps: ColumnExpanderProps) {
     // React.Children.forEach( nextProps.children, (child, idx);
     if (this.props.children != nextProps.children && this.colRef.current )
     {
       // this.colRef.current.parentElement.innerHTML = '';
       this.childupdate++;
     }
     return true;
   }

   componentDidUpdate(prevProps: ColumnExpanderProps, prevState: ColumnExpanderState) { this.effect(prevProps, prevState); }

   // TODO: read column width from 
   private setStateFromStorage(songId: any) {
     const columnWidth = this.settingsStorage.getValue('columnWidth', songId, defaultColumnWidth);
     this.setState({ columnWidth: columnWidth });
   }
    changeColumnWidth = (ev: { target: { value: any; }; }) => {
      const value = ev.target.value;
      this.setState({ columnWidth: parseFloat(value) });
      this.settingsStorage.setValue('columnWidth', this.props.song_id, value);
    }


    render() {
      const style = {
        '--columnWidth': this.state.columnWidth + 'px',
      } as React.CSSProperties;

      const debugStyle = debugColumns?
        <style dangerouslySetInnerHTML={{__html: 
                `
    .ce-halfColumn {
        background-color: lightblue;
    }

    .ce-fullColumn {
        background-color: lightgreen;
    }

  .ce-grid-header {
        background-color: lightpink;
  }
                `
        }}></style>:'';
        
      let gridClasses = 'ce-column-grid';
      if( this.dragStartPositionAndColumnWidth ) 
        gridClasses += ' dragging';
      else if( this.hoveringColumn )
        gridClasses += ' hovering';

      return (
      // Setting key to song_id forces complete rerender 
      // otherwise react fails since we add more columns after rendering
      // using column width means transposing still shouldn't 
      // lead to complete rerender
        <>
          <div key={this.props.song_id + this.state.columnWidth + this.childupdate} 
            style={style} className={gridClasses} 
            onMouseDown={this.handleColumnDrag} onMouseUp={this.handleColumnDrag}
            onMouseMove={this.handleColumnDrag} >

            {/* <div className="gapline"></div> */}
            {debugStyle}
            <div className='ce-grid-header' ref={this.headerRef}  >
              {this.props.header}
            </div>
            <div className={'ce-column'} ref={this.colRef} id="ce-firstcolumn">
              {this.props.children}
            </div>
          </div>
                
        </>
      );
    }
}
