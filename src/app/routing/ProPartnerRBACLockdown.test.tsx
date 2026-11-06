// Polyfill TextEncoder/TextDecoder for jsdom environment
if (typeof (global as any).TextEncoder === 'undefined') {
	const { TextEncoder, TextDecoder } = require('util')
	;(global as any).TextEncoder = TextEncoder
	;(global as any).TextDecoder = TextDecoder
}

jest.mock('html2pdf.js', () => {
	if (typeof (global as any).TextEncoder === 'undefined') {
		const { TextEncoder, TextDecoder } = require('util')
		;(global as any).TextEncoder = TextEncoder
		;(global as any).TextDecoder = TextDecoder
	}
	return {
		__esModule: true,
		default: () => ({
			set: () => ({ from: () => ({ save: () => Promise.resolve() }) }),
		}),
	}
})

jest.mock('jspdf', () => ({
	__esModule: true,
	default: jest.fn(),
}))

jest.mock('html2canvas', () => ({
	__esModule: true,
	default: jest.fn(),
}))

jest.mock('react-audio-voice-recorder', () => ({
	AudioRecorder: () => null,
}), { virtual: true })

jest.mock('../../_metronic/layout/components/header/HeaderToolbar', () => ({
	HeaderToolbar: () => <div data-testid='header-toolbar' />,
}))

import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes, Outlet, useLocation } from 'react-router-dom'
import {
	decodeJwtPayload,
	getDecodedAuthToken,
	getJwtTokenPayload,
	isProPartnerToken,
	isProPartnerSession,
	isUserAdmin,
	isProPartnerOnlyUser,
	setProPartnerSessionTokens,
	syncAndRouteProPartnerUser,
} from '../modules/auth/core/ProPartnerAuth'
import {
	VerifyEmailOTP,
	LoginFGGroup,
	GetUniversalAccessTokens,
} from '../Functions/FGGroup/AccountFunctions'
import { GomziNutritionPrivateRoutes } from './GomziNutritionPrivateRoutes'
import { AsideMenuMain } from '../../_metronic/layout/components/aside/AsideMenuMain'
import { AsideToolbar } from '../../_metronic/layout/components/aside/AsideToolbar'
import { HeaderWrapper } from '../../_metronic/layout/components/header/HeaderWrapper'
import { RAGProPartnerAsideMenuItems } from '../../_metronic/layout/components/aside/components/RAGProPartnerAsideMenuItems'

// Helper to create mock JWT tokens with genuine base64 structure
function createMockJwt(payload: Record<string, any>): string {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '')
	const body = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '')
	const sig = 'mock_jwt_signature'
	return `${header}.${body}.${sig}`
}

// Mock MasterLayout to render Outlet cleanly without deep Metronic DOM dependencies
jest.mock('../../_metronic/layout/MasterLayout', () => {
	const { Outlet } = require('react-router-dom')
	return {
		MasterLayout: () => (
			<div data-testid='master-layout'>
				<Outlet />
			</div>
		),
	}
})

// Mock admin and partner page components mounted by GomziNutritionPrivateRoutes
jest.mock('../pages/gomzi-nutrition/dashboard/DashboardWrapper', () => ({
	GomziNutritionDashboard: () => <div data-testid='admin-dashboard'>Admin Dashboard</div>,
}))

jest.mock('../pages/gomzi-nutrition/deals/deal-manage', () => ({
	__esModule: true,
	default: () => <div data-testid='admin-deals'>Admin Deals</div>,
}))

jest.mock('../pages/gomzi-nutrition/combo-stacks/combo-stack-manage', () => ({
	__esModule: true,
	default: () => <div data-testid='admin-combo-stacks'>Admin Combo Stacks</div>,
}))

jest.mock('../pages/gomzi-nutrition/categories/category-manage', () => ({
	__esModule: true,
	default: () => <div data-testid='admin-categories'>Admin Categories</div>,
}))

jest.mock('../pages/gomzi-nutrition/gomzi-nutrition/gomzi-nutrition-product-list', () => ({
	__esModule: true,
	default: () => <div data-testid='admin-products'>Admin Products</div>,
}))

jest.mock('../pages/gomzi-nutrition/contact-inquiry/pro-partner', () => ({
	__esModule: true,
	default: () => <div data-testid='admin-pro-partner-inquiry'>Admin Pro Partner Inquiry</div>,
}))

jest.mock('../pages/gomzi-nutrition/pro-partner/pro-partner-coupons', () => ({
	__esModule: true,
	default: ({ defaultTab }: { defaultTab?: string }) => (
		<div data-testid='partner-coupons-portal' data-tab={defaultTab}>
			Partner Portal Tab: {defaultTab || 'coupons'}
		</div>
	),
}))

// Mock API utilities in AccountFunctions
jest.mock('../../_metronic/helpers/Utils', () => ({
	APIPost: jest.fn().mockResolvedValue({ status: 200, data: {} }),
	APIGet: jest.fn().mockResolvedValue({ status: 200, data: [] }),
	toAbsoluteUrl: (url: string) => url,
}))

jest.mock('../Functions/FWG', () => ({
	getProfile: jest.fn().mockResolvedValue({ status: 200, data: { type: 'RAG_Pro_Partner' } }),
}))

// Mock Layout core
jest.mock('../../_metronic/layout/core', () => ({
	useLayout: () => ({
		config: { aside: { theme: 'dark' } },
		classes: { header: [] },
		attributes: { headerMenu: {} },
	}),
	getLayout: () => ({ main: { iconType: 'duotone' } }),
	setLayout: jest.fn(),
}))

describe('Milestone 3: Strict RBAC Lockdown & Portal Redirection 10-Point Test Matrix', () => {
	const partnerToken = createMockJwt({
		id: 'partner-uuid-001',
		type: 'RAG_Pro_Partner',
		email: 'partner@example.com',
		authToken: 'auth-token-123',
	})

	const adminToken = createMockJwt({
		id: 'admin-uuid-002',
		type: 'Master',
		email: 'admin@example.com',
	})

	beforeEach(() => {
		localStorage.clear()
		jest.clearAllMocks()
	})

	afterEach(() => {
		cleanup()
	})

	// =========================================================================
	// TM-01: Post-Login Redirection & Role Synchronous Detection
	// =========================================================================
	test('TM-01: Synchronously detects RAG_Pro_Partner identity from JWT claims without network latency', () => {
		localStorage.setItem('auth_fg_group', partnerToken)

		// Synchronous JWT decoding in 0ms
		const decoded = getDecodedAuthToken()
		expect(decoded).not.toBeNull()
		expect(decoded.type).toBe('RAG_Pro_Partner')

		expect(isProPartnerToken(partnerToken)).toBe(true)
		expect(isProPartnerToken(adminToken)).toBe(false)

		// Authoritative session check returns true
		expect(isProPartnerSession()).toBe(true)
		expect(isProPartnerOnlyUser()).toBe(true)
		expect(isUserAdmin()).toBe(false)
	})

	// =========================================================================
	// TM-02: Root URL Portal Redirection & Zero-Flash Invariant
	// =========================================================================
	test('TM-02: Evaluates partner session and establishes strict session tokens', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		localStorage.setItem('searchedURL', '/rag/dashboard') // Stale trap URL from prior session

		setProPartnerSessionTokens()

		expect(localStorage.getItem('admin')).toBe('RAG_Pro_Partner')
		expect(localStorage.getItem('admin_type')).toBe('RAG_Pro_Partner')
		expect(localStorage.getItem('is_pro_partner_user')).toBe('true')
		// Critical: searchedURL must be purged to prevent redirect bounce loops
		expect(localStorage.getItem('searchedURL')).toBeNull()
	})

	const renderWithRagRouter = (initialPath: string) => {
		let currentPath = ''
		const LocationInspector = () => {
			const loc = useLocation()
			currentPath = loc.pathname
			return null
		}

		render(
			<MemoryRouter initialEntries={[initialPath]}>
				<LocationInspector />
				<Routes>
					<Route path='/rag/*' element={<GomziNutritionPrivateRoutes />} />
				</Routes>
			</MemoryRouter>
		)

		return { getCurrentPath: () => currentPath }
	}

	// =========================================================================
	// TM-03: Main Store Dashboard Lockdown
	// =========================================================================
	test('TM-03: Access to /rag/dashboard while authenticated as Pro Partner redirects to /rag/pro-partner/coupons with ZERO admin UI mounted', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		const { getCurrentPath } = renderWithRagRouter('/rag/dashboard')

		// Admin dashboard MUST NEVER mount
		expect(screen.queryByTestId('admin-dashboard')).toBeNull()
		// Redirection target rendered
		expect(screen.getByTestId('partner-coupons-portal')).toBeInTheDocument()
		expect(getCurrentPath()).toBe('/rag/pro-partner/coupons')
	})

	// =========================================================================
	// TM-04: E-Commerce Admin Routes Lockdown (/deals, /combo-stacks, /categories, etc.)
	// =========================================================================
	test('TM-04: Deep links to /deals, /combo-stacks, /categories NEVER mount admin components and redirect partner', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		const testPaths = ['/rag/deals', '/rag/combo-stacks', '/rag/categories']

		testPaths.forEach((path) => {
			cleanup()
			const { getCurrentPath } = renderWithRagRouter(path)

			expect(screen.queryByTestId('admin-deals')).toBeNull()
			expect(screen.queryByTestId('admin-combo-stacks')).toBeNull()
			expect(screen.queryByTestId('admin-categories')).toBeNull()
			expect(screen.getByTestId('partner-coupons-portal')).toBeInTheDocument()
			expect(getCurrentPath()).toBe('/rag/pro-partner/coupons')
		})
	})

	// =========================================================================
	// TM-05: Inventory, User Management & Catch-All Lockdown
	// =========================================================================
	test('TM-05: Arbitrary admin routes (/inventory, /users, /admin) hit catch-all and redirect cleanly', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		const arbitraryAdminPaths = [
			'/rag/inventory/suppliers/list',
			'/rag/gn-inventory/procurement',
			'/rag/users',
			'/rag/admin',
			'/rag/unauthorized-arbitrary-page',
		]

		arbitraryAdminPaths.forEach((adminPath) => {
			cleanup()
			const { getCurrentPath } = renderWithRagRouter(adminPath)

			expect(screen.getByTestId('partner-coupons-portal')).toBeInTheDocument()
			expect(getCurrentPath()).toBe('/rag/pro-partner/coupons')
		})
	})

	// =========================================================================
	// TM-06: Partner Applications & Inquiry Admin View Lockdown
	// =========================================================================
	test('TM-06: Direct access to partner application review (/contact-inquiry/pro-partner) is blocked for partners', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		const { getCurrentPath } = renderWithRagRouter('/rag/contact-inquiry/pro-partner')

		// Partner must NOT be able to view applications of other applicants
		expect(screen.queryByTestId('admin-pro-partner-inquiry')).toBeNull()
		expect(screen.getByTestId('partner-coupons-portal')).toBeInTheDocument()
		expect(getCurrentPath()).toBe('/rag/pro-partner/coupons')
	})

	// =========================================================================
	// TM-07: Cross-Module Employee & HR Portal Isolation
	// =========================================================================
	test('TM-07: Pro Partner identity is strictly recognized by isProPartnerOnlyUser across module guards', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		// Both module guards (EmployeePrivateRoutes & HRPrivateRoutes) rely on isProPartnerOnlyUser()
		expect(isProPartnerOnlyUser()).toBe(true)
		// Admin checks must fail closed
		expect(isUserAdmin()).toBe(false)
	})

	// =========================================================================
	// TM-08: Authorized Pro Partner Navigation Across Whitelisted Routes
	// =========================================================================
	test('TM-08: Permitted partner routes (/coupons, /commissions, /orders, /change-password) mount without redirects', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		const partnerRoutes = [
			{ path: '/rag/pro-partner/coupons', expectedTab: 'coupons' },
			{ path: '/rag/pro-partner/commissions', expectedTab: 'commissions' },
			{ path: '/rag/pro-partner/orders', expectedTab: 'orders' },
			{ path: '/rag/pro-partner/change-password', expectedTab: 'change-password' },
		]

		partnerRoutes.forEach(({ path, expectedTab }) => {
			cleanup()
			const { getCurrentPath } = renderWithRagRouter(path)

			const portal = screen.getByTestId('partner-coupons-portal')
			expect(portal).toBeInTheDocument()
			expect(portal.getAttribute('data-tab')).toBe(expectedTab)
			expect(getCurrentPath()).toBe(path)
		})
	})

	// =========================================================================
	// TM-09: AsideMenu Session Contamination Shield
	// =========================================================================
	test('TM-09: AsideMenuMain NEVER mutates localStorage admin to Gomzi_Nutrition for partner sessions', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		expect(localStorage.getItem('admin')).toBe('RAG_Pro_Partner')

		render(
			<MemoryRouter initialEntries={['/rag/pro-partner/coupons']}>
				<AsideMenuMain />
			</MemoryRouter>
		)

		// Assert localStorage was NOT poisoned
		expect(localStorage.getItem('admin')).toBe('RAG_Pro_Partner')
		expect(localStorage.getItem('admin_type')).toBe('RAG_Pro_Partner')

		// Assert Pro Partner menu items are present
		expect(screen.getByText(/💎 RAG Pro Partner/i)).toBeInTheDocument()
		expect(screen.getByText('My Assigned Coupon')).toBeInTheDocument()
		expect(screen.getByText('Commissions & Payouts')).toBeInTheDocument()
		expect(screen.getByText('Referred Order History')).toBeInTheDocument()
		expect(screen.getByText('Change Password')).toBeInTheDocument()

		// Back link to Main RAG Admin MUST NOT be visible to partner-only users
		expect(screen.queryByText('Main RAG Admin')).toBeNull()
	})

	// =========================================================================
	// TM-10: Brand Logo Links & Universal Access Token Bypass
	// =========================================================================
	test('TM-10A: AsideToolbar and HeaderWrapper brand logos link strictly to /rag/pro-partner/coupons', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		setProPartnerSessionTokens()

		// 1. Sidebar Brand Logo
		render(
			<MemoryRouter>
				<AsideToolbar />
			</MemoryRouter>
		)
		const sidebarLogoLink = screen.getByTitle('RAG Pro Partner Portal')
		expect(sidebarLogoLink).toHaveAttribute('href', '/rag/pro-partner/coupons')

		cleanup()

		// 2. Mobile Header Brand Logo
		render(
			<MemoryRouter>
				<HeaderWrapper />
			</MemoryRouter>
		)
		const mobileLogoLink = screen.getByTitle('RAG Pro Partner')
		expect(mobileLogoLink).toHaveAttribute('href', '/rag/pro-partner/coupons')
	})

	test('TM-10B: Pro Partner login bypasses GetUniversalAccessTokens() avoiding HTTP 403 Forbidden', async () => {
		const { APIPost, APIGet } = require('../../_metronic/helpers/Utils')
		;(APIPost as jest.Mock).mockResolvedValue({
			status: 200,
			data: { authorization: partnerToken },
		})

		const result: any = await VerifyEmailOTP({
			verification_id: 'v-123',
			otp: '123456',
		})

		expect(result.status).toBe(200)
		// Crucial assertion: APIGet for /admin/v1/get-universal-token was NEVER dispatched
		expect(APIGet).not.toHaveBeenCalled()
		// Session tokens established immediately
		expect(localStorage.getItem('admin')).toBe('RAG_Pro_Partner')
		expect(localStorage.getItem('is_pro_partner_user')).toBe('true')
	})

	test('TM-10C: Direct call to GetUniversalAccessTokens returns bypass response for partner tokens', async () => {
		const { APIGet } = require('../../_metronic/helpers/Utils')
		localStorage.setItem('@fggroup+auth', partnerToken)

		const result = await GetUniversalAccessTokens()

		expect(result.status).toBe(200)
		expect(APIGet).not.toHaveBeenCalled()
		expect(localStorage.getItem('admin')).toBe('RAG_Pro_Partner')
	})

	test('TM-10D: Session contamination immunity: isUserAdmin() returns false even if admin=Gomzi_Nutrition is injected into localStorage', () => {
		localStorage.setItem('auth_fg_group', partnerToken)
		// Malicious injection attempt
		localStorage.setItem('admin', 'Gomzi_Nutrition')
		localStorage.setItem('admin_type', 'Gomzi_Nutrition')

		// Because token claims RAG_Pro_Partner, isUserAdmin MUST remain false
		expect(isUserAdmin()).toBe(false)
		expect(isProPartnerSession()).toBe(true)
		expect(isProPartnerOnlyUser()).toBe(true)
	})

	test('TM-10E: syncAndRouteProPartnerUser preserves partner role without coupon demotion', async () => {
		localStorage.setItem('auth_fg_group', partnerToken)

		const isPartner = await syncAndRouteProPartnerUser({
			email: 'partner@example.com',
			type: 'RAG_Pro_Partner',
		})

		expect(isPartner).toBe(true)
		expect(localStorage.getItem('admin')).toBe('RAG_Pro_Partner')
		expect(localStorage.getItem('is_pro_partner_user')).toBe('true')
	})
})
