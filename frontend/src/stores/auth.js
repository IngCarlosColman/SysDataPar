import { defineStore } from 'pinia';
import axiosClient from '../api/axiosClient';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    loading: false,
    error: null,
    // Renombrado a 'isReady' para mayor claridad.
    // Indica que el store ha terminado de inicializar.
    isReady: false, 
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axiosClient.post('/login', credentials);
        const { token } = response.data;
        localStorage.setItem('token', token);
        this.token = token;
        await this.fetchUser();
        return response;
      } catch (err) {
        this.error = err.response?.data?.error || 'Error desconocido';
        if (err.response?.status === 401) {
          this.logout();
        }
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      if (!this.token) return;
      try {
        const response = await axiosClient.get('/user');
        this.user = response.data;
      } catch (error) {
        this.logout();
        console.error('Failed to fetch user:', error);
      }
    },

    async init() {
      // El nuevo nombre de la propiedad 'isReady'
      if (this.isReady) return; 
      
      try {
        if (this.token) {
          await this.fetchUser();
        }
      } finally {
        // Marcamos el store como "listo" al final de la inicialización,
        // sin importar si hubo éxito o no.
        this.isReady = true; 
      }
    },

    async logout() {
      localStorage.removeItem('token');
      this.token = null;
      this.user = null;
      // Reseteamos el estado para que se pueda reinicializar
      this.isReady = false; 
      delete axiosClient.defaults.headers.common['Authorization'];
      await router.push('/login');
    },
  },
});