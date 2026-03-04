import { tracer } from '../utils/tracer.util.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess, RESPONSE_MESSAGES, ERROR_CODES } from '../utils/response.util.js';

export const traceRoutes = (app) => {
  // Get specific trace
  app.get('/traces/:traceId', (req, res, next) => {
    const trace = tracer.getTrace(req.params.traceId);
    if (!trace) {
      return next(new AppError('Trace not found', 404, true, ERROR_CODES.NOT_FOUND));
    }
    
    return sendSuccess(res, {
      statusCode: 200,
      message: RESPONSE_MESSAGES.FETCH_SUCCESS,
      data: { trace },
    });
  });

  // Get all active traces (last 100)
  app.get('/traces', (req, res) => {
    const traces = Array.from(tracer.traces.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 100)
      .map(trace => ({
        traceId: trace.traceId,
        operation: trace.operation,
        duration: trace.duration,
        startTime: trace.startTime,
        spanCount: trace.spans.length
      }));
    
    return sendSuccess(res, {
      statusCode: 200,
      message: RESPONSE_MESSAGES.FETCH_SUCCESS,
      data: { traces },
      meta: {
        total: tracer.traces.size,
        displayed: traces.length,
      },
    });
  });
};