/* eslint-disable react/jsx-no-target-blank */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isProPartnerOnlyUser, isUserAdmin } from '../../../../app/modules/auth'
import { EmployeeAsideMenuItems } from './components/EmployeeAsideMenuItems'
import { GomziNutritionAsideMenuItems } from './components/GomziNutritionAsideMenuItems'
import { HRAsideMenuItems } from './components/HRAsideMenuItems'
import { RAGProPartnerAsideMenuItems } from './components/RAGProPartnerAsideMenuItems'

export function AsideMenuMain() {
	const location = useLocation()
	const isPartner = isProPartnerOnlyUser()

	const [portalAdminType, setPortalAdminType] = useState('')
	const [adminType, setAdminType] = useState(() => {
		if (isPartner) {
			localStorage.setItem('admin', 'RAG_Pro_Partner')
			localStorage.setItem('admin_type', 'RAG_Pro_Partner')
			localStorage.removeItem('is_employee_login')
			return 'RAG_Pro_Partner'
		}
		const pathSegments = window.location.pathname.split('/')
		const firstSegment = (pathSegments[1] || '').toLowerCase()
		if (firstSegment === 'rag') {
			localStorage.setItem('admin', 'Gomzi_Nutrition')
			localStorage.setItem('admin_type', 'Gomzi_Nutrition')
			localStorage.removeItem('is_employee_login')
			return 'Gomzi_Nutrition'
		}
		if (firstSegment === 'hr') {
			localStorage.setItem('admin', 'HR')
			return 'HR'
		}
		if (firstSegment === 'employee') {
			localStorage.setItem('admin', 'Employee')
			return 'Employee'
		}
		return localStorage.getItem('admin') || ''
	})

	useEffect(() => {
		// Strict Partner Lockdown: NEVER allow admin mutation or panel hopping
		if (isPartner) {
			setAdminType('RAG_Pro_Partner')
			if (localStorage.getItem('admin') !== 'RAG_Pro_Partner') {
				localStorage.setItem('admin', 'RAG_Pro_Partner')
				localStorage.setItem('admin_type', 'RAG_Pro_Partner')
			}
			localStorage.removeItem('is_employee_login')
			return
		}

		const pathSegments = location.pathname.split('/')
		const firstSegment = (pathSegments[1] || '').toLowerCase()

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
	}, [location.pathname, isPartner])

	// Airtight UI Isolation: Pro Partner sees strictly RAGProPartnerAsideMenuItems
	if (isPartner || (!isUserAdmin() && adminType === 'RAG_Pro_Partner')) {
		return <RAGProPartnerAsideMenuItems />
	}

	return (
		<>
			{/* {adminType === 'Trainer' && <TrainerAsideMenuItems />} */}
			{/* {portalAdminType === 'fwg_portal' && <FwgPortalAsideMenuItems />} */}
			{/* {adminType === 'FGIIT' && <FGIITAsideMenuItems />} */}
			{/* {adminType === 'FWG' && portalAdminType !== 'fwg_portal' && <FWGAsideMenuItems />} */}
			{/* {adminType === 'Vesu-Master' && <VesuFWGAsideMenuItems />} */}
			{adminType === 'HR' && <HRAsideMenuItems />}
			{/* {adminType === 'GCS' && <GCSAsideMenuItems />} */}
			{adminType === 'Employee' && <EmployeeAsideMenuItems />}
			{/* {adminType === 'Master' && <MasterAsideMenuItems />} */}
			{adminType === 'Gomzi_Nutrition' && <GomziNutritionAsideMenuItems />}
			{/* {adminType === 'Gomzi_Nutrition_Tele_Sales' && <GomziNutritionTeleSalesAsideMenuItems />} */}
			{/* {adminType === 'Fgiit_Tele_Sales' && <FGIITTeleSalesAsideMenuItems />} */}
			{/* {adminType === 'Fwg_Tele_Sales' && <FWGTeleSalesAsideMenuItems />} */}
			{/* {adminType === 'Store' && <StoreNutritionAsideMenuItems />} */}
			{/* {adminType === 'Gomzi_Medical' && <GomziMedicalAsideMenuItems />} */}
			{/* {adminType === 'Gomzi_Medical_Doctor' && <GomziMedicalDoctorAsideMenuItems />} */}
			{/* {adminType === 'Gomzi_Medical_Pharmacy' && <GomziMedicalPharmacyAsideMenuItems />} */}
			{/* {adminType === 'Adajan-Branch' && <AdajanBranchAsideMenuItems />} */}
			{/* {adminType === 'Account' && <AccountAsideMenuItems />} */}
			{/* {adminType === 'Automation' && <AutomationAsideMenuItems />} */}
			{/* {adminType === 'GLS_Investor' && <GlsInvestorAsideMenuItems />} */}
			{/* {adminType === 'Investor' && <InvestorAsideMenuItems />} */}
			{/* {adminType === 'Matrices' && <MatricesAsideMenuItems />} */}
			{/* {adminType === 'FWG_LOGIN_PORTAL' && <FwgloginAsidemenuItems />} */}
			{/* {adminType === 'FGIIT_LOGIN_PORTAL' && <FgiitLoginAsideMenuItems />} */}
			{/* {adminType === 'Gomzi_Nutrition_Login' && <GomziNutritionLoginAsideMenuItems />} */}
			{/* {adminType === 'Helix' && <HelixAsideMenuItems />} */}
		</>
	)
}
