/**
 * useAI Hook
 * React hook for AI-powered features
 */

import { useState } from 'react';
import aiService from '../utils/aiService';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const chat = async (messages, context = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.chat(messages, context);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateProposal = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.generateProposal(jobId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getJobMatch = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.getJobMatch(jobId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getJobRecommendations = async (limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.getJobRecommendations(limit);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateSkillTest = async (topic, level = 'easy') => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.generateSkillTest(topic, level);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const evaluateSkillTest = async (topic, questions) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.evaluateSkillTest(topic, questions);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const detectFraud = async (loginPatterns, bidAmounts, responseTimes) => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.detectFraud(loginPatterns, bidAmounts, responseTimes);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSkillSuggestions = async (category = '', query = '') => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiService.getSkillSuggestions(category, query);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    chat,
    generateProposal,
    getJobMatch,
    getJobRecommendations,
    generateSkillTest,
    evaluateSkillTest,
    detectFraud,
    getSkillSuggestions,
  };
}

export default useAI;
