import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameState, Pipe, QuestionZone, Question } from '@/types/game';
import { QUESTIONS } from '@/data/questions';

const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GROUND_HEIGHT = 120;

const FlappyBird = () => {
  const [birdPosition, setBirdPosition] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [questionZones, setQuestionZones] = useState<QuestionZone[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    gameOver: false,
    score: 0,
    bonusScore: 0,
  });
  const [activeQuestionZone, setActiveQuestionZone] = useState<QuestionZone | null>(null);
  const [particles, setParticles] = useState<Array<{x: number, y: number, id: number}>>([]);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const pipeSpawnRef = useRef<NodeJS.Timeout>();
  const questionSpawnRef = useRef<NodeJS.Timeout>();

  // Game physics and rendering
  const updateGame = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameOver || activeQuestionZone) return;

    setBirdPosition((prev) => {
      const newY = prev + birdVelocity;
      if (newY > GAME_HEIGHT - GROUND_HEIGHT - BIRD_SIZE || newY < 0) {
        setGameState(gs => ({ ...gs, gameOver: true }));
        return prev;
      }
      return newY;
    });

    setBirdVelocity(prev => prev + GRAVITY);

    // Move pipes
    setPipes(prev => prev.map(pipe => ({
      ...pipe,
      x: pipe.x - 3
    })).filter(pipe => pipe.x > -PIPE_WIDTH));

    // Move question zones
    setQuestionZones(prev => prev.map(zone => ({
      ...zone,
      x: zone.x - 3
    })).filter(zone => zone.x > -200));

    // Update particles
    setParticles(prev => prev.filter(particle => Date.now() - particle.id < 1000));

  }, [birdVelocity, gameState.gameStarted, gameState.gameOver, activeQuestionZone]);

  // Collision detection
  const checkCollisions = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameOver || activeQuestionZone) return;

    const birdRect = {
      x: GAME_WIDTH / 2 - BIRD_SIZE / 2,
      y: birdPosition,
      width: BIRD_SIZE,
      height: BIRD_SIZE
    };

    // Check pipe collisions
    for (const pipe of pipes) {
      if (
        birdRect.x < pipe.x + PIPE_WIDTH &&
        birdRect.x + birdRect.width > pipe.x &&
        (birdRect.y < pipe.topHeight || birdRect.y + birdRect.height > pipe.topHeight + PIPE_GAP)
      ) {
        setGameState(gs => ({ ...gs, gameOver: true }));
        return;
      }

      // Check scoring
      if (!pipe.scored && pipe.x + PIPE_WIDTH < birdRect.x) {
        pipe.scored = true;
        setGameState(gs => ({ ...gs, score: gs.score + 1 }));
      }
    }

    // Check question zone collisions
    for (const zone of questionZones) {
      if (
        !zone.triggered &&
        birdRect.x < zone.x + zone.width &&
        birdRect.x + birdRect.width > zone.x &&
        birdRect.y < zone.y + zone.height &&
        birdRect.y + birdRect.height > zone.y
      ) {
        zone.triggered = true;
        setActiveQuestionZone(zone);
        return;
      }
    }
  }, [birdPosition, pipes, questionZones, gameState.gameStarted, gameState.gameOver, activeQuestionZone]);

  // Spawn pipes
  const spawnPipe = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const topHeight = Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100) + 50;
    const newPipe: Pipe = {
      x: GAME_WIDTH,
      topHeight,
      scored: false,
    };
    setPipes(prev => [...prev, newPipe]);
  }, [gameState.gameStarted, gameState.gameOver]);

  // Spawn question zones
  const spawnQuestionZone = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const categories = ['math', 'science', 'language'] as const;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryQuestions = QUESTIONS[category];
    const question = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];

    const newZone: QuestionZone = {
      x: GAME_WIDTH,
      y: Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 150) + 50,
      width: 200,
      height: 100,
      category,
      question,
      triggered: false,
    };
    setQuestionZones(prev => [...prev, newZone]);
  }, [gameState.gameStarted, gameState.gameOver]);

  // Handle question answer
  const handleAnswer = (answerIndex: number) => {
    if (!activeQuestionZone) return;

    const isCorrect = answerIndex === activeQuestionZone.question.correctAnswer;
    
    if (isCorrect) {
      setGameState(gs => ({ 
        ...gs, 
        bonusScore: gs.bonusScore + 5,
        score: gs.score + 5 
      }));
      
      // Add particles
      const newParticles = Array.from({ length: 10 }, (_, i) => ({
        x: GAME_WIDTH / 2 + (Math.random() - 0.5) * 100,
        y: birdPosition + (Math.random() - 0.5) * 50,
        id: Date.now() + i
      }));
      setParticles(prev => [...prev, ...newParticles]);
    }

    setActiveQuestionZone(null);
  };

  // Game controls
  const jump = useCallback(() => {
    if (gameState.gameOver) return;
    
    if (!gameState.gameStarted) {
      setGameState(gs => ({ ...gs, gameStarted: true }));
    }
    
    if (!activeQuestionZone) {
      setBirdVelocity(JUMP_STRENGTH);
    }
  }, [gameState.gameStarted, gameState.gameOver, activeQuestionZone]);

  const resetGame = () => {
    setBirdPosition(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setQuestionZones([]);
    setGameState({ gameStarted: false, gameOver: false, score: 0, bonusScore: 0 });
    setActiveQuestionZone(null);
    setParticles([]);
  };

  // Game loops
  useEffect(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = setInterval(updateGame, 16);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [updateGame]);

  useEffect(() => {
    if (pipeSpawnRef.current) clearInterval(pipeSpawnRef.current);
    pipeSpawnRef.current = setInterval(spawnPipe, 2000);
    return () => {
      if (pipeSpawnRef.current) clearInterval(pipeSpawnRef.current);
    };
  }, [spawnPipe]);

  useEffect(() => {
    if (questionSpawnRef.current) clearInterval(questionSpawnRef.current);
    questionSpawnRef.current = setInterval(spawnQuestionZone, 8000);
    return () => {
      if (questionSpawnRef.current) clearInterval(questionSpawnRef.current);
    };
  }, [spawnQuestionZone]);

  useEffect(() => {
    checkCollisions();
  }, [checkCollisions]);

  // Event listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => jump();
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleTouch);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [jump]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'math': return 'from-blue-400 to-blue-600';
      case 'science': return 'from-green-400 to-green-600';
      case 'language': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'math': return '🔢';
      case 'science': return '🔬';
      case 'language': return '📚';
      default: return '❓';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-light to-sky-main p-4">
      <div 
        className="relative overflow-hidden border-4 border-retro-border shadow-glow"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Sky background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-light to-sky-main" />
        
        {/* Clouds */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-16 h-8 bg-white/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 150}px`,
                top: `${50 + i * 30}px`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Pipes */}
        {pipes.map((pipe, index) => (
          <div key={index}>
            {/* Top pipe */}
            <div
              className="absolute bg-gradient-to-r from-pipe-light to-pipe-dark border-2 border-retro-border"
              style={{
                left: pipe.x,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.topHeight,
              }}
            />
            {/* Bottom pipe */}
            <div
              className="absolute bg-gradient-to-r from-pipe-light to-pipe-dark border-2 border-retro-border"
              style={{
                left: pipe.x,
                top: pipe.topHeight + PIPE_GAP,
                width: PIPE_WIDTH,
                height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT,
              }}
            />
          </div>
        ))}

        {/* Question Zones */}
        {questionZones.map((zone, index) => (
          <div
            key={index}
            className={`absolute bg-gradient-to-r ${getCategoryColor(zone.category)} opacity-80 border-2 border-white/50 rounded-lg flex items-center justify-center animate-pulse-soft`}
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height,
            }}
          >
            <div className="text-white text-center">
              <div className="text-2xl mb-1">{getCategoryIcon(zone.category)}</div>
              <div className="text-xs font-bold uppercase tracking-wide">
                {zone.category}
              </div>
            </div>
          </div>
        ))}

        {/* Bird */}
        <div
          className="absolute w-8 h-8 bg-gradient-to-r from-bird-light to-bird-main border-2 border-retro-border rounded-full shadow-md transition-transform duration-75"
          style={{
            left: GAME_WIDTH / 2 - BIRD_SIZE / 2,
            top: birdPosition,
            transform: `rotate(${Math.min(Math.max(birdVelocity * 3, -30), 30)}deg)`,
          }}
        >
          <div className="absolute inset-2 bg-white/30 rounded-full" />
        </div>

        {/* Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-accent rounded-full animate-sparkle"
            style={{ left: particle.x, top: particle.y }}
          />
        ))}

        {/* Ground */}
        <div
          className="absolute bottom-0 w-full bg-gradient-to-r from-ground-light to-ground-dark border-t-4 border-retro-border"
          style={{ height: GROUND_HEIGHT }}
        >
          <div className="h-full bg-repeat-x" />
        </div>

        {/* Score */}
        <div className="absolute top-4 left-4 z-20">
          <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
            Score: {gameState.score}
          </Badge>
          {gameState.bonusScore > 0 && (
            <Badge variant="default" className="ml-2 text-lg font-bold px-4 py-2 bg-accent">
              Bonus: +{gameState.bonusScore}
            </Badge>
          )}
        </div>

        {/* Game Over Screen */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <Card className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
              <p className="mb-2">Final Score: {gameState.score}</p>
              {gameState.bonusScore > 0 && (
                <p className="mb-4 text-accent font-bold">Bonus Points: +{gameState.bonusScore}</p>
              )}
              <Button onClick={resetGame} className="w-full">
                Play Again
              </Button>
            </Card>
          </div>
        )}

        {/* Start Screen */}
        {!gameState.gameStarted && !gameState.gameOver && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
            <Card className="p-6 text-center max-w-md">
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Flappy Bird Quiz
              </h1>
              <p className="mb-4">
                Fly through colored zones to answer questions and earn bonus points!
              </p>
              <div className="flex justify-center space-x-4 mb-4 text-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded mx-auto mb-1" />
                  <span>Math</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded mx-auto mb-1" />
                  <span>Science</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded mx-auto mb-1" />
                  <span>Language</span>
                </div>
              </div>
              <p className="text-sm mb-4">
                Click, tap, or press spacebar to flap your wings!
              </p>
              <Button onClick={jump} className="w-full">
                Start Game
              </Button>
            </Card>
          </div>
        )}

        {/* Question Modal */}
        {activeQuestionZone && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
            <Card className="p-6 max-w-md w-full mx-4">
              <div className="text-center mb-4">
                <Badge 
                  variant="secondary" 
                  className={`mb-2 bg-gradient-to-r ${getCategoryColor(activeQuestionZone.category)} text-white`}
                >
                  {getCategoryIcon(activeQuestionZone.category)} {activeQuestionZone.category.toUpperCase()}
                </Badge>
                <h3 className="text-lg font-bold">
                  {activeQuestionZone.question.text}
                </h3>
              </div>
              <div className="space-y-2">
                {activeQuestionZone.question.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAnswer(index)}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Correct answer = +5 points • No penalty for wrong answers
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlappyBird;