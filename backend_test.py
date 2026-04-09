#!/usr/bin/env python3
"""
Backend API Testing for AI Codebase Copilot - Ingest Repo Feature
Tests the Node.js Express backend functionality with focus on ingest-repo endpoint
"""

import requests
import sys
import json
from datetime import datetime
import time

class RepoIngestTester:
    def __init__(self, base_url="https://code-assistant-api-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.valid_repo_files = None

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
            
            self.log_test("Health endpoint", success, details)
            return success
            
        except requests.exceptions.RequestException as e:
            self.log_test("Health endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_ingest_repo_valid_url(self):
        """Test POST /api/ingest-repo with valid GitHub URL"""
        print(f"\n🔍 Testing Ingest Repo with Valid URL...")
        
        # Use a small, reliable test repo
        test_repo = "https://github.com/expressjs/express"
        payload = {"repoUrl": test_repo}
        
        try:
            print(f"   🔄 Cloning repo: {test_repo} (may take 30-60 seconds)...")
            response = requests.post(
                f"{self.base_url}/api/ingest-repo", 
                json=payload, 
                timeout=120  # Extended timeout for git clone
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ['repo', 'fileCount', 'files']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Valid GitHub URL - Response Structure", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Validate data types and content
                if data['repo'] != test_repo:
                    self.log_test("Valid GitHub URL - Repo Field", False, f"Repo mismatch: expected {test_repo}, got {data['repo']}")
                    return False
                
                if not isinstance(data['fileCount'], int) or data['fileCount'] < 0:
                    self.log_test("Valid GitHub URL - File Count", False, f"Invalid fileCount: {data['fileCount']}")
                    return False
                
                if not isinstance(data['files'], list):
                    self.log_test("Valid GitHub URL - Files Array", False, f"Files should be array, got {type(data['files'])}")
                    return False
                
                if len(data['files']) != data['fileCount']:
                    self.log_test("Valid GitHub URL - Count Consistency", False, f"File count mismatch: fileCount={data['fileCount']}, actual files={len(data['files'])}")
                    return False
                
                # Validate file structure
                for i, file_obj in enumerate(data['files'][:3]):  # Check first 3 files
                    if not isinstance(file_obj, dict) or 'path' not in file_obj or 'content' not in file_obj:
                        self.log_test("Valid GitHub URL - File Structure", False, f"Invalid file structure at index {i}")
                        return False
                
                details = f"Successfully extracted {data['fileCount']} files"
                self.log_test("Valid GitHub URL", True, details)
                
                # Store for extension validation
                self.valid_repo_files = data['files']
                return True
            else:
                self.log_test("Valid GitHub URL", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Valid GitHub URL", False, str(e))
            return False

    def test_file_extension_filtering(self):
        """Test that only .js, .ts, .py, .java files are extracted"""
        print(f"\n🔍 Testing File Extension Filtering...")
        
        if not self.valid_repo_files:
            self.log_test("File Extension Filtering", False, "No valid repo files to check (previous test failed)")
            return False
        
        allowed_extensions = {'.js', '.ts', '.py', '.java'}
        invalid_files = []
        
        for file_obj in self.valid_repo_files:
            file_path = file_obj['path']
            extension = '.' + file_path.split('.')[-1] if '.' in file_path else ''
            if extension not in allowed_extensions:
                invalid_files.append(f"{file_path} ({extension})")
        
        if invalid_files:
            details = f"Found files with invalid extensions: {invalid_files[:5]}"  # Show first 5
            self.log_test("File Extension Filtering", False, details)
            return False
        else:
            details = f"All {len(self.valid_repo_files)} files have valid extensions (.js, .ts, .py, .java)"
            self.log_test("File Extension Filtering", True, details)
            return True

    def test_directory_filtering(self):
        """Test that node_modules, dist, build directories are ignored"""
        print(f"\n🔍 Testing Directory Filtering...")
        
        if not self.valid_repo_files:
            self.log_test("Directory Filtering", False, "No valid repo files to check (previous test failed)")
            return False
        
        ignored_dirs = {'node_modules', 'dist', 'build'}
        invalid_paths = []
        
        for file_obj in self.valid_repo_files:
            file_path = file_obj['path']
            path_parts = file_path.split('/')
            
            for ignored_dir in ignored_dirs:
                if ignored_dir in path_parts:
                    invalid_paths.append(file_path)
                    break
        
        if invalid_paths:
            details = f"Found files in ignored directories: {invalid_paths[:3]}"  # Show first 3
            self.log_test("Directory Filtering", False, details)
            return False
        else:
            details = f"No files found in ignored directories (node_modules, dist, build)"
            self.log_test("Directory Filtering", True, details)
            return True

    def test_missing_repo_url(self):
        """Test POST /api/ingest-repo with missing repoUrl"""
        print(f"\n🔍 Testing Missing RepoUrl...")
        
        try:
            response = requests.post(f"{self.base_url}/api/ingest-repo", json={}, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'repoUrl is required' in data['error']:
                    self.log_test("Missing RepoUrl", True, "Correctly returned 400 with proper error message")
                    return True
                else:
                    self.log_test("Missing RepoUrl", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Missing RepoUrl", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Missing RepoUrl", False, str(e))
            return False

    def test_invalid_repo_url(self):
        """Test POST /api/ingest-repo with invalid URL (not GitHub)"""
        print(f"\n🔍 Testing Invalid GitHub URLs...")
        
        invalid_urls = [
            "https://gitlab.com/user/repo",
            "https://bitbucket.org/user/repo", 
            "https://example.com/repo",
            "not-a-url",
            "https://github.com/",
            "https://github.com/user",
        ]
        
        all_passed = True
        failed_urls = []
        
        for invalid_url in invalid_urls:
            try:
                payload = {"repoUrl": invalid_url}
                response = requests.post(f"{self.base_url}/api/ingest-repo", json=payload, timeout=10)
                
                if response.status_code == 400:
                    data = response.json()
                    if 'error' in data and 'Invalid GitHub repository URL' in data['error']:
                        print(f"     ✅ {invalid_url} - correctly rejected")
                    else:
                        print(f"     ❌ {invalid_url} - wrong error message: {data}")
                        failed_urls.append(invalid_url)
                        all_passed = False
                else:
                    print(f"     ❌ {invalid_url} - expected 400, got {response.status_code}")
                    failed_urls.append(invalid_url)
                    all_passed = False
                    
            except Exception as e:
                print(f"     ❌ {invalid_url} - error: {str(e)}")
                failed_urls.append(invalid_url)
                all_passed = False
        
        if all_passed:
            self.log_test("Invalid GitHub URLs", True, f"All {len(invalid_urls)} invalid URLs correctly rejected")
        else:
            self.log_test("Invalid GitHub URLs", False, f"Failed URLs: {failed_urls}")
        
        return all_passed

    def test_nonexistent_repo(self):
        """Test POST /api/ingest-repo with valid GitHub URL format but nonexistent repo"""
        print(f"\n🔍 Testing Nonexistent Repository...")
        
        nonexistent_repo = "https://github.com/nonexistent-user-12345/nonexistent-repo-67890"
        payload = {"repoUrl": nonexistent_repo}
        
        try:
            response = requests.post(f"{self.base_url}/api/ingest-repo", json=payload, timeout=30)
            
            # Should return 500 with clone error
            if response.status_code == 500:
                data = response.json()
                if 'error' in data and 'Failed to clone repository' in data['error']:
                    self.log_test("Nonexistent Repository", True, "Correctly handled clone failure")
                    return True
                else:
                    self.log_test("Nonexistent Repository", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Nonexistent Repository", False, f"Expected 500, got {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Nonexistent Repository", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests focusing on ingest-repo feature"""
        print("=" * 70)
        print("🚀 Starting Backend Tests for Ingest-Repo Feature")
        print(f"🌐 Testing URL: {self.base_url}")
        print("=" * 70)
        
        # Test health endpoint first (baseline)
        if not self.test_health_endpoint():
            print("❌ Health endpoint failed - backend may be down")
            return False
        
        # Test ingest-repo validation
        print(f"\n📋 Testing Input Validation...")
        self.test_missing_repo_url()
        self.test_invalid_repo_url()
        self.test_nonexistent_repo()
        
        # Test main functionality
        print(f"\n🔧 Testing Core Functionality...")
        if self.test_ingest_repo_valid_url():
            # Only run these if we have valid repo data
            self.test_file_extension_filtering()
            self.test_directory_filtering()
        else:
            print("⚠️  Skipping file filtering tests due to main functionality failure")
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return True
        else:
            print("❌ SOME TESTS FAILED!")
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return False

def main():
    """Main test execution"""
    tester = RepoIngestTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())