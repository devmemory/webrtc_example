import BtnComponent from "components/btn_component";
import VideoComponent from "components/video_component";
import webRTCController, { ControllerType } from "controller/webrtc_controller";
import React, { useEffect, useRef } from "react";
import './app.css';

const App = () => {
    const controller = useRef<ControllerType>();

    useEffect(() => {
        controller.current = webRTCController();

        controller.current.init();

        return () => {
            controller.current.dispose();
        };
    }, []);

    return (
        <div className="div_container">
            <VideoComponent />
            <BtnComponent controller={controller} />
        </div>
    );
};

export default App;