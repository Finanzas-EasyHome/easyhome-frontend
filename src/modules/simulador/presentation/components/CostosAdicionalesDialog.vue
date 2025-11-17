<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  costos: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'guardar']);

// State local
const formData = ref({
  entidadFinanciera: '',
  seguroDesgravamen: 0,
  tasacion: 0,
  seguroInmueble: 0,
  gastosNotariales: 0,
  comisionDesembolso: 0
});

// Opciones de entidades financieras
const entidadesOptions = [
  { label: 'Banco de Crédito del Perú', value: 'bcp' },
  { label: 'BBVA Continental', value: 'bbva' },
  { label: 'Interbank', value: 'interbank' },
  { label: 'Scotiabank', value: 'scotiabank' },
  { label: 'BanBif', value: 'banbif' },
  { label: 'Banco Pichincha', value: 'pichincha' },
  { label: 'Mibanco', value: 'mibanco' },
  { label: 'Caja Arequipa', value: 'cajaArequipa' },
  { label: 'Caja Huancayo', value: 'cajaHuancayo' },
  { label: 'Caja Piura', value: 'cajaPiura' }
];

// Watch para actualizar los datos cuando se abre el diálogo
watch(() => props.visible, (newVal) => {
  if (newVal) {
    formData.value = {
      entidadFinanciera: props.costos.entidadFinanciera || '',
      seguroDesgravamen: props.costos.seguroDesgravamen || 0,
      tasacion: props.costos.tasacion || 0,
      seguroInmueble: props.costos.seguroInmueble || 0,
      gastosNotariales: props.costos.gastosNotariales || 0,
      comisionDesembolso: props.costos.comisionDesembolso || 0
    };
  }
});

// Methods
const handleGuardar = () => {
  emit('guardar', { ...formData.value });
  handleClose();
};

const handleEditar = () => {
  // Los campos ya son editables, solo es feedback visual
  console.log('Editando costos adicionales');
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Dialog
      :visible="visible"
      :style="{ width: '550px' }"
      header="Costos Adicionales"
      :modal="true"
      class="costos-dialog"
      @update:visible="handleClose"
  >
    <div class="costos-form">
      <div class="grid">
        <!-- Entidad Financiera -->
        <div class="col-12">
          <div class="field">
            <label for="entidad">Entidad Financiera</label>
            <Dropdown
                id="entidad"
                v-model="formData.entidadFinanciera"
                :options="entidadesOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar"
                class="w-full"
                appendTo="body"
            />
          </div>
        </div>

        <!-- Fila 1: Seguro desgravamen y Tasación -->
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="desgravamen">Seguro de desgravamen</label>
            <InputNumber
                id="desgravamen"
                v-model="formData.seguroDesgravamen"
                suffix="%"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                class="w-full"
                placeholder="0.00"
            />
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="field">
            <label for="tasacion">Tasación</label>
            <InputNumber
                id="tasacion"
                v-model="formData.tasacion"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
            />
          </div>
        </div>

        <!-- Fila 2: Seguro inmueble y Gastos notariales -->
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="inmueble">Seguro de inmueble</label>
            <InputNumber
                id="inmueble"
                v-model="formData.seguroInmueble"
                suffix="%"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                class="w-full"
                placeholder="0.00"
            />
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="field">
            <label for="notariales">Gastos notariales y registrales</label>
            <InputNumber
                id="notariales"
                v-model="formData.gastosNotariales"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
            />
          </div>
        </div>

        <!-- Comisión por desembolso -->
        <div class="col-12">
          <div class="field">
            <label for="comision">Comisión por desembolso</label>
            <InputNumber
                id="comision"
                v-model="formData.comisionDesembolso"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button
            label="Editar"
            icon="pi pi-pencil"
            class="p-button-warning"
            @click="handleEditar"
        />
        <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-success"
            @click="handleGuardar"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.costos-form {
  padding: 0.5rem 0;
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

.dialog-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>

<style>
/* Estilos globales para el Dialog */
.costos-dialog.p-dialog {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.costos-dialog.p-dialog .p-dialog-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 12px 12px 0 0;
}

.costos-dialog.p-dialog .p-dialog-title {
  font-weight: 700;
  font-size: 1.25rem;
  color: #1f2937;
}

.costos-dialog.p-dialog .p-dialog-header-icon {
  color: #6b7280;
}

.costos-dialog.p-dialog .p-dialog-content {
  padding: 1.5rem;
  background: white;
}

.costos-dialog.p-dialog .p-dialog-footer {
  padding: 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
}

/* Inputs y Dropdowns */
.costos-dialog .p-inputtext,
.costos-dialog .p-inputnumber-input,
.costos-dialog .p-dropdown {
  border: 1px solid #d1d5db !important;
  border-radius: 8px !important;
  padding: 0.75rem 1rem !important;
  transition: all 0.2s ease !important;
  font-size: 0.875rem !important;
}

.costos-dialog .p-inputtext:hover,
.costos-dialog .p-inputnumber:hover .p-inputnumber-input,
.costos-dialog .p-dropdown:hover {
  border-color: #059669 !important;
}

.costos-dialog .p-inputtext:focus,
.costos-dialog .p-inputnumber.p-inputnumber-focus .p-inputnumber-input,
.costos-dialog .p-dropdown.p-focus {
  border-color: #059669 !important;
  box-shadow: 0 0 0 0.2rem rgba(5, 150, 105, 0.25) !important;
}

/* Botones */
.costos-dialog .p-button {
  padding: 0.75rem 1.5rem !important;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.costos-dialog .p-button-warning {
  background: #f59e0b !important;
  border-color: #f59e0b !important;
  color: white;
}

.costos-dialog .p-button-warning:hover {
  background: #d97706 !important;
  border-color: #d97706 !important;
}

.costos-dialog .p-button-success {
  background: #059669 !important;
  border-color: #059669 !important;
  color: white;
}

.costos-dialog .p-button-success:hover {
  background: #047857 !important;
  border-color: #047857 !important;
}

/* Dropdown panel */
body > .p-dropdown-panel.costos-dialog-dropdown,
.costos-dialog .p-dropdown-panel {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  background: white !important;
}

.costos-dialog .p-dropdown-item {
  padding: 0.75rem 1rem !important;
  font-size: 0.875rem !important;
  color: #374151 !important;
}

.costos-dialog .p-dropdown-item:hover {
  background: #f3f4f6 !important;
  color: #059669 !important;
}

.costos-dialog .p-dropdown-item.p-highlight {
  background: #059669 !important;
  color: white !important;
}
</style>