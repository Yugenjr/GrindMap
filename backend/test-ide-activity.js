const axios = require('axios');

// Test script for IDE Activity Integration
const BASE_URL = 'http://localhost:5000/api';
const WS_URL = 'ws://localhost:5000/ws';

// Sample IDE activity data
const sampleActivities = [
  {
    ideType: 'vscode',
    sessionId: 'session_12345',
    activityType: 'session_start',
    platform: 'leetcode',
    problemId: '1',
    timestamp: new Date().toISOString(),
    metadata: {
      language: 'javascript',
      filePath: '/problems/two-sum.js'
    }
  },
  {
    ideType: 'vscode',
    sessionId: 'session_12345',
    activityType: 'code_edit',
    platform: 'leetcode',
    problemId: '1',
    timestamp: new Date(Date.now() + 1000).toISOString(),
    metadata: {
      linesChanged: 5,
      timeSpent: 120000, // 2 minutes
      language: 'javascript'
    }
  },
  {
    ideType: 'vscode',
    sessionId: 'session_12345',
    activityType: 'submission_attempt',
    platform: 'leetcode',
    problemId: '1',
    timestamp: new Date(Date.now() + 2000).toISOString(),
    metadata: {
      language: 'javascript',
      testResults: { passed: 15, total: 21 }
    }
  },
  {
    ideType: 'vscode',
    sessionId: 'session_12345',
    activityType: 'submission_success',
    platform: 'leetcode',
    problemId: '1',
    timestamp: new Date(Date.now() + 3000).toISOString(),
    metadata: {
      language: 'javascript',
      difficulty: 'easy',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      executionTime: 45,
      problemName: 'Two Sum'
    }
  },
  {
    ideType: 'vscode',
    sessionId: 'session_12345',
    activityType: 'session_end',
    platform: 'leetcode',
    problemId: '1',
    timestamp: new Date(Date.now() + 4000).toISOString(),
    metadata: {
      totalTimeSpent: 300000 // 5 minutes
    }
  }
];

async function testWebhookEndpoint() {
  console.log('🧪 Testing IDE Activity Webhook Endpoint...\n');

  try {
    // First, we need to authenticate and get a token
    console.log('1. Authenticating user...');
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com', // You'll need to create a test user or use existing
      password: 'testpassword'
    });

    const token = authResponse.data.data.token;
    console.log('✅ Authentication successful\n');

    // Test each activity
    for (let i = 0; i < sampleActivities.length; i++) {
      const activity = sampleActivities[i];
      console.log(`2.${i + 1}. Sending ${activity.activityType} activity...`);

      try {
        const response = await axios.post(
          `${BASE_URL}/websocket/webhook/ide-activity`,
          {
            userId: authResponse.data.data.id, // Add userId for webhook
            ...activity
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ ${activity.activityType} processed:`, response.data);
      } catch (error) {
        console.log(`❌ ${activity.activityType} failed:`, error.response?.data || error.message);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n3. Testing GET endpoints...');

    // Test getting sessions
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/ide-activity/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Sessions retrieved:', sessionsResponse.data.data.sessions.length, 'sessions');
    } catch (error) {
      console.log('❌ Sessions retrieval failed:', error.response?.data || error.message);
    }

    // Test getting analytics
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/ide-activity/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Analytics retrieved:', analyticsResponse.data.data.analytics.length, 'platforms');
    } catch (error) {
      console.log('❌ Analytics retrieval failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Webhook testing failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Backend server is running on port 5000');
    console.log('   - MongoDB is connected');
    console.log('   - Test user exists or create one');
  }
}

async function testWebSocketConnection() {
  console.log('\n🔌 Testing WebSocket Connection...\n');

  return new Promise((resolve) => {
    try {
      const WebSocket = require('ws');

      // First get auth token
      axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      }).then(authResponse => {
        const token = authResponse.data.data.token;

        // Get WebSocket token
        return axios.post(`${BASE_URL}/websocket/token`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }).then(wsTokenResponse => {
        const wsToken = wsTokenResponse.data.token;

        const ws = new WebSocket(`${WS_URL}?token=${wsToken}`);

        ws.on('open', () => {
          console.log('✅ WebSocket connection established');

          // Send an IDE activity message
          ws.send(JSON.stringify({
            type: 'ide_activity',
            activityData: {
              ideType: 'vscode',
              sessionId: 'ws_test_session',
              activityType: 'session_start',
              platform: 'codeforces',
              problemId: '123',
              timestamp: new Date().toISOString()
            }
          }));

          console.log('📤 Sent IDE activity message via WebSocket');
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('📥 Received WebSocket message:', message.type);
          } catch (e) {
            console.log('📥 Received raw message:', data.toString());
          }
        });

        ws.on('error', (error) => {
          console.log('❌ WebSocket error:', error.message);
        });

        ws.on('close', () => {
          console.log('🔌 WebSocket connection closed');
          resolve();
        });

        // Close after 5 seconds
        setTimeout(() => {
          ws.close();
        }, 5000);

      }).catch(error => {
        console.log('❌ WebSocket auth failed:', error.response?.data || error.message);
        resolve();
      });

    } catch (error) {
      console.log('❌ WebSocket testing setup failed:', error.message);
      resolve();
    }
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting IDE Activity Integration Tests\n');
  console.log('=' .repeat(50));

  await testWebhookEndpoint();
  await testWebSocketConnection();

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Testing completed!');
  console.log('\n📝 Next steps:');
  console.log('   - Check server logs for detailed activity processing');
  console.log('   - Verify database has new IdeActivity records');
  console.log('   - Test with real IDE extension');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, sampleActivities };
