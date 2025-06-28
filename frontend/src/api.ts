import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
  bio: string;
  profile_image?: string;
  skills?: string[];
  company?: string;
  experience_years?: number;
}

export interface Mentor extends User {
  role: 'mentor';
}

export interface MatchRequest {
  id: number;
  mentorId: number;
  menteeId: number;
  message: string;
  status: string;
}

export interface MatchRequestOutgoing {
  id: number;
  mentorId: number;
  menteeId: number;
  message: string;
  status: string;
}

// API functions
export const authApi = {
  signup: async (data: { email: string; password: string; name: string; role: string }) => {
    const response = await api.post('/signup', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/login', data);
    return response.data;
  },
};

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get('/me');
    return response.data;
  },

  updateProfile: async (data: {
    id: number;
    name: string;
    role: string;
    bio: string;
    image: string;
    skills?: string[];
  }): Promise<User> => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  getProfileImage: (role: string, id: number) => {
    return `${API_BASE_URL}/images/${role}/${id}`;
  },
};

export const mentorApi = {
  getAll: async (params?: { sort_by?: string; skill?: string }): Promise<Mentor[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skill) searchParams.append('skill', params.skill);
    if (params?.sort_by) searchParams.append('orderBy', params.sort_by);
    
    const response = await api.get(`/mentors?${searchParams.toString()}`);
    return response.data;
  },

  getMentors: async (skill?: string, orderBy?: string): Promise<User[]> => {
    const params = new URLSearchParams();
    if (skill) params.append('skill', skill);
    if (orderBy) params.append('orderBy', orderBy);
    
    const response = await api.get(`/mentors?${params.toString()}`);
    return response.data;
  },
};

export const matchRequestApi = {
  create: async (data: { mentor_id: number; message: string }): Promise<MatchRequest> => {
    const response = await api.post('/match-requests', data);
    return response.data;
  },

  getIncoming: async (): Promise<MatchRequest[]> => {
    const response = await api.get('/match-requests/incoming');
    return response.data;
  },

  getOutgoing: async (): Promise<MatchRequestOutgoing[]> => {
    const response = await api.get('/match-requests/outgoing');
    return response.data;
  },

  accept: async (id: number): Promise<MatchRequest> => {
    const response = await api.put(`/match-requests/${id}/accept`);
    return response.data;
  },

  reject: async (id: number): Promise<MatchRequest> => {
    const response = await api.put(`/match-requests/${id}/reject`);
    return response.data;
  },

  cancel: async (id: number): Promise<MatchRequest> => {
    const response = await api.delete(`/match-requests/${id}`);
    return response.data;
  },
};

export default api;
