import * as React from "react";
import { ViewerProps } from "../Viewer";
import { PdfObject } from "./PdfObject";
import { IPdfViewerSettings, PdfSettings } from "./PdfSettings";
import { jsPdfGenerator } from "./PdfRenderer/PdfRenderer";
import { throttle } from "underscore";
import "./PdfViewerStyle.less";
import classNames from "classnames";
import Drawer from "../Drawer";
import { navigateCallback, View } from "/imports/api/helpers";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
export const PdfViewer: FunctionComponent<ViewerProps> = (props) => {
  {
    const [loading, setLoading] = useState(true);
    const urls = useRef<string[]>([]);

    const first = useRef(true);

    const generatePdf = async (settings: IPdfViewerSettings): Promise<void> => {
      const pdfBlobUrl = await jsPdfGenerator(props.song, settings);

      urls.current.push(pdfBlobUrl);
      console.log(urls);

      setTimeout(() => {
        if (urls.current.length > 1) {
          const url = urls.current.shift();
          url && URL.revokeObjectURL(url); // freeing old url from memory
        }
        setLoading(false);
      }, 2000);
    };

    const _setSettings = throttle(
      (a: IPdfViewerSettings) => generatePdf(a),
      500,
      { leading: true, trailing: true }
    );

    const setSettings = (settings: IPdfViewerSettings) => {
      if (first.current) {
        first.current = false;
        generatePdf(settings);
      } else {
        setLoading(true);
        _setSettings(settings);
      }
    };

    // let pdfBlob =

    console.log("render");

    const s = props.song;
    const history = useHistory();

    if (s._id) {
      return (
        <>
          <Drawer
            onClick={navigateCallback(history, View.view, s)}
            className="list-colors"
          >
            <h1>Zurück</h1>
            <p>Schneller: Rechtsklick!</p>
          </Drawer>
          <div
            className={classNames({
              pdfgrid: true,
              loading: loading,
            })}
          >
            {urls.current.map((u) => (
              <PdfObject key={u} url={u}></PdfObject>
            ))}
          </div>
          <PdfSettings consumer={setSettings} song={s} />
            <h1>{loading&&"loading..."}</h1>
        </>
      );
    }
    return <div>No Song</div>;
  }
};
