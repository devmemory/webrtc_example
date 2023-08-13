import React from "react";
import useWebRTCHook from "src/hooks/useWebRTCHook";
import BtnArea from "./BtnArea";
import CallPopup from "./CallPopup";
import UserListArea from "./UserListArea";
import VideoArea from "./VideoArea";
import styles from './main.module.css'

const Main = () => {
  const {
    model,
    turnOnMedia,
    turnOffMedia,
    sendOffer,
    refuse,
    sendAnswer,
    close,
    setTo,
    localRef,
    remoteRef,
  } = useWebRTCHook();

  return (
    <div className={styles.div_main}>
      <CallPopup
        model={model}
        sendAnswer={sendAnswer}
        refuse={refuse}
        close={close}
      />
      <UserListArea model={model} setTo={setTo} sendOffer={sendOffer} />
      <VideoArea model={model} localRef={localRef} remoteRef={remoteRef} />
      <BtnArea
        model={model}
        close={close}
        turnOffMedia={turnOffMedia}
        turnOnMedia={turnOnMedia}
      />
    </div>
  );
};

export default Main;
