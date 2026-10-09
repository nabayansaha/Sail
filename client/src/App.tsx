import { useEffect } from 'react';
import { CreateRoom } from './screens/CreateRoom';
import { GameOver } from './screens/GameOver';
import { GameScreen } from './screens/GameScreen';
import { JoinRoom } from './screens/JoinRoom';
import { Landing } from './screens/Landing';
import { Lobby } from './screens/Lobby';
import { useGameStore } from './store/gameStore';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const bindSocket = useGameStore((s) => s.bindSocket);
  const setScreen = useGameStore((s) => s.setScreen);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const setDisplayName = useGameStore((s) => s.setDisplayName);

  useEffect(() => {
    bindSocket();
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setScreen('join');
      // prefill via join screen — also try auto if name exists
      const name = useGameStore.getState().displayName;
      if (name) joinRoom(room);
    }
  }, [bindSocket, joinRoom, setScreen, setDisplayName]);

  switch (screen) {
    case 'create':
      return <CreateRoom />;
    case 'join':
      return <JoinRoom />;
    case 'lobby':
      return <Lobby />;
    case 'game':
      return <GameScreen />;
    case 'gameover':
      return <GameOver />;
    default:
      return <Landing />;
  }
}
