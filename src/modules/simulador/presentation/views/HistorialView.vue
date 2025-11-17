<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useSimulador } from '../composables/useSimulador.js';
import CronogramaDialog from '../components/CronogramaDialog.vue';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const {
  historialSimulaciones,
  simulacionActual,
  loading,
  fetchHistorial,
  cargarSimulacion,
  eliminarSimulacion
} = useSimulador();

// State
const searchQuery = ref('');
const selectedSimulacion = ref(null);
const cronogramaDialogVisible = ref(false);

// Computed
const simulacionesFiltradas = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return historialSimulaciones.value;
  }

  const query = searchQuery.value.toLowerCase();
  return historialSimulaciones.value.filter(sim => {
    return (
        sim.clienteNombre?.toLowerCase().includes(query) ||
        sim.programaObjetivo?.toLowerCase().includes(query) ||
        sim.entidadFinanciera?.toLowerCase().includes(query)
    );
  });
});

// Methods
const formatCurrency = (value) => {
  const numero = Number(value || 0);
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const handleVerDetalle = async (simulacion) => {
  try {
    loading.value = true;

    // Cargar la simulación completa
    await cargarSimulacion(simulacion.id);

    // Redirigir al simulador
    await router.push('/simulador');

    toast.add({
      severity: 'success',
      summary: 'Simulación cargada',
      detail: `Se ha cargado la simulación de ${simulacion.clienteNombre}`,
      life: 3000
    });
  } catch (error) {
    console.error('Error al cargar simulación:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar la simulación',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const handleVerCronograma = async (simulacion) => {
  try {
    loading.value = true;

    // Cargar la simulación completa para ver el cronograma
    await cargarSimulacion(simulacion.id);

    // Verificar que se cargó correctamente
    if (simulacionActual.value && simulacionActual.value.cronogramaPagos) {
      selectedSimulacion.value = simulacionActual.value;
      cronogramaDialogVisible.value = true;
    } else {
      throw new Error('No se pudo cargar el cronograma');
    }
  } catch (error) {
    console.error('Error al cargar cronograma:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar el cronograma',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const handleExportarCronograma = () => {
  try {
    if (!selectedSimulacion.value || !selectedSimulacion.value.cronogramaPagos) {
      throw new Error('No hay cronograma para exportar');
    }

    // Generar el nombre del archivo
    const clienteNombre = selectedSimulacion.value.clienteNombre || 'Cliente';
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Cronograma_${clienteNombre.replace(/\s+/g, '_')}_${fecha}.xls`;

    // Preparar los datos
    const cronograma = selectedSimulacion.value.cronogramaPagos;

    const formatCurrency = (valor) => {
      const numero = Number.parseFloat(valor ?? 0);
      const seguro = Number.isFinite(numero) ? numero : 0;
      return `S/ ${seguro.toFixed(2)}`;
    };

    const headerRow = [
      'N° Cuota',
      'Fecha de Pago',
      'Saldo Inicial',
      'Cuota Base',
      'Interés',
      'Amortización',
      'Seguros',
      'Cuota Total',
      'Saldo Final'
    ];

    const rows = cronograma.map(pago => [
      pago.numeroCuota ?? '',
      pago.fechaPago ?? '',
      formatCurrency(pago.saldoInicial),
      formatCurrency(pago.cuotaBase),
      formatCurrency(pago.interes),
      formatCurrency(pago.amortizacion),
      formatCurrency(pago.seguros),
      formatCurrency(pago.cuotaTotal),
      formatCurrency(pago.saldoFinal)
    ]);

    const tableRows = [headerRow, ...rows]
        .map(
            row => `<tr>${row
                .map(value => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`)
                .join('')}</tr>`
        )
        .join('');

    const tableHtml = [
      '<!DOCTYPE html>',
      '<html>',
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <style>',
      '      table { border-collapse: collapse; width: 100%; }',
      '      th, td { border: 1px solid black; padding: 8px; text-align: left; }',
      '      th { background-color: #059669; color: white; font-weight: bold; }',
      '      tr:nth-child(even) { background-color: #f2f2f2; }',
      '    </style>',
      '  </head>',
      '  <body>',
      `    <h2>Cronograma de Pagos - ${selectedSimulacion.value.clienteNombre}</h2>`,
      `    <p><strong>Programa:</strong> ${selectedSimulacion.value.programaObjetivo}</p>`,
      `    <p><strong>Monto Financiado:</strong> ${formatCurrency(selectedSimulacion.value.montoFinanciado)}</p>`,
      `    <p><strong>Plazo:</strong> ${selectedSimulacion.value.plazoPrestamo} meses</p>`,
      `    <p><strong>Tasa:</strong> ${selectedSimulacion.value.tasaInteres}% ${selectedSimulacion.value.tipoTasa}</p>`,
      `    <table>${tableRows}</table>`,
      '  </body>',
      '</html>'
    ].join('\n');

    const blob = new Blob([`\ufeff${tableHtml}`], {
      type: 'application/vnd.ms-excel'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Cronograma exportado correctamente',
      life: 3000
    });
  } catch (error) {
    console.error('Error al exportar:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al exportar el cronograma',
      life: 3000
    });
  }
};

const confirmEliminar = (simulacion) => {
  confirm.require({
    message: `¿Está seguro que desea eliminar esta simulación de ${simulacion.clienteNombre}?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => handleEliminar(simulacion.id)
  });
};

const handleEliminar = async (id) => {
  try {
    await eliminarSimulacion(id);
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Simulación eliminada correctamente',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar la simulación',
      life: 3000
    });
  }
};

const volverAlSimulador = () => {
  router.push('/simulador');
};

// Lifecycle
onMounted(async () => {
  try {
    await fetchHistorial();
  } catch (error) {
    console.error('Error al cargar historial:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar el historial de simulaciones',
      life: 3000
    });
  }
});
</script>

<template>
  <div class="historial-view">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">HISTORIAL DE SIMULACIONES</h1>
      <p class="page-subtitle">Consulta y gestiona tus simulaciones guardadas</p>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrapper">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
                v-model="searchQuery"
                placeholder="Buscar por cliente, programa o entidad..."
                class="search-input"
            />
          </span>
        </div>

        <div class="toolbar-actions">
          <span class="results-count">
            {{ simulacionesFiltradas.length }} simulación(es)
          </span>
          <Button
              label="Volver al Simulador"
              icon="pi pi-arrow-left"
              class="p-button-secondary"
              @click="volverAlSimulador"
          />
        </div>
      </div>

      <!-- Historial Table -->
      <DataTable
          :value="simulacionesFiltradas"
          :loading="loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} simulaciones"
          responsiveLayout="scroll"
          stripedRows
          class="historial-table"
          dataKey="id"
      >
        <template #empty>
          <div class="text-center py-5">
            <i class="pi pi-inbox empty-icon"></i>
            <p class="empty-message">No hay simulaciones guardadas</p>
            <Button
                label="Crear Nueva Simulación"
                icon="pi pi-plus"
                class="p-button-success mt-3"
                @click="volverAlSimulador"
            />
          </div>
        </template>

        <template #loading>
          <div class="flex flex-column align-items-center justify-content-center py-5">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
            <p class="text-secondary mt-3">Cargando historial...</p>
          </div>
        </template>

        <Column field="id" header="ID" :sortable="true" style="min-width: 5rem">
          <template #body="{ data }">
            <span class="id-badge">#{{ data.id }}</span>
          </template>
        </Column>

        <Column field="clienteNombre" header="Cliente" :sortable="true" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              <span class="font-semibold">{{ data.clienteNombre }}</span>
            </div>
          </template>
        </Column>

        <Column field="programaObjetivo" header="Programa" :sortable="true" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="programa-badge">{{ data.programaObjetivo }}</span>
          </template>
        </Column>

        <Column field="entidadFinanciera" header="Entidad" :sortable="true" style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-medium">{{ data.entidadFinanciera }}</span>
          </template>
        </Column>

        <Column field="valorVivienda" header="Valor Vivienda" :sortable="true" style="min-width: 11rem">
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(data.valorVivienda) }}</span>
          </template>
        </Column>

        <Column field="montoFinanciado" header="Monto Financiado" :sortable="true" style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-primary font-semibold">{{ formatCurrency(data.montoFinanciado) }}</span>
          </template>
        </Column>

        <Column field="cuotaMensual" header="Cuota Mensual" :sortable="true" style="min-width: 11rem">
          <template #body="{ data }">
            <span class="text-success font-bold">{{ formatCurrency(data.cuotaMensual) }}</span>
          </template>
        </Column>

        <Column field="plazoPrestamo" header="Plazo" :sortable="true" style="min-width: 8rem">
          <template #body="{ data }">
            <span class="plazo-badge">{{ data.plazoPrestamo }} meses</span>
          </template>
        </Column>

        <Column field="tasaInteres" header="Tasa" :sortable="true" style="min-width: 9rem">
          <template #body="{ data }">
            <span class="tasa-badge">
              {{ data.tasaInteres }}% {{ data.tipoTasa }}
            </span>
          </template>
        </Column>

        <Column field="createdAt" header="Fecha de Creación" :sortable="true" style="min-width: 13rem">
          <template #body="{ data }">
            <div class="fecha-cell">
              <i class="pi pi-calendar text-muted"></i>
              <span class="text-muted">{{ formatDate(data.createdAt) }}</span>
            </div>
          </template>
        </Column>

        <Column header="Acciones" style="min-width: 12rem" :exportable="false" :frozen="true" alignFrozen="right">
          <template #body="{ data }">
            <div class="flex gap-2 justify-content-center">
              <Button
                  icon="pi pi-eye"
                  class="p-button-rounded p-button-text p-button-info"
                  v-tooltip.top="'Ver Detalle'"
                  @click="handleVerDetalle(data)"
                  :loading="loading"
              />
              <Button
                  icon="pi pi-list"
                  class="p-button-rounded p-button-text p-button-success"
                  v-tooltip.top="'Ver Cronograma'"
                  @click="handleVerCronograma(data)"
                  :loading="loading"
              />
              <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-danger"
                  v-tooltip.top="'Eliminar'"
                  @click="confirmEliminar(data)"
                  :disabled="loading"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Cronograma Dialog -->
    <CronogramaDialog
        v-model:visible="cronogramaDialogVisible"
        :cronograma="selectedSimulacion?.cronogramaPagos || []"
        :simulacion="selectedSimulacion"
        @export="handleExportarCronograma"
    />

    <!-- Toast -->
    <Toast />

    <!-- Confirm Dialog -->
    <ConfirmDialog class="confirm-dialog-custom" />
  </div>
</template>

<style scoped>
.historial-view {
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
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin: 0 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.results-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.search-wrapper {
  flex: 1;
  max-width: 500px;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding-left: 2.5rem;
}

.historial-table {
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 4rem;
  color: #6b7280;
  opacity: 0.5;
}

.empty-message {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 1rem 0 0 0;
}

.id-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8125rem;
}

.programa-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 16px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.8125rem;
  font-weight: 600;
}

.tasa-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 16px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.8125rem;
  font-weight: 600;
}

.plazo-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 16px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.8125rem;
  font-weight: 600;
}

.fecha-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.text-muted {
  color: #9ca3af;
  font-size: 0.8125rem;
}

.font-semibold {
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.font-medium {
  font-weight: 500;
}

/* Estilos de DataTable */
:deep(.p-datatable) {
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
  border: none;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f9fafb;
  color: #374151;
  font-weight: 700;
  border-bottom: 2px solid #e5e7eb;
  padding: 1rem;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f9fafb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 1rem;
  font-size: 0.875rem;
  border: none;
}

/* Columna congelada */
:deep(.p-datatable .p-frozen-column) {
  background: white !important;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

:deep(.p-datatable .p-datatable-tbody > tr:hover .p-frozen-column) {
  background: #f9fafb !important;
}

/* Paginator */
:deep(.p-paginator) {
  background: #059669;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
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
}

:deep(.p-paginator .p-paginator-current) {
  color: white;
}

/* Botones */
:deep(.p-button-rounded) {
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

:deep(.p-button-text) {
  background: transparent;
}

:deep(.p-button-text:hover) {
  background: rgba(0, 0, 0, 0.04);
}

:deep(.p-button-text.p-button-info) {
  color: #06b6d4;
}

:deep(.p-button-text.p-button-info:hover) {
  background: rgba(6, 182, 212, 0.1);
}

:deep(.p-button-text.p-button-success) {
  color: #059669;
}

:deep(.p-button-text.p-button-success:hover) {
  background: rgba(5, 150, 105, 0.1);
}

:deep(.p-button-text.p-button-danger) {
  color: #ef4444;
}

:deep(.p-button-text.p-button-danger:hover) {
  background: rgba(239, 68, 68, 0.1);
}

:deep(.p-button-secondary) {
  background: #6b7280;
  border-color: #6b7280;
  transition: all 0.2s ease;
}

:deep(.p-button-secondary:hover) {
  background: #4b5563;
  border-color: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .content-card {
    padding: 1rem;
    margin: 0 0.5rem;
  }

  .toolbar {
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-wrapper {
    max-width: 100%;
    width: 100%;
    min-width: auto;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.875rem;
  }
}
</style>

<style>
/* Estilos globales para ConfirmDialog */
.confirm-dialog-custom.p-dialog {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
}

.confirm-dialog-custom .p-confirm-dialog-message {
  margin-left: 0;
}
</style>