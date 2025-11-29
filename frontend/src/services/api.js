const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token refresh
      if (response.status === 401) {
        const data = await response.json();
        if (data.code === 'TOKEN_EXPIRED' && this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            headers.Authorization = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, { ...options, headers });
            return this.handleResponse(retryResponse);
          }
        }
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired. Please log in again.');
      }

      return this.handleResponse(response);
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }
      return data;
    }

    // Handle file downloads
    if (contentType && (contentType.includes('text/csv') || contentType.includes('application/json'))) {
      return response;
    }

    if (!response.ok) {
      throw new Error('An error occurred');
    }

    return response;
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // User endpoints
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(id, role) {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deactivateUser(id) {
    return this.request(`/users/${id}/deactivate`, { method: 'PATCH' });
  }

  async activateUser(id) {
    return this.request(`/users/${id}/activate`, { method: 'PATCH' });
  }

  // Team endpoints
  async getTeams(seasonId) {
    const query = seasonId ? `?seasonId=${seasonId}` : '';
    return this.request(`/teams${query}`);
  }

  async getTeam(id) {
    return this.request(`/teams/${id}`);
  }

  async createTeam(data) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeam(id, data) {
    return this.request(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addTeamMember(teamId, userId) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeTeamMember(teamId, userId) {
    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Match endpoints
  async getMatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/matches${query ? `?${query}` : ''}`);
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  async createMatch(data) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMatch(id, data) {
    return this.request(`/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateMatchScore(id, homeScore, awayScore) {
    return this.request(`/matches/${id}/score`, {
      method: 'PATCH',
      body: JSON.stringify({ homeScore, awayScore }),
    });
  }

  // Season endpoints
  async getSeasons(active) {
    const query = active !== undefined ? `?active=${active}` : '';
    return this.request(`/seasons${query}`);
  }

  async getActiveSeason() {
    return this.request('/seasons/active');
  }

  async getSeason(id) {
    return this.request(`/seasons/${id}`);
  }

  async createSeason(data) {
    return this.request('/seasons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSeason(id, data) {
    return this.request(`/seasons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async activateSeason(id) {
    return this.request(`/seasons/${id}/activate`, { method: 'POST' });
  }

  async getSeasonStats(id) {
    return this.request(`/seasons/${id}/stats`);
  }

  // Standings endpoints
  async getStandings(seasonId) {
    const query = seasonId ? `?seasonId=${seasonId}` : '';
    return this.request(`/standings${query}`);
  }

  async getPlayerRankings(seasonId) {
    const query = seasonId ? `?seasonId=${seasonId}` : '';
    return this.request(`/standings/players${query}`);
  }

  async recalculateStandings(seasonId) {
    return this.request(`/standings/recalculate/${seasonId}`, { method: 'POST' });
  }

  // Announcement endpoints
  async getAnnouncements(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/announcements${query ? `?${query}` : ''}`);
  }

  async getAnnouncement(id) {
    return this.request(`/announcements/${id}`);
  }

  async createAnnouncement(data) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id, data) {
    return this.request(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id) {
    return this.request(`/announcements/${id}`, { method: 'DELETE' });
  }

  // Venue endpoints
  async getVenues(active) {
    const query = active !== undefined ? `?active=${active}` : '';
    return this.request(`/venues${query}`);
  }

  async getVenue(id) {
    return this.request(`/venues/${id}`);
  }

  async createVenue(data) {
    return this.request('/venues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVenue(id, data) {
    return this.request(`/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/audit-logs${query ? `?${query}` : ''}`);
  }

  async createAdmin(data) {
    return this.request('/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createUser(data) {
    return this.request('/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(id) {
    return this.request(`/teams/${id}`, { method: 'DELETE' });
  }

  async deactivateSeason(id) {
    return this.request(`/seasons/${id}/deactivate`, { method: 'POST' });
  }

  async deleteSeason(id) {
    return this.request(`/seasons/${id}`, { method: 'DELETE' });
  }

  async deleteVenue(id) {
    return this.request(`/venues/${id}`, { method: 'DELETE' });
  }

  async deleteMatch(id) {
    return this.request(`/matches/${id}`, { method: 'DELETE' });
  }

  async clearSchedule(seasonId) {
    return this.request(`/admin/clear-schedule/${seasonId}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirm: 'DELETE_ALL_MATCHES' }),
    });
  }

  async importUsers(users) {
    return this.request('/admin/import-users', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  }

  async resetPassword(userId, newPassword) {
    return this.request(`/admin/reset-password/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async generateSchedule(data) {
    return this.request('/admin/generate-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Backup endpoints
  async getBackups(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/backups${query ? `?${query}` : ''}`);
  }

  async downloadBackup() {
    const response = await this.request('/backups/download');
    return response;
  }

  async downloadStandingsCsv(seasonId) {
    const query = seasonId ? `?seasonId=${seasonId}` : '';
    return this.request(`/backups/download/csv/standings${query}`);
  }

  async downloadPlayersCsv(seasonId) {
    const query = seasonId ? `?seasonId=${seasonId}` : '';
    return this.request(`/backups/download/csv/players${query}`);
  }

  async getGoogleDriveStatus() {
    return this.request('/backups/google/status');
  }

  async getGoogleAuthUrl() {
    return this.request('/backups/google/auth-url');
  }

  async connectGoogleDrive(code) {
    return this.request('/backups/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async uploadToGoogleDrive() {
    return this.request('/backups/google/upload', { method: 'POST' });
  }

  async listGoogleDriveBackups() {
    return this.request('/backups/google/list');
  }

  async disconnectGoogleDrive() {
    return this.request('/backups/google/disconnect', { method: 'POST' });
  }

  // Config endpoint (public - no auth required)
  async getConfig() {
    return this.request('/config');
  }
}

export const api = new ApiService();
export default api;
