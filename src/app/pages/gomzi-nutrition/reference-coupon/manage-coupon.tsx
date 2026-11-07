/* eslint-disable */
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faArrowLeft,
	faCalendarAlt,
	faCheckCircle,
	faCopy,
	faEdit,
	faEye,
	faLink,
	faPercent,
	faPlus,
	faTag,
	faTimesCircle,
	faUserCheck,
	faUsers,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SearchFilter from '../../../components/SearchFilter'
import SelectFieldManual from '../../../components/SelectFieldManual'
import UsersListPagination from '../../../components/TablePagination'
import CopyButton from '../../../components/motion/CopyButton'
import {
	CreateReferralCoupon,
	GetContactInquiry,
	GetReferralCoupon,
	GetTrainers,
	UpdateReferralCoupon,
	GetProduct,
} from '../../../Functions/FGGroup'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'

const ManageCoupon: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [copied, setCopied] = useState(false)
	const [trainerData, setTrainerData] = useState<any[]>([])
	const [partnerData, setPartnerData] = useState<any[]>([])
	const [catalogProducts, setCatalogProducts] = useState<any[]>([])
	const [productSearch, setProductSearch] = useState('')
	const [assigneeType, setAssigneeType] = useState<'none' | 'trainer' | 'pro_partner'>('none')
	const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
	const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
	const [subject, setSubject] = useState<any>({
		name: '',
		trainer_id: '',
	})
	const [updateData, setUpdateData] = useState({
		_id: '',
		title: '',
		coupon_code: '',
		max_usage_count: '',
		discount_type: '',
		discount: '',
		expired_at: '',
		scope: 'ALL',
		applicable_products: [] as string[],
	})
	const [couponAdd, setCouponAdd] = useState({
		title: '',
		coupon_code: '',
		max_usage_count: '',
		discount_type: 'percent',
		discount: '',
		expired_at: '',
		scope: 'ALL',
		applicable_products: [] as string[],
	})
	const [generateData, setGenerateData] = useState({
		ID: '',
		CouponCode: '',
		PasteURL: '',
		GenerateLink: '',
	})
	const [showReferenceModal, setShowReferenceModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)
	const [showGenerateModal, setShowGenerateModal] = useState(false)
	const [referenceData, setReferenceData] = useState<any>([])
	const [loading, setLoading] = useState(true)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setCouponAdd({ ...couponAdd, [name]: value })
	}

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleGenerateInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setGenerateData({ ...generateData, [name]: value })
	}

	const fetchCouponData = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetReferralCoupon()
			const filteredData = response.data

			const sortedData = [...filteredData].sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setReferenceData(sortedData)
		} catch (error) {
			console.error('Error fetching referral coupons:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchTrainerData = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetTrainers()
			const filteredData = response.data
			setTrainerData(filteredData)
		} catch (error) {
			console.error('Error fetching trainers:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchProductCatalog = async () => {
		try {
			const response: any = await GetProduct({ limit: 500, page: 1 })
			const raw = response?.data?.data || response?.data || []
			setCatalogProducts(Array.isArray(raw) ? raw : [])
		} catch (error) {
			console.error('Error fetching catalog products:', error)
		}
	}

	const fetchPartnerData = async () => {
		try {
			const res: any = await GetContactInquiry({
				page: 1,
				limit: 200,
				source: 'gomzilifesciences|ragnutrition|contact-us|5173|whey|rag',
			})
			const raw = Array.isArray(res?.data) ? res.data : []
			const approved = raw.filter((item: any) => {
				const status = String(item.partner_status || item.status || '').toLowerCase()
				return status === 'approved' || item.partner_policy?.accepted_at
			})
			setPartnerData(approved)
		} catch (error) {
			console.error('Error fetching partner inquiries:', error)
		}
	}

	useEffect(() => {
		fetchCouponData()
		fetchTrainerData()
		fetchPartnerData()
		fetchProductCatalog()
	}, [])

	const handleUpdateModal = (data: any) => {
		setShowUpdateModal(true)
		const applicableProductIds = Array.isArray(data.applicable_products)
			? data.applicable_products.map((p: any) => (p && p._id ? p._id : String(p)))
			: []
		setUpdateData({
			_id: data._id || '',
			title: data.title || '',
			coupon_code: data.coupon_code || '',
			max_usage_count: data.max_usage_count || '',
			discount_type: data.discount_type || 'percent',
			discount: data.discount || '',
			expired_at: data.expired_at || '',
			scope: data.scope || (applicableProductIds.length > 0 ? 'SPECIFIC_PRODUCTS' : 'ALL'),
			applicable_products: applicableProductIds,
		})

		if (data?.coupon_type === 'pro_partner' || data?.partner_inquiry_id) {
			setAssigneeType('pro_partner')
			const partnerId = String(data.partner_inquiry_id?._id || data.partner_inquiry_id || data.assign_trainer?.trainer_id || '')
			setSelectedPartnerId(partnerId)
			setSubject({
				name: data.partner_name || data.assign_trainer?.name || '',
				trainer_id: partnerId,
			})
		} else if (data?.assign_trainer?.trainer_id && data?.assign_trainer?.name && data?.assign_trainer?.name !== 'N/A') {
			setAssigneeType('trainer')
			setSelectedPartnerId('')
			setSubject({
				name: data.assign_trainer.name || '',
				trainer_id: data.assign_trainer.trainer_id || '',
			})
		} else {
			setAssigneeType('none')
			setSelectedPartnerId('')
			setSubject({ name: '', trainer_id: '' })
		}
	}

	const handleGenerateModal = (data: any) => {
		setShowGenerateModal(true)
		const setData: any = {
			ID: data._id,
			CouponCode: data.coupon_code,
			PasteURL: '',
			GenerateLink: '',
		}
		setGenerateData(setData)
	}

	const handleAddUpdateCoupon = async (coupon_id?: string) => {
		try {
			let couponType = 'general'
			let partnerInquiryId: string | undefined = undefined
			let partnerName: string | undefined = undefined
			let partnerEmail: string | undefined = undefined
			let partnerMobile: string | undefined = undefined
			let assignTrainer: any = undefined

			if (assigneeType === 'pro_partner') {
				couponType = 'pro_partner'
				const matchedPartner = partnerData.find((p) => String(p._id) === selectedPartnerId)
				if (matchedPartner) {
					partnerInquiryId = matchedPartner._id
					partnerName = matchedPartner.details?.full_name || matchedPartner.name || 'Pro Partner'
					partnerEmail = matchedPartner.details?.email || matchedPartner.email || ''
					partnerMobile = matchedPartner.details?.mobile || matchedPartner.mobile || ''
					assignTrainer = {
						trainer_id: matchedPartner._id,
						name: partnerName,
					}
				} else if (subject.trainer_id) {
					partnerInquiryId = subject.trainer_id
					partnerName = subject.name || 'Pro Partner'
					assignTrainer = {
						trainer_id: subject.trainer_id,
						name: partnerName,
					}
				}
			} else if (assigneeType === 'trainer') {
				couponType = 'trainer'
				if (subject.trainer_id) {
					assignTrainer = {
						name: subject.name,
						trainer_id: subject.trainer_id,
					}
				}
			}

			if (coupon_id) {
				const data: any = {
					title: updateData.title,
					coupon_code: updateData.coupon_code,
					max_usage_count: parseInt(updateData.max_usage_count),
					discount_type: updateData.discount_type,
					discount: parseInt(updateData.discount),
					expired_at: DayJS(updateData.expired_at).format('YYYY/MM/DD'),
					scope: updateData.scope,
					applicable_products: updateData.scope === 'SPECIFIC_PRODUCTS' ? updateData.applicable_products : [],
					coupon_type: couponType,
					partner_inquiry_id: partnerInquiryId,
					partner_name: partnerName,
					partner_email: partnerEmail,
					partner_mobile: partnerMobile,
					assign_trainer: assignTrainer,
				}

				data.coupon_id = coupon_id
				await UpdateReferralCoupon(data)
				setShowUpdateModal(false)
				fetchCouponData()
				setUpdateData({
					_id: '',
					title: '',
					coupon_code: '',
					max_usage_count: '',
					discount_type: '',
					discount: '',
					expired_at: '',
					scope: 'ALL',
					applicable_products: [],
				})
				toast.success('Coupon Updated Successfully')
			} else {
				const data: any = {
					title: couponAdd.title,
					coupon_code: couponAdd.coupon_code,
					max_usage_count: parseInt(couponAdd.max_usage_count),
					discount_type: couponAdd.discount_type,
					discount: parseInt(couponAdd.discount),
					expired_at: DayJS(couponAdd.expired_at).format('YYYY/MM/DD'),
					scope: couponAdd.scope,
					applicable_products: couponAdd.scope === 'SPECIFIC_PRODUCTS' ? couponAdd.applicable_products : [],
					coupon_type: couponType,
					partner_inquiry_id: partnerInquiryId,
					partner_name: partnerName,
					partner_email: partnerEmail,
					partner_mobile: partnerMobile,
					assign_trainer: assignTrainer,
				}

				await CreateReferralCoupon(data)

				setShowReferenceModal(false)
				fetchCouponData()

				setCouponAdd({
					title: '',
					coupon_code: '',
					max_usage_count: '',
					discount_type: 'percent',
					discount: '',
					expired_at: '',
					scope: 'ALL',
					applicable_products: [],
				})
				setAssigneeType('none')
				setSelectedPartnerId('')
				setSubject({ name: '', trainer_id: '' })
				toast.success('Coupon Added Successfully')
			}
		} catch (error: any) {
			toast.error(error.message || 'Error saving coupon')
			console.error(error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination((prev) => ({ ...prev, itemsPerPage, page: 1 }))
	}

	const filteredCouponData = referenceData.filter((data: any) => {
		const matchesSearch =
			(data.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(data.coupon_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(data?.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(data?.assign_trainer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())

		if (!matchesSearch) return false

		if (assigneeFilter === 'partner') {
			return data.coupon_type === 'pro_partner' || Boolean(data.partner_inquiry_id) || Boolean(data.partner_name)
		}
		if (assigneeFilter === 'trainer') {
			return (
				(data.coupon_type === 'trainer' || (!data.coupon_type && data.assign_trainer?.name)) &&
				data.coupon_type !== 'pro_partner' &&
				!data.partner_inquiry_id
			)
		}
		if (assigneeFilter === 'general') {
			const isPartner = data.coupon_type === 'pro_partner' || Boolean(data.partner_inquiry_id)
			const isTrainer =
				(data.coupon_type === 'trainer' || Boolean(data.assign_trainer?.name && data.assign_trainer?.name !== 'N/A')) &&
				!isPartner
			return !isPartner && !isTrainer
		}

		return true
	})

	const paginatedCouponData = filteredCouponData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const generateUrl = () => {
		if (!generateData.ID || !generateData.PasteURL)
			return toast.error('Coupon ID and Paste URL are required')

		let newURL: any = generateData.PasteURL

		try {
			newURL = new URL(newURL)
		} catch (error) {
			return toast.error('Please enter a valid URL')
		}

		try {
			const params = new URLSearchParams(newURL.search)
			params.set('coupon_id', generateData.ID)
			newURL.search = params.toString()

			setTimeout(() => {
				setGenerateData((prevData) => ({ ...prevData, GenerateLink: newURL.toString() }))
				return toast.success('URL generated successfully!')
			}, 150)
		} catch (error) {
			return toast.error('Failed to construct URL')
		}
	}

	const handleSelectChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const trainerId = event.target.value
		const selectedTrainer: any = trainerData.find(
			(trainer: any) => trainer.trainer_id === trainerId
		)
		if (selectedTrainer) {
			setSubject({ name: selectedTrainer.full_name, trainer_id: selectedTrainer.trainer_id })
		} else {
			setSubject({ name: '', trainer_id: '' })
		}
	}

	// KPI Stats calculation
	const totalCoupons = referenceData.length
	const activeCoupons = referenceData.filter(
		(item: any) => !item.expired_at || new Date(item.expired_at).getTime() >= new Date().getTime()
	).length
	const assignedPartners = referenceData.filter(
		(item: any) => item.coupon_type === 'pro_partner' || Boolean(item.partner_inquiry_id) || Boolean(item.partner_name)
	).length
	const assignedTrainers = referenceData.filter(
		(item: any) =>
			(item?.assign_trainer?.name && item?.assign_trainer?.name !== 'N/A') &&
			item.coupon_type !== 'pro_partner' &&
			!item.partner_inquiry_id
	).length
	const percentageCoupons = referenceData.filter(
		(item: any) => item.discount_type === 'percent'
	).length

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Manage Coupon</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Manage Coupons</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Reference Coupons</h1>
					<p className='gz-prod-subtitle'>
						Create promotional coupon codes, link referral partners & trainers, and track usage metrics.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={() => {
							setAssigneeType('none')
							setSelectedPartnerId('')
							setSubject({ name: '', trainer_id: '' })
							setShowReferenceModal(true)
						}}>
						<FontAwesomeIcon icon={faPlus} />
						<span>Add Coupon</span>
					</button>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY STATS CARDS
			    ========================================================================= */}
			<div className='gz-prod-summary-grid mb-6'>
				<div className='gz-prod-summary-card'>
					<div className='title'>Total Coupons</div>
					<div className='value'>
						{loading ? <div className='gz-skeleton mt-1' style={{ width: '40px', height: '24px', borderRadius: '4px' }} /> : totalCoupons}
					</div>
					<div className='subtext'>Configured in database</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Active Coupons</div>
					<div className='value' style={{ color: '#059669' }}>
						{loading ? <div className='gz-skeleton mt-1' style={{ width: '40px', height: '24px', borderRadius: '4px' }} /> : activeCoupons}
					</div>
					<div className='subtext'>Currently valid & usable</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Pro Partner Coupons</div>
					<div className='value' style={{ color: '#047857' }}>
						{loading ? <div className='gz-skeleton mt-1' style={{ width: '40px', height: '24px', borderRadius: '4px' }} /> : assignedPartners}
					</div>
					<div className='subtext'>Assigned to RAG Pro Partners</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Trainer Coupons</div>
					<div className='value' style={{ color: '#2563EB' }}>
						{loading ? <div className='gz-skeleton mt-1' style={{ width: '40px', height: '24px', borderRadius: '4px' }} /> : assignedTrainers}
					</div>
					<div className='subtext'>Referral trainers linked</div>
				</div>
			</div>

			{/* =========================================================================
			    TABLE CARD
			    ========================================================================= */}
			<div className='gz-prod-card'>
				{/* Toolbar */}
				<div className='gz-prod-toolbar'>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>
						<select
							className='form-select form-select-sm'
							style={{ minWidth: '170px', height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
							value={assigneeFilter}
							onChange={(e) => setAssigneeFilter(e.target.value)}>
							<option value='all'>All Beneficiaries</option>
							<option value='partner'>💎 Pro Partners</option>
							<option value='trainer'>Fitness Trainers</option>
							<option value='general'>Storewide Coupons</option>
						</select>
						<LengthMenu
							expenseData={filteredCouponData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>
						<div>
							<DownloadExcelButton
								data={filteredCouponData.map((c: any) => ({
									Title: c.title || '',
									'Coupon Code': c.coupon_code || '',
									'Assigned Trainer': c.assign_trainer?.name || 'All Trainers',
									'Max Usage': c.max_usage || '',
									Discount: c.discount || '',
									'Discount Type': c.discount_type || '',
									'Expiry Date': c.expired_at ? DayJS(c.expired_at).format('DD-MM-YYYY') : 'Never',
								}))}
								filename='Coupons_List'
							/>
						</div>
					</div>
					<div className='d-flex align-items-center gap-2'>
						<span className='fs-8 fw-semibold text-muted'>
							Showing {paginatedCouponData.length} of {filteredCouponData.length} coupons
						</span>
					</div>
				</div>

				{/* Table */}
				<div className='table-responsive'>
					<table className='gz-prod-table mb-0'>
						<thead>
							<tr>
								<th style={{ width: '56px', textAlign: 'center' }}>No.</th>
								<th style={{ minWidth: '180px' }}>Title</th>
								<th style={{ minWidth: '160px' }}>Coupon Code</th>
								<th style={{ minWidth: '190px' }}>Assigned Beneficiary</th>
								<th style={{ minWidth: '120px' }}>Max Usage</th>
								<th style={{ minWidth: '120px' }}>Discount</th>
								<th style={{ minWidth: '130px' }}>Discount Type</th>
								<th style={{ minWidth: '150px' }}>Scope</th>
								<th style={{ minWidth: '150px' }}>Expiry Date</th>
								<th style={{ minWidth: '130px', textAlign: 'center' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[...Array(5)].map((_, idx) => (
									<tr key={`cpn-skel-${idx}`} className='gz-skeleton-tr'>
										<td style={{ textAlign: 'center' }}>
											<div className='gz-skeleton rounded mx-auto' style={{ width: '22px', height: '16px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded' style={{ width: '130px', height: '15px' }} />
										</td>
										<td>
											<div className='d-inline-flex align-items-center gap-2'>
												<div className='gz-skeleton rounded' style={{ width: '90px', height: '24px' }} />
												<div className='gz-skeleton rounded' style={{ width: '24px', height: '24px' }} />
											</div>
										</td>
										<td>
											<div className='d-inline-flex align-items-center gap-2'>
												<div className='gz-skeleton rounded-circle' style={{ width: '24px', height: '24px' }} />
												<div className='gz-skeleton rounded' style={{ width: '95px', height: '14px' }} />
											</div>
										</td>
										<td>
											<div className='gz-skeleton rounded' style={{ width: '45px', height: '14px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded' style={{ width: '50px', height: '16px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded-pill' style={{ width: '65px', height: '20px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded' style={{ width: '70px', height: '16px' }} />
										</td>
										<td>
											<div className='d-flex flex-column gap-1'>
												<div className='gz-skeleton rounded' style={{ width: '85px', height: '13px' }} />
												<div className='gz-skeleton rounded-pill' style={{ width: '45px', height: '15px' }} />
											</div>
										</td>
										<td style={{ textAlign: 'center' }}>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<div className='gz-skeleton rounded' style={{ width: '32px', height: '32px' }} />
												<div className='gz-skeleton rounded' style={{ width: '32px', height: '32px' }} />
												<div className='gz-skeleton rounded' style={{ width: '32px', height: '32px' }} />
											</div>
										</td>
									</tr>
								))
							) : paginatedCouponData.length > 0 ? (
								paginatedCouponData.map((data: any, index: number) => {
									const actualIndex =
										(pagination.page - 1) * pagination.itemsPerPage + index + 1
									const isExpired =
										data.expired_at && new Date(data.expired_at).getTime() < new Date().getTime()

									return (
										<tr key={data._id || actualIndex}>
											<td style={{ textAlign: 'center', fontWeight: 700, color: '#71809A' }}>
												{actualIndex}
											</td>
											<td>
												<span
													style={{
														fontWeight: 700,
														color: '#172B4D',
														fontSize: '13.5px',
													}}>
													{data.title || '—'}
												</span>
											</td>
											<td>
												<div className='d-inline-flex align-items-center gap-2'>
													<span
														style={{
															fontFamily: 'monospace',
															fontWeight: 700,
															fontSize: '13px',
															background: '#EAF1FB',
															color: '#172B4D',
															padding: '3px 8px',
															borderRadius: '6px',
															border: '1px solid #D1D9E6',
															letterSpacing: '0.04em',
														}}>
														{data.coupon_code}
													</span>
													{data.coupon_code && (
														<CopyButton
															text={data.coupon_code}
															title='Copy Coupon Code'
															customMessage='Code copied!'
															className='gz-prod-btn-icon'
															iconSize={13}
														/>
													)}
												</div>
											</td>
											<td>
												{data.coupon_type === 'pro_partner' || data.partner_inquiry_id || data.partner_name ? (
													<div className='d-inline-flex align-items-center gap-1.5 flex-wrap'>
														<span
															className='badge text-success fw-bold'
															style={{
																fontSize: '11px',
																padding: '3px 8px',
																borderRadius: '6px',
																background: '#ECFDF5',
																border: '1px solid #A7F3D0',
															}}>
															💎 Pro Partner
														</span>
														<span style={{ fontWeight: 600, color: '#172B4D', fontSize: '13px' }}>
															{data.partner_name || data.partner_inquiry_id?.name || data.assign_trainer?.name || 'Partner'}
														</span>
													</div>
												) : data?.assign_trainer?.name && data.assign_trainer.name !== 'N/A' ? (
													<div className='d-inline-flex align-items-center gap-1.5 flex-wrap'>
														<span
															className='badge text-primary fw-bold'
															style={{
																fontSize: '11px',
																padding: '3px 8px',
																borderRadius: '6px',
																background: '#EFF6FF',
																border: '1px solid #BFDBFE',
															}}>
															Trainer
														</span>
														<span style={{ fontWeight: 600, color: '#172B4D', fontSize: '13px' }}>
															{data.assign_trainer.name}
														</span>
													</div>
												) : (
													<span
														className='badge text-muted fw-semibold'
														style={{
															fontSize: '11px',
															padding: '3px 8px',
															borderRadius: '6px',
															background: '#F1F5F9',
															border: '1px solid #E2E8F0',
														}}>
														General Store
													</span>
												)}
											</td>
											<td>
												<span
													style={{
														fontWeight: 600,
														color: '#172B4D',
														fontSize: '13px',
													}}>
													{data.max_usage_count || '0'}
												</span>
											</td>
											<td>
												<span
													style={{
														fontWeight: 700,
														color: '#059669',
														fontSize: '13.5px',
													}}>
													{data.discount
														? data.discount_type === 'rupees'
															? `₹${data.discount}`
															: `${data.discount}%`
														: '0'}
												</span>
											</td>
											<td>
												<span
													className={`gz-status-pill ${
														data.discount_type === 'percent' ? 'primary' : 'secondary'
													}`}>
													{data.discount_type ? data.discount_type : 'percent'}
												</span>
											</td>
											<td>
												{data.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(data.applicable_products) && data.applicable_products.length > 0 ? (
													<div>
														<span className='badge bg-light-primary text-primary fw-bold' style={{ fontSize: '11px' }}>
															{data.applicable_products.length} Products
														</span>
														<div className='text-muted fs-9 text-truncate mt-0.5' style={{ maxWidth: '140px' }} title={data.applicable_products.map((p: any) => p?.name || 'Product').join(', ')}>
															{data.applicable_products.map((p: any) => p?.name || 'Product').slice(0, 2).join(', ')}
															{data.applicable_products.length > 2 ? '...' : ''}
														</div>
													</div>
												) : (
													<span className='badge bg-light text-muted' style={{ fontSize: '11px' }}>
														All Products
													</span>
												)}
											</td>
											<td>
												{data.expired_at ? (
													<div>
														<div
															style={{
																fontSize: '12.5px',
																fontWeight: 600,
																color: isExpired ? '#DC2626' : '#172B4D',
															}}>
															{DayJS(data.expired_at).format('DD MMM YYYY')}
														</div>
														<span
															className={`gz-status-pill mt-1 ${
																isExpired ? 'danger' : 'success'
															}`}
															style={{ fontSize: '10px', padding: '1px 6px' }}>
															{isExpired ? 'Expired' : 'Active'}
														</span>
													</div>
												) : (
													<span style={{ color: '#A0ABC0', fontSize: '12.5px' }}>No Expiry</span>
												)}
											</td>
											<td>
												<div className='d-flex align-items-center justify-content-center gap-2'>
													<button
														type='button'
														onClick={() => handleUpdateModal(data)}
														className='gz-prod-btn-icon'
														title='Edit Coupon'
														style={{
															width: '32px',
															height: '32px',
															borderRadius: '8px',
															border: '1px solid #E4EAF2',
															background: '#FFFFFF',
															color: '#172B4D',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
														<FontAwesomeIcon icon={faEdit} style={{ fontSize: '13px' }} />
													</button>

													<Link
														to={`/rag/manage-coupon/reference?id=${data._id}&coupon_discount=${data.discount}`}
														className='gz-prod-btn-icon text-decoration-none'
														title='View Reference Orders'
														style={{
															width: '32px',
															height: '32px',
															borderRadius: '8px',
															border: '1px solid #E4EAF2',
															background: '#FFFFFF',
															color: '#2563EB',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
														<FontAwesomeIcon icon={faEye} style={{ fontSize: '13px' }} />
													</Link>

													<button
														type='button'
														onClick={() => handleGenerateModal(data)}
														className='gz-prod-btn-icon'
														title='Generate Coupon Link'
														style={{
															width: '32px',
															height: '32px',
															borderRadius: '8px',
															border: '1px solid #E4EAF2',
															background: '#FFFFFF',
															color: '#D97706',
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}>
														<FontAwesomeIcon icon={faLink} style={{ fontSize: '12px' }} />
													</button>
												</div>
											</td>
										</tr>
									)
								})
							) : (
								<tr>
									<td colSpan={10} className='text-center py-10'>
										<div className='d-flex flex-column align-items-center justify-content-center my-6'>
											<div
												className='d-inline-flex align-items-center justify-content-center mb-3'
												style={{
													width: '48px',
													height: '48px',
													borderRadius: '50%',
													background: '#F5F7FB',
													color: '#71809A',
												}}>
												<FontAwesomeIcon icon={faTag} style={{ fontSize: '20px' }} />
											</div>
											<h4 className='fw-bold mb-1' style={{ color: '#172B4D' }}>
												No Coupons Found
											</h4>
											<p className='text-muted fs-7 mb-0'>
												{searchTerm
													? 'No coupon records match your search criteria.'
													: 'No reference coupons have been created yet.'}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredCouponData.length > 0 && (
					<div
						className='px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<UsersListPagination
							totalPages={Math.ceil(filteredCouponData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>

			{/* =========================================================================
			    MODAL 1: ADD COUPON
			    ========================================================================= */}
			<Modal
				centered
				show={showReferenceModal}
				onHide={() => setShowReferenceModal(false)}
				size='lg'>
				<div
					className='modal-content'
					style={{
						borderRadius: '16px',
						border: '1px solid #E4EAF2',
						boxShadow: '0 10px 30px rgba(23, 43, 77, 0.12)',
						overflow: 'hidden',
					}}>
					<div
						className='modal-header d-flex justify-content-between align-items-center px-6 py-4'
						style={{ borderBottom: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<div>
							<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '18px' }}>
								Add Reference Coupon
							</h3>
							<p className='fs-8 text-muted mb-0'>
								Create a new referral discount code with limits and trainer assignment
							</p>
						</div>
						<button
							type='button'
							onClick={() => setShowReferenceModal(false)}
							style={{
								background: 'none',
								border: 'none',
								color: '#71809A',
								fontSize: '18px',
								cursor: 'pointer',
								padding: '4px',
							}}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>

					<div className='modal-body px-6 py-5 scroll-y' style={{ maxHeight: '70vh' }}>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='e.g., Summer Fitness Special'
									type='text'
									name='title'
									label='Coupon Title *'
									htmlFor='title'
									value={couponAdd.title}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='e.g., GZFIT20'
									type='text'
									name='coupon_code'
									label='Coupon Code *'
									htmlFor='coupon_code'
									value={couponAdd.coupon_code}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='e.g., 100'
									type='number'
									name='max_usage_count'
									label='Max Usage Count'
									htmlFor='max_usage_count'
									value={couponAdd.max_usage_count}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<SelectFieldManual
									label='Discount Type'
									name='discount_type'
									value={couponAdd.discount_type}
									onChange={handleInputChange}
									htmlFor='discount_type'
									marginRemove={true}
									options={[
										{ value: 'percent', name: 'Percentage (%)' },
										{ value: 'rupees', name: 'Fixed Amount (₹)' },
									]}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='e.g., 15'
									type='number'
									name='discount'
									label='Discount Value *'
									htmlFor='discount'
									value={couponAdd.discount}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Expiry Date'
									type='date'
									name='expired_at'
									label='Expiry Date'
									htmlFor='expired_at'
									value={couponAdd.expired_at ? DayJS(couponAdd.expired_at).format('YYYY-MM-DD') : ''}
									onChange={handleInputChange}
									labelMarginRemove
								/>
							</div>
							{/* Assignee / Partner Configuration */}
							<div className='col-12'>
								<div className='p-4 rounded-3' style={{ background: '#F8FAFD', border: '1px solid #E2E8F0' }}>
									<label className='fw-bold mb-1 d-block' style={{ color: '#172B4D', fontSize: '13px' }}>
										Assign Coupon Beneficiary
									</label>
									<p className='text-muted fs-8 mb-3'>
										Select who this coupon is assigned to so orders and discounts are properly counted.
									</p>
									<div className='d-flex align-items-center gap-4 mb-3 flex-wrap'>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='assignee_type_add'
												checked={assigneeType === 'none'}
												onChange={() => {
													setAssigneeType('none')
													setSelectedPartnerId('')
													setSubject({ name: '', trainer_id: '' })
												}}
											/>
											<span>Storewide (General Coupon)</span>
										</label>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='assignee_type_add'
												checked={assigneeType === 'pro_partner'}
												onChange={() => {
													setAssigneeType('pro_partner')
													if (partnerData.length > 0 && !selectedPartnerId) {
														const firstP = partnerData[0]
														setSelectedPartnerId(firstP._id)
														setSubject({
															name: firstP.details?.full_name || firstP.name,
															trainer_id: firstP._id,
														})
													}
												}}
											/>
											<span className='fw-bold text-success'>💎 RAG Pro Partner</span>
										</label>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='assignee_type_add'
												checked={assigneeType === 'trainer'}
												onChange={() => {
													setAssigneeType('trainer')
													setSelectedPartnerId('')
												}}
											/>
											<span className='fw-bold text-primary'>Fitness Trainer</span>
										</label>
									</div>

									{assigneeType === 'pro_partner' && (
										<div>
											<label className='form-label fs-8 fw-bold text-gray-700 mb-1'>
												Select Approved Pro Partner
											</label>
											<select
												className='form-select form-select-sm'
												style={{ fontSize: '13px', borderRadius: '8px' }}
												value={selectedPartnerId}
												onChange={(e) => {
													const pid = e.target.value
													setSelectedPartnerId(pid)
													const matched = partnerData.find((p) => String(p._id) === pid)
													if (matched) {
														setSubject({
															name: matched.details?.full_name || matched.name,
															trainer_id: matched._id,
														})
													} else {
														setSubject({ name: '', trainer_id: '' })
													}
												}}>
												<option value=''>Choose Pro Partner</option>
												{partnerData.map((p) => {
													const name = p.details?.full_name || p.name || 'Partner'
													const contact = p.details?.email || p.email || p.details?.mobile || p.mobile || ''
													const coupon = p.details?.assigned_coupon_code ? ` • [${p.details.assigned_coupon_code}]` : ''
													return (
														<option key={p._id} value={p._id}>
															{name} {contact ? `(${contact})` : ''}{coupon}
														</option>
													)
												})}
											</select>
										</div>
									)}

									{assigneeType === 'trainer' && (
										<div>
											<SelectFieldManual
												label='Assign Referral Trainer'
												name='account_id'
												value={subject.trainer_id}
												onChange={handleSelectChange}
												htmlFor='account_id'
												marginRemove={true}
												options={[
													{ value: '', name: 'Select Trainer (Optional)' },
													...trainerData.map((data: any) => ({
														value: data.trainer_id,
														name: `${data.full_name} (${data.trainer_id || 'ID'})`,
													})),
												]}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Product Scope Configuration */}
							<div className='col-12'>
								<div className='p-4 rounded-3' style={{ background: '#F8FAFD', border: '1px solid #E2E8F0' }}>
									<label className='fw-bold mb-2 d-block' style={{ color: '#172B4D', fontSize: '13px' }}>
										Coupon Applicability Scope
									</label>
									<div className='d-flex align-items-center gap-4 mb-3'>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='scope_add'
												checked={couponAdd.scope === 'ALL'}
												onChange={() => setCouponAdd({ ...couponAdd, scope: 'ALL', applicable_products: [] })}
											/>
											<span>All Products (Storewide)</span>
										</label>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='scope_add'
												checked={couponAdd.scope === 'SPECIFIC_PRODUCTS'}
												onChange={() => setCouponAdd({ ...couponAdd, scope: 'SPECIFIC_PRODUCTS' })}
											/>
											<span>Specific Product(s) Only</span>
										</label>
									</div>

									{couponAdd.scope === 'SPECIFIC_PRODUCTS' && (
										<div>
											<input
												type='text'
												placeholder='Search product by name...'
												value={productSearch}
												onChange={(e) => setProductSearch(e.target.value)}
												className='form-control form-control-sm mb-2'
												style={{ fontSize: '12.5px' }}
											/>
											<div
												className='scroll-y border rounded bg-white p-2'
												style={{ maxHeight: '180px', borderColor: '#E2E8F0' }}>
												{catalogProducts
													.filter((p) => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
													.map((p) => {
														const isChecked = couponAdd.applicable_products.includes(p._id)
														return (
															<label
																key={p._id}
																className='d-flex align-items-center gap-2 p-1.5 rounded hover-bg-light cursor-pointer'
																style={{ fontSize: '12.5px' }}>
																<input
																	type='checkbox'
																	checked={isChecked}
																	onChange={(e) => {
																		if (e.target.checked) {
																			setCouponAdd({
																				...couponAdd,
																				applicable_products: [...couponAdd.applicable_products, p._id],
																			})
																		} else {
																			setCouponAdd({
																				...couponAdd,
																				applicable_products: couponAdd.applicable_products.filter(
																					(id) => id !== p._id
																				),
																			})
																		}
																	}}
																/>
																<span className='fw-semibold text-truncate' style={{ maxWidth: '320px' }}>
																	{p.name}
																</span>
																<span className='text-muted fs-8 ms-auto'>₹{p.discountPrice || p.price}</span>
															</label>
														)
													})}
											</div>
											<div className='d-flex align-items-center justify-content-between mt-1'>
												<div className='fs-8 text-primary fw-bold'>
													{couponAdd.applicable_products.length} product(s) selected
												</div>
												<div className='d-flex gap-1'>
													<button
														type='button'
														className='btn btn-xs btn-light-primary py-0.5 px-2 fs-9'
														onClick={() => {
															const allIds = catalogProducts.map((p) => p._id)
															setCouponAdd({ ...couponAdd, applicable_products: allIds })
														}}>
														Select All
													</button>
													<button
														type='button'
														className='btn btn-xs btn-light-secondary py-0.5 px-2 fs-9'
														onClick={() => setCouponAdd({ ...couponAdd, applicable_products: [] })}>
														Clear
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<div
						className='modal-footer d-flex justify-content-end gap-2 px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							className='gz-prod-btn-cancel'
							onClick={() => setShowReferenceModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='gz-prod-btn-primary'
							onClick={() => handleAddUpdateCoupon()}>
							<FontAwesomeIcon icon={faPlus} />
							<span>Create Coupon</span>
						</button>
					</div>
				</div>
			</Modal>

			{/* =========================================================================
			    MODAL 2: EDIT COUPON
			    ========================================================================= */}
			<Modal
				centered
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				size='lg'>
				<div
					className='modal-content'
					style={{
						borderRadius: '16px',
						border: '1px solid #E4EAF2',
						boxShadow: '0 10px 30px rgba(23, 43, 77, 0.12)',
						overflow: 'hidden',
					}}>
					<div
						className='modal-header d-flex justify-content-between align-items-center px-6 py-4'
						style={{ borderBottom: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<div>
							<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '18px' }}>
								Edit Reference Coupon
							</h3>
							<p className='fs-8 text-muted mb-0'>
								Modify coupon code details, discount amounts, and trainer associations
							</p>
						</div>
						<button
							type='button'
							onClick={() => setShowUpdateModal(false)}
							style={{
								background: 'none',
								border: 'none',
								color: '#71809A',
								fontSize: '18px',
								cursor: 'pointer',
								padding: '4px',
							}}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>

					<div className='modal-body px-6 py-5 scroll-y' style={{ maxHeight: '70vh' }}>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter Title'
									type='text'
									name='title'
									label='Coupon Title *'
									htmlFor='title'
									value={updateData.title}
									onChange={handleInputUpdateChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter Coupon Code'
									type='text'
									name='coupon_code'
									label='Coupon Code *'
									htmlFor='coupon_code'
									value={updateData.coupon_code}
									onChange={handleInputUpdateChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter Max Usage Count'
									type='number'
									name='max_usage_count'
									label='Max Usage Count'
									htmlFor='max_usage_count'
									value={updateData.max_usage_count}
									onChange={handleInputUpdateChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<SelectFieldManual
									label='Discount Type'
									name='discount_type'
									value={updateData.discount_type}
									onChange={handleInputUpdateChange}
									htmlFor='discount_type'
									marginRemove={true}
									options={[
										{ value: 'percent', name: 'Percentage (%)' },
										{ value: 'rupees', name: 'Fixed Amount (₹)' },
									]}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter Discount Value'
									type='number'
									name='discount'
									label='Discount Value *'
									htmlFor='discount'
									value={updateData.discount}
									onChange={handleInputUpdateChange}
									labelMarginRemove
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Expiry Date'
									type='date'
									name='expired_at'
									label='Expiry Date'
									htmlFor='expired_at'
									value={updateData.expired_at ? DayJS(updateData.expired_at).format('YYYY-MM-DD') : ''}
									onChange={handleInputUpdateChange}
									labelMarginRemove
								/>
							</div>
							{/* Assignee / Partner Configuration */}
							<div className='col-12'>
								<div className='p-4 rounded-3' style={{ background: '#F8FAFD', border: '1px solid #E2E8F0' }}>
									<label className='fw-bold mb-1 d-block' style={{ color: '#172B4D', fontSize: '13px' }}>
										Assign Coupon Beneficiary
									</label>
									<p className='text-muted fs-8 mb-3'>
										Select who this coupon is assigned to so orders and discounts are properly counted.
									</p>
									<div className='d-flex align-items-center gap-4 mb-3 flex-wrap'>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='assignee_type_update'
												checked={assigneeType === 'none'}
												onChange={() => {
													setAssigneeType('none')
													setSelectedPartnerId('')
													setSubject({ name: '', trainer_id: '' })
												}}
											/>
											<span>Storewide (General Coupon)</span>
										</label>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='assignee_type_update'
												checked={assigneeType === 'pro_partner'}
												onChange={() => {
													setAssigneeType('pro_partner')
													if (partnerData.length > 0 && !selectedPartnerId) {
														const firstP = partnerData[0]
														setSelectedPartnerId(firstP._id)
														setSubject({
															name: firstP.details?.full_name || firstP.name,
															trainer_id: firstP._id,
														})
													}
												}}
											/>
											<span className='fw-bold text-success'>💎 RAG Pro Partner</span>
										</label>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='assignee_type_update'
												checked={assigneeType === 'trainer'}
												onChange={() => {
													setAssigneeType('trainer')
													setSelectedPartnerId('')
												}}
											/>
											<span className='fw-bold text-primary'>Fitness Trainer</span>
										</label>
									</div>

									{assigneeType === 'pro_partner' && (
										<div>
											<label className='form-label fs-8 fw-bold text-gray-700 mb-1'>
												Select Approved Pro Partner
											</label>
											<select
												className='form-select form-select-sm'
												style={{ fontSize: '13px', borderRadius: '8px' }}
												value={selectedPartnerId}
												onChange={(e) => {
													const pid = e.target.value
													setSelectedPartnerId(pid)
													const matched = partnerData.find((p) => String(p._id) === pid)
													if (matched) {
														setSubject({
															name: matched.details?.full_name || matched.name,
															trainer_id: matched._id,
														})
													} else {
														setSubject({ name: '', trainer_id: '' })
													}
												}}>
												<option value=''>Choose Pro Partner</option>
												{partnerData.map((p) => {
													const name = p.details?.full_name || p.name || 'Partner'
													const contact = p.details?.email || p.email || p.details?.mobile || p.mobile || ''
													const coupon = p.details?.assigned_coupon_code ? ` • [${p.details.assigned_coupon_code}]` : ''
													return (
														<option key={p._id} value={p._id}>
															{name} {contact ? `(${contact})` : ''}{coupon}
														</option>
													)
												})}
											</select>
										</div>
									)}

									{assigneeType === 'trainer' && (
										<div>
											<SelectFieldManual
												label='Assign Referral Trainer'
												name='trainer_id'
												value={subject.trainer_id}
												onChange={handleSelectChange}
												htmlFor='trainer_id'
												marginRemove={true}
												options={[
													{ value: '', name: 'Select Trainer (Optional)' },
													...trainerData.map((data: any) => ({
														value: data.trainer_id,
														name: `${data.full_name} (${data.trainer_id || 'ID'})`,
													})),
												]}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Product Scope Configuration */}
							<div className='col-12'>
								<div className='p-4 rounded-3' style={{ background: '#F8FAFD', border: '1px solid #E2E8F0' }}>
									<label className='fw-bold mb-2 d-block' style={{ color: '#172B4D', fontSize: '13px' }}>
										Coupon Applicability Scope
									</label>
									<div className='d-flex align-items-center gap-4 mb-3'>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='scope_update'
												checked={updateData.scope === 'ALL'}
												onChange={() => setUpdateData({ ...updateData, scope: 'ALL', applicable_products: [] })}
											/>
											<span>All Products (Storewide)</span>
										</label>
										<label className='d-flex align-items-center gap-2 cursor-pointer' style={{ fontSize: '13px' }}>
											<input
												type='radio'
												name='scope_update'
												checked={updateData.scope === 'SPECIFIC_PRODUCTS'}
												onChange={() => setUpdateData({ ...updateData, scope: 'SPECIFIC_PRODUCTS' })}
											/>
											<span>Specific Product(s) Only</span>
										</label>
									</div>

									{updateData.scope === 'SPECIFIC_PRODUCTS' && (
										<div>
											<input
												type='text'
												placeholder='Search product by name...'
												value={productSearch}
												onChange={(e) => setProductSearch(e.target.value)}
												className='form-control form-control-sm mb-2'
												style={{ fontSize: '12.5px' }}
											/>
											<div
												className='scroll-y border rounded bg-white p-2'
												style={{ maxHeight: '180px', borderColor: '#E2E8F0' }}>
												{catalogProducts
													.filter((p) => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
													.map((p) => {
														const isChecked = updateData.applicable_products.includes(p._id)
														return (
															<label
																key={p._id}
																className='d-flex align-items-center gap-2 p-1.5 rounded hover-bg-light cursor-pointer'
																style={{ fontSize: '12.5px' }}>
																<input
																	type='checkbox'
																	checked={isChecked}
																	onChange={(e) => {
																		if (e.target.checked) {
																			setUpdateData({
																				...updateData,
																				applicable_products: [...updateData.applicable_products, p._id],
																			})
																		} else {
																			setUpdateData({
																				...updateData,
																				applicable_products: updateData.applicable_products.filter(
																					(id) => id !== p._id
																				),
																			})
																		}
																	}}
																/>
																<span className='fw-semibold text-truncate' style={{ maxWidth: '320px' }}>
																	{p.name}
																</span>
																<span className='text-muted fs-8 ms-auto'>₹{p.discountPrice || p.price}</span>
															</label>
														)
													})}
											</div>
											<div className='d-flex align-items-center justify-content-between mt-1'>
												<div className='fs-8 text-primary fw-bold'>
													{updateData.applicable_products.length} product(s) selected
												</div>
												<div className='d-flex gap-1'>
													<button
														type='button'
														className='btn btn-xs btn-light-primary py-0.5 px-2 fs-9'
														onClick={() => {
															const allIds = catalogProducts.map((p) => p._id)
															setUpdateData({ ...updateData, applicable_products: allIds })
														}}>
														Select All
													</button>
													<button
														type='button'
														className='btn btn-xs btn-light-secondary py-0.5 px-2 fs-9'
														onClick={() => setUpdateData({ ...updateData, applicable_products: [] })}>
														Clear
													</button>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<div
						className='modal-footer d-flex justify-content-end gap-2 px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							className='gz-prod-btn-cancel'
							onClick={() => setShowUpdateModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='gz-prod-btn-primary'
							onClick={() => handleAddUpdateCoupon(updateData._id)}>
							<FontAwesomeIcon icon={faEdit} />
							<span>Save Changes</span>
						</button>
					</div>
				</div>
			</Modal>

			{/* =========================================================================
			    MODAL 3: GENERATE COUPON LINK
			    ========================================================================= */}
			<Modal
				centered
				show={showGenerateModal}
				onHide={() => setShowGenerateModal(false)}>
				<div
					className='modal-content'
					style={{
						borderRadius: '16px',
						border: '1px solid #E4EAF2',
						boxShadow: '0 10px 30px rgba(23, 43, 77, 0.12)',
						overflow: 'hidden',
					}}>
					<div
						className='modal-header d-flex justify-content-between align-items-center px-6 py-4'
						style={{ borderBottom: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<div>
							<h3 className='fw-bold mb-0' style={{ color: '#172B4D', fontSize: '18px' }}>
								Generate Referral Page Link
							</h3>
							<p className='fs-8 text-muted mb-0'>
								Attach coupon ID automatically to any target store or landing page URL
							</p>
						</div>
						<button
							type='button'
							onClick={() => setShowGenerateModal(false)}
							style={{
								background: 'none',
								border: 'none',
								color: '#71809A',
								fontSize: '18px',
								cursor: 'pointer',
								padding: '4px',
							}}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>

					<div className='modal-body px-6 py-5'>
						<div className='d-flex flex-column gap-3'>
							<InputField
								placeholder='Coupon ID'
								type='text'
								name='ID'
								label='Coupon ID'
								htmlFor='ID'
								value={generateData.ID}
								onChange={handleGenerateInputChange}
								readOnly
								labelMarginRemove
							/>
							<InputField
								readOnly
								placeholder='Coupon Code'
								type='text'
								name='CouponCode'
								label='Coupon Code'
								htmlFor='CouponCode'
								value={generateData.CouponCode}
								onChange={handleGenerateInputChange}
								labelMarginRemove
							/>
							<div className='d-flex flex-column gap-1'>
								<InputField
									placeholder='https://www.gomzilifesciences.in/store/...'
									type='text'
									name='PasteURL'
									label='Target Page URL'
									htmlFor='PasteURL'
									value={generateData.PasteURL}
									onChange={handleGenerateInputChange}
									labelMarginRemove
								/>
								<div className='mt-2'>
									<button
										type='button'
										onClick={generateUrl}
										className='gz-prod-btn-primary w-100 justify-content-center'>
										<FontAwesomeIcon icon={faLink} />
										<span>Generate Tracking Link</span>
									</button>
								</div>
							</div>

							{generateData.GenerateLink && (
								<div className='mt-2'>
									<label className='fs-8 fw-bold text-muted text-uppercase mb-1 d-block'>
										Generated Referral URL
									</label>
									<div className='d-flex align-items-center gap-2'>
										<input
											type='text'
											className='form-control form-control-solid bg-white pe-2'
											value={generateData.GenerateLink}
											readOnly
											style={{
												height: '42px',
												backgroundColor: '#F8FAFD',
												color: '#172B4D',
												borderRadius: '10px',
												border: '1px solid #E4EAF2',
												fontSize: '12.5px',
												fontFamily: 'monospace',
											}}
										/>
										<CopyButton
											text={generateData.GenerateLink}
											title='Copy Generated Link'
											customMessage='Generated URL copied!'
											className='gz-prod-btn-icon'
											iconSize={15}
										/>
									</div>
								</div>
							)}
						</div>
					</div>

					<div
						className='modal-footer d-flex justify-content-end px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#F8FAFD' }}>
						<button
							type='button'
							className='gz-prod-btn-cancel'
							onClick={() => setShowGenerateModal(false)}>
							Close
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default ManageCoupon
