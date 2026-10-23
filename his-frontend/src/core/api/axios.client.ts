import axios from 'axios';

// Creamos la instancia base apuntando al puerto de NestJS
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de que salga cualquier petición, le inyectamos el Token JWT si existe
apiClient.interceptors.request.use((config) => {
  // Ahora buscamos 'accessToken' para que coincida con lo que guarda Pinia
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});