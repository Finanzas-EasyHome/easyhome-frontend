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
    viviendaSostenible: false,
    bonoBbp: false,
    cuotaInicial: 0,
    cuotaInicialPorcentaje: 0,
    tipoBbp: "No aplica",
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
  viviendaTipoBbp: "",
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
  {
    proyecto: "Residencial Monte Verde",
    tipo_vivienda: "Casa Unifamiliar",
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
  { label: "Casa Unifamiliar", value: "Casa Unifamiliar" },
  { label: "Conjunto Residencial", value: "Conjunto Residencial" },
  { label: "Lote", value: "Lote" }
];

const tiposBBP = [
  { label: "BBP Tradicional", value: "BBP Tradicional" },
  { label: "BBP Integrador - Tradicional", value: "BBP Integrador - Tradicional" },
  { label: "BBP Vivienda Sostenible", value: "BBP Vivienda Sostenible" },
  { label: "BBP Integrador - Sostenible", value: "BBP Integrador - Sostenible" },
  { label: "No aplica", value: "No aplica" }
];

/* ===========================================================
    COMPUTED: REQUISITOS BBP
   =========================================================== */
const cumpleRequisitosBBP = computed(() => {
  const valor = Number(form.value.vivienda.valorVivienda) || 0;
  const porcentaje = Number(form.value.vivienda.cuotaInicialPorcentaje) || 0;

  const valorValido = valor >= 68800 && valor <= 488800;
  const porcentajeValido = porcentaje >= 7.5;

  return valorValido && porcentajeValido;
});

/* ===========================================================
   COMPUTED: TIPO BBP AUTOMÁTICO
   =========================================================== */
const tipoBBPAutomatico = computed(() => {
  if (!cumpleRequisitosBBP.value || !form.value.vivienda.bonoBbp) {
    return "No aplica";
  }

  const edad = Number(form.value.edad) || 0;
  const esDiscapacitado = form.value.tieneDiscapacidad;
  const esDesplazado = form.value.esPersonaDesplazada;
  const esMigrante = form.value.esMigranteRetornado;
  const viviendaSostenible = form.value.vivienda.viviendaSostenible;

  const cumpleIntegrador = edad >= 60 || esDiscapacitado || esDesplazado || esMigrante;

  if (cumpleIntegrador && viviendaSostenible) return "BBP Integrador - Sostenible";
  if (cumpleIntegrador && !viviendaSostenible) return "BBP Integrador - Tradicional";
  if (!cumpleIntegrador && !viviendaSostenible) return "BBP Tradicional";
  if (!cumpleIntegrador && viviendaSostenible) return "BBP Vivienda Sostenible";

  return "No aplica";
});

/* ===========================================================
    COMPUTED: MENSAJE DE AYUDA BBP
   =========================================================== */
const mensajeBBP = computed(() => {
  const valor = Number(form.value.vivienda.valorVivienda) || 0;
  const porcentaje = Number(form.value.vivienda.cuotaInicialPorcentaje) || 0;

  if (valor < 68800) return " Valor de vivienda debe ser mínimo S/ 68,800";
  if (valor > 488800) return " Valor de vivienda debe ser máximo S/ 488,800 para BBP";
  if (porcentaje < 7.5) return " Cuota inicial debe ser mínimo 7.5%";

  if (cumpleRequisitosBBP.value) return " Cumple requisitos para Bono BBP";

  return "Ingrese valor de vivienda y cuota inicial";
});

/* ===========================================================
   RESET
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
      viviendaSostenible: false,
      bonoBbp: false,
      cuotaInicial: 0,
      cuotaInicialPorcentaje: 0,
      tipoBbp: "No aplica",
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
    viviendaTipoBbp: "",
    viviendaUbicacion: ""
  };
}

/* ===========================================================
    CARGAR CLIENTE EN EDICIÓN
   =========================================================== */
watch(
    () => props.cliente,
    (c) => {
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
            tipoBbp: c.vivienda?.tipoBbp ?? "No aplica",
            ubicacion: c.vivienda?.ubicacion ?? ""
          }
        };
      } else {
        resetForm();
      }
      resetErrors();
    },
    { immediate: true }
);

/* ===========================================================
   VALIDACIÓN
   =========================================================== */
function validateForm() {
  let valid = true;
  resetErrors();

  if (!form.value.nombresApellidos.trim()) {
    errors.value.nombresApellidos = "El nombre es requerido";
    valid = false;
  }
  if (!form.value.dni || form.value.dni.length !== 8) {
    errors.value.dni = "DNI inválido";
    valid = false;
  }
  if (!form.value.edad || form.value.edad < 18) {
    errors.value.edad = "Edad inválida";
    valid = false;
  }
  if (!form.value.ingresoFamiliar || form.value.ingresoFamiliar <= 0) {
    errors.value.ingresoFamiliar = "Ingresos inválidos";
    valid = false;
  }

  if (!form.value.vivienda.proyecto.trim()) {
    errors.value.viviendaProyecto = "El proyecto es requerido";
    valid = false;
  }
  if (!form.value.vivienda.tipoVivienda.trim()) {
    errors.value.viviendaTipo = "El tipo es requerido";
    valid = false;
  }
  if (!form.value.vivienda.valorVivienda || form.value.vivienda.valorVivienda <= 0) {
    errors.value.viviendaValor = "El valor debe ser mayor a 0";
    valid = false;
  }
  if (!form.value.vivienda.ubicacion.trim()) {
    errors.value.viviendaUbicacion = "La ubicación es requerida";
    valid = false;
  }

  if (form.value.vivienda.bonoBbp && !cumpleRequisitosBBP.value) {
    errors.value.bonoBbp = "No cumple requisitos para BBP";
    valid = false;
  }

  if (form.value.vivienda.cuotaInicialPorcentaje < 7.5) {
    errors.value.viviendaCuotaInicial = "La cuota inicial mínima es 7.5%";
    valid = false;
  }

  if (form.value.vivienda.valorVivienda > 488800) {
    errors.value.viviendaValor = "El valor de vivienda no puede exceder S/ 488,800";
    valid = false;
  }

  if (form.value.vivienda.cuotaInicial <= 0) {
    errors.value.viviendaCuotaInicial = "La cuota inicial debe ser mayor a cero";
    valid = false;
  }

  return valid;
}

/* ===========================================================
    CÁLCULOS DE CUOTAS
   =========================================================== */
function recalcularCuotaDesdePorcentaje() {
  const valor = Number(form.value.vivienda.valorVivienda) || 0;
  const porcentaje = Number(form.value.vivienda.cuotaInicialPorcentaje) || 0;

  if (valor > 0 && porcentaje >= 0) {
    form.value.vivienda.cuotaInicial = Number(((valor * porcentaje) / 100).toFixed(2));
  } else {
    form.value.vivienda.cuotaInicial = 0;
  }
}

function recalcularPorcentajeDesdeCuota() {
  const valor = Number(form.value.vivienda.valorVivienda) || 0;
  const cuota = Number(form.value.vivienda.cuotaInicial) || 0;

  if (valor > 0 && cuota >= 0) {
    form.value.vivienda.cuotaInicialPorcentaje = Number(((cuota * 100) / valor).toFixed(2));
  } else {
    form.value.vivienda.cuotaInicialPorcentaje = 0;
  }
}

/* ===========================================================
   WATCH: Proyecto autocompleta vivienda
   =========================================================== */
watch(
    () => form.value.vivienda.proyecto,
    (nombre) => {
      if (!nombre) return;
      const v = proyectosData.find((x) => x.proyecto === nombre);
      if (!v) return;

      form.value.vivienda.tipoVivienda = v.tipo_vivienda;
      form.value.vivienda.viviendaSostenible = !!v.vivienda_sostenible;
      form.value.vivienda.valorVivienda = Number(v.valor_vivienda);
      form.value.vivienda.ubicacion = v.ubicacion;

      recalcularCuotaDesdePorcentaje();
    }
);

/* ===========================================================
   WATCHERS: AUTO-CÁLCULO DE CUOTAS
   =========================================================== */
watch(
    () => form.value.vivienda.valorVivienda,
    (nuevoValor, viejoValor) => {
      if (nuevoValor !== viejoValor) {
        recalcularCuotaDesdePorcentaje();
      }
    }
);

watch(
    () => form.value.vivienda.cuotaInicialPorcentaje,
    (nuevo, viejo) => {
      if (nuevo !== viejo) recalcularCuotaDesdePorcentaje();
    }
);

watch(
    () => form.value.vivienda.cuotaInicial,
    (nuevo, viejo) => {
      if (nuevo !== viejo) recalcularPorcentajeDesdeCuota();
    }
);

/* ===========================================================
   WATCHERS BBP
   =========================================================== */
watch(
    [
      () => form.value.vivienda.valorVivienda,
      () => form.value.vivienda.cuotaInicialPorcentaje
    ],
    () => {
      if (!cumpleRequisitosBBP.value) {
        form.value.vivienda.bonoBbp = false;
        form.value.vivienda.tipoBbp = "No aplica";
      }
    }
);

watch(
    () => form.value.vivienda.bonoBbp,
    (nuevo) => {
      if (!nuevo) {
        form.value.vivienda.tipoBbp = "No aplica";
      } else if (cumpleRequisitosBBP.value) {
        form.value.vivienda.tipoBbp = tipoBBPAutomatico.value;
      } else {
        form.value.vivienda.bonoBbp = false;
        form.value.vivienda.tipoBbp = "No aplica";
      }
    }
);

watch(
    [
      () => form.value.edad,
      () => form.value.tieneDiscapacidad,
      () => form.value.esPersonaDesplazada,
      () => form.value.esMigranteRetornado,
      () => form.value.vivienda.viviendaSostenible
    ],
    () => {
      if (form.value.vivienda.bonoBbp && cumpleRequisitosBBP.value) {
        form.value.vivienda.tipoBbp = tipoBBPAutomatico.value;
      }
    }
);

/* ===========================================================
   NUEVO WATCHER OFICIAL (REGALADO PARA TI)
   =========================================================== */
watch(
    () => form.value.vivienda.valorVivienda,
    (valor) => {
      valor = Number(valor) || 0;

      // 🟥 Viviendas con valor > 362,100 NO pueden aplicar BBP
      if (valor > 362100) {
        form.value.vivienda.bonoBbp = false;
        form.value.vivienda.tipoBbp = "No aplica";
        return;
      }

      // 🟩 Si vuelve a un valor dentro del rango y cumple requisitos
      if (valor <= 362100 && cumpleRequisitosBBP.value) {
        form.value.vivienda.bonoBbp = true;
        form.value.vivienda.tipoBbp = tipoBBPAutomatico.value;
      }
    }
);

/* ===========================================================
   GUARDAR
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

function handleDniInput(event) {
  form.value.dni = event.target.value.replace(/\D/g, "").slice(0, 8);
}
</script>

<template>
  <Dialog
      :visible="visible"
      :header="isEdit ? 'Editar Cliente' : 'Nuevo Cliente'"
      modal
      :style="{ width: '900px', maxHeight: '90vh' }"
      :contentStyle="{ overflow: 'auto' }"
      @update:visible="handleClose"
      class="cliente-dialog"
  >
    <div class="form-container p-fluid">

      <!-- DATOS DEL CLIENTE -->
      <div class="section-header mb-4">
        <div class="section-title-wrapper">
          <i class="pi pi-user section-icon"></i>
          <h3 class="section-title">Datos del Cliente</h3>
        </div>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="form-label">Nombres y Apellidos</label>
          <InputText v-model="form.nombresApellidos" :class="{ 'p-invalid': errors.nombresApellidos }" />
          <small v-if="errors.nombresApellidos" class="p-error">{{ errors.nombresApellidos }}</small>
        </div>

        <div class="col-12 md:col-6">
          <label class="form-label">Estado Civil</label>
          <Dropdown
              v-model="form.estadoCivil"
              :options="estadosCiviles"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              :class="{ 'p-invalid': errors.estadoCivil }"
          />
          <small v-if="errors.estadoCivil" class="p-error">{{ errors.estadoCivil }}</small>
        </div>

        <div class="col-12 md:col-6">
          <label class="form-label">DNI</label>
          <InputText
              v-model="form.dni"
              maxlength="8"
              @input="handleDniInput"
              :class="{ 'p-invalid': errors.dni }"
          />
          <small v-if="errors.dni" class="p-error">{{ errors.dni }}</small>
        </div>

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
          />
          <small v-if="errors.ingresoFamiliar" class="p-error">{{ errors.ingresoFamiliar }}</small>
        </div>

        <div class="col-12 md:col-3">
          <label class="form-label">Edad</label>
          <InputText v-model="form.edad" type="number" :class="{ 'p-invalid': errors.edad }" />
          <small v-if="errors.edad" class="p-error">{{ errors.edad }}</small>
        </div>

        <!-- Radios -->
        <div class="col-12 md:col-3">
          <label class="form-label">¿Tiene discapacidad?</label>
          <div class="radio-group">
            <RadioButton v-model="form.tieneDiscapacidad" :value="true" />
            <label class="radio-label">Sí</label>
            <RadioButton v-model="form.tieneDiscapacidad" :value="false" />
            <label class="radio-label">No</label>
          </div>
        </div>

        <div class="col-12 md:col-3">
          <label class="form-label">¿Migrante retornado?</label>
          <div class="radio-group">
            <RadioButton v-model="form.esMigranteRetornado" :value="true" />
            <label class="radio-label">Sí</label>
            <RadioButton v-model="form.esMigranteRetornado" :value="false" />
            <label class="radio-label">No</label>
          </div>
        </div>

        <div class="col-12 md:col-3">
          <label class="form-label">¿Persona desplazada?</label>
          <div class="radio-group">
            <RadioButton v-model="form.esPersonaDesplazada" :value="true" />
            <label class="radio-label">Sí</label>
            <RadioButton v-model="form.esPersonaDesplazada" :value="false" />
            <label class="radio-label">No</label>
          </div>
        </div>
      </div>

      <Divider class="my-4" />

      <!-- DATOS DE LA VIVIENDA -->
      <div class="section-header mb-4">
        <div class="section-title-wrapper">
          <i class="pi pi-home section-icon"></i>
          <h3 class="section-title">Datos de la Vivienda</h3>
        </div>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="form-label">Proyecto</label>
          <InputText v-model="form.vivienda.proyecto" :class="{ 'p-invalid': errors.viviendaProyecto }" />
          <small v-if="errors.viviendaProyecto" class="p-error">{{ errors.viviendaProyecto }}</small>
        </div>

        <div class="col-12 md:col-6">
          <label class="form-label">Tipo de Vivienda</label>
          <Dropdown
              v-model="form.vivienda.tipoVivienda"
              :options="tiposVivienda"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              :class="{ 'p-invalid': errors.viviendaTipo }"
          />
          <small v-if="errors.viviendaTipo" class="p-error">{{ errors.viviendaTipo }}</small>
        </div>

        <div class="col-12 md:col-6">
          <label class="form-label">Valor de la Vivienda</label>
          <InputNumber
              v-model="form.vivienda.valorVivienda"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              :minFractionDigits="2"
              class="w-full"
              :class="{ 'p-invalid': errors.viviendaValor }"
          />
          <small v-if="errors.viviendaValor" class="p-error">{{ errors.viviendaValor }}</small>
        </div>

        <!-- ✓ Vivienda sostenible -->
        <div class="col-12 md:col-6">
          <label class="form-label">¿Vivienda Sostenible?</label>
          <div class="radio-group">
            <RadioButton v-model="form.vivienda.viviendaSostenible" :value="true" />
            <label class="radio-label">Sí</label>
            <RadioButton v-model="form.vivienda.viviendaSostenible" :value="false" />
            <label class="radio-label">No</label>
          </div>
        </div>

        <!-- Cuotas -->
        <div class="col-12 md:col-6">
          <label class="form-label">Cuota Inicial (%) y Monto</label>
          <div class="cuota-input-group">
            <InputNumber
                v-model="form.vivienda.cuotaInicialPorcentaje"
                suffix="%"
                :minFractionDigits="2"
                :maxFractionDigits="2"
                class="cuota-percentage"
            />

            <InputNumber
                v-model="form.vivienda.cuotaInicial"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="cuota-amount"
                :class="{ 'p-invalid': errors.viviendaCuotaInicial }"
            />
          </div>
          <small v-if="errors.viviendaCuotaInicial" class="p-error">{{ errors.viviendaCuotaInicial }}</small>
        </div>

        <!-- ✅ NUEVO: Mensaje de requisitos BBP -->
        <div class="col-12 md:col-6">
          <div class="bbp-status-card" :class="cumpleRequisitosBBP ? 'bbp-valid' : 'bbp-invalid'">
            <small class="bbp-message">{{ mensajeBBP }}</small>
          </div>
        </div>

        <!-- BBP -->
        <div class="col-12 md:col-6">
          <label class="form-label">¿Bono BBP?</label>
          <div class="radio-group">
            <RadioButton
                v-model="form.vivienda.bonoBbp"
                :value="true"
                :disabled="!cumpleRequisitosBBP"
            />
            <label class="radio-label" :class="{ 'radio-disabled': !cumpleRequisitosBBP }">Sí</label>
            <RadioButton v-model="form.vivienda.bonoBbp" :value="false" />
            <label class="radio-label">No</label>
          </div>
          <small v-if="errors.bonoBbp" class="p-error">{{ errors.bonoBbp }}</small>
        </div>

        <!-- Ubicación -->
        <div class="col-12 md:col-6">
          <label class="form-label">Ubicación</label>
          <InputText
              v-model="form.vivienda.ubicacion"
              :class="{ 'p-invalid': errors.viviendaUbicacion }"
          />
          <small v-if="errors.viviendaUbicacion" class="p-error">{{ errors.viviendaUbicacion }}</small>
        </div>

        <!-- Tipo BBP (Automático) -->
        <div class="col-12 md:col-6">
          <label class="form-label">Tipo de BBP (Automático)</label>
          <InputText
              v-model="form.vivienda.tipoBbp"
              :disabled="true"
              class="tipo-bbp-readonly"
          />
          <small class="p-help">Este campo se calcula automáticamente según los requisitos</small>
        </div>

      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <Button label="Cancelar" class="p-button-secondary" @click="handleClose" />
      <Button :label="isEdit ? 'Actualizar' : 'Guardar'" class="p-button-success" @click="handleSubmit" :loading="loading" />
    </template>
  </Dialog>
</template>

<!-- Styles omitidos por brevedad, se mantienen iguales -->


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