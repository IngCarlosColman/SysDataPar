<template>
  <v-card class="pa-4 w-100 h-100 d-flex flex-column" elevation="5" rounded="xl">
    <CrudControls
      :title="pardonConfig.title"
      :search-query="searchQuery"
      :is-card-view="isCardView"
      :loading="loading"
      @update:search-query="store.setSearchQuery($event)"
      @add-new-record="store.openEditModal(pardonConfig.defaultRecord)"
      @toggle-card-view="isCardView = $event"
      
      :entidades="pardonConfig.showFilters ? entidades : []"
      :uni-resp="pardonConfig.showFilters ? uniResp : []"
      :cargos="pardonConfig.showFilters ? cargos : []"
      :selected-entidad-id="pardonConfig.showFilters ? selectedEntidadId : null"
      :selected-uni-resp-id="pardonConfig.showFilters ? selectedUniRespId : null"
      :selected-cargo-id="pardonConfig.showFilters ? selectedCargoId : null"
      @update:selected-entidad-id="pardonConfig.showFilters ? (id) => store.fetchUniResp(id) : null"
      @update:selected-uni-resp-id="pardonConfig.showFilters ? (id) => store.fetchCargos(id) : null"
      @update:selected-cargo-id="pardonConfig.showFilters ? (id) => store.filterByCargo(id) : null"
    />

    <CrudTableData
      v-if="!isCardView"
      :records="records"
      :total-records="totalRecords"
      :loading="loading"
      :pardon-config="pardonConfig"
      :search-query="searchQuery"
      :items-per-page="itemsPerPage"
      :store="store"
    />

    <CrudCardData
      v-else
      :records="records"
      :pardon-config="pardonConfig"
      :filtered-headers="filteredHeaders"
      :handle-call="handleCall"
      :handle-whatsapp="handleWhatsapp"
      :generate-v-card="generateVCard"
      :store="store"
    />

    <CrudEditModal
      :show="showEditModal"
      :editedRecord="editedRecord"
      :formFields="pardonConfig.formFields"
      :title="editModalTitle"
      :itemKey="pardonConfig.itemKey"
      @update:show="store.showEditModal = $event"
      @save-record="store.saveRecord"
    />

    <CrudDeleteModal
      :show="showDeleteModal"
      :record-to-delete="recordToDelete"
      :headers-to-display="headersToDisplay"
      @update:show="store.showDeleteModal = $event"
      @delete-record="store.deleteRecord"
    />

    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      location="top right"
      rounded="lg"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { defineProps, ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCrudStore } from '@/stores/crud.js';

import CrudControls from '@/components/commons/CrudControls.vue';
import CrudEditModal from '@/components/commons/CrudEditModal.vue';
import CrudDeleteModal from '@/components/commons/CrudDeleteModal.vue';
import CrudTableData from '@/components/commons/CrudTableData.vue';
import CrudCardData from '@/components/commons/CrudCardData.vue';

const props = defineProps({
  pardonConfig: {
    type: Object,
    required: true,
  },
});

const store = useCrudStore(props.pardonConfig.apiUrl)();
const {
  records,
  loading,
  totalRecords,
  searchQuery,
  itemsPerPage,
  editedRecord,
  recordToDelete,
  snackbar,
  showEditModal,
  showDeleteModal,
  entidades,
  uniResp,
  cargos,
  selectedEntidadId,
  selectedUniRespId,
  selectedCargoId
} = storeToRefs(store);

const isCardView = ref(false);

const editModalTitle = computed(() =>
  store.isEditing
    ? `Editar ${props.pardonConfig.title.replace('Padrón ', '')}`
    : `Añadir Nuevo ${props.pardonConfig.title.replace('Padrón ', '')}`
);

const headersToDisplay = computed(() => {
  const keysToDisplay = ['nom_completo', 'cedula'];
  return props.pardonConfig.headers.filter(header =>
    keysToDisplay.includes(header.key)
  );
});

const filteredHeaders = computed(() => {
  return props.pardonConfig.headers.filter(
    (header) => header.key !== 'acciones' && header.key !== 'hidden'
  );
});

onMounted(() => {
  if (props.pardonConfig.showFilters) {
    store.fetchEntidades();
  }
});

watch(() => props.pardonConfig.showFilters, (newValue) => {
  if (!newValue) {
    store.selectedEntidadId = null;
    store.selectedUniRespId = null;
    store.selectedCargoId = null;
  }
});

// Funciones globales que se pasan a los sub-componentes
const formatPhoneNumber = (phone) => {
  let number = String(phone).replace(/ /g, '').replace(/-/g, '');
  if (number.startsWith('+')) {
    const foreignCodes = ['+54', '+55'];
    const isForeign = foreignCodes.some(code => number.startsWith(code));
    if (isForeign) {
      return number;
    } else {
      number = number.substring(1);
    }
  }

  const paraguayCodes = ['099', '098', '097', '096', '06', '02'];
  const paraguayCodesWithoutZero = ['99', '98', '97', '96', '6', '2'];

  if (paraguayCodes.some(code => number.startsWith(code))) {
    return '595' + number.substring(1);
  } else if (paraguayCodesWithoutZero.some(code => number.startsWith(code))) {
    return '595' + number;
  }
  
  return number;
};

const handleCall = (phone) => {
  const formattedNumber = formatPhoneNumber(phone);
  window.location.href = `tel:${formattedNumber}`;
};

const handleWhatsapp = (phone) => {
  const formattedNumber = formatPhoneNumber(phone);
  window.open(`https://wa.me/${formattedNumber}`, '_blank');
};

const generateVCard = (record) => {
  const vcardContent = `BEGIN:VCARD
VERSION:3.0
N:${record.apellidos};${record.nombres};;;
FN:${record.nom_completo}
TEL;type=CELL;type=VOICE;type=pref:+${formatPhoneNumber(record.telefono)}
END:VCARD`;

  const blob = new Blob([vcardContent], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.nom_completo}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
/* Estilos existentes */
</style>