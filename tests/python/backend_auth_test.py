#!/usr/bin/env python3
"""
Backend JWT Authentication Testing for Node.js Express API
Tests all authentication endpoints and JWT functionality
"""

import requests
import sys
import json
import jwt
from datetime import datetime
import time
import uuid

class AuthTester:
    def __init__(self, base_url="https://code-assistant-api-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_token = None

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
        """Test GET /api/health endpoint (baseline test)"""
        print(f"\n🔍 Testing Health Endpoint...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                try:
                    data = response.json()
                    details += f", Response: {data}"
                except:
                    details += ", Response: Non-JSON"
            
            self.log_test("GET /api/health", success, details)
            return success
            
        except requests.exceptions.RequestException as e:
            self.log_test("GET /api/health", False, f"Request failed: {str(e)}")
            return False

    def test_info_endpoint_includes_auth(self):
        """Test GET /api/info includes auth endpoints"""
        print(f"\n🔍 Testing Info Endpoint Includes Auth...")
        
        try:
            url = f"{self.base_url}/api/info"
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                self.log_test("GET /api/info includes auth", False, f"Status: {response.status_code}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("GET /api/info includes auth", False, "Response is not valid JSON")
                return False
            
            if 'endpoints' not in data:
                self.log_test("GET /api/info includes auth", False, "Missing endpoints field")
                return False
            
            # Check for auth endpoints
            auth_endpoints = ['/auth/register', '/auth/login']
            missing_endpoints = []
            for endpoint in auth_endpoints:
                if endpoint not in data['endpoints']:
                    missing_endpoints.append(endpoint)
            
            if missing_endpoints:
                self.log_test("GET /api/info includes auth", False, f"Missing auth endpoints: {missing_endpoints}")
                return False
            
            self.log_test("GET /api/info includes auth", True, f"Auth endpoints found: {auth_endpoints}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("GET /api/info includes auth", False, f"Request failed: {str(e)}")
            return False

    def test_register_valid_user(self):
        """Test POST /api/auth/register with valid email+password"""
        print(f"\n🔍 Testing Register Valid User...")
        
        # Generate unique email for this test run
        unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        
        try:
            url = f"{self.base_url}/api/auth/register"
            payload = {
                "email": unique_email,
                "password": "testpass123"
            }
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code != 201:
                self.log_test("POST /api/auth/register valid", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/auth/register valid", False, "Response is not valid JSON")
                return False, None
            
            # Check required fields
            required_fields = ['token', 'user']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("POST /api/auth/register valid", False, f"Missing fields: {missing_fields}")
                return False, None
            
            # Check user object structure
            user = data['user']
            user_required_fields = ['id', 'email', 'createdAt']
            user_missing_fields = [field for field in user_required_fields if field not in user]
            
            if user_missing_fields:
                self.log_test("POST /api/auth/register valid", False, f"Missing user fields: {user_missing_fields}")
                return False, None
            
            # Check email matches
            if user['email'] != unique_email:
                self.log_test("POST /api/auth/register valid", False, f"Email mismatch: expected {unique_email}, got {user['email']}")
                return False, None
            
            # Check token is a string
            if not isinstance(data['token'], str) or len(data['token']) == 0:
                self.log_test("POST /api/auth/register valid", False, f"Invalid token: {data['token']}")
                return False, None
            
            details = f"Successfully registered user: {user['email']}, token length: {len(data['token'])}"
            self.log_test("POST /api/auth/register valid", True, details)
            return True, data
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/auth/register valid", False, f"Request failed: {str(e)}")
            return False, None

    def test_register_duplicate_email(self):
        """Test POST /api/auth/register with duplicate email returns 409"""
        print(f"\n🔍 Testing Register Duplicate Email...")
        
        # First register a user
        unique_email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
        
        try:
            url = f"{self.base_url}/api/auth/register"
            payload = {
                "email": unique_email,
                "password": "testpass123"
            }
            
            # First registration
            response1 = requests.post(url, json=payload, timeout=10)
            if response1.status_code != 201:
                self.log_test("POST /api/auth/register duplicate", False, f"First registration failed: {response1.status_code}")
                return False
            
            # Second registration with same email
            response2 = requests.post(url, json=payload, timeout=10)
            
            if response2.status_code != 409:
                self.log_test("POST /api/auth/register duplicate", False, f"Expected 409, got {response2.status_code}")
                return False
            
            try:
                data = response2.json()
                if 'error' not in data:
                    self.log_test("POST /api/auth/register duplicate", False, f"Missing error field: {data}")
                    return False
                
                if 'already registered' not in data['error'].lower():
                    self.log_test("POST /api/auth/register duplicate", False, f"Wrong error message: {data['error']}")
                    return False
            except:
                self.log_test("POST /api/auth/register duplicate", False, "Response is not valid JSON")
                return False
            
            self.log_test("POST /api/auth/register duplicate", True, f"Correctly returned 409 for duplicate email")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/auth/register duplicate", False, f"Request failed: {str(e)}")
            return False

    def test_register_missing_fields(self):
        """Test POST /api/auth/register with missing fields returns 400"""
        print(f"\n🔍 Testing Register Missing Fields...")
        
        test_cases = [
            ({}, "empty body"),
            ({"email": "test@example.com"}, "missing password"),
            ({"password": "testpass123"}, "missing email"),
            ({"email": "", "password": "testpass123"}, "empty email"),
            ({"email": "test@example.com", "password": ""}, "empty password")
        ]
        
        for payload, description in test_cases:
            try:
                url = f"{self.base_url}/api/auth/register"
                response = requests.post(url, json=payload, timeout=10)
                
                if response.status_code != 400:
                    self.log_test(f"POST /api/auth/register missing fields ({description})", False, f"Expected 400, got {response.status_code}")
                    return False
                
                try:
                    data = response.json()
                    if 'error' not in data:
                        self.log_test(f"POST /api/auth/register missing fields ({description})", False, f"Missing error field: {data}")
                        return False
                except:
                    self.log_test(f"POST /api/auth/register missing fields ({description})", False, "Response is not valid JSON")
                    return False
                
            except requests.exceptions.RequestException as e:
                self.log_test(f"POST /api/auth/register missing fields ({description})", False, f"Request failed: {str(e)}")
                return False
        
        self.log_test("POST /api/auth/register missing fields", True, "All missing field cases returned 400")
        return True

    def test_register_short_password(self):
        """Test POST /api/auth/register with short password (<6 chars) returns 400"""
        print(f"\n🔍 Testing Register Short Password...")
        
        try:
            url = f"{self.base_url}/api/auth/register"
            payload = {
                "email": f"shortpass_{uuid.uuid4().hex[:8]}@example.com",
                "password": "12345"  # Only 5 characters
            }
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code != 400:
                self.log_test("POST /api/auth/register short password", False, f"Expected 400, got {response.status_code}")
                return False
            
            try:
                data = response.json()
                if 'error' not in data:
                    self.log_test("POST /api/auth/register short password", False, f"Missing error field: {data}")
                    return False
                
                if 'at least 6 characters' not in data['error']:
                    self.log_test("POST /api/auth/register short password", False, f"Wrong error message: {data['error']}")
                    return False
            except:
                self.log_test("POST /api/auth/register short password", False, "Response is not valid JSON")
                return False
            
            self.log_test("POST /api/auth/register short password", True, "Correctly returned 400 for short password")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/auth/register short password", False, f"Request failed: {str(e)}")
            return False

    def test_login_admin_credentials(self):
        """Test POST /api/auth/login with valid admin credentials"""
        print(f"\n🔍 Testing Login Admin Credentials...")
        
        try:
            url = f"{self.base_url}/api/auth/login"
            payload = {
                "email": "admin@example.com",
                "password": "admin123"
            }
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code != 200:
                self.log_test("POST /api/auth/login admin", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/auth/login admin", False, "Response is not valid JSON")
                return False, None
            
            # Check required fields
            required_fields = ['token', 'user']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("POST /api/auth/login admin", False, f"Missing fields: {missing_fields}")
                return False, None
            
            # Check user object structure
            user = data['user']
            user_required_fields = ['id', 'email']
            user_missing_fields = [field for field in user_required_fields if field not in user]
            
            if user_missing_fields:
                self.log_test("POST /api/auth/login admin", False, f"Missing user fields: {user_missing_fields}")
                return False, None
            
            # Check email matches admin
            if user['email'] != "admin@example.com":
                self.log_test("POST /api/auth/login admin", False, f"Email mismatch: expected admin@example.com, got {user['email']}")
                return False, None
            
            # Store admin token for later tests
            self.admin_token = data['token']
            
            details = f"Successfully logged in admin: {user['email']}, token length: {len(data['token'])}"
            self.log_test("POST /api/auth/login admin", True, details)
            return True, data
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/auth/login admin", False, f"Request failed: {str(e)}")
            return False, None

    def test_login_wrong_password(self):
        """Test POST /api/auth/login with wrong password returns 401"""
        print(f"\n🔍 Testing Login Wrong Password...")
        
        try:
            url = f"{self.base_url}/api/auth/login"
            payload = {
                "email": "admin@example.com",
                "password": "wrongpassword"
            }
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code != 401:
                self.log_test("POST /api/auth/login wrong password", False, f"Expected 401, got {response.status_code}")
                return False
            
            try:
                data = response.json()
                if 'error' not in data:
                    self.log_test("POST /api/auth/login wrong password", False, f"Missing error field: {data}")
                    return False
                
                if 'invalid' not in data['error'].lower():
                    self.log_test("POST /api/auth/login wrong password", False, f"Wrong error message: {data['error']}")
                    return False
            except:
                self.log_test("POST /api/auth/login wrong password", False, "Response is not valid JSON")
                return False
            
            self.log_test("POST /api/auth/login wrong password", True, "Correctly returned 401 for wrong password")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/auth/login wrong password", False, f"Request failed: {str(e)}")
            return False

    def test_login_nonexistent_email(self):
        """Test POST /api/auth/login with non-existent email returns 401"""
        print(f"\n🔍 Testing Login Non-existent Email...")
        
        try:
            url = f"{self.base_url}/api/auth/login"
            payload = {
                "email": f"nonexistent_{uuid.uuid4().hex[:8]}@example.com",
                "password": "anypassword"
            }
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code != 401:
                self.log_test("POST /api/auth/login nonexistent email", False, f"Expected 401, got {response.status_code}")
                return False
            
            try:
                data = response.json()
                if 'error' not in data:
                    self.log_test("POST /api/auth/login nonexistent email", False, f"Missing error field: {data}")
                    return False
                
                if 'invalid' not in data['error'].lower():
                    self.log_test("POST /api/auth/login nonexistent email", False, f"Wrong error message: {data['error']}")
                    return False
            except:
                self.log_test("POST /api/auth/login nonexistent email", False, "Response is not valid JSON")
                return False
            
            self.log_test("POST /api/auth/login nonexistent email", True, "Correctly returned 401 for non-existent email")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/auth/login nonexistent email", False, f"Request failed: {str(e)}")
            return False

    def test_jwt_token_validation(self, login_data):
        """Test JWT token from login is valid and contains sub and email claims"""
        print(f"\n🔍 Testing JWT Token Validation...")
        
        if not login_data or 'token' not in login_data:
            self.log_test("JWT token validation", False, "No login data available (previous test failed)")
            return False
        
        token = login_data['token']
        
        try:
            # Decode token without verification to check structure
            # Note: We can't verify signature without the secret, but we can check structure
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            # Check required claims
            required_claims = ['sub', 'email', 'exp']
            missing_claims = [claim for claim in required_claims if claim not in decoded]
            
            if missing_claims:
                self.log_test("JWT token validation", False, f"Missing claims: {missing_claims}")
                return False
            
            # Check email matches user
            if decoded['email'] != login_data['user']['email']:
                self.log_test("JWT token validation", False, f"Email mismatch in token: expected {login_data['user']['email']}, got {decoded['email']}")
                return False
            
            # Check sub (user ID) matches
            if decoded['sub'] != login_data['user']['id']:
                self.log_test("JWT token validation", False, f"Sub mismatch in token: expected {login_data['user']['id']}, got {decoded['sub']}")
                return False
            
            # Check expiration is in the future
            import time
            current_time = int(time.time())
            if decoded['exp'] <= current_time:
                self.log_test("JWT token validation", False, f"Token already expired: exp={decoded['exp']}, now={current_time}")
                return False
            
            details = f"Token valid with claims: sub={decoded['sub']}, email={decoded['email']}, exp={decoded['exp']}"
            self.log_test("JWT token validation", True, details)
            return True
            
        except jwt.InvalidTokenError as e:
            self.log_test("JWT token validation", False, f"Invalid JWT token: {str(e)}")
            return False
        except Exception as e:
            self.log_test("JWT token validation", False, f"Token validation error: {str(e)}")
            return False

    def test_search_endpoint_still_works(self):
        """Test POST /api/search still works without auth (existing routes not modified)"""
        print(f"\n🔍 Testing Search Endpoint Still Works...")
        
        try:
            url = f"{self.base_url}/api/search"
            payload = {"query": "express middleware"}
            response = requests.post(url, json=payload, timeout=10)
            
            # Should work without authentication
            if response.status_code != 200:
                self.log_test("POST /api/search without auth", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
                # Should return array (may be empty if no data ingested)
                if not isinstance(data, list):
                    self.log_test("POST /api/search without auth", False, f"Expected array, got {type(data)}")
                    return False
            except:
                self.log_test("POST /api/search without auth", False, "Response is not valid JSON")
                return False
            
            self.log_test("POST /api/search without auth", True, f"Search endpoint works without auth, returned {len(data)} results")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("POST /api/search without auth", False, f"Request failed: {str(e)}")
            return False

    def test_login_missing_fields(self):
        """Test POST /api/auth/login with missing fields returns 400"""
        print(f"\n🔍 Testing Login Missing Fields...")
        
        test_cases = [
            ({}, "empty body"),
            ({"email": "test@example.com"}, "missing password"),
            ({"password": "testpass123"}, "missing email"),
            ({"email": "", "password": "testpass123"}, "empty email"),
            ({"email": "test@example.com", "password": ""}, "empty password")
        ]
        
        for payload, description in test_cases:
            try:
                url = f"{self.base_url}/api/auth/login"
                response = requests.post(url, json=payload, timeout=10)
                
                if response.status_code != 400:
                    self.log_test(f"POST /api/auth/login missing fields ({description})", False, f"Expected 400, got {response.status_code}")
                    return False
                
                try:
                    data = response.json()
                    if 'error' not in data:
                        self.log_test(f"POST /api/auth/login missing fields ({description})", False, f"Missing error field: {data}")
                        return False
                except:
                    self.log_test(f"POST /api/auth/login missing fields ({description})", False, "Response is not valid JSON")
                    return False
                
            except requests.exceptions.RequestException as e:
                self.log_test(f"POST /api/auth/login missing fields ({description})", False, f"Request failed: {str(e)}")
                return False
        
        self.log_test("POST /api/auth/login missing fields", True, "All missing field cases returned 400")
        return True

    def run_all_tests(self):
        """Run all authentication tests"""
        print("=" * 70)
        print("🚀 Starting Backend JWT Authentication Tests")
        print(f"🌐 Testing URL: {self.base_url}")
        print("=" * 70)
        
        # Test baseline functionality
        if not self.test_health_endpoint():
            print("❌ Health endpoint failed - backend may be down")
            return False
        
        # Test info endpoint includes auth endpoints
        self.test_info_endpoint_includes_auth()
        
        # Test registration functionality
        print(f"\n🔧 Testing Registration Endpoints...")
        register_success, register_data = self.test_register_valid_user()
        self.test_register_duplicate_email()
        self.test_register_missing_fields()
        self.test_register_short_password()
        
        # Test login functionality
        print(f"\n🔧 Testing Login Endpoints...")
        login_success, login_data = self.test_login_admin_credentials()
        self.test_login_wrong_password()
        self.test_login_nonexistent_email()
        self.test_login_missing_fields()
        
        # Test JWT token validation
        print(f"\n🔧 Testing JWT Token Validation...")
        if login_success:
            self.test_jwt_token_validation(login_data)
        else:
            self.log_test("JWT token validation", False, "No login data available (admin login failed)")
        
        # Test existing routes still work
        print(f"\n🔧 Testing Existing Routes Still Work...")
        self.test_search_endpoint_still_works()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 AUTHENTICATION TEST SUMMARY")
        print("=" * 70)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL AUTHENTICATION TESTS PASSED!")
            return True
        else:
            print("❌ SOME AUTHENTICATION TESTS FAILED!")
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return False

def main():
    """Main test execution"""
    tester = AuthTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
        "test_details": tester.test_results
    }
    
    with open('/app/backend_auth_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_auth_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())