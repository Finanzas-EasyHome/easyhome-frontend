<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useSimulador } from '../composables/useSimulador.js';
import { SimuladorRepositoryImpl } from '../../infrastructure/repositories/SimuladorRepositoryImpl.js';

const props = defineProps({
  visible: Boolean,
  costos: Object
});
const errors = ref({
  seguroDesgravamen: "",
  seguroInmueble: "",
  tasacion: "",
  gastosNotariales: "",
  gastosRegistrales: "",
  cargosAdministrativos: ""
});

const emit = defineEmits(['update:visible', 'guardar']);
const hasErrors = computed(() =>
    Object.values(errors.value).some(e => e !== "")
);

// ----- usamos un solo repositorio -----
const repository = new SimuladorRepositoryImpl();

// ----- usamos un solo composable -----
const { fetchEntidadesFinancieras, entidadesFinancieras } = useSimulador();

// Opciones del dropdown
const entidadesOptions = computed(() => entidadesFinancieras.value);

// Formulario
const formData = ref({
  entidadFinanciera: '',
  seguroDesgravamen: 0,
  tasacion: 0,
  seguroInmueble: 0,
  gastosNotariales: 0,
  comisionDesembolso: 0,
  cargosAdministrativos: 0,
  gastosRegistrales: 0,
});

const loading = ref(false);
const rangos = ref({});

// Cuando se abre el modal → cargar entidades
onMounted(async () => {
  await fetchEntidadesFinancieras();
});

// Copiar datos iniciales cuando visible cambia
watch(() => props.visible, (open) => {
  if (open && props.costos) {
    formData.value = { ...props.costos };
  }
});

// Cuando cambia la entidad financiera → jalar costos de Supabase
watch(() => formData.value.entidadFinanciera, async (entidadId) => {
  if (!entidadId) return;

  try {
    loading.value = true;

    // Obtener costos desde el repo
    const costos = await repository.getCostosEntidad(entidadId);

    // Guardar rangos completos
    rangos.value = {
      seguroDesgravamen: costos.seguroDesgravamen,
      seguroInmueble: costos.seguroInmueble,
      tasacion: costos.tasacion,
      gastosNotariales: costos.gastosNotariales,
      cargosAdministrativos: costos.cargosAdministrativos,
      gastosRegistrales: costos.gastosRegistrales

    };
    // ⚡ Opción A: asignar SIEMPRE valor mínimo permitido
    formData.value.seguroDesgravamen = costos.seguroDesgravamen.min * 100;
    formData.value.tasacion = costos.tasacion.min;
    formData.value.seguroInmueble = costos.seguroInmueble.min* 100;
    formData.value.gastosNotariales = costos.gastosNotariales.min;
    formData.value.cargosAdministrativos = costos.cargosAdministrativos.min;
    formData.value.gastosRegistrales = costos.gastosRegistrales.min;
    formData.value.comisionDesembolso = costos.comisionDesembolso;

  } catch (error) {
    console.error("Error cargando costos:", error);
  } finally {
    loading.value = false;
  }
});
// Auto-validar que los valores estén dentro del rango permitido
watch(formData, (nuevo) => {
  if (!rangos.value.seguroDesgravamen) return;

  const validar = (campo, valor, min, max, tipo = "monto") => {
    valor = Number(valor);
    min = Number(min);
    max = Number(max);

    if (valor < min) {
      errors.value[campo] =
          tipo === "porcentaje"
              ? `El valor mínimo permitido es ${(min).toFixed(3)}%`
              : `El valor mínimo permitido es S/ ${min.toFixed(2)}`;
      return min;
    }

    if (valor > max) {
      errors.value[campo] =
          tipo === "porcentaje"
              ? `El valor máximo permitido es ${(max).toFixed(3)}%`
              : `El valor máximo permitido es S/ ${max.toFixed(2)}`;
      return max;
    }

    errors.value[campo] = "";
    return valor;
  };


  nuevo.seguroDesgravamen = validar(
      "seguroDesgravamen",
      nuevo.seguroDesgravamen,
      rangos.value.seguroDesgravamen.min* 100,
      rangos.value.seguroDesgravamen.max* 100,
      "porcentaje"
  );

  nuevo.seguroInmueble = validar(
      "seguroInmueble",
      nuevo.seguroInmueble,
      rangos.value.seguroInmueble.min* 100,
      rangos.value.seguroInmueble.max* 100,
      "porcentaje"
  );

  nuevo.tasacion = validar(
      "tasacion",
      nuevo.tasacion,
      rangos.value.tasacion.min,
      rangos.value.tasacion.max,
      "monto"
  );

  nuevo.gastosNotariales = validar(
      "gastosNotariales",
      nuevo.gastosNotariales,
      rangos.value.gastosNotariales.min,
      rangos.value.gastosNotariales.max,
      "monto"
  );
  nuevo.cargosAdministrativos = validar(
      "cargosAdministrativos",
      nuevo.cargosAdministrativos,
      rangos.value.cargosAdministrativos.min,
      rangos.value.cargosAdministrativos.max,
      "monto"
  );

  nuevo.gastosRegistrales = validar(
      "gastosRegistrales",
      nuevo.gastosRegistrales,
      rangos.value.gastosRegistrales.min,
      rangos.value.gastosRegistrales.max,
      "monto"
  );
}, { deep: true });


// ============================================
// FUNCIÓN handleGuardar - Con Debug
// ============================================
const handleGuardar = () => {
  const payload = { ...formData.value };

  console.log("📦 PAYLOAD ANTES DE CONVERTIR:", {
    seguroDesgravamen: payload.seguroDesgravamen,
    seguroInmueble: payload.seguroInmueble,
    cargosAdministrativos: payload.cargosAdministrativos,
    tasacion: payload.tasacion,
    gastosNotariales: payload.gastosNotariales,
    gastosRegistrales: payload.gastosRegistrales,
    comisionDesembolso: payload.comisionDesembolso
  });

  // ✅ Convertir solo los PORCENTAJES de vuelta a decimal
  payload.seguroDesgravamen = payload.seguroDesgravamen / 100;
  payload.seguroInmueble = payload.seguroInmueble / 100;

  // ✅ Los montos (S/) quedan igual
  // - cargosAdministrativos
  // - tasacion
  // - gastosNotariales
  // - gastosRegistrales
  // - comisionDesembolso

  console.log("📦 PAYLOAD DESPUÉS DE CONVERTIR:", {
    seguroDesgravamen: payload.seguroDesgravamen,
    seguroInmueble: payload.seguroInmueble,
    cargosAdministrativos: payload.cargosAdministrativos,
    tasacion: payload.tasacion,
    gastosNotariales: payload.gastosNotariales,
    gastosRegistrales: payload.gastosRegistrales,
    comisionDesembolso: payload.comisionDesembolso
  });

  emit("guardar", payload);
  emit("update:visible", false);
};

// ============================================
// WATCH para cargar costos de entidad
// ============================================
watch(() => formData.value.entidadFinanciera, async (entidadId) => {
  if (!entidadId) return;

  try {
    loading.value = true;

    // Obtener costos desde el repo
    const costos = await repository.getCostosEntidad(entidadId);

    console.log("✅ COSTOS DESDE SUPABASE:", costos);

    // Guardar rangos completos
    rangos.value = {
      seguroDesgravamen: costos.seguroDesgravamen,
      seguroInmueble: costos.seguroInmueble,
      tasacion: costos.tasacion,
      gastosNotariales: costos.gastosNotariales,
      cargosAdministrativos: costos.cargosAdministrativos,
      gastosRegistrales: costos.gastosRegistrales
    };

    // ⚡ Asignar valores mínimos
    // PORCENTAJES: multiplicar * 100 para mostrar en el input
    formData.value.seguroDesgravamen = costos.seguroDesgravamen.min * 100;
    formData.value.seguroInmueble = costos.seguroInmueble.min * 100;

    // MONTOS: asignar directamente
    formData.value.tasacion = costos.tasacion.min;
    formData.value.gastosNotariales = costos.gastosNotariales.min;
    formData.value.cargosAdministrativos = costos.cargosAdministrativos.min;
    formData.value.gastosRegistrales = costos.gastosRegistrales.min;
    formData.value.comisionDesembolso = costos.comisionDesembolso;

    console.log("📝 FORM DATA DESPUÉS DE CARGAR:", {
      seguroDesgravamen: formData.value.seguroDesgravamen,
      seguroInmueble: formData.value.seguroInmueble,
      cargosAdministrativos: formData.value.cargosAdministrativos,
      tasacion: formData.value.tasacion,
      gastosNotariales: formData.value.gastosNotariales,
      gastosRegistrales: formData.value.gastosRegistrales,
      comisionDesembolso: formData.value.comisionDesembolso
    });

  } catch (error) {
    console.error("❌ Error cargando costos:", error);
  } finally {
    loading.value = false;
  }
});
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
      <div v-if="loading" class="loading-overlay">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p class="text-secondary mt-2">Cargando costos...</p>
      </div>

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
                :disabled="loading"
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
                :minFractionDigits="4"
                :maxFractionDigits="4"
                class="w-full"
                placeholder="0.00"
                :disabled="loading"
            />
            <small v-if="errors.seguroDesgravamen" class="error">
              {{ errors.seguroDesgravamen }}
            </small>
            <small class="rango-info">
              Rango permitido: {{ (rangos.seguroDesgravamen?.min * 100).toFixed(3) }}% -
              {{ (rangos.seguroDesgravamen?.max * 100).toFixed(3) }}%
            </small>
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
                :disabled="loading"
            />
            <small v-if="errors.tasacion" class="error">
              {{ errors.tasacion }}
            </small>
            <small class="rango-info">
              Rango permitido:
              S/ {{ rangos.tasacion?.min?.toFixed(2) }} -
              S/ {{ rangos.tasacion?.max?.toFixed(2) }}
            </small>
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
                :maxFractionDigits="4"
                class="w-full"
                placeholder="0.00"
                :disabled="loading"
            />
            <small v-if="errors.seguroInmueble" class="error">
              {{ errors.seguroInmueble }}
            </small>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="field">
            <label for="notariales">Gastos notariales </label>
            <InputNumber
                id="notariales"
                v-model="formData.gastosNotariales"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
                :disabled="loading"
            />
            <small v-if="errors.gastosNotariales" class="error">
              {{ errors.gastosNotariales }}
            </small>
            <small class="rango-info">
              Rango permitido:
              S/ {{ rangos.gastosNotariales?.min?.toFixed(2) }} -
              S/ {{ rangos.gastosNotariales?.max?.toFixed(2) }}
            </small>
          </div>
        </div>


        <div class="col-12 md:col-6">
          <div class="field">
            <label for="cargosAdmin">Cargos administrativos</label>
            <InputNumber
                id="cargosAdmin"
                v-model="formData.cargosAdministrativos"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
                :disabled="loading"
            />
            <small v-if="errors.cargosAdministrativos" class="error">
              {{ errors.cargosAdministrativos }}
            </small>
            <small class="rango-info">
              Rango permitido:
              S/ {{ rangos.cargosAdministrativos?.min?.toFixed(2) }} -
              S/ {{ rangos.cargosAdministrativos?.max?.toFixed(2) }}
            </small>
          </div>
        </div>

        <!-- Gastos registrales -->
        <div class="col-12 md:col-6">
          <div class="field">
            <label for="gastosRegistrales">Gastos registrales</label>
            <InputNumber
                id="gastosRegistrales"
                v-model="formData.gastosRegistrales"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
                :disabled="loading"
            />
            <small v-if="errors.gastosRegistrales" class="error">
              {{ errors.gastosRegistrales }}
            </small>
            <small class="rango-info">
              Rango permitido:
              S/ {{ rangos.gastosRegistrales?.min?.toFixed(2) }} -
              S/ {{ rangos.gastosRegistrales?.max?.toFixed(2) }}
            </small>
          </div>
        </div>

        <!-- Comisión por desembolso -->
        <div class="col-12">
          <div class="field">
            <label for="comision">Comisión por Envio</label>
            <InputNumber
                id="comision"
                v-model="formData.comisionDesembolso"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                :minFractionDigits="2"
                class="w-full"
                placeholder="0.00"
                :disabled="loading"
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
            :disabled="loading"
        />
        <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-success"
            @click="handleGuardar"
            :disabled="loading || hasErrors"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.costos-form {
  padding: 0.5rem 0;
  position: relative;
}
.error {
  color: #dc2626; /* rojo bonito */
  font-size: 0.75rem;
  margin-top: 4px;
  display: block;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
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