import { defineStore } from 'pinia';
import axiosClient from '../api/axiosClient';
import { ref } from 'vue';

// Define un store de Pinia con una API dinámica.
export const useCrudStore = (apiPath) => {
    const storeId = `crud-${apiPath.replace(/\//g, '-')}`;

    // La función defineStore crea un store.
    return defineStore(storeId, () => {
        // --- ESTADO (STATE) ---
        const records = ref([]);
        const loading = ref(false);
        const totalRecords = ref(0);
        const searchQuery = ref('');
        const page = ref(1);
        const itemsPerPage = ref(10);
        const sortBy = ref([]);
        
        // Estado de los modales para editar, adicionar y eliminar.
        const showEditModal = ref(false);
        const isEditing = ref(false);
        const editedRecord = ref({});
        const recordToDeleteId = ref(null);
        const recordToDelete = ref(null);
        const showDeleteModal = ref(false);
        
        // Estado para la barra de notificaciones (snackbar).
        const snackbar = ref({
            show: false,
            message: '',
            color: 'success',
            timeout: 3000
        });

        // Agregamos una variable para manejar el temporizador del debounce
        let searchTimeout = null;

        // ===================================
        // === NUEVO: Estado para los filtros ===
        // ===================================
        const entidades = ref([]);
        const uniResp = ref([]);
        const cargos = ref([]);

        const selectedEntidadId = ref(null);
        const selectedUniRespId = ref(null);
        const selectedCargoId = ref(null);

        // --- ACCIONES (ACTIONS) ---

        /**
         * Carga los datos de la API.
         */
        const loadItems = async (options) => {
            loading.value = true;
            
            page.value = options.page;
            itemsPerPage.value = options.itemsPerPage;
            sortBy.value = options.sortBy;
            
            try {
                const params = {
                    page: page.value,
                    itemsPerPage: itemsPerPage.value,
                    sortBy: JSON.stringify(sortBy.value),
                    search: searchQuery.value,
                    // ======================================
                    // === NUEVO: Parámetros de los filtros ===
                    // ======================================
                    id_entidad: selectedEntidadId.value,
                    id_uni_resp: selectedUniRespId.value,
                    id_cargo: selectedCargoId.value,
                };

                const response = await axiosClient.get(apiPath, { params });
                
                records.value = response.data.items;
                totalRecords.value = response.data.totalItems;
                
            } catch (error) {
                console.error('Error al cargar los registros:', error);
                snackbar.value = { show: true, message: 'Error al cargar los datos.', color: 'error' };
            } finally {
                loading.value = false;
            }
        };

        /**
         * Guarda un registro nuevo o existente.
         */
        const saveRecord = async (record) => {
            try {
                let response;
                if (isEditing.value) {
                    response = await axiosClient.put(`${apiPath}/${record.id}`, record);
                    const updatedItem = response.data;
                    
                    const index = records.value.findIndex(item => item.id == updatedItem.id);
                    
                    if (index !== -1) {
                        records.value.splice(index, 1, updatedItem);
                    }
                    snackbar.value = { show: true, message: 'Registro actualizado.', color: 'success' };
                } else {
                    response = await axiosClient.post(apiPath, record);
                    const newItem = response.data;
                    records.value.unshift(newItem);
                    snackbar.value = { show: true, message: 'Registro adicionado.', color: 'success' };
                }
            } catch (error) {
                 console.error('Error al guardar el registro:', error);
                 const errorMessage = error.response.data.error || 'Ocurrió un error desconocido.';
                 snackbar.value = { show: true, message: `Error: ${errorMessage}`, color: 'error', timeout: 6000 };
            } finally {
                showEditModal.value = false;
            }
        }; // <-- ¡Ahora con la llave de cierre!

        /**
         * Elimina un registro.
         */
        const deleteRecord = async () => {
            try {
                if (!recordToDeleteId.value) {
                    throw new Error('ID del registro a eliminar no encontrado.');
                }

                await axiosClient.delete(`${apiPath}/${recordToDeleteId.value}`);
                
                const index = records.value.findIndex(item => item.id === recordToDeleteId.value);
                if (index !== -1) {
                    records.value.splice(index, 1);
                    totalRecords.value--;
                }

                snackbar.value = { show: true, message: 'Registro eliminado.', color: 'success' };
            } catch (error) {
                console.error('Error al eliminar el registro:', error);
                const errorMessage = error.response.data.error || 'Ocurrió un error desconocido.';
                snackbar.value = { show: true, message: `Error: ${errorMessage}`, color: 'error', timeout: 6000 };
            } finally {
                showDeleteModal.value = false;
                recordToDelete.value = null; // Reiniciar el estado
            }
        };

        /**
         * Abre el modal de edición o adición.
         */
        const openEditModal = (defaultRecord, record = null) => {
            isEditing.value = !!record;
            editedRecord.value = record ? { ...record } : { ...defaultRecord };
            showEditModal.value = true;
        };

        /**
         * Abre el modal de eliminación.
         */
        const openDeleteModal = (id) => {
            recordToDeleteId.value = id;
            recordToDelete.value = records.value.find(r => r.id === id) || null;
            showDeleteModal.value = true;
        };

        /**
         * Acción para la búsqueda con debounce.
         */
        const setSearchQuery = (value) => {
            searchQuery.value = value;
            
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            searchTimeout = setTimeout(() => {
                loadItems({
                    page: 1, 
                    itemsPerPage: itemsPerPage.value,
                    sortBy: sortBy.value,
                });
            }, 1500);
        };
        
        const fetchEntidades = async () => {
            try {
                const response = await axiosClient.get('funcpublic/entidades');
                entidades.value = response.data;
            } catch (error) {
                console.error('Error al obtener entidades:', error);
            }
        };

        /**
         * Obtiene las unidades responsables filtradas por la entidad seleccionada.
         */
        const fetchUniResp = async (entidadId) => {
            selectedEntidadId.value = entidadId;
            // Reiniciamos los selectores inferiores
            selectedUniRespId.value = null;
            selectedCargoId.value = null;
            uniResp.value = [];
            cargos.value = [];

            if (entidadId) {
                try {
                    const response = await axiosClient.get(`funcpublic/uniresp?id_entidad=${entidadId}`);
                    uniResp.value = response.data;
                } catch (error) {
                    console.error('Error al obtener unidades responsables:', error);
                }
            }
            // Recargamos la tabla con el nuevo filtro
            loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: sortBy.value });
        };
        
        /**
         * Obtiene los cargos filtrados por la unidad responsable seleccionada.
         */
        const fetchCargos = async (uniRespId) => {
            selectedUniRespId.value = uniRespId;
            // Reiniciamos el selector de cargos
            selectedCargoId.value = null;
            cargos.value = [];

            if (uniRespId) {
                try {
                    const response = await axiosClient.get(`funcpublic/cargos?id_uni_resp=${uniRespId}`);
                    cargos.value = response.data;
                } catch (error) {
                    console.error('Error al obtener cargos:', error);
                }
            }
            // Recargamos la tabla con el nuevo filtro
            loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: sortBy.value });
        };

        /**
         * Acción para actualizar el filtro de cargos y recargar la tabla.
         */
        const filterByCargo = (cargoId) => {
            selectedCargoId.value = cargoId;
            loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: sortBy.value });
        };

        // Funciones de utilidades movidas al store (ya las tenías, no hay cambios)
        const formatPhoneNumber = (phone) => { /* ... */ };
        const handleCall = (phone) => { /* ... */ };
        const handleWhatsapp = (phone) => { /* ... */ };
        const generateVCard = (record) => { /* ... */ };

        // --- RETORNO (RETURN) ---
        return {
            records,
            loading,
            totalRecords,
            searchQuery,
            page,
            itemsPerPage,
            sortBy,
            showEditModal,
            isEditing,
            editedRecord,
            recordToDeleteId,
            recordToDelete,
            showDeleteModal,
            snackbar,
            entidades,
            uniResp,
            cargos,
            selectedEntidadId,
            selectedUniRespId,
            selectedCargoId,
            fetchEntidades,
            fetchUniResp,
            fetchCargos,
            filterByCargo,
            loadItems,
            saveRecord,
            deleteRecord,
            openEditModal,
            openDeleteModal,
            setSearchQuery,
            handleCall,
            handleWhatsapp,
            generateVCard,
        };
    });
};