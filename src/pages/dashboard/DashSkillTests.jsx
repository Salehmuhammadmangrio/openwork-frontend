import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuthStore } from '../../store';
import { useFetch } from '../../hooks';
import { Button, Card, Badge, ProgressBar } from '../../components/common/UI';
import { formatDate } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

const CD = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
  },
};


const SKILL_TOPICS = [
  { key: 'mobiledevelopment', name: 'Mobile Development', icon: '📱', pts: 8 },
  { key: 'pythonML', name: 'Python & ML', icon: '🐍', pts: 10 },
  { key: 'nodejs', name: 'Node.js & Express', icon: '🌐', pts: 8 },
  { key: 'javascript', name: 'JavaScript ES6+', icon: '📜', pts: 7 },
  { key: 'typescript', name: 'TypeScript Advanced', icon: '📘', pts: 9 },
  { key: 'sql', name: 'SQL & Databases', icon: '🗄️', pts: 8 },
  { key: 'devops', name: 'DevOps & Cloud', icon: '☁️', pts: 10 },
  { key: 'english', name: 'English Proficiency', icon: '🗣️', pts: 5 },
];

export default function DashSkillTests() {
  const { user, updateUser } = useAuthStore();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testLoaded, setTestLoaded] = useState(false);
  const { data: certData, refetch } = useFetch('/skill-tests/certifications');
  const certs = certData?.certifications || user?.certifications || [];

  const startTest = async (topicKey) => {
    setSelectedTopic(topicKey);
    setLoading(true);
    try {
      const { data } = await api.get('/ai/skill-test/generate', {
        params: { topic: topicKey, level: difficulty }
      });
      console.log('Generated Test Questions:', JSON.stringify(data));

      setTestQuestions(data.questions || []);
      setTestLoaded(true);
      setQIndex(0);
      setAnswers(new Array(data.questions?.length || 0).fill(undefined));
      setShowResult(false);
      setResult(null);
    } catch (err) {
      console.error('Failed to generate test:', err);
      toast.error('Failed to load questions. Please try again.');
      setSelectedTopic(null);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (idx) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = idx;
    setAnswers(newAnswers);
  };

  const nextQuestion = async () => {
    if (qIndex < testQuestions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // Submit test
      await submitTest();
    }
  };

  const submitTest = async () => {
    setLoading(true);
    try {
      const topicData = SKILL_TOPICS.find(t => t.key === selectedTopic);

      // Format answers correctly - map indices to actual answer values
      const formattedAnswers = answers.map((ansIdx, qIdx) => {
        if (ansIdx !== undefined && testQuestions[qIdx]?.options[ansIdx]) {
          return testQuestions[qIdx].options[ansIdx];
        }
        return null;
      });

      const { data } = await api.post('/ai/skill-test/evaluate', {
        topic: topicData?.name || selectedTopic,
        questions: testQuestions.map((q, idx) => ({
          question: q.question,
          correct_answer: q.correct_answer,
          user_answer: formattedAnswers[idx]
        }))
      });

      setResult(data.result);
      setShowResult(true);

      if (data.result?.passed) {
        updateUser({ aiSkillScore: data.result.aiScore });
        refetch();
        toast.success(`🎉 Certified in ${topicData?.name}! +${data.result.aiScoreIncrease} AI points`);
      } else {
        toast.success(`Score: ${data.result?.percentage?.toFixed(0)}%. Need 60% to pass.`);
      }
    } catch (err) {
      console.error('Failed to evaluate test:', err);
      toast.error('Failed to submit test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const topicData = SKILL_TOPICS.find(t => t.key === selectedTopic);
  const currentQ = testQuestions[qIndex];
  const pct = testQuestions.length > 0 ? Math.round(((qIndex + 1) / testQuestions.length) * 100) : 0;

  return (
    <div className="animate-up">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🧠 AI Skill Certification</h1>
        <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Pass AI-evaluated tests to boost your score and visibility</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Test Area */}
        <Card>
          {!selectedTopic && !showResult && (
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Choose a Skill to Certify</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--txt2)', marginBottom: '1.25rem' }}>Pass AI-evaluated tests to boost your profile ranking.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {SKILL_TOPICS.map((t) => (
                  <div key={t.key} onClick={() => startTest(t.key)} style={{ padding: '1rem', borderRadius: 11, background: 'var(--s2)', border: '1px solid var(--b1)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, opacity: loading ? 0.6 : 1, textAlign: 'center' }}
                    onMouseEnter={e => !loading && (e.currentTarget.style.borderColor = 'rgba(108,78,246,.4)')}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}>
                    <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>AI-Generated · Worth +{t.pts} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTopic && testLoaded && !showResult && currentQ && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--acc)' }}>{topicData?.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>Q{qIndex + 1}/{testQuestions.length}</span>
              </div>
              <ProgressBar value={pct} style={{ marginBottom: '1.75rem' }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.4rem', lineHeight: 1.5 }}>{currentQ.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentQ.options?.map((opt, i) => (
                  <div key={i} onClick={() => selectAnswer(i)}
                    style={{ padding: '0.9rem 1.1rem', borderRadius: 11, border: `1px solid ${answers[qIndex] === i ? 'var(--acc)' : 'var(--b1)'}`, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 9, color: answers[qIndex] === i ? '#A78BFA' : 'var(--txt)', background: answers[qIndex] === i ? 'rgba(108,78,246,.1)' : 'var(--s2)' }}>
                    <span style={{ width: 26, height: 26, background: 'var(--s3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono,monospace', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{'ABCD'[i]}</span>
                    {opt}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTopic(null); setTestLoaded(false); }} disabled={loading}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={nextQuestion} disabled={answers[qIndex] === undefined || loading} loading={loading}>
                  {qIndex < testQuestions.length - 1 ? 'Next →' : 'Submit Test'}
                </Button>
              </div>
            </div>
          )}

          {loading && selectedTopic && !testLoaded && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
              <p style={{ color: 'var(--txt2)' }}>Generating your personalized test...</p>
            </div>
          )}

          {showResult && result && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--s2)', border: `4px solid ${result.passed ? 'var(--ok)' : 'var(--err)'}`, boxShadow: `0 0 24px ${result.passed ? 'rgba(0,229,160,.25)' : 'rgba(255,77,106,.25)'}` }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.75rem', fontWeight: 800, color: result.passed ? 'var(--ok)' : 'var(--err)' }}>{result.score}/{result.total}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{result.percentage?.toFixed(0)}%</div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{result.passed ? '🎉 Certified!' : '📚 Keep Practicing'}</h3>
              <p style={{ fontSize: '0.845rem', color: 'var(--txt2)', marginBottom: '1.25rem' }}>
                {result.passed ? `Passed ${topicData?.name}! +${result.aiScoreIncrease} AI score points.` : `Scored ${result.percentage?.toFixed(0)}%. Need 60% to pass.`}
              </p>
              {result.feedback && <p style={{ fontSize: '0.8rem', color: 'var(--txt3)', marginBottom: '1.25rem', fontStyle: 'italic' }}>{result.feedback}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Button variant="secondary" size="sm" onClick={() => { setSelectedTopic(null); setTestLoaded(false); }}>Choose Another</Button>
                {!result.passed && <Button variant="primary" size="sm" onClick={() => startTest(selectedTopic)}>Retry</Button>}
              </div>
            </div>
          )}
        </Card>

        {/* Certifications + Score Chart */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.875rem' }}>Your Certifications</h3>
          <div style={{ marginBottom: '1.25rem' }}>
            {certs.length > 0 ? certs.map((c, i) => (
              <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 11, padding: '0.875rem', display: 'flex', alignItems: 'center', gap: 11, marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{c.skill?.includes('React') ? '⚛️' : c.skill?.includes('Python') ? '🐍' : c.skill?.includes('Node') ? '🌐' : c.skill?.includes('TypeScript') ? '📘' : '🧠'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.845rem', fontWeight: 700 }}>{c.skill}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>{formatDate(c.takenAt)} · {c.score}/{c.total}</div>
                </div>
                <Badge color={c.passed ? 'ok' : 'warn'}>{c.passed ? '✓ Certified' : 'Failed'}</Badge>
              </div>
            )) : (
              <div style={{ background: 'var(--s2)', borderRadius: 11, padding: '1rem', textAlign: 'center', color: 'var(--txt3)', fontSize: '0.845rem' }}>No certifications yet. Take a test to get started!</div>
            )}
          </div>

          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>AI Score History</h3>
            <div style={{ height: 160 }}>
              <Line data={{
                labels: ['Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{ data: [72, 78, 84, user?.aiSkillScore || 87], borderColor: '#00E5C3', backgroundColor: 'rgba(0,229,195,.08)', tension: 0.4, fill: true, pointBackgroundColor: '#00E5C3', pointRadius: 4 }],
              }} options={{ ...CD, scales: { ...CD.scales, y: { ...CD.scales.y, min: 60, max: 100 } } }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '1.5rem', fontWeight: 700, color: 'var(--acc)' }}>{user?.aiSkillScore || 0}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginLeft: 5 }}>/ 100 AI Score</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}