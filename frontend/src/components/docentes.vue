<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <CrudTable :pardon-config="docentesConfig" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, watch } from 'vue';
import CrudTable from '@/components/commons/CrudTable.vue';
import { useCrudStore } from '@/stores/crud';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { formatCurrency } from '@/utils/formatters'

// 1. Instanciamos la función de store para la API de 'docentes'
const useDocentesStore = useCrudStore('docentes');
// 2. Obtenemos la instancia del store y sus referencias
const store = useDocentesStore();
const { isEditing, editedRecord } = storeToRefs(store);

// Instancia del store de autenticación para controlar la carga de datos
const authStore = useAuthStore();

// 🧠 Computamos el nombre completo en tiempo real para mostrar en el formulario
const nombreCompleto = computed(() => {
  const nombres = editedRecord.value?.nombres || '';
  const apellidos = editedRecord.value?.apellidos || '';
  return `${nombres} ${apellidos}`.trim();
});

// ⚙️ Configuración de la tabla y formulario para los docentes
const docentesConfig = computed(() => {
  const formFields = [
    { key: 'nombres', label: 'Nombres', type: 'text', required: true, hint: 'Nombre(s) del docente' },
    { key: 'apellidos', label: 'Apellidos', type: 'text', required: true, hint: 'Apellido(s) del docente' },
    { key: 'completo', label: 'Nombre Completo', type: 'text', readonly: true, hint: 'Nombre completo del docente', value: nombreCompleto.value },
    { key: 'cedula', label: 'Cédula', type: 'text', required: true, hint: 'Número de cédula de identidad', readonly: isEditing.value },
    { key: 'salario', label: 'Salario', type: 'number', required: true, hint: 'Salario mensual del docente' },
    { key: 'telefono', label: 'Teléfono', type: 'text', required: false, hint: 'Número de teléfono de contacto' },
  ];

  return {
    title: 'Padrón de Docentes',
    searchLabel: 'Buscar por nombre, apellido o cédula...',
    headers: [
      { title: 'Cédula', key: 'cedula' },
      { title: 'Nombres', key: 'nombres' },
      { title: 'Apellidos', key: 'apellidos' },
      { title: 'Salario', key: 'salario', align: 'end', value: item => formatCurrency(item.salario),},
      { title: 'Teléfono', key: 'telefono' },
      { title: 'Acciones', key: 'acciones', sortable: false },
    ],
    formFields,
    apiUrl: 'docentes', // <-- Apunta a la nueva API
    itemKey: 'id', // <-- El 'id' es la clave principal para las operaciones
    defaultRecord: {
      nombres: '',
      apellidos: '',
      cedula: '',
      salario: 0,
      telefono: '',
    },
  };
});

// Usamos `watch` para cargar los datos solo cuando el store de autenticación esté listo
watch(
  () => authStore.isReady,
  (isReady) => {
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
  { immediate: true }
);
</script>