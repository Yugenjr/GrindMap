import React, { useState, useEffect } from 'react';
import styles from './GoalSetting.module.css';

const GoalSetting = ({ goal, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: '',
    targetUnit: 'problems',
    category: 'problems',
    targetDate: '',
    priority: 'medium',
    reminderFrequency: 'weekly'
  });
  const [templates, setTemplates] = useState([]);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.customTitle || goal.goal?.title || '',
        description: goal.customDescription || goal.goal?.description || '',
        targetValue: goal.customTargetValue || goal.goal?.targetValue || '',
        targetUnit: goal.customTargetUnit || goal.goal?.targetUnit || 'problems',
        category: goal.customCategory || goal.goal?.category || 'problems',
        targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
        priority: goal.priority || 'medium',
        reminderFrequency: goal.reminderFrequency || 'weekly'
      });
    }
    fetchTemplates();
  }, [goal]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/goals/templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setFormData({
        title: template.title,
        description: template.description,
        targetValue: template.targetValue,
        targetUnit: template.targetUnit,
        category: template.category,
        targetDate: new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        reminderFrequency: 'weekly'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = goal ? `http://localhost:5001/api/goals/${goal._id}` : 'http://localhost:5001/api/goals/custom';
      const method = goal ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        targetValue: parseInt(formData.targetValue),
        targetDate: formData.targetDate ? new Date(formData.targetDate) : null
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSave();
      } else {
        console.error('Failed to save goal');
      }
    } catch (err) {
      console.error('Error saving goal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.goalSetting}>
      <div className={styles.header}>
        <h2>{goal ? 'Edit Goal' : 'Create New Goal'}</h2>
        <button onClick={onCancel} className={styles.closeBtn}>×</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {!goal && (
          <div className={styles.templateSection}>
            <label>
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
              />
              Use goal template
            </label>

            {useTemplate && (
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  handleTemplateSelect(e.target.value);
                }}
                className={styles.select}
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.title} ({template.targetValue} {template.targetUnit})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className={styles.formGroup}>
          <label>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className={styles.textarea}
            rows="3"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Target Value *</label>
            <input
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
              required
              min="1"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Unit *</label>
            <select
              value={formData.targetUnit}
              onChange={(e) => setFormData({...formData, targetUnit: e.target.value})}
              className={styles.select}
            >
              <option value="problems">Problems</option>
              <option value="rating">Rating</option>
              <option value="days">Days</option>
              <option value="minutes">Minutes</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className={styles.select}
            >
              <option value="problems">Problems</option>
              <option value="rating">Rating</option>
              <option value="streak">Streak</option>
              <option value="time">Time</option>
              <option value="consistency">Consistency</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Target Date</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Reminders</label>
            <select
              value={formData.reminderFrequency}
              onChange={(e) => setFormData({...formData, reminderFrequency: e.target.value})}
              className={styles.select}
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={styles.saveBtn}>
            {loading ? 'Saving...' : 'Save Goal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalSetting;
