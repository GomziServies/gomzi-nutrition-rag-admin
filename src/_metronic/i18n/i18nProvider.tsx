import '@formatjs/intl-relativetimeformat/locale-data/de'
import '@formatjs/intl-relativetimeformat/locale-data/en'
import '@formatjs/intl-relativetimeformat/locale-data/es'
import '@formatjs/intl-relativetimeformat/locale-data/fr'
import '@formatjs/intl-relativetimeformat/locale-data/ja'
import '@formatjs/intl-relativetimeformat/locale-data/zh'
import '@formatjs/intl-relativetimeformat/polyfill'
import { FC } from 'react'
import { IntlProvider } from 'react-intl'
import { WithChildren } from '../helpers'
import deMessages from './messages/de.json'
import enMessages from './messages/en.json'
import esMessages from './messages/es.json'
import frMessages from './messages/fr.json'
import jaMessages from './messages/ja.json'
import zhMessages from './messages/zh.json'
import { useLang } from './Metronici18n'

const allMessages = {
	de: deMessages,
	en: enMessages,
	es: esMessages,
	fr: frMessages,
	ja: jaMessages,
	zh: zhMessages,
}

const I18nProvider: FC<WithChildren> = ({ children }) => {
	const locale = useLang()
	const messages = allMessages[locale]

	return (
		<IntlProvider
			locale={locale}
			messages={messages}>
			{children}
		</IntlProvider>
	)
}

export { I18nProvider }
