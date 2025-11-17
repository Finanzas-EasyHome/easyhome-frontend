<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useClientes } from '../composables/useClientes.js';
import ClienteDialog from '../components/ClienteDialog.vue';
import ClienteDetailDialog from '../components/ClienteDetailDialog.vue';

const toast = useToast();
const confirm = useConfirm();

const {
  clientes,
  loading,
  error,
  searchQuery,
  totalClientes,
  fetchClientes,
  addCliente,
  modifyCliente,
  removeCliente,
  setSearchQuery
} = useClientes();

// State
const selectedClientes = ref([]);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const selectedCliente = ref(null);
const selectedClienteForDetail = ref(null);
const isEditMode = ref(false);

// Methods
const handleSearch = (event) => {
  setSearchQuery(event.target.value);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const openCreateDialog = () => {
  selectedCliente.value = null;
  isEditMode.value = false;
  dialogVisible.value = true;
};

const openEditDialog = (cliente) => {
  selectedCliente.value = { ...cliente };
  isEditMode.value = true;
  dialogVisible.value = true;
};

const openDetailDialog = (cliente) => {
  selectedClienteForDetail.value = { ...cliente };
  detailDialogVisible.value = true;
};

const handleSave = async (clienteData) => {
  try {
    if (isEditMode.value && selectedCliente.value) {
      await modifyCliente(selectedCliente.value.id, clienteData);
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cliente actualizado correctamente',
        life: 3000
      });
    } else {
      await addCliente(clienteData);
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cliente creado correctamente',
        life: 3000
      });
    }
    dialogVisible.value = false;
    selectedCliente.value = null;
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'Error al guardar el cliente',
      life: 3000
    });
  }
};

const confirmDelete = (cliente) => {
  confirm.require({
    message: `¿Está seguro que desea eliminar al cliente ${cliente.nombresApellidos}?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(cliente.id)
  });
};

const handleDelete = async (id) => {
  try {
    await removeCliente(id);
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Cliente eliminado correctamente',
      life: 3000
    });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'Error al eliminar el cliente',
      life: 3000
    });
  }
};

// Lifecycle
onMounted(() => {
  fetchClientes();
});
</script>

<template>
  <div class="clientes-view">
    <!-- Header -->
    <div class="page-header mb-4">
      <h1 class="page-title">LISTA DE CLIENTES</h1>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <!-- Toolbar -->
      <div class="flex flex-column md:flex-row justify-content-between align-items-center gap-3 mb-4">
        <div class="search-wrapper">
          <span class="p-input-icon-left w-full">
            <InputGroup>
              <InputGroupAddon>
                <i class="pi pi-search" />
                </InputGroupAddon>
            <InputText
                v-model="searchQuery"
                placeholder="Buscar por nombre, DNI o estado civil..."
                class="w-full search-input-custom"
                @input="handleSearch"
            />
              </InputGroup>
          </span>
        </div>

        <Button
            label="Nuevo Cliente"
            icon="pi pi-plus"
            class="p-button-success btn-nuevo"
            @click="openCreateDialog"
        />
      </div>

      <!-- Data Table -->
      <DataTable
          :value="clientes"
          :loading="loading"
          :paginator="true"
          :rows="5"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
          responsiveLayout="scroll"
          stripedRows
          class="clientes-table"
          dataKey="id"
      >
        <template #empty>
          <div class="text-center py-5">
            <i class="pi pi-inbox" style="font-size: 3rem; color: #6b7280; opacity: 0.5"></i>
            <p class="text-secondary mt-3 mb-0">No se encontraron clientes</p>
          </div>
        </template>

        <template #loading>
          <div class="flex flex-column align-items-center justify-content-center py-5">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            <p class="text-secondary mt-3">Cargando clientes...</p>
          </div>
        </template>

        <Column field="id" header="ID" :sortable="true" style="min-width: 4rem">
          <template #body="{ data }">
            <span class="font-semibold">#{{ data.id }}</span>
          </template>
        </Column>

        <Column field="nombresApellidos" header="Nombres y Apellidos" :sortable="true" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              <span>{{ data.nombresApellidos }}</span>
            </div>
          </template>
        </Column>

        <Column field="dni" header="DNI" :sortable="true" style="min-width: 8rem">
          <template #body="{ data }">
            <span class="font-mono">{{ data.dni }}</span>
          </template>
        </Column>

        <Column field="edad" header="Edad" :sortable="true" style="min-width: 5rem">
          <template #body="{ data }">
            <span>{{ data.edad }} años</span>
          </template>
        </Column>

        <Column field="ingresoFamiliar" header="Ingreso Familiar (S/.)" :sortable="true" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-success font-semibold">
              S/. {{ formatCurrency(data.ingresoFamiliar) }}
            </span>
          </template>
        </Column>

        <Column field="aporte" header="Aporte (S/.)" :sortable="true" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-primary font-semibold">
              S/. {{ formatCurrency(data.aporte) }}
            </span>
          </template>
        </Column>

        <Column field="estadoCivil" header="Estado Civil" :sortable="true" style="min-width: 8rem">
          <template #body="{ data }">
            <span class="estado-civil-badge">{{ data.estadoCivil }}</span>
          </template>
        </Column>

        <Column header="Acciones" style="min-width: 10rem" :exportable="false">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                  icon="pi pi-eye"
                  class="p-button-rounded p-button-text p-button-success"
                  v-tooltip.top="'Ver Detalles'"
                  @click="openDetailDialog(data)"
              />
              <Button
                  icon="pi pi-pencil"
                  class="p-button-rounded p-button-text p-button-info"
                  v-tooltip.top="'Editar'"
                  @click="openEditDialog(data)"
              />
              <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-danger"
                  v-tooltip.top="'Eliminar'"
                  @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog for Create/Edit -->
    <ClienteDialog
        v-model:visible="dialogVisible"
        :cliente="selectedCliente"
        :is-edit="isEditMode"
        @save="handleSave"
    />

    <!-- Dialog for Details -->
    <ClienteDetailDialog
        v-model:visible="detailDialogVisible"
        :cliente="selectedClienteForDetail"
    />

    <!-- Toast -->
    <Toast />

    <!-- Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.clientes-view {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-top: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  letter-spacing: -0.025em;
}

.content-card {
  background: white;
  border-radius: 0;
  box-shadow: none;
  padding: 1.5rem 2rem;
  margin: 0 1.5rem;
}

.search-wrapper {
  flex: 1;
  max-width: 350px;
  width: 100%;
}

.search-input-custom {
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.btn-nuevo {
  white-space: nowrap;
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
}

.clientes-table {
  font-size: 0.875rem;
  margin-top: 1.5rem;
}

.text-primary {
  color: #059669;
}

.text-success {
  color: #10b981;
}

.text-secondary {
  color: #6b7280;
}

.font-mono {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.estado-civil-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 16px;
  background: #d1fae5;
  color: #065f46;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* Estilos específicos de PrimeVue para esta vista */
:deep(.p-datatable) {
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
  border: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: transparent;
  color: #374151;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
  border-top: none;
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f9fafb;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem;
  font-size: 0.875rem;
  border: none;
}

:deep(.p-datatable .p-datatable-tbody > tr:last-child) {
  border-bottom: none;
}

/* Paginator personalizado */
:deep(.p-paginator) {
  background: #059669;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: none;
  justify-content: space-between;
  margin-top: 1rem;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
  min-width: 2.5rem;
  height: 2.5rem;
  margin: 0 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: white;
  color: #059669;
  border-color: white;
  font-weight: 600;
}

:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last) {
  color: white;
  min-width: 2.5rem;
  height: 2.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.p-paginator .p-paginator-first:not(.p-disabled):hover),
:deep(.p-paginator .p-paginator-prev:not(.p-disabled):hover),
:deep(.p-paginator .p-paginator-next:not(.p-disabled):hover),
:deep(.p-paginator .p-paginator-last:not(.p-disabled):hover) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.p-paginator .p-paginator-current) {
  color: white;
  font-weight: 500;
}

:deep(.p-paginator .p-dropdown) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
  margin-left: 0.5rem;
}

:deep(.p-paginator .p-dropdown:hover) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

:deep(.p-paginator .p-dropdown .p-dropdown-label) {
  color: white;
}

@media (max-width: 768px) {
  .clientes-view {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .content-card {
    padding: 1rem;
    margin: 0 0.5rem;
  }
}
</style>