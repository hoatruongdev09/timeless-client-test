import logo from './logo.svg';
import './App.css';
import * as Colyseus from "colyseus.js";
import { useState } from 'react'

let client = null
let room = null



const App = () => {
  const [isJoinMatch, setIsJoinMatch] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)

  const onRoomFindMatch = (data) => {
    console.log('on room find match')
  }
  const onRoomCancelFindMatch = (data) => {
    console.log('on room cancel find match')
  }
  const onRoomJoinMatch = (data) => {
    console.log('on join match')
  }
  const onRoomError = (code, message) => {
    console.log(`on room error: ${code} : ${message}`)
  }
  const onRoomLeave = (code) => {
    setIsJoinMatch(false)
    setIsFindingMatch(false)
    console.log(`on room leave: ${code}`)
  }
  const registerRoomEvent = (room) => {
    room.onError(onRoomError)
    room.onLeave(onRoomLeave)

    room.onMessage('find-match', onRoomFindMatch)
    room.onMessage('cancel-find-match', onRoomCancelFindMatch)
    room.onMessage('join-match', onRoomJoinMatch)

  }

  const onJoinMatchClick = async (e) => {
    try {
      console.log("connect to room")
      client = new Colyseus.Client('ws://localhost:8000')
      room = await client.joinOrCreate('matchmaking', { accessToken: 'this is token' })
      if (room != null) {
        console.log("connect to room success")
        registerRoomEvent(room)
        setIsJoinMatch(true);
      }
    } catch (err) {
      console.log(err)
    }
  }
  const onFindMatchClick = (e) => {
    if (!isFindingMatch) {
      const data = {
        findMatchMode: 3,
        userId: 1
      }
      room.send('find-match', data)
    } else {
      room.send('cancel-find-match')
    }
    setIsFindingMatch(!isFindingMatch)
  }

  return (
    <div className="App">
      {!isJoinMatch ?
        <button onClick={(e) => onJoinMatchClick(e)}>JOIN MATCH MAKING</button> :
        <>
          <button onClick={(e) => onFindMatchClick(e)}> {!isFindingMatch ? 'find match' : 'cancel find match'}</button>
        </>
      }

    </div >
  );
}

export default App;
