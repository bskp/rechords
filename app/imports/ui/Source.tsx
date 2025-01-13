import React, { Component, PropsWithChildren } from "react";

type SourceProps = PropsWithChildren & {
  md: string;
  updateHandler?: (md: string) => void;
  readOnly?: boolean;
  className: string;
  onPasteInterceptor?: (v: string) => string;
};

export default class Source extends Component<SourceProps, never> {
  private readonly source: React.RefObject<HTMLTextAreaElement>;

  constructor(props: SourceProps) {
    super(props);
    this.source = React.createRef();
  }

  callUpdateHandler = () => {
    if (this.props.updateHandler && this.source.current) {
      this.props.updateHandler(this.source.current.value);
    }
  };

  onPasteHandler = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (this.props.onPasteInterceptor) {
      const inText = e.clipboardData.getData("Text");
      const newText = this.props.onPasteInterceptor(inText);
      if (inText != newText) {
        e.preventDefault();
        // The working way (preserving undo)
        // officially deprecated but with no replacement
        document.execCommand("insertText", false, newText);

        // The "new" way -- clumsy and breaking undo...
        /*         const start = this.source.current.selectionStart
        const end = this.source.current.selectionEnd

        const valueBefore = this.props.md

        const inFrontSelection = valueBefore.substring(0, start);
        // const selectionText = valueBefore.substring(start, end);
        const afterSelection = valueBefore.substring(end);
        this.props.updateHandler(inFrontSelection + newText + afterSelection) */
      }
    }
  };

  render() {
    // Height estimation
    const row_matches = this.props.md.match(/\n/g);
    let rows = 0;

    if (row_matches != null) {
      rows = row_matches.length * 1.8 + 10;
    }

    rows = Math.max(50, rows);

    const style = {
      minHeight: rows + "em",
    };

    return (
      <div className={"content " + this.props.className}>
        {this.props.children}
        <textarea
          ref={this.source}
          onChange={this.callUpdateHandler}
          value={this.props.md}
          style={style}
          readOnly={this.props.readOnly}
          onPaste={this.onPasteHandler}
        />
      </div>
    );
  }
}
