// Axios
import { Chart, registerables } from 'chart.js'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AppRoutes } from './app/routing/AppRoutes'
/**
 * TIP: Replace this style import with rtl styles to enable rtl mode
 *
 * import './_metronic/assets/css/style.rtl.css'
 **/
// custom css start
import './_metronic/assets/css/style.css'
import './_metronic/assets/fonticon/fonticon.css'
import './_metronic/assets/keenicons/duotone/style.css'
import './_metronic/assets/keenicons/outline/style.css'
import './_metronic/assets/keenicons/solid/style.css'
import './_metronic/assets/sass/plugins.scss'
import './_metronic/assets/sass/style.react.scss'
// custom css end
import './_metronic/assets/sass/style.scss'
// GOMZI enterprise workspace theme (visual-only layer, loaded last)
import './_metronic/assets/sass/gomzi-theme.scss'
// Apps
import { MetronicI18nProvider } from './_metronic/i18n/Metronici18n'
/**
 * Creates `axios-mock-adapter` instance for provided `axios` instance, add
 * basic Metronic mocks and returns it.
 *
 * @see https://github.com/ctimmerm/axios-mock-adapter
 */
/**
 * Inject Metronic interceptors for axios.
 *
 * @see https://github.com/axios/axios#interceptors
 */
Chart.register(...registerables)

// Prevent number input from changing value on scroll
document.addEventListener('wheel', function (event) {
	if (
		document.activeElement instanceof HTMLInputElement &&
		document.activeElement.type === 'number'
	) {
		;(document.activeElement as HTMLInputElement).blur()
	}
})

const queryClient = new QueryClient()
const container = document.getElementById('root')
if (container) {
	createRoot(container).render(
		<QueryClientProvider client={queryClient}>
			<MetronicI18nProvider>
				<AppRoutes />
			</MetronicI18nProvider>
		</QueryClientProvider>
	)
}
