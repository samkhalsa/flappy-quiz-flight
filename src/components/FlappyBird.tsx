import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Bird, Pipe, QuestionZone, GameState, Particle, GAME_CONFIG } from '@/types/game';
import { getRandomQuestion } from '@/data/questions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FlappyBird: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  
  const [gameState, setGameState] = useState<GameState>({
    bird: {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT / 2,
      velocity: 0,
      radius: GAME_CONFIG.BIRD_RADIUS,
    },
    pipes: [],
    questionZones: [],
    particles: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    lastPipeTime: 0,
    lastQuestionZoneTime: 0,
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number>(-1);
  const [activeQuestionZone, setActiveQuestionZone] = useState<QuestionZone | null>(null);

  // Game physics and rendering
  const updateGame = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameOver || activeQuestionZone) return;

    setGameState(prev => {
      const newState = { ...prev };
      
      // Update bird physics
      newState.bird.velocity += GAME_CONFIG.GRAVITY;
      newState.bird.y += newState.bird.velocity;

      // Ground collision
      if (newState.bird.y + newState.bird.radius >= GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT) {
        newState.gameOver = false;
        return newState;
      }

      // Ceiling collision
      if (newState.bird.y - newState.bird.radius <= 0) {
        newState.bird.y = newState.bird.radius;
        newState.bird.velocity = 0;
      }

      // Update pipes
      newState.pipes = newState.pipes.map(pipe => ({ ...pipe, x: pipe.x - GAME_CONFIG.PIPE_SPEED }))
        .filter(pipe => pipe.x + pipe.width > -100);

      // Update question zones
      newState.questionZones = newState.questionZones.map(zone => ({ ...zone, x: zone.x - GAME_CONFIG.PIPE_SPEED }))
        .filter(zone => zone.x + zone.width > -100);

      // Update particles
      newState.particles = newState.particles.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 1
      })).filter(particle => particle.life > 0);

      // Spawn pipes
      const currentTime = Date.now();
      if (currentTime - newState.lastPipeTime > GAME_CONFIG.PIPE_SPAWN_INTERVAL) {
        const topHeight = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PIPE_GAP - GAME_CONFIG.GROUND_HEIGHT - 100) + 50;
        newState.pipes.push({
          x: GAME_CONFIG.CANVAS_WIDTH,
          topHeight,
          bottomY: topHeight + GAME_CONFIG.PIPE_GAP,
          width: GAME_CONFIG.PIPE_WIDTH,
          gap: GAME_CONFIG.PIPE_GAP,
          passed: false,
        });
        newState.lastPipeTime = currentTime;
      }

      // Spawn question zones
      if (currentTime - newState.lastQuestionZoneTime > GAME_CONFIG.QUESTION_ZONE_SPAWN_INTERVAL) {
        const categories: ('math' | 'science' | 'language')[] = ['math', 'science', 'language'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const zoneY = Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - 200) + 100;
        
        newState.questionZones.push({
          id: `zone_${currentTime}`,
          x: GAME_CONFIG.CANVAS_WIDTH,
          y: zoneY,
          width: GAME_CONFIG.QUESTION_ZONE_WIDTH,
          height: GAME_CONFIG.QUESTION_ZONE_HEIGHT,
          category,
          question: getRandomQuestion(category),
          visible: true,
          answered: false,
        });
        newState.lastQuestionZoneTime = currentTime;
      }

      // Check pipe collisions and scoring
      newState.pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + pipe.width < newState.bird.x - newState.bird.radius) {
          pipe.passed = true;
          newState.score += 1;
        }

        // Collision detection
        const birdLeft = newState.bird.x - newState.bird.radius;
        const birdRight = newState.bird.x + newState.bird.radius;
        const birdTop = newState.bird.y - newState.bird.radius;
        const birdBottom = newState.bird.y + newState.bird.radius;

        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + pipe.width;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
            newState.gameOver = false;
          }
        }
      });

      // Check question zone collisions
      newState.questionZones.forEach(zone => {
        if (!zone.answered && 
            newState.bird.x + newState.bird.radius > zone.x &&
            newState.bird.x - newState.bird.radius < zone.x + zone.width &&
            newState.bird.y + newState.bird.radius > zone.y &&
            newState.bird.y - newState.bird.radius < zone.y + zone.height) {
          setActiveQuestionZone(zone);
        }
      });

      return newState;
    });
  }, [gameState.gameStarted, gameState.gameOver]);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, 'hsl(198, 100%, 85%)');
    gradient.addColorStop(1, 'hsl(198, 80%, 70%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = 'hsl(120, 30%, 25%)';
    ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.GROUND_HEIGHT, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.GROUND_HEIGHT);

    // Draw pipes
    ctx.fillStyle = 'hsl(120, 60%, 40%)';
    gameState.pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, GAME_CONFIG.CANVAS_HEIGHT - pipe.bottomY);
      
      // Pipe highlights
      ctx.fillStyle = 'hsl(120, 60%, 50%)';
      ctx.fillRect(pipe.x, 0, 8, pipe.topHeight);
      ctx.fillRect(pipe.x, pipe.bottomY, 8, GAME_CONFIG.CANVAS_HEIGHT - pipe.bottomY);
      ctx.fillStyle = 'hsl(120, 60%, 40%)';
    });

    // Draw question zones
    gameState.questionZones.forEach(zone => {
      if (!zone.answered) {
        const colors = {
          math: 'hsl(210, 85%, 65%)',
          science: 'hsl(120, 85%, 60%)',
          language: 'hsl(280, 85%, 70%)'
        };
        
        ctx.fillStyle = colors[zone.category];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.globalAlpha = 1;
        
        // Zone border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        // Category icon
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const icons = { math: '📐', science: '🔬', language: '📚' };
        ctx.fillText(icons[zone.category], zone.x + zone.width/2, zone.y + zone.height/2 + 5);
      }
    });

    // Draw bird
    ctx.fillStyle = 'hsl(45, 98%, 65%)';
    ctx.beginPath();
    ctx.arc(gameState.bird.x, gameState.bird.y, gameState.bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird highlight
    ctx.fillStyle = 'hsl(45, 100%, 80%)';
    ctx.beginPath();
    ctx.arc(gameState.bird.x - 5, gameState.bird.y - 5, gameState.bird.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles
    gameState.particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(gameState.score.toString(), GAME_CONFIG.CANVAS_WIDTH / 2, 60);
    ctx.fillText(gameState.score.toString(), GAME_CONFIG.CANVAS_WIDTH / 2, 60);
  }, [gameState]);

  // Game loop
  useEffect(() => {
    const loop = () => {
      updateGame();
      render();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    if (gameState.gameStarted && !gameState.gameOver) {
      gameLoopRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver, updateGame, render]);

  // Handle bird jump
  const handleJump = useCallback(() => {
    if (gameState.gameOver) {
      // Restart game
      setGameState({
        bird: {
          x: 100,
          y: GAME_CONFIG.CANVAS_HEIGHT / 2,
          velocity: 0,
          radius: GAME_CONFIG.BIRD_RADIUS,
        },
        pipes: [],
        questionZones: [],
        particles: [],
        score: 0,
        gameOver: false,
        gameStarted: true,
        lastPipeTime: Date.now(),
        lastQuestionZoneTime: Date.now() + 3000,
      });
    } else if (gameState.gameStarted) {
      setGameState(prev => ({
        ...prev,
        bird: { ...prev.bird, velocity: GAME_CONFIG.BIRD_JUMP_FORCE }
      }));
    } else {
      setGameState(prev => ({ ...prev, gameStarted: true, lastPipeTime: Date.now(), lastQuestionZoneTime: Date.now() + 3000 }));
    }
  }, [gameState.gameOver, gameState.gameStarted]);

  // Handle question answer
  const handleAnswer = useCallback((answerIndex: number) => {
    if (!activeQuestionZone) return;

    const isCorrect = answerIndex === activeQuestionZone.question.correctAnswer;
    
    if (isCorrect) {
      // Add bonus points
      setGameState(prev => ({ ...prev, score: prev.score + 5 }));
      
      // Create particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 10; i++) {
        newParticles.push({
          x: activeQuestionZone.x + activeQuestionZone.width / 2,
          y: activeQuestionZone.y + activeQuestionZone.height / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 30,
          maxLife: 30,
          color: 'hsl(60, 100%, 80%)',
        });
      }
      
      setGameState(prev => ({
        ...prev,
        particles: [...prev.particles, ...newParticles],
        questionZones: prev.questionZones.map(zone => 
          zone.id === activeQuestionZone.id ? { ...zone, answered: true } : zone
        )
      }));
    } else {
      // Just mark as answered, no penalty
      setGameState(prev => ({
        ...prev,
        questionZones: prev.questionZones.map(zone => 
          zone.id === activeQuestionZone.id ? { ...zone, answered: true } : zone
        )
      }));
    }

    setActiveQuestionZone(null);
    setSelectedAnswer(-1);
  }, [activeQuestionZone]);

  // Event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleClick = () => {
      handleJump();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [handleJump]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-sky p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="border-4 border-white rounded-lg shadow-2xl cursor-pointer"
        />
        
        {!gameState.gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <Card className="p-8 text-center">
              <h1 className="text-4xl font-bold mb-4 text-game-bird">Flappy Bird Quiz</h1>
              <p className="text-lg mb-6">Tap or press Space to fly through question zones for bonus points!</p>
              <Button onClick={handleJump} size="lg" className="animate-pulse">
                Start Game
              </Button>
            </Card>
          </div>
        )}

        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <Card className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 text-destructive">Game Over!</h2>
              <p className="text-xl mb-4">Final Score: <span className="font-bold text-game-bird">{gameState.score}</span></p>
              <Button onClick={handleJump} size="lg">
                Play Again
              </Button>
            </Card>
          </div>
        )}

        {activeQuestionZone && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
            <Card className="p-6 max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <div className={`inline-block px-3 py-1 rounded-full text-white font-bold mb-3 ${
                  activeQuestionZone.category === 'math' ? 'bg-zone-math' :
                  activeQuestionZone.category === 'science' ? 'bg-zone-science' : 'bg-zone-language'
                }`}>
                  {activeQuestionZone.category.toUpperCase()}
                </div>
                <h3 className="text-lg font-bold">{activeQuestionZone.question.text}</h3>
              </div>
              
              <div className="space-y-2">
                {activeQuestionZone.question.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={() => handleAnswer(index)}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-white">
        <p className="text-lg font-semibold mb-2">Score: {gameState.score}</p>
        <p className="text-sm opacity-80">
          Tap screen or press Space to flap • Fly through colored zones for quiz questions!
        </p>
      </div>
    </div>
  );
};

export default FlappyBird;