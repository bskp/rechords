import { withRouter } from "react-router-dom";
import React, { Component } from "react";
import PropTypes from "prop-types";

class Collapsed extends Component {

    render() {
        return <aside
            className="collapsed"
            id={this.props.id}
            onClick={this.props.onClick}
        >{this.props.children}&nbsp;</aside>
    }
}

export default withRouter(Collapsed);