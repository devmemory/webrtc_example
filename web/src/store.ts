import { configureStore } from "@reduxjs/toolkit";
import webrtcSlice from "slice/webrtc_slice";

export default configureStore({
    reducer: { webrtcSlice }
})