import React, { useEffect, useState } from 'react'
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
		<div className='d-flex flex-column gap-6 p-4 p-md-8'>
			<PageTitle
				breadcrumbs={[
					{
						title: 'Gomzi Nutrition',
						path: '/rag/dashboard',
						isSeparator: false,
						isActive: false,
					},
				]}
			>
				Product Categories ({categories.length})
			</PageTitle>

			{/* Top Overview Metric Cards */}
			<div className='row g-4'>
				<div className='col-12 col-sm-6 col-xl-4'>
					<div className='card bg-light-primary border border-primary border-opacity-25 rounded-4 shadow-sm p-5 h-100'>
						<div className='d-flex align-items-center justify-content-between'>
							<div>
								<span className='text-muted fw-semibold fs-7 text-uppercase'>Total Categories</span>
								<h2 className='fw-bolder fs-2tx text-primary mb-0 mt-1'>{categories.length}</h2>
							</div>
							<div className='w-50px h-50px rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fs-3'>
								<FontAwesomeIcon icon={faBoxesStacked} />
							</div>
						</div>
						<div className='text-muted fs-8 mt-2'>
							Live on <a href='http://localhost:5173/category' target='_blank' rel='noreferrer' className='fw-bold text-primary'>http://localhost:5173/category</a>
						</div>
					</div>
				</div>

				<div className='col-12 col-sm-6 col-xl-4'>
					<div className='card bg-light-success border border-success border-opacity-25 rounded-4 shadow-sm p-5 h-100'>
						<div className='d-flex align-items-center justify-content-between'>
							<div>
								<span className='text-muted fw-semibold fs-7 text-uppercase'>Active Categories</span>
								<h2 className='fw-bolder fs-2tx text-success mb-0 mt-1'>{activeCount}</h2>
							</div>
							<div className='w-50px h-50px rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success fs-3'>
								<FontAwesomeIcon icon={faCheck} />
							</div>
						</div>
						<div className='text-muted fs-8 mt-2'>
							Displayed in navigation filters &amp; product catalog
						</div>
					</div>
				</div>

				<div className='col-12 col-sm-6 col-xl-4'>
					<div className='card bg-light-warning border border-warning border-opacity-25 rounded-4 shadow-sm p-5 h-100'>
						<div className='d-flex align-items-center justify-content-between'>
							<div>
								<span className='text-muted fw-semibold fs-7 text-uppercase'>Live Products Count</span>
								<h2 className='fw-bolder fs-2tx text-warning mb-0 mt-1'>{totalProducts || 153}+</h2>
							</div>
							<div className='w-50px h-50px rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center text-warning fs-3'>
								<FontAwesomeIcon icon={faTag} />
							</div>
						</div>
						<div className='text-muted fs-8 mt-2'>
							Distributed across active category tags
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Card */}
			<div className='card rounded-4 border-0 shadow-sm'>
				<div className='card-header border-0 pt-6 d-flex flex-wrap align-items-center justify-content-between gap-4'>
					<div>
						<h3 className='card-title align-items-start flex-column mb-0'>
							<span className='card-label fw-bolder fs-3 text-dark'>Product Categories List</span>
							<span className='text-muted mt-1 fw-bold fs-7'>
								Manage product category cards, tags, formulas, high-res images and display order
							</span>
						</h3>
					</div>

					<div className='d-flex align-items-center gap-3'>
						<button
							type='button'
							className='btn btn-sm btn-light-primary fw-bold'
							onClick={loadCategories}
							disabled={loading}
						>
							<FontAwesomeIcon icon={faRotateLeft} className='me-2' />
							Refresh
						</button>
						<button
							type='button'
							className='btn btn-sm btn-primary fw-bold shadow-sm'
							onClick={openCreateModal}
						>
							<FontAwesomeIcon icon={faPlus} className='me-2' />
							Add New Category
						</button>
					</div>
				</div>

				<div className='card-body pt-4'>
					{loading ? (
						<div className='text-center py-12'>
							<div className='spinner-border text-primary' role='status' />
							<p className='text-muted mt-3 fs-7'>Loading Product Categories...</p>
						</div>
					) : categories.length === 0 ? (
						<div className='text-center py-12 border border-dashed rounded-4 p-8'>
							<FontAwesomeIcon icon={faBoxesStacked} className='fs-1 text-muted mb-3' />
							<h4 className='fw-bold text-gray-800'>No Categories Found</h4>
							<p className='text-muted fs-7'>Click &quot;Add New Category&quot; to create your first category card.</p>
							<button className='btn btn-primary btn-sm mt-2' onClick={openCreateModal}>
								<FontAwesomeIcon icon={faPlus} className='me-1' /> Create Category
							</button>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table table-row-bordered table-row-gray-200 align-middle gs-0 gy-4'>
								<thead>
									<tr className='fw-bolder text-muted bg-light fs-7 text-uppercase gs-0'>
										<th className='ps-4 w-70px'>Order</th>
										<th className='min-w-220px'>Category Details</th>
										<th className='min-w-160px'>Tag &amp; Specification</th>
										<th className='min-w-140px'>Visual Image</th>
										<th className='min-w-90px text-center'>Status</th>
										<th className='pe-4 min-w-140px text-end'>Actions</th>
									</tr>
								</thead>
								<tbody>
									{categories.map((cat, idx) => {
										const catId = cat._id || cat.id || `cat-${idx}`
										const isFirst = idx === 0
										const isLast = idx === categories.length - 1
										const previewSrc = getPreviewUrl(cat.image)

										return (
											<tr key={catId} className='hover-elevate-up'>
												{/* Order & Reorder Controls */}
												<td className='ps-4'>
													<div className='d-flex align-items-center gap-1'>
														<span className='badge badge-light-dark fw-bolder fs-7 px-2.5 py-1.5'>
															#{idx + 1}
														</span>
														<div className='d-flex flex-column ms-1'>
															<button
																type='button'
																className='btn btn-icon btn-sm btn-light h-20px w-20px p-0'
																disabled={isFirst}
																onClick={() => handleMove(idx, 'up')}
																title='Move Up'
															>
																<FontAwesomeIcon icon={faArrowUp} className='fs-9' />
															</button>
															<button
																type='button'
																className='btn btn-icon btn-sm btn-light h-20px w-20px p-0 mt-0.5'
																disabled={isLast}
																onClick={() => handleMove(idx, 'down')}
																title='Move Down'
															>
																<FontAwesomeIcon icon={faArrowDown} className='fs-9' />
															</button>
														</div>
													</div>
												</td>

												{/* Category Details */}
												<td>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bolder fs-6 hover-primary cursor-pointer' onClick={() => openEditModal(cat)}>
															{cat.title}
														</span>
														<span className='text-muted fs-8 font-monospace'>/{cat.slug}</span>
														{cat.subtitle && (
															<span className='text-gray-600 fs-8 line-clamp-1 mt-0.5' style={{ maxWidth: 320 }}>
																{cat.subtitle}
															</span>
														)}
													</div>
												</td>

												{/* Tag & Specification */}
												<td>
													<div className='d-flex flex-column gap-1'>
														{cat.tag && (
															<span
																className='badge px-2.5 py-1 rounded-pill fs-8 fw-bold text-uppercase w-fit'
																style={{
																	backgroundColor: `${cat.accent || '#ff8914'}22`,
																	color: cat.accent || '#ff8914',
																	border: `1px solid ${cat.accent || '#ff8914'}55`,
																}}
															>
																{cat.tag}
															</span>
														)}
														{cat.spec && (
															<span className='badge badge-light-secondary text-gray-700 fs-9 w-fit'>
																{cat.spec}
															</span>
														)}
													</div>
												</td>

												{/* Image Thumbnail */}
												<td>
													<div className='d-flex align-items-center gap-2'>
														<div
															className='w-50px h-50px rounded-3 overflow-hidden border shadow-sm bg-dark d-flex align-items-center justify-content-center'
															style={{ minWidth: 50 }}
														>
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
														<span className='text-muted fs-9 text-truncate' style={{ maxWidth: 100 }}>
															{cat.image.split('/').pop()}
														</span>
													</div>
												</td>

												{/* Status Toggle */}
												<td className='text-center'>
													<button
														type='button'
														className={`btn btn-sm btn-icon rounded-pill ${
															cat.status !== false ? 'btn-light-success' : 'btn-light-danger'
														}`}
														onClick={() => handleToggleStatus(cat)}
														title={cat.status !== false ? 'Active (Click to disable)' : 'Inactive (Click to activate)'}
													>
														<FontAwesomeIcon icon={cat.status !== false ? faCheck : faTimes} />
													</button>
												</td>

												{/* Actions */}
												<td className='pe-4 text-end'>
													<div className='d-inline-flex gap-2'>
														<button
															type='button'
															className='btn btn-icon btn-sm btn-light-primary rounded-3'
															onClick={() => openEditModal(cat)}
															title='Edit Category'
														>
															<FontAwesomeIcon icon={faEdit} />
														</button>
														<button
															type='button'
															className='btn btn-icon btn-sm btn-light-danger rounded-3'
															onClick={() => handleDelete(cat)}
															title='Delete Category'
														>
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
					style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
					tabIndex={-1}
				>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content rounded-4 border-0 shadow-lg'>
							<form onSubmit={handleSave}>
								<div className='modal-header border-0 pb-0'>
									<h4 className='modal-title fw-bolder text-dark'>
										{modalMode === 'create' ? 'Create New Category' : `Edit Category: ${formData.title}`}
									</h4>
									<button
										type='button'
										className='btn btn-icon btn-sm btn-light rounded-circle'
										onClick={() => setShowModal(false)}
									>
										<FontAwesomeIcon icon={faTimes} />
									</button>
								</div>

								<div className='modal-body py-4'>
									<div className='row g-4'>
										{/* Title */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold required fs-7'>Category Title</label>
											<input
												type='text'
												className='form-control form-control-solid rounded-3'
												placeholder='e.g. Whey Protein, Creatine'
												value={formData.title || ''}
												onChange={(e) => handleTitleChange(e.target.value)}
												required
											/>
										</div>

										{/* Slug */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold fs-7'>URL Slug</label>
											<input
												type='text'
												className='form-control form-control-solid rounded-3 font-monospace'
												placeholder='e.g. whey-protein'
												value={formData.slug || ''}
												onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
											/>
										</div>

										{/* Tag */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold fs-7'>Tag Badge (e.g. MOST POPULAR, 100% VEGAN)</label>
											<input
												type='text'
												className='form-control form-control-solid rounded-3'
												placeholder='e.g. MOST POPULAR'
												value={formData.tag || ''}
												onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
											/>
										</div>

										{/* Spec */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold fs-7'>Spec Pill (e.g. 24-27g Protein / Scoop)</label>
											<input
												type='text'
												className='form-control form-control-solid rounded-3'
												placeholder='e.g. 24-27g Protein / Scoop'
												value={formData.spec || ''}
												onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
											/>
										</div>

										{/* Subtitle */}
										<div className='col-12'>
											<label className='form-label fw-bold fs-7'>Subtitle / Formulation Description</label>
											<textarea
												rows={2}
												className='form-control form-control-solid rounded-3'
												placeholder='Brief description displayed on the category card...'
												value={formData.subtitle || ''}
												onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
											/>
										</div>

										{/* Image Preview & Selection */}
										<div className='col-12'>
											<label className='form-label fw-bold fs-7 d-block'>Category Image</label>

											{/* Image Preview */}
											<div className='d-flex align-items-center gap-4 mb-3 p-3 bg-light rounded-3 border'>
												<div
													className='w-80px h-80px rounded-3 overflow-hidden bg-dark d-flex align-items-center justify-content-center shadow-sm'
													style={{ minWidth: 80 }}
												>
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
													<span className='fw-bold text-dark fs-7 d-block'>Image Preview</span>
													<span className='text-muted fs-8 font-monospace d-block'>
														{formData.image || 'None selected'}
													</span>
												</div>
											</div>

											{/* Preset Selector */}
											<div className='mb-3'>
												<label className='form-label text-muted fs-8 fw-bold mb-1'>Choose from Existing Category Images:</label>
												<div className='d-flex flex-wrap gap-2'>
													{PRESET_IMAGES.map((preset) => (
														<button
															type='button'
															key={preset.url}
															className={`btn btn-xs rounded-pill ${
																formData.image === preset.url
																	? 'btn-primary'
																	: 'btn-light-secondary text-dark'
															}`}
															onClick={() => handlePresetSelect(preset.url)}
														>
															{preset.label}
														</button>
													))}
												</div>
											</div>

											{/* Upload New File */}
											<div>
												<label className='form-label text-muted fs-8 fw-bold mb-1'>Or Upload High-Resolution WebP/PNG:</label>
												<input
													type='file'
													accept='image/webp,image/png,image/jpeg,image/jpg'
													className='form-control form-control-solid rounded-3'
													onChange={handleImageFileSelect}
												/>
											</div>
										</div>

										{/* Accent Color & Target URL */}
										<div className='col-12 col-md-6'>
											<label className='form-label fw-bold fs-7'>Accent Theme Color</label>
											<div className='d-flex align-items-center gap-2'>
												<input
													type='color'
													className='form-control form-control-color rounded-3 w-50px p-1'
													value={formData.accent || '#ff8914'}
													onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
												/>
												<input
													type='text'
													className='form-control form-control-solid rounded-3'
													value={formData.accent || '#ff8914'}
													onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
												/>
											</div>
										</div>

										{/* Status Checkbox */}
										<div className='col-12 col-md-6 d-flex align-items-center mt-auto'>
											<div className='form-check form-switch form-check-custom form-check-solid'>
												<input
													className='form-check-input h-25px w-45px'
													type='checkbox'
													id='categoryStatusSwitch'
													checked={formData.status !== false}
													onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
												/>
												<label className='form-check-label fw-bold text-dark fs-7 ms-2' htmlFor='categoryStatusSwitch'>
													Active on Website
												</label>
											</div>
										</div>
									</div>
								</div>

								<div className='modal-footer border-0 pt-0'>
									<button
										type='button'
										className='btn btn-light fw-bold'
										onClick={() => setShowModal(false)}
										disabled={saving}
									>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-primary fw-bold shadow-sm'
										disabled={saving}
									>
										{saving ? (
											<>
												<span className='spinner-border spinner-border-sm me-2' />
												Saving...
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
