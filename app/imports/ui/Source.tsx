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
        // inserting original text first
        const oldStart = this.source.current.selectionStart
        document.execCommand("insertText", false, inText);
        // select inserted text
        this.source.current?.setSelectionRange(oldStart, oldStart+inText.length)
        // overwrite text with interceptor content
        document.execCommand("insertText", false, newText);
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
