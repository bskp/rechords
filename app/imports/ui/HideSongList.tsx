import * as React from 'react';

interface HProps {
    handle: Function,
}

export default class HideSongList extends React.Component<HProps, {}> {
    constructor(props: Readonly<HProps>) {
        super(props);
    }

    componentDidMount() {
        this.props.handle(true);
    }

    componentWillUnmount() {
        this.props.handle(false);
    }

    render() {
        return <></>
    }
}