import * as React from 'react';

interface HProps {
    handle: (hideSongList: boolean) => void,
}

export default class HideSongList extends React.Component<HProps, never> {
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
    return <></>;
  }
}
