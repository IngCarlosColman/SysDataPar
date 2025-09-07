import { createPinia } from 'pinia';
import { useAuthStore } from '../stores/auth';

const pinia = createPinia();

// Este plugin se encarga de inicializar el estado del store de autenticación.
// Se ejecuta una sola vez cuando la aplicación se monta.
// Ideal para cargar el token desde el localStorage.
pinia.use(({ store }) => {
  if (store.$id === 'auth') {
    // Si el store es el de autenticación,
    // cargamos el token del almacenamiento local al inicio.
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      store.token = storedToken;
    }
  }
});

export default pinia;