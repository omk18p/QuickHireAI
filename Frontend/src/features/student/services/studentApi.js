import api from '../../shared/services/api';

export const getStudentDashboard = () => api.get('/users/profile'); 