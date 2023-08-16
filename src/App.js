import logo from './logo.svg';
import './App.css';
import * as Colyseus from "colyseus.js";
import { useState, useEffect } from 'react'
import { Container, Row, Col, Button, Form, Modal, ListGroup } from 'react-bootstrap'

let client = null
let room = null

let matchData = null

const App = () => {
  const [accessToken, setAccessToken] = useState('')
  const [isJoinMatch, setIsJoinMatch] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)
  const [currentMatchData, setCurrentMatchData] = useState(null)

  useEffect(() => {
    matchData = currentMatchData
  }, [currentMatchData])


  const onRoomFindMatch = (data) => {
    console.log('on room find match')
  }
  const onRoomCancelFindMatch = (data) => {
    console.log('on room cancel find match')
  }
  const onRoomJoinMatch = (data) => {
    console.log('on join match: ', data)
  }
  const onJoinMatchFail = (data) => {

  }
  const onMatchCreated = (data) => {
    console.log('match created: ', data)
    const { matchType, players } = data

    setCurrentMatchData({
      ...currentMatchData,
      matchType,
      players: players.map(player => { return { ...player, ready: false } })
    })
  }
  const onClientConfirmMatch = (data) => {
    const { userId, isReady } = data
    console.log(`${userId} ${isReady}, `, matchData)
    const players = matchData.players.map(player => {
      return player.userId == userId ? { ...player, ready: isReady } : player
    })
    setCurrentMatchData({
      ...matchData,
      players: players
    })
  }
  const onRoomError = (code, message) => {
    console.log(`on room error: ${code} : ${message}`)
  }
  const onRoomLeave = (code) => {
    setIsJoinMatch(false)
    setIsFindingMatch(false)
    console.log(`on room leave: ${code}`)
  }
  const onMatchDenied = (data) => {
    const { stopFindingMatch } = data
    setCurrentMatchData(null)
    setIsFindingMatch(!stopFindingMatch)
  }
  const registerRoomEvent = (room) => {
    room.onError(onRoomError)
    room.onLeave(onRoomLeave)

    room.onMessage('find-match', (data) => onRoomFindMatch(data))
    room.onMessage('cancel-find-match', (data) => onRoomCancelFindMatch(data))
    room.onMessage('join-match', (data) => onRoomJoinMatch(data))
    room.onMessage('join-match-fail', (data) => onJoinMatchFail(data))
    room.onMessage('match-created', (data) => onMatchCreated(data))
    room.onMessage('confirm-match', (data) => onClientConfirmMatch(data))
    room.onMessage('match-denied', (data) => onMatchDenied(data))
  }


  const onJoinMatchClick = async (e) => {
    try {
      console.log("connect to room")
      client = new Colyseus.Client('ws://localhost:8000')
      room = await client.joinOrCreate('matchmaking', { accessToken })
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

  const onMatchAccept = (e) => {
    console.log(currentMatchData)
    room.send('confirm-match', true)
  }
  const onCancelMatch = (e) => {
    room.send('confirm-match', false)
  }

  const onTokeChanged = (e) => {
    setAccessToken(e.target.value)
  }

  const FindMatchWindow = ({ isJoinMatch }) => {
    return (
      <Form>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridEmail">
            <Form.Control type="token" placeholder="Access token" onChange={(e) => onTokeChanged(e)} value={accessToken} />
          </Form.Group>
          <Form.Group as={Col} controlId="formGridPassword">
            {
              !isJoinMatch
                ?
                <Button variant="primary" type="button" onClick={(e) => onJoinMatchClick(e)}>
                  Join Match Making
                </Button>
                :
                <Button variant="primary" type="button" onClick={(e) => onFindMatchClick(e)}>
                  {!isFindingMatch ? 'find match' : 'cancel find match'}
                </Button>
            }
          </Form.Group>
        </Row>
      </Form>
    )
  }

  const ShowConfirmMatch = ({ currentMatchData }) => {
    return (
      currentMatchData == null
        ?
        <></>
        :
        <div
          className="modal show"
          style={{ display: 'block', position: 'initial' }}
        >
          <Modal.Dialog>
            <Modal.Header closeButton>
              <Modal.Title>Match Found {currentMatchData.matchType}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <ListGroup horizontal>
                {
                  currentMatchData.players.map(player => (
                    <ListGroup.Item key={player.userId} variant={player.ready ? "primary" : ""}>{player.userId}</ListGroup.Item>
                  ))
                }
              </ListGroup>
            </Modal.Body>

            <Modal.Footer>
              <Button onClick={e => onCancelMatch(e)} variant="secondary">Cancel</Button>
              <Button onClick={e => onMatchAccept(e)} variant="primary">Accept</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </div>
    )
  }

  return (
    <Container style={{ paddingTop: '50px' }}>
      <Row>
        <Col lg='6'>
          <FindMatchWindow isJoinMatch={isJoinMatch} />
        </Col>
      </Row>
      <ShowConfirmMatch currentMatchData={currentMatchData} />
    </Container>

  );
}

export default App;
