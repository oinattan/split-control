import axios from 'axios';
// ImportSentry: tenta importar Sentry apenas se estiver disponível no build
let Sentry;
let BrowserTracing;
try {
	// essas libs podem não estar instaladas em alguns ambientes de dev
	// usamos import dinamico para evitar quebrar o build quando ausentes
	// eslint-disable-next-line no-undef
	Sentry = require('@sentry/react');
	BrowserTracing = require('@sentry/tracing').BrowserTracing;
} catch (e) {
	// silencioso — Sentry não é crítico para o funcionamento da aplicação
	Sentry = null;
	BrowserTracing = null;
}

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Configurar header CSRF automaticamente lendo a meta tag gerada pelo Blade
const tokenMeta = document.querySelector('meta[name="csrf-token"]');
if (tokenMeta) {
	window.axios.defaults.headers.common['X-CSRF-TOKEN'] = tokenMeta.getAttribute('content');
}

// Inicializa Sentry se DSN estiver presente (defina VITE_SENTRY_DSN em ambiente)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN || import.meta.env.MIX_SENTRY_DSN;
const release = import.meta.env.VITE_APP_VERSION || import.meta.env.APP_VERSION || import.meta.env.VITE_APP_NAME || 'local';
if (sentryDsn && Sentry && BrowserTracing) {
	Sentry.init({
		dsn: sentryDsn,
		integrations: [new BrowserTracing()],
		tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_RATE || '0') || 0,
		release,
	});
}

export const appVersion = release;
