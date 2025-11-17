<script setup>
import { ref, watch } from 'vue'

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
})

const emit = defineEmits(['update:visible', 'save'])

// State
const loading = ref(false)
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
    esViviendaSostenible: false,
    cuotaInicial: 0,
    cuotaInicialPorcentaje: 0,
    bonoBienPagador: '',
    tipoBBP: '',
    ubicacion: ''
  }
})

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
  viviendaBBP: '',
  viviendaTipoBBP: '',
  viviendaUbicacion: ''
})

const estadosCiviles = [
  { label: 'Soltero/a', value: 'Soltero' },
  { label: 'Casado/a', value: 'Casado' },
  { label: 'Divorciado/a', value: 'Divorciado' },
  { label: 'Viudo/a', value: 'Viudo' },
  { label: 'Conviviente', value: 'Conviviente' }
]

const tiposVivienda = [
  { label: 'Casa', value: 'Casa' },
  { label: 'Departamento', value: 'Departamento' },
  { label: 'Duplex', value: 'Duplex' },
  { label: 'Townhouse', value: 'Townhouse' }
]

const tiposBBP = [
  { label: 'BBP 3%', value: 'BBP 3%' },
  { label: 'BBP 5%', value: 'BBP 5%' },
  { label: 'BBP 10%', value: 'BBP 10%' },
  { label: 'Sin BBP', value: 'Sin BBP' }
]

// Funciones helper
function resetForm () {
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
      esViviendaSostenible: false,
      cuotaInicial: 0,
      cuotaInicialPorcentaje: 0,
      bonoBienPagador: '',
      tipoBBP: '',
      ubicacion: ''
    }
  }
}

function resetErrors () {
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
    viviendaBBP: '',
    viviendaTipoBBP: '',
    viviendaUbicacion: ''
  }
}

// Watch
watch(
    () => props.cliente,
    (newCliente) => {
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
            esViviendaSostenible: newCliente.vivienda?.esViviendaSostenible || false,
            cuotaInicial: newCliente.vivienda?.cuotaInicial || 0,
            cuotaInicialPorcentaje: newCliente.vivienda?.cuotaInicialPorcentaje || 0,
            bonoBienPagador: newCliente.vivienda?.bonoBienPagador || '',
            tipoBBP: newCliente.vivienda?.tipoBBP || '',
            ubicacion: newCliente.vivienda?.ubicacion || ''
          }
        }
      } else {
        resetForm()
      }
      resetErrors()
    },
    { immediate: true }
)

// Métodos de validación y manejo
function handleDniInput (event) {
  const value = event.target.value
  form.value.dni = value.replace(/[^0-9]/g, '').substring(0, 8)
}

function validateForm () {
  let isValid = true
  resetErrors()

  // Validar datos del cliente
  if (!form.value.nombresApellidos || form.value.nombresApellidos.trim() === '') {
    errors.value.nombresApellidos = 'El nombre y apellidos es requerido'
    isValid = false
  } else if (form.value.nombresApellidos.trim().length < 3) {
    errors.value.nombresApellidos = 'Debe tener al menos 3 caracteres'
    isValid = false
  }

  if (!form.value.dni) {
    errors.value.dni = 'El DNI es requerido'
    isValid = false
  } else if (form.value.dni.length !== 8) {
    errors.value.dni = 'El DNI debe tener exactamente 8 dígitos'
    isValid = false
  }

  if (!form.value.edad || form.value.edad < 18 || form.value.edad > 100) {
    errors.value.edad = 'La edad debe estar entre 18 y 100 años'
    isValid = false
  }

  if (!form.value.ingresoFamiliar || form.value.ingresoFamiliar <= 0) {
    errors.value.ingresoFamiliar = 'El ingreso familiar debe ser mayor a 0'
    isValid = false
  }

  if (!form.value.aporte || form.value.aporte <= 0) {
    errors.value.aporte = 'El aporte debe ser mayor a 0'
    isValid = false
  }

  if (!form.value.estadoCivil) {
    errors.value.estadoCivil = 'El estado civil es requerido'
    isValid = false
  }

  // Validar datos de vivienda
  if (!form.value.vivienda.proyecto || form.value.vivienda.proyecto.trim() === '') {
    errors.value.viviendaProyecto = 'El proyecto es requerido'
    isValid = false
  }

  if (!form.value.vivienda.tipoVivienda) {
    errors.value.viviendaTipo = 'El tipo de vivienda es requerido'
    isValid = false
  }

  if (!form.value.vivienda.valorVivienda || form.value.vivienda.valorVivienda <= 0) {
    errors.value.viviendaValor = 'El valor debe ser mayor a 0'
    isValid = false
  }

  if (!form.value.vivienda.cuotaInicial || form.value.vivienda.cuotaInicial < 0) {
    errors.value.viviendaCuotaInicial = 'La cuota inicial debe ser mayor o igual a 0'
    isValid = false
  }

  if (!form.value.vivienda.tipoBBP) {
    errors.value.viviendaTipoBBP = 'El tipo de BBP es requerido'
    isValid = false
  }

  if (!form.value.vivienda.ubicacion || form.value.vivienda.ubicacion.trim() === '') {
    errors.value.viviendaUbicacion = 'La ubicación es requerida'
    isValid = false
  }

  return isValid
}

function handleSubmit () {
  if (validateForm()) {
    emit('save', { ...form.value })
  }
}

function handleClose () {
  emit('update:visible', false)
  setTimeout(() => {
    resetForm()
    resetErrors()
  }, 300)
}
</script>

<template>
  <Dialog
      :visible="visible"
      :style="{ width: '1000px', maxHeight: '90vh' }"
      :header="isEdit ? 'Editar Cliente' : 'Nuevo Cliente'"
      :modal="true"
      :closable="true"
      class="cliente-dialog"
      :contentStyle="{ overflow: 'auto' }"
      @update:visible="handleClose"
  >
    <div class="form-container">
      <div class="p-fluid">
        <!-- SECCIÓN: DATOS DEL CLIENTE -->
        <div class="section-header mb-3">
          <div class="section-title-wrapper">
            <i class="pi pi-user section-icon" />
            <h3 class="section-title">Datos del Cliente</h3>
          </div>
          <Divider />
        </div>

        <div class="grid">
          <!-- Nombres y Apellidos -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="nombresApellidos" class="font-semibold">
                Nombres y Apellidos <span class="text-red-500">*</span>
              </label>
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
          </div>

          <!-- Estado Civil -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="estadoCivil" class="font-semibold">
                Estado Civil <span class="text-red-500">*</span>
              </label>
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
          </div>

          <!-- DNI -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="dni" class="font-semibold">
                DNI <span class="text-red-500">*</span>
              </label>
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
          </div>

          <!-- Ingreso Familiar -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="ingresoFamiliar" class="font-semibold">
                Ingreso Familiar (S/.) <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  id="ingresoFamiliar"
                  v-model="form.ingresoFamiliar"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  :class="{ 'p-invalid': errors.ingresoFamiliar }"
                  placeholder="0.00"
              />
              <small v-if="errors.ingresoFamiliar" class="p-error">
                {{ errors.ingresoFamiliar }}
              </small>
            </div>
          </div>

          <!-- Edad -->
          <div class="col-6 md:col-3">
            <div class="field">
              <label for="edad" class="font-semibold">
                Edad <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  id="edad"
                  v-model="form.edad"
                  :class="{ 'p-invalid': errors.edad }"
                  placeholder="XX"
                  :min="18"
                  :max="100"
              />
              <small v-if="errors.edad" class="p-error">
                {{ errors.edad }}
              </small>
            </div>
          </div>

          <!-- ¿Tiene discapacidad? -->
          <div class="col-6 md:col-3">
            <div class="field">
              <label for="discapacidad" class="font-semibold">
                ¿Tiene discapacidad?
              </label>
              <InputText
                  id="discapacidad"
                  v-model="form.tieneDiscapacidad"
                  placeholder="Sí/No"
                  class="w-full"
              />
            </div>
          </div>

          <!-- ¿Migrante retornado? -->
          <div class="col-6 md:col-3">
            <div class="field">
              <label for="migrante" class="font-semibold">
                ¿Migrante retornado?
              </label>
              <InputText
                  id="migrante"
                  v-model="form.esMigranteRetornado"
                  placeholder="Sí/No"
                  class="w-full"
              />
            </div>
          </div>

          <!-- ¿Persona desplazada? -->
          <div class="col-6 md:col-3">
            <div class="field">
              <label for="desplazada" class="font-semibold">
                ¿Persona desplazada?
              </label>
              <InputText
                  id="desplazada"
                  v-model="form.esPersonaDesplazada"
                  placeholder="Sí/No"
                  class="w-full"
              />
            </div>
          </div>

          <!-- Aporte (oculto en la vista, pero lo mantenemos) -->
          <div class="col-12" style="display: none;">
            <div class="field">
              <label for="aporte" class="font-semibold">
                Aporte (S/.) <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  id="aporte"
                  v-model="form.aporte"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  :class="{ 'p-invalid': errors.aporte }"
                  placeholder="0.00"
              />
              <small v-if="errors.aporte" class="p-error">
                {{ errors.aporte }}
              </small>
            </div>
          </div>
        </div>

        <!-- SECCIÓN: DATOS DE LA VIVIENDA -->
        <div class="section-header mb-3 mt-4">
          <div class="section-title-wrapper">
            <i class="pi pi-home section-icon" />
            <h3 class="section-title">Datos de la Vivienda</h3>
          </div>
          <Divider />
        </div>

        <div class="grid">
          <!-- Proyecto/Nombre de la Vivienda -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="proyecto" class="font-semibold">
                Proyecto/Nombre de la Vivienda <span class="text-red-500">*</span>
              </label>
              <Dropdown
                  id="proyecto"
                  v-model="form.vivienda.proyecto"
                  :options="tiposVivienda.map(t => ({ label: t.label, value: t.label }))"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione proyecto"
                  :class="{ 'p-invalid': errors.viviendaProyecto }"
                  class="w-full"
                  editable
                  appendTo="body"
                  :panelStyle="{ zIndex: 10000 }"
              />
              <small v-if="errors.viviendaProyecto" class="p-error">
                {{ errors.viviendaProyecto }}
              </small>
            </div>
          </div>

          <!-- Tipo de Vivienda -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="tipoVivienda" class="font-semibold">
                Tipo de Vivienda <span class="text-red-500">*</span>
              </label>
              <Dropdown
                  id="tipoVivienda"
                  v-model="form.vivienda.tipoVivienda"
                  :options="tiposVivienda"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar tipo"
                  :class="{ 'p-invalid': errors.viviendaTipo }"
                  class="w-full"
                  appendTo="body"
                  :panelStyle="{ zIndex: 10000 }"
              />
              <small v-if="errors.viviendaTipo" class="p-error">
                {{ errors.viviendaTipo }}
              </small>
            </div>
          </div>

          <!-- Valor de la Vivienda -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="valorVivienda" class="font-semibold">
                Valor de la vivienda (S/.) <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  id="valorVivienda"
                  v-model="form.vivienda.valorVivienda"
                  mode="currency"
                  currency="PEN"
                  locale="es-PE"
                  :minFractionDigits="2"
                  :class="{ 'p-invalid': errors.viviendaValor }"
                  placeholder="0.00"
              />
              <small v-if="errors.viviendaValor" class="p-error">
                {{ errors.viviendaValor }}
              </small>
            </div>
          </div>

          <!-- ¿Vivienda Sostenible? -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="sostenible" class="font-semibold">
                ¿Vivienda Sostenible?
              </label>
              <InputText
                  id="sostenible"
                  v-model="form.vivienda.esViviendaSostenible"
                  placeholder="Sí/No"
                  class="w-full"
              />
            </div>
          </div>

          <!-- Cuota Inicial con Porcentaje -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="cuotaInicial" class="font-semibold">
                ¿Cuánto darás de cuota inicial? (S/.) <span class="text-red-500">*</span>
              </label>
              <div class="cuota-input-group">
                <InputNumber
                    id="porcentajeCuota"
                    v-model="form.vivienda.cuotaInicialPorcentaje"
                    suffix="%"
                    placeholder="XX%"
                    class="cuota-percentage"
                    :max="100"
                />
                <InputNumber
                    id="cuotaInicial"
                    v-model="form.vivienda.cuotaInicial"
                    mode="currency"
                    currency="PEN"
                    locale="es-PE"
                    :minFractionDigits="2"
                    :class="{ 'p-invalid': errors.viviendaCuotaInicial }"
                    placeholder="0.00"
                    class="cuota-amount"
                />
              </div>
              <small v-if="errors.viviendaCuotaInicial" class="p-error">
                {{ errors.viviendaCuotaInicial }}
              </small>
            </div>
          </div>

          <!-- Bono del Buen Pagador -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="bonoBienPagador" class="font-semibold">
                ¿Bono del Buen Pagador (BBP)?
              </label>
              <InputText
                  id="bonoBienPagador"
                  v-model="form.vivienda.bonoBienPagador"
                  placeholder="Sí/No"
                  class="w-full"
              />
            </div>
          </div>

          <!-- Ubicación -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="ubicacion" class="font-semibold">
                Ubicación <span class="text-red-500">*</span>
              </label>
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

          <!-- Tipo de BBP -->
          <div class="col-12 md:col-6">
            <div class="field">
              <label for="tipoBBP" class="font-semibold">
                Tipo de BBP <span class="text-red-500">*</span>
              </label>
              <Dropdown
                  id="tipoBBP"
                  v-model="form.vivienda.tipoBBP"
                  :options="tiposBBP"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccione tipo de BBP"
                  :class="{ 'p-invalid': errors.viviendaTipoBBP }"
                  class="w-full"
                  appendTo="body"
                  :panelStyle="{ zIndex: 10000 }"
              />
              <small v-if="errors.viviendaTipoBBP" class="p-error">
                {{ errors.viviendaTipoBBP }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2">
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
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section-icon {
  font-size: 1.25rem;
  color: #059669;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
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
  margin-top: 0.5rem;
}

.text-red-500 {
  color: #ef4444;
}

.font-semibold {
  font-weight: 600;
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
</style>
