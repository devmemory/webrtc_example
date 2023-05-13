import { ControllerType } from 'controller/webrtc_controller';
import React, { MutableRefObject } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actionType, updateSingleValue } from 'slice/webrtc_slice';
import { RootState } from 'store';

type BtnCompProps = {
    controller: MutableRefObject<ControllerType>;
};

const BtnComponent = ({ controller }: BtnCompProps) => {
    const model: RTCStateModel = useSelector((state: RootState) => state.webrtcSlice);

    console.log({ model });

    const dispatch = useDispatch();

    return (
        <div>
            {model.receivedCalling ? <>
                <button onClick={() => controller.current?.sendAnswer()}>
                    answer
                </button>
                <button onClick={() => controller.current?.refuse()}>
                    refuse
                </button>
            </> :
                <div className="div_users">
                    {(model.userList?.length ?? 0) !== 0 ? <>
                        {model.userList.map((user, i) => {
                            return (<p key={`user - ${i}`} className="p_user" onClick={() => {
                                dispatch(updateSingleValue({ data: user, type: actionType.to }));
                            }}
                                data-selected={user === model.to}>
                                {i} : {user}
                            </p>);
                        })}

                        {model.isConnected ? <button onClick={() => controller.current?.close(true)}>
                            disconnect
                        </button> : <>
                            <label>
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        dispatch(updateSingleValue({ data: e.target.checked, type: actionType.audioOnly }));
                                    }}
                                />
                                Audio only
                            </label>
                            <button onClick={() => controller.current?.sendOffer()} disabled={model.isCalling}>
                                Call
                            </button>
                        </>}
                    </> : "No users connected"}
                </div>
            }

            {model.onMedia ? <button onClick={() => controller.current?.turnOffMedia()}>
                turn off media
            </button> : <button onClick={() => controller.current?.turnOnMedia()}>
                turn on media
            </button>}
        </div>
    );
};

export default BtnComponent;