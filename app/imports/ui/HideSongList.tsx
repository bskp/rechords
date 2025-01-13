import React, { useEffect } from "react";

const HideSongList: React.FC<{
  handle: (hideSongList: boolean) => void;
}> = ({ handle }) => {
  useEffect(() => {
    handle(true);
    return () => {
      handle(false);
    };
  }, [handle]);

  return <></>;
};

export default HideSongList;
