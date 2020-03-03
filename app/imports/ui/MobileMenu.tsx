import * as React from 'react';

import './MobileMenu.less'
import { ITransposeHandler} from './Viewer'

interface MobileMenuProps extends React.HTMLProps<HTMLElement>
{
    toggleMenu: Function
    transposeHandler: {current: ITransposeHandler}
}


export class MobileMenu extends React.Component<MobileMenuProps>  {

    constructor(props) {
        super(props);
    }

    increaseTranspose = () => {
        if( this.props.transposeHandler.current )
          this.props.transposeHandler.current.increaseTranspose();
    };
  
    decreaseTranspose = () => {
        if( this.props.transposeHandler.current )
          this.props.transposeHandler.current.increaseTranspose();
    };

    render() {
    return (
        <div id="mobilemenu">
            <span onClick={ev => this.props.toggleMenu()} id="menu">Menu</span>
            <span onClick={ev => this.increaseTranspose()} id="plus">+</span>
            <span onClick={ev => this.decreaseTranspose()} id="minus">-</span>
        </div>
    )
    }
}
