#!/usr/bin/env python3
"""
Backend Authentication Testing for Code Assistant API
Tests JWT protection on protected endpoints and ensures public routes remain open.
"""

import requests
import json
import sys
from datetime import datetime

class AuthAPITester:
    def __init__(self, base_url="https://code-assistant-api-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append(f"{test_name}: {details}")
            print(f"❌ {test_name} - FAILED: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None, timeout=30):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {endpoint}: {str(e)}")
            return None
    
    def test_login_and_get_token(self):
        """Test login and extract JWT token"""
        print("\n🔐 Testing Login and Token Extraction...")
        
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        response = self.make_request('POST', '/api/auth/login', data=login_data)
        
        if response is None:
            self.log_result("Login Request", False, "Network error")
            return False
            
        if response.status_code == 200:
            try:
                response_data = response.json()
                if 'token' in response_data:
                    self.token = response_data['token']
                    self.log_result("Login and Token Extraction", True)
                    print(f"   Token obtained: {self.token[:20]}...")
                    return True
                else:
                    self.log_result("Login and Token Extraction", False, "No token in response")
                    return False
            except json.JSONDecodeError:
                self.log_result("Login and Token Extraction", False, "Invalid JSON response")
                return False
        else:
            self.log_result("Login and Token Extraction", False, f"Status {response.status_code}")
            return False
    
    def test_protected_endpoint_without_token(self, endpoint, method='POST'):
        """Test protected endpoint without authentication token"""
        print(f"\n🚫 Testing {endpoint} without token...")
        
        test_data = {}
        if endpoint == '/api/ingest-repo':
            test_data = {"repoUrl": "https://github.com/expressjs/express"}
        elif endpoint == '/api/search':
            test_data = {"query": "test query"}
        elif endpoint == '/api/chat':
            test_data = {"message": "test message"}
        
        response = self.make_request(method, endpoint, data=test_data)
        
        if response is None:
            self.log_result(f"{endpoint} without token", False, "Network error")
            return False
        
        success = response.status_code == 401
        if success:
            try:
                error_data = response.json()
                if 'error' in error_data:
                    self.log_result(f"{endpoint} without token", True)
                    print(f"   Correctly returned 401 with error: {error_data['error']}")
                else:
                    self.log_result(f"{endpoint} without token", False, "401 but no error message")
            except:
                self.log_result(f"{endpoint} without token", True)
                print(f"   Correctly returned 401")
        else:
            self.log_result(f"{endpoint} without token", False, f"Expected 401, got {response.status_code}")
        
        return success
    
    def test_protected_endpoint_with_token(self, endpoint, method='POST'):
        """Test protected endpoint with valid authentication token"""
        print(f"\n🔓 Testing {endpoint} with valid token...")
        
        if not self.token:
            self.log_result(f"{endpoint} with token", False, "No token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
        
        test_data = {}
        timeout = 30
        if endpoint == '/api/ingest-repo':
            test_data = {"repoUrl": "https://github.com/expressjs/express"}
            timeout = 300  # Longer timeout for repo ingestion
        elif endpoint == '/api/search':
            test_data = {"query": "express router"}
        elif endpoint == '/api/chat':
            test_data = {"message": "What is Express.js?"}
        
        response = self.make_request(method, endpoint, data=test_data, headers=headers, timeout=timeout)
        
        if response is None:
            self.log_result(f"{endpoint} with token", False, "Network error")
            return False
        
        # For protected endpoints with valid token, we expect success (200/201) or specific business logic errors
        # but NOT 401 (authentication error)
        if response.status_code == 401:
            self.log_result(f"{endpoint} with token", False, f"Still got 401 with valid token")
            return False
        elif response.status_code in [200, 201]:
            self.log_result(f"{endpoint} with token", True)
            print(f"   Successfully accessed with token (status {response.status_code})")
            return True
        else:
            # Other status codes might be business logic errors, which is acceptable
            self.log_result(f"{endpoint} with token", True)
            print(f"   Accessed with token (status {response.status_code}) - not auth error")
            return True
    
    def test_invalid_token(self, endpoint='/api/search'):
        """Test endpoint with invalid token"""
        print(f"\n🔒 Testing {endpoint} with invalid token...")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid.token.here'
        }
        
        test_data = {"query": "test"}
        response = self.make_request('POST', endpoint, data=test_data, headers=headers)
        
        if response is None:
            self.log_result("Invalid token test", False, "Network error")
            return False
        
        success = response.status_code == 401
        if success:
            self.log_result("Invalid token test", True)
            print(f"   Correctly rejected invalid token with 401")
        else:
            self.log_result("Invalid token test", False, f"Expected 401, got {response.status_code}")
        
        return success
    
    def test_public_endpoint(self, endpoint, method='GET'):
        """Test public endpoint (should work without authentication)"""
        print(f"\n🌐 Testing public endpoint {endpoint}...")
        
        response = self.make_request(method, endpoint)
        
        if response is None:
            self.log_result(f"Public {endpoint}", False, "Network error")
            return False
        
        # Public endpoints should return success status, not 401
        if response.status_code == 401:
            self.log_result(f"Public {endpoint}", False, "Incorrectly requires authentication")
            return False
        elif response.status_code in [200, 201]:
            self.log_result(f"Public {endpoint}", True)
            print(f"   Public endpoint accessible (status {response.status_code})")
            return True
        else:
            # Other status codes might be acceptable for public endpoints
            self.log_result(f"Public {endpoint}", True)
            print(f"   Public endpoint responded (status {response.status_code})")
            return True
    
    def run_all_tests(self):
        """Run comprehensive authentication tests"""
        print("🚀 Starting Authentication Tests for Code Assistant API")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Get authentication token
        if not self.test_login_and_get_token():
            print("\n❌ Cannot proceed without valid token")
            return False
        
        # Step 2: Test protected endpoints without token (should return 401)
        protected_endpoints = [
            '/api/ingest-repo',
            '/api/search', 
            '/api/chat'
        ]
        
        for endpoint in protected_endpoints:
            self.test_protected_endpoint_without_token(endpoint)
        
        # Step 3: Test protected endpoints with valid token (should work)
        for endpoint in protected_endpoints:
            self.test_protected_endpoint_with_token(endpoint)
        
        # Step 4: Test invalid token
        self.test_invalid_token()
        
        # Step 5: Test public endpoints (should work without auth)
        public_endpoints = [
            '/api/health',
            '/api/info',
            ('/api/auth/register', 'POST'),
            ('/api/auth/login', 'POST')
        ]
        
        for endpoint_info in public_endpoints:
            if isinstance(endpoint_info, tuple):
                endpoint, method = endpoint_info
                # For auth endpoints, test with dummy data
                if endpoint in ['/api/auth/register', '/api/auth/login']:
                    print(f"\n🌐 Testing public endpoint {endpoint}...")
                    test_data = {"email": "test@test.com", "password": "test123"}
                    response = self.make_request(method, endpoint, data=test_data)
                    if response is None:
                        self.log_result(f"Public {endpoint}", False, "Network error")
                    elif response.status_code == 401:
                        self.log_result(f"Public {endpoint}", False, "Incorrectly requires authentication")
                    else:
                        self.log_result(f"Public {endpoint}", True)
                        print(f"   Public endpoint accessible (status {response.status_code})")
                else:
                    self.test_public_endpoint(endpoint, method)
            else:
                self.test_public_endpoint(endpoint_info)
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        print("\n" + "=" * 60)
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = AuthAPITester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())