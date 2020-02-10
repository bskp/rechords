import * as React from 'react';

interface MobileMenuProps extends React.HTMLProps<HTMLElement>
{
    toggleMenu: Function
    increaseTranspose: Function
    decreaseTranspose: Function
}

export const MobileMenu: React.FunctionComponent<MobileMenuProps> = props => {
    return (
        <div className="show-s" id="mobileheader">
            <span onClick={ev => props.toggleMenu()}>Menu</span>
            <span onClick={ev => props.increaseTranspose()}>+</span>
            <span onClick={ev => props.decreaseTranspose()}>-</span>
        </div>
    )
}
