import { api } from '../../../shared/services/api';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getProfile = (userId) => api.get(`/users/profile/${userId}`); 