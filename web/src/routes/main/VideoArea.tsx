import React from "react";
import MediaComponent from "src/components/MediaComponent";
import styles from "./main.module.css";

type VideoAreaRef = {
  localRef: React.RefObject<HTMLVideoElement>;
  remoteRef: React.RefObject<HTMLVideoElement>;
  model: RTCStateModel;
};

const VideoArea = ({ model, localRef, remoteRef }: VideoAreaRef) => {
  return (
    <div
      className={
        model.isConnected
          ? `${styles.div_videos} ${styles.show_video}`
          : styles.div_videos
      }>
      <MediaComponent
        mediaRef={localRef}
        isAudioOnly={model.audioOnly!}
        isRemote={false}
      />
      <MediaComponent
        mediaRef={remoteRef}
        isAudioOnly={model.audioOnly!}
        isRemote={true}
      />
    </div>
  );
};

export default VideoArea;
