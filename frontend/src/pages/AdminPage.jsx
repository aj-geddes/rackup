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

// Admin Navigation
function AdminNav() {
  const navItems = [
    { to: '/admin', label: 'Dashboard', end: true },
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
        <Route path="invites" element={<Invites />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="backups" element={<Backups />} />
      </Routes>
    </div>
  );
}
