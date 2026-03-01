import React, { useState, useEffect } from 'react';
import styles from './GoalList.module.css';

const GoalList = ({ onEditGoal, onCreateGoal }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        setError('Failed to fetch goals');
      }
    } catch (err) {
      setError('Error fetching goals');
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (goalId, newValue) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/goals/${goalId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newValue }),
      });
      if (response.ok) {
        fetchGoals(); // Refresh goals
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  if (loading) return <div className={styles.loading}>Loading goals...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.goalList}>
      <div className={styles.header}>
        <h2>Your Goals</h2>
        <button onClick={onCreateGoal} className={styles.createBtn}>+ New Goal</button>
      </div>

      {goals.length === 0 ? (
        <div className={styles.empty}>
          <p>No goals set yet. Create your first goal to start tracking progress!</p>
        </div>
      ) : (
        <div className={styles.goalsGrid}>
          {goals.map((goal) => (
            <div key={goal._id} className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <h3>{goal.goal?.title || goal.customTitle}</h3>
                <span className={`${styles.status} ${styles[goal.status]}`}>
                  {goal.status}
                </span>
              </div>

              <p className={styles.description}>
                {goal.goal?.description || goal.customDescription}
              </p>

              <div className={styles.progress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${goal.progressPercentage}%` }}
                  ></div>
                </div>
                <span className={styles.progressText}>
                  {goal.currentValue} / {goal.customTargetValue || goal.goal?.targetValue} {goal.customTargetUnit || goal.goal?.targetUnit}
                </span>
              </div>

              <div className={styles.goalActions}>
                <button
                  onClick={() => updateGoalProgress(goal._id, goal.currentValue + 1)}
                  className={styles.incrementBtn}
                >
                  +1
                </button>
                <button onClick={() => onEditGoal(goal)} className={styles.editBtn}>
                  Edit
                </button>
              </div>

              {goal.targetDate && (
                <div className={styles.deadline}>
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalList;
