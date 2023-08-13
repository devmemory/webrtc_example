import React from "react";

type MediaProps = {
  mediaRef: React.RefObject<HTMLVideoElement>;
  isAudioOnly: boolean;
  isRemote: boolean;
};

const MediaComponent = ({ mediaRef, isAudioOnly, isRemote }: MediaProps) => {
  return (
    <>
      {isAudioOnly ? (
        <audio ref={mediaRef} playsInline autoPlay muted={!isRemote} />
      ) : (
        <div>
          <video ref={mediaRef} playsInline autoPlay muted={!isRemote} />
          <div>{isRemote ? "Remote" : "Local"}</div>
        </div>
      )}
    </>
  );
};

export default MediaComponent;
