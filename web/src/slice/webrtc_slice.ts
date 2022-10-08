import { createSlice } from "@reduxjs/toolkit";

export const enum actionType {
    userList = 'userList',
    from = 'from',
    to = 'to',
    receivedCalling = 'receivedCalling',
    audioOnly = 'audioOnly',
    onMedia = 'onMedia',
    isConnected = 'isConnected',
    isCalling = 'isCalling'
}

const webRTCSlice = createSlice({
    name: 'webRTC',
    initialState: { userList: [], from: undefined, to: undefined, receivedCalling: false, audioOnly: false, onMedia: false, isConnected: false, isCalling: false } as RTCStateModel,
    reducers: {
        updateSingleValue: (state, action) => {
            const payload = action.payload
            switch (payload.type) {
                case actionType.userList:
                    state.userList = payload.value
                    break;
                case actionType.from:
                    state.from = payload.value
                    break;
                case actionType.to:
                    state.to = payload.value
                    break;
                case actionType.receivedCalling:
                    state.receivedCalling = payload.value
                    break;
                case actionType.audioOnly:
                    state.audioOnly = payload.value
                    break;
                case actionType.onMedia:
                    state.onMedia = payload.value
                    break;
                case actionType.isConnected:
                    state.isConnected = payload.value
                    break;
                case actionType.isCalling:
                    state.isCalling = payload.value
                    break;
            }

            console.log('[reducer]', { state, action })
        },
        receivedValues: (state, action) => {
            state.receivedCalling = true
            state.to = action.payload.to
            state.audioOnly = action.payload.audioOnly
        },
        disconnectedValues: (state, _) => {
            state.isCalling = false
            state.isConnected = false
        }
    }
})

export const { updateSingleValue, receivedValues, disconnectedValues } = webRTCSlice.actions

export default webRTCSlice.reducer