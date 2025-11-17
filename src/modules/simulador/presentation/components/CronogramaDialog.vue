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
      cuotaBase: 0,
      interes: 0,
      amortizacion: 0,
      seguros: 0,
      cuotaTotal: 0
    };
  }

  return props.cronograma.reduce((acc, pago) => {
    acc.cuotaBase += Number(pago.cuotaBase || 0);
    acc.interes += Number(pago.interes || 0);
    acc.amortizacion += Number(pago.amortizacion || 0);
    acc.seguros += Number(pago.seguros || 0);
    acc.cuotaTotal += Number(pago.cuotaTotal || 0);
    return acc;
  }, {
    cuotaBase: 0,
    interes: 0,
    amortizacion: 0,
    seguros: 0,
    cuotaTotal: 0
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

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
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
      :style="{ width: '95%', maxWidth: '1400px' }"
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
            <span class="info-label">Tasa:</span>
            <span class="info-value">{{ simulacion.tasaInteres }}% {{ simulacion.tipoTasa }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Cuota Mensual:</span>
            <span class="info-value text-success font-bold">S/ {{ formatCurrency(simulacion.cuotaMensual) }}</span>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Tabla de cronograma -->
      <div class="table-wrapper">
        <DataTable
            :value="cronogramaVisible"
            :paginator="false"
            responsiveLayout="scroll"
            class="cronograma-table"
            stripedRows
        >
          <Column field="numeroCuota" header="N°" style="min-width: 60px; text-align: center" :frozen="true">
            <template #body="slotProps">
              <span class="font-semibold">{{ slotProps.data.numeroCuota }}</span>
            </template>
          </Column>

          <Column field="fechaPago" header="Fecha de Pago" style="min-width: 120px">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.fechaPago) }}
            </template>
          </Column>

          <Column field="saldoInicial" header="Saldo Inicial" style="min-width: 130px; text-align: right">
            <template #body="slotProps">
              <span class="moneda">S/</span> {{ formatCurrency(slotProps.data.saldoInicial) }}
            </template>
          </Column>

          <Column field="cuotaBase" header="Cuota Base" style="min-width: 120px; text-align: right">
            <template #body="slotProps">
              <span class="moneda">S/</span> {{ formatCurrency(slotProps.data.cuotaBase) }}
            </template>
          </Column>

          <Column field="interes" header="Interés" style="min-width: 120px; text-align: right">
            <template #body="slotProps">
              <span class="text-warning"><span class="moneda">S/</span> {{ formatCurrency(slotProps.data.interes) }}</span>
            </template>
          </Column>

          <Column field="amortizacion" header="Amortización" style="min-width: 130px; text-align: right">
            <template #body="slotProps">
              <span class="text-success"><span class="moneda">S/</span> {{ formatCurrency(slotProps.data.amortizacion) }}</span>
            </template>
          </Column>

          <Column field="seguros" header="Seguros" style="min-width: 110px; text-align: right">
            <template #body="slotProps">
              <span class="moneda">S/</span> {{ formatCurrency(slotProps.data.seguros) }}
            </template>
          </Column>

          <Column field="cuotaTotal" header="Cuota Total" style="min-width: 130px; text-align: right">
            <template #body="slotProps">
              <span class="font-bold"><span class="moneda">S/</span> {{ formatCurrency(slotProps.data.cuotaTotal) }}</span>
            </template>
          </Column>

          <Column field="saldoFinal" header="Saldo Final" style="min-width: 130px; text-align: right">
            <template #body="slotProps">
              <span class="font-semibold"><span class="moneda">S/</span> {{ formatCurrency(slotProps.data.saldoFinal) }}</span>
            </template>
          </Column>
        </DataTable>
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
            <span class="summary-label">Total Cuota Base:</span>
            <span class="summary-value">S/ {{ formatCurrency(totalData.cuotaBase) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Intereses:</span>
            <span class="summary-value text-warning">S/ {{ formatCurrency(totalData.interes) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Amortización:</span>
            <span class="summary-value text-success">S/ {{ formatCurrency(totalData.amortizacion) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Seguros:</span>
            <span class="summary-value">S/ {{ formatCurrency(totalData.seguros) }}</span>
          </div>
          <div class="summary-item highlight">
            <span class="summary-label">TOTAL A PAGAR:</span>
            <span class="summary-value font-bold">S/ {{ formatCurrency(totalData.cuotaTotal) }}</span>
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  max-height: 500px;
  overflow: auto;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  grid-template-columns: repeat(2, 1fr);
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
  font-size: 1.125rem;
  color: #374151;
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
  font-size: 0.875rem;
}

.cronograma-table.p-datatable .p-datatable-thead > tr > th {
  background: #f3f4f6;
  color: #374151;
  font-weight: 700;
  border-bottom: 2px solid #e5e7eb;
  padding: 0.75rem 0.5rem;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.cronograma-table.p-datatable .p-datatable-tbody > tr > td {
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
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