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
import { formatCurrency } from '@/utils/formatters'

// Usa el store apuntando a la API de funcionarios públicos.
const store = useCrudStore('funcpublic')()
const { isEditing, editedRecord } = storeToRefs(store)

// 🧠 Computamos el nombre completo en tiempo real
const nombreCompleto = computed(() => {
  const nombres = editedRecord.value?.nombres || ''
  const apellidos = editedRecord.value?.apellidos || ''
  return `${nombres} ${apellidos}`.trim()
})

// ⚙️ Configuración de la tabla y formulario
const pardonConfig = computed(() => {
  const formFields = [
    { key: 'nombres', label: 'Nombres', type: 'text', required: true, hint: 'Nombre(s) del funcionario' },
    { key: 'apellidos', label: 'Apellidos', type: 'text', required: true, hint: 'Apellido(s) del funcionario' },
    { key: 'completo', label: 'Nombre Completo', type: 'text', readonly: true, hint: 'Generado automáticamente. Útil para registros incompletos.',
      value: nombreCompleto.value 
    },
    { key: 'cedula', label: 'Cédula', type: 'text', required: true, hint: 'Número de cédula del funcionario', readonly: isEditing.value 
    },
    { key: 'telefono', label: 'Teléfono', type: 'text', required: false, hint: 'Número de contacto' },
    { key: 'salario', label: 'Salario', type: 'number', required: true, hint: 'Salario del funcionario público', min: 0 },
  ]

  return {
    title: 'Padrón de Funcionarios Públicos',
    searchLabel: 'Buscar por nombre, apellido o cédula...',
    headers: [
      { title: 'Cédula', key: 'cedula' },
      { title: 'Nombres', key: 'nombres' },
      { title: 'Apellidos', key: 'apellidos' },
      { title: 'Salario', key: 'salario',align: 'end', 
        value: item => formatCurrency(item.salario), },
      { title: 'Teléfono', key: 'telefono' },
      { title: 'Acciones', key: 'acciones', sortable: false },
    ],
    formFields,
    apiUrl: 'funcpublic',
    itemKey: 'id',
    defaultRecord: {
      nombres: '',
      apellidos: '',
      cedula: '',
      telefono: '',
      salario: 0
    },
    // Nuevas configuraciones para los selectores
    filters: true,
  }
})

// Carga inicial de datos al montar el componente
onMounted(async () => {
  // Los filtros ya se cargan automáticamente desde el CrudControls
  await store.loadItems({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    search: ''
  })
});
</script>