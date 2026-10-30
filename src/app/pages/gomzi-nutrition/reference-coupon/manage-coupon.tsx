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
	const [catalogProducts, setCatalogProducts] = useState<any[]>([])
	const [productSearch, setProductSearch] = useState('')
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

	useEffect(() => {
		fetchCouponData()
		fetchTrainerData()
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
		if (data?.assign_trainer) {
			setSubject({
				name: data.assign_trainer.name || '',
				trainer_id: data.assign_trainer.trainer_id || '',
			})
		} else {
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
					assign_trainer: {
						name: subject.name,
						trainer_id: subject.trainer_id,
					},
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
					assign_trainer: {
						name: subject.name,
						trainer_id: subject.trainer_id,
					},
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

	const filteredCouponData = referenceData.filter((data: any) =>
		(data.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
		(data.coupon_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
		(data?.assign_trainer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
	)

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
	const assignedTrainers = referenceData.filter(
		(item: any) => item?.assign_trainer?.name && item?.assign_trainer?.name !== 'N/A'
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
						Create promotional coupon codes, link referral trainers, and track reference usage metrics.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={() => {
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
					<div className='title'>Assigned to Trainers</div>
					<div className='value' style={{ color: '#2563EB' }}>
						{loading ? <div className='gz-skeleton mt-1' style={{ width: '40px', height: '24px', borderRadius: '4px' }} /> : assignedTrainers}
					</div>
					<div className='subtext'>Referral partner linked</div>
				</div>
				<div className='gz-prod-summary-card'>
					<div className='title'>Percent Discounts</div>
					<div className='value' style={{ color: '#D97706' }}>
						{loading ? <div className='gz-skeleton mt-1' style={{ width: '40px', height: '24px', borderRadius: '4px' }} /> : percentageCoupons}
					</div>
					<div className='subtext'>Percentage-based savings</div>
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
								<th style={{ minWidth: '170px' }}>Assigned Trainer</th>
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
												{data?.assign_trainer?.name && data.assign_trainer.name !== 'N/A' ? (
													<div className='d-inline-flex align-items-center gap-2'>
														<span
															style={{
																width: '24px',
																height: '24px',
																borderRadius: '50%',
																background: '#EFF6FF',
																color: '#2563EB',
																display: 'inline-flex',
																alignItems: 'center',
																justifyContent: 'center',
																fontSize: '11px',
															}}>
															<FontAwesomeIcon icon={faUserCheck} />
														</span>
														<span style={{ fontWeight: 600, color: '#172B4D', fontSize: '13px' }}>
															{data.assign_trainer.name}
														</span>
													</div>
												) : (
													<span style={{ color: '#A0ABC0', fontSize: '13px' }}>Unassigned</span>
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
							<div className='col-12'>
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
											<div className='fs-8 text-primary mt-1 fw-bold'>
												{couponAdd.applicable_products.length} product(s) selected
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
							<div className='col-12'>
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
											<div className='fs-8 text-primary mt-1 fw-bold'>
												{updateData.applicable_products.length} product(s) selected
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
