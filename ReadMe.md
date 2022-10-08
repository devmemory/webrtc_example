# webRTC
## 정리
1. 사용 프로토콜 : SDP(Session Description Protocol)
2. ICE candidate 네트워크 경로들
3. signaling(p2p 연결 중계)을 위해 socket 혹은 eventsource api(Server sent event) 사용 필요
4. NAT(Network Address Translation) : private/public ip 1:1 대응 후 변환
5. STUN(Session Traversal Uitilities for NAT) server : peer의 private ip를 공인 아이피로 변환 (peer <-> stun)
6. TURN(Travelsal Using Relays around NAT) : peer와 peer의 중간다리 역할 (peer <-> turn <-> peer)
ex) 
STUN
peer1 : STUN한테 물어봤더니 내 아이피 blahblah 래 연결해봐
peer2 : 나도 STUN한테 물어봤더니 blah래 연결하자

TURN
peer1 : TURN이 연결 중계해준대 연결해봐
peer2 : 나도 방금 TURN한테 연결 했어

## 순서
1. [공통] video connection
2. [caller] send offer
3. [caller] iceCandidateEvent
4. [callee] receive offer
5. [callee] remotePeerIceCandidate
6. [callee] remoteStream [audio, video]
7. [callee] send answer
8. [callee] iceCandidateEvent
9. [caller] receive answer
10. [caller] remoteStream [audio, video]
11. [caller] iceCandidateEvent
12. [caller] remotePeerCandidate

## post links
### Intro : https://devmemory.tistory.com/103
### Node : https://devmemory.tistory.com/104
### React : https://devmemory.tistory.com/105
### Flutter : https://devmemory.tistory.com/106