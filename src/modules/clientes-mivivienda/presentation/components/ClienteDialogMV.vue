<!-- src/modules/clientes/presentation/components/ClienteDialogMV.vue -->
<script setup>
import { ref, watch, computed } from 'vue';

/* ===========================================================
   PROPS Y EMITS
   =========================================================== */
const props = defineProps({
  visible: { type: Boolean, required: true },
  cliente: { type: Object, default: null },
  isEdit: { type: Boolean, default: false }
});

const emit = defineEmits(["update:visible", "save"]);

/* ===========================================================
   ESTADOS
   =========================================================== */
const loading = ref(false);

const form = ref({
  nombresApellidos: "",
  dni: "",
  edad: null,
  ingresoFamiliar: 0,
  estadoCivil: "Soltero",
  tieneDiscapacidad: false,
  esMigranteRetornado: false,
  esPersonaDesplazada: false,
  vivienda: {
    proyecto: "",
    tipoVivienda: "",
    valorVivienda: 0,
    viviendaSostenible: false,    // ✓ AGREGADO
    bonoBbp: false,               // ✓ AGREGADO
    cuotaInicial: 0,
    cuotaInicialPorcentaje: 0,
    tipoBbp: "",                  // ✓ CORREGIDO (era tipoBBP)
    ubicacion: ""
  }
});

const errors = ref({
  nombresApellidos: "",
  dni: "",
  edad: "",
  ingresoFamiliar: "",
  estadoCivil: "",
  viviendaProyecto: "",
  viviendaTipo: "",
  viviendaValor: "",
  viviendaCuotaInicial: "",
  viviendaSostenible: "",
  bonoBbp: "",
  viviendaBBP: "",
  viviendaUbicacion: ""
});

const proyectosData = [
  {
    proyecto: "Proyecto Los capibaras",
    tipo_vivienda: "Departamento",
    valor_vivienda: 111000,
    vivienda_sostenible: true,
    bono_bbp: true,
    tipo_bbp: "BBP Tradicional",
    ubicacion: "Chorrillos Lima"
  },
  {
    proyecto: "Residencial Mirador Azul",
    tipo_vivienda: "Departamento",
    valor_vivienda: 95000,
    vivienda_sostenible: false,
    bono_bbp: false,
    tipo_bbp: "No aplica",
    ubicacion: "Villa El Salvador"
  },
  // ✅ AGREGA UN EJEMPLO CON CASA UNIFAMILIAR
  {
    proyecto: "Residencial Monte Verde",
    tipo_vivienda: "Casa Unifamiliar",  // ✅ VALOR CORRECTO
    valor_vivienda: 180000,
    vivienda_sostenible: false,
    bono_bbp: true,
    tipo_bbp: "BBP Tradicional",
    ubicacion: "Carabayllo, Lima"
  }
];

/* ===========================================================
   LISTAS FIJAS
   =========================================================== */
const estadosCiviles = [
  { label: "Soltero/a", value: "Soltero" },
  { label: "Casado/a", value: "Casado" },
  { label: "Divorciado/a", value: "Divorciado" },
  { label: "Viudo/a", value: "Viudo" },
  { label: "Conviviente", value: "Conviviente" }
];

const tiposVivienda = [
  { label: "Departamento", value: "Departamento" },
  { label: "Casa Unifamiliar", value: "Casa Unifamiliar" },  // ✅ CORREGIDO
  { label: "Conjunto Residencial", value: "Conjunto Residencial" },
  { label: "Lote", value: "Lote" }
];

// ✓ NUEVO: Opciones de Tipo BBP
const tiposBBP = [
  { label: "BBP Tradicional", value: "BBP Tradicional" },
  { label: "BBP Integrador - Tradicional", value: "BBP Integrador - Tradicional" },
  { label: "BBP Vivienda Sostenible", value: "BBP Vivienda Sostenible" },
  { label: "No aplica", value: "No aplica" },
  { label: "BBP Integrador - Sostenible", value: "BBP Integrador - Sostenible" }
];

const porcentajeBloqueado = ref(false);

/* ===========================================================
   RESETEAR FORMULARIO Y ERRORES
   =========================================================== */
function resetForm() {
  form.value = {
    nombresApellidos: "",
    dni: "",
    edad: null,
    ingresoFamiliar: 0,
    estadoCivil: "Soltero",
    tieneDiscapacidad: false,
    esMigranteRetornado: false,
    esPersonaDesplazada: false,
    vivienda: {
      proyecto: "",
      tipoVivienda: "",
      valorVivienda: 0,
      viviendaSostenible: false,   // ✓ AGREGADO
      bonoBbp: false,              // ✓ AGREGADO
      cuotaInicial: 0,
      cuotaInicialPorcentaje: 0,
      tipoBbp: "",                 // ✓ CORREGIDO
      ubicacion: ""
    }
  };
}

function resetErrors() {
  errors.value = {
    nombresApellidos: "",
    dni: "",
    edad: "",
    ingresoFamiliar: "",
    estadoCivil: "",
    viviendaProyecto: "",
    viviendaTipo: "",
    viviendaValor: "",
    viviendaCuotaInicial: "",
    viviendaSostenible: "",
    bonoBbp: "",
    viviendaBBP: "",
    viviendaUbicacion: ""
  };
}

/* ===========================================================
   CARGAR DATOS CUANDO ES EDICIÓN
   =========================================================== */
watch(
    () => props.cliente,
    (c) => {
      console.log('🔍 CLIENTE RECIBIDO:', c); // ✅ AGREGAR ESTO
      console.log('🏠 VIVIENDA:', c?.vivienda); // ✅ AGREGAR ESTO
      console.log('📋 TIPO BBP:', c?.vivienda?.tipoBbp); // ✅ AGREGAR ESTO

      if (c && props.isEdit) {
        form.value = {
          nombresApellidos: c.nombresApellidos ?? "",
          dni: c.dni ?? "",
          edad: c.edad ?? null,
          ingresoFamiliar: c.ingresoFamiliar ?? 0,
          estadoCivil: c.estadoCivil ?? "Soltero",
          tieneDiscapacidad: !!c.tieneDiscapacidad,
          esMigranteRetornado: !!c.esMigranteRetornado,
          esPersonaDesplazada: !!c.esPersonaDesplazada,
          vivienda: {
            proyecto: c.vivienda?.proyecto ?? "",
            tipoVivienda: c.vivienda?.tipoVivienda ?? "",
            valorVivienda: c.vivienda?.valorVivienda ?? 0,
            viviendaSostenible: !!c.vivienda?.viviendaSostenible,
            bonoBbp: !!c.vivienda?.bonoBbp,
            cuotaInicial: c.vivienda?.cuotaInicial ?? 0,
            cuotaInicialPorcentaje: c.vivienda?.cuotaInicialPorcentaje ?? 0,
            tipoBbp: c.vivienda?.tipoBbp ?? "",
            ubicacion: c.vivienda?.ubicacion ?? ""
          }
        };

        console.log('✅ FORM CARGADO:', form.value); // ✅ AGREGAR ESTO
        console.log('📋 TIPO BBP EN FORM:', form.value.vivienda.tipoBbp); // ✅ AGREGAR ESTO
      } else {
        resetForm();
      }
      resetErrors();
    },
    { immediate: true }
);

/* ===========================================================
   VALIDACIÓN DEL FORMULARIO
   =========================================================== */
function validateForm() {
  let valid = true;
  resetErrors();

  // Validación: Nombres y Apellidos
  if (!form.value.nombresApellidos.trim()) {
    errors.value.nombresApellidos = "El nombre es requerido";
    valid = false;
  }

  // Validación: DNI
  if (!form.value.dni || form.value.dni.length !== 8) {
    errors.value.dni = "DNI inválido (8 dígitos)";
    valid = false;
  }

  // Validación: Edad
  if (!form.value.edad || form.value.edad < 18) {
    errors.value.edad = "Edad inválida (mayor o igual a 18)";
    valid = false;
  }

  // Validación: Estado Civil
  if (!form.value.estadoCivil) {
    errors.value.estadoCivil = "El estado civil es requerido";
    valid = false;
  }

  // Validación: Ingreso Familiar básico
  if (!form.value.ingresoFamiliar || form.value.ingresoFamiliar <= 0) {
    errors.value.ingresoFamiliar = "El ingreso familiar debe ser mayor a 0";
    valid = false;
  }

  // ========================================================
  //  VALIDACIONES DE VIVIENDA
  // ========================================================

  if (!form.value.vivienda.proyecto.trim()) {
    errors.value.viviendaProyecto = "El proyecto es requerido";
    valid = false;
  }

  if (!form.value.vivienda.tipoVivienda.trim()) {
    errors.value.viviendaTipo = "El tipo de vivienda es requerido";
    valid = false;
  }

  if (!form.value.vivienda.valorVivienda || form.value.vivienda.valorVivienda <= 0) {
    errors.value.viviendaValor = "El valor de la vivienda debe ser mayor a 0";
    valid = false;
  }

  if (!form.value.vivienda.ubicacion.trim()) {
    errors.value.viviendaUbicacion = "La ubicación es requerida";
    valid = false;
  }

  // Validación: Tipo de BBP
  if (!form.value.vivienda.tipoBbp) {
    errors.value.viviendaBBP = "El tipo de BBP es requerido";
    valid = false;
  }

  return valid;
}

/* ===========================================================
   DNI SOLO NÚMEROS Y 8 DÍGITOS
   =========================================================== */
function handleDniInput(e) {
  form.value.dni = e.target.value.replace(/[^0-9]/g, "").substring(0, 8);
}

/* ===========================================================
   CUOTA INICIAL: SINCRONIZAR PORCENTAJE ↔ MONTO
   =========================================================== */
function recalcularCuotaDesdePorcentaje() {
  const valor = Number(form.value.vivienda.valorVivienda) || 0;
  let porcentaje = Number(form.value.vivienda.cuotaInicialPorcentaje) || 0;

  if (valor > 0 && porcentaje >= 0) {
    form.value.vivienda.cuotaInicial = Number(
        (valor * (porcentaje / 100)).toFixed(2)
    );
  } else {
    form.value.vivienda.cuotaInicial = 0;
  }
}

function recalcularPorcentajeDesdeCuota() {
  const valor = Number(form.value.vivienda.valorVivienda) || 0;
  const cuota = Number(form.value.vivienda.cuotaInicial) || 0;

  if (valor > 0 && cuota >= 0) {
    form.value.vivienda.cuotaInicialPorcentaje = Number(
        ((cuota * 100) / valor).toFixed(2)
    );
  } else {
    form.value.vivienda.cuotaInicialPorcentaje = 0;
  }
}


/* ===========================================================
   WATCHERS
   =========================================================== */

// Cuando el usuario escriba un proyecto:
watch(
    () => form.value.vivienda.proyecto,
    (nombre) => {
      if (!nombre) return;

      const v = proyectosData.find((x) => x.proyecto === nombre);
      if (!v) return;

      // Sincroniza automáticamente el resto de campos
      form.value.vivienda.tipoVivienda = v.tipo_vivienda;
      form.value.vivienda.viviendaSostenible = !!v.vivienda_sostenible;  // ✓ CORREGIDO
      form.value.vivienda.bonoBbp = !!v.bono_bbp;                        // ✓ CORREGIDO
      form.value.vivienda.valorVivienda = Number(v.valor_vivienda);
      form.value.vivienda.tipoBbp = v.tipo_bbp || "";                    // ✓ CORREGIDO
      form.value.vivienda.ubicacion = v.ubicacion;

      // Recalcular cuota inicial
      recalcularCuotaDesdePorcentaje();
    }
);

/* Si cambia el valor de la vivienda, recalculamos cuota */
watch(
    () => form.value.vivienda.valorVivienda,
    () => {
      recalcularCuotaDesdePorcentaje();
    }
);


/* ===========================================================
   GUARDAR / CERRAR
   =========================================================== */
function handleSubmit() {
  if (!validateForm()) return;

  recalcularPorcentajeDesdeCuota();
  recalcularCuotaDesdePorcentaje();

  form.value.aporte =
      Number(form.value.vivienda.valorVivienda) *
      (Number(form.value.vivienda.cuotaInicialPorcentaje) / 100);

  emit("save", { ...form.value });
}

function handleClose() {
  emit("update:visible", false);
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
      modal
      class="cliente-dialog"
      :contentStyle="{ overflow: 'auto' }"
      @update:visible="handleClose"
  >
    <div class="form-container p-fluid">
      <!-- ============================ -->
      <!--   DATOS DEL CLIENTE          -->
      <!-- ============================ -->
      <div class="section-header mb-4">
        <div class="section-title-wrapper">
          <i class="pi pi-user section-icon"></i>
          <h3 class="section-title">Datos del Cliente</h3>
        </div>
      </div>

      <div class="grid">
        <!-- Nombres -->
        <div class="col-12 md:col-6">
          <label class="form-label">Nombres y Apellidos</label>
          <InputText
              v-model="form.nombresApellidos"
              :class="{ 'p-invalid': errors.nombresApellidos }"
              placeholder="Ingresar nombre completo"
          />
          <small v-if="errors.nombresApellidos" class="p-error">
            {{ errors.nombresApellidos }}
          </small>
        </div>

        <!-- Estado civil -->
        <div class="col-12 md:col-6">
          <label class="form-label">Estado Civil</label>
          <Dropdown
              v-model="form.estadoCivil"
              :options="estadosCiviles"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              appendTo="body"
              :class="{ 'p-invalid': errors.estadoCivil }"
          />
          <small v-if="errors.estadoCivil" class="p-error">
            {{ errors.estadoCivil }}
          </small>
        </div>

        <!-- DNI -->
        <div class="col-12 md:col-6">
          <label class="form-label">DNI</label>
          <InputText
              v-model="form.dni"
              maxlength="8"
              @input="handleDniInput"
              :class="{ 'p-invalid': errors.dni }"
              placeholder="8 dígitos"
          />
          <small v-if="errors.dni" class="p-error">
            {{ errors.dni }}
          </small>
        </div>

        <!-- Ingreso Familiar -->
        <div class="col-12 md:col-6">
          <label class="form-label">Ingreso Familiar (S/.)</label>
          <InputNumber
              v-model="form.ingresoFamiliar"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              :minFractionDigits="2"
              class="w-full"
              :class="{ 'p-invalid': errors.ingresoFamiliar }"
              placeholder="0.00"
          />
          <small v-if="errors.ingresoFamiliar" class="p-error">
            {{ errors.ingresoFamiliar }}
          </small>
        </div>

        <!-- Edad -->
        <div class="col-12 md:col-3">
          <label class="form-label">Edad</label>
          <InputText
              v-model="form.edad"
              type="number"
              placeholder="Ej: 18"
              :class="{ 'p-invalid': errors.edad }"
          />
          <small v-if="errors.edad" class="p-error">
            {{ errors.edad }}
          </small>
        </div>

        <!-- Radios: Discapacidad -->
        <div class="col-12 md:col-3">
          <label class="form-label">¿Tiene discapacidad?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  v-model="form.tieneDiscapacidad"
                  :value="true"
                  class="radio-custom"
              />
              <label class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  v-model="form.tieneDiscapacidad"
                  :value="false"
                  class="radio-custom"
              />
              <label class="radio-label">No</label>
            </div>
          </div>
        </div>

        <!-- Radios: Migrante -->
        <div class="col-12 md:col-3">
          <label class="form-label">¿Migrante retornado?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  v-model="form.esMigranteRetornado"
                  :value="true"
                  class="radio-custom"
              />
              <label class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  v-model="form.esMigranteRetornado"
                  :value="false"
                  class="radio-custom"
              />
              <label class="radio-label">No</label>
            </div>
          </div>
        </div>

        <!-- Radios: Desplazada -->
        <div class="col-12 md:col-3">
          <label class="form-label">¿Persona desplazada?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  v-model="form.esPersonaDesplazada"
                  :value="true"
                  class="radio-custom"
              />
              <label class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  v-model="form.esPersonaDesplazada"
                  :value="false"
                  class="radio-custom"
              />
              <label class="radio-label">No</label>
            </div>
          </div>
        </div>
      </div>

      <Divider class="my-4" />

      <!-- ============================ -->
      <!--    DATOS DE LA VIVIENDA     -->
      <!-- ============================ -->
      <div class="section-header mb-4">
        <div class="section-title-wrapper">
          <i class="pi pi-home section-icon"></i>
          <h3 class="section-title">Datos de la Vivienda</h3>
        </div>
      </div>

      <div class="grid">
        <!-- Proyecto -->
        <div class="col-12 md:col-6">
          <label class="form-label">Proyecto / Nombre de la Vivienda</label>
          <InputText
              v-model="form.vivienda.proyecto"
              :class="{ 'p-invalid': errors.viviendaProyecto }"
              placeholder="Ej: Residencial Mirador Azul"
          />
          <small v-if="errors.viviendaProyecto" class="p-error">
            {{ errors.viviendaProyecto }}
          </small>
        </div>

        <!-- Tipo vivienda -->
        <div class="col-12 md:col-6">
          <label class="form-label">Tipo de Vivienda</label>
          <Dropdown
              v-model="form.vivienda.tipoVivienda"
              :options="tiposVivienda"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo de vivienda..."
              class="w-full"
              appendTo="body"
              :class="{ 'p-invalid': errors.viviendaTipo }"
          />
          <small v-if="errors.viviendaTipo" class="p-error">
            {{ errors.viviendaTipo }}
          </small>
        </div>

        <!-- Valor vivienda -->
        <div class="col-12 md:col-6">
          <label class="form-label">Valor de la Vivienda (S/.)</label>
          <InputNumber
              v-model="form.vivienda.valorVivienda"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              :minFractionDigits="2"
              class="w-full"
              :class="{ 'p-invalid': errors.viviendaValor }"
              placeholder="0.00"
          />
          <small v-if="errors.viviendaValor" class="p-error">
            {{ errors.viviendaValor }}
          </small>
        </div>

        <!-- ✓ NUEVO: ¿Vivienda Sostenible? -->
        <div class="col-12 md:col-6">
          <label class="form-label">¿Vivienda Sostenible?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  v-model="form.vivienda.viviendaSostenible"
                  :value="true"
                  class="radio-custom"
              />
              <label class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  v-model="form.vivienda.viviendaSostenible"
                  :value="false"
                  class="radio-custom"
              />
              <label class="radio-label">No</label>
            </div>
          </div>
        </div>

        <!-- Cuota inicial -->
        <div class="col-12 md:col-6">
          <label class="form-label">Cuota inicial (S/.)</label>
          <div class="cuota-input-group">
            <!-- Porcentaje -->
            <InputNumber
                v-model="form.vivienda.cuotaInicialPorcentaje"
                suffix="%"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                class="cuota-percentage"
                :disabled="porcentajeBloqueado"
                @input="recalcularCuotaDesdePorcentaje"
            />
            <InputNumber
                v-model="form.vivienda.cuotaInicial"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="cuota-amount"
                @input="recalcularPorcentajeDesdeCuota"
                :class="{ 'p-invalid': errors.viviendaCuotaInicial }"
            />
          </div>
          <small v-if="errors.viviendaCuotaInicial" class="p-error">
            {{ errors.viviendaCuotaInicial }}
          </small>
        </div>

        <!-- ✓ NUEVO: ¿Bono del Buen Pagador (BBP)? -->
        <div class="col-12 md:col-6">
          <label class="form-label">¿Bono del Buen Pagador (BBP)?</label>
          <div class="radio-group">
            <div class="radio-option">
              <RadioButton
                  v-model="form.vivienda.bonoBbp"
                  :value="true"
                  class="radio-custom"
              />
              <label class="radio-label">Sí</label>
            </div>
            <div class="radio-option">
              <RadioButton
                  v-model="form.vivienda.bonoBbp"
                  :value="false"
                  class="radio-custom"
              />
              <label class="radio-label">No</label>
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="col-12 md:col-6">
          <label class="form-label">Ubicación</label>
          <InputText
              v-model="form.vivienda.ubicacion"
              :class="{ 'p-invalid': errors.viviendaUbicacion }"
              placeholder="Ej: Ate, Lima"
          />
          <small v-if="errors.viviendaUbicacion" class="p-error">
            {{ errors.viviendaUbicacion }}
          </small>
        </div>

        <!-- ✓ NUEVO: Tipo de BBP -->
        <div class="col-12 md:col-6">
          <label class="form-label">Tipo de BBP</label>
          <Dropdown
              v-model="form.vivienda.tipoBbp"
              :options="tiposBBP"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo de BBP..."
              appendTo="body"
              class="w-full"
              :class="{ 'p-invalid': errors.viviendaBBP }"
          />
          <small v-if="errors.viviendaBBP" class="p-error">
            {{ errors.viviendaBBP }}
          </small>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
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