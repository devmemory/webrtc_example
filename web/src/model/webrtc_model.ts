interface WebRTCModel {
    from: string,
    to: string,
    offerSDP: string,
    offerType: RTCSdpType,
    answerSDP: string,
    answerType: RTCSdpType,
    audioOnly: boolean
}