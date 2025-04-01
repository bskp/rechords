import * as React from "react";
import { ViewerProps } from "../Viewer";
import { PdfObject } from "./PdfObject";
import { IPdfViewerSettings, PdfSettings } from "./PdfSettings";
import { jsPdfGenerator } from "./PdfRenderer/PdfRenderer";
import { throttle } from "underscore";
import "./PdfViewerStyle.less";
import classNames from "classnames";
export class PdfViewer extends React.Component<
  ViewerProps,
  { loading: boolean; urls: string[] }
> {
  first: boolean = false;
  constructor(props: ViewerProps) {
    super(props);
    this.state = { loading: true, urls: [] };
  }

  componentDidMount = () => {
    this.first = true;
  };

  generatePdf = async (settings: IPdfViewerSettings): Promise<void> => {
    const pdfBlobUrl = await jsPdfGenerator(this.props.song, settings);

    this.setState((s) => {
      s.urls.push(pdfBlobUrl);
      console.log(s.urls);
      return { urls: s.urls };
    });

    setTimeout(() => {
      if (this.state.urls.length > 1) {
        const url = this.state.urls.shift();
        url && URL.revokeObjectURL(url); // freeing old url from memory
      }
      this.setState({ loading: false });
    }, 2e3);
  };

  _setSettings = throttle(
    (a: IPdfViewerSettings) => this.generatePdf(a),
    1000,
    { leading: true, trailing: true },
  );

  setSettings = (settings: IPdfViewerSettings) => {
    if (this.first) {
      this.first = false;
      this.generatePdf(settings);
    } else {
      this.setState({ loading: true });
      this._setSettings(settings);
    }
  };

  render(): JSX.Element {
    // let pdfBlob =

    console.log("render");

    const s = this.props.song;

    if (s._id) {
      return (
        <>
          <div
            className={classNames({
              pdfgrid: true,
              loading: this.state.loading,
            })}
          >
            {this.state.urls.map((u) => (
              <PdfObject key={u} url={u}></PdfObject>
            ))}
          </div>
          <PdfSettings consumer={this.setSettings} song={s} />
        </>
      );
    }
    return <div>No Song</div>;
  }
}
