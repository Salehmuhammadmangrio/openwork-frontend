# AI Service Usage Documentation - Client2

This document provides a detailed breakdown of all AI service usage throughout the client2 application, including page names, component names, and specific implementation details.

---

## Overview

The client2 application uses the centralized `aiService` utility located at `src/utils/aiService.js` to interact with the backend AI endpoints. The AI service is powered by the openwork-ai-service deployed on Hugging Face.

---

## AI Service Utility

**File:** `src/utils/aiService.js`

This is the central AI service utility that provides all AI-powered features. It exports the following methods:

| Method | Endpoint | Purpose | HTTP Method |
|--------|----------|---------|-------------|
| `chat(messages, context)` | `/ai/chat` | Career assistant chat | POST |
| `generateProposal(jobId)` | `/ai/proposal/:jobId` | Generate job proposals | POST |
| `getJobMatch(jobId)` | `/ai/job-match/:jobId` | Calculate job match score | GET |
| `getJobRecommendations(limit)` | `/ai/recommendations` | Get job recommendations | GET |
| `generateSkillTest(topic, level)` | `/ai/skill-test/generate` | Generate skill test questions | POST |
| `evaluateSkillTest(topic, questions)` | `/ai/skill-test/evaluate` | Evaluate skill test answers | POST |
| `detectFraud(loginPatterns, bidAmounts, responseTimes)` | `/ai/fraud-detect` | Detect fraudulent activity | POST |
| `getSkillSuggestions(category, query)` | `/ai/skill-suggestions` | Get skill suggestions | POST |
| `moderate(message)` | `/ai/moderate` | Moderate messages | POST |

---

## AI Service Usage in Pages/Components

### 1. AI Assistant Page

**File:** `src/pages/AIAssistant.jsx`
**Component:** `AIAssistant`
**Lines:** 150

**AI Service Used:** `aiService.chat()`

**Implementation Details:**
```javascript
const data = await aiService.chat(history, { userContext: systemContext });
```

**Context Provided:**
- User's full name
- User's role (freelancer/client)
- User's skills
- User's AI skill score
- User's location

**Purpose:** Provides an AI-powered career assistant that can help with:
- Writing compelling proposals
- Pricing strategy and rate negotiation
- Personalized skill gap analysis
- Job matching and career advice
- Profile optimization tips
- Dispute resolution guidance
- Invoicing and contracts

**UI Elements:**
- Chat interface with message history
- Quick actions sidebar with job-based prompts
- Fallback mechanism when AI service is unavailable
- Typing indicator during AI processing

---

### 2. Dashboard Skill Tests Page

**File:** `src/pages/dashboard/DashSkillTests.jsx`
**Component:** `DashSkillTests`
**Lines:** 53, 97

**AI Services Used:**
1. `aiService.generateSkillTest(topicKey, difficulty)` (Line 53)
2. `aiService.evaluateSkillTest(topic, questions)` (Line 97)

#### 2.1 Generate Skill Test

**Implementation Details:**
```javascript
const data = await aiService.generateSkillTest(topicKey, difficulty);
setTestQuestions(data.questions || []);
```

**Parameters:**
- `topicKey`: Skill topic (e.g., 'pythonML', 'nodejs', 'typescript')
- `difficulty`: Test difficulty level ('easy', 'medium', 'hard')

**Available Topics:**
- Mobile Development (📱) - 8 points
- Python & ML (🐍) - 10 points
- Node.js & Express (🌐) - 8 points
- JavaScript ES6+ (📜) - 7 points
- TypeScript Advanced (📘) - 9 points
- SQL & Databases (🗄️) - 8 points
- DevOps & Cloud (☁️) - 10 points
- English Proficiency (🗣️) - 5 points

**Purpose:** Generates AI-evaluated multiple-choice skill tests to certify freelancer skills and boost their AI score.

#### 2.2 Evaluate Skill Test

**Implementation Details:**
```javascript
const data = await aiService.evaluateSkillTest(
  topicData?.name || selectedTopic, 
  testQuestions.map((q, idx) => ({
    question: q.question,
    correct_answer: q.correct_answer,
    user_answer: formattedAnswers[idx]
  }))
);
```

**Parameters:**
- `topic`: Topic name (e.g., 'Python & ML')
- `questions`: Array of question objects with:
  - `question`: Question text
  - `correct_answer`: Correct answer
  - `user_answer`: User's selected answer

**Response Handling:**
- Updates user's AI skill score if passed (60%+)
- Shows pass/fail status with feedback
- Awards AI score points for successful certification

**UI Elements:**
- Skill topic selection grid with icons
- Multiple-choice question interface
- Progress bar during test
- Results display with score breakdown
- Certification history list
- AI score history chart

---

### 3. Job Detail Page

**File:** `src/pages/JobDetail.jsx`
**Component:** `JobDetail`
**Lines:** 43-50

**AI Service Used:** `aiService.generateProposal(id)`

**Implementation Details:**
```javascript
const handleAIProposal = async () => {
  setAiLoading(true);
  try {
    const data = await aiService.generateProposal(id);
    setCover(data.proposal?.generatedText || data.proposal || '');
    toast.success('AI proposal ready! ✨');
  } catch { toast.error('AI unavailable'); } 
  finally { setAiLoading(false); }
};
```

**Parameters:**
- `id`: Job ID from URL params

**Purpose:** Automatically generates a compelling proposal for the current job based on:
- Job description
- Job requirements
- Freelancer's profile
- Freelancer's skills
- Freelancer's AI score

**UI Elements:**
- "🤖 AI Write" button in the proposal submission modal
- Loading state during AI generation
- Toast notification on success/failure
- Generated proposal text populated in cover letter textarea

**Location:** Proposal submission modal triggered by "Apply Now" button

---

### 4. Browse Jobs Page

**File:** `src/pages/BrowseJobs.jsx`
**Component:** `ApplyModal` (nested component)
**Lines:** 22-32

**AI Service Used:** `aiService.generateProposal(job._id)`

**Implementation Details:**
```javascript
const handleAIWrite = async () => {
  setAiLoading(true);
  try {
    const data = await aiService.generateProposal(job._id);
    setCover(data.proposal?.generatedText || data.proposal || '');
    setIsAIGenerated(true);
    toast.success('AI proposal generated! ✨');
  } catch {
    toast.error('AI unavailable — try again');
  } finally { setAiLoading(false); }
};
```

**Parameters:**
- `job._id`: Job ID from the job object

**Purpose:** Generates AI-powered proposals for jobs from the browse jobs list, enabling freelancers to quickly create tailored proposals without leaving the job browsing experience.

**UI Elements:**
- "🤖 AI Write" button in the ApplyModal
- Loading state during AI generation
- Toast notification on success/failure
- Flag to track if proposal was AI-generated
- Generated proposal text populated in cover letter textarea

**Location:** ApplyModal component, accessed from job cards in the browse jobs list

---

## AI Service Hook

**File:** `src/hooks/useAI.js`
**Component:** `useAI` (React hook)

This is a React hook wrapper around the aiService utility that provides:
- Loading state management
- Error state management
- Consistent error handling

**Available Methods:**
- `chat(messages, context)`
- `generateProposal(jobId)`
- `getJobMatch(jobId)`
- `getJobRecommendations(limit)`
- `generateSkillTest(topic, level)`
- `evaluateSkillTest(topic, questions)`
- `detectFraud(loginPatterns, bidAmounts, responseTimes)`
- `getSkillSuggestions(category, query)`

**Current Usage Status:** 
- The hook is defined and exported from `src/hooks/index.js`
- Currently **NOT USED** in any pages/components
- All current implementations use the `aiService` directly

**Recommendation:** Consider using this hook in future AI feature implementations for better state management and consistency.

---

## AI Endpoints Not Currently Used in Client2

The following AI service methods are available but not currently used in the client2 application:

| Method | Endpoint | Potential Use Case |
|--------|----------|-------------------|
| `getJobMatch(jobId)` | `/ai/job-match/:jobId` | Display job match score on job detail pages |
| `getJobRecommendations(limit)` | `/ai/recommendations` | Personalized job recommendations on dashboard |
| `detectFraud()` | `/ai/fraud-detect` | Backend fraud detection (admin use) |
| `getSkillSuggestions()` | `/ai/skill-suggestions` | Skill suggestions in profile editor |
| `moderate(message)` | `/ai/moderate` | Message moderation in chat system |

---

## Backend Integration

All AI service calls are proxied through the Node.js server located in the `server` directory:

**Server AI Service:** `server/src/services/aiService.js`
**Server Routes:** `server/src/routes/ai.js`
**Server Controllers:** `server/src/controllers/aiController.js`

The server forwards requests to the openwork-ai-service deployed on Hugging Face, configured via the `PYTHON_AI_SERVICE_URL` environment variable.

---

## Configuration

**Environment Variable:** `PYTHON_AI_SERVICE_URL`

This should be set in the server's `.env` file to point to the deployed openwork-ai-service Hugging Space URL.

Example:
```
PYTHON_AI_SERVICE_URL=https://<your-hugging-space-url>
```

---

## Summary

**Total AI Service Implementations in Client2:** 4

| Page/Component | AI Service Method | Purpose |
|----------------|-------------------|---------|
| AIAssistant.jsx | `chat()` | Career assistant chat |
| DashSkillTests.jsx | `generateSkillTest()` | Generate skill test questions |
| DashSkillTests.jsx | `evaluateSkillTest()` | Evaluate skill test answers |
| JobDetail.jsx | `generateProposal()` | Generate job proposals |
| BrowseJobs.jsx (ApplyModal) | `generateProposal()` | Generate job proposals |

**Status:** All AI service implementations have been updated to use the centralized `aiService` utility for consistency and maintainability.

---

## Last Updated

**Date:** April 22, 2026
**Updated By:** Cascade AI Assistant
**Changes:**
- Updated all AI service calls to use centralized `aiService` utility
- Fixed HTTP method mismatches (GET → POST for skill-test/generate and skill-suggestions)
- Added moderation endpoint to aiService
- Ensured all endpoints align with openwork-ai-service API format
