#!/usr/bin/env python3
"""
Backend API Testing for AI Codebase Copilot
Tests the Node.js Express backend functionality
"""

import requests
import sys
import json
from datetime import datetime
import time

class NodeBackendTester:
    def __init__(self, base_url="https://code-assistant-api-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_health_endpoint(self):
        """Test GET /api/health endpoint"""
        print(f"\n🔍 Testing Health Endpoint...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            # Check status code
            if response.status_code != 200:
                self.log_test("Health endpoint status code", False, f"Expected 200, got {response.status_code}")
                return False
            
            # Check response is JSON
            try:
                data = response.json()
            except json.JSONDecodeError:
                self.log_test("Health endpoint JSON response", False, "Response is not valid JSON")
                return False
            
            # Check required fields
            required_fields = ['status', 'uptime', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Health endpoint required fields", False, f"Missing fields: {missing_fields}")
                return False
            
            # Check status value
            if data.get('status') != 'ok':
                self.log_test("Health endpoint status value", False, f"Expected 'ok', got '{data.get('status')}'")
                return False
            
            # Check uptime is a number
            if not isinstance(data.get('uptime'), (int, float)):
                self.log_test("Health endpoint uptime type", False, f"Uptime should be a number, got {type(data.get('uptime'))}")
                return False
            
            # Check timestamp format (should be ISO string)
            try:
                datetime.fromisoformat(data.get('timestamp').replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                self.log_test("Health endpoint timestamp format", False, f"Invalid timestamp format: {data.get('timestamp')}")
                return False
            
            print(f"   Response: {json.dumps(data, indent=2)}")
            self.log_test("Health endpoint functionality", True, f"All fields present and valid")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Health endpoint connectivity", False, f"Request failed: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test CORS headers are present"""
        print(f"\n🔍 Testing CORS Headers...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            # Check for CORS headers
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            print(f"   CORS Headers found: {cors_headers}")
            
            # At minimum, Access-Control-Allow-Origin should be present
            if 'Access-Control-Allow-Origin' not in response.headers:
                self.log_test("CORS headers present", False, "Access-Control-Allow-Origin header missing")
                return False
            
            self.log_test("CORS headers present", True, f"CORS headers found: {cors_headers}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("CORS headers test", False, f"Request failed: {str(e)}")
            return False

    def test_404_handler(self):
        """Test 404 handler returns JSON error for unknown routes"""
        print(f"\n🔍 Testing 404 Handler...")
        
        try:
            # Test a non-existent route
            url = f"{self.base_url}/api/nonexistent-route"
            response = requests.get(url, timeout=10)
            
            # Check status code
            if response.status_code != 404:
                self.log_test("404 handler status code", False, f"Expected 404, got {response.status_code}")
                return False
            
            # Check response is JSON
            try:
                data = response.json()
            except json.JSONDecodeError:
                self.log_test("404 handler JSON response", False, "404 response is not valid JSON")
                return False
            
            # Check error field exists
            if 'error' not in data:
                self.log_test("404 handler error field", False, "Response should contain 'error' field")
                return False
            
            print(f"   404 Response: {json.dumps(data, indent=2)}")
            self.log_test("404 handler functionality", True, f"Returns JSON error: {data}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("404 handler test", False, f"Request failed: {str(e)}")
            return False

    def test_server_running_on_port(self):
        """Test that backend is accessible (implies running on correct port)"""
        print(f"\n🔍 Testing Server Accessibility...")
        
        try:
            # Simple connectivity test
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=5)
            
            if response.status_code in [200, 404, 500]:  # Any response means server is running
                self.log_test("Server accessibility", True, f"Server responding at {self.base_url}")
                return True
            else:
                self.log_test("Server accessibility", False, f"Unexpected status code: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Server accessibility", False, f"Cannot reach server: {str(e)}")
            return False

    def test_basic_security_headers(self):
        """Test for basic security considerations"""
        print(f"\n🔍 Testing Basic Security Headers...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            # Check if server header is not exposing too much info
            server_header = response.headers.get('Server', '')
            if 'Express' in server_header or 'Node' in server_header:
                self.log_test("Server header security", False, f"Server header exposes technology: {server_header}")
            else:
                self.log_test("Server header security", True, "Server header doesn't expose sensitive info")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Security headers test", False, f"Request failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("🚀 Starting Node.js Express Backend Tests")
        print(f"🌐 Testing URL: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        tests = [
            self.test_server_running_on_port,
            self.test_health_endpoint,
            self.test_cors_headers,
            self.test_404_handler,
            self.test_basic_security_headers
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(f"{test.__name__}", False, f"Test crashed: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return 0
        else:
            print("❌ SOME TESTS FAILED!")
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    """Main test execution"""
    tester = NodeBackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())