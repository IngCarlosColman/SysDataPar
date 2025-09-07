<template>
  <div class="mt-4 overflow-y-auto">
    <v-row>
      <v-col
        v-for="record in props.records"
        :key="record[props.pardonConfig.itemKey]"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          class="pa-6 d-flex flex-column card-clean"
          rounded="xl"
          elevation="4"
          style="transition: all 0.3s ease-in-out;"
        >
          <v-card-title
            class="text-h6 font-weight-bold text-wrap mb-2 text-grey-darken-3 text-center"
          >
            {{ record.nombres.split(' ').slice(0, 2).join(' ') }}
          </v-card-title>

          <v-divider class="mb-4"></v-divider>
          
          <v-card-text class="flex-grow-1 d-flex flex-column justify-center pa-0">
            <div 
              v-for="header in props.filteredHeaders" 
              :key="header.key" 
              class="mb-3 d-flex align-center"
            >
              <v-icon
                v-if="header.key === 'cedula'"
                class="mr-2"
                color="blue-grey"
              >
                mdi-file-document
              </v-icon>
              <v-icon
                v-else-if="header.key === 'telefono'"
                class="mr-2"
                color="light-green"
              >
                mdi-phone-dial
              </v-icon>
              <span class="font-weight-medium text-grey-darken-2 mr-2">{{ header.title }}:</span>
              <span class="text-grey-darken-3">{{ record[header.key] }}</span>
            </div>
          </v-card-text>
          
          <v-card-actions class="mt-auto d-flex justify-center">
            <v-btn
              v-if="record.telefono"
              icon
              color="light-green"
              variant="tonal"
              size="small"
              @click="props.handleCall(record.telefono)"
              class="mr-2"
            >
              <v-icon>mdi-phone</v-icon>
              <v-tooltip activator="parent" location="top">Llamar</v-tooltip>
            </v-btn>

            <v-btn
              v-if="record.telefono"
              icon
              color="light-green"
              variant="tonal"
              size="small"
              @click="props.handleWhatsapp(record.telefono)"
              class="mr-2"
            >
              <v-icon>mdi-whatsapp</v-icon>
              <v-tooltip activator="parent" location="top">WhatsApp</v-tooltip>
            </v-btn>

            <v-btn
              v-if="record.telefono"
              icon
              color="blue-grey"
              variant="tonal"
              size="small"
              @click="props.generateVCard(record)"
              class="mr-2"
            >
              <v-icon>mdi-account-box-multiple</v-icon>
              <v-tooltip activator="parent" location="top">Generar V-Card</v-tooltip>
            </v-btn>

            <v-btn
              icon
              color="blue"
              variant="tonal"
              size="small"
              @click="props.store.openEditModal(props.pardonConfig.defaultRecord, record)"
              class="mr-2"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">Editar</v-tooltip>
            </v-btn>

            <v-btn
              icon
              color="red"
              variant="tonal"
              size="small"
              @click="props.store.openDeleteModal(record[props.pardonConfig.itemKey])"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="records.length === 0" cols="12">
        <v-alert
          type="info"
          icon="mdi-information"
          class="text-center ma-4"
          variant="tonal"
        >
          No hay registros disponibles.
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  records: Array,
  pardonConfig: Object,
  filteredHeaders: Array,
  handleCall: Function,
  handleWhatsapp: Function,
  generateVCard: Function,
  store: Object,
});
</script>

<style scoped>
.card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.card-clean:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>