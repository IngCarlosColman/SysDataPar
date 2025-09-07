<template>
  <v-row class="pa-2 mb-4 align-center">
    <v-col cols="12" md="6" class="d-flex align-center">
      <span class="text-h5 font-weight-bold text-wrap text-grey-darken-3">{{ props.title }}</span>
    </v-col>

    <v-col cols="12" md="6" class="d-flex flex-wrap align-center gap-4 mt-2 mt-md-0">
      <v-text-field
        :model-value="props.searchQuery"
        @update:model-value="$emit('update:search-query', $event)"
        label="Realice su busqueda aquí..."
        single-line
        hide-details
        variant="solo-filled"
        density="compact"
        rounded="xl"
        clearable
        flat
        class="flex-grow-1"
        :loading="props.loading"
      >
        <template v-slot:prepend-inner>
          <v-icon color="grey-darken-1">mdi-magnify</v-icon>
        </template>
      </v-text-field>

      <v-btn
        color="green-darken-1"
        size="large"
        rounded="xl"
        class="font-weight-bold text-white"
        @click="$emit('add-new-record')"
      >
        <template #prepend>
          <v-icon color="white">mdi-plus-circle</v-icon>
        </template>
        Añadir
      </v-btn>

      <v-btn-toggle
        :model-value="props.isCardView"
        @update:model-value="$emit('toggle-card-view', $event)"
        mandatory
        rounded="xl"
        color="transparent"
        class="elevation-2"
        density="compact"
        style="background-color: #f5f5f5;"
      >
        <v-btn
          :value="false"
          :color="!props.isCardView ? 'white' : 'transparent'"
          :class="{'bg-blue-darken-2': !props.isCardView, 'text-white': !props.isCardView, 'text-black': props.isCardView}"
          style="transition: all 0.3s ease;"
        >
          <v-icon>mdi-view-list</v-icon>
          <v-tooltip activator="parent" location="top">Vista de Tabla</v-tooltip>
        </v-btn>
        <v-btn
          :value="true"
          :color="props.isCardView ? 'white' : 'transparent'"
          :class="{'bg-blue-darken-2': props.isCardView, 'text-white': props.isCardView, 'text-black': !props.isCardView}"
          style="transition: all 0.3s ease;"
        >
          <v-icon>mdi-grid</v-icon>
          <v-tooltip activator="parent" location="top">Vista de Tarjetas</v-tooltip>
        </v-btn>
      </v-btn-toggle>
    </v-col>

    <v-col cols="12" v-if="props.entidades && props.entidades.length">
      <v-row>
        <v-col cols="12" sm="4" md="4" lg="4">
          <v-select
            :model-value="props.selectedEntidadId"
            :items="props.entidades"
            item-title="nombre_entidad"
            item-value="id"
            label="Seleccionar Entidad"
            variant="outlined"
            rounded="xl"
            density="compact"
            clearable
            @update:model-value="$emit('update:selected-entidad-id', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="4" md="4" lg="4">
          <v-select
            :model-value="props.selectedUniRespId"
            :items="props.uniResp"
            item-title="nombre_uniresp"
            item-value="id"
            label="Seleccionar Unidad Responsable"
            variant="outlined"
            rounded="xl"
            density="compact"
            clearable
            :disabled="!props.uniResp?.length"
            @update:model-value="$emit('update:selected-uni-resp-id', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12" sm="4" md="4" lg="4">
          <v-select
            :model-value="props.selectedCargoId"
            :items="props.cargos"
            item-title="nombre_cargo"
            item-value="id"
            label="Seleccionar Cargo"
            variant="outlined"
            rounded="xl"
            density="compact"
            clearable
            :disabled="!props.cargos?.length"
            @update:model-value="$emit('update:selected-cargo-id', $event)"
          ></v-select>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  searchQuery: String,
  isCardView: Boolean,
  loading: Boolean,
  title: String,
  entidades: Array,
  uniResp: Array,
  cargos: Array,
  selectedEntidadId: [String, Number, null],
  selectedUniRespId: [String, Number, null],
  selectedCargoId: [String, Number, null],
});

const emits = defineEmits([
  'update:search-query',
  'toggle-card-view',
  'add-new-record',
  'update:selected-entidad-id',
  'update:selected-uni-resp-id',
  'update:selected-cargo-id',
]);
</script>

<style scoped>
.gap-4 {
  gap: 1.5rem;
}
</style>