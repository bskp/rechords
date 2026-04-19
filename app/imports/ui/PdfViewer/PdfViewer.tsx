import * as React from "react";
import { FunctionComponent, useState } from "react";
import { ViewerProps } from "../Viewer";
import { PdfObject } from "./PdfObject";
import { IPdfViewerSettings, PdfSettings } from "./PdfSettings";
import { jsPdfGenerator } from "./PdfRenderer/PdfRenderer";
import { debounce } from "underscore";
import "./PdfViewerStyle.less";
import Drawer from "../Drawer";
import { navigateCallback, View } from "/imports/api/helpers";
import { useNavigate } from "react-router";

export const PdfViewer: FunctionComponent<ViewerProps> = (props) => {
  {
    const [urls, setUrls] = useState<string[]>([]);

    const generatePdf = async (settings: IPdfViewerSettings): Promise<void> => {
      const pdfBlobUrl = await jsPdfGenerator(props.song, settings);

      setUrls([urls[urls.length - 1], pdfBlobUrl]);
      console.log(urls);
    };

    const _setSettings = debounce(
      (a: IPdfViewerSettings) => generatePdf(a),
      100,
    );

    const setSettings = (settings: IPdfViewerSettings) => {
      _setSettings(settings);
    };

    // let pdfBlob =

    const s = props.song;
    const navigate = useNavigate();

    if (s._id) {
      return (
        <>
          <Drawer
            onClick={navigateCallback(navigate, View.view, s)}
            className="list-colors"
          >
            <h1>Zurück</h1>
          </Drawer>
          <div className="pdfgrid">
            {urls.map((u) => (
              <PdfObject key={u} url={u}></PdfObject>
            ))}
          </div>
          <PdfSettings consumer={setSettings} song={s} />
        </>
      );
    }
    return <div>No Song</div>;
  }
};
