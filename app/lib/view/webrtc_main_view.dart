import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_rtc/service/webrtc_controller.dart';
import 'package:web_rtc/view/webrtc_view.dart';

class WebRTCMainView extends StatefulWidget {
  const WebRTCMainView({Key? key}) : super(key: key);

  @override
  State<WebRTCMainView> createState() => _WebRTCMainViewState();
}

class _WebRTCMainViewState extends State<WebRTCMainView> {
  final WebRTCController _controller = WebRTCController();

  @override
  void initState() {
    super.initState();
    _controller.initController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ScreenState>(
      valueListenable: _controller.screenNotifier,
      builder: (_, screenState, __) {
        late Widget body;
        switch (screenState) {
          case ScreenState.loading:
            body = const Center(
              child: Text('Loading...'),
            );
            break;
          case ScreenState.initDone:
            body = _initDone();
            break;
          case ScreenState.receivedCalling:
            body = _receivedCalling();
            break;
        }
        return Scaffold(
          appBar: screenState == ScreenState.initDone
              ? AppBar(
            title: const Text('Online User list'),
          )
              : null,
          body: body,
          floatingActionButton: screenState == ScreenState.initDone
              ? FloatingActionButton(
            child: const Icon(Icons.call),
            onPressed: () async {
              await _controller.sendOffer();

              _moveToVideoView();
            },
          )
              : null,
        );
      },
    );
  }

  Widget _initDone() {
    return SafeArea(
      child: ValueListenableBuilder<List<String>>(
        valueListenable: _controller.userListNotifier,
        builder: (_, list, __) {
          return ListView.builder(
            itemCount: list.length,
            itemBuilder: (_, index) {
              String userId = list[index];
              return ListTile(
                leading: Text('${index + 1}'),
                title: Text(
                  userId,
                  style: TextStyle(
                    color: _controller.to == userId ? Colors.red : null,
                  ),
                ),
                onTap: () {
                  setState(() {
                    _controller.to = userId;
                  });
                },
              );
            },
          );
        },
      ),
    );
  }

  Widget _receivedCalling() {
    return Stack(
      fit: StackFit.expand,
      children: [
        ValueListenableBuilder<bool>(
          valueListenable: _controller.localVideoNotifier,
          builder: (_, value, __) {
            return value
                ? RTCVideoView(
              _controller.localRenderer!,
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            )
                : const Center(child: Icon(Icons.person_off));
          },
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.all(30.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                InkWell(
                  onTap: () {
                    _controller.sendAnswer();
                    _moveToVideoView();
                  },
                  child: const CircleAvatar(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    child: Icon(Icons.call),
                  ),
                ),
                InkWell(
                  onTap: () async {
                    await _controller.refuseOffer();
                  },
                  child: const CircleAvatar(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    child: Icon(Icons.close),
                  ),
                ),
              ],
            ),
          ),
        )
      ],
    );
  }

  void _moveToVideoView() {
    // ignore: use_build_context_synchronously
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => WebRTCView(
          controller: _controller,
        ),
      ),
    ).whenComplete(() {
      _controller.screenNotifier.value = ScreenState.initDone;
    });
  }
}
