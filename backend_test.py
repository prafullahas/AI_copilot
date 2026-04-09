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
            
            expected_endpoints = ['/health', '/info', '/ingest-repo', '/retrieve', '/chat', '/search']
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

    def test_retrieve_missing_query(self):
        """Test POST /api/retrieve with missing query returns 400 error"""
        print(f"\n🔍 Testing Retrieve Missing Query Error...")
        
        try:
            # Test with empty body
            response = requests.post(f"{self.base_url}/api/retrieve", json={}, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'query is required' in data['error']:
                    self.log_test("POST /api/retrieve missing query", True, "Correctly returned 400 with proper error message")
                    return True
                else:
                    self.log_test("POST /api/retrieve missing query", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("POST /api/retrieve missing query", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("POST /api/retrieve missing query", False, str(e))
            return False

    def test_retrieve_before_ingestion(self):
        """Test POST /api/retrieve returns proper structure (may have data from previous ingestions)"""
        print(f"\n🔍 Testing Retrieve Response Structure...")
        
        try:
            payload = {"query": "express middleware"}
            response = requests.post(f"{self.base_url}/api/retrieve", json=payload, timeout=10)
            
            if response.status_code != 200:
                self.log_test("POST /api/retrieve response structure", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/retrieve response structure", False, "Response is not valid JSON")
                return False
            
            # Check response structure
            if 'query' not in data or 'results' not in data:
                self.log_test("POST /api/retrieve response structure", False, f"Missing query or results fields: {data}")
                return False
            
            # Should echo back the query
            if data['query'] != "express middleware":
                self.log_test("POST /api/retrieve response structure", False, f"Query mismatch: expected 'express middleware', got '{data['query']}'")
                return False
            
            if not isinstance(data['results'], list):
                self.log_test("POST /api/retrieve response structure", False, f"Results should be array, got {type(data['results'])}")
                return False
            
            # Check that if there are results, they have proper structure
            for i, result in enumerate(data['results']):
                required_fields = ['content', 'file', 'relevance_score']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_test("POST /api/retrieve response structure", False, f"Result {i} missing fields: {missing_fields}")
                    return False
            
            details = f"Correctly returned proper structure with {len(data['results'])} results"
            self.log_test("POST /api/retrieve response structure", True, details)
            return True
            
        except Exception as e:
            self.log_test("POST /api/retrieve response structure", False, str(e))
            return False

    def test_retrieve_with_valid_query(self):
        """Test POST /api/retrieve with valid query after ingestion"""
        print(f"\n🔍 Testing Retrieve With Valid Query...")
        
        try:
            payload = {"query": "express middleware routing"}
            response = requests.post(f"{self.base_url}/api/retrieve", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("POST /api/retrieve valid query", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/retrieve valid query", False, "Response is not valid JSON")
                return False, None
            
            # Check response structure
            if 'query' not in data or 'results' not in data:
                self.log_test("POST /api/retrieve valid query", False, f"Missing query or results fields: {data}")
                return False, None
            
            if data['query'] != "express middleware routing":
                self.log_test("POST /api/retrieve valid query", False, f"Query mismatch: expected 'express middleware routing', got '{data['query']}'")
                return False, None
            
            if not isinstance(data['results'], list):
                self.log_test("POST /api/retrieve valid query", False, f"Results should be array, got {type(data['results'])}")
                return False, None
            
            # Should return some results (default k=5)
            if len(data['results']) == 0:
                self.log_test("POST /api/retrieve valid query", False, "Expected some results, got empty array")
                return False, None
            
            # Check each result has required fields
            for i, result in enumerate(data['results']):
                required_fields = ['content', 'file', 'relevance_score']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_test("POST /api/retrieve valid query", False, f"Result {i} missing fields: {missing_fields}")
                    return False, None
                
                # Check field types
                if not isinstance(result['content'], str):
                    self.log_test("POST /api/retrieve valid query", False, f"Result {i} content should be string, got {type(result['content'])}")
                    return False, None
                
                if not isinstance(result['file'], str):
                    self.log_test("POST /api/retrieve valid query", False, f"Result {i} file should be string, got {type(result['file'])}")
                    return False, None
                
                if not isinstance(result['relevance_score'], (int, float)):
                    self.log_test("POST /api/retrieve valid query", False, f"Result {i} relevance_score should be numeric, got {type(result['relevance_score'])}")
                    return False, None
            
            details = f"Successfully retrieved {len(data['results'])} results with proper structure"
            self.log_test("POST /api/retrieve valid query", True, details)
            return True, data
            
        except Exception as e:
            self.log_test("POST /api/retrieve valid query", False, str(e))
            return False, None

    def test_retrieve_with_k_parameter(self):
        """Test POST /api/retrieve with k=3 returns exactly 3 results"""
        print(f"\n🔍 Testing Retrieve With k=3 Parameter...")
        
        try:
            payload = {"query": "express application", "k": 3}
            response = requests.post(f"{self.base_url}/api/retrieve", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("POST /api/retrieve k=3", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/retrieve k=3", False, "Response is not valid JSON")
                return False
            
            if 'results' not in data:
                self.log_test("POST /api/retrieve k=3", False, f"Missing results field: {data}")
                return False
            
            if len(data['results']) != 3:
                self.log_test("POST /api/retrieve k=3", False, f"Expected exactly 3 results, got {len(data['results'])}")
                return False
            
            self.log_test("POST /api/retrieve k=3", True, f"Correctly returned exactly 3 results")
            return True
            
        except Exception as e:
            self.log_test("POST /api/retrieve k=3", False, str(e))
            return False

    def test_relevance_scores_sorted(self, retrieve_data):
        """Test that relevance_score values are numeric and sorted descending"""
        print(f"\n🔍 Testing Relevance Scores Sorted Descending...")
        
        if not retrieve_data or 'results' not in retrieve_data:
            self.log_test("Relevance scores sorted", False, "No retrieve data available (previous test failed)")
            return False
        
        results = retrieve_data['results']
        if len(results) < 2:
            self.log_test("Relevance scores sorted", True, "Only one result, sorting not applicable")
            return True
        
        # Check if scores are sorted in descending order
        scores = [result['relevance_score'] for result in results]
        sorted_scores = sorted(scores, reverse=True)
        
        if scores == sorted_scores:
            details = f"Scores correctly sorted descending: {scores}"
            self.log_test("Relevance scores sorted", True, details)
            return True
        else:
            details = f"Scores not sorted: {scores}, should be: {sorted_scores}"
            self.log_test("Relevance scores sorted", False, details)
            return False

    def test_full_ingest_retrieve_flow(self):
        """Test full flow: ingest repo then retrieve returns relevant chunks"""
        print(f"\n🔍 Testing Full Ingest-Retrieve Flow...")
        
        # First ingest a repo
        test_repo = "https://github.com/expressjs/express"
        payload = {"repoUrl": test_repo}
        
        try:
            print(f"   🔄 Ingesting repo: {test_repo} (may take 30-60 seconds)...")
            ingest_response = requests.post(
                f"{self.base_url}/api/ingest-repo", 
                json=payload, 
                timeout=300
            )
            
            if ingest_response.status_code != 200:
                self.log_test("Full ingest-retrieve flow", False, f"Ingest failed: {ingest_response.status_code}")
                return False
            
            ingest_data = ingest_response.json()
            if 'embeddings' not in ingest_data or ingest_data['embeddings']['totalEmbeddings'] <= 0:
                self.log_test("Full ingest-retrieve flow", False, "Ingest didn't create embeddings")
                return False
            
            print(f"   ✅ Ingested {ingest_data['embeddings']['totalEmbeddings']} embeddings")
            
            # Now test retrieval
            retrieve_payload = {"query": "express router middleware", "k": 5}
            retrieve_response = requests.post(f"{self.base_url}/api/retrieve", json=retrieve_payload, timeout=30)
            
            if retrieve_response.status_code != 200:
                self.log_test("Full ingest-retrieve flow", False, f"Retrieve failed: {retrieve_response.status_code}")
                return False
            
            retrieve_data = retrieve_response.json()
            
            if 'results' not in retrieve_data or len(retrieve_data['results']) == 0:
                self.log_test("Full ingest-retrieve flow", False, "Retrieve returned no results after ingestion")
                return False
            
            # Check that results contain relevant content
            results_contain_relevant = False
            for result in retrieve_data['results']:
                content_lower = result['content'].lower()
                if any(keyword in content_lower for keyword in ['express', 'router', 'middleware', 'app']):
                    results_contain_relevant = True
                    break
            
            if not results_contain_relevant:
                self.log_test("Full ingest-retrieve flow", False, "Results don't seem relevant to Express.js")
                return False
            
            details = f"Successfully retrieved {len(retrieve_data['results'])} relevant results after ingestion"
            self.log_test("Full ingest-retrieve flow", True, details)
            return True, retrieve_data
            
        except Exception as e:
            self.log_test("Full ingest-retrieve flow", False, str(e))
            return False, None

    def test_chat_missing_question(self):
        """Test POST /api/chat with missing question returns 400 error"""
        print(f"\n🔍 Testing Chat Missing Question Error...")
        
        try:
            # Test with empty body
            response = requests.post(f"{self.base_url}/api/chat", json={}, timeout=60)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'question is required' in data['error']:
                    self.log_test("POST /api/chat missing question", True, "Correctly returned 400 with proper error message")
                    return True
                else:
                    self.log_test("POST /api/chat missing question", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("POST /api/chat missing question", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("POST /api/chat missing question", False, str(e))
            return False

    def test_chat_before_ingestion(self):
        """Test POST /api/chat before any ingestion returns 'Not found in codebase'"""
        print(f"\n🔍 Testing Chat Before Ingestion...")
        
        # First, let's clear any existing data by restarting the backend
        # Note: In a real test, we'd have a way to clear the embeddings
        
        try:
            payload = {"question": "How does Express routing work?"}
            response = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=60)
            
            if response.status_code != 200:
                self.log_test("POST /api/chat before ingestion", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/chat before ingestion", False, "Response is not valid JSON")
                return False
            
            # Check required fields
            if 'answer' not in data or 'referencedFiles' not in data:
                self.log_test("POST /api/chat before ingestion", False, f"Missing answer or referencedFiles fields: {data}")
                return False
            
            # Check answer is 'Not found in codebase' OR we have a valid answer with referenced files
            # (since there might be data from previous ingestions)
            if data['answer'] == 'Not found in codebase':
                # Check referencedFiles is empty array when no data found
                if not isinstance(data['referencedFiles'], list):
                    self.log_test("POST /api/chat before ingestion", False, f"referencedFiles should be array, got {type(data['referencedFiles'])}")
                    return False
                details = f"Correctly returned 'Not found in codebase' with {len(data['referencedFiles'])} referenced files"
                self.log_test("POST /api/chat before ingestion", True, details)
                return True
            else:
                # If we get an answer, it should be a valid response structure
                if not isinstance(data['answer'], str) or len(data['answer'].strip()) == 0:
                    self.log_test("POST /api/chat before ingestion", False, f"Answer should be non-empty string, got: {data['answer']}")
                    return False
                if not isinstance(data['referencedFiles'], list):
                    self.log_test("POST /api/chat before ingestion", False, f"referencedFiles should be array, got {type(data['referencedFiles'])}")
                    return False
                details = f"Got valid answer (from previous ingestion): {data['answer'][:50]}... with {len(data['referencedFiles'])} files"
                self.log_test("POST /api/chat before ingestion", True, details)
                return True
            
        except Exception as e:
            self.log_test("POST /api/chat before ingestion", False, str(e))
            return False

    def test_chat_with_valid_question_after_ingestion(self):
        """Test POST /api/chat with valid question after ingestion returns proper response"""
        print(f"\n🔍 Testing Chat With Valid Question After Ingestion...")
        
        # First ensure we have ingested a repo
        test_repo = "https://github.com/expressjs/express"
        payload = {"repoUrl": test_repo}
        
        try:
            print(f"   🔄 Ensuring repo is ingested: {test_repo} (may take up to 5 minutes)...")
            ingest_response = requests.post(
                f"{self.base_url}/api/ingest-repo", 
                json=payload, 
                timeout=300
            )
            
            if ingest_response.status_code != 200:
                self.log_test("POST /api/chat after ingestion", False, f"Ingest failed: {ingest_response.status_code}")
                return False
            
            ingest_data = ingest_response.json()
            if 'embeddings' not in ingest_data or ingest_data['embeddings']['totalEmbeddings'] <= 0:
                self.log_test("POST /api/chat after ingestion", False, "Ingest didn't create embeddings")
                return False
            
            print(f"   ✅ Ingested {ingest_data['embeddings']['totalEmbeddings']} embeddings")
            
            # Now test chat with a valid question
            chat_payload = {"question": "How do you create an Express app?"}
            chat_response = requests.post(f"{self.base_url}/api/chat", json=chat_payload, timeout=60)
            
            if chat_response.status_code != 200:
                self.log_test("POST /api/chat after ingestion", False, f"Chat failed: {chat_response.status_code}, Response: {chat_response.text}")
                return False
            
            try:
                chat_data = chat_response.json()
            except:
                self.log_test("POST /api/chat after ingestion", False, "Chat response is not valid JSON")
                return False
            
            # Check required fields
            if 'answer' not in chat_data or 'referencedFiles' not in chat_data:
                self.log_test("POST /api/chat after ingestion", False, f"Missing answer or referencedFiles fields: {chat_data}")
                return False
            
            # Check answer is a non-empty string
            if not isinstance(chat_data['answer'], str) or len(chat_data['answer'].strip()) == 0:
                self.log_test("POST /api/chat after ingestion", False, f"Answer should be non-empty string, got: {chat_data['answer']}")
                return False
            
            # Check referencedFiles is an array of file paths
            if not isinstance(chat_data['referencedFiles'], list):
                self.log_test("POST /api/chat after ingestion", False, f"referencedFiles should be array, got {type(chat_data['referencedFiles'])}")
                return False
            
            # If there are referenced files, they should be strings (file paths)
            for i, file_path in enumerate(chat_data['referencedFiles']):
                if not isinstance(file_path, str):
                    self.log_test("POST /api/chat after ingestion", False, f"referencedFiles[{i}] should be string, got {type(file_path)}")
                    return False
            
            # Answer should not be 'Not found in codebase' since we have data
            if chat_data['answer'] == 'Not found in codebase':
                self.log_test("POST /api/chat after ingestion", False, "Got 'Not found in codebase' despite having ingested data")
                return False, None
            
            details = f"Successfully got answer (length: {len(chat_data['answer'])}) with {len(chat_data['referencedFiles'])} referenced files"
            self.log_test("POST /api/chat after ingestion", True, details)
            return True, chat_data
            
        except Exception as e:
            self.log_test("POST /api/chat after ingestion", False, str(e))
            return False, None

    def test_chat_answer_quality(self, chat_data):
        """Test that chat answer contains relevant content"""
        print(f"\n🔍 Testing Chat Answer Quality...")
        
        if not chat_data:
            self.log_test("Chat answer quality", False, "No chat data available (previous test failed)")
            return False
        
        answer = chat_data['answer'].lower()
        
        # Check if answer contains relevant keywords for Express app creation
        relevant_keywords = ['app', 'express', 'createapp', 'create', 'function']
        found_keywords = [keyword for keyword in relevant_keywords if keyword in answer]
        
        if len(found_keywords) >= 2:  # At least 2 relevant keywords
            details = f"Answer contains relevant keywords: {found_keywords}"
            self.log_test("Chat answer quality", True, details)
            return True
        else:
            details = f"Answer lacks relevant keywords. Found: {found_keywords}, Answer: {chat_data['answer'][:200]}..."
            self.log_test("Chat answer quality", False, details)
            return False

    def test_chat_referenced_files_validity(self, chat_data):
        """Test that referenced files are valid file paths"""
        print(f"\n🔍 Testing Chat Referenced Files Validity...")
        
        if not chat_data:
            self.log_test("Chat referenced files validity", False, "No chat data available (previous test failed)")
            return False
        
        referenced_files = chat_data['referencedFiles']
        
        if len(referenced_files) == 0:
            self.log_test("Chat referenced files validity", True, "No referenced files to validate")
            return True
        
        # Check that referenced files look like valid file paths
        for file_path in referenced_files:
            if not file_path or not isinstance(file_path, str):
                self.log_test("Chat referenced files validity", False, f"Invalid file path: {file_path}")
                return False
            
            # Should contain file extension or be a reasonable path
            if '.' not in file_path and '/' not in file_path:
                self.log_test("Chat referenced files validity", False, f"File path doesn't look valid: {file_path}")
                return False
        
        details = f"All {len(referenced_files)} referenced files are valid paths: {referenced_files}"
        self.log_test("Chat referenced files validity", True, details)
        return True

    def test_search_missing_query(self):
        """Test POST /api/search with missing query returns 400 error"""
        print(f"\n🔍 Testing Search Missing Query Error...")
        
        try:
            # Test with empty body
            response = requests.post(f"{self.base_url}/api/search", json={}, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'query is required' in data['error']:
                    self.log_test("POST /api/search missing query", True, "Correctly returned 400 with proper error message")
                    return True
                else:
                    self.log_test("POST /api/search missing query", False, f"Wrong error message: {data}")
                    return False
            else:
                self.log_test("POST /api/search missing query", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("POST /api/search missing query", False, str(e))
            return False

    def test_search_before_ingestion(self):
        """Test POST /api/search before ingestion returns empty array"""
        print(f"\n🔍 Testing Search Before Ingestion...")
        
        try:
            payload = {"query": "express middleware"}
            response = requests.post(f"{self.base_url}/api/search", json=payload, timeout=10)
            
            if response.status_code != 200:
                self.log_test("POST /api/search before ingestion", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/search before ingestion", False, "Response is not valid JSON")
                return False
            
            # Should return empty array when no data is ingested
            if not isinstance(data, list):
                self.log_test("POST /api/search before ingestion", False, f"Response should be array, got {type(data)}")
                return False
            
            # May return empty array or results from previous ingestions
            details = f"Returned {len(data)} results (empty array expected if no previous ingestion)"
            self.log_test("POST /api/search before ingestion", True, details)
            return True
            
        except Exception as e:
            self.log_test("POST /api/search before ingestion", False, str(e))
            return False

    def test_search_with_valid_query(self):
        """Test POST /api/search with valid query returns proper structure"""
        print(f"\n🔍 Testing Search With Valid Query...")
        
        try:
            payload = {"query": "express middleware routing"}
            response = requests.post(f"{self.base_url}/api/search", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("POST /api/search valid query", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/search valid query", False, "Response is not valid JSON")
                return False, None
            
            # Should return array
            if not isinstance(data, list):
                self.log_test("POST /api/search valid query", False, f"Response should be array, got {type(data)}")
                return False, None
            
            # Check each result has required fields
            for i, result in enumerate(data):
                required_fields = ['content', 'file', 'relevance_score']
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    self.log_test("POST /api/search valid query", False, f"Result {i} missing fields: {missing_fields}")
                    return False, None
                
                # Check field types
                if not isinstance(result['content'], str):
                    self.log_test("POST /api/search valid query", False, f"Result {i} content should be string, got {type(result['content'])}")
                    return False, None
                
                if not isinstance(result['file'], str):
                    self.log_test("POST /api/search valid query", False, f"Result {i} file should be string, got {type(result['file'])}")
                    return False, None
                
                if not isinstance(result['relevance_score'], (int, float)):
                    self.log_test("POST /api/search valid query", False, f"Result {i} relevance_score should be numeric, got {type(result['relevance_score'])}")
                    return False, None
            
            details = f"Successfully retrieved {len(data)} results with proper structure"
            self.log_test("POST /api/search valid query", True, details)
            return True, data
            
        except Exception as e:
            self.log_test("POST /api/search valid query", False, str(e))
            return False, None

    def test_search_max_results(self):
        """Test POST /api/search returns max 5 results"""
        print(f"\n🔍 Testing Search Max Results (5)...")
        
        try:
            payload = {"query": "express application"}
            response = requests.post(f"{self.base_url}/api/search", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("POST /api/search max 5 results", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/search max 5 results", False, "Response is not valid JSON")
                return False
            
            if not isinstance(data, list):
                self.log_test("POST /api/search max 5 results", False, f"Response should be array, got {type(data)}")
                return False
            
            if len(data) > 5:
                self.log_test("POST /api/search max 5 results", False, f"Expected max 5 results, got {len(data)}")
                return False
            
            self.log_test("POST /api/search max 5 results", True, f"Correctly returned {len(data)} results (≤ 5)")
            return True
            
        except Exception as e:
            self.log_test("POST /api/search max 5 results", False, str(e))
            return False

    def test_search_relevance_threshold(self, search_data):
        """Test that all search results have relevance_score >= 0.2"""
        print(f"\n🔍 Testing Search Relevance Threshold (≥ 0.2)...")
        
        if not search_data:
            self.log_test("Search relevance threshold", False, "No search data available (previous test failed)")
            return False
        
        if len(search_data) == 0:
            self.log_test("Search relevance threshold", True, "No results to check threshold")
            return True
        
        # Check all scores are >= 0.2
        low_scores = []
        for i, result in enumerate(search_data):
            score = result['relevance_score']
            if score < 0.2:
                low_scores.append(f"Result {i}: {score}")
        
        if low_scores:
            details = f"Found results below 0.2 threshold: {low_scores}"
            self.log_test("Search relevance threshold", False, details)
            return False
        else:
            scores = [result['relevance_score'] for result in search_data]
            details = f"All {len(search_data)} results above 0.2 threshold. Scores: {scores}"
            self.log_test("Search relevance threshold", True, details)
            return True

    def test_retrieve_relevance_threshold(self):
        """Test that POST /api/retrieve also respects the 0.2 threshold"""
        print(f"\n🔍 Testing Retrieve Relevance Threshold (≥ 0.2)...")
        
        try:
            payload = {"query": "express middleware routing"}
            response = requests.post(f"{self.base_url}/api/retrieve", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test("POST /api/retrieve threshold check", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            try:
                data = response.json()
            except:
                self.log_test("POST /api/retrieve threshold check", False, "Response is not valid JSON")
                return False
            
            if 'results' not in data:
                self.log_test("POST /api/retrieve threshold check", False, f"Missing results field: {data}")
                return False
            
            results = data['results']
            if len(results) == 0:
                self.log_test("POST /api/retrieve threshold check", True, "No results to check threshold")
                return True
            
            # Check all scores are >= 0.2
            low_scores = []
            for i, result in enumerate(results):
                score = result['relevance_score']
                if score < 0.2:
                    low_scores.append(f"Result {i}: {score}")
            
            if low_scores:
                details = f"Found retrieve results below 0.2 threshold: {low_scores}"
                self.log_test("POST /api/retrieve threshold check", False, details)
                return False
            else:
                scores = [result['relevance_score'] for result in results]
                details = f"All {len(results)} retrieve results above 0.2 threshold. Scores: {scores}"
                self.log_test("POST /api/retrieve threshold check", True, details)
                return True
            
        except Exception as e:
            self.log_test("POST /api/retrieve threshold check", False, str(e))
            return False

    def run_all_tests(self):
        """Run all tests for new features including search endpoint"""
        print("=" * 70)
        print("🚀 Starting Backend Tests for NEW FEATURES + SEARCH ENDPOINT")
        print(f"🌐 Testing URL: {self.base_url}")
        print("=" * 70)
        
        # Test baseline functionality
        if not self.test_health_endpoint():
            print("❌ Health endpoint failed - backend may be down")
            return False
        
        # Test new info endpoint (should include /search)
        self.test_info_endpoint()
        
        # Test error handling still works
        self.test_ingest_repo_error_handling()
        
        # Test retrieve endpoint error handling
        print(f"\n🔧 Testing Retrieve Endpoint Error Handling...")
        self.test_retrieve_missing_query()
        self.test_retrieve_before_ingestion()
        
        # Test search endpoint error handling
        print(f"\n🔧 Testing Search Endpoint Error Handling...")
        self.test_search_missing_query()
        self.test_search_before_ingestion()
        
        # Test chat endpoint error handling
        print(f"\n🔧 Testing Chat Endpoint Error Handling...")
        self.test_chat_missing_question()
        self.test_chat_before_ingestion()
        
        # Test main new functionality (embeddings + retrieval + search)
        print(f"\n🔧 Testing New Embedding & Retrieval Features...")
        success, ingest_data = self.test_ingest_repo_with_embeddings()
        
        if success:
            # Test embedding count matches chunk count
            self.test_embedding_chunk_count_match(ingest_data)
            
            # Test retrieval functionality after ingestion
            print(f"\n🔧 Testing Retrieval After Ingestion...")
            retrieve_success, retrieve_data = self.test_retrieve_with_valid_query()
            
            if retrieve_success:
                # Test relevance scores are sorted
                self.test_relevance_scores_sorted(retrieve_data)
            
            # Test k parameter
            self.test_retrieve_with_k_parameter()
            
            # Test retrieve respects threshold
            self.test_retrieve_relevance_threshold()
            
            # Test search functionality after ingestion
            print(f"\n🔧 Testing Search Endpoint After Ingestion...")
            search_success, search_data = self.test_search_with_valid_query()
            
            if search_success:
                # Test search relevance threshold
                self.test_search_relevance_threshold(search_data)
            
            # Test search max results
            self.test_search_max_results()
            
            # Test full flow
            flow_success, flow_data = self.test_full_ingest_retrieve_flow()
            
            # Test chat functionality after ingestion
            print(f"\n🔧 Testing Chat Endpoint After Ingestion...")
            chat_success, chat_data = self.test_chat_with_valid_question_after_ingestion()
            
            if chat_success:
                # Test chat answer quality
                self.test_chat_answer_quality(chat_data)
                
                # Test referenced files validity
                self.test_chat_referenced_files_validity(chat_data)
            
        else:
            print("⚠️  Skipping retrieval, search and chat tests due to ingest failure")
        
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