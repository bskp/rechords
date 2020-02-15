import * as React from 'react';

import './MobileMenu.less'

interface MobileMenuProps extends React.HTMLProps<HTMLElement>
{
    toggleMenu: Function
    increaseTranspose: Function
    decreaseTranspose: Function
}

export const MobileMenu: React.FunctionComponent<MobileMenuProps> = props => {
    return (
        <div className="show-s" id="mobilemenu">
            <span onClick={ev => props.toggleMenu()} id="menu">Menu</span>
            <span onClick={ev => props.increaseTranspose()} id="plus">+</span>
            <span onClick={ev => props.decreaseTranspose()} id="minus">-</span>
        </div>
    )
}
