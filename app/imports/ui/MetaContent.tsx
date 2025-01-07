import * as React from 'react';
import parse, { DOMNode, domToReact } from 'html-react-parser';

import Songs from '../api/collections';

interface MetaContentProps {
  title: string;
  className?: string;
  replace?: (
    domNode: DOMNode
  ) => React.ReactElement;
}

const MetaContent = (props: MetaContentProps) => {
  let content: ReturnType<typeof domToReact>;

  const match = Songs.findOne({author: 'Meta', title: props.title});
  if (match !== undefined) {
    const html = match.getHtml();
    content = parse(html, {replace: props.replace});
  } else {
    content = <span>No match for {props.title}!</span>;
  }

  return (
    <div className={props.className}>{content}</div>
  );
}

export default MetaContent;