/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faBullhorn,
	faTrash,
	faEdit,
	faArrowUp,
	faArrowDown,
	faCheck,
	faTimes,
	faBuilding,
	faGlobe,
	faCertificate,
	faBoxesStacked,
	faUpload,
	faCircleNotch,
	faCloudArrowUp,
	faExternalLinkAlt,
	faSearch,
	faFlag,
	faPhone,
	faEnvelope,
	faIndustry,
} from '@fortawesome/free-solid-svg-icons'
import { PageTitle } from '../../../../_metronic/layout/core'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import {
	CompanyItem,
	GetCompaniesAdmin,
	CreateCompanyAdmin,
	UpdateCompanyAdmin,
	DeleteCompanyAdmin,
	ReorderCompaniesAdmin,
	FileUploadToFGGroup,
} from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import '../products-theme.css'

const getLogoPreviewUrl = (url?: string) => {
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

export const CompanyManage: React.FC = () => {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [companies, setCompanies] = useState<CompanyItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [statusFilter, setStatusFilter] = useState<string>('All')
	const [totalProducts, setTotalProducts] = useState<number>(0)

	// Modal State
	const [showModal, setShowModal] = useState<boolean>(false)
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
	const [currentId, setCurrentId] = useState<string>('')
	const [uploadingLogo, setUploadingLogo] = useState<boolean>(false)
	const [logoPreview, setLogoPreview] = useState<string>('')

	const [formData, setFormData] = useState<Partial<CompanyItem>>({
		name: '',
		slug: '',
		tagline: '',
		logo: '',
		website: '',
		manufacturer: '',
		countryOfOrigin: 'India',
		fssaiLicense: '',
		supportEmail: '',
		supportPhone: '',
		status: true,
		isFeatured: false,
	})

	const loadCompanies = async () => {
		try {
			setLoading(true)
			const res: any = await GetCompaniesAdmin()
			if (res?.data?.companies) {
				setCompanies(res.data.companies)
				if (res.data.totalProducts) setTotalProducts(res.data.totalProducts)
			}
		} catch (err: any) {
			console.error('Error fetching companies:', err)
			toast.error(err.message || 'Failed to load companies')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadCompanies()
	}, [])

	const handleOpenCreateModal = () => {
		setModalMode('create')
		setCurrentId('')
		setFormData({
			name: '',
			slug: '',
			tagline: '',
			logo: '',
			website: '',
			manufacturer: '',
			countryOfOrigin: 'India',
			fssaiLicense: '',
			supportEmail: '',
			supportPhone: '',
			status: true,
			isFeatured: false,
		})
		setLogoPreview('')
		setShowModal(true)
	}

	const handleOpenEditModal = (comp: CompanyItem) => {
		setModalMode('edit')
		setCurrentId(comp._id || comp.id || '')
		setFormData({
			name: comp.name || '',
			slug: comp.slug || '',
			tagline: comp.tagline || '',
			logo: comp.logo || '',
			website: comp.website || '',
			manufacturer: comp.manufacturer || '',
			countryOfOrigin: comp.countryOfOrigin || 'India',
			fssaiLicense: comp.fssaiLicense || '',
			supportEmail: comp.supportEmail || '',
			supportPhone: comp.supportPhone || '',
			status: comp.status ?? true,
			isFeatured: comp.isFeatured ?? false,
		})
		setLogoPreview(getLogoPreviewUrl(comp.logo))
		setShowModal(true)
	}

	const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			setUploadingLogo(true)
			setLogoPreview(URL.createObjectURL(file))
			const uploadRes: any = await FileUploadToFGGroup([file], { directory: 'brands' })
			const remoteUrl = uploadRes?.data?.fileURLs?.[0]
			if (remoteUrl) {
				setFormData((prev) => ({ ...prev, logo: remoteUrl }))
				toast.success('Logo uploaded')
			}
		} catch (err: any) {
			console.error('Error uploading logo:', err)
			toast.error('Failed to upload logo image')
		} finally {
			setUploadingLogo(false)
		}
	}

	const handleSaveCompany = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.name?.trim()) {
			toast.error('Company / Brand name is required')
			return
		}

		try {
			setSaving(true)
			if (modalMode === 'create') {
				const res: any = await CreateCompanyAdmin(formData)
				if (res?.data?.companies) {
					setCompanies(res.data.companies)
				} else {
					await loadCompanies()
				}
				toast.success('Company created successfully')
			} else {
				const res: any = await UpdateCompanyAdmin({ ...formData, id: currentId })
				if (res?.data?.companies) {
					setCompanies(res.data.companies)
				} else {
					await loadCompanies()
				}
				toast.success('Company updated successfully')
			}
			setShowModal(false)
		} catch (err: any) {
			console.error('Error saving company:', err)
			toast.error(err.message || 'Failed to save company')
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteCompany = async (id: string, name: string) => {
		const result = await Swal.fire({
			title: 'Delete Company / Brand?',
			text: `Are you sure you want to delete "${name}"? This will not delete products already tagged with this company, but it will remove it from active brand selections.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DC2626',
			cancelButtonColor: '#71809A',
			confirmButtonText: 'Yes, delete',
			cancelButtonText: 'Cancel',
		})

		if (result.isConfirmed) {
			try {
				const res: any = await DeleteCompanyAdmin(id)
				if (res?.data?.companies) {
					setCompanies(res.data.companies)
				} else {
					setCompanies((prev) => prev.filter((c) => (c._id || c.id) !== id))
				}
				toast.success(`"${name}" deleted`)
			} catch (err: any) {
				console.error('Error deleting company:', err)
				toast.error(err.message || 'Failed to delete company')
			}
		}
	}

	const handleToggleStatus = async (comp: CompanyItem) => {
		const compId = comp._id || comp.id
		if (!compId) return
		const newStatus = !comp.status

		try {
			await UpdateCompanyAdmin({ id: compId, status: newStatus })
			setCompanies((prev) =>
				prev.map((c) => ((c._id || c.id) === compId ? { ...c, status: newStatus } : c))
			)
			toast.success(`${comp.name} marked as ${newStatus ? 'Active' : 'Inactive'}`)
		} catch (err: any) {
			toast.error(err.message || 'Failed to update status')
		}
	}

	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const targetIndex = direction === 'up' ? index - 1 : index + 1
		if (targetIndex < 0 || targetIndex >= filteredCompanies.length) return

		const updated = [...filteredCompanies]
		const temp = updated[index]
		updated[index] = updated[targetIndex]
		updated[targetIndex] = temp

		setCompanies(updated)

		try {
			const payload = updated.map((c) => ({ id: c._id || c.id }))
			await ReorderCompaniesAdmin(payload)
		} catch (err: any) {
			toast.error('Failed to reorder companies')
			loadCompanies()
		}
	}

	const filteredCompanies = companies.filter((c) => {
		const matchesSearch =
			!searchTerm ||
			c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			c.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			c.tagline?.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesStatus =
			statusFilter === 'All' ||
			(statusFilter === 'Active' && c.status === true) ||
			(statusFilter === 'Inactive' && c.status === false)
		return matchesSearch && matchesStatus
	})

	const activeCount = companies.filter((c) => c.status).length
	const featuredCount = companies.filter((c) => c.isFeatured).length

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Companies & Brands</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/product-list'>Products & Orders</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Companies & Brands</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Companies & Brands</h1>
					<p className='gz-prod-subtitle'>
						Configure corporate manufacturers, registered brand names, origin and compliance
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<Link to='/rag/company-ads' className='btn btn-sm btn-light-warning d-inline-flex align-items-center gap-2 py-2 px-3 fw-bold'>
						<FontAwesomeIcon icon={faBullhorn} />
						<span>Company Ads</span>
					</Link>
					<Link to='/rag/product-add' className='gz-prod-btn-cancel text-decoration-none'>
						+ Add Product
					</Link>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={handleOpenCreateModal}>
						<FontAwesomeIcon icon={faPlus} />
						<span>Add Company / Brand</span>
					</button>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS (4 CARDS)
			    ========================================================================= */}
			<div className='gz-prod-summary-grid mb-6'>
				{/* Total Brands */}
				<div className='gz-prod-summary-card'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBuilding} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Total Companies & Brands</span>
						<span className='gz-prod-summary-value'>{companies.length}</span>
					</div>
				</div>

				{/* Active Brands */}
				<div className='gz-prod-summary-card green'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faCheck} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Active Brands</span>
						<span className='gz-prod-summary-value'>{activeCount}</span>
					</div>
				</div>

				{/* Total Products Mapped */}
				<div className='gz-prod-summary-card blue'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBoxesStacked} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Catalog Products</span>
						<span className='gz-prod-summary-value'>{totalProducts}</span>
					</div>
				</div>

				{/* Featured Brands */}
				<div className='gz-prod-summary-card amber'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faCertificate} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Featured Brands</span>
						<span className='gz-prod-summary-value'>{featuredCount}</span>
					</div>
				</div>
			</div>

			{/* =========================================================================
			    TOOLBAR (SEARCH & STATUS FILTER)
			    ========================================================================= */}
			<div className='gz-prod-toolbar'>
				<div className='gz-prod-toolbar-left'>
					<div className='position-relative' style={{ minWidth: '280px' }}>
						<FontAwesomeIcon
							icon={faSearch}
							className='position-absolute top-50 translate-middle-y ms-3 text-muted'
						/>
						<input
							type='text'
							className='gz-prod-input ps-9'
							placeholder='Search company, manufacturer, tagline...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<DownloadExcelButton
						data={filteredCompanies}
						columns={[
							{ title: 'Company Name', field: 'name' },
							{ title: 'Manufacturer', field: 'manufacturer' },
							{ title: 'Tagline', field: 'tagline' },
							{ title: 'Country of Origin', field: 'countryOfOrigin' },
							{ title: 'Website', field: 'website' },
							{ title: 'FSSAI License', field: 'fssaiLicense' },
							{ title: 'Status', field: 'status' },
						]}
						filename='companies-list'
					/>

					<div style={{ minWidth: '140px' }}>
						<SelectField
							value={statusFilter}
							onChange={(e: any) => setStatusFilter(e.target.value)}
							options={[
								{ label: 'All Status', value: 'All' },
								{ label: 'Active Only', value: 'Active' },
								{ label: 'Inactive Only', value: 'Inactive' },
							]}
							showLabel={false}
							marginRemove={true}
							hideDefaultOption={true}
							searchable={false}
							defaultLabel='All Status'
						/>
					</div>
				</div>

				<div className='gz-prod-toolbar-right'>
					<span className='text-muted fs-7'>
						Showing <strong>{filteredCompanies.length}</strong> of {companies.length} companies
					</span>
				</div>
			</div>

			{/* =========================================================================
			    COMPANIES TABLE
			    ========================================================================= */}
			<div className='gz-prod-table-card'>
				<div className='table-responsive'>
					<table className='gz-prod-table'>
						<thead>
							<tr>
								<th style={{ width: '48px', textAlign: 'center' }}>#</th>
								<th>Company / Brand</th>
								<th>Manufacturer / Entity</th>
								<th>Origin</th>
								<th>Compliance & Web</th>
								<th style={{ textAlign: 'center' }}>Products</th>
								<th style={{ textAlign: 'center' }}>Status</th>
								<th style={{ textAlign: 'center', width: '150px' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								Array.from({ length: 6 }).map((_, idx) => (
									<tr key={idx}>
										<td colSpan={8} style={{ padding: '16px 20px' }}>
											<div
												className='gz-prod-skeleton'
												style={{ height: '32px', width: '100%', borderRadius: '6px' }}
											/>
										</td>
									</tr>
								))
							) : filteredCompanies.length === 0 ? (
								<tr>
									<td colSpan={8} className='gz-table-empty-cell'>
										<div className='gz-empty-state-wrap py-10'>
											<div className='gz-prod-thumb-placeholder mb-3 mx-auto' style={{ width: '56px', height: '56px' }}>
												<FontAwesomeIcon icon={faBuilding} size='lg' />
											</div>
											<h4 className='fw-bold text-gray-800 mb-1'>No Companies Found</h4>
											<p className='text-muted fs-7 mb-4'>
												{searchTerm
													? 'No companies matched your search criteria.'
													: 'Create your first brand / company to begin categorizing products.'}
											</p>
											<button
												type='button'
												className='gz-prod-btn-primary'
												onClick={handleOpenCreateModal}>
												<FontAwesomeIcon icon={faPlus} />
												<span>Add Company / Brand</span>
											</button>
										</div>
									</td>
								</tr>
							) : (
								filteredCompanies.map((comp, idx) => {
									const previewUrl = getLogoPreviewUrl(comp.logo)
									return (
										<tr key={comp._id || comp.id || idx}>
											<td style={{ textAlign: 'center', color: '#71809A', fontSize: '12px' }}>
												{idx + 1}
											</td>
											<td>
												<div className='gz-prod-identity-cell'>
													{previewUrl ? (
														<img
															src={previewUrl}
															alt={comp.name}
															className='gz-prod-thumb'
															style={{ objectFit: 'contain', background: '#F8FAFC', padding: '2px' }}
															onError={(e) => {
																;(e.target as HTMLElement).style.display = 'none'
															}}
														/>
													) : (
														<div
															className='gz-prod-thumb-placeholder'
															style={{
																fontWeight: 700,
																fontSize: '13px',
																color: '#1E40AF',
																background: '#EFF6FF',
															}}>
															{comp.name.slice(0, 2).toUpperCase()}
														</div>
													)}
													<div className='gz-prod-identity-info'>
														<div className='d-flex align-items-center gap-2'>
															<span className='gz-prod-name'>{comp.name}</span>
															{comp.isFeatured && (
																<span className='badge badge-light-warning fs-9 py-0 px-2 fw-semibold'>
																	Featured
																</span>
															)}
														</div>
														{comp.tagline ? (
															<span className='gz-prod-subtext'>{comp.tagline}</span>
														) : comp.slug ? (
															<span className='gz-prod-subtext text-muted'>/{comp.slug}</span>
														) : null}
													</div>
												</div>
											</td>

											<td>
												<span className='text-gray-700 fw-medium fs-7'>
													{comp.manufacturer || 'Gomzi Life Sciences / FG Group'}
												</span>
											</td>

											<td>
												<span className='badge badge-light-secondary fs-8 py-1 px-2'>
													<FontAwesomeIcon icon={faFlag} className='me-1 fs-9' />
													{comp.countryOfOrigin || 'India'}
												</span>
											</td>

											<td>
												<div className='d-flex flex-column gap-1 fs-8'>
													{comp.website && (
														<a
															href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
															target='_blank'
															rel='noopener noreferrer'
															className='text-primary text-decoration-none d-inline-flex align-items-center gap-1'>
															<FontAwesomeIcon icon={faGlobe} />
															<span>Website</span>
															<FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '9px' }} />
														</a>
													)}
													{comp.fssaiLicense && (
														<span className='text-muted'>
															FSSAI: <span className='text-dark fw-semibold'>{comp.fssaiLicense}</span>
														</span>
													)}
												</div>
											</td>

											<td style={{ textAlign: 'center' }}>
												<span
													className='badge badge-light-primary fw-bold fs-7'
													title={`${comp.productCount || 0} Products Mapped`}>
													{comp.productCount || 0}
												</span>
											</td>

											<td style={{ textAlign: 'center' }}>
												<button
													type='button'
													className={`badge border-0 cursor-pointer ${
														comp.status ? 'badge-light-success text-success' : 'badge-light-danger text-danger'
													}`}
													style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}
													onClick={() => handleToggleStatus(comp)}>
													{comp.status ? 'Active' : 'Inactive'}
												</button>
											</td>

											<td style={{ textAlign: 'center' }}>
												<div className='d-flex align-items-center justify-content-center gap-1'>
													{/* Reorder Up */}
													<button
														type='button'
														className='btn btn-icon btn-sm btn-light btn-active-light-primary'
														style={{ width: '28px', height: '28px' }}
														onClick={() => handleMove(idx, 'up')}
														disabled={idx === 0}
														title='Move Up'>
														<FontAwesomeIcon icon={faArrowUp} />
													</button>
													{/* Reorder Down */}
													<button
														type='button'
														className='btn btn-icon btn-sm btn-light btn-active-light-primary'
														style={{ width: '28px', height: '28px' }}
														onClick={() => handleMove(idx, 'down')}
														disabled={idx === filteredCompanies.length - 1}
														title='Move Down'>
														<FontAwesomeIcon icon={faArrowDown} />
													</button>
													{/* Edit */}
													<button
														type='button'
														className='btn btn-icon btn-sm btn-light-warning'
														style={{ width: '28px', height: '28px' }}
														onClick={() => handleOpenEditModal(comp)}
														title='Edit Company'>
														<FontAwesomeIcon icon={faEdit} />
													</button>
													{/* Delete */}
													<button
														type='button'
														className='btn btn-icon btn-sm btn-light-danger'
														style={{ width: '28px', height: '28px' }}
														onClick={() => handleDeleteCompany(comp._id || comp.id || '', comp.name)}
														title='Delete Company'>
														<FontAwesomeIcon icon={faTrash} />
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
			</div>

			{/* =========================================================================
			    MODAL (CREATE & EDIT COMPANY / BRAND)
			    ========================================================================= */}
			{showModal && (
				<div
					className='modal fade show d-block'
					style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1050 }}
					tabIndex={-1}>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content' style={{ borderRadius: '16px', overflow: 'hidden' }}>
							<div
								className='modal-header'
								style={{
									background: '#F8FAFC',
									borderBottom: '1px solid #E2E8F0',
									padding: '20px 24px',
								}}>
								<div>
									<h5 className='modal-title fw-bold text-gray-900 m-0'>
										{modalMode === 'create' ? 'Add New Company / Brand' : `Edit: ${formData.name}`}
									</h5>
									<p className='text-muted fs-7 m-0 mt-1'>
										Define corporate branding, manufacturer credentials, and compliance
									</p>
								</div>
								<button
									type='button'
									className='btn-close'
									onClick={() => setShowModal(false)}
								/>
							</div>

							<form onSubmit={handleSaveCompany}>
								<div className='modal-body' style={{ padding: '24px' }}>
									<div className='row g-4'>
										{/* Company Name */}
										<div className='col-12 col-md-7'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>
													Company / Brand Name <span className='req'>*</span>
												</label>
												<input
													type='text'
													required
													className='gz-prod-input'
													placeholder='e.g., Optimum Nutrition, Wellcore, Gomzi Nutrition'
													value={formData.name || ''}
													onChange={(e) => {
														const val = e.target.value
														setFormData((prev) => ({
															...prev,
															name: val,
															slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
														}))
													}}
												/>
											</div>
										</div>

										{/* Slug */}
										<div className='col-12 col-md-5'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Brand Slug</label>
												<input
													type='text'
													className='gz-prod-input'
													placeholder='e.g., optimum-nutrition'
													value={formData.slug || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, slug: e.target.value }))
													}
												/>
											</div>
										</div>

										{/* Tagline */}
										<div className='col-12'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Brand Slogan / Tagline</label>
												<input
													type='text'
													className='gz-prod-input'
													placeholder='e.g., Pure Micronised Performance Formulas & Quality Protein'
													value={formData.tagline || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, tagline: e.target.value }))
													}
												/>
											</div>
										</div>

										{/* Manufacturer */}
										<div className='col-12 col-md-6'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Manufacturer / Marketed By</label>
												<input
													type='text'
													className='gz-prod-input'
													placeholder='e.g., Gomzi Life Sciences / FG Group Pvt Ltd'
													value={formData.manufacturer || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))
													}
												/>
											</div>
										</div>

										{/* Country of Origin */}
										<div className='col-12 col-md-6'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Country of Origin</label>
												<SelectField
													value={formData.countryOfOrigin || 'India'}
													onChange={(e: any) =>
														setFormData((prev) => ({ ...prev, countryOfOrigin: e.target.value }))
													}
													options={[
														{ label: 'India', value: 'India' },
														{ label: 'USA', value: 'USA' },
														{ label: 'United Kingdom', value: 'UK' },
														{ label: 'Germany', value: 'Germany' },
														{ label: 'Canada', value: 'Canada' },
														{ label: 'Australia', value: 'Australia' },
														{ label: 'Other', value: 'Other' },
													]}
													showLabel={false}
													marginRemove={true}
													hideDefaultOption={true}
													searchable={false}
												/>
											</div>
										</div>

										{/* FSSAI License */}
										<div className='col-12 col-md-6'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>FSSAI / Reg License</label>
												<input
													type='text'
													className='gz-prod-input'
													placeholder='e.g., 10020021000123'
													value={formData.fssaiLicense || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, fssaiLicense: e.target.value }))
													}
												/>
											</div>
										</div>

										{/* Website URL */}
										<div className='col-12 col-md-6'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Official Website URL</label>
												<input
													type='text'
													className='gz-prod-input'
													placeholder='e.g., https://gomzinutrition.com'
													value={formData.website || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, website: e.target.value }))
													}
												/>
											</div>
										</div>

										{/* Support Email & Phone */}
										<div className='col-12 col-md-6'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Support Email</label>
												<input
													type='email'
													className='gz-prod-input'
													placeholder='e.g., support@brand.com'
													value={formData.supportEmail || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, supportEmail: e.target.value }))
													}
												/>
											</div>
										</div>

										<div className='col-12 col-md-6'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Support Phone</label>
												<input
													type='text'
													className='gz-prod-input'
													placeholder='e.g., +91 98765 43210'
													value={formData.supportPhone || ''}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, supportPhone: e.target.value }))
													}
												/>
											</div>
										</div>

										{/* Logo Upload */}
										<div className='col-12'>
											<div className='gz-prod-field-group'>
												<label className='gz-prod-label'>Brand Logo Image</label>
												<input
													type='file'
													ref={fileInputRef}
													className='d-none'
													accept='image/*'
													onChange={handleLogoFileChange}
												/>

												<div className='d-flex align-items-center gap-3'>
													{logoPreview ? (
														<div
															className='gz-prod-image-card'
															style={{ width: '80px', height: '80px', position: 'relative' }}>
															<img
																src={logoPreview}
																alt='Logo Preview'
																style={{ width: '100%', height: '100%', objectFit: 'contain' }}
															/>
															<button
																type='button'
																className='gz-prod-image-remove'
																onClick={() => {
																	setLogoPreview('')
																	setFormData((prev) => ({ ...prev, logo: '' }))
																}}>
																✕
															</button>
														</div>
													) : (
														<div
															className='gz-prod-thumb-placeholder'
															style={{ width: '80px', height: '80px', cursor: 'pointer' }}
															onClick={() => fileInputRef.current?.click()}>
															<FontAwesomeIcon icon={faUpload} />
														</div>
													)}

													<div className='flex-grow-1'>
														<button
															type='button'
															className='gz-prod-btn-cancel py-2 px-3 fs-7 mb-1'
															disabled={uploadingLogo}
															onClick={() => fileInputRef.current?.click()}>
															{uploadingLogo ? (
																<>
																	<FontAwesomeIcon icon={faCircleNotch} spin className='me-1' />
																	Uploading...
																</>
															) : (
																<>
																	<FontAwesomeIcon icon={faCloudArrowUp} className='me-1' />
																	Choose Logo File
																</>
															)}
														</button>
														<div className='text-muted fs-8'>
															Or paste direct image URL below (PNG, SVG, or WebP recommended)
														</div>
														<input
															type='text'
															className='gz-prod-input mt-2'
															placeholder='https://example.com/logo.png'
															value={formData.logo || ''}
															onChange={(e) => {
																setFormData((prev) => ({ ...prev, logo: e.target.value }))
																setLogoPreview(e.target.value)
															}}
														/>
													</div>
												</div>
											</div>
										</div>

										{/* Toggles: Active & Featured */}
										<div className='col-12 col-md-6'>
											<div className='form-check form-switch form-check-custom form-check-solid pt-2'>
												<input
													className='form-check-input'
													type='checkbox'
													id='statusToggle'
													checked={formData.status ?? true}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, status: e.target.checked }))
													}
												/>
												<label className='form-check-label fw-bold text-gray-800' htmlFor='statusToggle'>
													Active Brand (Visible in Catalog)
												</label>
											</div>
										</div>

										<div className='col-12 col-md-6'>
											<div className='form-check form-switch form-check-custom form-check-solid pt-2'>
												<input
													className='form-check-input'
													type='checkbox'
													id='featuredToggle'
													checked={formData.isFeatured ?? false}
													onChange={(e) =>
														setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
													}
												/>
												<label className='form-check-label fw-bold text-gray-800' htmlFor='featuredToggle'>
													Featured Brand (Highlight in UI)
												</label>
											</div>
										</div>
									</div>
								</div>

								<div
									className='modal-footer'
									style={{
										background: '#F8FAFC',
										borderTop: '1px solid #E2E8F0',
										padding: '16px 24px',
									}}>
									<button
										type='button'
										className='gz-prod-btn-cancel'
										onClick={() => setShowModal(false)}>
										Cancel
									</button>
									<button
										type='submit'
										className='gz-prod-btn-primary'
										disabled={saving}>
										{saving ? (
											<>
												<FontAwesomeIcon icon={faCircleNotch} spin />
												<span>Saving Company...</span>
											</>
										) : (
											<>
												<FontAwesomeIcon icon={faCheck} />
												<span>{modalMode === 'create' ? 'Create Company' : 'Save Changes'}</span>
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

export default CompanyManage
