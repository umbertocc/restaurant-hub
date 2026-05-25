import axios from 'axios';

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('rh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logout solo se presente header WWW-Authenticate (problemi di autenticazione/token)
      const wwwAuth = error.response.headers?.['www-authenticate'];
      if (wwwAuth) {
        localStorage.removeItem('rh_token');
        localStorage.removeItem('rh_ristorante');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      // Propaga il messaggio del backend, se presente
      const backendMsg = error.response.data?.message || error.response.data?.error || 'Accesso non autorizzato.';
      error.customMessage = backendMsg;
    }
    return Promise.reject(error);
  },
);

export default client;
