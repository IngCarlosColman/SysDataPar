<template>
  <div class="h-screen w-full flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-800">Cargando...</h1>
      <p class="text-lg text-gray-600 mt-2">Redirigiendo a la página de inicio de sesión.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // Simula un chequeo de autenticación.
  // En una aplicación real, usarías el token de autenticación del almacenamiento local.
  const isAuthenticated = false; 

  if (!isAuthenticated) {
    // Si no está autenticado, redirige a la página de login.
    router.push('/login');
  }
});
</script>

<style scoped>
</style>
