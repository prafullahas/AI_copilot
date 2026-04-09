#!/usr/bin/env python3
"""
Backend API Testing for AI Codebase Copilot - New Features Testing
Tests the new /api/info endpoint and embedding features in /api/ingest-repo
"""

import requests
import sys
import json
from datetime import datetime
import time

class NewFeaturesTester:
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

    def test_info_endpoint(self):
        """Test GET /api/info endpoint - NEW FEATURE"""
        print(f"\n🔍 Testing Info Endpoint (NEW FEATURE)...")
        
        try:
            url = f"{self.base_url}/api/info"
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                self.log_test("GET /api/info", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("GET /api/info", False, "Response is not valid JSON")
                return False
            
            # Check required fields
            required_fields = ['name', 'version', 'endpoints']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("GET /api/info", False, f"Missing fields: {missing_fields}")
                return False
            
            # Check specific values
            if data['name'] != 'AI Codebase Copilot':
                self.log_test("GET /api/info", False, f"Wrong name: expected 'AI Codebase Copilot', got '{data['name']}'")
                return False
            
            if data['version'] != '1.0.0':
                self.log_test("GET /api/info", False, f"Wrong version: expected '1.0.0', got '{data['version']}'")
                return False
            
            if not isinstance(data['endpoints'], list):
                self.log_test("GET /api/info", False, f"Endpoints should be array, got {type(data['endpoints'])}")
                return False
            
            expected_endpoints = ['/health', '/info', '/ingest-repo']
            for endpoint in expected_endpoints:
                if endpoint not in data['endpoints']:
                    self.log_test("GET /api/info", False, f"Missing endpoint: {endpoint}")
                    return False
            
            details = f"Correct response: name='{data['name']}', version='{data['version']}', endpoints={data['endpoints']}"
            self.log_test("GET /api/info", True, details)
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("GET /api/info", False, f"Request failed: {str(e)}")
            return False

    def test_ingest_repo_with_embeddings(self):
        """Test POST /api/ingest-repo with new embedding features"""
        print(f"\n🔍 Testing Ingest Repo with Embeddings (NEW FEATURE)...")
        
        # Use a small, reliable test repo
        test_repo = "https://github.com/expressjs/express"
        payload = {"repoUrl": test_repo}
        
        try:
            print(f"   🔄 Processing repo: {test_repo} (may take 30-60 seconds for model download)...")
            response = requests.post(
                f"{self.base_url}/api/ingest-repo", 
                json=payload, 
                timeout=300  # Extended timeout for embedding processing
            )
            
            if response.status_code != 200:
                self.log_test("POST /api/ingest-repo with embeddings", False, f"Status: {response.status_code}, Response: {response.text[:500]}")
                return False, None
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/ingest-repo with embeddings", False, "Response is not valid JSON")
                return False, None
            
            # Check required fields (old + new)
            required_fields = ['repo', 'fileCount', 'chunkCount', 'embeddings']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("POST /api/ingest-repo with embeddings", False, f"Missing fields: {missing_fields}")
                return False, None
            
            # Validate embeddings object
            embeddings = data['embeddings']
            if not isinstance(embeddings, dict):
                self.log_test("POST /api/ingest-repo with embeddings", False, f"Embeddings should be object, got {type(embeddings)}")
                return False, None
            
            required_embedding_fields = ['totalEmbeddings', 'dimension']
            missing_embedding_fields = [field for field in required_embedding_fields if field not in embeddings]
            
            if missing_embedding_fields:
                self.log_test("POST /api/ingest-repo with embeddings", False, f"Missing embedding fields: {missing_embedding_fields}")
                return False, None
            
            # Check dimension is 384 (Xenova/all-MiniLM-L6-v2)
            if embeddings['dimension'] != 384:
                self.log_test("POST /api/ingest-repo with embeddings", False, f"Wrong dimension: expected 384, got {embeddings['dimension']}")
                return False, None
            
            # Check that totalEmbeddings is positive integer
            if not isinstance(embeddings['totalEmbeddings'], int) or embeddings['totalEmbeddings'] <= 0:
                self.log_test("POST /api/ingest-repo with embeddings", False, f"Invalid totalEmbeddings: {embeddings['totalEmbeddings']}")
                return False, None
            
            details = f"Successfully processed {data['fileCount']} files, {data['chunkCount']} chunks, {embeddings['totalEmbeddings']} embeddings (dim={embeddings['dimension']})"
            self.log_test("POST /api/ingest-repo with embeddings", True, details)
            return True, data
            
        except Exception as e:
            self.log_test("POST /api/ingest-repo with embeddings", False, str(e))
            return False, None

    def test_embedding_chunk_count_match(self, ingest_data):
        """Test that embedding count matches chunk count"""
        print(f"\n🔍 Testing Embedding Count Matches Chunk Count...")
        
        if not ingest_data:
            self.log_test("Embedding count matches chunk count", False, "No ingest data available (previous test failed)")
            return False
        
        chunk_count = ingest_data['chunkCount']
        embedding_count = ingest_data['embeddings']['totalEmbeddings']
        
        if chunk_count == embedding_count:
            details = f"Counts match: {chunk_count} chunks = {embedding_count} embeddings"
            self.log_test("Embedding count matches chunk count", True, details)
            return True
        else:
            details = f"Counts don't match: {chunk_count} chunks != {embedding_count} embeddings"
            self.log_test("Embedding count matches chunk count", False, details)
            return False

    def test_ingest_repo_error_handling(self):
        """Test POST /api/ingest-repo error handling still works"""
        print(f"\n🔍 Testing Ingest Repo Error Handling...")
        
        # Test missing repoUrl
        try:
            response = requests.post(f"{self.base_url}/api/ingest-repo", json={}, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'repoUrl is required' in data['error']:
                    self.log_test("Missing repoUrl error handling", True, "Correctly returned 400 with proper error message")
                else:
                    self.log_test("Missing repoUrl error handling", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Missing repoUrl error handling", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Missing repoUrl error handling", False, str(e))
            return False
        
        # Test invalid repoUrl
        try:
            invalid_payload = {"repoUrl": "https://example.com/not-github"}
            response = requests.post(f"{self.base_url}/api/ingest-repo", json=invalid_payload, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'Invalid GitHub repository URL' in data['error']:
                    self.log_test("Invalid repoUrl error handling", True, "Correctly returned 400 with proper error message")
                    return True
                else:
                    self.log_test("Invalid repoUrl error handling", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("Invalid repoUrl error handling", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Invalid repoUrl error handling", False, str(e))
            return False

    def run_all_tests(self):
        """Run all tests for new features"""
        print("=" * 70)
        print("🚀 Starting Backend Tests for NEW FEATURES")
        print(f"🌐 Testing URL: {self.base_url}")
        print("=" * 70)
        
        # Test baseline functionality
        if not self.test_health_endpoint():
            print("❌ Health endpoint failed - backend may be down")
            return False
        
        # Test new info endpoint
        self.test_info_endpoint()
        
        # Test error handling still works
        self.test_ingest_repo_error_handling()
        
        # Test main new functionality (embeddings)
        print(f"\n🔧 Testing New Embedding Features...")
        success, ingest_data = self.test_ingest_repo_with_embeddings()
        
        if success:
            # Test embedding count matches chunk count
            self.test_embedding_chunk_count_match(ingest_data)
        else:
            print("⚠️  Skipping embedding count test due to ingest failure")
        
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
    tester = NewFeaturesTester()
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