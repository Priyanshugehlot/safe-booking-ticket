/**
 * RailPulse API Client & State Manager
 */

const API_BASE = '/api';

const ApiService = {
  getToken() {
    return localStorage.getItem('railpulse_token');
  },

  setToken(token) {
    if (token) localStorage.setItem('railpulse_token', token);
    else localStorage.removeItem('railpulse_token');
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('railpulse_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) localStorage.setItem('railpulse_user', JSON.stringify(user));
    else localStorage.removeItem('railpulse_user');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'API Request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth Methods
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  },

  async signup(name, email, password, phone) {
    const res = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  },

  async fetchProfile() {
    const res = await this.request('/auth/profile');
    if (res.user) this.setCurrentUser(res.user);
    return res.user;
  },

  logout() {
    this.setToken(null);
    this.setCurrentUser(null);
  },

  // Train & Booking Methods
  async searchTrains(from, to, date, trainClass) {
    let query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    if (date) query += `&date=${encodeURIComponent(date)}`;
    if (trainClass) query += `&class=${encodeURIComponent(trainClass)}`;
    return await this.request(`/trains${query}`);
  },

  async getTrainDetails(id) {
    return await this.request(`/trains/${id}`);
  },

  async checkPnr(pnr) {
    return await this.request(`/pnr/${pnr}`);
  },

  async createBooking(bookingData) {
    return await this.request('/booking', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },

  async getUserBookings() {
    return await this.request('/user/bookings');
  },

  async cancelBooking(pnr) {
    return await this.request(`/booking/cancel/${pnr}`, {
      method: 'POST'
    });
  },

  async fetchTelemetry() {
    return await this.request('/telemetry');
  },

  async fetchStationBoard(code) {
    return await this.request(`/station-board?code=${encodeURIComponent(code)}`);
  },

  async predictDelay(params) {
    return await this.request('/delay-predictor', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Admin Methods
  async getAdminDashboard() {
    return await this.request('/admin/dashboard');
  },

  async addTrain(trainData) {
    return await this.request('/admin/trains', {
      method: 'POST',
      body: JSON.stringify(trainData)
    });
  },

  async deleteTrain(trainId) {
    return await this.request(`/admin/trains/${trainId}`, {
      method: 'DELETE'
    });
  }
};
