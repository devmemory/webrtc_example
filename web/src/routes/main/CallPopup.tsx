import React from "react";
import CircleBtn from "src/components/CircleBtn";
import styles from "./main.module.css";

type CallPopupProps = {
  model: RTCStateModel;
  sendAnswer: () => Promise<void>;
  refuse: () => Promise<void>;
  close: (isClicked: boolean) => Promise<void>;
};

const CallPopup = ({ model, sendAnswer, refuse, close }: CallPopupProps) => {
  return (
    <>
      {(model.receivedCalling || model.isCalling) && (
        <div className={styles.div_background}>
          <div>
            <CircleBtn backgroundColor="var(--point-color)" radius="100px">
              {`${model.to}`[0]}
            </CircleBtn>
            <p>
              {model.isCalling
                ? `Calling ${model.to}`
                : `You got a call from ${model.to}`}
            </p>
            <div>
              {model.isCalling ? (
                <CircleBtn
                  backgroundColor="red"
                  radius="40px"
                  margin="10px"
                  onClick={() => close(true)}>
                  <img src="/assets/close.svg" />
                </CircleBtn>
              ) : (
                <>
                  <CircleBtn
                    backgroundColor="var(--point-color)"
                    radius="40px"
                    margin="10px"
                    onClick={sendAnswer}>
                    <img src="/assets/call.svg" />
                  </CircleBtn>
                  <CircleBtn
                    backgroundColor="red"
                    radius="40px"
                    margin="10px"
                    onClick={refuse}>
                    <img src="/assets/close.svg" />
                  </CircleBtn>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CallPopup;
