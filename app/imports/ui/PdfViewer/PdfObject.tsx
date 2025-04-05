import * as React from "react";
import { FunctionComponent, memo } from "react";

export const PdfObject: FunctionComponent<{ url: string }> = memo(({ url }) => {
  return (
    <object
      key={url}
      data={url}
      width="100%"
      height="100%"
      type="application/pdf"
    ></object>
  );
});
PdfObject.displayName = "PdfObject";
