import React from 'react'
import { useSelector } from 'react-redux'

const VideoComponent = () => {
    const model: RTCStateModel = useSelector((state: any) => {
        return state.webrtcSlice
    })

    return (
        <div>
            {model.audioOnly ? <>
                <div>
                    <p>Remote audio</p>
                    <audio id="audio_remote" playsInline autoPlay />
                </div>
                <div>
                    <p>My audio</p>
                    <audio id="audio_local" playsInline autoPlay muted />
                </div>
            </> : <>
                <div>
                    <p>Remote camera</p>
                    <video id="video_remote" playsInline autoPlay />
                </div>
                <div>
                    <p>My camera</p>
                    <video id="video_local" playsInline autoPlay muted />
                </div>
            </>}
        </div>
    )
}

export default VideoComponent