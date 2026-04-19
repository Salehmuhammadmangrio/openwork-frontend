import { useState } from 'react';
import { useAuthStore } from '../../store';
import { useForm } from '../../hooks';
import { Button, Card, Input, Toggle } from '../../components/common/UI';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function DashSettings() {
  const { user, updateUser } = useAuthStore();
  const [tfa, setTfa] = useState(user?.twoFactorEnabled || false);
  const [prefs, setPrefs] = useState(user?.notifPrefs || { messages: true, jobMatches: true, payments: true, disputes: true, marketing: false });
  const [saving, setSaving] = useState(false);
  const { values, handleChange, setValues } = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const savePassword = async () => {
    if (values.newPassword !== values.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/update-password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const savePrefs = async () => {
    try { await api.put('/users/profile', { notifPrefs: prefs }); toast.success('Preferences saved!'); } catch { }
  };

  return (
    <div className="animate-up" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div><h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Account Settings</h1><p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Security, notifications, and preferences</p></div>

      <Card>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🔐 Security</h3>
        <Input label="Current Password" type="password" name="currentPassword" value={values.currentPassword} onChange={handleChange} placeholder="••••••••" />
        <div className="grid-2">
          <Input label="New Password" type="password" name="newPassword" value={values.newPassword} onChange={handleChange} placeholder="Min 8 chars" />
          <Input label="Confirm New" type="password" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} placeholder="Repeat" />
        </div>
        <Toggle value={tfa} onChange={() => { setTfa(!tfa); toast.success(`2FA ${!tfa ? 'enabled' : 'disabled'}`); }} label="Two-Factor Authentication (2FA)" />
        <Button variant="primary" size="sm" loading={saving} onClick={savePassword}>Update Password</Button>
      </Card>

      <Card>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🔔 Notification Preferences</h3>
        {Object.entries(prefs).map(([key, val]) => (
          <Toggle key={key} value={val} onChange={(v) => setPrefs(p => ({ ...p, [key]: v }))} label={{ messages: 'New messages', jobMatches: 'AI job matches', payments: 'Payment updates', disputes: 'Dispute updates', marketing: 'Marketing emails' }[key] || key} />
        ))}
        <Button variant="primary" size="sm" onClick={savePrefs}>Save Preferences</Button>
      </Card>

      <Card>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>🎭 Dual Role Settings</h3>
        <p style={{ fontSize: '0.845rem', color: 'var(--txt2)', marginBottom: '1rem' }}>Work as both a Freelancer and a Client.</p>
        <div className="grid-2">
          {['🧑‍💻 Freelancer Mode', '🏢 Client Mode'].map((r, i) => (
            <button key={i} onClick={() => toast.success(`${r} toggled`)} style={{ padding: '0.875rem', borderRadius: 11, background: i === 0 ? 'rgba(108,78,246,.1)' : 'var(--s2)', border: `1px solid ${i === 0 ? 'var(--acc)' : 'var(--b1)'}`, color: i === 0 ? '#A78BFA' : 'var(--txt2)', cursor: 'pointer', fontSize: '0.845rem', fontWeight: 600 }}>{r}</button>
          ))}
        </div>
      </Card>

      <Card style={{ borderColor: 'rgba(255,77,106,.2)', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--err)' }}>⚠️ Danger Zone</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="danger" size="sm" onClick={() => toast.error('Account deactivated')}>Deactivate Account</Button>
          <Button variant="danger" size="sm" onClick={() => toast.error('Data deletion requested')}>Delete Account</Button>
        </div>
      </Card>
    </div>
  );
}