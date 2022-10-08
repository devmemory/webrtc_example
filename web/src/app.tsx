import BtnComponent from "components/btn_component"
import VideoComponent from "components/video_component"
import webRTCController from "controller/webrtc_controller"
import React, { useEffect } from "react"
import './app.css'

const controller = webRTCController()

const App = () => {
    useEffect(() => {
        controller.init()

        return () => {
            controller.disconnectSocket()
        }
    }, [])

    return (
        <div className="div_container">
            <VideoComponent />
            <BtnComponent controller={controller}/>
        </div>
    )
}

export default App