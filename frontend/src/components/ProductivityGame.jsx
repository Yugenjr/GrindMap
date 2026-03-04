import React, { useState, useEffect } from 'react';
import './ProductivityGame.css';

const ProductivityGame = () => {
  const [gameState, setGameState] = useState({
    currentStreak: 0,
    totalPoints: 0,
    level: 1,
    dailyTasks: [],
    completedTasks: [],
    achievements: [],
    lastPlayed: null
  });

  const [currentTask, setCurrentTask] = useState(null);
  const [showAchievement, setShowAchievement] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Daily productivity tasks
  const taskTemplates = [
    { id: 'focus-25', title: '25-Minute Focus Session', description: 'Complete a focused work session', points: 10, type: 'timer' },
    { id: 'task-complete', title: 'Complete 3 Tasks', description: 'Mark 3 tasks as completed', points: 15, type: 'counter' },
    { id: 'break-time', title: 'Take a 5-Minute Break', description: 'Step away and recharge', points: 5, type: 'break' },
    { id: 'goal-review', title: 'Review Weekly Goals', description: 'Check progress on your weekly objectives', points: 20, type: 'review' },
    { id: 'mindful-minute', title: 'Mindful Minute', description: 'Take 60 seconds to breathe and center yourself', points: 8, type: 'mindfulness' },
    { id: 'learning-time', title: 'Learn Something New', description: 'Spend 15 minutes learning a new skill', points: 12, type: 'learning' }
  ];

  // Achievements
  const achievements = [
    { id: 'first-win', title: 'First Victory', description: 'Complete your first daily challenge', icon: '🏆', unlocked: false },
    { id: 'streak-3', title: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥', unlocked: false },
    { id: 'streak-7', title: 'Week Warrior', description: '7-day productivity streak', icon: '⚡', unlocked: false },
    { id: 'points-100', title: 'Century Club', description: 'Earn 100 total points', icon: '💯', unlocked: false },
    { id: 'level-5', title: 'Productivity Pro', description: 'Reach level 5', icon: '⭐', unlocked: false }
  ];

  useEffect(() => {
    loadGameState();
    generateDailyTasks();
  }, []);

  const loadGameState = () => {
    const saved = localStorage.getItem('productivityGame');
    if (saved) {
      setGameState(JSON.parse(saved));
    }
  };

  const saveGameState = (newState) => {
    localStorage.setItem('productivityGame', JSON.stringify(newState));
    setGameState(newState);
  };

  const generateDailyTasks = () => {
    const today = new Date().toDateString();
    const lastGenerated = localStorage.getItem('lastTaskGeneration');

    if (lastGenerated !== today) {
      // Generate 3 random tasks for today
      const shuffled = [...taskTemplates].sort(() => 0.5 - Math.random());
      const dailyTasks = shuffled.slice(0, 3);

      setGameState(prev => ({
        ...prev,
        dailyTasks,
        completedTasks: [],
        lastPlayed: today
      }));

      localStorage.setItem('lastTaskGeneration', today);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    if (gameState.dailyTasks.length === 0) {
      generateDailyTasks();
    }
    setCurrentTask(gameState.dailyTasks[0]);
  };

  const completeTask = (taskId) => {
    const task = gameState.dailyTasks.find(t => t.id === taskId);
    if (!task) return;

    const newState = {
      ...gameState,
      totalPoints: gameState.totalPoints + task.points,
      completedTasks: [...gameState.completedTasks, taskId],
      currentStreak: gameState.currentStreak + 1,
      level: Math.floor((gameState.totalPoints + task.points) / 50) + 1
    };

    // Check for achievements
    const newAchievements = checkAchievements(newState);
    if (newAchievements.length > 0) {
      newState.achievements = [...gameState.achievements, ...newAchievements];
      setShowAchievement(newAchievements[0]);
      setTimeout(() => setShowAchievement(null), 3000);
    }

    saveGameState(newState);

    // Move to next task or end game
    const remainingTasks = gameState.dailyTasks.filter(t => !newState.completedTasks.includes(t.id));
    if (remainingTasks.length > 0) {
      setCurrentTask(remainingTasks[0]);
    } else {
      setIsPlaying(false);
      setCurrentTask(null);
    }
  };

  const checkAchievements = (state) => {
    const newAchievements = [];

    if (state.totalPoints >= 100 && !state.achievements.includes('points-100')) {
      newAchievements.push('points-100');
    }

    if (state.currentStreak >= 3 && !state.achievements.includes('streak-3')) {
      newAchievements.push('streak-3');
    }

    if (state.currentStreak >= 7 && !state.achievements.includes('streak-7')) {
      newAchievements.push('streak-7');
    }

    if (state.level >= 5 && !state.achievements.includes('level-5')) {
      newAchievements.push('level-5');
    }

    if (state.completedTasks.length > 0 && !state.achievements.includes('first-win')) {
      newAchievements.push('first-win');
    }

    return newAchievements;
  };

  const resetGame = () => {
    const newState = {
      currentStreak: 0,
      totalPoints: 0,
      level: 1,
      dailyTasks: [],
      completedTasks: [],
      achievements: [],
      lastPlayed: null
    };
    saveGameState(newState);
    setIsPlaying(false);
    setCurrentTask(null);
    localStorage.removeItem('lastTaskGeneration');
    generateDailyTasks();
  };

  if (!isPlaying) {
    return (
      <div className="productivity-game">
        <div className="game-header">
          <h1>🎯 Daily Grind Challenge</h1>
          <p>Level up your productivity one day at a time!</p>
        </div>

        <div className="game-stats">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <div className="stat-value">{gameState.currentStreak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-value">{gameState.level}</div>
              <div className="stat-label">Level</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-info">
              <div className="stat-value">{gameState.totalPoints}</div>
              <div className="stat-label">Total Points</div>
            </div>
          </div>
        </div>

        <div className="achievements-preview">
          <h3>🏆 Achievements Unlocked ({gameState.achievements.length})</h3>
          <div className="achievement-grid">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`achievement-item ${gameState.achievements.includes(achievement.id) ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-title">{achievement.title}</div>
                  <div className="achievement-desc">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="game-actions">
          <button className="start-game-btn" onClick={startGame}>
            🎮 Start Today's Challenge
          </button>
          <button className="reset-game-btn" onClick={resetGame}>
            🔄 Reset Progress
          </button>
        </div>

        {showAchievement && (
          <div className="achievement-popup">
            <div className="achievement-content">
              <div className="achievement-icon-large">
                {achievements.find(a => a.id === showAchievement)?.icon}
              </div>
              <h3>Achievement Unlocked!</h3>
              <p>{achievements.find(a => a.id === showAchievement)?.title}</p>
              <small>{achievements.find(a => a.id === showAchievement)?.description}</small>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="productivity-game playing">
      <div className="game-header">
        <h1>🎯 Daily Challenge</h1>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(gameState.completedTasks.length / gameState.dailyTasks.length) * 100}%` }}
          ></div>
        </div>
        <p>Task {gameState.completedTasks.length + 1} of {gameState.dailyTasks.length}</p>
      </div>

      {currentTask && (
        <div className="current-task">
          <div className="task-card">
            <div className="task-icon">
              {currentTask.type === 'timer' && '⏱️'}
              {currentTask.type === 'counter' && '📊'}
              {currentTask.type === 'break' && '☕'}
              {currentTask.type === 'review' && '📝'}
              {currentTask.type === 'mindfulness' && '🧘'}
              {currentTask.type === 'learning' && '📚'}
            </div>
            <div className="task-content">
              <h3>{currentTask.title}</h3>
              <p>{currentTask.description}</p>
              <div className="task-points">+{currentTask.points} points</div>
            </div>
          </div>

          <div className="task-actions">
            <button
              className="complete-task-btn"
              onClick={() => completeTask(currentTask.id)}
            >
              ✅ Complete Task
            </button>
            <button
              className="skip-task-btn"
              onClick={() => {
                const remainingTasks = gameState.dailyTasks.filter(t => !gameState.completedTasks.includes(t.id) && t.id !== currentTask.id);
                setCurrentTask(remainingTasks[0] || null);
                if (!remainingTasks[0]) setIsPlaying(false);
              }}
            >
              ⏭️ Skip for Now
            </button>
          </div>
        </div>
      )}

      <div className="game-footer">
        <button className="quit-game-btn" onClick={() => setIsPlaying(false)}>
          🏠 Return to Menu
        </button>
      </div>
    </div>
  );
};

export default ProductivityGame;