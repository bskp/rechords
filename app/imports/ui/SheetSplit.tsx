import React from "react";
import { ReactElement } from "react";
import { Song } from "../api/collections";
import { ColumnExpander } from "./ColumnGrid";

function splitSongVdom(vdom: React.ReactElement[]): React.ReactElement[] {
    const sheetHeader = vdom.filter(el => el.props?.className == 'sd-header')
      .map(el => React.cloneElement(el))
  
    const sheetContent = vdom.filter(el => el.props?.className != 'sd-header')
      .filter(el => typeof el == 'object')
      .map(el => React.cloneElement(el))
  
    // @ts-ignore
    return [sheetHeader, sheetContent];
  
  }
  
  export const SheetSplit = (props: React.PropsWithChildren<{ song: Song}> ) => {
  
    const vdom = props.children;
    if(Array.isArray(vdom)) {
      const [sheetHeader, sheetContent]: React.ReactNode[] = splitSongVdom(vdom as ReactElement[]);
  
      return <ColumnExpander song_id={props.song?._id} header={sheetHeader}>
        {sheetContent}
      </ColumnExpander>
    } else {
        return <div>Only Arrays allowed</div>
    }
  
  }
  