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

// Store apuntando a la API de abogados
const store = useCrudStore('abogados')()
const { isEditing, editedRecord } = storeToRefs(store)

// 🧠 Computamos el nombre completo en tiempo real (solo visual)
const nombreCompleto = computed(() => {
  const nombres = editedRecord.value?.nombres || ''
  const apellidos = editedRecord.value?.apellidos || ''
  return `${nombres} ${apellidos}`.trim()
})

// ⚙️ Configuración de la tabla y formulario
const pardonConfig = computed(() => {
  const formFields = [
    { key: 'nombres', label: 'Nombres', type: 'text', required: true, hint: 'Nombre(s) del abogado' },
    { key: 'apellidos', label: 'Apellidos', type: 'text', required: true, hint: 'Apellido(s) del abogado' },
    { key: 'completo', label: 'Nombre Completo', type: 'text', readonly: true, hint: 'Generado automáticamente. Útil para registros incompletos.',
      value: nombreCompleto.value // ← se muestra en tiempo real
    },
    { key: 'cedula', label: 'Cédula', type: 'text', required: true, hint: 'Número de cédula del abogado', readonly: isEditing.value // ← solo lectura al editar
    },
    { key: 'telefono', label: 'Teléfono', type: 'text', required: false, hint: 'Número de contacto' },
  ]

  return {
    title: 'Padrón de Abogados',
    searchLabel: 'Buscar por nombre, apellido o cédula...',
    headers: [
      { title: 'Cédula', key: 'cedula' },
      { title: 'Nombres', key: 'nombres' },
      { title: 'Apellidos', key: 'apellidos' },
      { title: 'Nombre Completo', key: 'nom_completo' },
      { title: 'Teléfono', key: 'telefono' },
      { title: 'Acciones', key: 'acciones', sortable: false },
    ],
    formFields,
    apiUrl: 'abogados',
    itemKey: 'id',
    defaultRecord: {
      nombres: '',
      apellidos: '',
      cedula: '',
      telefono: '',
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