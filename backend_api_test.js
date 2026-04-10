const axios = require('axios');

class BackendAPITester {
  constructor(baseUrl = "https://code-assistant-api-1.preview.emergentagent.com") {
    this.baseUrl = baseUrl;
    this.token = null;
    this.testsRun = 0;
    this.testsPassed = 0;
    this.testResults = [];
  }

  async runTest(name, testFn) {
    this.testsRun++;
    console.log(`\n🔍 Testing ${name}...`);
    
    try {
      const result = await testFn();
      if (result.success) {
        this.testsPassed++;
        console.log(`✅ Passed - ${result.message || 'Success'}`);
        this.testResults.push({ name, status: 'PASSED', message: result.message });
      } else {
        console.log(`❌ Failed - ${result.message || 'Unknown error'}`);
        this.testResults.push({ name, status: 'FAILED', message: result.message });
      }
      return result;
    } catch (error) {
      console.log(`❌ Failed - Error: ${error.message}`);
      this.testResults.push({ name, status: 'ERROR', message: error.message });
      return { success: false, message: error.message };
    }
  }

  async makeRequest(method, endpoint, data = null, expectedStatus = 200) {
    const url = `${this.baseUrl}/api/${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      let response;
      if (method === 'GET') {
        response = await axios.get(url, { headers });
      } else if (method === 'POST') {
        response = await axios.post(url, data, { headers });
      }

      const success = response.status === expectedStatus;
      return {
        success,
        status: response.status,
        data: response.data,
        message: success ? `Status: ${response.status}` : `Expected ${expectedStatus}, got ${response.status}`
      };
    } catch (error) {
      if (error.response) {
        const success = error.response.status === expectedStatus;
        return {
          success,
          status: error.response.status,
          data: error.response.data,
          message: success ? `Status: ${error.response.status}` : `Expected ${expectedStatus}, got ${error.response.status}`
        };
      }
      throw error;
    }
  }

  // Authentication Tests
  async testLogin() {
    return this.runTest("Admin Login", async () => {
      const result = await this.makeRequest('POST', 'auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
      });
      
      if (result.success && result.data.token) {
        this.token = result.data.token;
        return { success: true, message: `Login successful, token received` };
      }
      return { success: false, message: result.message };
    });
  }

  // Health Check Test
  async testHealth() {
    return this.runTest("Health Check", async () => {
      const result = await this.makeRequest('GET', 'health');
      return {
        success: result.success,
        message: result.success ? 'Health endpoint working' : result.message
      };
    });
  }

  // Multi-repo Switcher Tests
  async testIngestRepo() {
    return this.runTest("POST /api/ingest-repo stores repo and returns chunkCount", async () => {
      const result = await this.makeRequest('POST', 'ingest-repo', {
        repoUrl: 'https://github.com/expressjs/express'
      });
      
      if (result.success && result.data.chunkCount !== undefined) {
        return { success: true, message: `Repo ingested with ${result.data.chunkCount} chunks` };
      }
      return { success: false, message: result.message || 'No chunkCount in response' };
    });
  }

  async testListRepos() {
    return this.runTest("GET /api/repos returns list of stored repos with active flag", async () => {
      const result = await this.makeRequest('GET', 'repos');
      
      if (result.success && Array.isArray(result.data)) {
        const hasActiveFlag = result.data.every(repo => 'active' in repo);
        return { 
          success: hasActiveFlag, 
          message: hasActiveFlag ? `Found ${result.data.length} repos with active flags` : 'Missing active flag in repos'
        };
      }
      return { success: false, message: result.message || 'Invalid repos response' };
    });
  }

  async testSwitchRepo() {
    return this.runTest("POST /api/switch-repo switches active repo", async () => {
      const result = await this.makeRequest('POST', 'switch-repo', {
        repoUrl: 'https://github.com/expressjs/express'
      });
      
      return {
        success: result.success,
        message: result.success ? 'Repo switched successfully' : result.message
      };
    });
  }

  async testSwitchRepoNotFound() {
    return this.runTest("POST /api/switch-repo with unknown repo returns 404", async () => {
      const result = await this.makeRequest('POST', 'switch-repo', {
        repoUrl: 'https://github.com/nonexistent/repo'
      }, 404);
      
      return {
        success: result.success,
        message: result.success ? 'Correctly returned 404 for unknown repo' : result.message
      };
    });
  }

  // Input Validation Tests
  async testSearchQueryTooLong() {
    return this.runTest("POST /api/search with query over 1000 chars returns 400", async () => {
      const longQuery = 'a'.repeat(1001);
      const result = await this.makeRequest('POST', 'search', {
        query: longQuery
      }, 400);
      
      return {
        success: result.success,
        message: result.success ? 'Correctly rejected long query' : result.message
      };
    });
  }

  async testChatQuestionTooLong() {
    return this.runTest("POST /api/chat with question over 2000 chars returns 400", async () => {
      const longQuestion = 'a'.repeat(2001);
      const result = await this.makeRequest('POST', 'chat', {
        question: longQuestion
      }, 400);
      
      return {
        success: result.success,
        message: result.success ? 'Correctly rejected long question' : result.message
      };
    });
  }

  async testIngestRepoUrlTooLong() {
    return this.runTest("POST /api/ingest-repo with URL over 300 chars returns 400", async () => {
      const longUrl = 'https://github.com/user/' + 'a'.repeat(300);
      const result = await this.makeRequest('POST', 'ingest-repo', {
        repoUrl: longUrl
      }, 400);
      
      return {
        success: result.success,
        message: result.success ? 'Correctly rejected long URL' : result.message
      };
    });
  }

  // Parameter Clamping Test
  async testRetrieveParameterClamping() {
    return this.runTest("POST /api/retrieve with k parameter is clamped to 1-20 range", async () => {
      // Test with k > 20
      const result1 = await this.makeRequest('POST', 'retrieve', {
        query: 'test query',
        k: 25
      });
      
      // Test with k < 1
      const result2 = await this.makeRequest('POST', 'retrieve', {
        query: 'test query',
        k: 0
      });
      
      // Both should succeed (clamped internally)
      return {
        success: result1.success && result2.success,
        message: result1.success && result2.success ? 'Parameter clamping working' : 'Parameter clamping failed'
      };
    });
  }

  // Existing Functionality Tests
  async testSearchEndpoint() {
    return this.runTest("POST /api/search basic functionality", async () => {
      const result = await this.makeRequest('POST', 'search', {
        query: 'express'
      });
      
      return {
        success: result.success,
        message: result.success ? 'Search endpoint working' : result.message
      };
    });
  }

  async testChatEndpoint() {
    return this.runTest("POST /api/chat basic functionality", async () => {
      const result = await this.makeRequest('POST', 'chat', {
        question: 'What is express?'
      });
      
      return {
        success: result.success,
        message: result.success ? 'Chat endpoint working' : result.message
      };
    });
  }

  async testRetrieveEndpoint() {
    return this.runTest("POST /api/retrieve basic functionality", async () => {
      const result = await this.makeRequest('POST', 'retrieve', {
        query: 'express',
        k: 5
      });
      
      return {
        success: result.success,
        message: result.success ? 'Retrieve endpoint working' : result.message
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Backend API Tests...\n');
    
    // Test authentication first
    await this.testLogin();
    
    if (!this.token) {
      console.log('❌ Cannot proceed without authentication token');
      return this.getResults();
    }

    // Test health endpoint
    await this.testHealth();
    
    // Test multi-repo switcher functionality
    await this.testIngestRepo();
    await this.testListRepos();
    await this.testSwitchRepo();
    await this.testSwitchRepoNotFound();
    
    // Test input validation
    await this.testSearchQueryTooLong();
    await this.testChatQuestionTooLong();
    await this.testIngestRepoUrlTooLong();
    
    // Test parameter clamping
    await this.testRetrieveParameterClamping();
    
    // Test existing functionality
    await this.testSearchEndpoint();
    await this.testChatEndpoint();
    await this.testRetrieveEndpoint();
    
    return this.getResults();
  }

  getResults() {
    console.log(`\n📊 Test Results: ${this.testsPassed}/${this.testsRun} passed`);
    console.log(`Success Rate: ${((this.testsPassed / this.testsRun) * 100).toFixed(1)}%`);
    
    const failedTests = this.testResults.filter(t => t.status !== 'PASSED');
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
    }
    
    return {
      totalTests: this.testsRun,
      passedTests: this.testsPassed,
      failedTests: this.testsRun - this.testsPassed,
      successRate: (this.testsPassed / this.testsRun) * 100,
      results: this.testResults
    };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new BackendAPITester();
  tester.runAllTests().then(results => {
    process.exit(results.failedTests > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = BackendAPITester;