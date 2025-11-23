<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: Boolean,
  cliente: Object,
});

const emit = defineEmits(["update:visible"]);

const handleClose = () => {
  emit("update:visible", false);
};

const formatCurrency = (value) => {
  if (!value || isNaN(value)) return "0.00";

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value));
};


const formatBoolean = (val) => (val ? "Sí" : "No");

// 🟢 Badge color
const statusBadge = (value) => (value ? "badge-success" : "badge-danger");
</script>

<template>
  <Dialog
      :visible="visible"
      :style="{ width: '950px', maxHeight: '90vh' }"
      header="Detalles del Cliente"
      modal
      appendTo="body"
      blockScroll
      class="cliente-detail-dialog"
      @update:visible="handleClose"
  >
    <div v-if="cliente" class="detail-container">

      <!-- ===================== -->
      <!-- INFORMACIÓN DEL CLIENTE -->
      <!-- ===================== -->
      <div class="section">
        <div class="section-header">
          <i class="pi pi-user section-icon"></i>
          <h3 class="section-title">Información del Cliente</h3>
        </div>

        <div class="grid">

          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">ID:</span>
              <span class="detail-value font-bold">#{{ cliente.id }}</span>
            </div>
          </div>

          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Nombres y Apellidos:</span>
              <span class="detail-value">{{ cliente.nombresApellidos }}</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">DNI:</span>
              <span class="detail-value font-mono">{{ cliente.dni }}</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Edad:</span>
              <span class="detail-value">{{ cliente.edad }} años</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Estado Civil:</span>
              <span class="estado-civil-badge">{{ cliente.estadoCivil }}</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Ingreso Familiar:</span>
              <span class="detail-value text-success font-bold">
                {{ formatCurrency(cliente.ingresoFamiliar) }}
              </span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Aporte:</span>
              <span class="detail-value text-primary font-bold">
                {{ formatCurrency(cliente.aporte) }}
              </span>
            </div>
          </div>

          <div class="col-12">
            <div class="divider-light"></div>
          </div>

          <div class="col-12 md:col-4">
            <div class="detail-item">
              <span class="detail-label">¿Tiene Discapacidad?</span>
              <span :class="['detail-badge', statusBadge(cliente.tieneDiscapacidad)]">
                {{ formatBoolean(cliente.tieneDiscapacidad) }}
              </span>
            </div>
          </div>

          <div class="col-12 md:col-4">
            <div class="detail-item">
              <span class="detail-label">¿Migrante Retornado?</span>
              <span :class="['detail-badge', statusBadge(cliente.esMigranteRetornado)]">
                {{ formatBoolean(cliente.esMigranteRetornado) }}
              </span>
            </div>
          </div>

          <div class="col-12 md:col-4">
            <div class="detail-item">
              <span class="detail-label">¿Persona Desplazada?</span>
              <span :class="['detail-badge', statusBadge(cliente.esPersonaDesplazada)]">
                {{ formatBoolean(cliente.esPersonaDesplazada) }}
              </span>
            </div>
          </div>

        </div>
      </div>

      <Divider />

      <!-- ===================== -->
      <!-- INFORMACIÓN VIVIENDA -->
      <!-- ===================== -->
      <div class="section">
        <div class="section-header">
          <i class="pi pi-home section-icon"></i>
          <h3 class="section-title">Información de la Vivienda</h3>
        </div>

        <div v-if="cliente.vivienda" class="grid">

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Proyecto:</span>
              <span class="detail-value">{{ cliente.vivienda.proyecto }}</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Tipo de Vivienda:</span>
              <span class="detail-value">{{ cliente.vivienda.tipoVivienda }}</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Valor de Vivienda:</span>
              <span class="detail-value text-primary font-bold">
                {{ formatCurrency(cliente.vivienda.valorVivienda) }}
              </span>
            </div>
          </div>

          <div class="col-12 md:col-6"></div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Cuota Inicial:</span>
              <span class="detail-value text-success font-bold">
                {{ formatCurrency(cliente.vivienda.cuotaInicial) }}
              </span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Cuota Inicial (%):</span>
              <span class="detail-value">{{ cliente.vivienda.cuotaInicialPorcentaje }}%</span>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="detail-item">
              <span class="detail-label">Tipo VIS:</span>
              <span class="detail-value">{{ cliente.vivienda.tipoVIS }}</span>
            </div>
          </div>

          <div class="col-12">
            <div class="detail-item">
              <span class="detail-label">Ubicación:</span>
              <span class="detail-value">{{ cliente.vivienda.ubicacion }}</span>
            </div>
          </div>

        </div>

        <div v-else class="text-center text-secondary py-3">
          <p>No hay información de vivienda registrada</p>
        </div>

      </div>

    </div>

    <template #footer>
      <div class="flex justify-content-end">
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
.detail-container {
  padding: 0;
}

.section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-icon {
  font-size: 1.75rem;
  color: #059669;
}

.section-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #374151;
  margin: 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0;
}

.detail-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1.0625rem;
  color: #374151;
  word-break: break-word;
  font-weight: 500;
}

.detail-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  width: fit-content;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

.estado-civil-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 16px;
  background: #d1fae5;
  color: #065f46;
  font-size: 0.875rem;
  font-weight: 600;
  width: fit-content;
}

.divider-light {
  height: 1px;
  background: #e5e7eb;
  margin: 1.5rem 0;
}

.financial-summary {
  background: #f0fdf4;
  border: 2px solid #d1fae5;
  border-radius: 8px;
  padding: 1.25rem;
  margin-top: 0.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.summary-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #047857;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.text-success {
  color: #10b981;
}

.text-primary {
  color: #059669;
}

.text-secondary {
  color: #6b7280;
}

.text-lg {
  font-size: 1.125rem;
}

.font-bold {
  font-weight: 700;
}

.font-mono {
  font-family: 'Courier New', monospace;
}

.text-xl {
  font-size: 1.25rem;
}

:deep(.p-dialog) {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.p-dialog .p-dialog-header) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border-bottom: none;
  padding: 2rem 2.5rem;
  border-radius: 12px 12px 0 0;
}

:deep(.p-dialog .p-dialog-title) {
  font-weight: 700;
  font-size: 1.5rem;
  color: white;
}

:deep(.p-dialog .p-dialog-header-icon) {
  color: white;
}

:deep(.p-dialog .p-dialog-header-icon:hover) {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.p-dialog .p-dialog-content) {
  padding: 2.5rem;
  background: white;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

:deep(.p-dialog .p-dialog-footer) {
  padding: 1.5rem 2.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
}

:deep(.p-button.p-button-secondary) {
  background: #6b7280;
  border-color: #6b7280;
  color: white;
  padding: 0.875rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.p-button.p-button-secondary:hover) {
  background: #4b5563;
  border-color: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.p-divider) {
  margin: 1.5rem 0;
}
</style>