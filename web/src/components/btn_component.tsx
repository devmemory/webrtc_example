import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { actionType, updateSingleValue } from 'slice/webrtc_slice'

const BtnComponent = ({controller}) => {
    const model: RTCStateModel = useSelector((state: any) => {
        return state.webrtcSlice
    })

    const dispatch = useDispatch()

    return (
        <div>
            {model.receivedCalling ? <>
                <button onClick={() => controller.sendAnswer()}>
                    answer
                </button>
                <button onClick={() => controller.refuse()}>
                    refuse
                </button>
            </> : <>
                <div className="div_users">
                    {(model.userList?.length ?? 0) !== 0 ? <>
                        {model.userList.map((user, i) => {
                            return (<p key={`user - ${i}`} className="p_user" onClick={() => {
                                dispatch(updateSingleValue({ value: user, type: actionType.to }))
                            }}
                                data-selected={user === model.to}>
                                {i} : {user}
                            </p>)
                        })}

                        {model.isConnected ? <button onClick={() => controller.close(true)}>
                            disconnect
                        </button> : <>
                            <label>
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        dispatch(updateSingleValue({ value: e.target.checked, type: actionType.audioOnly }))
                                    }}
                                />
                                Audio only
                            </label>
                            <button onClick={() => controller.sendOffer()} disabled={model.isCalling}>
                                Call
                            </button>
                        </>}
                    </> : "No users connected"}
                </div>
            </>}

            {model.onMedia ? <button onClick={() => controller.turnOffMedia()}>
                turn off media
            </button> : <button onClick={() => controller.turnOnMedia()}>
                turn on media
            </button>}
        </div>
    )
}

export default BtnComponent