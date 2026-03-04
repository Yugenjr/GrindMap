import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');

export const getAuditLogs = (options = {}) => {
  const { 
    type, 
    startDate, 
    endDate, 
    requestId, 
    ip, 
    statusCode,
    limit = 100 
  } = options;
  
  const auditFile = path.join(LOGS_DIR, 'audit.log');
  const securityFile = path.join(LOGS_DIR, 'security.log');
  
  let logs = [];
  
  // Read audit logs
  if (fs.existsSync(auditFile)) {
    const auditContent = fs.readFileSync(auditFile, 'utf8');
    const auditLines = auditContent.split('\n').filter(line => line.trim());
    logs = logs.concat(auditLines.map(line => {
      const [timestamp, ...jsonParts] = line.split(' ');
      return JSON.parse(jsonParts.join(' '));
    }));
  }
  
  // Read security logs
  if (fs.existsSync(securityFile)) {
    const securityContent = fs.readFileSync(securityFile, 'utf8');
    const securityLines = securityContent.split('\n').filter(line => line.trim());
    logs = logs.concat(securityLines.map(line => {
      const [timestamp, ...jsonParts] = line.split(' ');
      return JSON.parse(jsonParts.join(' '));
    }));
  }
  
  // Apply filters
  let filteredLogs = logs;
  
  if (type) {
    filteredLogs = filteredLogs.filter(log => log.type === type);
  }
  
  if (requestId) {
    filteredLogs = filteredLogs.filter(log => log.requestId === requestId);
  }
  
  if (ip) {
    filteredLogs = filteredLogs.filter(log => log.ip === ip);
  }
  
  if (statusCode) {
    filteredLogs = filteredLogs.filter(log => log.statusCode === statusCode);
  }
  
  if (startDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= new Date(endDate)
    );
  }
  
  // Sort by timestamp (newest first) and limit
  return filteredLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

export const getSecurityEvents = (hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return getAuditLogs({ 
    type: 'SECURITY_EVENT',
    startDate: since.toISOString()
  });
};

export const getRequestTrace = (requestId) => {
  return getAuditLogs({ requestId }).sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
};