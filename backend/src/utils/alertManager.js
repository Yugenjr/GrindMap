import MetricsCollector from './metricsCollector.js';
import HealthMonitor from './healthMonitor.js';
import Logger from './logger.js';

class AlertManager {
  constructor() {
    this.rules = new Map();
    this.alerts = new Map();
    this.channels = new Map();
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    this.setupDefaultRules();
    this.setupDefaultChannels();
  }

  // Add alert rule
  addRule(name, config) {
    const rule = {
      name,
      metric: config.metric,
      condition: config.condition, // 'gt', 'lt', 'eq'
      threshold: config.threshold,
      duration: config.duration || 60000, // 1 minute
      severity: config.severity || 'warning', // 'info', 'warning', 'critical'
      description: config.description,
      channels: config.channels || ['log'],
      enabled: config.enabled !== false,
      lastTriggered: null,
      triggerCount: 0,
      cooldown: config.cooldown || 300000 // 5 minutes
    };
    
    this.rules.set(name, rule);
    Logger.info('Alert rule added', { name, metric: rule.metric });
  }

  // Add notification channel
  addChannel(name, config) {
    this.channels.set(name, {
      name,
      type: config.type, // 'log', 'webhook', 'email'
      config: config.config,
      enabled: config.enabled !== false
    });
  }

  setupDefaultRules() {
    // High memory usage
    this.addRule('high_memory_usage', {
      metric: 'system.memory.heap_used',
      condition: 'gt',
      threshold: 500 * 1024 * 1024, // 500MB
      severity: 'warning',
      description: 'Memory usage is high',
      channels: ['log', 'webhook']
    });

    // High error rate
    this.addRule('high_error_rate', {
      metric: 'http.requests.errors',
      condition: 'gt',
      threshold: 10,
      duration: 300000, // 5 minutes
      severity: 'critical',
      description: 'HTTP error rate is high',
      channels: ['log', 'webhook']
    });

    // Event loop lag
    this.addRule('event_loop_lag', {
      metric: 'system.event_loop.lag',
      condition: 'gt',
      threshold: 100, // 100ms
      severity: 'warning',
      description: 'Event loop lag detected',
      channels: ['log']
    });

    // Database connection issues
    this.addRule('database_unhealthy', {
      metric: 'health.database.status',
      condition: 'eq',
      threshold: 'unhealthy',
      severity: 'critical',
      description: 'Database connection is unhealthy',
      channels: ['log', 'webhook']
    });

    // Job queue backlog
    this.addRule('job_queue_backlog', {
      metric: 'jobs.pending',
      condition: 'gt',
      threshold: 100,
      severity: 'warning',
      description: 'Job queue has high backlog',
      channels: ['log']
    });

    // High response time
    this.addRule('high_response_time', {
      metric: 'http.request.duration.p95',
      condition: 'gt',
      threshold: 5000, // 5 seconds
      severity: 'warning',
      description: '95th percentile response time is high',
      channels: ['log']
    });
  }

  setupDefaultChannels() {
    // Log channel
    this.addChannel('log', {
      type: 'log',
      config: {
        level: 'warn'
      }
    });

    // Webhook channel (for Slack, Discord, etc.)
    this.addChannel('webhook', {
      type: 'webhook',
      config: {
        url: process.env.ALERT_WEBHOOK_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    // Email channel (placeholder)
    this.addChannel('email', {
      type: 'email',
      config: {
        smtp: process.env.SMTP_URL,
        from: process.env.ALERT_EMAIL_FROM,
        to: process.env.ALERT_EMAIL_TO
      },
      enabled: false // Disabled by default
    });
  }

  startMonitoring(interval = 60000) {
    if (this.isMonitoring) {
      Logger.warn('Alert monitoring already started');
      return;
    }

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.checkAlerts();
    }, interval);

    Logger.info('Alert monitoring started', { interval, rules: this.rules.size });
  }

  stopMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    Logger.info('Alert monitoring stopped');
  }

  async checkAlerts() {
    const metrics = MetricsCollector.getMetrics();
    const health = HealthMonitor.getDetailedHealth();
    
    for (const [name, rule] of this.rules) {
      if (!rule.enabled) continue;
      
      try {
        const shouldTrigger = await this.evaluateRule(rule, metrics, health);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule, metrics, health);
        }
      } catch (error) {
        Logger.error('Alert rule evaluation failed', {
          rule: name,
          error: error.message
        });
      }
    }
  }

  async evaluateRule(rule, metrics, health) {
    const now = Date.now();
    
    // Check cooldown
    if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
      return false;
    }

    let value = this.getMetricValue(rule.metric, metrics, health);
    
    if (value === null || value === undefined) {
      return false;
    }

    // Evaluate condition
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      case 'gte':
        return value >= rule.threshold;
      case 'lte':
        return value <= rule.threshold;
      default:
        return false;
    }
  }

  getMetricValue(metricPath, metrics, health) {
    // Handle health metrics
    if (metricPath.startsWith('health.')) {
      const path = metricPath.replace('health.', '');
      return this.getNestedValue(health, path);
    }
    
    // Handle regular metrics
    const parts = metricPath.split('.');
    const type = parts[0]; // counters, gauges, histograms
    const name = parts.slice(1).join('.');
    
    if (metrics[type] && metrics[type][name] !== undefined) {
      return metrics[type][name];
    }
    
    return null;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  async triggerAlert(rule, metrics, health) {
    const now = Date.now();
    const alertId = `${rule.name}_${now}`;
    
    const alert = {
      id: alertId,
      rule: rule.name,
      severity: rule.severity,
      description: rule.description,
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue: this.getMetricValue(rule.metric, metrics, health),
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    rule.lastTriggered = now;
    rule.triggerCount++;

    Logger.warn('Alert triggered', {
      rule: rule.name,
      severity: rule.severity,
      description: rule.description,
      currentValue: alert.currentValue,
      threshold: rule.threshold
    });

    // Send notifications
    for (const channelName of rule.channels) {
      try {
        await this.sendNotification(channelName, alert);
      } catch (error) {
        Logger.error('Alert notification failed', {
          channel: channelName,
          alert: alertId,
          error: error.message
        });
      }
    }

    return alert;
  }

  async sendNotification(channelName, alert) {
    const channel = this.channels.get(channelName);
    if (!channel || !channel.enabled) {
      return;
    }

    switch (channel.type) {
      case 'log':
        Logger.warn('ALERT', {
          severity: alert.severity,
          rule: alert.rule,
          description: alert.description,
          value: alert.currentValue,
          threshold: alert.threshold
        });
        break;

      case 'webhook':
        if (channel.config.url) {
          await this.sendWebhook(channel.config, alert);
        }
        break;

      case 'email':
        if (channel.config.smtp) {
          await this.sendEmail(channel.config, alert);
        }
        break;

      default:
        Logger.warn('Unknown alert channel type', { type: channel.type });
    }
  }

  async sendWebhook(config, alert) {
    try {
      const payload = {
        text: `🚨 Alert: ${alert.description}`,
        attachments: [{
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Rule', value: alert.rule, short: true },
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Current Value', value: alert.currentValue, short: true },
            { title: 'Threshold', value: alert.threshold, short: true },
            { title: 'Time', value: alert.timestamp, short: false }
          ]
        }]
      };

      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: config.headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      Logger.error('Webhook notification failed', { error: error.message });
    }
  }

  async sendEmail(config, alert) {
    // Email implementation would go here
    Logger.info('Email alert (not implemented)', { alert: alert.id });
  }

  getSeverityColor(severity) {
    const colors = {
      info: '#36a64f',
      warning: '#ff9500',
      critical: '#ff0000'
    };
    return colors[severity] || '#808080';
  }

  // Get active alerts
  getActiveAlerts() {
    const active = [];
    for (const alert of this.alerts.values()) {
      if (!alert.resolved) {
        active.push(alert);
      }
    }
    return active.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get alert statistics
  getAlertStats() {
    const stats = {
      total: this.alerts.size,
      active: 0,
      resolved: 0,
      bySeverity: { info: 0, warning: 0, critical: 0 },
      byRule: {}
    };

    for (const alert of this.alerts.values()) {
      if (alert.resolved) {
        stats.resolved++;
      } else {
        stats.active++;
      }
      
      stats.bySeverity[alert.severity]++;
      stats.byRule[alert.rule] = (stats.byRule[alert.rule] || 0) + 1;
    }

    return stats;
  }

  // Resolve alert
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      Logger.info('Alert resolved', { alertId, rule: alert.rule });
    }
  }

  // Get rules configuration
  getRules() {
    const rules = {};
    for (const [name, rule] of this.rules) {
      rules[name] = {
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
        enabled: rule.enabled,
        triggerCount: rule.triggerCount,
        lastTriggered: rule.lastTriggered
      };
    }
    return rules;
  }
}

export default new AlertManager();