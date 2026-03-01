// Centralized error logger
export function logError({ statusCode, message, stack, url, method, ip, userAgent, time }) {
	const errorLog = {
		level: statusCode >= 500 ? 'ERROR' : 'WARN',
		statusCode,
		message,
		stack,
		url,
		method,
		ip,
		userAgent,
		time,
	};
	// You can extend this to log to files, external services, etc.
	console.error(JSON.stringify(errorLog, null, 2));
}
