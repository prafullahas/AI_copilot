#!/usr/bin/env python3
"""
Additional Authentication Edge Case Tests
Tests edge cases like malformed headers, expired tokens, etc.
"""

import requests
import json
import sys
from datetime import datetime

class AuthEdgeCaseTester:
    def __init__(self, base_url="https://code-assistant-api-1.preview.emergentagent.com"):
        self.base_url = base_url
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
    
    def test_malformed_auth_headers(self):
        """Test various malformed Authorization headers"""
        print("\n🔍 Testing Malformed Authorization Headers...")
        
        test_cases = [
            ("No Bearer prefix", "invalid_token_without_bearer"),
            ("Bearer without space", "Bearerinvalid_token"),
            ("Empty Bearer", "Bearer "),
            ("Bearer with extra spaces", "Bearer   token_with_spaces"),
            ("Wrong case", "bearer valid_token"),
            ("Missing Authorization", None)
        ]
        
        for case_name, auth_header in test_cases:
            print(f"\n   Testing: {case_name}")
            
            headers = {'Content-Type': 'application/json'}
            if auth_header is not None:
                headers['Authorization'] = auth_header
            
            response = self.make_request('POST', '/api/search', 
                                       data={"query": "test"}, 
                                       headers=headers)
            
            if response is None:
                self.log_result(f"Malformed header: {case_name}", False, "Network error")
                continue
            
            success = response.status_code == 401
            if success:
                self.log_result(f"Malformed header: {case_name}", True)
            else:
                self.log_result(f"Malformed header: {case_name}", False, 
                              f"Expected 401, got {response.status_code}")
    
    def test_empty_request_bodies(self):
        """Test protected endpoints with empty request bodies"""
        print("\n🔍 Testing Empty Request Bodies...")
        
        # First get a valid token
        login_response = self.make_request('POST', '/api/auth/login', 
                                         data={"email": "admin@example.com", "password": "admin123"})
        
        if login_response is None or login_response.status_code != 200:
            print("   Cannot get token for empty body tests")
            return
        
        token = login_response.json().get('token')
        if not token:
            print("   No token in login response")
            return
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        endpoints = ['/api/search', '/api/chat']
        
        for endpoint in endpoints:
            print(f"\n   Testing {endpoint} with empty body...")
            
            # Test with empty dict
            response = self.make_request('POST', endpoint, data={}, headers=headers)
            if response is None:
                self.log_result(f"Empty body {endpoint}", False, "Network error")
            elif response.status_code == 401:
                self.log_result(f"Empty body {endpoint}", False, "Got 401 - auth failed")
            else:
                self.log_result(f"Empty body {endpoint}", True)
                print(f"     Status: {response.status_code} (auth passed, business logic response)")
    
    def test_case_sensitivity(self):
        """Test case sensitivity of Bearer token"""
        print("\n🔍 Testing Case Sensitivity...")
        
        # Get valid token
        login_response = self.make_request('POST', '/api/auth/login', 
                                         data={"email": "admin@example.com", "password": "admin123"})
        
        if login_response is None or login_response.status_code != 200:
            print("   Cannot get token for case sensitivity tests")
            return
        
        token = login_response.json().get('token')
        if not token:
            print("   No token in login response")
            return
        
        # Test different cases of "Bearer"
        case_tests = [
            ("bearer", f"bearer {token}"),
            ("BEARER", f"BEARER {token}"),
            ("Bearer", f"Bearer {token}"),  # This should work
        ]
        
        for case_name, auth_header in case_tests:
            print(f"\n   Testing: {case_name}")
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': auth_header
            }
            
            response = self.make_request('POST', '/api/search', 
                                       data={"query": "test"}, 
                                       headers=headers)
            
            if response is None:
                self.log_result(f"Case test: {case_name}", False, "Network error")
                continue
            
            if case_name == "Bearer":
                # This should work
                success = response.status_code != 401
                if success:
                    self.log_result(f"Case test: {case_name}", True)
                else:
                    self.log_result(f"Case test: {case_name}", False, "Should accept proper Bearer")
            else:
                # These should fail
                success = response.status_code == 401
                if success:
                    self.log_result(f"Case test: {case_name}", True)
                else:
                    self.log_result(f"Case test: {case_name}", False, "Should reject improper case")
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("🔬 Starting Authentication Edge Case Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        self.test_malformed_auth_headers()
        self.test_empty_request_bodies()
        self.test_case_sensitivity()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 EDGE CASE TEST SUMMARY")
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
    tester = AuthEdgeCaseTester()
    
    try:
        tester.run_edge_case_tests()
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