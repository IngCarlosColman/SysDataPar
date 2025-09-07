<template>
  <v-dialog
    :model-value="props.show"
    @update:model-value="$emit('update:show', $event)"
    max-width="500px"
    persistent
  >
    <v-card rounded="xl" elevation="12">
      <v-card-title
        class="bg-red-darken-4 text-white text-h5 font-weight-bold text-center pt-6 pb-2 position-relative"
      >
        <v-icon large class="mr-2">mdi-alert-circle-outline</v-icon>
        <span>Confirmación de Eliminación</span>
        <v-btn
          icon
          variant="text"
          color="white"
          @click="$emit('update:show', false)"
          class="position-absolute"
          style="top: 10px; right: 10px;"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <p class="font-weight-medium text-subtitle-1 text-center mb-2">
          ¿Estás seguro de que deseas eliminar el siguiente registro?
        </p>
        <div class="text-pre-wrap font-weight-bold text-h6 text-center text-red-darken-4">
          {{ displayRecord }}
        </div>
        <p class="text-caption text-grey-darken-1 text-center mt-2">
          Esta acción no se puede deshacer.
        </p>
      </v-card-text>

      <v-card-actions class="px-6 py-4 bg-grey-lighten-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="outlined"
          rounded="xl"
          @click="$emit('update:show', false)"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="red-darken-3"
          variant="elevated"
          rounded="xl"
          @click="$emit('delete-record')"
        >
          Eliminar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  show: Boolean,
  recordToDelete: Object,
  // ¡Añadido! Ahora acepta un array con la información de los campos a mostrar
  headersToDisplay: {
    type: Array,
    required: false,
    default: () => [],
  },
});

const emits = defineEmits(['update:show', 'delete-record']);

const displayRecord = computed(() => {
  if (!props.recordToDelete || Object.keys(props.recordToDelete).length === 0) {
    return 'Registro Desconocido';
  }

  // Si se pasaron los campos a mostrar, los muestra en formato 'Etiqueta: Valor'
  if (props.headersToDisplay.length > 0) {
    const displayValues = props.headersToDisplay.map(header => {
      const value = props.recordToDelete[header.key];
      return `${header.title}: ${value}`;
    });
    return displayValues.join('\n'); // Unimos los valores con un salto de línea
  }
  
  // Lógica de fallback, en caso de que no se pasen los campos a mostrar
  if (props.recordToDelete.nombres) {
    return props.recordToDelete.nombres;
  }
  if (props.recordToDelete.nombre) {
    return props.recordToDelete.nombre;
  }
  if (props.recordToDelete.title) {
    return props.recordToDelete.title;
  }
  return 'Registro Desconocido';
});
</script>

<style scoped>
.v-dialog {
  overflow: visible;
}
</style>