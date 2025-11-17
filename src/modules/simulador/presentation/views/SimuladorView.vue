<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useSimulador } from '../composables/useSimulador.js';
import { useClientes } from '../../../clientes/presentation/composables/useClientes.js';
import CostosAdicionalesDialog from '../components/CostosAdicionalesDialog.vue';
import CronogramaDialog from '../components/CronogramaDialog.vue';

const toast = useToast();

const {
  simulacionActual,
  loading,
  calcular,
  guardar,
  limpiarSimulacion,
  entidadesFinancieras,
  programasVivienda,
  fetchEntidadesFinancieras,
  fetchProgramasVivienda,
  tieneSimulacion,
  exportarCronograma
} = useSimulador();

const { allClientes, fetchClientes } = useClientes();

// State del formulario
const formData = ref({
  clienteNombre: '',
  programaObjetivo: '',
  cuotaInicial: 0,
  valorVivienda: 0,
  montoBono: 0,
  montoFinanciado: 0,
  fechaInicioPago: new Date(),
  entidadFinanciera: '',
  tipoTasa: 'TEA',
  tasaInteres: 0,
  costosAdicionales: '+',
  plazoPrestamo: 240,
  periodoGracia: 0,
  // Costos adicionales
  seguroDesgravamen: 0,
  tasacion: 0,
  seguroInmueble: 0,
  gastosNotariales: 0,
  comisionDesembolso: 0
});

// Estados de los diálogos
const costosDialogVisible = ref(false);
const cronogramaDialogVisible = ref(false);

// Computed
const clientesOptions = computed(() =>
    allClientes.value.map(cliente => (
        {
          label: cliente.nombresApellidos,
          value: cliente.nombresApellidos
        }
    ))
);

const montoFinanciadoCalculado = computed(() => {
  const valor = parseFloat(formData.value.valorVivienda) || 0;
  const inicial = parseFloat(formData.value.cuotaInicial) || 0;
  const bono = parseFloat(formData.value.montoBono) || 0;
  return Math.max(0, valor - inicial - bono);
});

// Watchers para actualizar monto financiado
const updateMontoFinanciado = () => {
  formData.value.montoFinanciado = montoFinanciadoCalculado.value;
};

// Methods
const handleCalcular = async () => {
  try {
    // Validaciones básicas
    if (!formData.value.clienteNombre) {
      toast.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un cliente',
        life: 3000
      });
      return;
    }

    if (!formData.value.entidadFinanciera) {
      toast.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar una entidad financiera',
        life: 3000
      });
      return;
    }

    // Actualizar monto financiado
    updateMontoFinanciado();

    // Realizar cálculo
    await calcular(formData.value);

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Simulación calculada correctamente',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al calcular la simulación',
      life: 3000
    });
  }
};

const handleGuardar = async () => {
  try {
    await guardar();

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Los datos se guardaron exitosamente',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al guardar la simulación',
      life: 3000
    });
  }
};

const handleEditar = () => {
  toast.add({
    severity: 'info',
    summary: 'Información',
    detail: 'Puede modificar los datos y volver a calcular',
    life: 3000
  });
};

const handleLimpiar = () => {
  formData.value = {
    clienteNombre: '',
    programaObjetivo: '',
    cuotaInicial: 0,
    valorVivienda: 0,
    montoBono: 0,
    montoFinanciado: 0,
    fechaInicioPago: new Date(),
    entidadFinanciera: '',
    tipoTasa: 'TEA',
    tasaInteres: 0,
    costosAdicionales: '+',
    plazoPrestamo: 240,
    periodoGracia: 0,
    seguroDesgravamen: 0,
    tasacion: 0,
    seguroInmueble: 0,
    gastosNotariales: 0,
    comisionDesembolso: 0
  };

  limpiarSimulacion();

  toast.add({
    severity: 'info',
    summary: 'Formulario limpiado',
    detail: 'Todos los campos han sido reiniciados',
    life: 2000
  });
};

const openCostosDialog = () => {
  costosDialogVisible.value = true;
};

const handleCostosGuardados = (costos) => {
  Object.assign(formData.value, costos);
  costosDialogVisible.value = false;
};

const handleExportCronograma = () => {
  try {
    const fecha = new Date().toISOString().split('T')[0];
    exportarCronograma(`cronograma_pagos_${fecha}.xls`);
    toast.add({
      severity: 'success',
      summary: 'Exportación completada',
      detail: 'El cronograma se exportó correctamente en Excel',
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error al exportar',
      detail: error.message || 'No fue posible exportar el cronograma',
      life: 3000
    });
  }
};

const verCronograma = () => {
  if (simulacionActual.value?.cronogramaPagos?.length > 0) {
    cronogramaDialogVisible.value = true;
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Sin cronograma',
      detail: 'Debe calcular una simulación antes de ver el cronograma',
      life: 3000
    });
  }
};

// Lifecycle
onMounted(async () => {
  await fetchClientes();
  await fetchEntidadesFinancieras();
  await fetchProgramasVivienda();
});
</script>

<template>
  <div class="simulador-view">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">SIMULADOR DE PLAN DE PAGOS</h1>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <!-- Formulario en Grid 2 Columnas -->
      <div class="form-section">
        <div class="grid">
          <!-- COLUMNA IZQUIERDA -->

          <!-- Cliente -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="cliente">Cliente</label>
              <Dropdown
                  id="cliente"
                  v-model="formData.clienteNombre"
                  :options="clientesOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar"
                  class="w-full"
                  :disabled="loading"
                  appendTo="body"
              />
            </div>
          </div>

          <!-- Programa Objetivo -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="programa">Programa objetivo</label>
              <InputText
                  id="programa"
                  v-model="formData.programaObjetivo"
                  placeholder="Techo Propio"
                  class="w-full"
                  :disabled="loading"
              />
            </div>
          </div>

          <!-- Cuota Inicial -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="cuotaInicial">Cuota inicial (S/.)</label>
              <InputNumber
                  id="cuotaInicial"
                  v-model="formData.cuotaInicial"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  class="w-full"
                  :disabled="loading"
                  @input="updateMontoFinanciado"
              />
            </div>
          </div>

          <!-- Valor Vivienda -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="valorVivienda">Valor de vivienda (S/.)</label>
              <InputNumber
                  id="valorVivienda"
                  v-model="formData.valorVivienda"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  class="w-full"
                  :disabled="loading"
                  @input="updateMontoFinanciado"
              />
            </div>
          </div>

          <!-- Monto del Bono -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="montoBono">Monto del Bono (S/.)</label>
              <InputNumber
                  id="montoBono"
                  v-model="formData.montoBono"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  class="w-full"
                  :disabled="loading"
                  @input="updateMontoFinanciado"
              />
            </div>
          </div>

          <!-- Monto Financiado (SIEMPRE EN VERDE) -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="montoFinanciado">Monto Financiado (S/.)</label>
              <InputNumber
                  id="montoFinanciado"
                  :value="montoFinanciadoCalculado"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  class="w-full monto-financiado-input"
                  disabled
              />
            </div>
          </div>

          <!-- COLUMNA DERECHA -->

          <!-- Fecha de Inicio de Pago -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="fechaInicio">Fecha de Inicio de Pago</label>
              <Calendar
                  id="fechaInicio"
                  v-model="formData.fechaInicioPago"
                  dateFormat="dd/mm/yy"
                  placeholder="dd/mm/aaaa"
                  class="w-full"
                  :disabled="loading"
              />
            </div>
          </div>

          <!-- Entidad Financiera -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="entidad">Entidad Financiera</label>
              <Dropdown
                  id="entidad"
                  v-model="formData.entidadFinanciera"
                  :options="entidadesFinancieras"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar"
                  class="w-full"
                  :disabled="loading"
                  appendTo="body"
              />
            </div>
          </div>

          <!-- Tipo de Tasa y Valor -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="tipoTasa">Tipo de Tasa</label>
              <div class="flex gap-2">
                <Dropdown
                    id="tipoTasa"
                    v-model="formData.tipoTasa"
                    :options="[
                      { label: 'TEA', value: 'TEA' },
                      { label: 'TEM', value: 'TEM' }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    class="flex-1"
                    :disabled="loading"
                    appendTo="body"
                />
                <InputNumber
                    v-model="formData.tasaInteres"
                    suffix="%"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    class="flex-1"
                    :disabled="loading"
                />
              </div>
            </div>
          </div>

          <!-- Costos Adicionales -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="costos">Costos adicionales</label>
              <div class="flex gap-2">
                <InputText
                    id="costos"
                    :value="formData.costosAdicionales"
                    class="flex-1"
                    disabled
                />
                <Button
                    icon="pi pi-plus"
                    class="p-button-success btn-plus"
                    @click="openCostosDialog"
                    :disabled="loading"
                />
              </div>
            </div>
          </div>

          <!-- Plazo del Préstamo -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="plazo">Plazo del prestamo</label>
              <div class="flex gap-2">
                <Dropdown
                    id="plazo"
                    v-model="formData.plazoPrestamo"
                    :options="[
                      { label: '5 años', value: 60 },
                      { label: '10 años', value: 120 },
                      { label: '15 años', value: 180 },
                      { label: '20 años', value: 240 },
                      { label: '25 años', value: 300 }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    class="flex-1"
                    :disabled="loading"
                    appendTo="body"
                />
                <InputNumber
                    :value="formData.plazoPrestamo"
                    suffix=" m"
                    class="flex-1"
                    disabled
                />
              </div>
            </div>
          </div>

          <!-- Periodo de Gracia -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="gracia">Periodo de gracia</label>
              <div class="flex gap-2">
                <Dropdown
                    id="gracia"
                    v-model="formData.periodoGracia"
                    :options="[
                      { label: 'Sin gracia', value: 0 },
                      { label: '3 meses', value: 3 },
                      { label: '6 meses', value: 6 },
                      { label: '12 meses', value: 12 }
                    ]"
                    optionLabel="label"
                    optionValue="value"
                    class="flex-1"
                    :disabled="loading"
                    appendTo="body"
                />
                <InputNumber
                    :value="formData.periodoGracia"
                    suffix=" m"
                    class="flex-1"
                    disabled
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="action-buttons">
        <Button
            label="Calcular"
            icon="pi pi-calculator"
            class="p-button-primary"
            @click="handleCalcular"
            :loading="loading"
        />
        <Button
            label="Guardar"
            icon="pi pi-save"
            class="p-button-success"
            @click="handleGuardar"
            :disabled="!tieneSimulacion || loading"
        />
        <Button
            label="Editar"
            icon="pi pi-pencil"
            class="p-button-warning"
            @click="handleEditar"
            :disabled="!tieneSimulacion || loading"
        />
        <Button
            label="Limpiar"
            icon="pi pi-trash"
            class="p-button-secondary"
            @click="handleLimpiar"
            :disabled="loading"
        />
      </div>

      <!-- Resumen del cálculo -->
      <div v-if="simulacionActual" class="resumen-section">
        <h3 class="resumen-title">Resumen del calculo</h3>

        <div class="resumen-grid">
          <div class="resumen-item">
            <span class="resumen-label">Monto Financiado:</span>
            <span class="resumen-value">S/ {{ simulacionActual.montoFinanciado?.toFixed(2) }}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">TCEA:</span>
            <span class="resumen-value">{{ simulacionActual.tcea?.toFixed(2) }}%</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Cuota mensual:</span>
            <span class="resumen-value">S/ {{ simulacionActual.cuotaMensual?.toFixed(2) }}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">VAN:</span>
            <span class="resumen-value">S/ {{ simulacionActual.van?.toFixed(2) }}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">Intereses:</span>
            <span class="resumen-value">S/ {{ simulacionActual.totalIntereses?.toFixed(2) }}</span>
          </div>
          <div class="resumen-item">
            <span class="resumen-label">TIR:</span>
            <span class="resumen-value">{{ simulacionActual.tir?.toFixed(2) }}%</span>
          </div>
        </div>

        <!-- Botón Ver Cronograma -->
        <div class="resumen-button-container">
          <Button
              label="Ver Cronograma"
              icon="pi pi-calendar"
              class="p-button-info"
              @click="verCronograma"
          />
        </div>
      </div>
    </div>

    <!-- Diálogos -->
    <CostosAdicionalesDialog
        v-model:visible="costosDialogVisible"
        :costos="formData"
        @guardar="handleCostosGuardados"
    />

    <CronogramaDialog
        v-model:visible="cronogramaDialogVisible"
        :cronograma="simulacionActual?.cronogramaPagos"
        @export="handleExportCronograma"
    />

    <!-- Toast -->
    <Toast />
  </div>
</template>

<style scoped>
.simulador-view {
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
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin: 0 1.5rem;
  border: 3px solid #059669;
}

.form-section {
  margin-bottom: 2rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-plus {
  padding: 0.75rem !important;
  width: auto !important;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 2rem 0;
  border-top: 2px solid #059669;
  border-bottom: 2px solid #059669;
  flex-wrap: wrap;
}

.resumen-section {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.resumen-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: white;
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.resumen-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.resumen-label {
  font-weight: 600;
  color: #d1fae5;
  font-size: 0.875rem;
}

.resumen-value {
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
}

.resumen-button-container {
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.monto-financiado-input :deep(.p-inputnumber-input) {
  background: #d1fae5 !important;
  color: #065f46 !important;
  font-weight: 700 !important;
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .content-card {
    padding: 1rem;
    margin: 0 0.5rem;
  }

  .action-buttons {
    gap: 0.5rem;
  }

  .resumen-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  :deep(.p-button) {
    font-size: 0.875rem;
    padding: 0.625rem 1rem !important;
  }
}

/* Estilos para los inputs y dropdowns */
:deep(.p-inputtext),
:deep(.p-inputnumber-input),
:deep(.p-dropdown) {
  border: 1px solid #d1d5db !important;
  border-radius: 8px !important;
  font-size: 0.875rem !important;
}

:deep(.p-inputtext:hover),
:deep(.p-inputnumber:hover .p-inputnumber-input),
:deep(.p-dropdown:hover) {
  border-color: #059669 !important;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber.p-inputnumber-focus .p-inputnumber-input),
:deep(.p-dropdown.p-focus) {
  border-color: #059669 !important;
  box-shadow: 0 0 0 0.2rem rgba(5, 150, 105, 0.25) !important;
}

/* Estilos para los botones */
:deep(.p-button) {
  min-width: 120px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
}

:deep(.p-button-primary) {
  background: #3b82f6;
  border-color: #3b82f6;
}

:deep(.p-button-primary:hover) {
  background: #2563eb;
  border-color: #2563eb;
}

:deep(.p-button-success) {
  background: #059669;
  border-color: #059669;
}

:deep(.p-button-success:hover) {
  background: #047857;
  border-color: #047857;
}

:deep(.p-button-warning) {
  background: #f59e0b;
  border-color: #f59e0b;
}

:deep(.p-button-warning:hover) {
  background: #d97706;
  border-color: #d97706;
}

:deep(.p-button-secondary) {
  background: #6b7280;
  border-color: #6b7280;
}

:deep(.p-button-secondary:hover) {
  background: #4b5563;
  border-color: #4b5563;
}

:deep(.p-button-info) {
  background: #06b6d4;
  border-color: #06b6d4;
}

:deep(.p-button-info:hover) {
  background: #0891b2;
  border-color: #0891b2;
}
</style>