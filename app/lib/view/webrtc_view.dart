import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_rtc/service/webrtc_controller.dart';

class WebRTCView extends StatefulWidget {
  const WebRTCView({Key? key, this.controller}) : super(key: key);

  final WebRTCController? controller;

  @override
  State<WebRTCView> createState() => _WebRTCViewState();
}

class _WebRTCViewState extends State<WebRTCView> {
  late final WebRTCController _controller;
  final ValueNotifier<bool> _btnNotifier = ValueNotifier<bool>(false);

  @override
  void initState() {
    super.initState();
    _controller = widget.controller!;
  }

  @override
  void dispose() {
    _btnNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _controller.webRTCVideoViewContext = context;
    return WillPopScope(
      onWillPop: () async {
        return false;
      },
      child: SafeArea(
        child: Scaffold(
          body: GestureDetector(
            onTap: () {
              _btnNotifier.value = !_btnNotifier.value;
            },
            child: Stack(
              children: [
                _videoWidget(
                    _controller.remoteVideoNotifier, _controller.remoteRenderer!),
                Align(
                  alignment: Alignment.topLeft,
                  child: Container(
                    margin: const EdgeInsets.only(top: 20, left: 20),
                    height: 160,
                    width: 120,
                    child: _videoWidget(
                        _controller.localVideoNotifier, _controller.localRenderer!),
                  ),
                ),
                _btnWidget()
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _btnWidget() {
    return Align(
      alignment: Alignment.bottomCenter,
      child: ValueListenableBuilder<bool>(
        valueListenable: _btnNotifier,
        builder: (_, visible, __) => visible
            ? Padding(
          padding: const EdgeInsets.only(bottom: 30),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              InkWell(
                onTap: () async {
                  if (_controller.localVideoNotifier.value) {
                    await _controller.turnOffMedia();
                  } else {
                    await _controller.turnOnMedia();
                  }
                },
                child: ValueListenableBuilder<bool>(
                  valueListenable: _controller.localVideoNotifier,
                  builder: (_, camOn, __) {
                    return camOn
                        ? const CircleAvatar(
                      backgroundColor: Colors.yellow,
                      foregroundColor: Colors.white,
                      child: Icon(Icons.videocam_off),
                    )
                        : const CircleAvatar(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      child: Icon(Icons.videocam),
                    );
                  },
                ),
              ),
              InkWell(
                onTap: () async {
                  await _controller.close(null);
                },
                child: const CircleAvatar(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  child: Icon(Icons.close),
                ),
              ),
            ],
          ),
        )
            : const SizedBox(),
      ),
    );
  }

  Widget _videoWidget(ValueNotifier<bool> listener, RTCVideoRenderer renderer) {
    return ValueListenableBuilder<bool>(
      valueListenable: listener,
      builder: (_, value, __) {
        return value
            ? RTCVideoView(
          renderer,
          objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
        )
            : const Center(
          child: Icon(Icons.person_off),
        );
      },
    );
  }
}
