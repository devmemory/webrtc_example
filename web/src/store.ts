import { configureStore } from "@reduxjs/toolkit";
import webrtcSlice from "slice/webrtc_slice";

const store = configureStore({
    reducer: { webrtcSlice }
});

export type RootState = ReturnType<typeof store.getState>;

export default store;