import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import axios from 'axios';

// 🔥 CORRECTO: ESTE ES EL ARCHIVO VERDADERO
import { useAuthStore } from '/src/modules/iam/services/authStore.js';

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
import { Checkbox, InputGroup, InputGroupAddon, RadioButton } from "primevue";


// ===============================
// CREATE APP
// ===============================
const app = createApp(App);

// ===============================
// PINIA (debe estar antes del AuthStore)
// ===============================
const pinia = createPinia();
app.use(pinia);

// ===============================
// 🔥 AHORA SÍ: cargar authStore DESPUÉS de instalar Pinia
// ===============================
const authStore = useAuthStore();
await authStore.initAuth();


// ===============================
// AXIOS
// ===============================
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
        }
        return Promise.reject(error);
    }
);


// ===============================
// PRIMEVUE
// ===============================
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
});

app.use(ToastService);
app.use(ConfirmationService);


// ===============================
// COMPONENTES GLOBALES
// ===============================
app.component('Button', Button);
app.component('InputText', InputText);
app.component('InputGroup', InputGroup);
app.component('InputGroupAddon', InputGroupAddon);
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
app.component('RadioButton', RadioButton);
app.directive('tooltip', Tooltip);


// ===============================
// ROUTER
// ===============================
app.use(router);

// ===============================
// MOUNT
// ===============================
app.mount('#app');