import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')

	return {
		plugins: [react()],
		resolve: {
			alias: [
				{ find: /^~/, replacement: '' },
				{ find: '@', replacement: path.resolve(process.cwd(), 'src') },
			],
		},
		server: {
			port: 3000,
			host: true,
			open: false,
		},
		preview: {
			port: 3000,
			host: true,
		},
		build: {
			outDir: 'build',
			chunkSizeWarningLimit: 8500,
			rollupOptions: {
				onwarn(warning, warn) {
					if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return
					warn(warning)
				},
				output: {
					manualChunks(id) {
						if (id.includes('node_modules')) {
							if (id.includes('xlsx')) return 'vendor-xlsx'
							if (id.includes('apexcharts') || id.includes('chart.js')) return 'vendor-charts'
							if (id.includes('@fortawesome')) return 'vendor-fontawesome'
							if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui'
							if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html2pdf')) return 'vendor-pdf'
							if (
								id.includes('react') ||
								id.includes('react-dom') ||
								id.includes('react-router-dom') ||
								id.includes('react-query') ||
								id.includes('redux')
							) {
								return 'vendor-react-core'
							}
							if (id.includes('bootstrap') || id.includes('react-bootstrap') || id.includes('@popperjs')) {
								return 'vendor-bootstrap'
							}
							if (id.includes('rsuite')) return 'vendor-rsuite'
							return 'vendor-libs'
						}
					},
				},
			},
		},
		define: {
			global: 'window',
			'process.env.NODE_ENV': JSON.stringify(mode),
			'process.env.PUBLIC_URL': JSON.stringify(''),
			'process.env.REACT_APP_NODE_ENV': JSON.stringify(env.REACT_APP_NODE_ENV || (mode === 'production' ? 'production' : 'development')),
			'process.env.REACT_API_BASE_URL': JSON.stringify(env.REACT_API_BASE_URL || ''),
			'process.env.REACT_APP_ADAJAN_BRANCH_API': JSON.stringify(env.REACT_APP_ADAJAN_BRANCH_API || ''),
			'process.env.REACT_APP_I18N_CONFIG_KEY': JSON.stringify(env.REACT_APP_I18N_CONFIG_KEY || 'i18nConfig'),
			'process.env': JSON.stringify(env),
		},
		css: {
			preprocessorOptions: {
				scss: {
					silenceDeprecations: [
						'legacy-js-api',
						'import',
						'global-builtin',
						'color-functions',
						'if-function',
					],
					quietDeps: true,
				},
			},
		},
	}
})
