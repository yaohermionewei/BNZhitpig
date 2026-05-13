import { useMemo, useState } from "react";
import { getDefaultSong } from "./game/songs.js";
import { getStartTheme, setStartTheme, START_THEMES } from "./utils/start-theme.js";
import StageShell from "./screens/StageShell.jsx";
import StartScreen from "./screens/StartScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import { unlockAudioForUserGesture } from "./game/AudioControllerWeb.js";

export default function App() {
  const [screen, setScreen] = useState("start");
  const [startTheme, setThemeState] = useState(() => getStartTheme());
  const [selectedSong, setSelectedSong] = useState(() => getDefaultSong());
  const [resultSummary, setResultSummary] = useState(null);
  const song = selectedSong || getDefaultSong();

  const appState = useMemo(
    () => ({
      startTheme,
      song,
    }),
    [startTheme, song]
  );

  function updateTheme(nextTheme) {
    setThemeState(setStartTheme(nextTheme));
  }

  function handleStart() {
    unlockAudioForUserGesture();
    setScreen("game");
  }

  function handleFinish(summary) {
    setResultSummary(summary);
    setScreen("result");
  }

  function handleReplay() {
    setScreen("game");
  }

  function handleHome() {
    setScreen("start");
  }

  return (
    <StageShell theme={startTheme}>
      {screen === "start" && (
        <StartScreen
          state={appState}
          onThemeToggle={() =>
            updateTheme(startTheme === START_THEMES.dark ? START_THEMES.light : START_THEMES.dark)
          }
          onSelectSong={setSelectedSong}
          onStart={handleStart}
        />
      )}
      {screen === "game" && (
        <GameScreen
          key={`${song.id}-${startTheme}-${resultSummary?.completedAt || 0}`}
          song={song}
          startTheme={startTheme}
          onFinish={handleFinish}
        />
      )}
      {screen === "result" && (
        <ResultScreen
          summary={resultSummary}
          startTheme={startTheme}
          onReplay={handleReplay}
          onHome={handleHome}
        />
      )}
    </StageShell>
  );
}
