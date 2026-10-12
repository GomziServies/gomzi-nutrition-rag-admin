import { createContext, Dispatch, FC, SetStateAction, useContext, useEffect, useState } from 'react'
import { WithChildren } from '../../../../_metronic/helpers'
import { LayoutSplashScreen } from '../../../../_metronic/layout/core'
import * as authHelper from './AuthHelpers'
import { UserModel } from './_models'

type AuthContextProps = {
	auth: string | undefined | null
	saveAuth: (auth: string | null | undefined) => void
	currentUser: UserModel | undefined
	setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>
	logout: () => void
}

const initAuthContextPropsState: AuthContextProps = {
	auth: authHelper.getAuth(),
	saveAuth: () => {},
	currentUser: undefined,
	setCurrentUser: () => {},
	logout: () => {},
}

const AuthContext = createContext<AuthContextProps>(initAuthContextPropsState)

const useAuth = () => {
	return useContext(AuthContext)
}

const AuthProvider: FC<WithChildren> = ({ children }) => {
	const [auth, setAuth] = useState<string | undefined | null>(authHelper.getAuth())
	const [currentUser, setCurrentUser] = useState<UserModel | undefined>()

	const saveAuth = (auth: string | null | undefined) => {
		setAuth(auth)
		if (auth) {
			authHelper.setAuth(auth)
		} else {
			authHelper.removeAuth()
		}
	}

	const logout = () => {
		setAuth(null)
		setCurrentUser(undefined)
		authHelper.removeAuth()
		localStorage.clear()
	}

	return (
		<AuthContext.Provider value={{ auth, saveAuth, currentUser, setCurrentUser, logout }}>
			{children}
		</AuthContext.Provider>
	)
}

const AuthInit: FC<WithChildren> = ({ children }) => {
	const { auth, logout } = useAuth()
	const [showSplashScreen, setShowSplashScreen] = useState(true)

	useEffect(() => {
		if (!auth) {
			logout()
			setShowSplashScreen(false)
		} else {
			setTimeout(() => {
				setShowSplashScreen(false)
			}, 1000)
		}
	}, [auth, logout])

	return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>
}

export { AuthInit, AuthProvider, useAuth }
