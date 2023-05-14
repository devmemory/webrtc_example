import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type RTCType = {
    type: string,
    data: any;
};

export const enum actionType {
    userList = 'userList',
    to = 'to',
    receivedCalling = 'receivedCalling',
    audioOnly = 'audioOnly',
    onMedia = 'onMedia',
    isConnected = 'isConnected',
    isCalling = 'isCalling'
}

const initialState = {
    userList: [],
    to: undefined,
    receivedCalling: false,
    audioOnly: false,
    onMedia: false,
    isConnected: false,
    isCalling: false
} as RTCStateModel;

const webRTCSlice = createSlice({
    name: 'webRTC',
    initialState,
    reducers: {
        updateSingleValue: (state, action: PayloadAction<RTCType>) => {
            console.log('[redux]', { payload: action.payload });

            state[action.payload.type] = action.payload.data;
        },
        receivedValues: (state, action: PayloadAction<RTCStateModel>) => {
            const { to, audioOnly } = action.payload;

            state.receivedCalling = true;
            state.to = to;
            state.audioOnly = audioOnly;
        },
        disconnectedValues: (state) => {
            state.isCalling = false;
            state.isConnected = false;
            state.receivedCalling = false;

            console.log('[state] isCalling', state.isCalling);
        },
        reset: (state) => {
            Object.assign(state, initialState);
        }
    }
});

export const { updateSingleValue, receivedValues, disconnectedValues, reset } = webRTCSlice.actions;

export default webRTCSlice.reducer;