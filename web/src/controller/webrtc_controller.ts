import { actionType, updateSingleValue, receivedValues, disconnectedValues, reset } from "slice/webrtc_slice";
import { io } from "socket.io-client";
import store from "store";
import util from "util/util";

export type ControllerType = ReturnType<typeof webRTCController>

const webRTCController = () => {
    const socket = io(process.env.socket_ip);

    let from: string;
    let to: string;
    let localStream: MediaStream = null;
    let isConnected = false;
    let candidateList: IceCandidateModel[] = [];
    let audioOnly: boolean = false;
    let peer: RTCPeerConnection;

    store.subscribe(() => {
        const state = store.getState().webrtcSlice;

        to = state.to;
        audioOnly = state.audioOnly;
        isConnected = state.isConnected;
    });


    // peer stun server set
    const createPeerConnection = () => {
        return new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });
    };

    // [init] socket 이벤트들 등록
    const _initSocket = () => {
        console.log('[init] socket');

        socket.on('connect', _socketConnected);
        socket.on('updateUserlist', _updateUserList);
        socket.on('connect_error', (e) => { console.log("connect error: ", { e }); });
        socket.on('connect_timeout', (e) => { console.log("connect timeout: ", { e }); });
        socket.on('offer', _receiveOffer);
        socket.on('answer', _receiveAnswer);
        socket.on('refuse', close);
        socket.on('remoteIceCandidate', _remotePeerIceCandidate);
        socket.on('disconnectPeer', close);
    };

    // [caller, callee] peer 초기화
    const _initPeer = () => {
        peer = createPeerConnection();

        console.log('[init]', { peer });

        peer.onicecandidate = _iceCandidateEvent;
        peer.ontrack = _remoteStream;
        peer.onconnectionstatechange = _peerStateChange;
    };


    const _peerStateChange = (e: Event) => {
        console.log('[peer] connection state : ', peer.connectionState, { e });
        switch (peer.connectionState) {
            case "connected":
                store.dispatch(updateSingleValue({ data: true, type: actionType.isConnected }));
                break;
            case "disconnected":
                if (isConnected) {
                    close();
                }
                break;
            case "failed":
                peer?.restartIce();
                break;
            case "closed":
                break;
        }
    };

    // 본인 식별자 = 소켓 id
    const _socketConnected = () => {
        // store.dispatch(updateSingleValue({ data: socket.id, type: actionType.from }));
        from = socket.id;

        console.log('[socket] connected', { from });
    };

    // 초기에 connect되었을 때, 상대방 로그인/로그아웃 시 처리 
    const _updateUserList = (data: UserListModel) => {
        console.log('[userList] update', { data });
        const userList = data.userList.filter((e) => e !== from);

        store.dispatch(updateSingleValue({ data: userList, type: actionType.userList }));
    };

    // [caller, callee] 미디어장치 연결
    const turnOnMedia = async () => {
        console.log('[init] media');

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: !audioOnly, audio: true });

            console.log({ localStream });

            const id = audioOnly ? 'audio_local' : 'video_local';

            (document.getElementById(id) as HTMLVideoElement).srcObject = localStream;

            localStream.getTracks().forEach((track: MediaStreamTrack) => peer.addTrack(track, localStream));

            // 연결 되어있을때 tracking 다시 처리
            if (peer.connectionState === 'connected') {
                peer.getSenders().forEach((sender) => {
                    const track = localStream.getTracks().find((track: MediaStreamTrack) => track.kind === sender.track.kind);
                    sender.replaceTrack(track);
                });
            }

            store.dispatch(updateSingleValue({ data: true, type: actionType.onMedia }));
        } catch (e) {
            alert(e);
            return;
        }
    };

    // [caller, callee] 미디어장치 연결 해제
    const turnOffMedia = async () => {
        localStream.getTracks().forEach((track) => {
            track.enabled = false;
            util.delay(1000).then(() => {
                track.stop();
            });
        });

        store.dispatch(updateSingleValue({ data: false, type: actionType.onMedia }));
    };

    // [caller] : send offer to callee
    // peer : caller
    const sendOffer = async () => {
        if (to === undefined) {
            alert('유저를 선택해주세요.');
            return;
        }

        store.dispatch(updateSingleValue({ data: true, type: actionType.isCalling }));

        await turnOnMedia();

        console.log(peer.connectionState);

        console.log('[offer] send', { to });

        const offer = await peer.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: !audioOnly,
        });

        await peer.setLocalDescription({ sdp: offer.sdp, type: offer.type });

        const offerModel: WebRTCModel = { to, from, audioOnly, offerSDP: offer.sdp, offerType: offer.type };

        socket.emit('offer', offerModel);
    };

    // [callee] : receive offer from caller
    // peer : callee
    const _receiveOffer = async (data: WebRTCModel) => {
        console.log('[offer] receive', { data });

        store.dispatch(receivedValues({
            to: data.from,
            audioOnly: data.audioOnly
        }));

        await peer.setRemoteDescription({ sdp: data.offerSDP, type: data.offerType });

        await turnOnMedia();
    };

    const refuse = async () => {
        socket.emit('refuse', { to });

        await close();
    };

    // [callee] : send answer to caller
    const sendAnswer = async () => {
        console.log('[answer] send', { to });

        const answer = await peer.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: !audioOnly,
        });
        await peer.setLocalDescription(answer);

        const answerModel: WebRTCModel = { to, answerSDP: answer.sdp, answerType: answer.type };

        socket.emit('answer', answerModel);

        store.dispatch(updateSingleValue({ data: false, type: actionType.receivedCalling }));
    };

    // [caller] : receive answer from callee
    // peer : caller
    const _receiveAnswer = async (data: WebRTCModel) => {
        console.log('[answer] receive', { data });

        await peer.setRemoteDescription({ sdp: data.answerSDP, type: data.answerType });

        for (let candidate of candidateList) {
            if (!isConnected) {
                console.log('[connect] candidate', { candidate });
                socket.emit('iceCandidate', { to, ...candidate });
                break;
            }
        }
    };

    // [caller] create candidates
    const _iceCandidateEvent = (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate === null) {
            console.log('[iceCandidate] cut');
            return;
        }

        const { candidate, sdpMid, sdpMLineIndex } = e.candidate;

        console.log({ to, candidate, sdpMid, sdpMLineIndex });

        if (to === undefined || to === null || candidate === undefined || candidate === null) {
            console.log('[iceCandidate] cut ', { to, candidate });
            return;
        }

        console.log('[iceCandidate] data :', { e, candidate });

        if (!isConnected) {
            const candidateModel = { candidate, sdpMid, sdpMLineIndex } as IceCandidateModel;

            candidateList = [...candidateList, candidateModel];

            console.log({ candidateList });
        }
    };

    // [callee] get candidates
    // peer : caller or callee
    const _remotePeerIceCandidate = async (data: IceCandidateModel) => {

        console.log('[remoteIceCandidate] data :', { data });

        try {
            const { candidate, sdpMid, sdpMLineIndex } = data;

            console.log('[remote]', { candidate, sdpMid, sdpMLineIndex });

            const iceCandidate = new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex });
            await peer.addIceCandidate(iceCandidate);
        } catch (e) {
            console.log('[remoteIceCandidate] error ', { e });
        }
    };

    // [caller, callee] get remote media stream
    const _remoteStream = (e: RTCTrackEvent) => {
        console.log('[gotRemoteStream] data :', { e });

        const [stream] = e.streams;

        const id = audioOnly ? 'audio_remote' : 'video_remote';

        (document.getElementById(id) as HTMLVideoElement).srcObject = stream;
    };

    // [caller, callee] close peer connection
    const close = async (isClicked = false) => {
        console.log('[close] peer', { peer });

        peer.close();
        peer = null;

        store.dispatch(disconnectedValues());

        candidateList = [];

        // peer init
        _initPeer();

        await turnOffMedia();

        if (isClicked) {
            socket.emit('disconnectPeer', { to });
        }
    };

    return {
        init: () => {
            _initSocket();
            _initPeer();
        },
        turnOnMedia,
        turnOffMedia,
        sendOffer,
        sendAnswer,
        refuse,
        close,
        dispose: () => {
            close();
            socket.disconnect();
            store.dispatch(reset())
        }
    };
};

export default webRTCController;