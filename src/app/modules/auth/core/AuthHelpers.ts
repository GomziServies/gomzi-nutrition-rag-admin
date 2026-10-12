const AUTH_LOCAL_STORAGE_KEY = 'auth_fwg' && 'auth_fg_group'

const getAuth = (): string | null | undefined => {
	if (!localStorage) {
		return null
	}

	const lsValue: string | null = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY)
	if (!lsValue) {
		return null
	}

	try {
		const auth: string = lsValue
		if (auth) {
			return auth
		}
	} catch (error) {
		console.error('AUTH LOCAL STORAGE PARSE ERROR', error)
	}
}

const setAuth = (auth: string | null | undefined | object) => {
	if (!localStorage) {
		return
	}

	try {
		if (typeof auth === 'undefined' || auth === null) {
			return localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY)
		}
		if (typeof auth === 'object') {
			auth = JSON.stringify(auth)
		}

		const lsValue = auth
		localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, lsValue)
	} catch (error) {
		console.error('AUTH LOCAL STORAGE SAVE ERROR', error)
	}
}

const removeAuth = () => {
	if (!localStorage) {
		return
	}

	try {
		localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY)
	} catch (error) {
		console.error('AUTH LOCAL STORAGE REMOVE ERROR', error)
	}
}

export { getAuth, setAuth, removeAuth, AUTH_LOCAL_STORAGE_KEY }
