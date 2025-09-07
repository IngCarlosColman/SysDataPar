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
import { reactive, onMounted, computed } from 'vue'
import CrudTable from '@/components/commons/CrudTable.vue'
import { useCrudStore } from '@/stores/crud'
import { storeToRefs } from 'pinia'

// Store apuntando a la API de itaipu
const store = useCrudStore('itaipu')()
const { isEditing, editedRecord } = storeToRefs(store)

const nombreCompleto = computed(() => {
  const nombres = editedRecord.value?.nombres || ''
  const apellidos = editedRecord.value?.apellidos || ''
  return `${nombres} ${apellidos}`.trim()
})

// Función para formatear un número a moneda (Guaraníes)
const formatCurrency = (value) => {
  if (value === null || value === undefined) return ''
  const formatter = new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
};

// Configuración de la tabla y formulario
const pardonConfig = computed(() => {
  const formFields = [
    { key: 'nombres', label: 'Nombres', type: 'text', required: true, hint: 'Nombre(s) del empleado' },
    { key: 'apellidos', label: 'Apellidos', type: 'text', required: true, hint: 'Apellido(s) del empleado' },
    { key: 'completo', label: 'Nombre Completo', type: 'text', readonly: true, hint: 'Generado automáticamente.', value: nombreCompleto.value },
    { key: 'cedula', label: 'Cédula', type: 'text', required: true, hint: 'Número de cédula de identidad', readonly: isEditing.value },
    { key: 'telefono', label: 'Teléfono', type: 'text', required: false, hint: 'Número de contacto' },
    { key: 'ubicacion', label: 'Ubicación', type: 'text', required: true, hint: 'Ubicación física del empleado' },
    { key: 'salario', label: 'Salario', type: 'text', required: true, hint: 'Salario mensual en guaraníes' },
  ]

  return {
    title: 'Empleados de Itaipu',
    searchLabel: 'Buscar por nombre, apellido o cédula...',
    headers: [
      { title: 'Cédula', key: 'cedula' },
      { title: 'Nombres', key: 'nombres' },
      { title: 'Apellidos', key: 'apellidos' },
      { title: 'Salario', key: 'salario', align: 'end', value: item => formatCurrency(item.salario) },
      { title: 'Teléfono', key: 'telefono' },
      { title: 'Acciones', key: 'acciones', sortable: false },
    ],
    formFields,
    apiUrl: 'itaipu',
    itemKey: 'id',
    defaultRecord: {
      nombres: '',
      apellidos: '',
      cedula: '',
      telefono: '',
      ubicacion: '',
      salario: null,
    },
  }
})

// Carga inicial de datos
onMounted(async () => {
  await store.loadItems({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    search: ''
  })
});
</script>