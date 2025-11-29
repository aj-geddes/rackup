import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icons from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-600">{stats?.stats?.totalUsers || 0}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">{stats?.stats?.totalTeams || 0}</p>
          <p className="text-sm text-gray-600">Teams</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">{stats?.stats?.completedMatches || 0}</p>
          <p className="text-sm text-gray-600">Completed Matches</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-orange-600">{stats?.stats?.upcomingMatches || 0}</p>
          <p className="text-sm text-gray-600">Upcoming Matches</p>
        </div>
      </div>

      {/* Active Season */}
      {stats?.activeSeason && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Active Season</h3>
          <p className="text-purple-600 font-medium">{stats.activeSeason.name}</p>
          <p className="text-sm text-gray-500">
            {new Date(stats.activeSeason.startDate).toLocaleDateString()} -
            {new Date(stats.activeSeason.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{log.user}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Invites Component
function Invites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ phone: '', firstName: '', lastName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const data = await api.request('/invites');
      setInvites(data.data || []);
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const result = await api.request('/invites', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setMessage(result.message + (result.inviteLink ? ` Link: ${result.inviteLink}` : ''));
      setFormData({ phone: '', firstName: '', lastName: '' });
      setShowForm(false);
      loadInvites();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id) => {
    try {
      await api.request(`/invites/${id}/resend`, { method: 'POST' });
      setMessage('Invite resent successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this invite?')) return;
    try {
      await api.request(`/invites/${id}/cancel`, { method: 'POST' });
      loadInvites();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Invites</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
        >
          <Icons.Plus /> Send Invite
        </button>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {invites.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No invites yet</p>
        ) : (
          invites.map((invite, i) => (
            <div
              key={invite.id}
              className={`p-4 ${i < invites.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    {invite.firstName} {invite.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{invite.phone}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  invite.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                  invite.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {invite.status}
                </span>
              </div>
              {invite.status === 'PENDING' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleResend(invite.id)}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => handleCancel(invite.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Backups Component
function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driveStatus, setDriveStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [backupsData, statusData] = await Promise.all([
        api.getBackups(),
        api.getGoogleDriveStatus().catch(() => ({ isConfigured: false }))
      ]);
      setBackups(backupsData.data || []);
      setDriveStatus(statusData);
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      setMessage('');
      setError('');

      const response = await fetch(`/api/backups/download${type ? `/csv/${type}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type
        ? `${type}-${new Date().toISOString().split('T')[0]}.csv`
        : `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMessage('Download started');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadToDrive = async () => {
    try {
      setMessage('');
      setError('');
      const result = await api.uploadToGoogleDrive();
      setMessage('Backup uploaded to Google Drive');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const { authUrl } = await api.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Backups</h2>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Download Options */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Download Backup</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handleDownload()}
            className="flex items-center justify-center gap-2 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
          >
            <Icons.Download /> Full Backup (JSON)
          </button>
          <button
            onClick={() => handleDownload('standings')}
            className="flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            <Icons.Download /> Standings (CSV)
          </button>
          <button
            onClick={() => handleDownload('players')}
            className="flex items-center justify-center gap-2 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            <Icons.Download /> Player Stats (CSV)
          </button>
        </div>
      </div>

      {/* Google Drive */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Icons.GoogleDrive /> Google Drive
        </h3>
        {driveStatus?.isConfigured ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600">Connected</p>
            <button
              onClick={handleUploadToDrive}
              className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              <Icons.Upload /> Upload Backup to Drive
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Not connected</p>
            <button
              onClick={handleConnectDrive}
              className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Connect Google Drive
            </button>
          </div>
        )}
      </div>

      {/* Recent Backups */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Backups</h3>
        {backups.length === 0 ? (
          <p className="text-sm text-gray-500">No backups yet</p>
        ) : (
          <div className="space-y-2">
            {backups.map(backup => (
              <div key={backup.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{backup.filename}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(backup.createdAt).toLocaleString()} - {(backup.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  backup.type === 'google_drive' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {backup.type === 'google_drive' ? 'Drive' : 'Local'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Announcements Component
function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', isUrgent: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.getAnnouncements({ active: 'false' });
      setAnnouncements(data.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAnnouncement(formData);
      setFormData({ title: '', content: '', isUrgent: false });
      setShowForm(false);
      loadAnnouncements();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Announcements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
        >
          <Icons.Plus /> New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              required
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isUrgent}
              onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm text-gray-700">Mark as urgent</span>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {announcements.map(ann => (
          <div
            key={ann.id}
            className={`bg-white rounded-xl p-4 border ${
              ann.isUrgent ? 'border-purple-200' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800">{ann.title}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(ann.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Icons.Trash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Users Management Component
function Users() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null);
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: 'PLAYER', teamId: '', handicap: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, teamsData] = await Promise.all([
        api.getUsers({ limit: 100 }),
        api.getTeams()
      ]);
      setUsers(usersData.data || []);
      setTeams(teamsData || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await api.createUser({
        ...formData,
        teamId: formData.teamId || undefined,
        handicap: formData.handicap ? parseInt(formData.handicap) : undefined
      });
      setMessage('User created successfully');
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'PLAYER', teamId: '', handicap: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) {
        await api.deactivateUser(user.id);
      } else {
        await api.activateUser(user.id);
      }
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await api.resetPassword(showPasswordModal, newPassword);
      setMessage('Password reset successfully');
      setShowPasswordModal(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass + '!1';
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Users ({users.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
        >
          <Icons.Plus /> Add User
        </button>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="flex gap-2">
              <input type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" required minLength={8} />
              <button type="button" onClick={() => setFormData({...formData, password: generatePassword()})}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">Generate</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="PLAYER">Player</option>
                <option value="CAPTAIN">Captain</option>
                <option value="LEAGUE_OFFICIAL">League Official</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select value={formData.teamId} onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="">No Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Handicap</label>
              <input type="number" min="1" max="9" value={formData.handicap} onChange={(e) => setFormData({...formData, handicap: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="3" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create User'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm">
          <option value="">All Roles</option>
          <option value="PLAYER">Player</option>
          <option value="CAPTAIN">Captain</option>
          <option value="LEAGUE_OFFICIAL">Official</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Reset Password</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="flex gap-2">
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" minLength={8} />
                <button type="button" onClick={() => setNewPassword(generatePassword())}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">Generate</button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleResetPassword} className="flex-1 py-2 bg-purple-600 text-white rounded-lg">Reset</button>
              <button onClick={() => { setShowPasswordModal(null); setNewPassword(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-xs">
                      <option value="PLAYER">Player</option>
                      <option value="CAPTAIN">Captain</option>
                      <option value="LEAGUE_OFFICIAL">Official</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.team?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(user)}
                      className={`px-2 py-1 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setShowPasswordModal(user.id)}
                      className="text-purple-600 hover:underline text-xs">Reset Password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Teams Management Component
function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', captainId: '', coCaptainId: '', seasonId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [teamsData, usersData, seasonsData] = await Promise.all([
        api.getTeams(),
        api.getUsers({ limit: 200 }),
        api.getSeasons()
      ]);
      setTeams(teamsData || []);
      setUsers(usersData.data || []);
      setSeasons(seasonsData || []);
      // Set default season
      const activeSeason = seasonsData.find(s => s.isActive);
      if (activeSeason && !formData.seasonId) {
        setFormData(f => ({ ...f, seasonId: activeSeason.id }));
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingTeam) {
        await api.updateTeam(editingTeam.id, formData);
        setMessage('Team updated');
      } else {
        await api.createTeam(formData);
        setMessage('Team created');
      }
      setFormData({ name: '', captainId: '', coCaptainId: '', seasonId: formData.seasonId });
      setShowForm(false);
      setEditingTeam(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (team) => {
    setFormData({
      name: team.name,
      captainId: team.captainId || '',
      coCaptainId: team.coCaptainId || '',
      seasonId: team.seasonId
    });
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDelete = async (teamId) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    try {
      await api.deleteTeam(teamId);
      setMessage('Team deleted');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Teams ({teams.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingTeam(null); }}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
          <Icons.Plus /> Add Team
        </button>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Captain</label>
              <select value={formData.captainId} onChange={(e) => setFormData({...formData, captainId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select Captain</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Co-Captain</label>
              <select value={formData.coCaptainId} onChange={(e) => setFormData({...formData, coCaptainId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select Co-Captain</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select value={formData.seasonId} onChange={(e) => setFormData({...formData, seasonId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name} {s.isActive && '(Active)'}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Saving...' : (editingTeam ? 'Update Team' : 'Create Team')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingTeam(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {teams.map(team => (
          <div key={team.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{team.name}</h3>
                <p className="text-sm text-gray-500">
                  Captain: {team.captain ? `${team.captain.firstName} ${team.captain.lastName}` : 'None'}
                  {team.coCaptain && ` | Co-Captain: ${team.coCaptain.firstName} ${team.coCaptain.lastName}`}
                </p>
                <p className="text-sm text-gray-400">
                  {team._count?.members || 0} members | {team.standings?.wins || 0}-{team.standings?.losses || 0}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(team)} className="text-purple-600 hover:underline text-sm">Edit</button>
                <button onClick={() => handleDelete(team.id)} className="text-red-600 hover:underline text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Seasons Management Component
function Seasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', playoffDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await api.getSeasons();
      setSeasons(data || []);
    } catch (err) {
      console.error('Failed to load seasons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createSeason(formData);
      setMessage('Season created');
      setFormData({ name: '', startDate: '', endDate: '', playoffDate: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (seasonId) => {
    try {
      await api.activateSeason(seasonId);
      setMessage('Season activated');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Seasons</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
          <Icons.Plus /> New Season
        </button>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Spring 2025" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Playoff Date</label>
              <input type="date" value={formData.playoffDate} onChange={(e) => setFormData({...formData, playoffDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Season'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {seasons.map(season => (
          <div key={season.id} className={`bg-white rounded-xl border p-4 ${season.isActive ? 'border-purple-300 bg-purple-50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{season.name}</h3>
                  {season.isActive && <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">Active</span>}
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-400">
                  {season._count?.teams || 0} teams | {season._count?.matches || 0} matches
                </p>
              </div>
              {!season.isActive && (
                <button onClick={() => handleActivate(season.id)}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Venues Management Component
function Venues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', city: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await api.getVenues();
      setVenues(data || []);
    } catch (err) {
      console.error('Failed to load venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingVenue) {
        await api.updateVenue(editingVenue.id, formData);
        setMessage('Venue updated');
      } else {
        await api.createVenue(formData);
        setMessage('Venue created');
      }
      setFormData({ name: '', address: '', city: '', phone: '' });
      setShowForm(false);
      setEditingVenue(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (venue) => {
    setFormData({ name: venue.name, address: venue.address || '', city: venue.city || '', phone: venue.phone || '' });
    setEditingVenue(venue);
    setShowForm(true);
  };

  const handleToggleActive = async (venue) => {
    try {
      await api.updateVenue(venue.id, { isActive: !venue.isActive });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Venues ({venues.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingVenue(null); }}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
          <Icons.Plus /> Add Venue
        </button>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Saving...' : (editingVenue ? 'Update Venue' : 'Create Venue')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingVenue(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {venues.map((venue, i) => (
          <div key={venue.id} className={`p-4 flex items-center justify-between ${i < venues.length - 1 ? 'border-b' : ''}`}>
            <div>
              <h3 className="font-medium text-gray-800">{venue.name}</h3>
              <p className="text-sm text-gray-500">{venue.address}{venue.city && `, ${venue.city}`}</p>
              {venue.phone && <p className="text-sm text-gray-400">{venue.phone}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleToggleActive(venue)}
                className={`px-2 py-1 rounded text-xs font-medium ${venue.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {venue.isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => handleEdit(venue)} className="text-purple-600 hover:underline text-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Schedule Management Component
function Schedule() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [formData, setFormData] = useState({ date: '', time: '7:00 PM', homeTeamId: '', awayTeamId: '', venueId: '', week: 1 });
  const [generateData, setGenerateData] = useState({ startDate: '', weeksCount: 18, matchTime: '7:00 PM', venueRotation: true });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [seasonData, venuesData] = await Promise.all([
        api.getActiveSeason(),
        api.getVenues(true)
      ]);
      setActiveSeason(seasonData);
      setVenues(venuesData || []);
      if (seasonData) {
        const [matchesData, teamsData] = await Promise.all([
          api.getMatches({ seasonId: seasonData.id, limit: 200 }),
          api.getTeams(seasonData.id)
        ]);
        setMatches(matchesData || []);
        setTeams(teamsData || []);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createMatch({ ...formData, seasonId: activeSeason.id });
      setMessage('Match created');
      setFormData({ date: '', time: '7:00 PM', homeTeamId: '', awayTeamId: '', venueId: '', week: 1 });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!confirm(`Generate schedule with ${teams.length} teams? This will create multiple matches.`)) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.generateSchedule({ ...generateData, seasonId: activeSeason.id });
      setMessage(`Schedule generated: ${result.matchesCreated} matches created`);
      setShowGenerate(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (matchId) => {
    if (!confirm('Delete this match?')) return;
    try {
      await api.deleteMatch(matchId);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('DELETE ALL MATCHES? This cannot be undone!')) return;
    if (!confirm('Are you really sure? Type the season name to confirm.')) return;
    try {
      await api.clearSchedule(activeSeason.id);
      setMessage('All matches cleared');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!activeSeason) {
    return <div className="text-center py-8 text-gray-500">No active season. Create and activate a season first.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Schedule ({matches.length} matches)</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerate(!showGenerate)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Generate Schedule
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700">
            <Icons.Plus /> Add Match
          </button>
        </div>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {showGenerate && (
        <form onSubmit={handleGenerate} className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-4">
          <h3 className="font-semibold text-blue-800">Generate Round-Robin Schedule</h3>
          <p className="text-sm text-blue-600">This will create matches for all {teams.length} teams using round-robin scheduling.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={generateData.startDate} onChange={(e) => setGenerateData({...generateData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Weeks</label>
              <input type="number" value={generateData.weeksCount} onChange={(e) => setGenerateData({...generateData, weeksCount: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" min="1" max="52" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Match Time</label>
              <input type="text" value={generateData.matchTime} onChange={(e) => setGenerateData({...generateData, matchTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="7:00 PM" />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={generateData.venueRotation} onChange={(e) => setGenerateData({...generateData, venueRotation: e.target.checked})}
                  className="w-4 h-4" />
                <span className="text-sm text-gray-700">Rotate venues</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting || teams.length < 2}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Generating...' : 'Generate Schedule'}
            </button>
            <button type="button" onClick={() => setShowGenerate(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="text" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="7:00 PM" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Team *</label>
              <select value={formData.homeTeamId} onChange={(e) => setFormData({...formData, homeTeamId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select Home Team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Away Team *</label>
              <select value={formData.awayTeamId} onChange={(e) => setFormData({...formData, awayTeamId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select Away Team</option>
                {teams.filter(t => t.id !== formData.homeTeamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <select value={formData.venueId} onChange={(e) => setFormData({...formData, venueId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select Venue</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week #</label>
              <input type="number" value={formData.week} onChange={(e) => setFormData({...formData, week: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" min="1" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 bg-purple-600 text-white font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Match'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {matches.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleClearAll} className="text-red-600 hover:underline text-sm">Clear All Matches</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {matches.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No matches scheduled. Create matches or generate a schedule.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Week</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Match</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Venue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {matches.map(match => (
                  <tr key={match.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{match.week || '-'}</td>
                    <td className="px-4 py-3">{new Date(match.date).toLocaleDateString()} {match.time}</td>
                    <td className="px-4 py-3 font-medium">
                      {match.homeTeam?.name} vs {match.awayTeam?.name}
                      {match.status === 'COMPLETED' && <span className="ml-2 text-gray-500">({match.homeScore}-{match.awayScore})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{match.venue?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        match.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                        match.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{match.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(match.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Navigation
function AdminNav() {
  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/teams', label: 'Teams' },
    { to: '/admin/seasons', label: 'Seasons' },
    { to: '/admin/venues', label: 'Venues' },
    { to: '/admin/schedule', label: 'Schedule' },
    { to: '/admin/invites', label: 'Invites' },
    { to: '/admin/announcements', label: 'Announcements' },
    { to: '/admin/backups', label: 'Backups' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 mb-4">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              isActive
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

// Main Admin Page
export default function AdminPage() {
  return (
    <div>
      <AdminNav />
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="teams" element={<Teams />} />
        <Route path="seasons" element={<Seasons />} />
        <Route path="venues" element={<Venues />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="invites" element={<Invites />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="backups" element={<Backups />} />
      </Routes>
    </div>
  );
}
