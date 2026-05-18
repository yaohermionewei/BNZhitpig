import { useMemo, useState } from "react";
import StartScreen from "./screens/StartScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import { getDefaultSong } from "./game/songs.js";
import { unlockAudioForUserGesture } from "./game/AudioController.js";

export default function App() {
  const song = useMemo(() => getDefaultSong(), []);
  const [screen, setScreen] = useState("start");
  const [resultSummary, setResultSummary] = useState(null);
  const [runId, setRunId] = useState(0);

  function startRun() {
    unlockAudioForUserGesture();
    setRunId((value) => value + 1);
    setScreen("game");
  }

  function handleFinish(summary) {
    setResultSummary({ ...summary, completedAt: Date.now() });
    setScreen("result");
  }

  function handleHome() {
    setScreen("start");
  }

  return (
    <main className="app-root">
      <section className="stage-shell" aria-label="Bunnies Parkour Web">
        {screen === "start" && <StartScreen song={song} onStart={startRun} />}
        {screen === "game" && (
          <GameScreen
            key={`${song.id}-${runId}`}
            song={song}
            onFinish={handleFinish}
            onHome={handleHome}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            summary={resultSummary}
            onReplay={startRun}
            onHome={handleHome}
          />
        )}
      </section>
    </main>
  );
}
