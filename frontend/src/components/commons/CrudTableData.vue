<template>
  <v-data-table-server
    v-model:items-per-page="props.itemsPerPage"
    :headers="props.pardonConfig.headers"
    :items="props.records"
    :items-length="props.totalRecords"
    :loading="props.loading"
    :items-per-page-options="[10, 25, 50, -1]"
    :item-class="getRecordClass"
    class="mt-4 rounded-lg elevation-2 data-table-headers"
    custom-sort-icon="mdi-sort-variant"
    @update:options="props.store.loadItems"
  >
    <template v-slot:item.acciones="{ item }">
      <div class="d-flex justify-end">
        <v-btn
          v-if="item.telefono"
          icon
          color="success"
          variant="tonal"
          size="small"
          @click="props.store.handleCall(item.telefono)"
          class="mr-2"
        >
          <v-icon>mdi-phone</v-icon>
          <v-tooltip activator="parent" location="top">Llamar</v-tooltip>
        </v-btn>

        <v-btn
          v-if="item.telefono"
          icon
          color="green-darken-1"
          variant="tonal"
          size="small"
          @click="props.store.handleWhatsapp(item.telefono)"
          class="mr-2"
        >
          <v-icon>mdi-whatsapp</v-icon>
          <v-tooltip activator="parent" location="top">WhatsApp</v-tooltip>
        </v-btn>

        <v-btn
          v-if="item.telefono"
          icon
          color="blue-grey-lighten-1"
          variant="tonal"
          size="small"
          @click="props.store.generateVCard(item)"
          class="mr-2"
        >
          <v-icon>mdi-account-box-multiple</v-icon>
          <v-tooltip activator="parent" location="top">Generar V-Card</v-tooltip>
        </v-btn>

        <v-btn
          icon
          color="primary"
          variant="tonal"
          size="small"
          @click="props.store.openEditModal(props.pardonConfig.defaultRecord, item)"
          class="mr-2"
        >
          <v-icon>mdi-pencil</v-icon>
          <v-tooltip activator="parent" location="top">Editar</v-tooltip>
        </v-btn>

        <v-btn
          icon
          color="red-lighten-1"
          variant="tonal"
          size="small"
          @click="props.store.openDeleteModal(item[props.pardonConfig.itemKey])"
        >
          <v-icon>mdi-delete</v-icon>
          <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
        </v-btn>
      </div>
    </template>

    <template v-slot:no-data>
      <v-alert
        type="info"
        icon="mdi-information"
        class="text-center ma-4"
        variant="tonal"
      >
        No hay registros disponibles.
      </v-alert>
    </template>
  </v-data-table-server>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  records: Array,
  totalRecords: Number,
  loading: Boolean,
  pardonConfig: Object,
  searchQuery: String,
  itemsPerPage: Number,
  store: Object,
});

const getRecordClass = (item) => {
  return item.isUpdated ? 'highlighted-row' : '';
};
</script>

<style scoped>
/* Estilos para el encabezado de la tabla */
.data-table-headers :deep(.v-data-table__thead) {
  background-color: #E6E6E6;
}
.data-table-headers :deep(.v-data-table__thead th) {
  color: #000000;
  text-transform: uppercase;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
}
.data-table-headers :deep(.v-data-table__thead th:hover) {
  transform: scale(1.02);
}
/* Estilo para la fila resaltada */
.highlighted-row {
  background-color: #E3F2FD !important;
  transition: background-color 0.5s ease-in-out;
}
</style>