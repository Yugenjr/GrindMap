#!/usr/bin/env node

import { getAuditLogs, getSecurityEvents, getRequestTrace } from '../src/utils/auditViewer.js';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'logs':
    const logs = getAuditLogs({ limit: 50 });
    console.log('Recent Audit Logs:');
    logs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.type} - ${log.method || ''} ${log.url || ''} - Status: ${log.statusCode || 'N/A'}`);
    });
    break;
    
  case 'security':
    const events = getSecurityEvents(24);
    console.log('Security Events (Last 24h):');
    events.forEach(event => {
      console.log(`[${event.timestamp}] ${event.level} - ${event.threatType || 'SECURITY_EVENT'} from ${event.ip}`);
    });
    break;
    
  case 'trace':
    const requestId = args[1];
    if (!requestId) {
      console.log('Usage: npm run audit trace <requestId>');
      break;
    }
    const trace = getRequestTrace(requestId);
    console.log(`Request Trace for ${requestId}:`);
    trace.forEach(entry => {
      console.log(`[${entry.timestamp}] ${entry.type} - ${entry.method || ''} ${entry.url || ''}`);
    });
    break;
    
  default:
    console.log('GrindMap Audit Viewer');
    console.log('Usage:');
    console.log('  npm run audit logs     - View recent audit logs');
    console.log('  npm run audit security - View security events');
    console.log('  npm run audit trace <id> - View request trace');
}