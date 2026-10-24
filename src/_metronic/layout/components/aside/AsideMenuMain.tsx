/* eslint-disable react/jsx-no-target-blank */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AdajanBranchAsideMenuItems } from './components/AdajanBranchAsideMenuItems'
import { AutomationAsideMenuItems } from './components/AutomationAsideMenuItems'
import { EmployeeAsideMenuItems } from './components/EmployeeAsideMenuItems'
import { FGIITAsideMenuItems } from './components/FGIITAsideMenuItems'
import { FgiitLoginAsideMenuItems } from './components/FgiitLoginAsideMenuItems'
import { FGIITTeleSalesAsideMenuItems } from './components/FGIITTeleSalesAsideMenuItems'
import { FWGAsideMenuItems } from './components/FWGAsideMenuItems'
import { FwgloginAsidemenuItems } from './components/FwgloginAsidemenuItems'
import { FwgPortalAsideMenuItems } from './components/FwgPortalAsideMenuItems'
import { FWGTeleSalesAsideMenuItems } from './components/FWGTeleSalesAsideMenuItems'
import { GCSAsideMenuItems } from './components/GCSAsideMenuItems'
import { GlsInvestorAsideMenuItems } from './components/GlsInvestorAsideMenuItems'
import { GomziMedicalAsideMenuItems } from './components/GomziMedicalAsideMenuItems'
import { GomziMedicalDoctorAsideMenuItems } from './components/GomziMedicalDoctorAsideMenuItems'
import { GomziMedicalPharmacyAsideMenuItems } from './components/GomziMedicalPharmacyAsideMenuItems'
import { GomziNutritionAsideMenuItems } from './components/GomziNutritionAsideMenuItems'
import { GomziNutritionLoginAsideMenuItems } from './components/GomziNutritionLoginAsideMenuItems'
import { GomziNutritionTeleSalesAsideMenuItems } from './components/GomziNutritionTeleSalesAsideMenuItems'
import { HRAsideMenuItems } from './components/HRAsideMenuItems'
import { InvestorAsideMenuItems } from './components/InvestorAsideMenuItems'
import { MasterAsideMenuItems } from './components/MasterAsideMenuItems'
import { StoreNutritionAsideMenuItems } from './components/StoreNutritionAsideMenuItems'
import { TrainerAsideMenuItems } from './components/TrainerAsideMenuItems'
import { VesuFWGAsideMenuItems } from './components/VesuFWGAsideMenuItems'
import { MatricesAsideMenuItems } from './components/MatricesAsideMenuItems'
import { AccountAsideMenuItems } from './components/AccountAsideMenuItems'
import { HelixAsideMenuItems } from './components/HelixAsideMenuItems'

export function AsideMenuMain() {
	const [portalAdminType, setPortalAdminType] = useState('')
	const [adminType, setAdminType] = useState(() => {
		if (window.location.pathname.startsWith('/rag')) {
			localStorage.setItem('admin', 'Gomzi_Nutrition')
			localStorage.setItem('admin_type', 'Gomzi_Nutrition')
			localStorage.removeItem('is_employee_login')
			return 'Gomzi_Nutrition'
		}
		if (window.location.pathname.startsWith('/hr')) {
			localStorage.setItem('admin', 'HR')
			return 'HR'
		}
		return localStorage.getItem('admin') || ''
	})
	const location = useLocation()

	useEffect(() => {
		const pathSegments = location.pathname.split('/')
		const firstSegment = pathSegments[1]

		if (firstSegment === 'rag') {
			setAdminType('Gomzi_Nutrition')
			localStorage.setItem('admin', 'Gomzi_Nutrition')
			localStorage.setItem('admin_type', 'Gomzi_Nutrition')
			localStorage.removeItem('is_employee_login')
			return
		}

		if (firstSegment === 'hr') {
			setAdminType('HR')
			localStorage.setItem('admin', 'HR')
			return
		}

		if (firstSegment === 'employee') {
			setAdminType('Employee')
			localStorage.setItem('admin', 'Employee')
			return
		}

		const portalAdmin = localStorage.getItem('fwg_portal')
		const storedAdmin = localStorage.getItem('admin')
		if (portalAdmin) {
			setPortalAdminType(portalAdmin)
		}
		if (storedAdmin) {
			setAdminType(storedAdmin)
		}
	}, [location.pathname])

	return (
		<>
			{adminType === 'Trainer' && <TrainerAsideMenuItems />}
			{portalAdminType === 'fwg_portal' && <FwgPortalAsideMenuItems />}
			{adminType === 'FGIIT' && <FGIITAsideMenuItems />}
			{adminType === 'FWG' && portalAdminType !== 'fwg_portal' && <FWGAsideMenuItems />}
			{adminType === 'Vesu-Master' && <VesuFWGAsideMenuItems />}
			{adminType === 'HR' && <HRAsideMenuItems />}
			{adminType === 'GCS' && <GCSAsideMenuItems />}
			{adminType === 'Employee' && <EmployeeAsideMenuItems />}
			{adminType === 'Master' && <MasterAsideMenuItems />}
			{adminType === 'Gomzi_Nutrition' && <GomziNutritionAsideMenuItems />}
			{adminType === 'Gomzi_Nutrition_Tele_Sales' && <GomziNutritionTeleSalesAsideMenuItems />}
			{adminType === 'Fgiit_Tele_Sales' && <FGIITTeleSalesAsideMenuItems />}
			{adminType === 'Fwg_Tele_Sales' && <FWGTeleSalesAsideMenuItems />}
			{adminType === 'Store' && <StoreNutritionAsideMenuItems />}
			{adminType === 'Gomzi_Medical' && <GomziMedicalAsideMenuItems />}
			{adminType === 'Gomzi_Medical_Doctor' && <GomziMedicalDoctorAsideMenuItems />}
			{adminType === 'Gomzi_Medical_Pharmacy' && <GomziMedicalPharmacyAsideMenuItems />}
			{adminType === 'Adajan-Branch' && <AdajanBranchAsideMenuItems />}
			{adminType === 'Account' && <AccountAsideMenuItems />}
			{adminType === 'Automation' && <AutomationAsideMenuItems />}
			{adminType === 'GLS_Investor' && <GlsInvestorAsideMenuItems />}
			{adminType === 'Investor' && <InvestorAsideMenuItems />}
			{adminType === 'Matrices' && <MatricesAsideMenuItems />}
			{adminType === 'FWG_LOGIN_PORTAL' && <FwgloginAsidemenuItems />}
			{adminType === 'FGIIT_LOGIN_PORTAL' && <FgiitLoginAsideMenuItems />}
			{adminType === 'Gomzi_Nutrition_Login' && <GomziNutritionLoginAsideMenuItems />}
			{adminType === 'Helix' && <HelixAsideMenuItems />}
		</>
	)
}
