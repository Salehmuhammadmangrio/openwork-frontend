import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store';
import { useForm } from '../../hooks';
import { Button, Card, Badge, Input, Textarea, Select, Avatar, Modal } from '../../components/common/UI';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function DashProfile() {
  const { user, updateUser, activeRole } = useAuthStore();
  const { values, handleChange, setValues } = useForm({
    fullName: user?.fullName || '', title: user?.title || '',
    email: user?.email || '', phone: user?.phone || '',
    bio: user?.bio || '', skills: user?.skills?.join(', ') || '',
    hourlyRate: user?.hourlyRate || '', location: user?.location || '',
    portfolioUrl: user?.portfolioUrl || '', experienceLevel: user?.experienceLevel || 'mid',
    languages: user?.languages?.join(', ') || '', availability: user?.availability || 'available',
    companyName: user?.companyName || '', companySize: user?.companySize || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [workHistory, setWorkHistory] = useState(user?.workHistory || []);
  const [education, setEducation] = useState(user?.education || []);
  const [certifications, setCertifications] = useState(user?.certifications || []);
  const [workModal, setWorkModal] = useState(false);
  const [eduModal, setEduModal] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [editingEdu, setEditingEdu] = useState(null);
  const fileRef = useRef();
  const canClient = user?.role === 'client' || user?.canActAsClient;
  const roleMode = activeRole || (canClient ? 'client' : 'freelancer');

  useEffect(() => {
    if (user) {
      setValues({
        fullName: user.fullName || '', title: user.title || '',
        email: user.email || '', phone: user.phone || '',
        bio: user.bio || '', skills: user.skills?.join(', ') || '',
        hourlyRate: user.hourlyRate || '', location: user.location || '',
        portfolioUrl: user.portfolioUrl || '', experienceLevel: user.experienceLevel || 'mid',
        languages: user.languages?.join(', ') || '', availability: user.availability || 'available',
        companyName: user.companyName || '', companySize: user.companySize || '',
      });
      setWorkHistory(user.workHistory || []);
      setEducation(user.education || []);
      setCertifications(user.certifications || []);
    }
  }, [user?._id]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        skills: values.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: values.languages.split(',').map(s => s.trim()).filter(Boolean),
        workHistory,
        education,
      };
      const { data } = await api.put('/users/profile', payload);
      updateUser(data.user);
      toast.success('Profile saved ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.put('/users/profile', { profileImage: data.url });
      updateUser({ profileImage: data.url });
      toast.success('Photo updated!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addWorkEntry = () => {
    setEditingWork({ company: '', position: '', startDate: '', endDate: '', description: '' });
    setWorkModal(true);
  };

  const saveWorkEntry = () => {
    if (!editingWork?.company || !editingWork?.position) {
      toast.error('Company and position are required');
      return;
    }
    if (editingWork._id) {
      setWorkHistory(workHistory.map(w => w._id === editingWork._id ? editingWork : w));
    } else {
      setWorkHistory([...workHistory, { ...editingWork, _id: Date.now() }]);
    }
    setWorkModal(false);
  };

  const deleteWorkEntry = (id) => {
    setWorkHistory(workHistory.filter(w => w._id !== id));
    toast.success('Work entry removed');
  };

  const addEduEntry = () => {
    setEditingEdu({ school: '', degree: '', field: '', graduationYear: '', description: '' });
    setEduModal(true);
  };

  const saveEduEntry = () => {
    if (!editingEdu?.school || !editingEdu?.degree) {
      toast.error('School and degree are required');
      return;
    }
    if (editingEdu._id) {
      setEducation(education.map(e => e._id === editingEdu._id ? editingEdu : e));
    } else {
      setEducation([...education, { ...editingEdu, _id: Date.now() }]);
    }
    setEduModal(false);
  };

  const deleteEduEntry = (id) => {
    setEducation(education.filter(e => e._id !== id));
    toast.success('Education entry removed');
  };

  return (
    <div className="animate-up" style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>My Profile</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Manage your professional profile</p></div>
        <Button variant="primary" size="sm" loading={saving} onClick={saveProfile}>Save Changes</Button>
      </div>

      {/* Banner + Avatar */}
      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <div style={{ height: 150, background: 'linear-gradient(135deg,rgba(108,78,246,.3),rgba(0,229,195,.18))', borderRadius: '16px 16px 0 0' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '1.75rem' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar user={user} size={76} radius="18px" style={{ border: '4px solid var(--bg)' }} />
            <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, background: 'var(--acc)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✏️</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: '0 0 16px 16px', padding: '3.5rem 1.75rem 1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {user?.isVerified && <Badge color="ok">✓ Email Verified</Badge>}
          <Badge color="info">{roleMode === 'client' ? '🏢 Client' : '🧑‍💻 Freelancer'}</Badge>
          {user?.certifications?.some(c => c.passed) && <Badge color="teal">🤖 AI Certified</Badge>}
        </div>
      </div>

      {/* Professional Stats */}
      {(roleMode === 'freelancer' || user?.role === 'freelancer') && (
        <Card style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Professional Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: '0.5rem' }}>Total Earned</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--acc2)' }}>${user?.totalEarned || 0}</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: '0.5rem' }}>Completed Jobs</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.completedJobs || 0}</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: '0.5rem' }}>Avg Rating</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warn)' }}>{user?.averageRating?.toFixed(1) || 'N/A'} ⭐</div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: '0.5rem' }}>AI Score</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ok)' }}>{user?.aiSkillScore || 0}%</div>
            </div>
          </div>
        </Card>
      )}

      {/* Personal Information */}
      <Card style={{ marginBottom: '1.25rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>👤 Personal Information</h3>
        <div className="grid-2">
          <Input label="Full Name" name="fullName" value={values.fullName} onChange={handleChange} />
          <Input label="Professional Title" name="title" value={values.title} onChange={handleChange} placeholder="e.g. Full Stack Developer" />
          <Input label="Email" type="email" name="email" value={values.email} onChange={handleChange} />
          <Input label="Phone" name="phone" value={values.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          <Input label="Location" name="location" value={values.location} onChange={handleChange} placeholder="City, Country" />
          <Select label="Availability" name="availability" value={values.availability} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </div>
        <Textarea label="Bio" name="bio" value={values.bio} onChange={handleChange} placeholder="Tell clients about yourself..." rows={3} />
      </Card>

      {/* Professional Details */}
      <Card style={{ marginBottom: '1.25rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>💼 Professional Details</h3>
        <div className="grid-2">
          <Input label="Hourly Rate ($)" type="number" name="hourlyRate" value={values.hourlyRate} onChange={handleChange} />
          <Select label="Experience Level" name="experienceLevel" value={values.experienceLevel} onChange={handleChange}>
            <option value="junior">Junior (0-2 years)</option>
            <option value="mid">Mid (2-5 years)</option>
            <option value="senior">Senior (5+ years)</option>
            <option value="expert">Expert (10+ years)</option>
          </Select>
        </div>
        <Input label="Skills (comma separated)" name="skills" value={values.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB, Python..." />
        <Input label="Languages (comma separated)" name="languages" value={values.languages} onChange={handleChange} placeholder="English, Spanish, French..." />
        <Input label="Portfolio URL" type="url" name="portfolioUrl" value={values.portfolioUrl} onChange={handleChange} placeholder="https://yourportfolio.dev" />
      </Card>

      {/* Client-specific fields */}
      {canClient && (
        <Card style={{ marginBottom: '1.25rem', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🏢 Company Information</h3>
          <div className="grid-2">
            <Input label="Company Name" name="companyName" value={values.companyName} onChange={handleChange} />
            <Input label="Company Size" name="companySize" value={values.companySize} onChange={handleChange} placeholder="1-10, 11-50, etc." />
          </div>
        </Card>
      )}

      {/* Work History */}
      <Card style={{ marginBottom: '1.25rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>💼 Work History</h3>
          <Button size="xs" variant="primary" onClick={addWorkEntry}>+ Add</Button>
        </div>
        {workHistory.length === 0 ? (
          <p style={{ color: 'var(--txt3)', fontSize: '0.875rem' }}>No work history yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {workHistory.map((work, idx) => (
              <div key={work._id} style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{work.position}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--txt2)' }}>{work.company}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="xs" variant="ghost" onClick={() => { setEditingWork(work); setWorkModal(true); }}>✏️</Button>
                    <Button size="xs" variant="ghost" onClick={() => deleteWorkEntry(work._id)}>🗑️</Button>
                  </div>
                </div>
                {work.startDate && <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>{work.startDate}{work.endDate ? ` - ${work.endDate}` : ' - Present'}</div>}
                {work.description && <div style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginTop: '0.5rem' }}>{work.description}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Education */}
      <Card style={{ marginBottom: '1.25rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🎓 Education</h3>
          <Button size="xs" variant="primary" onClick={addEduEntry}>+ Add</Button>
        </div>
        {education.length === 0 ? (
          <p style={{ color: 'var(--txt3)', fontSize: '0.875rem' }}>No education info yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {education.map((edu) => (
              <div key={edu._id} style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--txt2)' }}>{edu.school}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="xs" variant="ghost" onClick={() => { setEditingEdu(edu); setEduModal(true); }}>✏️</Button>
                    <Button size="xs" variant="ghost" onClick={() => deleteEduEntry(edu._id)}>🗑️</Button>
                  </div>
                </div>
                {edu.graduationYear && <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Graduated {edu.graduationYear}</div>}
                {edu.description && <div style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginTop: '0.5rem' }}>{edu.description}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Certifications */}
      {certifications.length > 0 && (
        <Card style={{ marginBottom: '1.25rem', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🏆 Certifications & Skills Tests</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {certifications.map((cert, idx) => (
              <div key={idx} style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cert.name || cert.topic}</div>
                  {cert.passedDate && <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>Passed: {new Date(cert.passedDate).toLocaleDateString()}</div>}
                </div>
                {cert.passed && <Badge color="ok">✓ Passed</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Work History Modal */}
      <Modal isOpen={workModal} onClose={() => setWorkModal(false)} title="Add Work Experience">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Company"
            value={editingWork?.company || ''}
            onChange={(e) => setEditingWork({ ...editingWork, company: e.target.value })}
            placeholder="Company name"
          />
          <Input
            label="Position"
            value={editingWork?.position || ''}
            onChange={(e) => setEditingWork({ ...editingWork, position: e.target.value })}
            placeholder="Job title"
          />
          <div className="grid-2">
            <Input
              label="Start Date"
              type="month"
              value={editingWork?.startDate || ''}
              onChange={(e) => setEditingWork({ ...editingWork, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="month"
              value={editingWork?.endDate || ''}
              onChange={(e) => setEditingWork({ ...editingWork, endDate: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            value={editingWork?.description || ''}
            onChange={(e) => setEditingWork({ ...editingWork, description: e.target.value })}
            placeholder="What did you do?"
            rows={3}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" full onClick={saveWorkEntry}>Save</Button>
            <Button variant="ghost" full onClick={() => setWorkModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Education Modal */}
      <Modal isOpen={eduModal} onClose={() => setEduModal(false)} title="Add Education">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="School/University"
            value={editingEdu?.school || ''}
            onChange={(e) => setEditingEdu({ ...editingEdu, school: e.target.value })}
            placeholder="Institution name"
          />
          <Input
            label="Degree"
            value={editingEdu?.degree || ''}
            onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })}
            placeholder="Bachelor, Master, etc."
          />
          <div className="grid-2">
            <Input
              label="Field of Study"
              value={editingEdu?.field || ''}
              onChange={(e) => setEditingEdu({ ...editingEdu, field: e.target.value })}
              placeholder="Computer Science"
            />
            <Input
              label="Graduation Year"
              type="number"
              value={editingEdu?.graduationYear || ''}
              onChange={(e) => setEditingEdu({ ...editingEdu, graduationYear: e.target.value })}
              placeholder="2023"
            />
          </div>
          <Textarea
            label="Description"
            value={editingEdu?.description || ''}
            onChange={(e) => setEditingEdu({ ...editingEdu, description: e.target.value })}
            placeholder="Additional details"
            rows={3}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" full onClick={saveEduEntry}>Save</Button>
            <Button variant="ghost" full onClick={() => setEduModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
  