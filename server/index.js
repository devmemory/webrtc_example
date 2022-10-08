const ip = require('ip')

const express = require('express');
const app = express();

const server = app.listen(9000, ip.address(), () => {
    const address = server.address()
    console.log(`[scoket] on ${address.address}:${address.port}`)
});

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    }
})

let userList = []

io.on('connection', (socket) => {
    const userId = socket.id

    userList = [...userList, userId]

    console.log('[connection] userLogin', { userId })

    // 유저 연결시 데이터 보냄
    // broadcast로 보낼경우 접속시 다른 유저 접속상태를 알 수 없음
    io.emit('updateUserlist', { userList })

    console.log('[connection] userList sent', { userList })

    // offer가 왔을 때 처리
    // 1. [caller] 본인 아이디, 상대 아이디, offer data 전달
    // 2. 상대에게 본인 아이디, offer data 전달
    socket.on('offer', (data) => {
        let { to, from, offerType, offerSDP, audioOnly } = data

        console.log('[offer] data', { to, from, audioOnly })

        socket.to(to).emit('offer', { from, offerSDP, offerType, audioOnly })
    })

    // offer refuse 처리
    socket.on('refuse', (data) => {
        const { to } = data

        console.log('[offer] refuse', { to })
        socket.to(to).emit('refuse')
    })

    // offer 요청에 대한 answer 응답 처리
    // 1. [callee] 상대방 아이디, answer data 전달
    // 2. 상대에게 answer data 전달
    socket.on('answer', (data) => {
        const { to, answerSDP, answerType } = data

        console.log('[answer] data', { to })

        socket.to(to).emit('answer', { answerSDP, answerType })
    })

    // ice candidate
    // send offer/answer 발생시 상대방에게 network정보 전달
    socket.on('iceCandidate', (data) => {
        const { to, candidate, sdpMid, sdpMLineIndex } = data

        console.log('[iceCandidate] data', { to, candidate, sdpMid, sdpMLineIndex })

        socket.to(to).emit('remoteIceCandidate', { candidate, sdpMid, sdpMLineIndex, to })
    })

    // close peer connection
    socket.on('disconnectPeer', (data) => {
        const { to } = data

        console.log('[disconnect] to ', { to })

        if (to !== null) {
            socket.to(to).emit('disconnectPeer')
        }
    })

    // 연결 해제시 userlist update
    socket.on('disconnect', () => {
        userList = userList.filter((user) => user !== userId)

        socket.broadcast.emit('updateUserlist', { userList })

        console.log('[disconnected] id : ', userId)
    })
})