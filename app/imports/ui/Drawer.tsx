import { withRouter, RouteComponentProps } from 'react-router-dom';
import * as React from 'react';


interface DrawerProps extends RouteComponentProps {
    id?: string,
    onClick?: React.MouseEventHandler<HTMLElement>
    className: string,
    open?: boolean,
}

class Drawer extends React.Component<DrawerProps> {
    public static defaultProps = {
      open: false,
      id: ''
    };

    constructor(props: Readonly<DrawerProps>) {
      super(props);
    }

    render() {
      return <aside
        className={'drawer ' + this.props.className + (this.props.open ? ' open' : ' closed')}
        id={this.props.id}
        onClick={this.props.onClick}
      >
        <div>
          {this.props.children}&nbsp;
        </div>
      </aside>;
    }
}


export default withRouter(Drawer);
