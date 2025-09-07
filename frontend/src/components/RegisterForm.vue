<template>
  <v-container class="fill-height justify-center align-center">
    <v-card class="pa-5" max-width="500" flat>
      <v-card-title class="text-center text-h5 mb-4">
        Crear una cuenta
      </v-card-title>
      <v-form @submit.prevent="handleRegister">
        <v-text-field
          v-model="username"
          label="Nombre de usuario"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          :rules="[rules.required]"
        ></v-text-field>
        <v-text-field
          v-model="email"
          label="Correo electrónico"
          prepend-inner-icon="mdi-email"
          variant="outlined"
          type="email"
          :rules="[rules.required, rules.email]"
        ></v-text-field>
        <v-text-field
          v-model="password"
          label="Contraseña"
          prepend-inner-icon="mdi-lock"
          variant="outlined"
          type="password"
          :rules="[rules.required, rules.min]"
        ></v-text-field>
        <v-btn
          color="primary"
          size="large"
          block
          type="submit"
          :loading="loading"
        >
          Registrarse
        </v-btn>
      </v-form>
      <v-alert v-if="error" type="error" class="mt-4" dense>{{ error }}</v-alert>
      <v-card-text class="text-center mt-4">
        ¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión</router-link>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);
const router = useRouter();

const rules = {
  required: (value) => !!value || 'Este campo es obligatorio.',
  email: (value) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) || 'Correo electrónico inválido.';
  },
  min: (value) => value.length >= 6 || 'La contraseña debe tener al menos 6 caracteres.',
};

const handleRegister = async () => {
  if (!username.value || !email.value || !password.value) {
    error.value = 'Por favor, rellena todos los campos.';
    return;
  }
  
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.post('/api/register', {
      username: username.value,
      email: email.value,
      password: password.value,
    });
    console.log('Registro exitoso:', response.data);
    
    // Redirecciona al usuario a la página de inicio de sesión después de registrarse
    await router.push('/login');

  } catch (err) {
    console.error('Error de registro:', err.response.data);
    error.value = err.response.data.error || 'Ocurrió un error al registrarse.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>