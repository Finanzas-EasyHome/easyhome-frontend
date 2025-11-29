<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  cronograma: {
    type: Array,
    default: () => []
  },
  simulacion: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'export']);

// Computed
const cronogramaData = computed(() => {
  if (!props.cronograma || props.cronograma.length === 0) {
    return [];
  }
  return props.cronograma;
});

const cronogramaVisible = computed(() => {
  // Mostrar solo las primeras 24 cuotas en la tabla
  return cronogramaData.value.slice(0, 24);
});

const totalData = computed(() => {
  if (!props.cronograma || props.cronograma.length === 0) {
    return {
      interes: 0,
      cuotaConSegDes: 0,
      amortizacion: 0,
      seguroDesgravamen: 0,
      seguroRiesgo: 0,
      gastosAdmin: 0,
      flujo: 0
    };
  }

  return props.cronograma.reduce((acc, pago) => {
    acc.interes += Number(pago.interes || 0);
    acc.cuotaConSegDes += Number(pago.cuotaConSegDes || pago.cuotaBase || 0);
    acc.amortizacion += Number(pago.amortizacion || 0);
    acc.seguroDesgravamen += Number(pago.seguroDesgravamen || 0);
    acc.seguroRiesgo += Number(pago.seguroRiesgo || pago.seguroInmueble || 0);
    acc.gastosAdmin += Number(pago.gastosAdmin || pago.portes || 0);
    acc.flujo += Math.abs(Number(pago.flujo || pago.flujoNeto || 0));
    return acc;
  }, {
    interes: 0,
    cuotaConSegDes: 0,
    amortizacion: 0,
    seguroDesgravamen: 0,
    seguroRiesgo: 0,
    gastosAdmin: 0,
    flujo: 0
  });
});

// Methods
const formatCurrency = (value) => {
  const numero = Number(value || 0);
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
};

const formatPercent = (value) => {
  const numero = Number(value || 0);
  return numero.toFixed(5) + '%';
};

const handleClose = () => {
  emit('update:visible', false);
};

const exportarExcel = () => {
  emit('export');
};
</script>

<template>
  <Dialog
      :visible="visible"
      :style="{ width: '98%', maxWidth: '1600px' }"
      header="Cronograma de Pagos"
      :modal="true"
      class="cronograma-dialog"
      @update:visible="handleClose"
  >
    <div class="cronograma-container">
      <!-- Información del Préstamo -->
      <div v-if="simulacion" class="prestamo-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Cliente:</span>
            <span class="info-value">{{ simulacion.clienteNombre }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Monto Financiado:</span>
            <span class="info-value text-primary">S/ {{ formatCurrency(simulacion.montoFinanciado) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Plazo:</span>
            <span class="info-value">{{ simulacion.plazoPrestamo }} meses</span>
          </div>
          <div class="info-item">
            <span class="info-label">TEA:</span>
            <span class="info-value">{{ simulacion.tasaInteres }}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">TEP:</span>
            <span class="info-value">{{ simulacion.TEP ? (simulacion.TEP * 100).toFixed(5) : '0.00000' }}%</span>
          </div>
          <div class="info-item">
            <span class="info-label">Cuota Mensual:</span>
            <span class="info-value text-success font-bold">S/ {{ formatCurrency(simulacion.cuotaMensual) }}</span>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Tabla de cronograma con columnas del Excel -->
      <div class="table-wrapper">
        <DataTable
            :value="cronogramaVisible"
            :paginator="false"
            responsiveLayout="scroll"
            class="cronograma-table"
            stripedRows
            size="small"
        >
          <!-- N° -->
          <Column field="numeroCuota" header="N°" style="min-width: 50px; text-align: center" :frozen="true">
            <template #body="slotProps">
              <span class="font-semibold">{{ slotProps.data.numeroCuota }}</span>
            </template>
          </Column>

          <!-- TEA -->
          <Column field="TEA" header="TEA" style="min-width: 80px; text-align: center">
            <template #body="slotProps">
              {{ slotProps.data.TEA || simulacion?.tasaInteres }}%
            </template>
          </Column>

          <!-- TEP (i' = TEP = TEM) -->
          <Column field="TEP" header="TEP" style="min-width: 90px; text-align: center">
            <template #body="slotProps">
              {{ slotProps.data.TEP || (simulacion?.TEP ? (simulacion.TEP * 100).toFixed(5) : '0') }}%
            </template>
          </Column>

          <!-- P.G. (Período de Gracia) -->
          <Column field="periodoGracia" header="P.G." style="min-width: 50px; text-align: center">
            <template #body="slotProps">
              <span :class="{'text-warning font-bold': slotProps.data.periodoGracia === 'P' || slotProps.data.periodoGracia === 'T'}">
                {{ slotProps.data.periodoGracia || 'S' }}
              </span>
            </template>
          </Column>

          <!-- Saldo Inicial -->
          <Column field="saldoInicial" header="Saldo Inicial" style="min-width: 110px; text-align: right">
            <template #body="slotProps">
              <span class="moneda">S/</span> {{ formatCurrency(slotProps.data.saldoInicial) }}
            </template>
          </Column>

          <!-- Interés -->
          <Column field="interes" header="Interés" style="min-width: 90px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger">({{ formatCurrency(slotProps.data.interes) }})</span>
            </template>
          </Column>

          <!-- Cuota (inc Seg Des) -->
          <Column header="Cuota (inc Seg Des)" style="min-width: 120px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger">({{ formatCurrency(slotProps.data.cuotaConSegDes || slotProps.data.cuotaBase) }})</span>
            </template>
          </Column>

          <!-- Amortización -->
          <Column field="amortizacion" header="Amort." style="min-width: 90px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger">({{ formatCurrency(slotProps.data.amortizacion) }})</span>
            </template>
          </Column>

          <!-- Seguro Desgravamen -->
          <Column header="Seg. Desgrav" style="min-width: 100px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger">({{ formatCurrency(slotProps.data.seguroDesgravamen) }})</span>
            </template>
          </Column>

          <!-- Seguro Riesgo -->
          <Column header="Seg. Riesgo" style="min-width: 90px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger">({{ formatCurrency(slotProps.data.seguroRiesgo || slotProps.data.seguroInmueble) }})</span>
            </template>
          </Column>

          <!-- Comisión -->
          <Column field="comision" header="Comisión" style="min-width: 80px; text-align: right">
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.comision || 0) }}
            </template>
          </Column>

          <!-- Portes -->
          <Column field="portes" header="Portes" style="min-width: 70px; text-align: right">
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.portes || 0) }}
            </template>
          </Column>

          <!-- Gastos Admin -->
          <Column header="Gastos Adm." style="min-width: 90px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger">({{ formatCurrency(slotProps.data.gastosAdmin || 0) }})</span>
            </template>
          </Column>

          <!-- Saldo Final -->
          <Column field="saldoFinal" header="Saldo Final" style="min-width: 110px; text-align: right">
            <template #body="slotProps">
              <span class="font-semibold">
                <span class="moneda">S/</span> {{ formatCurrency(slotProps.data.saldoFinal) }}
              </span>
            </template>
          </Column>

          <!-- Flujo -->
          <Column field="flujo" header="Flujo" style="min-width: 100px; text-align: right">
            <template #body="slotProps">
              <span class="text-danger font-bold">
                ({{ formatCurrency(Math.abs(slotProps.data.flujo || slotProps.data.flujoNeto || 0)) }})
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Flujo Inicial (Préstamo) -->
      <div class="flujo-inicial">
        <span class="flujo-label">Flujo Inicial (Préstamo):</span>
        <span class="flujo-value text-success font-bold">
          S/ {{ formatCurrency(simulacion?.montoFinanciado || simulacion?.montoPrestamo || 0) }}
        </span>
      </div>

      <!-- Nota informativa -->
      <div v-if="cronograma.length > 24" class="info-note">
        <i class="pi pi-info-circle"></i>
        <span>Se muestran las primeras 24 cuotas de {{ cronograma.length }} cuotas totales. Exporte a Excel para ver el cronograma completo.</span>
      </div>

      <!-- Resumen total -->
      <div class="total-summary">
        <h3 class="summary-title">Resumen Total del Préstamo</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Intereses:</span>
            <span class="summary-value text-warning">S/ {{ formatCurrency(totalData.interes) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Amortización:</span>
            <span class="summary-value text-success">S/ {{ formatCurrency(totalData.amortizacion) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Seg. Desgravamen:</span>
            <span class="summary-value">S/ {{ formatCurrency(totalData.seguroDesgravamen) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Seg. Riesgo:</span>
            <span class="summary-value">S/ {{ formatCurrency(totalData.seguroRiesgo) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Gastos Admin:</span>
            <span class="summary-value">S/ {{ formatCurrency(totalData.gastosAdmin) }}</span>
          </div>
          <div class="summary-item highlight">
            <span class="summary-label">TOTAL FLUJOS:</span>
            <span class="summary-value font-bold">S/ {{ formatCurrency(totalData.flujo) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
            label="Exportar a Excel"
            icon="pi pi-file-excel"
            class="p-button-success"
            @click="exportarExcel"
            :disabled="!cronograma || cronograma.length === 0"
        />
        <Button
            label="Cerrar"
            icon="pi pi-times"
            class="p-button-secondary"
            @click="handleClose"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.cronograma-container {
  padding: 0;
}

.prestamo-info {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.table-wrapper {
  max-height: 450px;
  overflow: auto;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.flujo-inicial {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.flujo-label {
  font-weight: 600;
  color: #065f46;
}

.flujo-value {
  font-size: 1.125rem;
}

.info-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.info-note i {
  font-size: 1.125rem;
}

.total-summary {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 1rem 0;
  text-align: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
}

.summary-item.highlight {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  grid-column: 1 / -1;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);
}

.summary-item.highlight .summary-label,
.summary-item.highlight .summary-value {
  color: white;
  font-size: 1.125rem;
}

.summary-label {
  font-weight: 600;
  color: #6b7280;
}

.summary-value {
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.moneda {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-right: 0.25rem;
}

.text-warning {
  color: #f59e0b;
}

.text-success {
  color: #059669;
}

.text-primary {
  color: #059669;
}

.text-danger {
  color: #dc2626;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
/* Estilos globales para el Dialog */
.cronograma-dialog.p-dialog {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.cronograma-dialog.p-dialog .p-dialog-header {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 12px 12px 0 0;
}

.cronograma-dialog.p-dialog .p-dialog-title {
  font-weight: 700;
  font-size: 1.5rem;
  color: white;
}

.cronograma-dialog.p-dialog .p-dialog-header-icon {
  color: white;
}

.cronograma-dialog.p-dialog .p-dialog-header-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.cronograma-dialog.p-dialog .p-dialog-content {
  padding: 1.5rem 2rem;
  background: white;
}

.cronograma-dialog.p-dialog .p-dialog-footer {
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
}

/* Tabla personalizada */
.cronograma-table.p-datatable {
  font-size: 0.8rem;
}

.cronograma-table.p-datatable .p-datatable-thead > tr > th {
  background: #f3f4f6;
  color: #374151;
  font-weight: 700;
  border-bottom: 2px solid #e5e7eb;
  padding: 0.5rem 0.4rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.cronograma-table.p-datatable .p-datatable-tbody > tr > td {
  padding: 0.5rem 0.4rem;
  font-size: 0.8rem;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}

.cronograma-table.p-datatable .p-datatable-tbody > tr:hover {
  background: #f9fafb;
}

.cronograma-table.p-datatable .p-datatable-tbody > tr:last-child > td {
  border-bottom: none;
}

/* Columna congelada */
.cronograma-table.p-datatable .p-frozen-column {
  background: white;
  font-weight: 600;
}

/* Botones */
.cronograma-dialog .p-button {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.cronograma-dialog .p-button-success {
  background: #059669;
  border-color: #059669;
}

.cronograma-dialog .p-button-success:hover:not(:disabled) {
  background: #047857;
  border-color: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.cronograma-dialog .p-button-secondary {
  background: #6b7280;
  border-color: #6b7280;
}

.cronograma-dialog .p-button-secondary:hover {
  background: #4b5563;
  border-color: #4b5563;
}

.cronograma-dialog .p-divider {
  margin: 1rem 0;
}
</style>