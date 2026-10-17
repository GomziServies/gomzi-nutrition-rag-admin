import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	CategoryItem,
	GetCategoriesAdmin,
	CreateCategoryAdmin,
	UpdateCategoryAdmin,
	DeleteCategoryAdmin,
	ReorderCategoriesAdmin,
	FileUploadToFGGroup,
} from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faTrash,
	faEdit,
	faArrowUp,
	faArrowDown,
	faCheck,
	faTimes,
	faImage,
	faTag,
	faListOl,
	faBoxesStacked,
	faEye,
	faUpload,
	faRotateLeft,
	faLink,
	faStar,
} from '@fortawesome/free-solid-svg-icons'
import '../common-management.css'
import '../products-theme.css'

const PRESET_IMAGES = [
	{ label: 'Whey Protein', url: '/images/product-category/whey-protein.webp' },
	{ label: 'Mass Gainer', url: '/images/product-category/mass-gainer.webp' },
	{ label: 'Plant Protein', url: '/images/product-category/plant-protein.webp' },
	{ label: 'Pre Workout', url: '/images/product-category/pre-workout.webp' },
	{ label: 'BCAA Orange', url: '/images/product-category/Bcaa-tangy-orange.webp' },
	{ label: 'Creatine', url: '/images/product-category/creatine.webp' },
	{ label: 'Multivitamins', url: '/images/product-category/Multivitamins.webp' },
	{ label: 'Multi-Vitamin Trio', url: '/images/product-category/multi-vitamin.webp' },
	{ label: 'Peanut Butter', url: '/images/product-category/peanut-butter.webp' },
]

const getPreviewUrl = (url?: string) => {
	if (!url) return '/images/product-placeholder.webp'
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

export default function CategoryManage() {
	const [categories, setCategories] = useState<CategoryItem[]>([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [totalProducts, setTotalProducts] = useState(0)

	// Modal State
	const [showModal, setShowModal] = useState(false)
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
	const [currentId, setCurrentId] = useState<string>('')
	const [formData, setFormData] = useState<Partial<CategoryItem>>({
		title: '',
		slug: '',
		subtitle: '',
		tag: 'PREMIUM',
		spec: '',
		image: '/images/product-category/whey-protein.webp',
		bg: '#140e0c',
		accent: '#ff8914',
		url: '',
		status: true,
	})
	const [uploadingImage, setUploadingImage] = useState(false)
	const [imageFile, setImageFile] = useState<File | null>(null)
	const [imagePreview, setImagePreview] = useState('')

	// Fetch categories
	const loadCategories = async () => {
		try {
			setLoading(true)
			const res: any = await GetCategoriesAdmin()
			if (res?.data?.categories) {
				setCategories(res.data.categories)
				if (res.data.totalProducts) setTotalProducts(res.data.totalProducts)
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to load product categories')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadCategories()
	}, [])

	// Auto generate slug from title
	const handleTitleChange = (val: string) => {
		const slugVal = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
		setFormData((prev) => ({
			...prev,
			title: val,
			slug: modalMode === 'create' ? slugVal : prev.slug,
			url: modalMode === 'create' ? `/gomzi-supplement/${slugVal}` : prev.url,
		}))
	}

	const openCreateModal = () => {
		setModalMode('create')
		setCurrentId('')
		setFormData({
			title: '',
			slug: '',
			subtitle: '',
			tag: 'MOST POPULAR',
			spec: '',
			image: '/images/product-category/whey-protein.webp',
			bg: '#140e0c',
			accent: '#ff8914',
			url: '',
			status: true,
		})
		setImageFile(null)
		setImagePreview('')
		setShowModal(true)
	}

	const openEditModal = (cat: CategoryItem) => {
		setModalMode('edit')
		setCurrentId(cat._id || cat.id || '')
		setFormData({
			title: cat.title,
			slug: cat.slug,
			subtitle: cat.subtitle || '',
			tag: cat.tag || 'PREMIUM',
			spec: cat.spec || '',
			image: cat.image,
			bg: cat.bg || '#140e0c',
			accent: cat.accent || '#ff8914',
			url: cat.url || `/gomzi-supplement/${cat.slug}`,
			status: cat.status !== undefined ? cat.status : true,
		})
		setImageFile(null)
		setImagePreview(getPreviewUrl(cat.image))
		setShowModal(true)
	}

	const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setImageFile(file)
			setImagePreview(URL.createObjectURL(file))
		}
	}

	const handlePresetSelect = (presetUrl: string) => {
		setImageFile(null)
		setImagePreview(presetUrl)
		setFormData((prev) => ({ ...prev, image: presetUrl }))
	}

	// Submit Form
	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title?.trim()) {
			toast.error('Category title is required')
			return
		}

		try {
			setSaving(true)
			let finalImage = formData.image || '/images/product-placeholder.webp'

			// Upload new file if selected
			if (imageFile) {
				setUploadingImage(true)
				const uploadRes: any = await FileUploadToFGGroup([imageFile], {
					directory: 'categories',
				})
				const uploadedKey = uploadRes?.data?.fileURLs?.[0]
				if (uploadedKey) {
					finalImage = uploadedKey
				}
				setUploadingImage(false)
			}

			const payload: any = {
				...formData,
				image: finalImage,
			}

			if (modalMode === 'edit') {
				payload.id = currentId
				const res: any = await UpdateCategoryAdmin(payload)
				if (res?.data?.categories) {
					setCategories(res.data.categories)
				} else {
					await loadCategories()
				}
				toast.success(`Category "${formData.title}" updated successfully!`)
			} else {
				const res: any = await CreateCategoryAdmin(payload)
				if (res?.data?.categories) {
					setCategories(res.data.categories)
				} else {
					await loadCategories()
				}
				toast.success(`Category "${formData.title}" created successfully!`)
			}

			setShowModal(false)
		} catch (err: any) {
			toast.error(err.message || 'Failed to save category')
		} finally {
			setSaving(false)
			setUploadingImage(false)
		}
	}

	// Delete
	const handleDelete = async (cat: CategoryItem) => {
		const catId = cat._id || cat.id
		if (!catId) return
		if (!window.confirm(`Are you sure you want to delete "${cat.title}"?`)) return

		try {
			const res: any = await DeleteCategoryAdmin(catId)
			if (res?.data?.categories) {
				setCategories(res.data.categories)
			} else {
				await loadCategories()
			}
			toast.success(`Category "${cat.title}" deleted`)
		} catch (err: any) {
			toast.error(err.message || 'Failed to delete category')
		}
	}

	// Quick Toggle Status
	const handleToggleStatus = async (cat: CategoryItem) => {
		const catId = cat._id || cat.id
		if (!catId) return
		const nextStatus = !cat.status

		try {
			// Optimistic UI update
			setCategories((prev) =>
				prev.map((c) => ((c._id || c.id) === catId ? { ...c, status: nextStatus } : c))
			)
			await UpdateCategoryAdmin({ id: catId, status: nextStatus })
			toast.success(`"${cat.title}" is now ${nextStatus ? 'Active' : 'Inactive'}`)
		} catch (err: any) {
			toast.error(err.message || 'Failed to update category status')
			await loadCategories()
		}
	}

	// Reorder
	const handleMove = async (index: number, direction: 'up' | 'down') => {
		if (
			(direction === 'up' && index === 0) ||
			(direction === 'down' && index === categories.length - 1)
		) {
			return
		}

		const newCats = [...categories]
		const targetIndex = direction === 'up' ? index - 1 : index + 1
		const temp = newCats[index]
		newCats[index] = newCats[targetIndex]
		newCats[targetIndex] = temp

		setCategories(newCats)
		try {
			await ReorderCategoriesAdmin(
				newCats.map((c) => ({ _id: c._id, id: c.id }))
			)
			toast.success('Categories order updated!')
		} catch (err: any) {
			toast.error('Failed to save order')
			await loadCategories()
		}
	}

	const activeCount = categories.filter((c) => c.status !== false).length

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>
				Product Categories ({categories.length})
			</PageTitle>

			{/* Breadcrumb */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span>Products & Orders</span>
				<span className='sep'>&gt;</span>
				<span className='current'>Categories</span>
			</div>

			{/* Top Header */}
			<div className='gz-mgmt-header mb-6'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Product Categories</h1>
					<p className='gz-mgmt-subtitle'>
						Curate storefront collections, formulation specs, accent branding, and display hierarchy.
					</p>
				</div>

				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={loadCategories}
						disabled={loading}>
						<FontAwesomeIcon icon={faRotateLeft} className='me-2' />
						<span>Refresh</span>
					</button>

					<button
						type='button'
						className='gz-mgmt-btn-primary'
						onClick={openCreateModal}>
						<FontAwesomeIcon icon={faPlus} className='me-2' />
						<span>Add New Category</span>
					</button>
				</div>
			</div>

			{/* Top Overview KPI Metric Cards */}
			<div className='gz-prod-summary-grid mb-6'>
				<div className='gz-prod-summary-card blue'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faBoxesStacked} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Total Categories</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '40px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-prod-summary-value'>{categories.length}</span>
						)}
					</div>
				</div>

				<div className='gz-prod-summary-card green'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faCheck} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Active on Website</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '40px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-prod-summary-value' style={{ color: '#168064' }}>
								{activeCount}
							</span>
						)}
					</div>
				</div>

				<div className='gz-prod-summary-card red'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faTimes} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Draft / Inactive</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '40px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-prod-summary-value' style={{ color: '#DC2626' }}>
								{categories.length - activeCount}
							</span>
						)}
					</div>
				</div>

				<div className='gz-prod-summary-card amber'>
					<div className='gz-prod-summary-icon'>
						<FontAwesomeIcon icon={faTag} />
					</div>
					<div className='gz-prod-summary-info'>
						<span className='gz-prod-summary-label'>Live Products</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '50px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-prod-summary-value' style={{ color: '#D97706' }}>
								{totalProducts || 150}+
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Main Content Card */}
			<div className='gz-mgmt-card mb-6'>
				<div
					className='p-5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3'
					style={{ backgroundColor: '#F8FAFD' }}>
					<div>
						<h3 className='fs-5 fw-bolder text-dark mb-0 d-flex align-items-center gap-2'>
							<span>Categories Catalog</span>
							{loading ? (
								<div className='gz-skeleton rounded' style={{ width: '38px', height: '22px' }} />
							) : (
								<span className='badge badge-light-primary fs-8 fw-bolder'>({categories.length})</span>
							)}
						</h3>
						<span className='text-muted fs-8'>
							Manage category ordering, formulation pills, and cover visuals for navigation filters.
						</span>
					</div>
				</div>

				<div className='p-0'>
					{loading ? (
						<div className='table-responsive'>
							<table className='gz-prod-table mb-0'>
								<thead>
									<tr>
										<th style={{ width: '85px', textAlign: 'center' }}>Order</th>
										<th style={{ minWidth: '220px' }}>Category Details</th>
										<th style={{ minWidth: '180px' }}>Tag &amp; Specification</th>
										<th style={{ minWidth: '170px' }}>Visual Asset</th>
										<th style={{ width: '110px', textAlign: 'center' }}>Status</th>
										<th style={{ width: '130px', textAlign: 'right', paddingRight: '20px' }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{[...Array(6)].map((_, idx) => (
										<tr key={`cat-skel-${idx}`} className='gz-skeleton-tr'>
											<td style={{ textAlign: 'center' }}>
												<div className='d-inline-flex align-items-center gap-1.5'>
													<div className='gz-skeleton rounded-2' style={{ width: '32px', height: '24px' }} />
													<div className='d-flex flex-column gap-1'>
														<div className='gz-skeleton rounded' style={{ width: '18px', height: '11px' }} />
														<div className='gz-skeleton rounded' style={{ width: '18px', height: '11px' }} />
													</div>
												</div>
											</td>
											<td>
												<div className='d-flex flex-column gap-1.5'>
													<div className='gz-skeleton rounded' style={{ width: '140px', height: '15px' }} />
													<div className='gz-skeleton rounded' style={{ width: '90px', height: '11px' }} />
													<div className='gz-skeleton rounded' style={{ width: '180px', height: '11px' }} />
												</div>
											</td>
											<td>
												<div className='d-flex flex-column gap-1.5'>
													<div className='gz-skeleton rounded-pill' style={{ width: '75px', height: '20px' }} />
													<div className='gz-skeleton rounded' style={{ width: '120px', height: '12px' }} />
												</div>
											</td>
											<td>
												<div className='d-flex align-items-center gap-2.5'>
													<div className='gz-skeleton rounded-2' style={{ width: '44px', height: '44px', flexShrink: 0 }} />
													<div className='d-flex flex-column gap-1'>
														<div className='gz-skeleton rounded' style={{ width: '90px', height: '12px' }} />
														<div className='gz-skeleton rounded' style={{ width: '60px', height: '10px' }} />
													</div>
												</div>
											</td>
											<td style={{ textAlign: 'center' }}>
												<div className='gz-skeleton rounded-pill mx-auto' style={{ width: '60px', height: '22px' }} />
											</td>
											<td style={{ textAlign: 'right', paddingRight: '20px' }}>
												<div className='d-inline-flex align-items-center justify-content-end gap-1.5'>
													<div className='gz-skeleton rounded' style={{ width: '30px', height: '30px' }} />
													<div className='gz-skeleton rounded' style={{ width: '30px', height: '30px' }} />
													<div className='gz-skeleton rounded' style={{ width: '30px', height: '30px' }} />
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : categories.length === 0 ? (
						<div className='text-center py-12 p-8'>
							<FontAwesomeIcon icon={faBoxesStacked} className='fs-1 text-muted mb-3' />
							<h4 className='fw-bold text-gray-800'>No Categories Found</h4>
							<p className='text-muted fs-7'>Click &quot;Add New Category&quot; to create your first category card.</p>
							<button className='gz-mgmt-btn-primary mx-auto mt-2' onClick={openCreateModal}>
								<FontAwesomeIcon icon={faPlus} className='me-2' /> Create Category
							</button>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='gz-prod-table mb-0'>
								<thead>
									<tr>
										<th style={{ width: '85px', textAlign: 'center' }}>Order</th>
										<th style={{ minWidth: '220px' }}>Category Details</th>
										<th style={{ minWidth: '180px' }}>Tag &amp; Specification</th>
										<th style={{ minWidth: '170px' }}>Visual Asset</th>
										<th style={{ width: '110px', textAlign: 'center' }}>Status</th>
										<th style={{ width: '130px', textAlign: 'right', paddingRight: '20px' }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{categories.map((cat, idx) => {
										const catId = cat._id || cat.id || `cat-${idx}`
										const isFirst = idx === 0
										const isLast = idx === categories.length - 1
										const previewSrc = getPreviewUrl(cat.image)

										return (
											<tr key={catId}>
												{/* Order & Reorder Controls */}
												<td style={{ textAlign: 'center' }}>
													<div className='d-inline-flex align-items-center gap-1.5'>
														<span
															className='fw-bold fs-8 px-2 py-1 rounded-2'
															style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
															#{idx + 1}
														</span>
														<div className='d-flex flex-column'>
															<button
																type='button'
																className='btn btn-sm p-0 d-flex align-items-center justify-content-center'
																style={{ width: '18px', height: '18px', backgroundColor: '#F1F5F9', borderRadius: '4px', border: '1px solid #E2E8F0' }}
																disabled={isFirst}
																onClick={() => handleMove(idx, 'up')}
																title='Move Up'>
																<FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '9px', color: isFirst ? '#CBD5E1' : '#334155' }} />
															</button>
															<button
																type='button'
																className='btn btn-sm p-0 d-flex align-items-center justify-content-center mt-0.5'
																style={{ width: '18px', height: '18px', backgroundColor: '#F1F5F9', borderRadius: '4px', border: '1px solid #E2E8F0' }}
																disabled={isLast}
																onClick={() => handleMove(idx, 'down')}
																title='Move Down'>
																<FontAwesomeIcon icon={faArrowDown} style={{ fontSize: '9px', color: isLast ? '#CBD5E1' : '#334155' }} />
															</button>
														</div>
													</div>
												</td>

												{/* Category Details */}
												<td>
													<div className='d-flex flex-column'>
														<span
															className='fw-bolder text-dark fs-6 cursor-pointer text-hover-primary'
															onClick={() => openEditModal(cat)}>
															{cat.title}
														</span>
														<span className='text-muted fs-8 font-monospace'>/{cat.slug}</span>
														{cat.subtitle && (
															<span className='text-muted fs-8 text-truncate mt-0.5' style={{ maxWidth: 320 }}>
																{cat.subtitle}
															</span>
														)}
													</div>
												</td>

												{/* Tag & Specification */}
												<td>
													<div className='d-flex flex-column gap-1 align-items-start'>
														{cat.tag && (
															<span
																className='badge px-2.5 py-1 rounded-pill fs-9 fw-bold text-uppercase'
																style={{
																	backgroundColor: `${cat.accent || '#ff8914'}15`,
																	color: cat.accent || '#ff8914',
																	border: `1px solid ${cat.accent || '#ff8914'}40`,
																}}>
																{cat.tag}
															</span>
														)}
														{cat.spec && (
															<span
																className='badge fs-9 fw-semibold px-2 py-1 rounded-2'
																style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
																{cat.spec}
															</span>
														)}
													</div>
												</td>

												{/* Image Thumbnail */}
												<td>
													<div className='d-flex align-items-center gap-2'>
														<div
															className='rounded-3 overflow-hidden shadow-sm d-flex align-items-center justify-content-center'
															style={{ width: '44px', height: '44px', minWidth: '44px', backgroundColor: '#0F172A', border: '1px solid #E2E8F0' }}>
															<img
																src={previewSrc}
																alt={cat.title}
																className='w-100 h-100 object-fit-cover'
																onError={(e: any) => {
																	e.currentTarget.onerror = null
																	e.currentTarget.src = '/images/product-placeholder.webp'
																}}
															/>
														</div>
														<span className='text-muted fs-9 text-truncate font-monospace' style={{ maxWidth: 110 }}>
															{cat.image.split('/').pop()}
														</span>
													</div>
												</td>

												{/* Status Toggle */}
												<td style={{ textAlign: 'center' }}>
													<button
														type='button'
														className='btn btn-sm px-3 py-1 fw-bold rounded-pill border-0'
														style={{
															backgroundColor: cat.status !== false ? '#DCFCE7' : '#FEE2E2',
															color: cat.status !== false ? '#15803D' : '#B91C1C',
															fontSize: '11px',
														}}
														onClick={() => handleToggleStatus(cat)}
														title={cat.status !== false ? 'Active (Click to disable)' : 'Inactive (Click to activate)'}>
														<FontAwesomeIcon icon={cat.status !== false ? faCheck : faTimes} className='me-1' />
														{cat.status !== false ? 'Active' : 'Draft'}
													</button>
												</td>

												{/* Actions */}
												<td style={{ textAlign: 'right', paddingRight: '20px' }}>
													<div className='d-inline-flex gap-2'>
														<button
															type='button'
															className='btn btn-sm btn-icon'
															style={{
																width: '32px',
																height: '32px',
																borderRadius: '8px',
																backgroundColor: '#EFF6FF',
																color: '#2563EB',
																border: '1px solid #DBEAFE',
															}}
															onClick={() => openEditModal(cat)}
															title='Edit Category'>
															<FontAwesomeIcon icon={faEdit} />
														</button>
														<button
															type='button'
															className='btn btn-sm btn-icon'
															style={{
																width: '32px',
																height: '32px',
																borderRadius: '8px',
																backgroundColor: '#FEF2F2',
																color: '#DC2626',
																border: '1px solid #FEE2E2',
															}}
															onClick={() => handleDelete(cat)}
															title='Delete Category'>
															<FontAwesomeIcon icon={faTrash} />
														</button>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* CREATE / EDIT MODAL */}
			{showModal && (
				<div
					className='modal fade show d-block'
					style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1055 }}
					tabIndex={-1}>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div
							className='modal-content border-0 shadow-lg'
							style={{ borderRadius: '16px', overflow: 'hidden' }}>
							<form onSubmit={handleSave}>
								<div
									className='p-5 d-flex align-items-center justify-content-between border-bottom'
									style={{ backgroundColor: '#F8FAFD' }}>
									<h4 className='modal-title fw-bolder text-dark fs-5 mb-0'>
										{modalMode === 'create' ? 'Create New Category' : `Edit Category: ${formData.title}`}
									</h4>
									<button
										type='button'
										className='btn btn-icon btn-sm btn-light'
										style={{ borderRadius: '8px', width: '32px', height: '32px' }}
										onClick={() => setShowModal(false)}>
										<FontAwesomeIcon icon={faTimes} />
									</button>
								</div>

								<div className='p-6'>
									<div className='row g-4'>
										{/* Title */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold text-dark fs-7 required'>
												Category Title
											</label>
											<input
												type='text'
												className='form-control'
												style={{ borderRadius: '10px', height: '44px' }}
												placeholder='e.g. Whey Protein, Creatine'
												value={formData.title || ''}
												onChange={(e) => handleTitleChange(e.target.value)}
												required
											/>
										</div>

										{/* Slug */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold text-dark fs-7'>
												URL Slug
											</label>
											<input
												type='text'
												className='form-control font-monospace'
												style={{ borderRadius: '10px', height: '44px' }}
												placeholder='e.g. whey-protein'
												value={formData.slug || ''}
												onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
											/>
										</div>

										{/* Tag */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold text-dark fs-7'>
												Tag Badge (e.g. MOST POPULAR, 100% VEGAN)
											</label>
											<input
												type='text'
												className='form-control'
												style={{ borderRadius: '10px', height: '44px' }}
												placeholder='e.g. MOST POPULAR'
												value={formData.tag || ''}
												onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
											/>
										</div>

										{/* Spec */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold text-dark fs-7'>
												Spec Pill (e.g. 24-27g Protein / Scoop)
											</label>
											<input
												type='text'
												className='form-control'
												style={{ borderRadius: '10px', height: '44px' }}
												placeholder='e.g. 24-27g Protein / Scoop'
												value={formData.spec || ''}
												onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
											/>
										</div>

										{/* Subtitle */}
										<div className='col-12'>
											<label className='form-label fw-bold text-dark fs-7'>
												Subtitle / Formulation Description
											</label>
											<textarea
												rows={2}
												className='form-control'
												style={{ borderRadius: '10px' }}
												placeholder='Brief description displayed on the category card...'
												value={formData.subtitle || ''}
												onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
											/>
										</div>

										{/* Image Preview & Selection */}
										<div className='col-12'>
											<label className='form-label fw-bold text-dark fs-7 d-block mb-2'>
												Category Visual Image
											</label>

											{/* Image Preview */}
											<div
												className='d-flex align-items-center gap-3 mb-3 p-3 rounded-3'
												style={{ backgroundColor: '#F8FAFD', border: '1px solid #E2E8F0' }}>
												<div
													className='rounded-3 overflow-hidden bg-dark d-flex align-items-center justify-content-center shadow-sm'
													style={{ width: '64px', height: '64px', minWidth: '64px' }}>
													<img
														src={imagePreview || getPreviewUrl(formData.image)}
														alt='Category Preview'
														className='w-100 h-100 object-fit-cover'
														onError={(e: any) => {
															e.currentTarget.onerror = null
															e.currentTarget.src = '/images/product-placeholder.webp'
														}}
													/>
												</div>
												<div>
													<span className='fw-bold text-dark fs-7 d-block'>Selected Graphic</span>
													<span className='text-muted fs-8 font-monospace d-block'>
														{formData.image || 'None selected'}
													</span>
												</div>
											</div>

											{/* Preset Selector */}
											<div className='mb-3'>
												<label className='form-label text-muted fs-8 fw-bold mb-1'>
													Choose from Existing Category Presets:
												</label>
												<div className='d-flex flex-wrap gap-2'>
													{PRESET_IMAGES.map((preset) => (
														<button
															type='button'
															key={preset.url}
															className='btn btn-sm py-1 px-3 fw-bold rounded-pill'
															style={{
																backgroundColor: formData.image === preset.url ? '#172B4D' : '#F1F5F9',
																color: formData.image === preset.url ? '#FFFFFF' : '#334155',
																border: formData.image === preset.url ? '1px solid #172B4D' : '1px solid #E2E8F0',
																fontSize: '11px',
															}}
															onClick={() => handlePresetSelect(preset.url)}>
															{preset.label}
														</button>
													))}
												</div>
											</div>

											{/* Upload New File */}
											<div>
												<label className='form-label text-muted fs-8 fw-bold mb-1'>
													Or Upload High-Resolution Graphic:
												</label>
												<input
													type='file'
													accept='image/webp,image/png,image/jpeg,image/jpg'
													className='form-control'
													style={{ borderRadius: '10px', height: '44px' }}
													onChange={handleImageFileSelect}
												/>
											</div>
										</div>

										{/* Accent Color */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold text-dark fs-7'>
												Accent Theme Color
											</label>
											<div className='d-flex align-items-center gap-2'>
												<input
													type='color'
													className='form-control form-control-color p-1'
													style={{ width: '44px', height: '44px', borderRadius: '10px' }}
													value={formData.accent || '#ff8914'}
													onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
												/>
												<input
													type='text'
													className='form-control'
													style={{ borderRadius: '10px', height: '44px' }}
													value={formData.accent || '#ff8914'}
													onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
												/>
											</div>
										</div>

										{/* Status Checkbox */}
										<div className='col-12 col-md-6 d-flex align-items-center mt-auto'>
											<div
												className='p-3 rounded-3 d-flex align-items-center justify-content-between w-100'
												style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
												<div>
													<span className='fw-bold text-dark fs-7 d-block'>Active on Website</span>
													<span className='text-muted fs-8'>Display in store navigation</span>
												</div>
												<div className='form-check form-switch form-check-custom form-check-solid m-0'>
													<input
														className='form-check-input'
														type='checkbox'
														id='categoryStatusSwitch'
														style={{ width: '44px', height: '22px', cursor: 'pointer' }}
														checked={formData.status !== false}
														onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div
									className='p-5 border-top d-flex align-items-center justify-content-end gap-3'
									style={{ backgroundColor: '#F8FAFD' }}>
									<button
										type='button'
										className='gz-mgmt-btn-secondary'
										onClick={() => setShowModal(false)}
										disabled={saving}>
										Cancel
									</button>
									<button
										type='submit'
										className='gz-mgmt-btn-primary'
										disabled={saving}>
										{saving ? (
											<>
												<span className='spinner-border spinner-border-sm me-2' />
												Saving Category...
											</>
										) : modalMode === 'create' ? (
											'Create Category'
										) : (
											'Update Category'
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
