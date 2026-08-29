import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// Auth
export const authRegister = d => API.post('/auth/register', d);
export const authLogin    = d => API.post('/auth/login', d);
export const authMe       = () => API.get('/auth/me');
export const authSetPin   = d => API.post('/auth/set-pin', d);
export const authVerifyPin= d => API.post('/auth/verify-pin', d);

// Contacts
export const getContacts       = p  => API.get('/contacts', { params: p });
export const createContact     = d  => API.post('/contacts', d);
export const createContactForce= d  => API.post('/contacts/force', d);
export const updateContact     = (id, d) => API.put('/contacts/' + id, d);
export const deleteContact     = id => API.delete('/contacts/' + id);
export const toggleFavorite    = id => API.patch('/contacts/' + id + '/favorite');

// Reminders
export const addReminder    = (id, d)      => API.post('/contacts/' + id + '/reminders', d);
export const updateReminder = (id, rid, d) => API.patch('/contacts/' + id + '/reminders/' + rid, d);
export const deleteReminder = (id, rid)    => API.delete('/contacts/' + id + '/reminders/' + rid);
export const getAllReminders = ()           => API.get('/reminders');

// Followups
export const addFollowup    = (id, d)   => API.post('/contacts/' + id + '/followups', d);
export const deleteFollowup = (id, fid) => API.delete('/contacts/' + id + '/followups/' + fid);

// Birthdays / Analytics / Tags
export const getUpcomingBirthdays = () => API.get('/birthdays/upcoming');
export const getAnalytics         = () => API.get('/analytics');
export const getTags              = () => API.get('/tags');

// Import / Export
export const importCSV  = fd => API.post('/contacts/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
export const exportPDF  = () => API.get('/contacts/export/pdf', { responseType: 'blob' });
