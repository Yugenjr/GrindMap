export const connectionManager = (server) => {
  // Set server timeout
  server.timeout = 35000; // 35 seconds (slightly higher than default request timeout)
  server.keepAliveTimeout = 5000; // 5 seconds
  server.headersTimeout = 10000; // 10 seconds
  
  // Limit concurrent connections
  server.maxConnections = 1000;
  
  // Track connections
  let connectionCount = 0;
  const connections = new Set();
  
  server.on('connection', (socket) => {
    connectionCount++;
    connections.add(socket);
    
    console.log(`📡 New connection (${connectionCount} active)`);
    
    // Set socket timeout
    socket.setTimeout(40000); // 40 seconds
    
    socket.on('timeout', () => {
      console.warn('🔌 Socket timeout, destroying connection');
      socket.destroy();
    });
    
    socket.on('close', () => {
      connectionCount--;
      connections.delete(socket);
    });
    
    socket.on('error', (err) => {
      console.error('🔌 Socket error:', err.message);
      connections.delete(socket);
    });
  });
  
  // Graceful shutdown helper
  const closeAllConnections = () => {
    console.log(`🔌 Closing ${connections.size} active connections`);
    for (const socket of connections) {
      socket.destroy();
    }
    connections.clear();
  };
  
  return {
    getConnectionCount: () => connectionCount,
    getConnections: () => connections.size,
    closeAllConnections
  };
};