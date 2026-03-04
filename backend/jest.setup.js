// Jest setup file for test environment configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'f0372621f88700b17299be4e5ea64779ebb11b877997c5160ff2a75d0c2a47c69edf2a08b4cbfb4fd7409cd05427c094ef16b0ab42996b3c755fe34f7b58fc63';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_grindmap';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PORT = '5001';