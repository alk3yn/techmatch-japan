// src/api/client.js
// Shared axios instance. Attaches the JWT (if present) to every request
// and points at the backend API base URL.
//
// Set VITE_API_URL in client/.env for local dev (see .env.example) and
// again at build time when pointing at the deployed EC2 URL.

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({ baseURL });

const TOKEN_STORAGE_KEY = 'techmatch_token';

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { TOKEN_STORAGE_KEY };
export default apiClient;
