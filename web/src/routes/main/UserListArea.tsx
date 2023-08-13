import React from "react";
import CircleBtn from "src/components/CircleBtn";
import styles from "./main.module.css";

type UserListProps = {
  model: RTCStateModel;
  setTo: React.Dispatch<React.SetStateAction<string | undefined>>;
  sendOffer: () => Promise<void>;
};

const UserListArea = ({ model, setTo, sendOffer }: UserListProps) => {
  return (
    <>
      {!model.isConnected && (
        <ul className={styles.ul_userList}>
          <div>Active user</div>
          {model.userList?.map((e) => {
            const isSelected = model.to === e;
            return (
              <li
                key={e}
                className={isSelected ? styles.li_selected : undefined}>
                <div onClick={() => setTo(e)}>
                  <CircleBtn
                    backgroundColor={isSelected ? "var(--point-color)" : "grey"}
                    radius="30px"
                    margin="4px">
                    {e.charAt(0)}
                  </CircleBtn>
                  {e}
                </div>
                <img src="/assets/call.svg" onClick={sendOffer} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default UserListArea;
