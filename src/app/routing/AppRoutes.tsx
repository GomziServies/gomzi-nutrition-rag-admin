import { FC, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { App } from '../App'
import { AuthPage, Logout } from '../modules/auth'
import * as OAuthCallbacks from '../modules/oAuthCallbacks'
import { EmployeeAuthPage } from '../pages/employee/components/AuthPage'
import { PortalAuthPage } from '../pages/fwg/auth/AuthPage'
import { VesuMasterAuthPage } from '../pages/fwg/vesu-auth/AuthPage'
import { GomziMedicalDoctorAuthPage } from '../pages/gomzi-medical/doctor/auth/AuthPage'
import { GomziMedicalPharmacyAuthPage } from '../pages/gomzi-medical/pharmacy/auth/AuthPage'
import { TrainerAuthPage } from '../pages/gomzi-nutrition-trainer/auth/AuthPage'
import { NutritionAuthPage } from '../pages/gomzi-nutrition/auth/AuthPage'
import { GomziNutritionLoginAuthPage } from '../pages/gomzi-nutrition/nutrition-login/AuthPage'
import { MasterAuthPage } from '../pages/master/auth/AuthPage'
import { AccountPrivateRoutes } from './AccountPrivateRoutes'
import AdajanBranchPrivateRoutes from './AdajanBranchPrivateRoutes'
import { AutomationPrivateRoutes } from './AutomationPrivateRoutes'
import { EmployeePrivateRoutes } from './EmployeePrivateRoutes'
import { FWGPrivateRoutes } from './FWGPrivateRoutes'
import { FgiitPrivateRoutes } from './FgiitPrivateRoutes'
import { FgiitTeleSalesPrivateRoutes } from './FgiitTeleSalesPrivateRoutes'
import { FwgTeleSalesPrivateRoutes } from './FwgTeleSalesPrivateRoutes'
import { GCSPrivateRoutes } from './GCSPrivateRoutes'
import GlsInvestorPrivateRoutes from './GlsInvestorPrivateRoutes'
import { GomziMedicalDoctorPrivateRoutes } from './GomziMedicalDoctorPrivateRoutes'
import { GomziMedicalPharmacyPrivateRoutes } from './GomziMedicalPharmacyPrivateRoutes'
import { GomziMedicalPrivateRoutes } from './GomziMedicalPrivateRoutes'
import { GomziNutritionPrivateRoutes } from './GomziNutritionPrivateRoutes'
import { GomziNutritionTeleSalesPrivateRoutes } from './GomziNutritionTeleSalesPrivateRoutes'
import { HelixPrivateRoutes } from './HelixPrivateRoutes'
import { HRPrivateRoutes } from './HRPrivateRoutes'
import InvestorPrivateRoutes from './InvestorPrivateRoutes'
import { MasterPrivateRoutes } from './MasterPrivateRoutes'
import { MatricesPrivateRoute } from './MatricesPrivateRoute'
import { TrainerPrivateRoutes } from './TrainerPrivateRoutes'

const { PUBLIC_URL } = process.env

const AppRoutes: FC = () => {
	const [gomziNutritionToken, setGomziNutritionToken] = useState<string | null>(() =>
		localStorage.getItem('auth_fg_group')
	)
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
		() => !!localStorage.getItem('auth_fg_group')
	)
	const adminType = localStorage.getItem('admin_type')
	const admin = localStorage.getItem('admin')

	useEffect(() => {
		const Gomzi_Nutrition_Token = localStorage.getItem('auth_fg_group')
		const fgiit_Token = localStorage.getItem('auth_fg_group')

		setGomziNutritionToken(Gomzi_Nutrition_Token)
		// Check if the auth_fg_group token is available
		if (fgiit_Token) {
			setIsAuthenticated(true)
		}
	}, [])

	useEffect(() => {
		redirectDashboard()
		redirectLoginToUrl()
	}, [])

	const redirectLoginToUrl = () => {
		const admin: any = localStorage.getItem('admin')
		let currentUrl = window.location.pathname
		const isLoginPage = currentUrl.includes('login')
		if (!admin && !isLoginPage) {
			localStorage.setItem('searchedURL', currentUrl)
		}
	}

	const redirectDashboard = () => {
		const adminType = localStorage.getItem('admin_type')
		const admin = localStorage.getItem('admin')
		let currentUrl = window.location.pathname
		let extractedText = currentUrl.split('/')[1]
		const isLoginPage = currentUrl.includes('login')

		const isEmployee = localStorage.getItem('is_employee_login') === 'true'
		let hasMasterAccess = false
		// Block Automation users from accessing any non-automation route
		if (admin === 'Automation' && !isLoginPage) {
			const isAutomationRoute =
				extractedText === 'automation' || extractedText === 'tele' || extractedText === 'error'
			if (!isAutomationRoute) {
				window.location.href = '/automation/broadcast/list'
				return
			}
		}

		const searchedURL = localStorage.getItem('searchedURL')
		if (admin && searchedURL) {
			window.location.href = searchedURL
			localStorage.removeItem('searchedURL')
		}

		if (admin === 'GLS_Investor' && !isLoginPage) {
			if (extractedText !== 'gls-investor') {
				window.location.href = '/gls-investor/dashboard'
				return
			}
		}

		if (admin && !isLoginPage) {
			if (admin === 'Adajan-Branch' && extractedText !== 'adajan-branch' && !isLoginPage) {
				window.location.href = '/adajan-branch/dashboard'
				return
			}
			if (admin === 'Account' && extractedText !== 'account' && !isLoginPage) {
				window.location.href = '/account/dashboard'
				return
			}
			if (admin === 'Gomzi_Nutrition_Login' && extractedText !== 'nutrition' && !isLoginPage) {
				window.location.href = '/rag/dashboard'
				return
			}
			if (admin === 'Matrices' && extractedText !== 'matrices' && !isLoginPage) {
				window.location.href = '/matrices/gls-report'
				return
			}

			if (
				extractedText === 'master' &&
				admin !== 'Master' &&
				admin !== 'Employee' &&
				admin !== 'Adajan-Branch' &&
				admin !== 'Store' &&
				admin !== 'Investor' &&
				admin !== 'GLS_Investor' &&
				admin !== 'HR' &&
				admin !== 'Matrices'
			) {
				localStorage.setItem('admin', 'Master')
				window.location.href = currentUrl
			} else if (
				extractedText === 'master' &&
				(admin === 'Employee' ||
					admin === 'Adajan-Branch' ||
					admin === 'Investor' ||
					admin === 'GLS_Investor' ||
					admin === 'HR')
			) {
				window.location.href =
					admin === 'Employee'
						? '/employee/dashboard'
						: admin === 'Investor'
						? '/gls-investor/dashboard'
						: admin === 'GLS_Investor'
						? '/gls-investor/dashboard'
						: admin === 'HR'
						? '/hr/dashboard'
						: '/adajan-branch/dashboard'
			} else if (extractedText === 'master' && !hasMasterAccess) {
				window.location.href = '/fgiit/dashboard'
			}
			if (
				extractedText === 'nutrition' &&
				admin !== 'Gomzi_Nutrition' &&
				admin !== 'Employee' &&
				admin !== 'Adajan-Branch' &&
				admin !== 'Store' &&
				admin !== 'Investor' &&
				admin !== 'GLS_Investor' &&
				admin !== 'HR' &&
				admin !== 'Matrices' &&
				admin !== 'Gomzi_Nutrition_Login'
			) {
				localStorage.setItem('admin', 'Gomzi_Nutrition')
				window.location.href = currentUrl
			}
			if ((extractedText === 'tele' || extractedText === 'automation') && admin !== 'Automation') {
				localStorage.setItem('admin', 'Automation')
				window.location.href = currentUrl
			}
			if (
				extractedText === 'hr' &&
				admin !== 'HR' &&
				admin !== 'Employee' &&
				admin !== 'Adajan-Branch' &&
				admin !== 'Store' &&
				admin !== 'Investor' &&
				admin !== 'GLS_Investor' &&
				admin !== 'Matrices'
			) {
				localStorage.setItem('admin', 'HR')
				window.location.href = currentUrl
			} else if (
				extractedText === 'hr' &&
				(admin === 'Employee' ||
					admin === 'Adajan-Branch' ||
					admin === 'Investor' ||
					admin === 'GLS_Investor')
			) {
				window.location.href =
					admin === 'Employee'
						? '/employee/dashboard'
						: admin === 'Investor'
						? '/gls-investor/dashboard'
						: admin === 'GLS_Investor'
						? '/gls-investor/dashboard'
						: '/adajan-branch/dashboard'
			}

			if (
				extractedText === 'gn-tele-sales' &&
				admin !== 'Gomzi_Nutrition_Tele_Sales' &&
				admin !== 'Fgiit_Tele_Sales' &&
				admin !== 'Fwg_Tele_Sales' &&
				admin !== 'Employee' &&
				admin !== 'Store'
			) {
				localStorage.setItem('admin', 'Gomzi_Nutrition_Tele_Sales')
				window.location.href = currentUrl
				return
			}

			if (currentUrl == '/master/login' && adminType) {
				return (window.location.href = '/rag/dashboard')
			}
			if (currentUrl == '/rag/login' && adminType && admin == 'Gomzi_Nutrition_Login') {
				return (window.location.href = '/rag/dashboard')
			}
			if (currentUrl == '/trainer/login' && adminType && admin == 'Trainer') {
				return (window.location.href = '/trainer/dashboard')
			}
		}
	}

	return (
		<BrowserRouter basename={PUBLIC_URL}>
			<Routes>
				<Route element={<App />}>
					<Route
						path='auth/facebook/callback'
						element={<OAuthCallbacks.FacebookOAuthCallback />}
					/>
					<Route
						path='logout'
						element={<Logout />}
					/>

					{isAuthenticated ? (
						<>
							<Route
								path='/'
								element={
									<Navigate
										to={
											admin === 'Employee'
												? '/employee/dashboard'
												/* : admin === 'Master'
												? '/master/dashboard' */
												: admin === 'HR'
												? '/hr/dashboard'
												/* : admin === 'Trainer'
												? '/trainer/dashboard'
												: admin === 'Account'
												? '/account/dashboard'
												: admin === 'Adajan-Branch'
												? '/adajan-branch/dashboard'
												: admin === 'GLS_Investor' || admin === 'Investor'
												? '/gls-investor/dashboard'
												: admin === 'Matrices'
												? '/matrices/gls-report'
												: admin === 'Automation'
												? '/automation/broadcast/list' */
												: '/rag/dashboard'
										}
										replace
									/>
								}
							/>
							{/* <Route
								path='/tele/login'
								element={<Navigate to='/automation/broadcast/list' />}
							/>
							<Route
								path='/master/login'
								element={<Navigate to='/master/dashboard' />}
							/> */}
							<Route
								path='/rag/login'
								element={<Navigate to='/rag/dashboard' />}
							/>
							{/* <Route
								path='/gls-investor/login'
								element={<Navigate to='/gls-investor/dashboard' />}
							/> */}

							{/* Module Routes */}
							<Route
								path='/employee/*'
								element={<EmployeePrivateRoutes />}
							/>
							<Route
								path='/rag/*'
								element={<GomziNutritionPrivateRoutes />}
							/>
							<Route
								path='/nutrition/*'
								element={<GomziNutritionPrivateRoutes />}
							/>
							{/* <Route
								path='/trainer/*'
								element={<TrainerPrivateRoutes />}
							/>
							<Route
								path='/master/*'
								element={<MasterPrivateRoutes />}
							/> */}
							<Route
								path='/hr/*'
								element={<HRPrivateRoutes />}
							/>
							{/* <Route
								path='/account/*'
								element={<AccountPrivateRoutes />}
							/>
							<Route
								path='/adajan-branch/*'
								element={<AdajanBranchPrivateRoutes />}
							/>
							<Route
								path='/automation/*'
								element={<AutomationPrivateRoutes />}
							/>
							<Route
								path='/fwg/*'
								element={<FWGPrivateRoutes />}
							/>
							<Route
								path='/fgiit/*'
								element={<FgiitPrivateRoutes />}
							/>
							<Route
								path='/fgiit-tele-sales/*'
								element={<FgiitTeleSalesPrivateRoutes />}
							/>
							<Route
								path='/fwg-tele-sales/*'
								element={<FwgTeleSalesPrivateRoutes />}
							/>
							<Route
								path='/gcs/*'
								element={<GCSPrivateRoutes />}
							/>
							<Route
								path='/gls-investor/*'
								element={<GlsInvestorPrivateRoutes />}
							/>
							<Route
								path='/investor/*'
								element={<InvestorPrivateRoutes />}
							/>
							<Route
								path='/gomzi-medical-doctor/*'
								element={<GomziMedicalDoctorPrivateRoutes />}
							/>
							<Route
								path='/gomzi-medical-pharmacy/*'
								element={<GomziMedicalPharmacyPrivateRoutes />}
							/>
							<Route
								path='/gomzi-medical/*'
								element={<GomziMedicalPrivateRoutes />}
							/>
							<Route
								path='/gn-tele-sales/*'
								element={<GomziNutritionTeleSalesPrivateRoutes />}
							/>
							<Route
								path='/helix/*'
								element={<HelixPrivateRoutes />}
							/>
							<Route
								path='/matrices/*'
								element={<MatricesPrivateRoute />}
							/> */}
						</>
					) : (
						<>
							<Route
								path='nutrition/login/*'
								element={<GomziNutritionLoginAuthPage />}
							/>
							<Route
								path='nutrition/*'
								element={<Navigate to='/rag/login' />}
							/>
							<Route
								path='login/*'
								element={<AuthPage />}
							/>
							<Route
								path='*'
								element={<Navigate to='/login' />}
							/>
							<Route
								path='employee/login/*'
								element={<EmployeeAuthPage />}
							/>
							<Route
								path='employee/*'
								element={<Navigate to='/employee/login' />}
							/>
							<Route
								path='master/login/*'
								element={<MasterAuthPage />}
							/>

							<Route
								path='master/*'
								element={<Navigate to='/master/login' />}
							/>
							<Route
								path='fwg-master/login/*'
								element={<VesuMasterAuthPage />}
							/>
							<Route
								path='fwg-master/*'
								element={<Navigate to='/fwg-master/login' />}
							/>
							<Route
								path='portal/login/*'
								element={<PortalAuthPage />}
							/>
							<Route
								path='portal/*'
								element={<Navigate to='/portal/login' />}
							/>
							<Route
								path='trainer/login/*'
								element={<TrainerAuthPage />}
							/>
							<Route
								path='trainer/*'
								element={<Navigate to='/trainer/login' />}
							/>
							<Route
								path='nutrition/login/*'
								element={<GomziNutritionLoginAuthPage />}
							/>
							<Route
								path='nutrition/login/*'
								element={<NutritionAuthPage />}
							/>
							<Route
								path='nutrition/*'
								element={<Navigate to='/rag/login' />}
							/>
							<Route
								path='gomzi-medical-doctor/login/*'
								element={<GomziMedicalDoctorAuthPage />}
							/>
							<Route
								path='gomzi-medical-doctor/*'
								element={<Navigate to='/gomzi-medical-doctor/login' />}
							/>
							<Route
								path='gomzi-medical-pharmacy/login/*'
								element={<GomziMedicalPharmacyAuthPage />}
							/>
							<Route
								path='gomzi-medical-pharmacy/*'
								element={<Navigate to='/gomzi-medical-pharmacy/login' />}
							/>
							<Route
								path='*'
								element={<Navigate to='/login' />}
							/>
						</>
					)}
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export { AppRoutes }
