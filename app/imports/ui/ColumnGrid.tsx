import * as React from 'react'
import { increaseHeaderSpan, expandColumns } from '../api/expandColumns';

import './ColumnGridStyle.less'
import { DefaultSettingsStorage } from '../api/localStorageDefs';

import AwesomeDebouncePromise from 'awesome-debounce-promise';

const debugColumns = false;
type ColumnExpanderProps = React.PropsWithChildren<{ header: React.ReactNode, scope?: string, song_id: string }>
type ColumnExpanderState = { columnWidth: number, height: number }

export class ColumnExpander extends React.Component<ColumnExpanderProps, ColumnExpanderState>
{
    settingsStorage = new DefaultSettingsStorage("columnExpander")
    public static defaultProps = {
        scope: "Expander"
    }
    childupdate: number;

    constructor(props: Readonly<ColumnExpanderProps>) {
        super(props);
        this.childupdate = 0;
        this.state = {
            columnWidth: this.settingsStorage.getValue('columnWidth', this.props.song_id, 20),
            height: window.innerHeight
        }
    }
    colRef: React.RefObject<HTMLDivElement> = React.createRef()
    headerRef: React.RefObject<HTMLDivElement> = React.createRef()

    

    private effect(prevProps: ColumnExpanderProps, prevState: ColumnExpanderState) {

        if (this.colRef.current) {
            const spanCount = increaseHeaderSpan(this.headerRef.current)
            expandColumns(this.colRef.current, 10, idx => idx >= spanCount ? 'ce-fullColumn' : 'ce-halfColumn')
        }
        const songId = this.props.song_id;
        if (songId == prevProps.song_id) return;

        // TODO: shift click stores the value of the checkbox
        this.setStateFromStorage(songId);
   }

   debounced = AwesomeDebouncePromise( () => window.innerHeight, 100) 


   bull =  async (ev: UIEvent) => {
       const h = await this.debounced();
       console.log(h)
       this.childupdate++;
       this.setState({height: window.innerHeight}) 
     }
        


    componentDidMount() { 
        this.effect(this.props, this.state)
        window.addEventListener('resize', this.bull)
        
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.bull);
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

    componentDidUpdate(prevProps: ColumnExpanderProps, prevState: ColumnExpanderState) { this.effect(prevProps, prevState) }

    // TODO: read column width from 
    private setStateFromStorage(songId: any) {
        const columnWidth = this.settingsStorage.getValue('columnWidth', songId, 20);
        this.setState({ columnWidth: columnWidth });
    }
    changeColumnWidth = (ev: { target: { value: any; }; }) => {
        const value = ev.target.value;
        this.setState({ columnWidth: value })
        this.settingsStorage.setValue('columnWidth', this.props.song_id, value)
    }


    render() {
        const style = {
            "--columnWidth": this.state.columnWidth + 'rem',
        }

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
        
        const className = `ce-grid-header`
        const slider = <div id="columnWidthSettings">
            <input type="range" value={this.state.columnWidth} onChange={this.changeColumnWidth} 
            min="5" max="50"  style={{zIndex: 90}}
            />
            </div>
        return (
            // Setting key to song_id forces complete rerender 
            // otherwise react fails since we add more columns after rendering
            // using column width means transposing still shouldn't 
            // lead to complete rerender
            <>
                {slider} 
                <div key={this.props.song_id + this.state.columnWidth + this.childupdate} style={style} className="ce-column-grid">
                    {debugStyle}
                    <div className={className} ref={this.headerRef}  >
                        {this.props.header}
                    </div>
                    <div  ref={this.colRef}>
                        {this.props.children}
                    </div>
                </div>
            </>
        );
    }
}