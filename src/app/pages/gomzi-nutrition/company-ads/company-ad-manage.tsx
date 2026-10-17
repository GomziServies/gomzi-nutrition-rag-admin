/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faTrash,
	faEdit,
	faArrowUp,
	faArrowDown,
	faCheck,
	faTimes,
	faBuilding,
	faUpload,
	faCircleNotch,
	faCloudArrowUp,
	faExternalLinkAlt,
	faSearch,
	faBullhorn,
	faImage,
} from '@fortawesome/free-solid-svg-icons'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	CompanyAdItem,
	GetCompanyAdsAdmin,
	CreateCompanyAdAdmin,
	UpdateCompanyAdAdmin,
	DeleteCompanyAdAdmin,
	ReorderCompanyAdsAdmin,
	GetCompaniesAdmin,
	CompanyItem,
	FileUploadToFGGroup,
} from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import '../products-theme.css'

const getPreviewUrl = (url?: string) => {
	if (!url) return ''
	if (
		url.startsWith('blob:') ||
		url.startsWith('http://') ||
		url.startsWith('https://') ||
		url.startsWith('/')
	) {
		return url
	}
	return `${FG_GROUP_FILE_BASE_URL}/${url}`
}

export const CompanyAdManage: React.FC = () => {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [ads, setAds] = useState<CompanyAdItem[]>([])
	const [companies, setCompanies] = useState<CompanyItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [uploadingImage, setUploadingImage] = useState<boolean>(false)

	// Filters
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [companyFilter, setCompanyFilter] = useState<string>('All')
	const [statusFilter, setStatusFilter] = useState<string>('All')

	// Modal State
	const [showModal, setShowModal] = useState<boolean>(false)
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
	const [currentId, setCurrentId] = useState<string>('')
	const [imagePreview, setImagePreview] = useState<string>('')

	// Form State with ONLY the 5 requested fields:
	// 1. company (Company / Brand)
	// 2. title (Title)
	// 3. image (Ads Banner Upload)
	// 4. url (Redirect URL / Store Link)
	// 5. status (Live & Active on Website)
	const [formData, setFormData] = useState<Partial<CompanyAdItem>>({
		company: '',
		title: '',
		image: '',
		url: '/gomzi-supplement',
		status: true,
	})

	const loadData = async () => {
		try {
			setLoading(true)
			const [adsRes, compRes]: any = await Promise.all([
				GetCompanyAdsAdmin(),
				GetCompaniesAdmin(),
			])
			if (adsRes?.data?.ads) {
				setAds(adsRes.data.ads)
			}
			if (compRes?.data?.companies) {
				setCompanies(compRes.data.companies)
			}
		} catch (err: any) {
			console.error('Error fetching company ads data:', err)
			toast.error(err.message || 'Failed to load company ads')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [])

	const handleOpenCreateModal = () => {
		setModalMode('create')
		setCurrentId('')
		setImagePreview('')
		const defaultCompany = companies.length > 0 ? companies[0].name : ''
		setFormData({
			company: defaultCompany,
			title: '',
			image: '',
			url: defaultCompany ? `/gomzi-supplement?brand=${encodeURIComponent(defaultCompany)}` : '/gomzi-supplement',
			status: true,
		})
		setShowModal(true)
	}

	const handleOpenEditModal = (ad: CompanyAdItem) => {
		setModalMode('edit')
		setCurrentId(ad._id || ad.id || '')
		setImagePreview(getPreviewUrl(ad.image))
		setFormData({
			company: ad.company || '',
			title: ad.title || '',
			image: ad.image || '',
			url: ad.url || '/gomzi-supplement',
			status: ad.status !== undefined ? ad.status : true,
		})
		setShowModal(true)
	}

	const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return
		const file = e.target.files[0]
		setImagePreview(URL.createObjectURL(file))

		try {
			setUploadingImage(true)
			const res: any = await FileUploadToFGGroup([file], { directory: 'company-ads' })
			const fileUrl = res?.data?.fileURLs?.[0]
			if (fileUrl) {
				setFormData((prev) => ({ ...prev, image: fileUrl }))
				toast.success('Ad banner uploaded successfully!')
			}
		} catch (err: any) {
			console.error('Ad banner upload failed:', err)
			toast.error(err.message || 'Image upload failed')
		} finally {
			setUploadingImage(false)
		}
	}

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.company || !formData.company.trim()) {
			toast.error('Please select a company / brand')
			return
		}
		if (!formData.title || !formData.title.trim()) {
			toast.error('Title is required')
			return
		}
		if (!formData.image || !formData.image.trim()) {
			toast.error('Please upload an ads banner')
			return
		}

		try {
			setSaving(true)
			const payload: Partial<CompanyAdItem> = {
				company: formData.company.trim(),
				title: formData.title.trim(),
				image: formData.image.trim(),
				url: formData.url ? formData.url.trim() : `/gomzi-supplement?brand=${encodeURIComponent(formData.company.trim())}`,
				status: formData.status !== undefined ? formData.status : true,
				order: modalMode === 'create' ? ads.length + 1 : undefined,
			}

			if (modalMode === 'create') {
				const res: any = await CreateCompanyAdAdmin(payload)
				if (res?.data?.ad) {
					toast.success('Company ad created successfully!')
					setShowModal(false)
					loadData()
				}
			} else {
				const res: any = await UpdateCompanyAdAdmin({
					...payload,
					id: currentId,
				})
				if (res?.data?.ad) {
					toast.success('Company ad updated successfully!')
					setShowModal(false)
					loadData()
				}
			}
		} catch (err: any) {
			console.error('Error saving company ad:', err)
			toast.error(err.message || 'Failed to save company ad')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (ad: CompanyAdItem) => {
		const targetId = ad._id || ad.id
		if (!targetId) return

		const result = await Swal.fire({
			title: 'Delete Company Ad?',
			html: `Are you sure you want to delete the ad for <strong>${ad.company}</strong>?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#e11d48',
			cancelButtonColor: '#64748b',
			confirmButtonText: 'Yes, delete it',
		})

		if (result.isConfirmed) {
			try {
				await DeleteCompanyAdAdmin(targetId)
				toast.success('Company ad deleted successfully')
				setAds((prev) => prev.filter((item) => (item._id || item.id) !== targetId))
			} catch (err: any) {
				console.error('Delete failed:', err)
				toast.error(err.message || 'Failed to delete company ad')
			}
		}
	}

	const handleToggleStatus = async (ad: CompanyAdItem) => {
		const targetId = ad._id || ad.id
		if (!targetId) return
		const newStatus = !ad.status

		try {
			await UpdateCompanyAdAdmin({ id: targetId, status: newStatus })
			setAds((prev) =>
				prev.map((item) => ((item._id || item.id) === targetId ? { ...item, status: newStatus } : item))
			)
			toast.success(`Ad ${newStatus ? 'activated' : 'deactivated'}`)
		} catch (err: any) {
			toast.error(err.message || 'Failed to update status')
		}
	}

	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const newIndex = direction === 'up' ? index - 1 : index + 1
		if (newIndex < 0 || newIndex >= ads.length) return

		const reordered = [...ads]
		const [moved] = reordered.splice(index, 1)
		reordered.splice(newIndex, 0, moved)

		setAds(reordered)

		try {
			await ReorderCompanyAdsAdmin(
				reordered.map((item, idx) => ({ _id: item._id, id: item.id, order: idx + 1 }))
			)
			toast.success('Order updated')
		} catch (err: any) {
			console.error('Reorder failed:', err)
			toast.error('Failed to update order on server')
			loadData()
		}
	}

	const filteredAds = ads.filter((item) => {
		if (statusFilter === 'Active' && !item.status) return false
		if (statusFilter === 'Inactive' && item.status) return false
		if (companyFilter !== 'All' && item.company?.toLowerCase() !== companyFilter.toLowerCase()) return false

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase()
			return (
				item.title?.toLowerCase().includes(term) ||
				item.company?.toLowerCase().includes(term) ||
				item.url?.toLowerCase().includes(term)
			)
		}
		return true
	})

	const activeCount = ads.filter((a) => a.status).length
	const uniqueBrandsCount = new Set(ads.map((a) => a.company)).size

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Company Advertisements</PageTitle>

			{/* =========================================================================
			    HEADER & ACTIONS
			    ========================================================================= */}
			<div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-6'>
				<div>
					<div className='d-flex align-items-center gap-2'>
						<h1 className='gz-prod-title mb-0'>Company Advertisements</h1>
						<span className='badge badge-light-primary fw-bolder fs-8 px-3 py-1'>
							{ads.length} Total
						</span>
					</div>
					<p className='gz-prod-subtitle mb-0'>
						Upload company advertisement banners to be shown on the website
					</p>
				</div>
				<div className='d-flex align-items-center gap-2'>
					<Link to='/rag/companies' className='btn btn-sm btn-light-info d-flex align-items-center gap-2'>
						<FontAwesomeIcon icon={faBuilding} />
						<span>Manage Companies</span>
					</Link>
					<button
						type='button'
						onClick={handleOpenCreateModal}
						className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4 shadow-sm'>
						<FontAwesomeIcon icon={faPlus} />
						<span>Upload Ad Banner</span>
					</button>
				</div>
			</div>

			{/* =========================================================================
			    METRICS OVERVIEW
			    ========================================================================= */}
			<div className='row g-4 mb-6'>
				<div className='col-12 col-sm-4'>
					<div className='card bg-body shadow-sm border-0 p-4 h-100'>
						<div className='d-flex align-items-center gap-3'>
							<div className='rounded bg-light-primary text-primary p-3 fs-3 d-flex align-items-center justify-content-center' style={{ width: 48, height: 48 }}>
								<FontAwesomeIcon icon={faBullhorn} />
							</div>
							<div>
								<div className='fs-2 fw-bolder text-dark'>{ads.length}</div>
								<div className='text-muted fs-8 fw-semibold'>Total Company Ads</div>
							</div>
						</div>
					</div>
				</div>
				<div className='col-12 col-sm-4'>
					<div className='card bg-body shadow-sm border-0 p-4 h-100'>
						<div className='d-flex align-items-center gap-3'>
							<div className='rounded bg-light-success text-success p-3 fs-3 d-flex align-items-center justify-content-center' style={{ width: 48, height: 48 }}>
								<FontAwesomeIcon icon={faCheck} />
							</div>
							<div>
								<div className='fs-2 fw-bolder text-dark'>{activeCount}</div>
								<div className='text-muted fs-8 fw-semibold'>Live & Active on Website</div>
							</div>
						</div>
					</div>
				</div>
				<div className='col-12 col-sm-4'>
					<div className='card bg-body shadow-sm border-0 p-4 h-100'>
						<div className='d-flex align-items-center gap-3'>
							<div className='rounded bg-light-warning text-warning p-3 fs-3 d-flex align-items-center justify-content-center' style={{ width: 48, height: 48 }}>
								<FontAwesomeIcon icon={faBuilding} />
							</div>
							<div>
								<div className='fs-2 fw-bolder text-dark'>{uniqueBrandsCount}</div>
								<div className='text-muted fs-8 fw-semibold'>Brands Represented</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    FILTER & SEARCH TOOLBAR
			    ========================================================================= */}
			<div className='card bg-body shadow-sm border-0 mb-6'>
				<div className='card-body p-4'>
					<div className='row g-3 align-items-center'>
						<div className='col-12 col-md-5'>
							<div className='position-relative'>
								<FontAwesomeIcon
									icon={faSearch}
									className='position-absolute top-50 translate-middle-y ms-4 text-muted'
								/>
								<input
									type='text'
									className='form-control form-control-solid ps-12 fs-7'
									placeholder='Search by title, company / brand...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>
						<div className='col-6 col-md-4'>
							<select
								className='form-select form-select-solid fs-7'
								value={companyFilter}
								onChange={(e) => setCompanyFilter(e.target.value)}>
								<option value='All'>All Companies</option>
								{companies.map((c, i) => (
									<option key={i} value={c.name}>
										{c.name}
									</option>
								))}
							</select>
						</div>
						<div className='col-6 col-md-3'>
							<select
								className='form-select form-select-solid fs-7'
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}>
								<option value='All'>All Statuses</option>
								<option value='Active'>Active Only</option>
								<option value='Inactive'>Inactive Only</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    ADS LIST / CARDS VIEW
			    ========================================================================= */}
			{loading ? (
				<div className='card bg-body shadow-sm border-0 p-12 text-center'>
					<FontAwesomeIcon icon={faCircleNotch} spin className='fs-1 text-primary mb-3' />
					<div className='text-muted fs-7'>Loading company advertisements...</div>
				</div>
			) : filteredAds.length === 0 ? (
				<div className='card bg-body shadow-sm border-0 p-12 text-center'>
					<div className='rounded bg-light-primary text-primary p-4 mx-auto mb-3' style={{ width: 64, height: 64 }}>
						<FontAwesomeIcon icon={faBullhorn} className='fs-2' />
					</div>
					<h4 className='fw-bold text-dark mb-1'>No Company Ads Found</h4>
					<p className='text-muted fs-7 mb-4'>
						{searchTerm || companyFilter !== 'All'
							? 'No advertisements match your current search criteria.'
							: 'Upload your first company ad banner to show it on the website.'}
					</p>
					<button
						type='button'
						onClick={handleOpenCreateModal}
						className='btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-4 mx-auto'>
						<FontAwesomeIcon icon={faPlus} />
						<span>Upload Ad Banner</span>
					</button>
				</div>
			) : (
				<div className='row g-4'>
					{filteredAds.map((ad, idx) => {
						const targetId = ad._id || ad.id
						return (
							<div key={targetId || idx} className='col-12 col-lg-6'>
								<div className='card bg-body shadow-sm border h-100 overflow-hidden'>
									{/* Top Banner Graphic Preview */}
									<div className='position-relative' style={{ height: 200, background: '#09090b' }}>
										{ad.image ? (
											<img
												src={getPreviewUrl(ad.image)}
												alt={ad.title}
												className='w-100 h-100'
												style={{ objectFit: 'cover' }}
											/>
										) : (
											<div className='w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted'>
												<FontAwesomeIcon icon={faImage} className='fs-1 mb-2' />
												<span className='fs-8'>No Image Uploaded</span>
											</div>
										)}
										<div className='position-absolute top-0 start-0 w-100 h-100' style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }} />

										{/* Badges on Top */}
										<div className='position-absolute top-3 start-3 d-flex align-items-center gap-2'>
											<span className='badge bg-primary text-white fw-bold fs-9 px-2 py-1 shadow-sm'>
												<FontAwesomeIcon icon={faBuilding} className='me-1' />
												{ad.company}
											</span>
										</div>

										<div className='position-absolute top-3 end-3'>
											<span className={`badge ${ad.status ? 'bg-success' : 'bg-danger'} text-white fw-bold fs-9 px-2 py-1 shadow-sm`}>
												{ad.status ? 'Live & Active on Website' : 'Hidden'}
											</span>
										</div>

										{/* Bottom Banner Title Overlay */}
										<div className='position-absolute bottom-3 start-3 end-3 text-white'>
											<div className='fs-6 fw-bolder text-truncate mb-0'>{ad.title}</div>
										</div>
									</div>

									{/* Card Content & Action Bar */}
									<div className='card-body p-4 d-flex flex-column justify-content-between'>
										<div className='mb-3'>
											<div className='fs-8 text-muted d-flex align-items-center gap-1 text-truncate'>
												<FontAwesomeIcon icon={faExternalLinkAlt} className='text-primary me-1' />
												<span className='fw-bold text-gray-700'>Redirect URL: </span>
												<span className='text-dark fw-semibold text-truncate'>{ad.url || '/gomzi-supplement'}</span>
											</div>
										</div>

										{/* Bottom Actions Row */}
										<div className='d-flex align-items-center justify-content-between pt-3 border-top'>
											<div className='d-flex align-items-center gap-1'>
												<button
													type='button'
													className='btn btn-icon btn-sm btn-light'
													disabled={idx === 0}
													onClick={() => handleMove(idx, 'up')}
													title='Move Up'>
													<FontAwesomeIcon icon={faArrowUp} />
												</button>
												<button
													type='button'
													className='btn btn-icon btn-sm btn-light'
													disabled={idx === filteredAds.length - 1}
													onClick={() => handleMove(idx, 'down')}
													title='Move Down'>
													<FontAwesomeIcon icon={faArrowDown} />
												</button>
												<button
													type='button'
													className={`btn btn-sm ${ad.status ? 'btn-light-success' : 'btn-light-danger'} fs-9 py-1 px-2 ms-2`}
													onClick={() => handleToggleStatus(ad)}>
													<FontAwesomeIcon icon={ad.status ? faCheck : faTimes} className='me-1' />
													<span>{ad.status ? 'Active' : 'Inactive'}</span>
												</button>
											</div>

											<div className='d-flex align-items-center gap-2'>
												<button
													type='button'
													className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-1 py-1 px-3'
													onClick={() => handleOpenEditModal(ad)}>
													<FontAwesomeIcon icon={faEdit} />
													<span>Edit</span>
												</button>
												<button
													type='button'
													className='btn btn-sm btn-light-danger d-inline-flex align-items-center gap-1 py-1 px-3'
													onClick={() => handleDelete(ad)}>
													<FontAwesomeIcon icon={faTrash} />
													<span>Delete</span>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{/* =========================================================================
			    CREATE / EDIT MODAL (ONLY THE 5 REQUESTED FIELDS)
			    ========================================================================= */}
			{showModal && (
				<div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} tabIndex={-1}>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content border-0 shadow-lg rounded-3'>
							<form onSubmit={handleSave}>
								<div className='modal-header py-3 px-6 bg-light border-bottom'>
									<div className='d-flex align-items-center gap-2'>
										<div className='rounded bg-primary text-white p-2 d-flex align-items-center justify-content-center' style={{ width: 34, height: 34 }}>
											<FontAwesomeIcon icon={faBullhorn} />
										</div>
										<h4 className='modal-title fw-bolder mb-0'>
											{modalMode === 'create' ? 'Upload Company Advertisement' : 'Edit Company Advertisement'}
										</h4>
									</div>
									<button
										type='button'
										className='btn-close'
										onClick={() => setShowModal(false)}
									/>
								</div>

								<div className='modal-body p-6'>
									<div className='row g-4'>
										{/* Field 1: Company / Brand */}
										<div className='col-12'>
											<label className='form-label fw-bold required fs-7'>Company / Brand</label>
											<select
												className='form-select form-select-solid fs-7'
												value={formData.company}
												onChange={(e) => {
													const val = e.target.value
													setFormData((prev) => ({
														...prev,
														company: val,
														url: prev.url === '/gomzi-supplement' || !prev.url
															? `/gomzi-supplement?brand=${encodeURIComponent(val)}`
															: prev.url,
													}))
												}}
												required>
												<option value=''>-- Select Company / Brand --</option>
												{companies.map((c, i) => (
													<option key={i} value={c.name}>
														{c.name}
													</option>
												))}
											</select>
										</div>

										{/* Field 2: Title */}
										<div className='col-12'>
											<label className='form-label fw-bold required fs-7'>Title</label>
											<input
												type='text'
												className='form-control form-control-solid fs-7'
												placeholder='Enter ad title / headline'
												value={formData.title}
												onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
												required
											/>
										</div>

										{/* Field 3: Ads Banner Upload */}
										<div className='col-12'>
											<label className='form-label fw-bold required fs-7'>
												Ads Banner Upload
											</label>

											<div
												onClick={() => fileInputRef.current?.click()}
												className='border-2 border-dashed border-primary rounded p-4 text-center cursor-pointer bg-light-primary hover-elevate-up transition'
												style={{ minHeight: 140 }}>
												{imagePreview ? (
													<div className='position-relative d-inline-block'>
														<img
															src={imagePreview}
															alt='Preview'
															className='rounded shadow-sm'
															style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain' }}
														/>
														<div className='mt-2 text-primary fs-8 fw-bold'>
															<FontAwesomeIcon icon={faUpload} className='me-1' /> Click to Change Banner
														</div>
													</div>
												) : (
													<div className='py-4'>
														<FontAwesomeIcon icon={faCloudArrowUp} className='fs-1 text-primary mb-2' />
														<div className='fw-bold text-dark fs-7'>Click or Drag & Drop Banner Image</div>
														<div className='text-muted fs-8'>Recommended: 1200x500px or 800x450px (WebP, PNG, JPG)</div>
													</div>
												)}
												{uploadingImage && (
													<div className='mt-2 text-warning fs-8 fw-bold'>
														<FontAwesomeIcon icon={faCircleNotch} spin className='me-1' /> Uploading banner...
													</div>
												)}
											</div>
											<input
												ref={fileInputRef}
												type='file'
												accept='image/*'
												className='d-none'
												onChange={handleImageFileChange}
											/>

											{/* Manual URL input fallback */}
											<div className='mt-2'>
												<input
													type='text'
													className='form-control form-control-solid fs-8'
													placeholder='Or paste image URL (e.g. https://files.fggroup.in/...)'
													value={formData.image}
													onChange={(e) => {
														const val = e.target.value
														setFormData((prev) => ({ ...prev, image: val }))
														setImagePreview(getPreviewUrl(val))
													}}
												/>
											</div>
										</div>

										{/* Field 4: Redirect URL / Store Link */}
										<div className='col-12'>
											<label className='form-label fw-bold fs-7'>Redirect URL / Store Link</label>
											<input
												type='text'
												className='form-control form-control-solid fs-7'
												placeholder='e.g., /gomzi-supplement?brand=MuscleBlaze'
												value={formData.url}
												onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
											/>
										</div>

										{/* Field 5: Live & Active on Website */}
										<div className='col-12'>
											<div className='form-check form-switch form-check-custom form-check-solid p-3 rounded bg-light border d-flex align-items-center gap-3'>
												<input
													className='form-check-input ms-0'
													type='checkbox'
													id='statusSwitch'
													checked={formData.status}
													onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked }))}
												/>
												<label className='form-check-label fw-bold text-dark fs-7 mb-0 cursor-pointer' htmlFor='statusSwitch'>
													Live & Active on Website
												</label>
											</div>
										</div>
									</div>
								</div>

								<div className='modal-footer py-3 px-6 bg-light border-top d-flex justify-content-end gap-2'>
									<button
										type='button'
										className='btn btn-sm btn-light'
										onClick={() => setShowModal(false)}
										disabled={saving || uploadingImage}>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-5'
										disabled={saving || uploadingImage}>
										{saving ? (
											<>
												<FontAwesomeIcon icon={faCircleNotch} spin />
												<span>Saving...</span>
											</>
										) : (
											<>
												<FontAwesomeIcon icon={faCheck} />
												<span>{modalMode === 'create' ? 'Publish Ad' : 'Save Changes'}</span>
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default CompanyAdManage
