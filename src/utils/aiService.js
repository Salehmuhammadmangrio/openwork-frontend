/**
 * AI Service Hook - Production Grade
 * 
 * Features:
 * - Extended timeout (180s) for slow HuggingFace Spaces responses
 * - Proper error handling with user-friendly messages
 * - Request tracking and logging
 * - Fallback support when AI service is unavailable
 */

import api from './api';
import toast from 'react-hot-toast';

// Configuration
const AI_REQUEST_TIMEOUT_MS = 180000; // 180 seconds (3 minutes) for slow HF Spaces
const AI_HEALTH_TIMEOUT_MS = 180000; // 180 seconds - health check also needs HF cold start time
const AI_RETRY_DELAY_MS = 1000; // 1 second between retries

/**
 * Make AI request with timeout and error handling
 */
const makeAIRequest = async (method, endpoint, data = null, options = {}) => {
  const startTime = Date.now();
  const timeoutMs = options.timeout || AI_REQUEST_TIMEOUT_MS;
  
  try {
    console.log(`📡 [AI] ${method.toUpperCase()} ${endpoint} (timeout: ${(timeoutMs / 1000).toFixed(0)}s)`);
    
    let response;
    if (method === 'post') {
      response = await api.post(endpoint, data, {
        timeout: timeoutMs,
        meta: { skipAuthRedirect: true },
        ...options,
      });
    } else if (method === 'get') {
      response = await api.get(endpoint, {
        timeout: timeoutMs,
        meta: { skipAuthRedirect: true },
        ...options,
      });
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [AI] Request succeeded (${duration}ms)`, response.data);
    
    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ [AI] Request failed after ${duration}ms`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Status: ${error.response?.status || 'N/A'}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    // Enhanced error handling
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.userMessage = `Request timed out after ${duration / 1000 >> 0} seconds. The AI service may be slow or offline.`;
    } else if (error.response?.status === 429) {
      error.userMessage = 'Rate limited. Please try again in a moment.';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'AI service is experiencing issues. Please try again shortly.';
    } else if (!error.response) {
      error.userMessage = 'Network error. Check your connection and try again.';
    } else {
      error.userMessage = error.response?.data?.message || 'AI request failed. Please try again.';
    }
    
    throw error;
  }
};

export const aiService = {
  /**
   * Chat with AI assistant
   * 
   * Timeout: 180 seconds (HuggingFace Spaces cold start)
   */
  async chat(messages, context = {}) {
    return makeAIRequest('post', '/ai/chat', {
      messages,
      ...context,
    }, {
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
  },

  /**
   * Generate a proposal
   * 
   * Timeout: 180 seconds
   */
  async generateProposal(jobId) {
    try {
      const data = await makeAIRequest('post', `/ai/proposal/${jobId}`, {}, {
        timeout: AI_REQUEST_TIMEOUT_MS,
      });
      return data;
    } catch (error) {
      toast.error(error.userMessage || 'Failed to generate proposal');
      throw error;
    }
  },

  /**
   * Calculate job match
   * 
   * Timeout: 180 seconds
   */
  async getJobMatch(jobId) {
    try {
      const data = await makeAIRequest('get', `/ai/job-match/${jobId}`, null, {
        timeout: AI_REQUEST_TIMEOUT_MS,
      });
      return data;
    } catch (error) {
      console.error('Job match error:', error.userMessage);
      throw error;
    }
  },

  /**
   * Get job recommendations
   * 
   * Timeout: 180 seconds
   */
  async getJobRecommendations(limit = 10) {
    try {
      const data = await makeAIRequest('get', '/ai/recommendations', null, {
        timeout: AI_REQUEST_TIMEOUT_MS,
        params: { limit },
      });
      return data;
    } catch (error) {
      console.error('Recommendations error:', error.userMessage);
      throw error;
    }
  },

  /**
   * Generate skill test questions
   * 
   * Timeout: 180 seconds
   */
  async generateSkillTest(topic, level = 'easy') {
    try {
      const data = await makeAIRequest('post', '/ai/skill-test/generate', {
        topic,
        level,
      }, {
        timeout: AI_REQUEST_TIMEOUT_MS,
      });
      return data;
    } catch (error) {
      toast.error(error.userMessage || 'Failed to generate skill test');
      throw error;
    }
  },

  /**
   * Evaluate skill test answers
   * 
   * Timeout: 30 seconds (local evaluation)
   */
  async evaluateSkillTest(topic, questions) {
    try {
      const data = await makeAIRequest('post', '/ai/skill-test/evaluate', {
        topic,
        questions,
      }, {
        timeout: 30000, // Shorter timeout for evaluation
      });
      return data;
    } catch (error) {
      toast.error(error.userMessage || 'Failed to evaluate skill test');
      throw error;
    }
  },

  /**
   * Detect fraudulent activity
   * 
   * Timeout: 180 seconds
   */
  async detectFraud(loginPatterns = [], bidAmounts = [], responseTimes = []) {
    try {
      const data = await makeAIRequest('post', '/ai/fraud-detect', {
        loginPatterns,
        bidAmounts,
        responseTimes,
      }, {
        timeout: AI_REQUEST_TIMEOUT_MS,
      });
      return data;
    } catch (error) {
      console.error('Fraud detection error:', error.userMessage);
      throw error;
    }
  },

  /**
   * Get skill suggestions
   * 
   * Timeout: 180 seconds
   */
  async getSkillSuggestions(category = '', query = '') {
    try {
      const data = await makeAIRequest('post', '/ai/skill-suggestions', {
        category,
        query,
      }, {
        timeout: AI_REQUEST_TIMEOUT_MS,
      });
      return data;
    } catch (error) {
      console.error('Skill suggestions error:', error.userMessage);
      throw error;
    }
  },

  /**
   * Moderate message
   * 
   * Timeout: 60 seconds
   */
  async moderate(message) {
    try {
      const data = await makeAIRequest('post', '/ai/moderate', {
        message,
      }, {
        timeout: 60000,
      });
      return data;
    } catch (error) {
      console.error('Moderation error:', error.userMessage);
      throw error;
    }
  },

  /**
   * Health check
   * 
   * Timeout: 180 seconds (needs HF Spaces cold start time: 60-90s)
   */
  async health() {
    try {
      const data = await makeAIRequest('get', '/ai/health', null, {
        timeout: AI_HEALTH_TIMEOUT_MS,
      });
      return data;
    } catch (error) {
      console.error('Health check error:', error.userMessage);
      throw error;
    }
  },
};


export default aiService;
