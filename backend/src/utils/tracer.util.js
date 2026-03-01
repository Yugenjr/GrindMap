import { randomUUID } from 'crypto';
import Logger from './logger.js';

class Tracer {
  constructor() {
    this.traces = new Map();
  }

  startTrace(operation, metadata = {}) {
    const traceId = randomUUID();
    const spanId = randomUUID();
    
    const trace = {
      traceId,
      spanId,
      operation,
      startTime: Date.now(),
      metadata,
      spans: []
    };
    
    this.traces.set(traceId, trace);
    return { traceId, spanId };
  }

  addSpan(traceId, operation, metadata = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    const spanId = randomUUID();
    const span = {
      spanId,
      operation,
      startTime: Date.now(),
      metadata
    };
    
    trace.spans.push(span);
    return spanId;
  }

  endSpan(traceId, spanId, result = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    if (trace.spanId === spanId) {
      trace.endTime = Date.now();
      trace.duration = trace.endTime - trace.startTime;
      trace.result = result;
    } else {
      const span = trace.spans.find(s => s.spanId === spanId);
      if (span) {
        span.endTime = Date.now();
        span.duration = span.endTime - span.startTime;
        span.result = result;
      }
    }
  }

  getTrace(traceId) {
    return this.traces.get(traceId);
  }

  logTrace(traceId) {
    const trace = this.getTrace(traceId);
    if (!trace) return;

    Logger.info(`[TRACE] ${trace.traceId} | ${trace.operation} | ${trace.duration}ms`);
    trace.spans.forEach(span => {
      Logger.info(`  [SPAN] ${span.operation} | ${span.duration || 'pending'}ms`);
    });
  }

  cleanup() {
    const cutoff = Date.now() - 300000; // 5 minutes
    for (const [traceId, trace] of this.traces) {
      if (trace.startTime < cutoff) {
        this.traces.delete(traceId);
      }
    }
  }
}

export const tracer = new Tracer();

// Cleanup old traces every 5 minutes
setInterval(() => tracer.cleanup(), 300000);