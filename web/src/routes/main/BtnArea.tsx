import React from "react";
import CircleBtn from "src/components/CircleBtn";
import styles from "./main.module.css";

type BtnAreaProps = {
  model: RTCStateModel;
  close: (isClicked: boolean) => void;
  turnOffMedia: () => Promise<void>;
  turnOnMedia: () => Promise<void>;
};

const BtnArea = ({ model, close, turnOffMedia, turnOnMedia }: BtnAreaProps) => {
  if (!model.isConnected) {
    return <></>;
  }

  const toggleVideo = () => {
    if (model.onMedia) {
      turnOffMedia();
    } else {
      turnOnMedia();
    }
  };

  return (
    <div className={styles.div_btnarea}>
      <CircleBtn
        backgroundColor={model.onMedia ? "var(--point-color)" : "grey"}
        radius="50px"
        onClick={toggleVideo}>
        <img
          src={model.onMedia ? "/assets/video_on.svg" : "/assets/video_off.svg"}
        />
      </CircleBtn>
      <CircleBtn
        backgroundColor="red"
        radius="50px"
        onClick={() => close(true)}>
        <img src="/assets/close.svg" />
      </CircleBtn>
    </div>
  );
};

export default BtnArea;
