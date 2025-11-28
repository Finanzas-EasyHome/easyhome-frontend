<!-- src/modules/clientes/presentation/components/ClienteDialog.vue -->
<script setup>
import { ref, watch, computed } from 'vue';

/* ===========================================================
   PROPS Y EMITS
   =========================================================== */
const props = defineProps({
  visible: { type: Boolean, required: true },
  cliente: { type: Object, default: null }, // viene del padre al editar
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
    modalidadVivienda: "",
    cuotaInicial: 0,
    cuotaInicialPorcentaje: 0,
    tipoVIS: "",
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
  viviendaModalidad: "",
  viviendaVIS: "",
  viviendaUbicacion: ""
});

const proyectosData = [
  {
    proyecto: "Proyecto Los capibaras",
    tipo_vivienda: "Departamento",
    modalidad_vivienda: "Adquisición de Vivienda",
    valor_vivienda: 111000,
    tipo_vis: "VIS en Lote Unifamiliar",
    ubicacion: "Chorrillos Lima"
  },
  {
    proyecto: "Residencial Mirador Azul",
    tipo_vivienda: "Departamento",
    modalidad_vivienda: "Construcción en Sitio Propio",
    valor_vivienda: 95000,
    tipo_vis: "Ninguna",
    ubicacion: "Villa El Salvador"
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
  { label: "Conjunto Residencial", value: "Conjunto Residencial" },
  { label: "Vivienda Unifamiliar", value: "Vivienda Unifamiliar" },
  { label: "Lote", value: "Lote" }
];

const tiposVIS = [
  {
    label: "VIS Priorizada en Lote Unifamiliar",
    value: "VIS Priorizada en Lote Unifamiliar"
  },
  {
    label: "VIS Priorizada en Edificio Multifamiliar / Conjunto Residencial / Quinta",
    value: "VIS Priorizada en Edificio Multifamiliar / Conjunto Residencial / Quinta"
  },
  {
    label: "VIS en Edificio Multifamiliar / Conjunto Residencial / Quinta",
    value: "VIS en Edificio Multifamiliar / Conjunto Residencial / Quinta"
  },
  { label: "Ninguna", value: "Ninguna" },
  {
    label: "VIS en Lote Unifamiliar",
    value: "VIS en Lote Unifamiliar"
  }
];

/* Reglas para cada tipo de VIS - CORREGIDAS */
const visConfig = {
  "VIS Priorizada en Lote Unifamiliar": {
    mode: "range",
    min: 1,
    max: 3,
    editable: true,
    descripcion: "Ahorro entre 1% y 3%"
  },
  "VIS Priorizada en Edificio Multifamiliar / Conjunto Residencial / Quinta": {
    mode: "range",
    min: 1,
    max: 3,
    editable: true,
    descripcion: "Ahorro entre 1% y 3%"
  },
  "VIS en Edificio Multifamiliar / Conjunto Residencial / Quinta": {
    mode: "minimum",
    min: 3,
    editable: true,
    descripcion: "Mínimo 3%"
  },
  "Ninguna": {
    mode: "minimum",
    min: 0,
    editable: true,
    descripcion: "Desde 0% en adelante"
  },
  "VIS en Lote Unifamiliar": {
    mode: "minimum",
    min: 3,
    editable: true,
    descripcion: "Mínimo 3%"
  }
};

const porcentajeBloqueado = ref(false);

/* ===========================================================
   CARGAR DATOS CUANDO ES EDICIÓN
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
      modalidadVivienda: "",
      cuotaInicial: 0,
      cuotaInicialPorcentaje: 0,
      tipoVIS: "",
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
    viviendaModalidad: "",
    viviendaVIS: "",
    viviendaUbicacion: ""
  };
}

watch(
    () => props.cliente,
    (c) => {
      if (c && props.isEdit) {
        // Copiamos solo lo que necesitamos
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
            modalidadVivienda: c.vivienda?.modalidadVivienda ?? "",
            cuotaInicial: c.vivienda?.cuotaInicial ?? 0,
            cuotaInicialPorcentaje: c.vivienda?.cuotaInicialPorcentaje ?? 0,
            tipoVIS: c.vivienda?.tipoVIS ?? "",
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
//  VALIDACIÓN: Ingreso Familiar según modalidad / VIS
// ========================================================
  const IFM = Number(form.value.ingresoFamiliar);
  const modalidad = form.value.vivienda.modalidadVivienda;
  const tipoVIS = form.value.vivienda.tipoVIS;

  let limiteIFM = null;

// 1. ADQUISICIÓN DE VIVIENDA
  if (modalidad === "Adquisición de Vivienda") {
    const visPriorizadas = [
      "VIS Priorizada en Edificio Multifamiliar / Conjunto Residencial / Quinta",
      "VIS Priorizada en Lote Unifamiliar"
    ];

    if (visPriorizadas.includes(tipoVIS)) {
      // VIS Priorizadas: límite 2,071.2
      limiteIFM = 2071.2;
    } else {
      // VIS normales (VIS en Lote Unifamiliar, VIS en Edificio...): límite 3,715.1
      limiteIFM = 3715.1;
    }
  }

// 2. CONSTRUCCIÓN EN SITIO PROPIO con Ninguna
  if (modalidad === "Construcción en Sitio Propio" && tipoVIS === "Ninguna") {
    limiteIFM = 2706.3;
  }

// 3. MEJORAMIENTO DE VIVIENDA con Ninguna
  if (modalidad === "Mejoramiento de Vivienda" && tipoVIS === "Ninguna") {
    limiteIFM = 2706.4;
  }

// Aplicar validación del límite IFM SOLO si se estableció un límite
  if (limiteIFM !== null && IFM > limiteIFM) {
    errors.value.ingresoFamiliar =
        `El ingreso familiar no debe superar S/ ${limiteIFM.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} para esta modalidad y tipo de VIS.`;
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

  // ========================================================
  //  VALIDACIÓN: Valor máximo de vivienda según Tipo VIS
  // ========================================================
  const valorVivienda = Number(form.value.vivienda.valorVivienda) || 0;

  // Definir límites según tipo de VIS
  const limitesValorVIS = {
    "VIS Priorizada en Lote Unifamiliar": 60000,
    "VIS Priorizada en Edificio Multifamiliar / Conjunto Residencial / Quinta": 70000,
    "VIS en Lote Unifamiliar": 104500,
    "VIS en Edificio Multifamiliar / Conjunto Residencial / Quinta": 130500,
    "Ninguna": 130500  // Límite general
  };

  // Aplicar validación del valor máximo según tipo VIS
  if (tipoVIS && limitesValorVIS[tipoVIS]) {
    const limiteMaximo = limitesValorVIS[tipoVIS];

    if (valorVivienda > limiteMaximo) {
      errors.value.viviendaValor =
          `Para el tipo de VIS "${tipoVIS}", el valor de la vivienda no debe superar S/ ${limiteMaximo.toLocaleString('es-PE')}`;
      valid = false;
    }
  }

  if (!form.value.vivienda.modalidadVivienda.trim()) {
    errors.value.viviendaModalidad = "La modalidad de vivienda es requerida";
    valid = false;
  }

  if (!form.value.vivienda.tipoVIS) {
    errors.value.viviendaVIS = "El tipo de VIS es requerido";
    valid = false;
  }

  // ========================================================
  //  VALIDACIÓN: Relación Modalidad ↔ Tipo VIS
  // ========================================================
  if (modalidad && tipoVIS) {
    // Para Construcción en Sitio Propio y Mejoramiento de Vivienda
    if (modalidad === "Construcción en Sitio Propio" || modalidad === "Mejoramiento de Vivienda") {
      if (tipoVIS !== "Ninguna") {
        errors.value.viviendaVIS =
            `Para la modalidad "${modalidad}" solo se permite seleccionar "Ninguna" como tipo de VIS.`;
        valid = false;
      }
    }

    // Para Adquisición de Vivienda
    if (modalidad === "Adquisición de Vivienda") {
      const tiposVISPermitidos = [
        "VIS Priorizada en Lote Unifamiliar",
        "VIS en Lote Unifamiliar",
        "VIS en Edificio Multifamiliar / Conjunto Residencial / Quinta",
        "VIS Priorizada en Edificio Multifamiliar / Conjunto Residencial / Quinta"
      ];

      if (!tiposVISPermitidos.includes(tipoVIS)) {
        errors.value.viviendaVIS =
            `Para la modalidad "Adquisición de Vivienda" debe seleccionar un tipo de VIS válido (no "Ninguna").`;
        valid = false;
      }
    }
  }

  if (!form.value.vivienda.ubicacion.trim()) {
    errors.value.viviendaUbicacion = "La ubicación es requerida";
    valid = false;
  }

  // ========================================================
  //  VALIDACIÓN: Porcentaje de Cuota Inicial según Tipo VIS
  // ========================================================
  const config = visConfig[form.value.vivienda.tipoVIS];
  const porcentaje = Number(form.value.vivienda.cuotaInicialPorcentaje) || 0;

  if (config) {
    if (config.mode === "range") {
      // Para VIS Priorizadas: Entre 1% y 3% (estricto)
      if (porcentaje < config.min || porcentaje > config.max) {
        errors.value.viviendaCuotaInicial =
            `Para "${tipoVIS}" el porcentaje de cuota inicial debe estar entre ${config.min}% y ${config.max}%`;
        valid = false;
      }
    } else if (config.mode === "minimum") {
      // Para VIS normales y "Ninguna": Mínimo X% pero puede ser más
      if (porcentaje < config.min) {
        errors.value.viviendaCuotaInicial =
            `Para "${tipoVIS}" el porcentaje de cuota inicial debe ser mínimo ${config.min}%`;
        valid = false;
      }
    }
  }

  return valid;
}

/* ===========================================================
   DNI solo números y 8 dígitos
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

  const config = visConfig[form.value.vivienda.tipoVIS];

  if (config?.mode === "range") {
    // Para rangos estrictos (VIS Priorizadas), limitar entre min y max
    if (porcentaje < config.min) porcentaje = config.min;
    if (porcentaje > config.max) porcentaje = config.max;
    form.value.vivienda.cuotaInicialPorcentaje = porcentaje;
  } else if (config?.mode === "minimum") {
    // Para mínimos, solo ajustar si es menor al mínimo permitido
    if (porcentaje < config.min && porcentaje !== 0) {
      porcentaje = config.min;
      form.value.vivienda.cuotaInicialPorcentaje = porcentaje;
    }
  }

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
   FILTRO DINÁMICO: Tipos VIS según Modalidad
   =========================================================== */
const tiposVISFiltrados = computed(() => {
  const modalidad = form.value.vivienda.modalidadVivienda;

  // Si no hay modalidad seleccionada, mostrar todos
  if (!modalidad) return tiposVIS;

  // Para Construcción en Sitio Propio y Mejoramiento de Vivienda
  if (modalidad === "Construcción en Sitio Propio" || modalidad === "Mejoramiento de Vivienda") {
    return tiposVIS.filter(vis => vis.value === "Ninguna");
  }

  // Para Adquisición de Vivienda
  if (modalidad === "Adquisición de Vivienda") {
    return tiposVIS.filter(vis => vis.value !== "Ninguna");
  }

  return tiposVIS;
});

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
      form.value.vivienda.modalidadVivienda = v.modalidad_vivienda;
      form.value.vivienda.valorVivienda = Number(v.valor_vivienda);
      form.value.vivienda.tipoVIS = v.tipo_vis;
      form.value.vivienda.ubicacion = v.ubicacion;

      // Recalcular cuota inicial según porcentaje VIS
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

/* Cuando cambia la modalidad, resetear tipo VIS si no es compatible */
watch(
    () => form.value.vivienda.modalidadVivienda,
    (nuevaModalidad) => {
      const tipoVISActual = form.value.vivienda.tipoVIS;

      // Si es Construcción o Mejoramiento y el tipo VIS no es "Ninguna"
      if ((nuevaModalidad === "Construcción en Sitio Propio" || nuevaModalidad === "Mejoramiento de Vivienda")) {
        if (tipoVISActual !== "Ninguna") {
          form.value.vivienda.tipoVIS = "Ninguna";
          form.value.vivienda.cuotaInicialPorcentaje = 0;
        }
        // Limpiar error de ingreso familiar cuando cambia a Construcción/Mejoramiento
        errors.value.ingresoFamiliar = "";
      }

      // Si es Adquisición y el tipo VIS es "Ninguna"
      if (nuevaModalidad === "Adquisición de Vivienda") {
        if (tipoVISActual === "Ninguna" || !tipoVISActual) {
          form.value.vivienda.tipoVIS = "";
        }
        // Limpiar error de ingreso familiar cuando cambia a Adquisición
        errors.value.ingresoFamiliar = "";
      }
    }
);

/* Cuando cambia el tipo de VIS, limpiar error de ingreso familiar */
watch(
    () => form.value.vivienda.tipoVIS,
    () => {
      // Limpiar error de ingreso familiar cuando cambia el tipo VIS
      errors.value.ingresoFamiliar = "";
    }
);

/* Cuando cambia el tipo de VIS, aplicamos regla */
watch(
    () => form.value.vivienda.tipoVIS,
    (nuevoTipo) => {
      const config = visConfig[nuevoTipo];

      if (!config) {
        porcentajeBloqueado.value = false;
        return;
      }

      // Todos los campos son editables ahora
      porcentajeBloqueado.value = false;

      if (config.mode === "range") {
        // Para VIS Priorizadas: establecer en el mínimo si está vacío
        if (!form.value.vivienda.cuotaInicialPorcentaje ||
            form.value.vivienda.cuotaInicialPorcentaje < config.min) {
          form.value.vivienda.cuotaInicialPorcentaje = config.min;
        }
      } else if (config.mode === "minimum") {
        // Para VIS normales: establecer en el mínimo si está vacío o es menor
        if (nuevoTipo === "Ninguna") {
          // Para "Ninguna" puede ser 0 o más
          if (!form.value.vivienda.cuotaInicialPorcentaje) {
            form.value.vivienda.cuotaInicialPorcentaje = 0;
          }
        } else {
          // Para otros con mínimo 3%
          if (!form.value.vivienda.cuotaInicialPorcentaje ||
              form.value.vivienda.cuotaInicialPorcentaje < config.min) {
            form.value.vivienda.cuotaInicialPorcentaje = config.min;
          }
        }
      }

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
          <InputText
              v-model="form.ingresoFamiliar"
              type="number"
              placeholder="0.00"
              :class="{ 'p-invalid': errors.ingresoFamiliar }"
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
              placeholder="XX"
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
          <InputText
              v-model="form.vivienda.valorVivienda"
              type="number"
              :class="{ 'p-invalid': errors.viviendaValor }"
              placeholder="0.00"
          />
          <small v-if="errors.viviendaValor" class="p-error">
            {{ errors.viviendaValor }}
          </small>
        </div>

        <!-- Modalidad -->
        <div class="col-12 md:col-6">
          <label class="form-label">Modalidad de Vivienda</label>
          <Dropdown
              v-model="form.vivienda.modalidadVivienda"
              :options="[
                'Adquisición de Vivienda',
                'Construcción en Sitio Propio',
                'Mejoramiento de Vivienda'
              ]"
              placeholder="Seleccionar modalidad..."
              class="w-full"
              :class="{ 'p-invalid': errors.viviendaModalidad }"
              appendTo="body"
          />
          <small v-if="errors.viviendaModalidad" class="p-error">
            {{ errors.viviendaModalidad }}
          </small>
        </div>

        <!-- Cuota inicial -->
        <div class="col-12 md:col-6">
          <label class="form-label">¿Cuánto dará de cuota inicial? (S/.)</label>
          <div class="cuota-input-group">
            <InputText
                v-model="form.vivienda.cuotaInicialPorcentaje"
                type="number"
                placeholder="%"
                class="cuota-percentage"
                :disabled="porcentajeBloqueado"
                @input="recalcularCuotaDesdePorcentaje"
            />
            <InputText
                v-model="form.vivienda.cuotaInicial"
                type="number"
                class="cuota-amount"
                :class="{ 'p-invalid': errors.viviendaCuotaInicial }"
                placeholder="0.00"
                @input="recalcularPorcentajeDesdeCuota"
            />
          </div>
          <small v-if="errors.viviendaCuotaInicial" class="p-error">
            {{ errors.viviendaCuotaInicial }}
          </small>
        </div>

        <!-- Tipo VIS -->
        <div class="col-12 md:col-6">
          <label class="form-label">Tipo de VIS</label>
          <Dropdown
              v-model="form.vivienda.tipoVIS"
              :options="tiposVISFiltrados"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar tipo de VIS..."
              appendTo="body"
              class="w-full"
              :class="{ 'p-invalid': errors.viviendaVIS }"
          />
          <small v-if="errors.viviendaVIS" class="p-error">
            {{ errors.viviendaVIS }}
          </small>
        </div>

        <!-- Ubicación -->
        <div class="col-12">
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
