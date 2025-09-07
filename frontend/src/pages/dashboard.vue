<template>
  <v-app>
    <v-app-bar app elevation="0" color="surface-container">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold">Dashboard</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn icon @click="toggleTheme" class="mr-2">
        <v-icon>
          {{ theme.global.current.value.dark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}
        </v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ theme.global.current.value.dark ? 'Modo Claro' : 'Modo Oscuro' }}
        </v-tooltip>
      </v-btn>

      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer app v-model="drawer" permanent color="grey-lighten-5">
      <v-list density="compact" nav>
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
          :title="authStore.user?.username || 'Usuario'"
          :subtitle="authStore.user?.email || 'email@ejemplo.com'"
          nav
        ></v-list-item>
      </v-list>
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Ciudadanos"
          @click="viewMode = 'general'"
        ></v-list-item>
        
        <v-list-item
          prepend-icon="mdi-briefcase-account"
          title="Funcionarios Públicos"
          @click="viewMode = 'funcpublic'"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-transmission-tower"
          title="Funcionarios de Itaipu"
          @click="viewMode = 'itaipu'"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-gavel"
          title="Abogados"
          @click="viewMode = 'abogados'"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-school"
          title="Docentes"
          @click="viewMode = 'docentes'"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Cerrar Sesión"
          @click="logout"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid>
        <component v-if="currentView" :is="currentView" />
        <router-view v-else></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from 'vuetify';
import GeneralComponent from '@/components/general.vue';
import AbogadosComponent from '@/components/abogados.vue';
import ItaipuComponent from '@/components/itaipu.vue';
import FuncPublicComponent from '@/components/funcpublic.vue';
// --- Importa el nuevo componente de Docentes ---
import DocentesComponent from '@/components/docentes.vue';

const router = useRouter();
const authStore = useAuthStore();
const theme = useTheme();

const drawer = ref(true);
const viewMode = ref('general');

const currentView = computed(() => {
  switch (viewMode.value) {
    case 'general':
      return GeneralComponent;
    case 'abogados':
      return AbogadosComponent;
    case 'itaipu':
      return ItaipuComponent;
    case 'funcpublic':
      return FuncPublicComponent;
    // --- Agrega el nuevo caso para el componente de Docentes ---
    case 'docentes':
      return DocentesComponent;
    // -----------------------------------------------------------
    default:
      return null;
  }
});

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
};

onMounted(async () => {
  if (!authStore.user && authStore.isAuthenticated) {
    await authStore.fetchUser();
  }
});
</script>