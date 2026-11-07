/* eslint-disable */
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import {
	CreateReferralCoupon,
	GetContactInquiry,
	GetProduct,
	GetReferralCoupon,
	GetReferralCouponUsage,
	GetTrainers,
	GetUsers,
	UpdateReferralCoupon,
} from '../../../Functions/FGGroup'
import { isProPartnerApplication } from '../contact-inquiry/contactInquiryUtils'
import './manage-coupon.css'

const RAG_PARTNER_SOURCE_FILTER = 'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag'

const getProductImageUrl = (p: any): string => {
	const raw =
		(Array.isArray(p?.display_image) ? p.display_image[0] : p?.display_image) ||
		(Array.isArray(p?.displayImages) ? p.displayImages[0] : p?.displayImages) ||
		p?.image ||
		p?.thumbnail ||
		''
	if (!raw) return ''
	if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
	return `https://files.fggroup.in/${raw}`
}

const ManageCoupon: React.FC = () => {
	// View mode: 'list' (Table & KPIs) | 'generate' (Full-Page Generator Form)
	const [viewMode, setViewMode] = useState<'list' | 'generate'>('list')
	const [editingCouponId, setEditingCouponId] = useState<string | null>(null)

	// List & Filter States
	const [searchTerm, setSearchTerm] = useState('')
	const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>('all')
	const [statusFilter, setStatusFilter] = useState<string>('all')
	const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')

	// Raw Data
	const [referenceData, setReferenceData] = useState<any[]>([])
	const [usersData, setUsersData] = useState<any[]>([])
	const [partnerData, setPartnerData] = useState<any[]>([])
	const [trainerData, setTrainerData] = useState<any[]>([])
	const [catalogProducts, setCatalogProducts] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)

	// Search & Modal States in generator form
	const [userSearchTerm, setUserSearchTerm] = useState('')
	const [partnerSearchTerm, setPartnerSearchTerm] = useState('')
	const [productSearchTerm, setProductSearchTerm] = useState('')
	const [selectedProductCategory, setSelectedProductCategory] = useState('ALL')
	const [showProductModal, setShowProductModal] = useState(false)

	// Usage Details Modal State
	const [showUsageModal, setShowUsageModal] = useState(false)
	const [selectedCouponForUsage, setSelectedCouponForUsage] = useState<any>(null)
	const [usageOrders, setUsageOrders] = useState<any[]>([])
	const [usageLoading, setUsageLoading] = useState(false)

	// Generator Form State
	const [beneficiaryType, setBeneficiaryType] = useState<'user' | 'pro_partner' | 'trainer' | 'general'>('user')
	const [selectedUserId, setSelectedUserId] = useState<string>('')
	const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
	const [selectedTrainerId, setSelectedTrainerId] = useState<string>('')

	const [formState, setFormState] = useState({
		title: '',
		coupon_code: '',
		discount_type: 'percent' as 'percent' | 'flat',
		discount: '10',
		max_usage_count: '1000',
		expired_at: DayJS().add(6, 'month').format('YYYY-MM-DD'),
		scope: 'ALL' as 'ALL' | 'SPECIFIC_PRODUCTS',
		applicable_products: [] as string[],
	})

	// Pagination
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// Fetch Coupons
	const fetchCouponData = async () => {
		setLoading(true)
		try {
			const res: any = await GetReferralCoupon()
			const rawList = Array.isArray(res?.data) ? res.data : []
			const sorted = [...rawList].sort(
				(a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
			)
			setReferenceData(sorted)
		} catch (error) {
			console.error('Error fetching referral coupons:', error)
		} finally {
			setLoading(false)
		}
	}

	// Fetch Users
	const fetchUsersData = async () => {
		try {
			const res: any = await GetUsers({ page: 1, limit: 100 })
			const rawList = Array.isArray(res?.data) ? res.data : []
			setUsersData(rawList)
		} catch (error) {
			console.error('Error fetching users:', error)
		}
	}

	// Fetch Approved Partners with complete multi-page coverage
	const fetchPartnerData = async () => {
		try {
			const pageSize = 100
			const firstRes: any = await GetContactInquiry({
				page: 1,
				limit: pageSize,
				source: RAG_PARTNER_SOURCE_FILTER,
				sort: 'createdAt',
				sortOrder: 'desc',
			})

			const meta = firstRes?.metadata?.pagination || {}
			const totalPages = Math.min(Number(meta.totalPages || 1), 10)
			let raw: any[] = Array.isArray(firstRes?.data) ? [...firstRes.data] : []

			for (let p = 2; p <= totalPages; p++) {
				const nextRes: any = await GetContactInquiry({
					page: p,
					limit: pageSize,
					source: RAG_PARTNER_SOURCE_FILTER,
					sort: 'createdAt',
					sortOrder: 'desc',
				})
				if (Array.isArray(nextRes?.data)) {
					raw = raw.concat(nextRes.data)
				}
			}

			if (raw.length === 0) {
				const fallbackRes: any = await GetContactInquiry({
					page: 1,
					limit: 100,
					sort: 'createdAt',
					sortOrder: 'desc',
				})
				raw = Array.isArray(fallbackRes?.data)
					? fallbackRes.data
					: (Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [])
			}

			// Include all Pro Partner applications (both accepted and submitted), prioritizing approved
			const partnerApplications = raw.filter((item: any) => {
				if (!item) return false
				const sub = String(item.subject || '').toLowerCase()
				const d = item.details || {}
				return (
					isProPartnerApplication(item) ||
					Boolean(item.partner_status) ||
					sub.includes('partner') ||
					Boolean(d.partner_type) ||
					Boolean(d.employment_type) ||
					d.inquiryType === 'partner'
				)
			})

			const list = partnerApplications.length > 0 ? partnerApplications : raw

			list.sort((a: any, b: any) => {
				const aApproved = a.partner_status === 'approved' || Boolean(a.partner_policy?.accepted_at) ? 1 : 0
				const bApproved = b.partner_status === 'approved' || Boolean(b.partner_policy?.accepted_at) ? 1 : 0
				if (aApproved !== bApproved) return bApproved - aApproved
				const aTime = new Date(a.createdAt || 0).getTime()
				const bTime = new Date(b.createdAt || 0).getTime()
				return bTime - aTime
			})

			setPartnerData(list)
		} catch (error) {
			console.error('Error fetching partner inquiries:', error)
		}
	}

	// Fetch Trainers
	const fetchTrainerData = async () => {
		try {
			const res: any = await GetTrainers()
			const raw = Array.isArray(res?.data) ? res.data : []
			setTrainerData(raw)
		} catch (error) {
			console.error('Error fetching trainers:', error)
		}
	}

	// Fetch Catalog Products
	const fetchProductCatalog = async () => {
		try {
			const res: any = await GetProduct({ limit: 500, page: 1 })
			const raw = res?.data?.data || res?.data || []
			setCatalogProducts(Array.isArray(raw) ? raw : [])
		} catch (error) {
			console.error('Error fetching product catalog:', error)
		}
	}

	useEffect(() => {
		fetchCouponData()
		fetchUsersData()
		fetchPartnerData()
		fetchTrainerData()
		fetchProductCatalog()

		// Enforce single pure white background across all parent layout wrappers
		const content = document.getElementById('kt_content')
		const post = document.getElementById('kt_post')
		const container = document.getElementById('kt_content_container')
		const wrapper = document.getElementById('kt_wrapper')

		if (content) content.style.backgroundColor = '#FFFFFF'
		if (post) post.style.backgroundColor = '#FFFFFF'
		if (container) container.style.backgroundColor = '#FFFFFF'
		if (wrapper) wrapper.style.backgroundColor = '#FFFFFF'
	}, [])

	// =========================================================================
	// KPI STATS
	// =========================================================================
	const kpis = useMemo(() => {
		const totalCoupons = referenceData.length
		const now = new Date().getTime()

		const liveCoupons = referenceData.filter((c: any) => {
			if (!c.expired_at) return true
			return new Date(c.expired_at).getTime() >= now
		}).length

		const expiredCoupons = totalCoupons - liveCoupons

		const userCoupons = referenceData.filter((c: any) => {
			return (
				Boolean(c.assigned_user?.user_id) ||
				c.coupon_type === 'user' ||
				c.coupon_type === 'pro_partner' ||
				Boolean(c.partner_inquiry_id) ||
				Boolean(c.assign_trainer?.name && c.assign_trainer?.name !== 'N/A')
			)
		}).length

		return {
			totalCoupons,
			liveCoupons,
			expiredCoupons,
			userCoupons,
		}
	}, [referenceData])

	// =========================================================================
	// FILTERING & PAGINATION
	// =========================================================================
	const filteredCoupons = useMemo(() => {
		const q = searchTerm.toLowerCase().trim()
		const now = new Date().getTime()

		return referenceData.filter((c: any) => {
			const code = (c.coupon_code || '').toLowerCase()
			const title = (c.title || '').toLowerCase()
			const userName = (
				c.assigned_user?.name ||
				c.partner_name ||
				c.partner_inquiry_id?.name ||
				c.assign_trainer?.name ||
				''
			).toLowerCase()
			const userMobile = (
				c.assigned_user?.mobile ||
				c.partner_mobile ||
				c.partner_inquiry_id?.mobile ||
				''
			).toLowerCase()

			const matchesSearch =
				!q ||
				code.includes(q) ||
				title.includes(q) ||
				userName.includes(q) ||
				userMobile.includes(q)

			if (!matchesSearch) return false

			const isExpired = c.expired_at && new Date(c.expired_at).getTime() < now
			if (statusFilter === 'active' && isExpired) return false
			if (statusFilter === 'expired' && !isExpired) return false

			const isPartner = c.coupon_type === 'pro_partner' || Boolean(c.partner_inquiry_id)
			const isTrainer = (c.coupon_type === 'trainer' || Boolean(c.assign_trainer?.name && c.assign_trainer?.name !== 'N/A')) && !isPartner
			const isUser = Boolean(c.assigned_user?.user_id) || c.coupon_type === 'user'
			const isGeneral = !isPartner && !isTrainer && !isUser

			if (beneficiaryFilter === 'user' && !isUser) return false
			if (beneficiaryFilter === 'partner' && !isPartner) return false
			if (beneficiaryFilter === 'trainer' && !isTrainer) return false
			if (beneficiaryFilter === 'general' && !isGeneral) return false

			if (dateRangeFilter === '7days') {
				if (!c.expired_at) return false
				const diffDays = (new Date(c.expired_at).getTime() - now) / (1000 * 3600 * 24)
				if (diffDays < 0 || diffDays > 7) return false
			} else if (dateRangeFilter === '30days') {
				if (!c.expired_at) return false
				const diffDays = (new Date(c.expired_at).getTime() - now) / (1000 * 3600 * 24)
				if (diffDays < 0 || diffDays > 30) return false
			}

			return true
		})
	}, [referenceData, searchTerm, statusFilter, beneficiaryFilter, dateRangeFilter])

	const paginatedCoupons = useMemo(() => {
		const start = (pagination.page - 1) * pagination.itemsPerPage
		return filteredCoupons.slice(start, start + pagination.itemsPerPage)
	}, [filteredCoupons, pagination])

	// Beneficiary helpers
	const filteredUsersList = useMemo(() => {
		const q = userSearchTerm.toLowerCase().trim()
		if (!q) return usersData
		return usersData.filter((u) => {
			const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase()
			const email = (u.email || '').toLowerCase()
			const mobile = (u.mobile || '').toLowerCase()
			return fullName.includes(q) || email.includes(q) || mobile.includes(q)
		})
	}, [usersData, userSearchTerm])

	const selectedUserObject = useMemo(() => {
		return usersData.find((u) => String(u._id) === selectedUserId) || null
	}, [usersData, selectedUserId])

	const filteredPartnersList = useMemo(() => {
		const q = partnerSearchTerm.toLowerCase().trim()
		if (!q) return partnerData
		return partnerData.filter((p) => {
			const d = p.details || {}
			const fullName = `${d.full_name || p.name || ''}`.toLowerCase()
			const email = (d.email || p.email || '').toLowerCase()
			const mobile = (d.mobile || p.mobile || '').toLowerCase()
			return fullName.includes(q) || email.includes(q) || mobile.includes(q)
		})
	}, [partnerData, partnerSearchTerm])

	const selectedPartnerObject = useMemo(() => {
		return partnerData.find((p) => String(p._id) === selectedPartnerId) || null
	}, [partnerData, selectedPartnerId])

	const selectedTrainerObject = useMemo(() => {
		return trainerData.find((t) => String(t.trainer_id) === selectedTrainerId) || null
	}, [trainerData, selectedTrainerId])

	// Extract unique categories from catalog products
	const productCategories = useMemo(() => {
		const set = new Set<string>()
		catalogProducts.forEach((p) => {
			if (Array.isArray(p.categories)) {
				p.categories.forEach((c: any) => {
					const title = typeof c === 'string' ? c : c?.title || c?.name
					if (title && String(title).trim()) set.add(String(title).trim())
				})
			}
			const single = p.category?.title || p.category?.name || p.category
			if (typeof single === 'string' && single.trim()) {
				set.add(single.trim())
			}
		})
		return ['ALL', ...Array.from(set).sort()]
	}, [catalogProducts])

	// Filter products by search term and selected category
	const filteredProductsList = useMemo(() => {
		const q = productSearchTerm.toLowerCase().trim()
		return catalogProducts.filter((p) => {
			const title = String(p.title || p.name || '').toLowerCase()
			const price = String(p.price || '')
			const matchesSearch = !q || title.includes(q) || price.includes(q)
			if (!matchesSearch) return false

			if (selectedProductCategory === 'ALL') return true

			const itemCategories: string[] = []
			if (Array.isArray(p.categories)) {
				p.categories.forEach((c: any) => {
					const cName = typeof c === 'string' ? c : c?.title || c?.name
					if (cName) itemCategories.push(String(cName).trim().toLowerCase())
				})
			}
			const singleCat = p.category?.title || p.category?.name || p.category
			if (typeof singleCat === 'string' && singleCat.trim()) {
				itemCategories.push(singleCat.trim().toLowerCase())
			}

			return itemCategories.includes(selectedProductCategory.toLowerCase())
		})
	}, [catalogProducts, productSearchTerm, selectedProductCategory])

	// Selected product full objects for chip preview
	const selectedProductsObjects = useMemo(() => {
		const set = new Set(formState.applicable_products)
		return catalogProducts.filter((p) => set.has(p._id))
	}, [catalogProducts, formState.applicable_products])

	const handleSelectAllFiltered = () => {
		const visibleIds = filteredProductsList.map((p) => p._id)
		setFormState((prev) => {
			const union = Array.from(new Set([...prev.applicable_products, ...visibleIds]))
			return { ...prev, applicable_products: union }
		})
		toast.success(`Selected all ${visibleIds.length} visible products`)
	}

	const handleClearAllSelected = () => {
		setFormState((prev) => ({ ...prev, applicable_products: [] }))
		toast('Cleared product selection', { icon: '🧹' })
	}

	const handleRemoveSingleProduct = (productId: string) => {
		setFormState((prev) => ({
			...prev,
			applicable_products: prev.applicable_products.filter((id) => id !== productId),
		}))
	}

	// Auto-generate code
	const handleAutoFillCode = () => {
		let nameBase = 'GOMZI'
		if (beneficiaryType === 'user' && selectedUserObject) {
			nameBase = selectedUserObject.first_name || 'USER'
		} else if (beneficiaryType === 'pro_partner' && selectedPartnerObject) {
			nameBase = selectedPartnerObject.details?.full_name || selectedPartnerObject.name || 'PARTNER'
		} else if (beneficiaryType === 'trainer' && selectedTrainerObject) {
			nameBase = selectedTrainerObject.full_name || 'TRAINER'
		}

		const cleanName = nameBase.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'OFFER'
		const code = `RAG${cleanName}${formState.discount || '10'}`
		setFormState((prev) => ({
			...prev,
			coupon_code: code,
			title: prev.title || `${nameBase} - Special Discount Coupon`,
		}))
		toast.success(`Generated code: ${code}`)
	}

	// Open generator
	const openGeneratorNew = () => {
		setEditingCouponId(null)
		setBeneficiaryType('user')
		setSelectedUserId('')
		setSelectedPartnerId('')
		setSelectedTrainerId('')
		setUserSearchTerm('')
		setPartnerSearchTerm('')
		setProductSearchTerm('')
		setSelectedProductCategory('ALL')
		setShowProductModal(false)

		setFormState({
			title: '',
			coupon_code: '',
			discount_type: 'percent',
			discount: '10',
			max_usage_count: '1000',
			expired_at: DayJS().add(6, 'month').format('YYYY-MM-DD'),
			scope: 'ALL',
			applicable_products: [],
		})
		setViewMode('generate')
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const openGeneratorEdit = (c: any) => {
		setEditingCouponId(c._id)
		setUserSearchTerm('')
		setPartnerSearchTerm('')
		setProductSearchTerm('')
		setSelectedProductCategory('ALL')
		setShowProductModal(false)

		if (c.assigned_user?.user_id) {
			setBeneficiaryType('user')
			setSelectedUserId(String(c.assigned_user.user_id?._id || c.assigned_user.user_id))
		} else if (c.coupon_type === 'pro_partner' || c.partner_inquiry_id) {
			setBeneficiaryType('pro_partner')
			setSelectedPartnerId(String(c.partner_inquiry_id?._id || c.partner_inquiry_id || ''))
		} else if (c.assign_trainer?.trainer_id) {
			setBeneficiaryType('trainer')
			setSelectedTrainerId(String(c.assign_trainer.trainer_id))
		} else {
			setBeneficiaryType('general')
		}

		const applicableProductIds = Array.isArray(c.applicable_products)
			? c.applicable_products.map((p: any) => (p && p._id ? p._id : String(p)))
			: []

		setFormState({
			title: c.title || '',
			coupon_code: c.coupon_code || '',
			discount_type: c.discount_type || 'percent',
			discount: String(c.discount || 10),
			max_usage_count: String(c.max_usage_count || 1000),
			expired_at: c.expired_at ? DayJS(c.expired_at).format('YYYY-MM-DD') : '',
			scope: c.scope || (applicableProductIds.length > 0 ? 'SPECIFIC_PRODUCTS' : 'ALL'),
			applicable_products: applicableProductIds,
		})

		setViewMode('generate')
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	// Submit coupon
	const handleSubmitCoupon = async (e: React.FormEvent) => {
		e.preventDefault()

		const cleanCode = formState.coupon_code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
		if (!cleanCode) {
			toast.error('Coupon code is required and must contain alphanumeric characters')
			return
		}

		if (!formState.title.trim()) {
			toast.error('Coupon title/description is required')
			return
		}

		if (!formState.discount || Number(formState.discount) <= 0) {
			toast.error('Please enter a valid discount value')
			return
		}

		setSubmitting(true)
		try {
			let couponType: string = 'general'
			let assignedUser: any = undefined
			let partnerInquiryId: string | undefined = undefined
			let partnerName: string | undefined = undefined
			let partnerEmail: string | undefined = undefined
			let partnerMobile: string | undefined = undefined
			let assignTrainer: any = undefined

			if (beneficiaryType === 'user') {
				if (!selectedUserId || !selectedUserObject) {
					toast.error('Please search and select a registered customer user.')
					setSubmitting(false)
					return
				}
				couponType = 'user'
				assignedUser = {
					user_id: selectedUserObject._id,
					name: `${selectedUserObject.first_name || ''} ${selectedUserObject.last_name || ''}`.trim() || 'User',
					email: selectedUserObject.email || '',
					mobile: selectedUserObject.mobile || '',
				}
			} else if (beneficiaryType === 'pro_partner') {
				if (!selectedPartnerId || !selectedPartnerObject) {
					toast.error('Please choose an approved Pro Partner.')
					setSubmitting(false)
					return
				}
				couponType = 'pro_partner'
				partnerInquiryId = selectedPartnerObject._id
				partnerName = selectedPartnerObject.details?.full_name || selectedPartnerObject.name || 'Pro Partner'
				partnerEmail = selectedPartnerObject.details?.email || selectedPartnerObject.email || ''
				partnerMobile = selectedPartnerObject.details?.mobile || selectedPartnerObject.mobile || ''
				assignTrainer = {
					trainer_id: selectedPartnerObject._id,
					name: partnerName,
				}
			} else if (beneficiaryType === 'trainer') {
				if (!selectedTrainerId || !selectedTrainerObject) {
					toast.error('Please choose a fitness trainer.')
					setSubmitting(false)
					return
				}
				couponType = 'trainer'
				assignTrainer = {
					trainer_id: selectedTrainerObject.trainer_id,
					name: selectedTrainerObject.full_name,
				}
			}

			const payload: any = {
				coupon_code: cleanCode,
				title: formState.title.trim(),
				discount_type: formState.discount_type,
				discount: Number(formState.discount),
				max_usage_count: Number(formState.max_usage_count || 1000),
				expired_at: DayJS(formState.expired_at).format('YYYY/MM/DD'),
				scope: formState.scope,
				applicable_products:
					formState.scope === 'SPECIFIC_PRODUCTS' ? formState.applicable_products : [],
				coupon_type: couponType,
				assigned_user: assignedUser,
				partner_inquiry_id: partnerInquiryId,
				partner_name: partnerName,
				partner_email: partnerEmail,
				partner_mobile: partnerMobile,
				assign_trainer: assignTrainer,
			}

			if (editingCouponId) {
				payload.coupon_id = editingCouponId
				await UpdateReferralCoupon(payload)
				toast.success(`Coupon ${cleanCode} updated successfully`)
			} else {
				await CreateReferralCoupon(payload)
				toast.success(`Coupon ${cleanCode} generated and saved successfully`)
			}

			setViewMode('list')
			fetchCouponData()
		} catch (error: any) {
			toast.error(error?.response?.data?.message || error?.message || 'Failed to save coupon')
		} finally {
			setSubmitting(false)
		}
	}

	// Usage modal
	const openUsageModal = async (coupon: any) => {
		setSelectedCouponForUsage(coupon)
		setShowUsageModal(true)
		setUsageLoading(true)
		try {
			const res: any = await GetReferralCouponUsage({ coupon_id: coupon._id })
			const usageData = res?.data?.[0] || res?.data || {}
			const ordersList: any[] = Array.isArray(usageData?.orders)
				? usageData.orders
				: Array.isArray(usageData)
				? usageData
				: []
			setUsageOrders(ordersList)
		} catch (err) {
			console.error('Failed to load usage orders:', err)
			setUsageOrders([])
		} finally {
			setUsageLoading(false)
		}
	}

	const toggleProductInScope = (prodId: string) => {
		setFormState((prev) => {
			const exists = prev.applicable_products.includes(prodId)
			const updated = exists
				? prev.applicable_products.filter((id) => id !== prodId)
				: [...prev.applicable_products, prodId]
			return { ...prev, applicable_products: updated }
		})
	}

	const exportToExcel = () => {
		const worksheetData = filteredCoupons.map((c: any, idx: number) => ({
			'#': idx + 1,
			'Coupon Code': c.coupon_code || '',
			Title: c.title || '',
			'Beneficiary Type': c.coupon_type || 'General',
			'Assigned To': c.assigned_user?.name || c.partner_name || c.assign_trainer?.name || 'Storewide',
			Discount: `${c.discount || 0}${c.discount_type === 'percent' ? '%' : ' INR'}`,
			'Max Usage': c.max_usage_count || 1000,
			'Expiry Date': c.expired_at ? DayJS(c.expired_at).format('YYYY-MM-DD') : 'None',
		}))

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Coupons')
		XLSX.writeFile(workbook, `Gomzi_Coupons_${DayJS().format('YYYY-MM-DD')}.xlsx`)
	}

	return (
		<div className='gz-page-wrapper'>
			<PageTitle breadcrumbs={[]}>
				{viewMode === 'generate' ? 'Generate Referral Coupon' : 'Referral Coupons Management'}
			</PageTitle>

			{/* =========================================================================
			    VIEW MODE: 1. COUPON LIST & KPI DASHBOARD
			    ========================================================================= */}
			{viewMode === 'list' && (
				<>
					{/* Top Header Card */}
					<div className='gz-header-card'>
						<div className='gz-header-left'>
							<div className='gz-header-icon-box'>
								<i className='bi bi-tag'></i>
							</div>
							<div>
								<h2 className='gz-header-title'>Referral Coupons Management</h2>
								<div className='gz-header-subtitle'>
									Create user-assigned discount codes, track usage metrics, and link affiliate partners.
								</div>
							</div>
						</div>

						<div>
							<button
								type='button'
								onClick={openGeneratorNew}
								className='gz-btn-brown'>
								<i className='bi bi-plus-lg fs-6'></i>
								<span>Generate New Coupon</span>
							</button>
						</div>
					</div>

					{/* 4 KPI Summary Cards */}
					<div className='gz-kpi-grid'>
						<div className='gz-kpi-card kpi-accent-brown'>
							<div className='gz-kpi-top'>
								<span className='gz-kpi-label'>Total Coupons</span>
								<div className='gz-kpi-icon'>
									<i className='bi bi-tag'></i>
								</div>
							</div>
							<div className='gz-kpi-value'>{loading ? '...' : kpis.totalCoupons}</div>
							<div className='gz-kpi-desc'>Configured promotional coupons</div>
						</div>

						<div className='gz-kpi-card kpi-accent-amber'>
							<div className='gz-kpi-top'>
								<span className='gz-kpi-label'>User & Partner Coupons</span>
								<div className='gz-kpi-icon' style={{ background: '#FEF3C7', color: '#B45309' }}>
									<i className='bi bi-people'></i>
								</div>
							</div>
							<div className='gz-kpi-value' style={{ color: '#B45309' }}>
								{loading ? '...' : kpis.userCoupons}
							</div>
							<div className='gz-kpi-desc'>Coupons assigned to specific users</div>
						</div>

						<div className='gz-kpi-card kpi-accent-emerald'>
							<div className='gz-kpi-top'>
								<span className='gz-kpi-label'>Live & Active</span>
								<div className='gz-kpi-icon' style={{ background: '#ECFDF5', color: '#059669' }}>
									<i className='bi bi-check-circle'></i>
								</div>
							</div>
							<div className='gz-kpi-value' style={{ color: '#059669' }}>
								{loading ? '...' : kpis.liveCoupons}
							</div>
							<div className='gz-kpi-desc'>Currently valid for website checkout</div>
						</div>

						<div className='gz-kpi-card kpi-accent-stone'>
							<div className='gz-kpi-top'>
								<span className='gz-kpi-label'>Expired Coupons</span>
								<div className='gz-kpi-icon' style={{ background: '#F5F5F4', color: '#78716C' }}>
									<i className='bi bi-clock-history'></i>
								</div>
							</div>
							<div className='gz-kpi-value' style={{ color: '#78716C' }}>
								{loading ? '...' : kpis.expiredCoupons}
							</div>
							<div className='gz-kpi-desc'>Past validity expiry date</div>
						</div>
					</div>

					{/* Clean Filter & Toolbar Bar */}
					<div className='gz-filter-card'>
						<div className='gz-filter-row'>
							<div
								className='gz-search-bar-box'
								style={{ flex: '1 1 260px', minWidth: '220px' }}>
								<i className='bi bi-search'></i>
								<input
									type='text'
									className='gz-search-bar-input'
									placeholder='Search by code, user, phone...'
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value)
										setPagination((prev) => ({ ...prev, page: 1 }))
									}}
									style={{
										border: 'none',
										outline: 'none',
										background: 'transparent',
										boxShadow: 'none',
										width: '100%',
										height: '100%',
										padding: '0 4px',
									}}
								/>
							</div>

							<select
								className='gz-select'
								style={{ width: '165px' }}
								value={beneficiaryFilter}
								onChange={(e) => {
									setBeneficiaryFilter(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}>
								<option value='all'>All Beneficiaries</option>
								<option value='user'>Registered Users</option>
								<option value='partner'>RAG Pro Partners</option>
								<option value='trainer'>Fitness Trainers</option>
								<option value='general'>Storewide Coupons</option>
							</select>

							<select
								className='gz-select'
								style={{ width: '135px' }}
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}>
								<option value='all'>All Status</option>
								<option value='active'>Live & Active</option>
								<option value='expired'>Expired</option>
							</select>

							<select
								className='gz-select'
								style={{ width: '155px' }}
								value={dateRangeFilter}
								onChange={(e) => {
									setDateRangeFilter(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}>
								<option value='all'>All Expiry Dates</option>
								<option value='7days'>Expiring in 7 Days</option>
								<option value='30days'>Expiring in 30 Days</option>
							</select>

							<div className='d-flex align-items-center gap-2 ms-auto'>
								<span style={{ fontSize: '12px', fontWeight: 600, color: '#82756E', whiteSpace: 'nowrap' }}>Show:</span>
								<select
									className='gz-select'
									style={{ width: '70px', paddingRight: '20px' }}
									value={pagination.itemsPerPage}
									onChange={(e) =>
										setPagination((prev) => ({ ...prev, itemsPerPage: Number(e.target.value), page: 1 }))
									}>
									<option value='10'>10</option>
									<option value='25'>25</option>
									<option value='50'>50</option>
								</select>
							</div>

							<button
								type='button'
								onClick={exportToExcel}
								className='gz-btn-brown-outline'>
								<i className='bi bi-file-earmark-excel'></i>
								<span>Export Excel</span>
							</button>
						</div>
					</div>

					{/* Coupons Table Card */}
					<div className='gz-table-card'>
						<div className='table-responsive'>
							<table className='gz-table'>
								<thead>
									<tr>
										<th style={{ width: '50px' }}>#</th>
										<th>Coupon Code</th>
										<th>Title / Campaign</th>
										<th>Assigned Beneficiary</th>
										<th>Discount</th>
										<th>Validity / Expiry</th>
										<th>Usage Limit</th>
										<th>Product Scope</th>
										<th style={{ textAlign: 'right' }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{loading ? (
										Array.from({ length: 5 }).map((_, i) => (
											<tr key={`skel-${i}`}>
												<td colSpan={9} className='py-4 ps-4'>
													<div className='bg-light rounded' style={{ width: '100%', height: '24px' }} />
												</td>
											</tr>
										))
									) : paginatedCoupons.length === 0 ? (
										<tr>
											<td colSpan={9} className='text-center py-8'>
												<div className='d-flex flex-column align-items-center justify-content-center py-6'>
													<i className='bi bi-tag fs-1 mb-2' style={{ color: '#A89F99' }}></i>
													<span className='fw-bold fs-6' style={{ color: '#443B35' }}>No coupons found</span>
													<span className='fs-8' style={{ color: '#82756E' }}>Adjust your search or filter parameters.</span>
												</div>
											</td>
										</tr>
									) : (
										paginatedCoupons.map((c: any, idx: number) => {
											const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + idx + 1
											const isExpired = c.expired_at && new Date(c.expired_at).getTime() < new Date().getTime()
											const storeLink = `https://gomzinutrition.com/gomzi-supplement?coupon_code=${c.coupon_code}`

											return (
												<tr key={c._id || idx}>
													<td style={{ color: '#82756E', fontWeight: 600 }}>{actualIndex}</td>

													{/* Coupon Code */}
													<td>
														<div className='d-inline-flex align-items-center gap-2'>
															<span className='gz-code-badge'>
																{c.coupon_code}
															</span>
															<CopyButton text={c.coupon_code} title="Copy coupon code" />
														</div>
													</td>

													{/* Title */}
													<td>
														<div className='fw-bold' style={{ color: '#261E1A', fontSize: '13px' }}>{c.title}</div>
														<div style={{ color: '#82756E', fontSize: '11px', marginTop: '2px' }}>
															Created: {DayJS(c.createdAt).format('DD MMM YYYY')}
														</div>
													</td>

													{/* Beneficiary */}
													<td>
														{c.assigned_user?.user_id || c.coupon_type === 'user' ? (
															<div>
																<span className='gz-badge-user mb-1'>
																	<i className='bi bi-person me-1'></i>User
																</span>
																<div className='fw-bold' style={{ color: '#261E1A', fontSize: '13px' }}>
																	{c.assigned_user?.name || 'Customer'}
																</div>
																<div style={{ color: '#82756E', fontSize: '11px' }}>
																	{c.assigned_user?.mobile || c.assigned_user?.email || 'N/A'}
																</div>
															</div>
														) : c.coupon_type === 'pro_partner' || c.partner_inquiry_id || c.partner_name ? (
															<div>
																<div className='d-flex align-items-center gap-2 mb-1'>
																	<span className='gz-badge-partner'>
																		<i className='bi bi-gem me-1'></i>Pro Partner
																	</span>
																	<Link
																		to={`/rag/pro-partner/coupons?partner_id=${c.partner_inquiry_id?._id || c.partner_inquiry_id || ''}`}
																		className='badge fw-bold fs-9 text-decoration-none'
																		style={{ background: '#FEF3C7', color: '#78350F' }}
																		title='View Pro Partner Portal for this user'>
																		View Portal &gt;
																	</Link>
																</div>
																<div className='fw-bold' style={{ color: '#261E1A', fontSize: '13px' }}>
																	{c.partner_name || c.partner_inquiry_id?.name || c.assign_trainer?.name || 'Pro Partner'}
																</div>
																<div style={{ color: '#82756E', fontSize: '11px' }}>
																	{c.partner_mobile || c.partner_email || ''}
																</div>
															</div>
														) : c.assign_trainer?.name && c.assign_trainer.name !== 'N/A' ? (
															<div>
																<span className='gz-badge-trainer mb-1'>
																	<i className='bi bi-person-check me-1'></i>Trainer
																</span>
																<div className='fw-bold' style={{ color: '#261E1A', fontSize: '13px' }}>
																	{c.assign_trainer.name}
																</div>
															</div>
														) : (
															<div>
																<span className='gz-badge-general mb-1'>
																	<i className='bi bi-shop me-1'></i>Storewide
																</span>
																<div style={{ color: '#82756E', fontSize: '11px' }}>Open public code</div>
															</div>
														)}
													</td>

													{/* Discount */}
													<td>
														<span className='gz-discount-pill'>
															{c.discount}{c.discount_type === 'percent' ? '% Off' : ' ₹ Off'}
														</span>
													</td>

													{/* Expiry */}
													<td>
														<div className='d-flex flex-column'>
															<span className='fw-bold' style={{ color: '#261E1A', fontSize: '13px' }}>
																{c.expired_at ? DayJS(c.expired_at).format('DD MMM YYYY') : 'No Expiry'}
															</span>
															{isExpired ? (
																<span className='gz-status-expired mt-1' style={{ width: 'fit-content' }}>
																	Expired
																</span>
															) : (
																<span className='gz-status-live mt-1' style={{ width: 'fit-content' }}>
																	Live & Active
																</span>
															)}
														</div>
													</td>

													{/* Usage Limit */}
													<td>
														<div className='d-flex flex-column'>
															<span className='fw-bold' style={{ color: '#261E1A', fontSize: '13px' }}>
																Max: {c.max_usage_count || 1000}
															</span>
															<span style={{ color: '#82756E', fontSize: '11px' }}>1 per user</span>
														</div>
													</td>

													{/* Product Scope */}
													<td>
														{c.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(c.applicable_products) && c.applicable_products.length > 0 ? (
															<span className='gz-badge-user'>
																<i className='bi bi-box-seam me-1'></i>{c.applicable_products.length} Products
															</span>
														) : (
															<span style={{ color: '#82756E', fontSize: '12px' }}>All Store Products</span>
														)}
													</td>

													{/* Actions */}
													<td style={{ textAlign: 'right' }}>
														<div className='gz-actions-wrap'>
															<button
																type='button'
																onClick={() => openUsageModal(c)}
																className='gz-action-btn'
																title='View Usage & Orders History'>
																<i className='bi bi-receipt' style={{ color: '#FFFFFF' }}></i>
															</button>

															<button
																type='button'
																onClick={() => openGeneratorEdit(c)}
																className='gz-action-btn'
																title='Edit Coupon'>
																<i className='bi bi-pencil' style={{ color: '#FFFFFF' }}></i>
															</button>

															<button
																type='button'
																onClick={() => {
																	navigator.clipboard.writeText(storeLink)
																	toast.success('Store link copied!')
																}}
																className='gz-action-btn'
																title='Copy Store Link'>
																<i className='bi bi-link-45deg' style={{ color: '#FFFFFF' }}></i>
															</button>
														</div>
													</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Footer */}
						<div className='p-4 border-top d-flex justify-content-end' style={{ background: '#FAF6F2' }}>
							<UsersListPagination
								totalPages={Math.ceil(filteredCoupons.length / pagination.itemsPerPage) || 1}
								currentPage={pagination.page}
								onPageChange={(page: number) => setPagination((prev) => ({ ...prev, page }))}
							/>
						</div>
					</div>
				</>
			)}

			{/* =========================================================================
			    VIEW MODE: 2. DEDICATED FULL-PAGE GENERATOR FORM
			    ========================================================================= */}
			{viewMode === 'generate' && (
				<div className='gz-generator-card'>
					{/* Header */}
					<div className='gz-generator-top'>
						<div className='d-flex align-items-center gap-3 flex-wrap'>
							<button
								type='button'
								onClick={() => setViewMode('list')}
								className='gz-btn-brown-outline'
								style={{ padding: '6px 14px', fontSize: '13px' }}>
								<i className='bi bi-arrow-left'></i>
								<span>Back to Coupons</span>
							</button>

							<div className='d-flex align-items-center gap-3'>
								<div
									style={{
										width: '38px',
										height: '38px',
										borderRadius: '8px',
										background: '#78350F',
										color: '#FFFFFF',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '18px',
										flexShrink: 0,
										boxShadow: '0 2px 6px rgba(120, 53, 15, 0.25)',
									}}>
									<i className='bi bi-ticket-perforated-fill' style={{ color: '#FFFFFF' }}></i>
								</div>
								<div>
									<h3 className='gz-header-title' style={{ fontSize: '17px', margin: 0 }}>
										{editingCouponId ? 'Edit Referral Coupon' : 'Generate New Referral Coupon'}
									</h3>
									<div className='gz-header-subtitle' style={{ fontSize: '12px', marginTop: '2px' }}>
										Select beneficiary, assign discount percentage, set expiry date, and choose applicable products.
									</div>
								</div>
							</div>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<button
								type='button'
								onClick={() => setViewMode('list')}
								className='gz-btn-brown-outline'
								style={{ padding: '7px 14px', fontSize: '13px' }}>
								Cancel
							</button>

							<button
								type='button'
								onClick={handleSubmitCoupon}
								disabled={submitting}
								className='gz-btn-brown'
								style={{ padding: '8px 18px', fontSize: '13px' }}>
								<i className='bi bi-check-lg' style={{ color: '#FFFFFF' }}></i>
								<span>{editingCouponId ? 'Update Coupon' : 'Save & Generate Coupon'}</span>
							</button>
						</div>
					</div>

					<div className='p-3 p-md-4'>
						<form onSubmit={handleSubmitCoupon}>
							<div className='row g-3 g-xl-4'>
								{/* LEFT COLUMN: Beneficiary, Code, Discount */}
								<div className='col-lg-6'>
									{/* Step 1: Beneficiary Type */}
									<div className='gz-step-box'>
										<div className='gz-step-header'>
											<div className='gz-step-num'>1</div>
											<h4 className='gz-step-title'>
												Select Beneficiary (User / Partner / Storewide)
											</h4>
										</div>
										<div>
											<div className='row g-2 mb-3'>
												<div className='col-6 col-sm-3'>
													<button
														type='button'
														onClick={() => setBeneficiaryType('user')}
														className={`gz-beneficiary-btn ${
															beneficiaryType === 'user' ? 'is-active' : ''
														}`}>
														<div className='gz-beneficiary-icon-box'>
															<i className='bi bi-person' style={{ color: '#FFFFFF' }}></i>
														</div>
														<div className='min-w-0'>
															<div className='gz-b-title text-truncate'>Registered User</div>
															<div className='gz-b-sub text-truncate'>Customer</div>
														</div>
													</button>
												</div>

												<div className='col-6 col-sm-3'>
													<button
														type='button'
														onClick={() => setBeneficiaryType('pro_partner')}
														className={`gz-beneficiary-btn ${
															beneficiaryType === 'pro_partner' ? 'is-active' : ''
														}`}>
														<div className='gz-beneficiary-icon-box'>
															<i className='bi bi-gem' style={{ color: '#FFFFFF' }}></i>
														</div>
														<div className='min-w-0'>
															<div className='gz-b-title text-truncate'>Pro Partner</div>
															<div className='gz-b-sub text-truncate'>Affiliate</div>
														</div>
													</button>
												</div>

												<div className='col-6 col-sm-3'>
													<button
														type='button'
														onClick={() => setBeneficiaryType('trainer')}
														className={`gz-beneficiary-btn ${
															beneficiaryType === 'trainer' ? 'is-active' : ''
														}`}>
														<div className='gz-beneficiary-icon-box'>
															<i className='bi bi-person-check' style={{ color: '#FFFFFF' }}></i>
														</div>
														<div className='min-w-0'>
															<div className='gz-b-title text-truncate'>Trainer</div>
															<div className='gz-b-sub text-truncate'>Gym Staff</div>
														</div>
													</button>
												</div>

												<div className='col-6 col-sm-3'>
													<button
														type='button'
														onClick={() => setBeneficiaryType('general')}
														className={`gz-beneficiary-btn ${
															beneficiaryType === 'general' ? 'is-active' : ''
														}`}>
														<div className='gz-beneficiary-icon-box'>
															<i className='bi bi-shop' style={{ color: '#FFFFFF' }}></i>
														</div>
														<div className='min-w-0'>
															<div className='gz-b-title text-truncate'>Storewide</div>
															<div className='gz-b-sub text-truncate'>Public Code</div>
														</div>
													</button>
												</div>
											</div>

											{/* User Dropdown */}
											{beneficiaryType === 'user' && (
												<div className='p-2.5 rounded' style={{ background: '#FFFFFF', border: '1.5px solid #EFE4DC' }}>
													<label className='form-label fw-bold mb-1.5 text-uppercase' style={{ color: '#78350F', fontSize: '11px' }}>
														Search & Select Customer User:
													</label>
													<div className='row g-2'>
														<div className='col-md-6'>
															<div className='gz-search-bar-box w-100' style={{ height: '38px' }}>
																<i className='bi bi-search' style={{ fontSize: '13px' }}></i>
																<input
																	type='text'
																	className='gz-search-bar-input'
																	placeholder='Filter user by name, phone...'
																	value={userSearchTerm}
																	onChange={(e) => setUserSearchTerm(e.target.value)}
																	style={{
																		border: 'none',
																		outline: 'none',
																		background: 'transparent',
																		boxShadow: 'none',
																		width: '100%',
																		height: '100%',
																		padding: '0 4px',
																		fontSize: '12.5px',
																	}}
																/>
															</div>
														</div>
														<div className='col-md-6'>
															<select
																className='gz-select w-100'
																style={{ height: '38px', fontSize: '12px' }}
																value={selectedUserId}
																onChange={(e) => setSelectedUserId(e.target.value)}>
																<option value=''>
																	{filteredUsersList.length === 0
																		? '-- No Users Found --'
																		: `-- Choose User (${filteredUsersList.length} Available) --`}
																</option>
																{filteredUsersList.map((u) => (
																	<option key={u._id} value={u._id}>
																		{u.first_name} {u.last_name} {u.mobile ? `(${u.mobile})` : ''} {u.email ? `• ${u.email}` : ''}
																	</option>
																))}
															</select>
														</div>
													</div>

													{selectedUserObject && (
														<div className='d-flex align-items-center justify-content-between p-2 mt-2 rounded' style={{ border: '1.5px solid #78350F', background: '#FAF6F2' }}>
															<div>
																<span className='fw-bold' style={{ color: '#261E1A', fontSize: '12.5px' }}>
																	{selectedUserObject.first_name} {selectedUserObject.last_name}
																</span>
																<span style={{ color: '#82756E', fontSize: '11.5px', marginLeft: '8px' }}>
																	{selectedUserObject.mobile || 'No Mobile'} • {selectedUserObject.email || 'No Email'}
																</span>
															</div>
															<button
																type='button'
																onClick={handleAutoFillCode}
																className='gz-btn-brown-outline'
																style={{ padding: '2px 8px', fontSize: '11px', height: '26px' }}>
																<i className='bi bi-magic me-1'></i>Auto Code
															</button>
														</div>
													)}
												</div>
											)}

											{/* Pro Partner Dropdown */}
											{beneficiaryType === 'pro_partner' && (
												<div className='p-2.5 rounded' style={{ background: '#FFFFFF', border: '1.5px solid #EFE4DC' }}>
													<label className='form-label fw-bold mb-1.5 text-uppercase' style={{ color: '#78350F', fontSize: '11px' }}>
														Search & Select Approved Pro Partner:
													</label>
													<div className='row g-2'>
														<div className='col-md-6'>
															<div className='gz-search-bar-box w-100' style={{ height: '38px' }}>
																<i className='bi bi-search' style={{ fontSize: '13px' }}></i>
																<input
																	type='text'
																	className='gz-search-bar-input'
																	placeholder='Filter partner by name, phone...'
																	value={partnerSearchTerm}
																	onChange={(e) => setPartnerSearchTerm(e.target.value)}
																	style={{
																		border: 'none',
																		outline: 'none',
																		background: 'transparent',
																		boxShadow: 'none',
																		width: '100%',
																		height: '100%',
																		padding: '0 4px',
																		fontSize: '12.5px',
																	}}
																/>
															</div>
														</div>
														<div className='col-md-6'>
															<select
																className='gz-select w-100'
																style={{ height: '38px', fontSize: '12px' }}
																value={selectedPartnerId}
																onChange={(e) => setSelectedPartnerId(e.target.value)}>
																<option value=''>
																	{filteredPartnersList.length === 0
																		? '-- No Partners Found --'
																		: `-- Choose Partner (${filteredPartnersList.length} Available) --`}
																</option>
																{filteredPartnersList.map((p) => {
																	const d = p.details || {}
																	const name = (d.full_name || p.name || 'Partner #' + String(p._id).slice(-4)).trim()
																	const mobile = (d.mobile || p.mobile || '').trim()
																	const email = (d.email || p.email || '').trim()
																	const isApproved = p.partner_status === 'approved' || Boolean(p.partner_policy?.accepted_at)
																	return (
																		<option key={p._id} value={p._id}>
																			{name} {mobile ? `(${mobile})` : (email ? `(${email})` : '')} {isApproved ? '✓ [Approved]' : '[Partner]'}
																		</option>
																	)
																})}
															</select>
														</div>
													</div>

													{selectedPartnerObject && (
														<div className='d-flex align-items-center justify-content-between p-2 mt-2 rounded' style={{ border: '1.5px solid #78350F', background: '#FAF6F2' }}>
															<div>
																<span className='fw-bold' style={{ color: '#261E1A', fontSize: '12.5px' }}>
																	{selectedPartnerObject.details?.full_name || selectedPartnerObject.name}
																</span>
																<span style={{ color: '#82756E', fontSize: '11.5px', marginLeft: '8px' }}>
																	{selectedPartnerObject.details?.mobile || selectedPartnerObject.mobile || 'No Mobile'} • Status: {selectedPartnerObject.partner_status || 'Approved'}
																</span>
															</div>
															<button
																type='button'
																onClick={handleAutoFillCode}
																className='gz-btn-brown-outline'
																style={{ padding: '2px 8px', fontSize: '11px', height: '26px' }}>
																<i className='bi bi-magic me-1'></i>Auto Code
															</button>
														</div>
													)}
												</div>
											)}

											{/* Trainer Dropdown */}
											{beneficiaryType === 'trainer' && (
												<div className='p-2.5 rounded' style={{ background: '#FFFFFF', border: '1.5px solid #EFE4DC' }}>
													<label className='form-label fw-bold mb-1.5 text-uppercase' style={{ color: '#78350F', fontSize: '11px' }}>
														Select Fitness Trainer:
													</label>
													<select
														className='gz-select w-100'
														style={{ height: '38px', fontSize: '12px' }}
														value={selectedTrainerId}
														onChange={(e) => setSelectedTrainerId(e.target.value)}>
														<option value=''>
															{trainerData.length === 0
																? '-- No Trainers Available --'
																: `-- Choose Trainer (${trainerData.length} Available) --`}
														</option>
														{trainerData.map((t) => (
															<option key={t.trainer_id || t._id} value={t.trainer_id || t._id}>
																{t.full_name || t.name} {t.mobile ? `(${t.mobile})` : ''}
															</option>
														))}
													</select>

													{selectedTrainerObject && (
														<div className='d-flex align-items-center justify-content-between p-2 mt-2 rounded' style={{ border: '1.5px solid #78350F', background: '#FAF6F2' }}>
															<div>
																<span className='fw-bold' style={{ color: '#261E1A', fontSize: '12.5px' }}>
																	{selectedTrainerObject.full_name || selectedTrainerObject.name}
																</span>
																<span style={{ color: '#82756E', fontSize: '11.5px', marginLeft: '8px' }}>
																	ID: {selectedTrainerObject.trainer_id || selectedTrainerObject._id} • {selectedTrainerObject.mobile || 'No Mobile'}
																</span>
															</div>
															<button
																type='button'
																onClick={handleAutoFillCode}
																className='gz-btn-brown-outline'
																style={{ padding: '2px 8px', fontSize: '11px', height: '26px' }}>
																<i className='bi bi-magic me-1'></i>Auto Code
															</button>
														</div>
													)}
												</div>
											)}
										</div>
									</div>

									{/* Step 2: Code & Title */}
									<div className='gz-step-box'>
										<div className='gz-step-header'>
											<div className='gz-step-num'>2</div>
											<h4 className='gz-step-title'>
												Coupon Code & Campaign Title
											</h4>
										</div>
										<div className='row g-2.5'>
											<div className='col-md-5'>
												<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
													Coupon Code: <span className='text-danger'>*</span>
												</label>
												<div className='d-flex gap-1.5 align-items-center'>
													<input
														type='text'
														className='gz-input font-monospace fw-bold'
														style={{ textTransform: 'uppercase', height: '38px', fontSize: '13px' }}
														placeholder='e.g. RAGSUMIT10'
														value={formState.coupon_code}
														onChange={(e) =>
															setFormState({
																...formState,
																coupon_code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
															})
														}
														required
													/>
													<button
														type='button'
														onClick={handleAutoFillCode}
														className='gz-btn-brown d-inline-flex align-items-center gap-1.5'
														style={{ height: '38px', padding: '0 12px', whiteSpace: 'nowrap', fontSize: '12px' }}>
														<i className='bi bi-magic' style={{ color: '#FFFFFF' }}></i>
														<span>Auto</span>
													</button>
												</div>
											</div>

											<div className='col-md-7'>
												<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
													Campaign Title: <span className='text-danger'>*</span>
												</label>
												<input
													type='text'
													className='gz-input'
													style={{ height: '38px', fontSize: '13px' }}
													placeholder='e.g. 10% Welcome Discount for Sumit'
													value={formState.title}
													onChange={(e) => setFormState({ ...formState, title: e.target.value })}
													required
												/>
											</div>
										</div>
									</div>
											{/* Step 5: Usage Limits */}
											<div className='gz-step-box'>
												<div className='gz-step-header'>
													<div className='gz-step-num'>5</div>
													<h4 className='gz-step-title'>
														Usage Limits
													</h4>
												</div>
												<div>
													<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
														Max Uses:
													</label>
													<input
														type='number'
														className='gz-input'
														style={{ height: '36px', fontSize: '13px' }}
														value={formState.max_usage_count}
														onChange={(e) => setFormState({ ...formState, max_usage_count: e.target.value })}
														required
													/>
													<div style={{ color: '#82756E', fontSize: '11px', marginTop: '3px' }}>
														Total orders redemption limit.
													</div>
												</div>
											</div>
								</div>

								{/* RIGHT COLUMN: Discount, Validity, Usage Limits & Product Scope */}
								<div className='col-lg-6'>
									{/* Step 3: Discount Configuration */}
									<div className='gz-step-box'>
										<div className='gz-step-header'>
											<div className='gz-step-num'>3</div>
											<h4 className='gz-step-title'>
												Discount Amount & Type
											</h4>
										</div>
										<div className='row g-2.5 align-items-center mb-2'>
											<div className='col-md-7'>
												<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
													Discount Type:
												</label>
												<div className='d-flex gap-2'>
													<button
														type='button'
														onClick={() => setFormState({ ...formState, discount_type: 'percent' })}
														className={`gz-scope-btn ${
															formState.discount_type === 'percent' ? 'is-active' : ''
														}`}
														style={{ height: '36px', fontSize: '12px' }}>
														Percentage (%)
													</button>
													<button
														type='button'
														onClick={() => setFormState({ ...formState, discount_type: 'flat' })}
														className={`gz-scope-btn ${
															formState.discount_type === 'flat' ? 'is-active' : ''
														}`}
														style={{ height: '36px', fontSize: '12px' }}>
														Flat Amount (₹)
													</button>
												</div>
											</div>

											<div className='col-md-5'>
												<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
													Discount Value:
												</label>
												<input
													type='number'
													className='gz-input fw-bold'
													style={{ height: '36px', fontSize: '13px' }}
													placeholder='10'
													value={formState.discount}
													onChange={(e) => setFormState({ ...formState, discount: e.target.value })}
													required
												/>
											</div>
										</div>

										{formState.discount_type === 'percent' && (
											<div className='d-flex align-items-center gap-1.5 pt-2 border-top' style={{ borderColor: '#EFE4DC' }}>
												<span className='fs-8 fw-bold' style={{ color: '#82756E', marginRight: '4px' }}>Presets:</span>
												{['5', '10', '15', '20', '25'].map((pct) => (
													<button
														key={pct}
														type='button'
														onClick={() => setFormState({ ...formState, discount: pct })}
														className={`gz-pill-brown ${
															formState.discount === pct ? 'is-active' : ''
														}`}>
														{pct}%
													</button>
												))}
											</div>
										)}
									</div>

									{/* Step 4: Validity & Expiry */}
									<div className='gz-step-box'>
										<div className='gz-step-header'>
											<div className='gz-step-num'>4</div>
											<h4 className='gz-step-title'>
												Expiry Date & Validity
											</h4>
										</div>
										<div>
											<div className='mb-2'>
												<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
													Valid Until: <span className='text-danger'>*</span>
												</label>
												<input
													type='date'
													className='gz-input fw-bold'
													style={{ height: '38px', fontSize: '13px' }}
													value={formState.expired_at}
													onChange={(e) => setFormState({ ...formState, expired_at: e.target.value })}
													required
												/>
											</div>

											<div className='d-flex align-items-center gap-1.5 flex-wrap pt-1'>
												<button
													type='button'
													onClick={() => setFormState({ ...formState, expired_at: DayJS().add(30, 'day').format('YYYY-MM-DD') })}
													className='gz-pill-brown'>
													+30 Days
												</button>
												<button
													type='button'
													onClick={() => setFormState({ ...formState, expired_at: DayJS().add(90, 'day').format('YYYY-MM-DD') })}
													className='gz-pill-brown'>
													+90 Days
												</button>
												<button
													type='button'
													onClick={() => setFormState({ ...formState, expired_at: DayJS().add(6, 'month').format('YYYY-MM-DD') })}
													className='gz-pill-brown'>
													+6 Months
												</button>
												<button
													type='button'
													onClick={() => setFormState({ ...formState, expired_at: DayJS().add(1, 'year').format('YYYY-MM-DD') })}
													className='gz-pill-brown'>
													+1 Year
												</button>
											</div>
										</div>
									</div>
											{/* Step 6: Product Scope */}
											<div className='gz-step-box'>
												<div className='gz-step-header'>
													<div className='gz-step-num'>6</div>
													<h4 className='gz-step-title'>
														Product Scope
													</h4>
												</div>
												<div>
													<div className='d-flex gap-1.5 mb-2'>
														<button
															type='button'
															onClick={() => setFormState({ ...formState, scope: 'ALL' })}
															className={`gz-scope-btn ${
																formState.scope === 'ALL' ? 'is-active' : ''
															}`}
															style={{ height: '36px', fontSize: '11.5px', padding: '0 8px' }}>
															All Products
														</button>
														<button
															type='button'
															onClick={() => setFormState({ ...formState, scope: 'SPECIFIC_PRODUCTS' })}
															className={`gz-scope-btn ${
																formState.scope === 'SPECIFIC_PRODUCTS' ? 'is-active' : ''
															}`}
															style={{ height: '36px', fontSize: '11.5px', padding: '0 8px' }}>
															Specific ({formState.applicable_products.length})
														</button>
													</div>

													{formState.scope === 'SPECIFIC_PRODUCTS' && (
														<button
															type='button'
															onClick={() => setShowProductModal(true)}
															className='gz-btn-brown w-100 d-inline-flex align-items-center justify-content-center gap-1'
															style={{ height: '28px', fontSize: '11.5px' }}>
															<i className='bi bi-grid-3x3-gap-fill' style={{ color: '#FFFFFF' }}></i>
															<span>Select Products</span>
														</button>
													)}
												</div>
											</div>

									{/* Selected Product Summary Tray (if specific products chosen) */}
									{formState.scope === 'SPECIFIC_PRODUCTS' && formState.applicable_products.length > 0 && (
										<div className='gz-step-box mt-2 mb-0'>
											<div className='d-flex align-items-center justify-content-between mb-1'>
												<span className='fs-8 fw-bold' style={{ color: '#78350F' }}>
													Selected Items ({formState.applicable_products.length}):
												</span>
												<button
													type='button'
													onClick={handleClearAllSelected}
													className='btn btn-link p-0 text-danger fs-8 fw-bold text-decoration-none'>
													Clear All
												</button>
											</div>
											<div className='gz-selected-products-tray' style={{ maxHeight: '80px' }}>
												{selectedProductsObjects.map((p) => {
													const imgUrl = getProductImageUrl(p)
													return (
														<div key={p._id} className='gz-selected-chip'>
															{imgUrl ? (
																<img
																	src={imgUrl}
																	alt={p.title || p.name}
																	className='gz-selected-chip-thumb'
																	onError={(e) => {
																		;(e.target as HTMLElement).style.display = 'none'
																	}}
																/>
															) : (
																<i className='bi bi-box-seam text-muted fs-8'></i>
															)}
															<span className='gz-selected-chip-title' title={p.title || p.name}>
																{p.title || p.name}
															</span>
															<span className='gz-selected-chip-price'>
																₹{p.price || 0}
															</span>
															<button
																type='button'
																className='gz-selected-chip-del'
																title='Remove'
																onClick={() => handleRemoveSingleProduct(p._id)}>
																<i className='bi bi-x'></i>
															</button>
														</div>
													)
												})}
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Bottom Action Footer */}
							<div className='d-flex align-items-center justify-content-end gap-3 pt-3 mt-1 border-top' style={{ borderColor: '#EFE4DC' }}>
								<button
									type='button'
									onClick={() => setViewMode('list')}
									className='gz-btn-brown-outline'
									style={{ padding: '7px 16px', fontSize: '13px' }}>
									Cancel
								</button>

								<button
									type='submit'
									disabled={submitting}
									className='gz-btn-brown px-5'
									style={{ padding: '8px 20px', fontSize: '13.5px' }}>
									<i className='bi bi-check-lg' style={{ color: '#FFFFFF' }}></i>
									<span>{editingCouponId ? 'Update Coupon' : 'Save & Generate Coupon'}</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* =========================================================================
			    MODAL: BROWSE & SELECT SPECIFIC PRODUCTS WITH PICTURES & CATEGORY FILTER
			    ========================================================================= */}
			<Modal
				show={showProductModal}
				onHide={() => setShowProductModal(false)}
				size='xl'
				centered
				scrollable>
				<Modal.Header closeButton style={{ borderBottom: '1.5px solid #EFE4DC', background: '#FDF9F5' }}>
					<div className='d-flex align-items-center justify-content-between w-100 pe-4 flex-wrap gap-2'>
						<div className='d-flex align-items-center gap-2'>
							<div
								style={{
									width: '34px',
									height: '34px',
									borderRadius: '8px',
									background: '#FEF3C7',
									color: '#78350F',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '16px',
								}}>
								<i className='bi bi-boxes'></i>
							</div>
							<div>
								<Modal.Title className='fs-6 fw-bold mb-0' style={{ color: '#261E1A' }}>
									Select Applicable Products
								</Modal.Title>
								<div style={{ color: '#82756E', fontSize: '12px' }}>
									Choose which catalog products this coupon discount can be redeemed for
								</div>
							</div>
						</div>

						<span className='gz-discount-pill' style={{ background: '#78350F', color: '#FFFFFF' }}>
							{formState.applicable_products.length} Products Selected
						</span>
					</div>
				</Modal.Header>

				<Modal.Body className='py-3' style={{ background: '#FFFFFF' }}>
					{/* Modal Filter Bar */}
					<div className='mb-3'>
						<div className='d-flex align-items-center gap-3 flex-wrap mb-2'>
							{/* Product Search Input */}
							<div className='gz-search-bar-box flex-grow-1' style={{ minWidth: '220px', height: '38px' }}>
								<i className='bi bi-search'></i>
								<input
									type='text'
									className='gz-search-bar-input'
									placeholder='Filter product by name, price...'
									value={productSearchTerm}
									onChange={(e) => setProductSearchTerm(e.target.value)}
									style={{
										border: 'none',
										outline: 'none',
										background: 'transparent',
										boxShadow: 'none',
										width: '100%',
										height: '100%',
										padding: '0 4px',
									}}
								/>
							</div>

							{/* Bulk Select / Clear Actions */}
							<div className='d-flex align-items-center gap-2'>
								<button
									type='button'
									onClick={handleSelectAllFiltered}
									className='gz-btn-brown-outline'
									style={{ padding: '6px 12px', fontSize: '12px' }}>
									<i className='bi bi-check-all me-1'></i>
									Select All Filtered ({filteredProductsList.length})
								</button>

								{formState.applicable_products.length > 0 && (
									<button
										type='button'
										onClick={handleClearAllSelected}
										className='gz-btn-brown-outline text-danger'
										style={{ padding: '6px 12px', fontSize: '12px' }}>
										<i className='bi bi-trash me-1'></i>
										Clear ({formState.applicable_products.length})
									</button>
								)}
							</div>
						</div>

						{/* Category Pills Bar */}
						{productCategories.length > 1 && (
							<div className='gz-cat-pills-wrap'>
								{productCategories.map((cat) => {
									const isActive = selectedProductCategory === cat
									return (
										<button
											key={cat}
											type='button'
											onClick={() => setSelectedProductCategory(cat)}
											className={`gz-cat-pill ${isActive ? 'is-active' : ''}`}>
											{cat}
										</button>
									)
								})}
							</div>
						)}
					</div>

					{/* Products Grid with Pictures */}
					{filteredProductsList.length === 0 ? (
						<div className='text-center py-5' style={{ color: '#82756E' }}>
							<i className='bi bi-box-seam fs-1 d-block mb-2' style={{ color: '#D7C3B5' }}></i>
							<div className='fw-bold fs-7'>No products matched your criteria</div>
							<div className='fs-8'>Try searching for a different keyword or select "ALL" categories</div>
						</div>
					) : (
						<div className='gz-product-grid'>
							{filteredProductsList.map((p) => {
								const isChecked = formState.applicable_products.includes(p._id)
								const imgUrl = getProductImageUrl(p)
								const categoryLabel =
									Array.isArray(p.categories) && p.categories.length > 0
										? p.categories[0]
										: p.category?.title || p.category?.name || p.category || 'General'

								return (
									<div
										key={p._id}
										onClick={() => toggleProductInScope(p._id)}
										className={`gz-product-card ${isChecked ? 'is-selected' : ''}`}>
										{/* Product Thumbnail */}
										<div className='gz-product-img-wrap'>
											{imgUrl ? (
												<img
													src={imgUrl}
													alt={p.title || p.name}
													loading='lazy'
													onError={(e) => {
														;(e.target as HTMLElement).style.display = 'none'
													}}
												/>
											) : (
												<i className='bi bi-box-seam'></i>
											)}
										</div>

										{/* Product Details */}
										<div className='gz-product-info'>
											<div className='gz-product-name' title={p.title || p.name}>
												{p.title || p.name}
											</div>
											<div className='gz-product-cat'>{categoryLabel}</div>
											<div className='gz-product-price'>
												₹{(p.price || 0).toLocaleString('en-IN')}
											</div>
										</div>

										{/* Styled Checkbox */}
										<div className='gz-product-checkbox'>
											{isChecked && <i className='bi bi-check-lg fs-7'></i>}
										</div>
									</div>
								)
							})}
						</div>
					)}
				</Modal.Body>

				<Modal.Footer
					className='d-flex align-items-center justify-content-between py-3 px-4'
					style={{ borderTop: '1.5px solid #EFE4DC', background: '#FDF9F5' }}>
					<div className='fw-bold fs-7' style={{ color: '#78350F' }}>
						<i className='bi bi-check2-circle me-1'></i>
						{formState.applicable_products.length} Products Selected
					</div>

					<div className='d-flex align-items-center gap-2'>
						<button
							type='button'
							className='gz-btn-brown-outline'
							onClick={() => setShowProductModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='gz-btn-brown'
							onClick={() => setShowProductModal(false)}>
							<i className='bi bi-check-lg me-1'></i>
							Done ({formState.applicable_products.length})
						</button>
					</div>
				</Modal.Footer>
			</Modal>

			{/* =========================================================================
			    MODAL: VIEW USAGE & ORDERS HISTORY
			    ========================================================================= */}
			<Modal
				show={showUsageModal}
				onHide={() => setShowUsageModal(false)}
				size='lg'
				centered>
				<Modal.Header closeButton style={{ borderBottom: '1.5px solid #EFE4DC', background: '#FDF9F5' }}>
					<Modal.Title className='fs-6 fw-bold' style={{ color: '#261E1A' }}>
						<i className='bi bi-receipt me-2' style={{ color: '#78350F' }}></i>
						Coupon Usage: <span className='gz-code-badge ms-1'>{selectedCouponForUsage?.coupon_code}</span>
					</Modal.Title>
				</Modal.Header>
				<Modal.Body className='py-4' style={{ background: '#FFFFFF' }}>
					{selectedCouponForUsage && (
						<div className='p-3 rounded mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2' style={{ background: '#FAF6F2', border: '1px solid #EFE4DC' }}>
							<div>
								<div className='fw-bold fs-6' style={{ color: '#261E1A' }}>{selectedCouponForUsage.title}</div>
								<div style={{ color: '#82756E', fontSize: '12px' }}>
									Assigned: {selectedCouponForUsage.assigned_user?.name || selectedCouponForUsage.partner_name || selectedCouponForUsage.assign_trainer?.name || 'Storewide'}
								</div>
							</div>
							<span className='gz-discount-pill'>
								{selectedCouponForUsage.discount}% Off
							</span>
						</div>
					)}

					<div className='table-responsive'>
						<table className='table table-sm table-row-dashed align-middle mb-0 fs-8'>
							<thead>
								<tr className='text-uppercase' style={{ color: '#5B270A', background: '#FDF9F5' }}>
									<th className='py-2.5 ps-3'>Receipt ID</th>
									<th className='py-2.5'>Order Date</th>
									<th className='py-2.5'>Customer Details</th>
									<th className='py-2.5'>Gross Value</th>
									<th className='py-2.5'>Discount</th>
									<th className='py-2.5 pe-3 text-end'>Paid Net</th>
								</tr>
							</thead>
							<tbody>
								{usageLoading ? (
									<tr>
										<td colSpan={6} className='text-center py-4 text-muted'>
											Loading orders history...
										</td>
									</tr>
								) : usageOrders.length === 0 ? (
									<tr>
										<td colSpan={6} className='text-center py-4 text-muted'>
											No orders have been redeemed using this coupon code yet.
										</td>
									</tr>
								) : (
									usageOrders.map((ord: any, idx: number) => {
										const gross = Number(ord.amount || ord.notes?.gross_amount || 0)
										const discount = Number(ord.notes?.discount_amount || 0)
										const net = Number(ord.payment_breakdowns?.paid_amount || Math.max(0, gross - discount))

										return (
											<tr key={ord._id || idx}>
												<td className='font-monospace fw-bold ps-3' style={{ color: '#78350F' }}>{ord.receipt_id || ord.order_id || 'REC-N/A'}</td>
												<td className='text-muted'>{DayJS(ord.createdAt).format('DD MMM YYYY, hh:mm A')}</td>
												<td>
													<div className='fw-bold text-dark'>{ord.user?.first_name || 'Customer'} {ord.user?.last_name || ''}</div>
													<div className='text-muted fs-9'>{ord.user?.mobile || ord.user?.email || 'N/A'}</div>
												</td>
												<td className='fw-bold text-dark'>₹{gross.toLocaleString('en-IN')}</td>
												<td className='text-danger fw-semibold'>-₹{discount.toLocaleString('en-IN')}</td>
												<td className='fw-bold pe-3 text-end' style={{ color: '#78350F' }}>₹{net.toLocaleString('en-IN')}</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>

					<div className='d-flex justify-content-end mt-4'>
						<button
							type='button'
							className='gz-btn-brown-outline'
							onClick={() => setShowUsageModal(false)}>
							Close
						</button>
					</div>
				</Modal.Body>
			</Modal>
		</div>
	)
}

export default ManageCoupon
