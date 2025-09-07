/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import router from '@/router'
import { createPinia } from 'pinia'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Stores
import { useAuthStore } from './stores/auth'

// Iconos - Configuración crucial para Vuetify
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Styles
import 'unfonts.css'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

async function bootstrap() {
    const app = createApp(App)
    
    // 1. Inicializamos y usamos Pinia primero, para que el store esté disponible.
    const pinia = createPinia()
    app.use(pinia)

    // 2. Obtenemos la referencia a nuestra tienda de autenticación.
    const authStore = useAuthStore()

    // 3. Esperamos a que el estado de autenticación esté completamente listo.
    await authStore.init()

    // 4. Solo después de que el store esté listo, inicializamos y usamos el router.
    app.use(router)

    // 5. Esperamos a que el router termine su navegación inicial.
    // Esto es crucial para que el guardián de ruta se ejecute antes de montar la aplicación.
    await router.isReady()

    // 6. Inicializamos y usamos Vuetify, incluyendo la configuración de los iconos.
    const vuetify = createVuetify({
        components,
        directives,
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: {
                mdi,
            },
        },
    })
    app.use(vuetify)

    // 7. Montamos la aplicación.
    app.mount('#app')
}

bootstrap()
