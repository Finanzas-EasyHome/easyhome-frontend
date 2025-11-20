<script setup>
import { ref, watch } from 'vue';

// Props y Emits
const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  cliente: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'save']);

// State
const loading = ref(false);
const form = ref({
  nombresApellidos: '',
  dni: '',
  edad: null,
  ingresoFamiliar: 0,
  aporte: 0,
  estadoCivil: '',
  tieneDiscapacidad: false,
  esMigranteRetornado: false,
  esPersonaDesplazada: false,
  vivienda: {
    proyecto: '',
    tipoVivienda: '',
    valorVivienda: 0,
    modalidadVivienda: '',
    cuotaInicial: 0,
    cuotaInicialPorcentaje: 0,
    tipoVIS: '',
    ubicacion: ''
  }
});

const errors = ref({
  nombresApellidos: '',
  dni: '',
  edad: '',
  ingresoFamiliar: '',
  aporte: '',
  estadoCivil: '',
  viviendaProyecto: '',
  viviendaTipo: '',
  viviendaValor: '',
  viviendaCuotaInicial: '',
  viviendaModalidad: '',
  viviendaVIS: '',
  viviendaUbicacion: ''
});

const estadosCiviles = [
  { label: 'Soltero/a', value: 'Soltero' },
  { label: 'Casado/a', value: 'Casado' },
  { label: 'Divorciado/a', value: 'Divorciado' },
  { label: 'Viudo/a', value: 'Viudo' },
  { label: 'Conviviente', value: 'Conviviente' }
];

const tiposVivienda = [
  { label: 'Casa', value: 'Casa' },
  { label: 'Departamento', value: 'Departamento' },
  { label: 'Duplex', value: 'Duplex' },
  { label: 'Townhouse', value: 'Townhouse' }
];

const modalidadesVivienda = [
  { label: 'Crédito MiVivienda', value: 'Crédito MiVivienda' },
  { label: 'Techo Propio', value: 'Techo Propio' },
  { label: 'Fondo MiVivienda', value: 'Fondo MiVivienda' },
  { label: 'Hipotecario Convencional', value: 'Hipotecario Convencional' }
];

const tiposVIS = [
  { label: 'VIS Estándar', value: 'VIS Estándar' },
  { label: 'VIS Prioritaria', value: 'VIS Prioritaria' },
  { label: 'No VIS', value: 'No VIS' }
];

// Funciones helper
function resetForm() {
  form.value = {
    nombresApellidos: '',
    dni: '',
    edad: null,
    ingresoFamiliar: 0,
    aporte: 0,
    estadoCivil: '',
    tieneDiscapacidad: false,
    esMigranteRetornado: false,
    esPersonaDesplazada: false,
    vivienda: {
      proyecto: '',
      tipoVivienda: '',
      valorVivienda: 0,
      modalidadVivienda: '',
      cuotaInicial: 0,
      cuotaInicialPorcentaje: 0,
      tipoVIS: '',
      ubicacion: ''
    }
  };
}

function resetErrors() {
  errors.value = {
    nombresApellidos: '',
    dni: '',
    edad: '',
    ingresoFamiliar: '',
    aporte: '',
    estadoCivil: '',
    viviendaProyecto: '',
    viviendaTipo: '',
    viviendaValor: '',
    viviendaCuotaInicial: '',
    viviendaModalidad: '',
    viviendaVIS: '',
    viviendaUbicacion: ''
  };
}

// Watch
watch(() => props.cliente, (newCliente) => {
  if (newCliente && props.isEdit) {
    form.value = {
      nombresApellidos: newCliente.nombresApellidos || '',
      dni: newCliente.dni || '',
      edad: newCliente.edad || null,
      ingresoFamiliar: newCliente.ingresoFamiliar || 0,
      aporte: newCliente.aporte || 0,
      estadoCivil: newCliente.estadoCivil || '',
      tieneDiscapacidad: newCliente.tieneDiscapacidad || false,
      esMigranteRetornado: newCliente.esMigranteRetornado || false,
      esPersonaDesplazada: newCliente.esPersonaDesplazada || false,
      vivienda: {
        proyecto: newCliente.vivienda?.proyecto || '',
        tipoVivienda: newCliente.vivienda?.tipoVivienda || '',
        valorVivienda: newCliente.vivienda?.valorVivienda || 0,
        modalidadVivienda: newCliente.vivienda?.modalidadVivienda || '',
        cuotaInicial: newCliente.vivienda?.cuotaInicial || 0,
        cuotaInicialPorcentaje: newCliente.vivienda?.cuotaInicialPorcentaje || 0,
        tipoVIS: newCliente.vivienda?.tipoVIS || '',
        ubicacion: newCliente.vivienda?.ubicacion || ''
      }
    };
  } else {
    resetForm();
  }
  resetErrors();
}, { immediate: true });

// Métodos de validación y manejo
function handleDniInput(event) {
  const value = event.target.value;
  form.value.dni = value.replace(/[^0-9]/g, '').substring(0, 8);
}

function validateForm() {
  let isValid = true;
  resetErrors();

  // Validar datos del cliente
  if (!form.value.nombresApellidos || form.value.nombresApellidos.trim() === '') {
    errors.value.nombresApellidos = 'El nombre y apellidos es requerido';
    isValid = false;
  } else if (form.value.nombresApellidos.trim().length < 3) {
    errors.value.nombresApellidos = 'Debe tener al menos 3 caracteres';
    isValid = false;
  }

  if (!form.value.dni) {
    errors.value.dni = 'El DNI es requerido';
    isValid = false;
  } else if (form.value.dni.length !== 8) {
    errors.value.dni = 'El DNI debe tener exactamente 8 dígitos';
    isValid = false;
  }

  if (!form.value.edad || form.value.edad < 18 || form.value.edad > 100) {
    errors.value.edad = 'La edad debe estar entre 18 y 100 años';
    isValid = false;
  }

  if (!form.value.ingresoFamiliar || form.value.ingresoFamiliar <= 0) {
    errors.value.ingresoFamiliar = 'El ingreso familiar debe ser mayor a 0';
    isValid = false;
  }

  if (!form.value.aporte || form.value.aporte <= 0) {
    errors.value.aporte = 'El aporte debe ser mayor a 0';
    isValid = false;
  }

  if (!form.value.estadoCivil) {
    errors.value.estadoCivil = 'El estado civil es requerido';
    isValid = false;
  }

  // Validar datos de vivienda
  if (!form.value.vivienda.proyecto || form.value.vivienda.proyecto.trim() === '') {
    errors.value.viviendaProyecto = 'El proyecto es requerido';
    isValid = false;
  }

  if (!form.value.vivienda.tipoVivienda) {
    errors.value.viviendaTipo = 'El tipo de vivienda es requerido';
    isValid = false;
  }

  if (!form.value.vivienda.valorVivienda || form.value.vivienda.valorVivienda <= 0) {
    errors.value.viviendaValor = 'El valor debe ser mayor a 0';
    isValid = false;
  }

  if (!form.value.vivienda.cuotaInicial || form.value.vivienda.cuotaInicial < 0) {
    errors.value.viviendaCuotaInicial = 'La cuota inicial debe ser mayor o igual a 0';
    isValid = false;
  }

  if (!form.value.vivienda.modalidadVivienda) {
    errors.value.viviendaModalidad = 'La modalidad de vivienda es requerida';
    isValid = false;
  }

  if (!form.value.vivienda.tipoVIS) {
    errors.value.viviendaVIS = 'El tipo de VIS es requerido';
    isValid = false;
  }

  if (!form.value.vivienda.ubicacion || form.value.vivienda.ubicacion.trim() === '') {
    errors.value.viviendaUbicacion = 'La ubicación es requerida';
    isValid = false;
  }

  return isValid;
}

function handleSubmit() {
  if (validateForm()) {
    emit('save', { ...form.value });
  }
}

function handleClose() {
  emit('update:visible', false);
  setTimeout(() => {
    resetForm();
    resetErrors();
  }, 300);
}
</script>

<template>
  <Dialog
      :visible="visible"
      :style="{ width: '900px', maxHeight: '90vh' }"
      :header="isEdit ? 'Editar Cliente' : 'Nuevo Cliente'"
      :modal="true"
      class="cliente-dialog"
      :contentStyle="{ overflow: 'auto' }"
      @update:visible="handleClose"
  >
    <div class="form-container p-fluid">
      <!-- SECCIÓN: DATOS DEL CLIENTE -->
      <div class="section-header mb-4">
        <div class="section-title-wrapper">
          <i class="pi pi-user section-icon"></i>
          <h3 class="section-title">Datos del Cliente</h3>
        </div>
      </div>

      <div class="grid">
        <!-- Fila 1: Nombres y Estado Civil -->
        <div class="col-12 md:col-6">
          <label for="nombresApellidos" class="form-label">Nombres y Apellidos</label>
          <InputText
              id="nombresApellidos"
              v-model="form.nombresApellidos"
              :class="{ 'p-invalid': errors.nombresApellidos }"
              placeholder="Ingrese nombres y apellidos"
              class="w-full"
          />
          <small v-if="errors.nombresApellidos" class="p-error">
            {{ errors.nombresApellidos }}
          </small>
        </div>

        <div class="col-12 md:col-6">
          <label for="estadoCivil" class="form-label">Estado Civil</label>
          <Dropdown
              id="estadoCivil"
              v-model="form.estadoCivil"
              :options="estadosCiviles"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione estado civil"
              :class="{ 'p-invalid': errors.estadoCivil }"
              class="w-full"
              appendTo="body"
              :panelStyle="{ zIndex: 10000 }"
          />
          <small v-if="errors.estadoCivil" class="p-error">
            {{ errors.estadoCivil }}
          </small>
        </div>

        <!-- Fila 2: DNI e Ingreso Familiar -->
        <div class="col-12 md:col-6">
          <label for="dni" class="form-label">DNI</label>
          <InputText
              id="dni"
              v-model="form.dni"
              :class="{ 'p-invalid': errors.dni }"
              placeholder="Ingrese DNI (8 dígitos)"
              maxlength="8"
              @input="handleDniInput"
          />
          <small v-if="errors.dni" class="p-error">
            {{ errors.dni }}
          </small>
        </div>

        <div class="col-12 md:col-6">
          <label for="ingresoFamiliar" class="form-label">Ingreso Familiar (S/.)</label>
          <InputText
              id="ingresoFamiliar"
              v-model="form.ingresoFamiliar"
              type="number"
              :class="{ 'p-invalid': errors.ingresoFamiliar }"
              placeholder="0.00"
          />
          <small v-if="errors.ingresoFamiliar" class="p-error">
            {{ errors.ingresoFamiliar }}
          </small>
        </div>

        <!-- Fila 3: Edad, Discapacidad, Migrante, Desplazado -->
        <div class="col-12 md:col-3">
          <label for="edad" class="form-label">Edad</label>
          <InputText
              id="edad"
              v-model="form.edad"
              type="number"
              :class="{ 'p-invalid': errors.edad }"
              placeholder="XX"
          />
          <small v-if="errors.edad" class="p-error">
            {{ errors.edad }}
          </small>
        </div>

        <div class="col-12 md:col-3">
          <label class="form-label">¿Tiene discapacidad?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  id="discapacidad_si"
                  v-model="form.tieneDiscapacidad"
                  :value="true"
                  class="radio-custom"
              />
              <label for="discapacidad_si" class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  id="discapacidad_no"
                  v-model="form.tieneDiscapacidad"
                  :value="false"
                  class="radio-custom"
              />
              <label for="discapacidad_no" class="radio-label">No</label>
            </div>
          </div>
        </div>

        <div class="col-12 md:col-3">
          <label class="form-label">¿Migrante retornado?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  id="migrante_si"
                  v-model="form.esMigranteRetornado"
                  :value="true"
                  class="radio-custom"
              />
              <label for="migrante_si" class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  id="migrante_no"
                  v-model="form.esMigranteRetornado"
                  :value="false"
                  class="radio-custom"
              />
              <label for="migrante_no" class="radio-label">No</label>
            </div>
          </div>
        </div>

        <div class="col-12 md:col-3">
          <label class="form-label">¿Persona desplazada?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  id="desplazada_si"
                  v-model="form.esPersonaDesplazada"
                  :value="true"
                  class="radio-custom"
              />
              <label for="desplazada_si" class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  id="desplazada_no"
                  v-model="form.esPersonaDesplazada"
                  :value="false"
                  class="radio-custom"
              />
              <label for="desplazada_no" class="radio-label">No</label>
            </div>
          </div>
        </div>

        <!-- Campo aporte oculto -->
        <div style="display: none;">
          <InputNumber v-model="form.aporte" />
        </div>
      </div>

      <Divider class="my-4" />

      <!-- SECCIÓN: DATOS DE LA VIVIENDA -->
      <div class="section-header mb-4">
        <div class="section-title-wrapper">
          <i class="pi pi-home section-icon"></i>
          <h3 class="section-title">Datos de la Vivienda</h3>
        </div>
      </div>

      <div class="grid">
        <!-- Fila 1: Proyecto y Tipo de Vivienda -->
        <div class="col-12 md:col-6">
          <label for="proyecto" class="form-label">Proyecto/Nombre de la Vivienda</label>
          <InputText
              id="proyecto"
              v-model="form.vivienda.proyecto"
              :class="{ 'p-invalid': errors.viviendaProyecto }"
              placeholder="Ingrese proyecto"
          />
          <small v-if="errors.viviendaProyecto" class="p-error">
            {{ errors.viviendaProyecto }}
          </small>
        </div>

        <div class="col-12 md:col-6">
          <label for="tipoVivienda" class="form-label">Tipo de Vivienda</label>
          <InputText
              id="tipoVivienda"
              v-model="form.vivienda.tipoVivienda"
              :class="{ 'p-invalid': errors.viviendaTipo }"
              placeholder="Casa, Departamento, etc."
          />
          <small v-if="errors.viviendaTipo" class="p-error">
            {{ errors.viviendaTipo }}
          </small>
        </div>

        <!-- Fila 2: Valor de Vivienda y Modalidad -->
        <div class="col-12 md:col-6">
          <label for="valorVivienda" class="form-label">Valor de la vivienda (s/.)</label>
          <InputText
              id="valorVivienda"
              v-model="form.vivienda.valorVivienda"
              type="number"
              :class="{ 'p-invalid': errors.viviendaValor }"
              placeholder="0.00"
          />
          <small v-if="errors.viviendaValor" class="p-error">
            {{ errors.viviendaValor }}
          </small>
        </div>

        <div class="col-12 md:col-6">
          <label for="modalidad" class="form-label">Modalidad de Vivienda</label>
          <Dropdown
              id="modalidad"
              v-model="form.vivienda.modalidadVivienda"
              :options="modalidadesVivienda"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar el tipo de vivienda"
              :class="{ 'p-invalid': errors.viviendaModalidad }"
              class="w-full"
              appendTo="body"
              :panelStyle="{ zIndex: 10000 }"
          />
          <small v-if="errors.viviendaModalidad" class="p-error">
            {{ errors.viviendaModalidad }}
          </small>
        </div>

        <!-- Fila 3: Cuota Inicial -->
        <div class="col-12 md:col-6">
          <label for="cuotaInicial" class="form-label">¿Cuánto darás de cuota inicial? (S/.)</label>
          <div class="cuota-input-group">
            <InputText
                id="porcentaje"
                v-model="form.vivienda.cuotaInicialPorcentaje"
                type="number"
                placeholder="XX%"
                class="cuota-percentage"
                :max="100"
            />
            <InputText
                id="cuotaInicial"
                v-model="form.vivienda.cuotaInicial"
                type="number"
                :class="{ 'p-invalid': errors.viviendaCuotaInicial }"
                placeholder="0.00"
                class="cuota-amount"
            />
          </div>
          <small v-if="errors.viviendaCuotaInicial" class="p-error">
            {{ errors.viviendaCuotaInicial }}
          </small>
        </div>

        <div class="col-12 md:col-6">
          <label for="tipoVIS" class="form-label">Tipo de VIS</label>
          <Dropdown
              id="tipoVIS"
              v-model="form.vivienda.tipoVIS"
              :options="tiposVIS"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar el tipo de VIS"
              :class="{ 'p-invalid': errors.viviendaVIS }"
              class="w-full"
              appendTo="body"
              :panelStyle="{ zIndex: 10000 }"
          />
          <small v-if="errors.viviendaVIS" class="p-error">
            {{ errors.viviendaVIS }}
          </small>
        </div>

        <!-- Fila 4: Ubicación -->
        <div class="col-12">
          <label for="ubicacion" class="form-label">Ubicacion</label>
          <InputText
              id="ubicacion"
              v-model="form.vivienda.ubicacion"
              :class="{ 'p-invalid': errors.viviendaUbicacion }"
              placeholder="Ej: San Isidro, Lima"
          />
          <small v-if="errors.viviendaUbicacion" class="p-error">
            {{ errors.viviendaUbicacion }}
          </small>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-between gap-2">
        <Button
            label="Cancelar"
            icon="pi pi-times"
            class="p-button-secondary"
            @click="handleClose"
            :disabled="loading"
        />
        <Button
            :label="isEdit ? 'Actualizar' : 'Guardar'"
            icon="pi pi-check"
            class="p-button-success"
            @click="handleSubmit"
            :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.form-container {
  padding: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #059669;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.5rem;
  color: #059669;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.9375rem;
  font-weight: 600;
}

.p-error {
  color: #ef4444;
  font-size: 0.75rem;
  display: block;
  margin-top: 0.25rem;
}

.cuota-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cuota-percentage {
  flex: 0 0 80px;
}

.cuota-amount {
  flex: 1;
}

/* Estilos para RadioButtons */
.radio-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  height: 44px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-custom {
  cursor: pointer;
  accent-color: #059669;
  flex-shrink: 0;
}

.radio-label {
  margin: 0;
  cursor: pointer;
  color: #6b7280;
  font-weight: 500;
  user-select: none;
  font-size: 0.9375rem;
}

:deep(.p-inputtext) {
  border: 1px solid #d1d5db !important;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

:deep(.p-inputtext:hover) {
  border-color: #059669 !important;
}

:deep(.p-inputtext:focus) {
  border-color: #059669 !important;
  box-shadow: 0 0 0 0.2rem rgba(5, 150, 105, 0.25) !important;
}

:deep(.p-inputtext.p-invalid) {
  border-color: #ef4444 !important;
}

:deep(.p-dropdown) {
  width: 100%;
  border: 1px solid #d1d5db !important;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.p-dropdown:hover) {
  border-color: #059669 !important;
}

:deep(.p-dropdown.p-focus) {
  border-color: #059669 !important;
  box-shadow: 0 0 0 0.2rem rgba(5, 150, 105, 0.25) !important;
}

:deep(.p-button.p-button-success) {
  background: #059669;
  border-color: #059669;
  padding: 0.75rem 2rem;
}

:deep(.p-button.p-button-success:enabled:hover) {
  background: #047857;
  border-color: #047857;
}

:deep(.p-button.p-button-secondary) {
  background: #6b7280;
  border-color: #6b7280;
  padding: 0.75rem 2rem;
}

:deep(.p-button.p-button-secondary:enabled:hover) {
  background: #4b5563;
  border-color: #4b5563;
}
</style>

<style>
.cliente-dialog.p-dialog {
  background: white;
  border-radius: 8px;
}

.cliente-dialog.p-dialog .p-dialog-header {
  background: white;
  border-bottom: none;
  padding: 1.5rem 2rem;
}

.cliente-dialog.p-dialog .p-dialog-title {
  font-weight: 700;
  font-size: 1.25rem;
  color: #1f2937;
}

.cliente-dialog.p-dialog .p-dialog-content {
  padding: 2rem !important;
  background: white;
}

.cliente-dialog.p-dialog .p-dialog-footer {
  padding: 1.5rem 2rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  gap: 1rem;
}

.p-dialog-mask {
  background-color: rgba(0, 0, 0, 0.5) !important;
}
</style>