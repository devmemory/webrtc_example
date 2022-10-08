interface RTCStateModel {
    userList: string[],
    from: string,
    to: string,
    receivedCalling: boolean,
    audioOnly: boolean,
    onMedia: boolean,
    isConnected: boolean,
    isCalling: boolean
}