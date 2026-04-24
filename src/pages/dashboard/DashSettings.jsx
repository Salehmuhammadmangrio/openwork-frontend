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
  const [dualRoleLoading, setDualRoleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { values, handleChange, setValues } = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Check if user can have dual roles
  const canBeFreelancer = user?.role === 'freelancer' || user?.canActAsFreelancer;
  const canBeClient = user?.role === 'client' || user?.canActAsClient;
  const dualRoleEnabled = canBeFreelancer && canBeClient;

  const savePassword = async () => {
    if (values.newPassword !== values.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/update-password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password updated!');
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const savePrefs = async () => {
    try { await api.put('/users/profile', { notifPrefs: prefs }); toast.success('Preferences saved!'); } catch { }
  };

  const toggleDualRole = async () => {
    if (user?.role === 'admin') {
      toast.error('Admin users cannot change role capabilities');
      return;
    }

    setDualRoleLoading(true);
    try {
      const { data } = await api.put('/users/toggle-dual-role', {
        canActAsFreelancer: !dualRoleEnabled,
      });
      
      // Update local user state
      updateUser(data.user);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role settings');
    } finally {
      setDualRoleLoading(false);
    }
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
        <p style={{ fontSize: '0.845rem', color: 'var(--txt2)', marginBottom: '1rem' }}>
          {dualRoleEnabled 
            ? 'You can work as both a Freelancer and a Client. Use the role switcher in the navbar to toggle between roles.'
            : 'Enable dual role to work as both a Freelancer and Client.'}
        </p>
        
        {user?.role === 'admin' ? (
          <div style={{ padding: '0.875rem', borderRadius: 11, background: 'rgba(255, 77, 106, 0.1)', border: '1px solid rgba(255, 77, 106, 0.3)', color: 'var(--err)', fontSize: '0.845rem' }}>
            Admin users cannot change role capabilities
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                {dualRoleEnabled ? '✓ Dual Role Enabled' : 'Dual Role Disabled'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>
                {dualRoleEnabled 
                  ? 'You can switch between freelancer and client roles'
                  : 'Enable dual role to access both freelancer and client features'}
              </div>
            </div>
            <Button 
              variant={dualRoleEnabled ? 'danger' : 'primary'} 
              size="sm" 
              loading={dualRoleLoading}
              onClick={toggleDualRole}
              style={{ whiteSpace: 'nowrap' }}
            >
              {dualRoleEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        )}
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