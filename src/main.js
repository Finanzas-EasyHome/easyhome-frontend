import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import axios from 'axios';

import App from './App.vue';
import router from './router/index.js';

// PrimeVue Components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import Paginator from 'primevue/paginator';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import ProgressSpinner from 'primevue/progressspinner';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import Toolbar from 'primevue/toolbar';
import Tooltip from 'primevue/tooltip';

// PrimeVue Styles
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// Custom Styles
import '/src/style.css';
import {Checkbox, InputGroup, InputGroupAddon} from "primevue";

baseUrl: import.meta.env.VITE_API_BASE_URL;
// Axios Configuration
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Axios Interceptors
axios.interceptors.request.use(
    (config) => {
        // Aquí puedes agregar tokens de autenticación
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Redirigir al login si no está autenticado
            localStorage.removeItem('token');
            router.push('/login');
        }
        return Promise.reject(error);
    }
);

// Create Vue App
const app = createApp(App);
const pinia = createPinia();

// Use Plugins
app.use(pinia);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: false,
            cssLayer: false
        }
    },
    ripple: true,
    locale: {
        startsWith: 'Comienza con',
        contains: 'Contiene',
        notContains: 'No contiene',
        endsWith: 'Termina con',
        equals: 'Igual a',
        notEquals: 'Diferente de',
        noFilter: 'Sin filtro',
        lt: 'Menor que',
        lte: 'Menor o igual que',
        gt: 'Mayor que',
        gte: 'Mayor o igual que',
        dateIs: 'Fecha es',
        dateIsNot: 'Fecha no es',
        dateBefore: 'Fecha antes de',
        dateAfter: 'Fecha después de',
        clear: 'Limpiar',
        apply: 'Aplicar',
        matchAll: 'Coincidir todo',
        matchAny: 'Coincidir cualquiera',
        addRule: 'Agregar regla',
        removeRule: 'Eliminar regla',
        accept: 'Sí',
        reject: 'No',
        choose: 'Elegir',
        upload: 'Subir',
        cancel: 'Cancelar',
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        today: 'Hoy',
        weekHeader: 'Sem',
        firstDayOfWeek: 0,
        dateFormat: 'dd/mm/yy',
        weak: 'Débil',
        medium: 'Medio',
        strong: 'Fuerte',
        passwordPrompt: 'Ingrese una contraseña',
        emptyFilterMessage: 'No se encontraron resultados',
        emptyMessage: 'No hay opciones disponibles'
    }
});
app.use(ToastService);
app.use(ConfirmationService);

// Global Properties
app.config.globalProperties.$axios = axios;

// Register Global Components
app.component('Button', Button);
app.component('InputText', InputText);
app.component('InputGroup',InputGroup);
app.component('InputGroupAddon',InputGroupAddon);
app.component('InputNumber', InputNumber);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Dialog', Dialog);
app.component('Dropdown', Dropdown);
app.component('Toast', Toast);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Paginator', Paginator);
app.component('Calendar', Calendar);
app.component('Textarea', Textarea);
app.component('ProgressSpinner', ProgressSpinner);
app.component('Card', Card);
app.component('Divider', Divider);
app.component('Toolbar', Toolbar);
app.component('Checkbox', Checkbox);
app.directive('tooltip', Tooltip);

// Mount App
app.mount('#app');