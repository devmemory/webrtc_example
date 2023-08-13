import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import util from "src/util/util";

const useWebRTCHook = () => {
  const socket = useRef<Socket>();
  const peer = useRef<RTCPeerConnection>();
  const from = useRef<string>();
  const localStream = useRef<MediaStream | null>(null);
  const candidateList = useRef<IceCandidateModel[]>([]);
  const toRef = useRef<string>();
  const connectionRef = useRef<boolean>();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const [userList, setUserList] = useState<string[]>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [audioOnly, setAudioOnly] = useState<boolean>(false);
  const [to, setTo] = useState<string>();
  const [onMedia, setOnMedia] = useState<boolean>();
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [receivedCalling, setReceivedCalling] = useState<boolean>(false);

  toRef.current = to;
  connectionRef.current = isConnected;

  useEffect(() => {
    _initSocket();
    _initPeer();

    return () => {
      close();
      socket.current?.disconnect();
    };
  }, []);

  // [init] socket 이벤트들 등록
  const _initSocket = () => {
    console.log("[init] socket");

    console.log(import.meta);
    socket.current = io(import.meta.env.VITE_SERVER_IP);

    socket.current.on("connect", _socketConnected);
    socket.current.on("updateUserlist", _updateUserList);
    socket.current.on("connect_error", (e: any) => {
      console.log("connect error: ", { e });
    });
    socket.current.on("connect_timeout", (e: any) => {
      console.log("connect timeout: ", { e });
    });
    socket.current.on("offer", _receiveOffer);
    socket.current.on("answer", _receiveAnswer);
    socket.current.on("refuse", async () => {
      await close();
      _initPeer();
    });
    socket.current.on("remoteIceCandidate", _remotePeerIceCandidate);
    socket.current.on("disconnectPeer", async () => {
      await close();
      _initPeer();
    });
  };

  // [init] peer
  const _initPeer = () => {
    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    console.log("[init]", { peer });

    peer.current.onicecandidate = _iceCandidateEvent;
    peer.current.ontrack = _remoteStream;
    peer.current.onconnectionstatechange = _peerStateChange;
  };

  // peer state callback
  const _peerStateChange = (e: Event) => {
    console.log("[peer] connection state : ", peer.current!.connectionState, {
      e,
    });
    switch (peer.current!.connectionState) {
      case "connected":
        setIsConnected(true);
        break;
      case "disconnected":
        if (connectionRef.current) {
          close();
          _initPeer();
        }
        break;
      case "failed":
        peer.current!.restartIce();
        break;
      case "closed":
        if (connectionRef.current) {
          close();
          _initPeer();
        }
        break;
    }
  };

  // 본인 식별자 = 소켓 id
  const _socketConnected = () => {
    from.current = socket.current!.id;

    console.log("[socket] connected", { from });
  };

  // 초기에 connect되었을 때, 상대방 로그인/로그아웃 시 처리
  const _updateUserList = (data: { userList: string[] }) => {
    console.log("[userList] update", { data });

    const cUserList = data.userList.filter((e) => e !== from.current);

    setUserList(cUserList);
  };

  // [caller, callee] 미디어장치 연결
  const turnOnMedia = async () => {
    console.log("[init] media");

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: !audioOnly,
        audio: true,
      });

      console.log({ localStream });

      if (localRef.current !== null && localStream.current !== null) {
        localRef.current.srcObject = localStream.current;
      }

      localStream.current
        .getTracks()
        .forEach((track: MediaStreamTrack) =>
          peer.current!.addTrack(track, localStream.current!)
        );

      // 연결 되어있을때 tracking 다시 처리
      // if (peer.current!.connectionState === "connected") {
      //   peer.current!.getSenders().forEach((sender) => {
      //     const track = localStream.current
      //       ?.getTracks()
      //       .find(
      //         (track: MediaStreamTrack) => track.kind === sender.track?.kind
      //       );

      //     if (track !== undefined) {
      //       sender.replaceTrack(track);
      //     }
      //   });
      // }

      setOnMedia(true);
    } catch (e) {
      alert(e);
      return;
    }
  };

  // [caller, callee] 미디어장치 연결 해제
  const turnOffMedia = async () => {
    localStream.current?.getTracks().forEach((track) => {
      track.enabled = false;
      util.delay(1000).then(() => {
        track.stop();
      });
    });

    setOnMedia(false);
  };

  // [caller] : send offer to callee
  // peer : caller
  const sendOffer = async () => {
    if (to === undefined) {
      alert("유저를 선택해주세요.");
      return;
    }

    setIsCalling(true);

    console.log(peer.current?.connectionState);

    console.log("[offer] send", { to });

    await turnOnMedia();

    const offer = await peer.current!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: !audioOnly,
    });

    await peer.current!.setLocalDescription({
      sdp: offer.sdp,
      type: offer.type,
    });

    const offerModel: WebRTCModel = {
      to,
      from: from.current,
      audioOnly,
      offerSDP: offer.sdp,
      offerType: offer.type,
    };

    socket.current!.emit("offer", offerModel);
  };

  // [callee] : receive offer from caller
  // peer : callee
  const _receiveOffer = async (data: WebRTCModel) => {
    console.log("[offer] receive", { data });

    setTo(data.from);
    setAudioOnly(data.audioOnly!);
    setReceivedCalling(true);

    await turnOnMedia();

    await peer.current!.setRemoteDescription({
      sdp: data.offerSDP,
      type: data.offerType!,
    });
  };

  const refuse = async () => {
    socket.current!.emit("refuse", { to });

    await close();
    _initPeer();
  };

  // [callee] : send answer to caller
  const sendAnswer = async () => {
    console.log("[answer] send", { to });

    const answer = await peer.current!.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: !audioOnly,
    });

    await peer.current!.setLocalDescription(answer);

    const answerModel: WebRTCModel = {
      to,
      answerSDP: answer.sdp,
      answerType: answer.type,
    };

    socket.current!.emit("answer", answerModel);

    setReceivedCalling(false);
  };

  // [caller] : receive answer from callee
  // peer : caller
  const _receiveAnswer = async (data: WebRTCModel) => {
    console.log("[answer] receive", { data });

    await peer.current!.setRemoteDescription({
      sdp: data.answerSDP,
      type: data.answerType!,
    });

    for (let candidate of candidateList.current) {
      if (!isConnected) {
        console.log("[connect] candidate", { candidate });
        socket.current!.emit("iceCandidate", {
          to: toRef.current,
          ...candidate,
        });

        setIsCalling(false);
        break;
      }
    }
  };

  // [caller] create candidates
  const _iceCandidateEvent = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate === null) {
      console.log("[iceCandidate] cut : null");
      return;
    }

    const { candidate, sdpMid, sdpMLineIndex } = e.candidate;

    console.log(e.candidate);

    if (
      toRef.current === undefined ||
      toRef.current === null ||
      candidate === undefined ||
      candidate === null
    ) {
      console.log("[iceCandidate] cut ", { toRef, candidate });
      return;
    }

    console.log("[iceCandidate] data :", { e, candidate });

    if (!isConnected) {
      const candidateModel: IceCandidateModel = {
        candidate,
        sdpMid,
        sdpMLineIndex,
      };

      candidateList.current = [...candidateList.current, candidateModel];

      console.log({ candidateList });
    }
  };

  // [callee] get candidates
  // peer : caller or callee
  const _remotePeerIceCandidate = async (data: IceCandidateModel) => {
    console.log("[remoteIceCandidate] data :", { data });

    try {
      const { candidate, sdpMid, sdpMLineIndex } = data;

      console.log("[remote]", { candidate, sdpMid, sdpMLineIndex });

      const iceCandidate = new RTCIceCandidate({
        candidate,
        sdpMid,
        sdpMLineIndex,
      });
      await peer.current!.addIceCandidate(iceCandidate);
    } catch (e) {
      console.log("[remoteIceCandidate] error ", { e });
    }
  };

  // [caller, callee] get remote media stream
  const _remoteStream = (e: RTCTrackEvent) => {
    console.log("[gotRemoteStream] data :", { e });

    const [stream] = e.streams;

    if (remoteRef.current !== null) {
      remoteRef.current!.srcObject = stream;
    }
  };

  // [caller, callee] close peer connection
  const close = async (isClicked = false) => {
    console.log("[close] peer", { peer });

    peer.current?.close();
    peer.current = undefined;

    setIsCalling(false);
    setReceivedCalling(false);
    setIsConnected(false);
    candidateList.current = [];

    await turnOffMedia();

    // caller가 전화 하는 도중 취소했을 때
    if (isClicked) {
      _initPeer();
      socket.current!.emit("disconnectPeer", { to });
    }
  };

  const model: RTCStateModel = {
    userList,
    to,
    receivedCalling,
    audioOnly,
    onMedia,
    isConnected,
    isCalling,
  };

  return {
    model,
    turnOnMedia,
    turnOffMedia,
    sendOffer,
    refuse,
    sendAnswer,
    close,
    setTo,
    setAudioOnly,
    localRef,
    remoteRef,
  };
};

export default useWebRTCHook;
