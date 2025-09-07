<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <CrudTable :pardon-config="pardonConfig" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'; // Importamos `watch` y `computed`
import CrudTable from '@/components/commons/CrudTable.vue';
import { useCrudStore } from '@/stores/crud';
import { useAuthStore } from '@/stores/auth'; // Importamos el authStore

// 1. Instanciamos la función de store usando la fábrica
const useGeneralStore = useCrudStore('general');
// 2. Y luego, obtenemos la instancia del store
const store = useGeneralStore();
// Creamos la instancia del store de autenticación
const authStore = useAuthStore();

// Las opciones de configuración para la tabla
const pardonConfig = computed(() => {
    return {
      title: 'Ciudadanos en Paraguay',
      searchLabel: 'Buscar por nombre, apellido o cédula...',
      headers: [
        { title: 'Cédula', key: 'cedula' },
        { title: 'Nombres', key: 'nombres' },
        { title: 'Apellidos', key: 'apellidos' },
        { title: 'Nomb. Completo', key: 'completo' },
        { title: 'Teléfono', key: 'telefono' },
        { title: 'Acciones', key: 'acciones', sortable: false },
      ],
      formFields: [
        { key: 'nombres', label: 'Nombres', type: 'text', required: true, hint: 'Nombre(s) del registro' },
        { key: 'apellidos', label: 'Apellidos', type: 'text', required: true, hint: 'Apellido(s) del registro' },
        { key: 'completo', label: 'Nombre Completo', type: 'text', required: true, hint: 'Nombre completo generado automáticamente', readonly: true },
        { key: 'cedula', label: 'Cédula', type: 'text', required: true, hint: 'Número de cédula de identidad' },
        { key: 'telefono', label: 'Teléfono', type: 'text', required: false, hint: 'Número de teléfono de contacto' },
      ],
      apiUrl: 'general',
      itemKey: 'id',
      defaultRecord: {
        nombres: '',
        apellidos: '',
        cedula: '',
        telefono: '',
      },
  }
});

// Reemplazamos onMounted con un `watch` para esperar a que la autenticación esté lista.
watch(
  // Observa el estado 'isReady' del store de autenticación
  () => authStore.isReady,
  (isReady) => {
    // Si el store de autenticación está listo, entonces cargamos los datos
    if (isReady) {
      const initialOptions = {
        page: 1,
        itemsPerPage: 10,
        sortBy: [],
        search: ''
      };
      store.loadItems(initialOptions);
    }
  },
  // La opción `immediate: true` asegura que el `watch` se ejecute al menos una vez
  // incluso si el store ya estaba listo al inicio.
  { immediate: true }
);
</script>