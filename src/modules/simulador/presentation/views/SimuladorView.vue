<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useSimulador } from '../composables/useSimulador.js';
import { useClientes } from '../../../clientes/presentation/composables/useClientes.js';
import CostosAdicionalesDialog from '../components/CostosAdicionalesDialog.vue';
import CronogramaDialog from '../components/CronogramaDialog.vue';
import { SimuladorRepositoryImpl } from '../../infrastructure/repositories/SimuladorRepositoryImpl.js';

const toast = useToast();
const repository = new SimuladorRepositoryImpl();

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
  exportarCronograma,
  fetchTasasEntidad
} = useSimulador();

const { allClientes, fetchClientes } = useClientes();

// State del formulario
const formData = ref({
  clienteId: null,
  clienteNombre: '',
  programaObjetivo: '',
  cuotaInicial: 0,
  cuotaInicialPorcentaje: 0,
  valorVivienda: 0,
  montoBono: 0,
  montoFinanciado: 0,
  fechaInicioPago: new Date(),
  // ⚠️ Aquí se guarda el ID (uuid) de la entidad en Supabase
  entidadFinanciera: '',
  tipoTasa: 'TEA',
  tasaInteres: 0,
  costosAdicionales: '+',
  plazoPrestamo: 240,
  periodoGracia: 0,
  tipoPeriodoGracia: 'ninguno',
  seguroDesgravamen: 0,
  tasacion: 0,
  seguroInmueble: 0,
  gastosNotariales: 0,
  comisionDesembolso: 0
});

// Estados de los diálogos
const costosDialogVisible = ref(false);
const cronogramaDialogVisible = ref(false);

// Datos de la entidad financiera seleccionada
const entidadSeleccionada = ref(null);
const teaError = ref('');

// ✅ NUEVO: aquí guardamos el rango de TEA que viene de Supabase
const tasasEntidad = ref({
  min: 0,
  max: 0,
  promedio: 0
});

// Helper: deducir el programa para Supabase
const getProgramaKey = () => {
  const raw = (formData.value.programaObjetivo || '').toLowerCase();

  if (raw.includes('techo')) return 'techoPropio';
  if (raw.includes('verde')) return 'miViviendaVerde';
  if (raw.includes('convenc')) return 'convencional';
  // por defecto usamos NCMV
  return 'miVivienda';
};

// Computed
const clientesOptions = computed(() =>
    allClientes.value.map(cliente => ({
      label: cliente.nombresApellidos,
      value: cliente.id,
      data: cliente
    }))
);

const plazosOptions = computed(() => {
  const plazos = [];
  for (let años = 5; años <= 25; años++) {
    plazos.push({
      label: `${años} años`,
      value: años * 12
    });
  }
  return plazos;
});

const tiposPeriodoGracia = [
  { label: 'Ninguno', value: 'ninguno' },
  { label: 'Parcial', value: 'parcial' },
  { label: 'Total', value: 'total' }
];

const periodosGraciaOptions = computed(() => {
  if (formData.value.tipoPeriodoGracia === 'ninguno') {
    return [{ label: '0 meses', value: 0 }];
  }

  const opciones = [];
  const maxMeses = Math.min(12, Math.floor(formData.value.plazoPrestamo / 2));

  for (let meses = 1; meses <= maxMeses; meses++) {
    opciones.push({
      label: `${meses} ${meses === 1 ? 'mes' : 'meses'}`,
      value: meses
    });
  }

  return opciones;
});

const montoFinanciadoCalculado = computed(() => {
  const valor = parseFloat(formData.value.valorVivienda) || 0;
  const inicial = parseFloat(formData.value.cuotaInicial) || 0;
  const bono = parseFloat(formData.value.montoBono) || 0;
  return Math.max(0, valor - inicial - bono);
});

// Watchers
watch(() => formData.value.clienteId, async (newClienteId) => {
  if (newClienteId) {
    await cargarDatosCliente(newClienteId);
  } else {
    formData.value.clienteNombre = '';
    formData.value.valorVivienda = 0;
    formData.value.cuotaInicial = 0;
    formData.value.cuotaInicialPorcentaje = 0;
    formData.value.programaObjetivo = '';
  }
});

watch(
    () => formData.value.entidadFinanciera,
    async (newValue) => {
      if (!newValue) {
        entidadSeleccionada.value = null;
        tasasEntidad.value = { min: 0, max: 0, promedio: 0 };
        formData.value.tasaInteres = 0;
        teaError.value = '';
        return;
      }

      entidadSeleccionada.value =
          entidadesFinancieras.value.find(e => e.value === newValue) || null;

      try {
        const programa = getProgramaKey();
        const tasas = await fetchTasasEntidad(newValue, programa);
        tasasEntidad.value = tasas;

        if (tasas.promedio) {
          formData.value.tasaInteres = tasas.promedio;
        }

        validateTEA();
      } catch (err) {
        console.error('Error al cargar tasas de entidad:', err);
        tasasEntidad.value = { min: 0, max: 0, promedio: 0 };
      }
    }
);

watch(
    () => formData.value.programaObjetivo,
    async () => {
      if (!formData.value.entidadFinanciera) return;

      try {
        const programa = getProgramaKey();
        const tasas = await fetchTasasEntidad(
            formData.value.entidadFinanciera,
            programa
        );
        tasasEntidad.value = tasas;

        if (tasas.promedio) {
          formData.value.tasaInteres = tasas.promedio;
        }

        validateTEA();
      } catch (err) {
        console.error('Error al recalcular tasas por cambio de programa:', err);
      }
    }
);

watch(() => formData.value.tasaInteres, () => {
  validateTEA();
});

watch(() => formData.value.tipoPeriodoGracia, (newValue) => {
  if (newValue === 'ninguno') {
    formData.value.periodoGracia = 0;
  } else if (formData.value.periodoGracia === 0) {
    formData.value.periodoGracia = 1;
  }
});

watch(() => formData.value.cuotaInicial, () => {
  if (formData.value.valorVivienda > 0) {
    formData.value.cuotaInicialPorcentaje = Math.round(
        (formData.value.cuotaInicial / formData.value.valorVivienda) * 100 * 100
    ) / 100;
  }
});

watch(() => formData.value.cuotaInicialPorcentaje, (newValue) => {
  if (formData.value.valorVivienda > 0 && newValue >= 0 && newValue <= 100) {
    const calculado = (formData.value.valorVivienda * newValue) / 100;
    if (Math.abs(calculado - formData.value.cuotaInicial) > 0.01) {
      formData.value.cuotaInicial = Math.round(calculado * 100) / 100;
    }
  }
});

watch(() => formData.value.valorVivienda, () => {
  if (formData.value.cuotaInicialPorcentaje > 0) {
    formData.value.cuotaInicial = Math.round(
        (formData.value.valorVivienda * formData.value.cuotaInicialPorcentaje / 100) * 100
    ) / 100;
  }
});

// Methods
const cargarDatosCliente = async (clienteId) => {
  try {
    // Consultamos cliente + vivienda desde Supabase
    const info = await repository.getClienteConVivienda(clienteId);

    if (!info) {
      toast.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'Este cliente no tiene vivienda asociada.',
        life: 2500
      });
      return;
    }

    // ================================
    //  CLIENTE
    // ================================
    formData.value.clienteNombre = `${info.nombres} ${info.apellidos}`;
    formData.value.clienteId = info.id;

    // ================================
    //  VIVIENDA
    // ================================
    if (info.vivienda) {
      const v = info.vivienda;formData.value.programaObjetivo = v.modalidad_vivienda || v.tipo_vis || "";

      formData.value.valorVivienda = Number(v.valor_vivienda ?? 0);
      formData.value.cuotaInicialPorcentaje = Number(v.porcentaje_cuota_inicial ?? 0);
      formData.value.montoBono = Number(v.bono ?? 0);

      // Calcular cuota inicial monto:
      formData.value.cuotaInicial =
          (formData.value.valorVivienda * formData.value.cuotaInicialPorcentaje) / 100;

      // Calcular saldo a financiar:
      formData.value.montoFinanciado =
          formData.value.valorVivienda -
          formData.value.cuotaInicial -
          formData.value.montoBono;

      // Programa objetivo:
      formData.value.programaObjetivo =
          v.modalidad_vivienda ??
          v.tipo_vis ??
          "";
    }

    toast.add({
      severity: 'success',
      summary: 'Datos cargados',
      detail: `Datos de ${formData.value.clienteNombre} cargados correctamente`,
      life: 2000
    });

  } catch (error) {
    console.error('Error al cargar datos del cliente:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la información del cliente',
      life: 3000
    });
  }
};


const validateTEA = () => {
  if (!formData.value.tasaInteres) {
    teaError.value = '';
    return true;
  }

  const tea = parseFloat(formData.value.tasaInteres);
  const min = tasasEntidad.value.min ?? 0;
  const max = tasasEntidad.value.max ?? 0;

  if (min === 0 && max === 0) {
    // No tenemos rango, no validamos nada
    teaError.value = '';
    return true;
  }

  if (tea < min) {
    teaError.value = `La TEA no puede ser menor a ${min}%`;
    return false;
  }

  if (tea > max) {
    teaError.value = `La TEA no puede ser mayor a ${max}%`;
    return false;
  }

  teaError.value = '';
  return true;
};

const updateMontoFinanciado = () => {
  formData.value.montoFinanciado = montoFinanciadoCalculado.value;
};

const handleCalcular = async () => {
  try {
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

    if (!validateTEA()) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: teaError.value,
        life: 3000
      });
      return;
    }

    updateMontoFinanciado();
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
    clienteId: null,
    clienteNombre: '',
    programaObjetivo: '',
    cuotaInicial: 0,
    cuotaInicialPorcentaje: 0,
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
    tipoPeriodoGracia: 'ninguno',
    seguroDesgravamen: 0,
    tasacion: 0,
    seguroInmueble: 0,
    gastosNotariales: 0,
    comisionDesembolso: 0
  };

  entidadSeleccionada.value = null;
  tasasEntidad.value = { min: 0, max: 0, promedio: 0 };
  teaError.value = '';
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
    <div class="page-header">
      <h1 class="page-title">SIMULADOR DE PLAN DE PAGOS</h1>
    </div>

    <div class="content-card">
      <div class="form-section">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="cliente">Cliente</label>
              <Dropdown
                  id="cliente"
                  v-model="formData.clienteId"
                  :options="clientesOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar"
                  class="w-full"
                  :disabled="loading"
                  appendTo="body"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value">
                    <i class="pi pi-user mr-2"></i>
                    {{ clientesOptions.find(c => c.value === slotProps.value)?.label }}
                  </div>
                  <span v-else>
                    {{ slotProps.placeholder }}
                  </span>
                </template>
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <i class="pi pi-user mr-2"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Dropdown>
              <small class="p-help">Los datos del cliente se cargarán automáticamente</small>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="programa">Programa objetivo</label>
              <Dropdown
                  id="programa"
                  v-model="formData.programaObjetivo"
                  :options="programasVivienda"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar programa"
                  class="w-full"
                  :disabled="loading"
              />
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="valorVivienda">Valor de vivienda (S/.)</label>
              <InputNumber
                  id="valorVivienda"
                  v-model="formData.valorVivienda"
                  mode="decimal"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  class="w-full"
                  :disabled="loading"
                  @input="updateMontoFinanciado"
              />
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="cuotaInicial">Cuota inicial</label>
              <div class="cuota-input-group">
                <InputNumber
                    id="cuotaInicialPorcentaje"
                    v-model="formData.cuotaInicialPorcentaje"
                    suffix="%"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    :min="0"
                    :max="100"
                    class="cuota-percentage"
                    :disabled="loading"
                />
                <InputNumber
                    id="cuotaInicial"
                    v-model="formData.cuotaInicial"
                    mode="decimal"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    class="cuota-amount"
                    :disabled="loading"
                    @input="updateMontoFinanciado"
                />
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="montoBono">Monto del Bono (S/.)</label>
              <InputNumber
                  id="montoBono"
                  v-model="formData.montoBono"
                  mode="decimal"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  class="w-full"
                  :disabled="loading"
                  @input="updateMontoFinanciado"
              />
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="montoFinanciado">Saldo a financiar (S/.)</label>
              <InputNumber
                  id="montoFinanciado"
                  :value="montoFinanciadoCalculado"
                  mode="decimal"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                  class="w-full monto-financiado-input"
                  disabled
              />
            </div>
          </div>

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

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="tipoTasa">Tipo de Tasa</label>
              <div class="flex gap-2 align-items-center">
                <InputText
                    value="TEA"
                    class="tipo-tasa-fixed"
                    disabled
                />
                <InputNumber
                    v-model="formData.tasaInteres"
                    suffix="%"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    :min="0"
                    :max="100"
                    class="flex-1"
                    :disabled="loading || !formData.entidadFinanciera"
                    :class="{ 'p-invalid': teaError }"
                />
              </div>
              <small v-if="teaError" class="p-error">{{ teaError }}</small>
              <small v-else-if="tasasEntidad.min && tasasEntidad.max" class="p-help">
                Rango permitido: {{ tasasEntidad.min }}% - {{ tasasEntidad.max }}%
              </small>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="costos">Costos/Gastos adicionales</label>
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

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="plazo">Plazo del prestamo</label>
              <div class="flex gap-2">
                <Dropdown
                    id="plazo"
                    v-model="formData.plazoPrestamo"
                    :options="plazosOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="flex-1"
                    :disabled="loading"
                    appendTo="body"
                />
                <InputNumber
                    :value="formData.plazoPrestamo"
                    suffix=" m"
                    class="flex-1 meses-display"
                    disabled
                />
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field">
              <label for="gracia">Periodo de gracia</label>
              <div class="flex gap-2">
                <Dropdown
                    id="tipoGracia"
                    v-model="formData.tipoPeriodoGracia"
                    :options="tiposPeriodoGracia"
                    optionLabel="label"
                    optionValue="value"
                    class="flex-1"
                    :disabled="loading"
                    appendTo="body"
                />
                <Dropdown
                    id="mesesGracia"
                    v-model="formData.periodoGracia"
                    :options="periodosGraciaOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="flex-1"
                    :disabled="loading || formData.tipoPeriodoGracia === 'ninguno'"
                    appendTo="body"
                />
              </div>
              <small v-if="formData.tipoPeriodoGracia === 'total'" class="p-help">
                Durante el periodo de gracia total solo se pagan intereses
              </small>
              <small v-else-if="formData.tipoPeriodoGracia === 'parcial'" class="p-help">
                Durante el periodo de gracia parcial no se paga nada, los intereses se capitalizan
              </small>
            </div>
          </div>
        </div>
      </div>

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

    <CostosAdicionalesDialog
        v-model:visible="costosDialogVisible"
        :costos="formData"
        @guardar="handleCostosGuardados"
    />

    <CronogramaDialog
        v-model:visible="cronogramaDialogVisible"
        :cronograma="simulacionActual?.cronogramaPagos"
        :simulacion="simulacionActual"
        @export="handleExportCronograma"
    />

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

.p-error {
  color: #ef4444;
  font-size: 0.75rem;
  display: block;
  margin-top: 0.25rem;
}

.p-help {
  color: #6b7280;
  font-size: 0.75rem;
  display: block;
  margin-top: 0.25rem;
}

.btn-plus {
  padding: 0.75rem !important;
  width: auto !important;
}

.cuota-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cuota-percentage {
  flex: 0 0 100px;
}

.cuota-amount {
  flex: 1;
}

.tipo-tasa-fixed {
  flex: 0 0 80px;
  text-align: center;
  font-weight: 700;
  background: #f3f4f6 !important;
  color: #374151 !important;
}

.meses-display {
  flex: 0 0 100px;
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

:deep(.p-inputnumber-input.p-invalid),
:deep(.p-inputtext.p-invalid) {
  border-color: #ef4444 !important;
}

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