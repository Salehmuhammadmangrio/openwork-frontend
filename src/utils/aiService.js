/**
 * AI Service Hook
 * Provides easy access to AI-powered features throughout the app
 */

import api from './api';
import toast from 'react-hot-toast';

export const aiService = {
  /**
   * Chat with AI assistant
   */
  async chat(messages, context = {}) {
    try {
      const { data } = await api.post('/ai/chat', {
        messages,
        ...context,
      }, { meta: { skipAuthRedirect: true } });
      return data;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  },

  /**
   * Generate a proposal
   */
  async generateProposal(jobId) {
    try {
      const { data } = await api.post(`/ai/proposal/${jobId}`);
      return data;
    } catch (error) {
      console.error('Proposal Generation Error:', error);
      toast.error('Failed to generate proposal');
      throw error;
    }
  },

  /**
   * Calculate job match
   */
  async getJobMatch(jobId) {
    try {
      const { data } = await api.get(`/ai/job-match/${jobId}`);
      return data;
    } catch (error) {
      console.error('Job Match Error:', error);
      throw error;
    }
  },

  /**
   * Get job recommendations
   */
  async getJobRecommendations(limit = 10) {
    try {
      const { data } = await api.get('/ai/recommendations', {
        params: { limit },
      });
      return data;
    } catch (error) {
      console.error('Job Recommendations Error:', error);
      throw error;
    }
  },

  /**
   * Generate skill test questions
   */
  async generateSkillTest(topic, level = 'easy') {
    try {
      const { data } = await api.get('/ai/skill-test/generate', {
        params: { topic, level },
      });
      return data;
    } catch (error) {
      console.error('Skill Test Generation Error:', error);
      toast.error('Failed to generate skill test');
      throw error;
    }
  },

  /**
   * Evaluate skill test answers
   */
  async evaluateSkillTest(topic, questions) {
    try {
      const { data } = await api.post('/ai/skill-test/evaluate', {
        topic,
        questions,
      });
      return data;
    } catch (error) {
      console.error('Skill Test Evaluation Error:', error);
      toast.error('Failed to evaluate skill test');
      throw error;
    }
  },

  /**
   * Detect fraudulent activity
   */
  async detectFraud(loginPatterns = [], bidAmounts = [], responseTimes = []) {
    try {
      const { data } = await api.post('/ai/fraud-detect', {
        loginPatterns,
        bidAmounts,
        responseTimes,
      });
      return data;
    } catch (error) {
      console.error('Fraud Detection Error:', error);
      throw error;
    }
  },

  /**
   * Get skill suggestions
   */
  async getSkillSuggestions(category = '', query = '') {
    try {
      const { data } = await api.get('/ai/skill-suggestions', {
        params: { category, query },
      });
      return data;
    } catch (error) {
      console.error('Skill Suggestions Error:', error);
      throw error;
    }
  },
};

export default aiService;
