<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="600px"
    persistent
  >
    <v-card rounded="xl">
      <!-- Encabezado del modal con título y un fondo azul vibrante -->
      <v-card-title class="bg-blue-darken-3 text-h5 text-center text-white py-4 font-weight-bold">
        {{ title }}
      </v-card-title>

      <v-divider></v-divider>

      <!-- Contenido del formulario con un padding generoso -->
      <v-card-text>
        <v-form ref="form" @submit.prevent="saveRecord">
          <v-container class="px-6 py-4">
            <v-row>
              <v-col
                v-for="field in formFields"
                :key="field.key"
                cols="12"
                sm="6"
              >
                <!-- Campos del formulario con estilo 'outlined' y esquinas redondeadas -->
                <v-text-field
                  v-model="editedRecord[field.key]"
                  :label="field.label"
                  :type="field.type || 'text'"
                  :rules="field.rules || []"
                  :readonly="field.readonly"
                  variant="outlined"
                  density="compact"
                  rounded="xl"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <!-- Pie de página del modal con botones de acción -->
      <v-card-actions class="px-6 py-4 bg-blue-lighten-5">
        <v-spacer></v-spacer>
        <!-- Botón de Cancelar con un color sutil y un ícono -->
        <v-btn
          color="blue-grey"
          variant="text"
          rounded="xl"
          prepend-icon="mdi-close-circle"
          @click="closeModal"
        >
          Cancelar
        </v-btn>
        <!-- Botón de Guardar con un estilo de botón primario y un ícono -->
        <v-btn
          color="blue-darken-3"
          variant="flat"
          rounded="xl"
          prepend-icon="mdi-content-save"
          @click="saveRecord"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  editedRecord: {
    type: Object,
    required: true,
  },
  formFields: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:show', 'save-record']);
const form = ref(null);

// Lógica para cerrar el modal
const closeModal = () => {
  emit('update:show', false);
};

// Lógica para guardar el registro después de la validación
const saveRecord = async () => {
  const { valid } = await form.value.validate();
  if (valid) {
    emit('save-record', props.editedRecord);
  }
};
</script>

<style scoped>
.v-dialog {
  overflow: visible;
}

.v-card-title {
  font-weight: 500;
}
</style>
