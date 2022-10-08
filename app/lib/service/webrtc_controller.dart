import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:vibration/vibration.dart';
import 'package:web_rtc/model/icecandidate_model.dart';
import 'package:web_rtc/model/webrtc_model.dart';
import 'package:web_rtc/service/webrtc_socket.dart';


enum ScreenState { loading, initDone, receivedCalling }

class WebRTCController extends WebRTCSocket {
  /// 상대방
  String? to;

  /// 본인
  String? _from;

  /// 연결대상, 본인
  RTCPeerConnection? _peer;

  /// 본인 비디오 렌더러
  RTCVideoRenderer? localRenderer = RTCVideoRenderer();

  /// 상대방 비디오 렌더러
  RTCVideoRenderer? remoteRenderer = RTCVideoRenderer();

  /// 유저 리스트 처리용
  ValueNotifier<List<String>> userListNotifier =
  ValueNotifier<List<String>>([]);

  /// 본인 비디오 렌더 상태관리
  ValueNotifier<bool> localVideoNotifier = ValueNotifier<bool>(false);

  /// 상대방 비디오 렌더 상태관리
  ValueNotifier<bool> remoteVideoNotifier = ValueNotifier<bool>(false);

  /// [_receiveOffer] 발생시, [sendAnswer] 부분 데이터 처리
  RTCSessionDescription? _answer;

  /// [WebRTCListView] 부분 state 처리
  ValueNotifier<ScreenState> screenNotifier =
  ValueNotifier<ScreenState>(ScreenState.loading);

  /// [WebRTCView] context. Navigator.pop 용도
  BuildContext? webRTCVideoViewContext;

  /// offer/answer 과정 완료 후 send
  final List<IceCandidateModel> _candidateList = [];

  /// 본인 비디오
  MediaStream? _localStream;

  /// iceCandidate 연결 여부
  bool _isConnected = false;

  bool audioOnly = false;

  /// [_initSocket], [_initPeer] 소켓, 피어, 렌더러 초기화
  Future<void> initController() async {
    await _initSocket();
    await _initPeer();

    await localRenderer!.initialize();
    await remoteRenderer!.initialize();

    screenNotifier.value = ScreenState.initDone;
  }

  ///  역할
  void dispose() {
    userListNotifier.dispose();
    localVideoNotifier.dispose();
    remoteVideoNotifier.dispose();
    screenNotifier.dispose();

    localRenderer?.dispose();
    remoteRenderer?.dispose();

    _localStream?.dispose();
    _peer?.dispose();
    super.disconnectSocket();
  }

  /// 소켓 초기화
  Future<void> _initSocket() async {
    _from = await super.connectSocket();

    if (_from != null) {
      super.socketOn('updateUserlist', _updateUserList);
      super.socketOn('connect_error', (data) {
        debugPrint('[socket] error : $data');
      });
      super.socketOn('connect_timeout', (data) {
        debugPrint('[socket] error : $data');
      });
      super.socketOn('offer', _receiveOffer);
      super.socketOn('refuse', _refusedConnection);
      super.socketOn('answer', _receiveAnswer);
      super.socketOn('remoteIceCandidate', _remotePeerIceCandidate);
      super.socketOn('disconnectPeer', close);
    }
  }

  /// [_peer] 초기화
  Future<void> _initPeer() async {
    _peer = await createPeerConnection({
      'iceServers': [
        {'url': 'stun:stun.l.google.com:19302'},
      ],
    });

    _peer!.onIceCandidate = _iceCandidateEvent;
    _peer!.onTrack = _remoteStream;
    _peer!.onConnectionState = _peerStateChange;
  }

  /// [소켓] 유저가 로그인/로그아웃 일때마다 업데이트
  void _updateUserList(data) {
    debugPrint('[socket] userList update $data');
    Map<String, dynamic> map = Map.castFrom(data);

    List<String> list = List.from(map['userList']);
    debugPrint('[socket] list : $list');
    list.removeWhere((element) => element == super.user);

    userListNotifier.value = list;
  }

  /// [본인] 영상통화 offer 보냄
  Future<void> sendOffer() async {
    if (to == null) {
      return;
    }
    await turnOnMedia();

    final RTCSessionDescription offer = await _peer!.createOffer({
      'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': !audioOnly,
      }
    });
    await _peer!.setLocalDescription(offer);

    WebRTCModel model = WebRTCModel();
    model.offerType = offer.type;
    model.offerSDP = offer.sdp;
    model.to = to;
    model.from = _from;
    model.audioOnly = audioOnly;

    debugPrint('[webRTC] send offer : ${model.from} to ${model.to}');

    super.socketEmit('offer', model.toJson());
  }

  /// [상대방] 영상통화 offer 받음
  void _receiveOffer(data) async {
    WebRTCModel model = WebRTCModel.fromJson(data);

    audioOnly = model.audioOnly!;

    debugPrint('[webRTC] receive offer : ${model.to} from ${model.from}');

    await _peer!.setRemoteDescription(
        RTCSessionDescription(model.offerSDP, model.offerType));
    await turnOnMedia();
    _answer = await _peer!.createAnswer({
      'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': !audioOnly,
      }
    });
    await _peer!.setLocalDescription(_answer!);

    to = model.from;

    screenNotifier.value = ScreenState.receivedCalling;

    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 1500);
    }
  }

  /// [상대방] 통화 거절 보냄
  Future<void> refuseOffer() async {
    socketEmit('refuse', {'to': to});
    await _resetElements();

    screenNotifier.value = ScreenState.initDone;
  }

  /// [본인] 통화 거절 받음
  void _refusedConnection(_) async {
    await close(_);
  }

  /// [상대방] 영상통화 offer에 대한 answer
  void sendAnswer() {
    debugPrint('[webRTC] send answer to $to');
    WebRTCModel model = WebRTCModel();
    model.answerSDP = _answer!.sdp;
    model.answerType = _answer!.type;
    model.to = to;
    model.audioOnly = audioOnly;

    _answer = null;

    Vibration.hasVibrator().then((value) {
      if (value ?? false) {
        Vibration.cancel();
      }
    });

    super.socketEmit('answer', model.toJson());
  }

  /// [본인] 상대방 answer 받음
  void _receiveAnswer(data) async {
    WebRTCModel model = WebRTCModel.fromJson(data);

    debugPrint('[webRTC] receive answer : ${model.answerType}');

    await _peer!.setRemoteDescription(RTCSessionDescription(
        model.answerSDP!.replaceFirst('useinbandfec=1',
            'useinbandfec=1; stereo=1; maxaveragebitrate=510000'),
        model.answerType));

    for (IceCandidateModel candidateModel in _candidateList) {
      if (!_isConnected) {
        debugPrint('[webRTC] send iceCandidate : ${candidateModel.toJson()}');
        super.socketEmit('iceCandidate', candidateModel.toJson());
        break;
      }
    }
  }

  /// [본인, 상대방] ice candidate 연결 요청
  void _iceCandidateEvent(RTCIceCandidate e) {
    debugPrint('?????');
    IceCandidateModel model = IceCandidateModel();
    model.candidate = e.candidate;
    model.sdpMid = e.sdpMid;
    model.sdpMLineIndex = e.sdpMLineIndex;
    model.to = to;

    if (model.candidate == null || model.to == null) {
      debugPrint('[webRTC] iceCandidate cut candidate : ${model.toJson()}');
      return;
    }

    int index = _candidateList
        .indexWhere((element) => element.candidate == model.candidate);

    if (index < 0) {
      _candidateList.add(model);
    }
  }

  /// [본인, 상대방] ice candidate 연결 처리
  void _remotePeerIceCandidate(data) async {
    debugPrint('[webRTC] remoteIceCandidate $data');
    try {
      IceCandidateModel model = IceCandidateModel.fromJson(data);

      RTCIceCandidate candidate =
      RTCIceCandidate(model.candidate, model.sdpMid, model.sdpMLineIndex);

      await _peer!.addCandidate(candidate);
    } catch (e) {
      debugPrint('[webRTC] remoteIceCandidate error : $e');
    }
  }

  /// 상대방 미디어 처리
  void _remoteStream(RTCTrackEvent e) {
    debugPrint('[webRTC] gotRemoteStream data : ${e.track}, ${e.streams}');

    MediaStream stream = e.streams.first;

    remoteRenderer!.srcObject = stream;

    remoteVideoNotifier.value = true;
  }

  /// peer state 확인용
  void _peerStateChange(RTCPeerConnectionState state) {
    debugPrint(
        '[webRTC] peer connection state : ${state.name}, ${_peer?.connectionState}');

    if (state == RTCPeerConnectionState.RTCPeerConnectionStateConnected &&
        !_isConnected) {
      _isConnected = true;
    } else if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed) {
      _peer?.restartIce();
    }
  }

  /// [본인] 미디어 on
  Future<void> turnOnMedia() async {
    try {
      _localStream = await navigator.mediaDevices.getUserMedia({
        'video': audioOnly ? false : {'facingMode': 'user'},
        'audio': {
          'autoGainControl': false,
          'channelCount': 2,
          'echoCancellation': false,
          'latency': 0,
          'noiseSuppression': false,
          'sampleRate': 48000,
          'sampleSize': 16,
          'volume': 1.0
        }
      });

      localRenderer!.srcObject = _localStream;

      localVideoNotifier.value = true;

      localRenderer?.muted = true;

      for (MediaStreamTrack track in _localStream!.getTracks()) {
        debugPrint('track : $track, stream : $_localStream');

        if (track.kind == 'audio') {
          Helper.setMicrophoneMute(false, track);
        }
        _peer!.addTrack(track, _localStream!);
      }

      if (_peer!.connectionState ==
          RTCPeerConnectionState.RTCPeerConnectionStateConnected) {
        List<RTCRtpSender> list = await _peer!.getSenders();
        debugPrint('[media] list : ${list.length}');
        for (RTCRtpSender sender in list) {
          debugPrint('[media] sender : $sender');
          List<MediaStreamTrack> trackList = _localStream!.getTracks();
          debugPrint('[media] trackList : ${trackList.length}');

          int index = trackList
              .indexWhere((element) => element.kind == sender.track?.kind);

          debugPrint('[media] index : $index');

          if (index >= 0) {
            MediaStreamTrack track = trackList[index];
            debugPrint('[media] track : $track');

            await sender.replaceTrack(track);
            debugPrint('[media] replace track');
          }
        }
      }
    } catch (e) {
      debugPrint('[webRTC] media error : $e');
    }
  }

  /// [본인] 미디어 off
  Future<void> turnOffMedia() async {
    if (localRenderer!.srcObject != null) {
      localRenderer!.srcObject = null;

      localVideoNotifier.value = false;

      for (MediaStreamTrack track in _localStream!.getTracks()) {
        track.enabled = false;
        await Future.delayed(const Duration(milliseconds: 300));
        await track.stop();
      }

      await _localStream?.dispose();
      _localStream = null;
    }
  }

  /// 연결 종료
  Future<void> close(_) async {
    debugPrint('[webRTC] close peer : $_peer');

    if (webRTCVideoViewContext == null) {
      return;
    }

    super.socketEmit('disconnectPeer', {'to': to});

    // ignore: use_build_context_synchronously
    Navigator.pop(webRTCVideoViewContext!);
    webRTCVideoViewContext = null;

    await _resetElements();
  }

  /// [_peer], [localRenderer], [remoteRenderer] 초기화
  Future<void> _resetElements() async {
    await turnOffMedia();

    _candidateList.clear();

    _peer?.close();
    _peer = null;

    await _initPeer();

    await localRenderer?.dispose();
    await remoteRenderer?.dispose();
    localRenderer = null;
    remoteRenderer = null;

    localRenderer = RTCVideoRenderer();
    remoteRenderer = RTCVideoRenderer();

    await localRenderer!.initialize();
    await remoteRenderer!.initialize();

    localVideoNotifier.value = false;
    remoteVideoNotifier.value = false;

    _isConnected = false;

    await _localStream?.dispose();
    _localStream = null;
  }
}
