import { withRouter, RouteComponentProps } from "react-router-dom";
import * as React from 'react';
import PropTypes from "prop-types";


interface DrawerState {
    open: boolean
}

interface DrawerProps extends RouteComponentProps {
    id: string,
    onClick: React.MouseEventHandler<HTMLElement>
    className: string,
    initialOpen: boolean,
}

class Drawer extends React.Component<DrawerProps, DrawerState> {
    public static defaultProps = {
        initialOpen: false
    };

    constructor(props: Readonly<DrawerProps>) {
        super(props);
        this.state = {
            open: props.initialOpen
        }
    }

    render() {
        return <aside
            className={"drawer " + this.props.className + (this.state.open ? " open" : " closed")}
            id={this.props.id}
            onClick={this.props.onClick}
        >{this.props.children}&nbsp;</aside>
    }
}


export default withRouter(Drawer);