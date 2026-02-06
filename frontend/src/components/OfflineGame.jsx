import React, { useState, useEffect, useRef } from 'react';
import './OfflineGame.css';

// ✨ CUSTOMIZATION OPTIONS - Change these to personalize your game!
const GAME_CONFIG = {
  // 🎨 Game Characters - Change these emojis!
  PLAYER: '🚀',                    // Try: 🦖 🏃 🚗 🛸 🐱 ⚡ 🎮 🦄 🤖
  GROUND_OBSTACLES: ['🌵', '🔥', '💣', '🧱'],  // Ground level obstacles (random)
  FLYING_OBSTACLES: ['🐦', '🦅', '🦇', '🛸'],  // Flying obstacles (random)
  
  // ⚙️ Game Difficulty Settings
  OBSTACLE_SPAWN_TIME: 1500,       // Lower = More obstacles (try 1000-2000)
  BIRD_SPAWN_TIME: 2500,           // Time between birds (try 2000-4000)
  JUMP_DURATION: 500,              // Jump length in ms
  GAME_SPEED: 3,                   // Obstacle speed (try 2-5)
  
  // 🎯 Difficulty Increase
  SPEED_INCREASE_INTERVAL: 10,    // Increase speed every X points
  MAX_SPEED: 6,                   // Maximum speed limit
};

const OfflineGame = ({ onRetry, isChecking }) => {
  const [score, setScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [birds, setBirds] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(GAME_CONFIG.GAME_SPEED);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('offlineGameHighScore') || '0');
  });

  const playerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const obstacleIntervalRef = useRef(null);
  const birdIntervalRef = useRef(null);

  // Get random obstacle/bird emoji
  const getRandomObstacle = () => {
    const obstacles = GAME_CONFIG.GROUND_OBSTACLES;
    return obstacles[Math.floor(Math.random() * obstacles.length)];
  };

  const getRandomBird = () => {
    const birds = GAME_CONFIG.FLYING_OBSTACLES;
    return birds[Math.floor(Math.random() * birds.length)];
  };

  // Jump handler
  const jump = () => {
    if (!isJumping && !isGameOver && gameStarted) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), GAME_CONFIG.JUMP_DURATION);
    }
  };

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setIsGameOver(false);
    setScore(0);
    setObstacles([]);
    setBirds([]);
    setCurrentSpeed(GAME_CONFIG.GAME_SPEED);
  };

  // Reset game
  const resetGame = () => {
    setIsGameOver(false);
    setScore(0);
    setObstacles([]);
    setBirds([]);
    setGameStarted(false);
    setCurrentSpeed(GAME_CONFIG.GAME_SPEED);
  };

  // Increase difficulty as score increases
  useEffect(() => {
    if (gameStarted && !isGameOver) {
      const newSpeed = Math.min(
        GAME_CONFIG.GAME_SPEED + Math.floor(score / GAME_CONFIG.SPEED_INCREASE_INTERVAL),
        GAME_CONFIG.MAX_SPEED
      );
      setCurrentSpeed(newSpeed);
    }
  }, [score, gameStarted, isGameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    // Spawn ground obstacles
    obstacleIntervalRef.current = setInterval(() => {
      const newObstacle = {
        id: Date.now() + Math.random(),
        position: 100,
        emoji: getRandomObstacle(),
      };
      setObstacles(prev => [...prev, newObstacle]);
    }, GAME_CONFIG.OBSTACLE_SPAWN_TIME);

    // Spawn flying birds
    birdIntervalRef.current = setInterval(() => {
      const newBird = {
        id: Date.now() + Math.random(),
        position: 100,
        emoji: getRandomBird(),
        height: Math.random() > 0.5 ? 120 : 160, // Random flying height
      };
      setBirds(prev => [...prev, newBird]);
    }, GAME_CONFIG.BIRD_SPAWN_TIME);

    // Game loop for movement and collision
    gameLoopRef.current = setInterval(() => {
      // Move ground obstacles
      setObstacles(prev => {
        const updated = prev.map(obs => ({
          ...obs,
          position: obs.position - currentSpeed,
        }));

        // Check collision with ground obstacles
        const player = playerRef.current;
        if (player && !isJumping) {
          updated.forEach(obs => {
            if (obs.position > 5 && obs.position < 15) {
              setIsGameOver(true);
              if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('offlineGameHighScore', score.toString());
              }
            }
          });
        }

        // Remove off-screen obstacles and count score
        return updated.filter(obs => {
          if (obs.position < -10) {
            setScore(s => s + 1);
            return false;
          }
          return true;
        });
      });

      // Move birds
      setBirds(prev => {
        const updated = prev.map(bird => ({
          ...bird,
          position: bird.position - currentSpeed,
        }));

        // Check collision with birds
        const player = playerRef.current;
        if (player && isJumping) {
          const playerRect = player.getBoundingClientRect();
          
          updated.forEach(bird => {
            if (bird.position > 5 && bird.position < 15) {
              // Check if player is at bird's height
              const playerBottom = window.innerHeight - playerRect.bottom;
              if (Math.abs(playerBottom - bird.height) < 60) {
                setIsGameOver(true);
                if (score > highScore) {
                  setHighScore(score);
                  localStorage.setItem('offlineGameHighScore', score.toString());
                }
              }
            }
          });
        }

        // Remove off-screen birds and count score
        return updated.filter(bird => {
          if (bird.position < -10) {
            setScore(s => s + 1);
            return false;
          }
          return true;
        });
      });
    }, 20);

    return () => {
      clearInterval(obstacleIntervalRef.current);
      clearInterval(birdIntervalRef.current);
      clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, isGameOver, isJumping, score, highScore, currentSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameStarted) {
          startGame();
        } else {
          jump();
        }
      }
      if (e.code === 'Enter' && isGameOver) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, isGameOver, isJumping]);

  return (
    <div className="offline-container">
      <div className="offline-header">
        <h1>🔌 Server Offline</h1>
        <p>Unable to connect to the server. Play this game while we try to reconnect!</p>
      </div>

      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Score:</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat">
          <span className="stat-label">High Score:</span>
          <span className="stat-value">{highScore}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Speed:</span>
          <span className="stat-value">x{currentSpeed.toFixed(1)}</span>
        </div>
      </div>

      <div className="game-container" onClick={gameStarted ? jump : startGame}>
        {!gameStarted && !isGameOver && (
          <div className="game-instruction">
            <p>🎮 Click or Press SPACE to Start</p>
            <p className="small">Jump to avoid ground obstacles!</p>
            <p className="small">Duck while jumping to avoid birds! 🐦</p>
          </div>
        )}

        {isGameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Score: {score}</p>
            {score > highScore && <p className="new-high">🎉 New High Score!</p>}
            <p className="small">Speed reached: x{currentSpeed.toFixed(1)}</p>
            <button className="retry-btn" onClick={resetGame}>
              Play Again (Enter)
            </button>
          </div>
        )}

        <div className="game-area">
          <div 
            ref={playerRef}
            className={`player ${isJumping ? 'jumping' : ''}`}
          >
            {GAME_CONFIG.PLAYER}
          </div>

          {/* Ground obstacles */}
          {obstacles.map(obs => (
            <div
              key={obs.id}
              className="obstacle"
              style={{ left: `${obs.position}%` }}
            >
              {obs.emoji}
            </div>
          ))}

          {/* Flying birds */}
          {birds.map(bird => (
            <div
              key={bird.id}
              className="bird"
              style={{ 
                left: `${bird.position}%`,
                bottom: `${bird.height}px`
              }}
            >
              {bird.emoji}
            </div>
          ))}

          <div className="ground"></div>
        </div>
      </div>

      <div className="retry-section">
        <button 
          className="reconnect-btn"
          onClick={onRetry}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <span className="spinner"></span>
              Reconnecting...
            </>
          ) : (
            <>
              🔄 Try to Reconnect
            </>
          )}
        </button>
        <p className="auto-retry-text">
          Auto-reconnecting every 10 seconds...
        </p>
      </div>

      <div className="offline-footer">
        <p>🎯 Tips: Use SPACE or ↑ to jump | Avoid ground obstacles and flying birds!</p>
      </div>
    </div>
  );
};

export default OfflineGame;