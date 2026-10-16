import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	PromoBannerItem,
	GetPromoBannersAdmin,
	CreatePromoBannerAdmin,
	UpdatePromoBannerAdmin,
	DeletePromoBannerAdmin,
	ReorderPromoBannersAdmin,
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
	faUpload,
	faLink,
	faSliders,
	faImages,
} from '@fortawesome/free-solid-svg-icons'

const GRADIENT_PRESETS = [
	{ label: 'Silver Platinum', value: 'linear-gradient(135deg, #e4e7ec 0%, #f4f5f8 50%, #e2e5ea 100%)' },
	{ label: 'Warm Almond', value: 'linear-gradient(135deg, #f5efe6 0%, #fbf8f3 50%, #eee5d8 100%)' },
	{ label: 'Golden Peach', value: 'linear-gradient(135deg, #fef5e7 0%, #fffbf2 50%, #faecd5 100%)' },
	{ label: 'Electric Mint', value: 'linear-gradient(135deg, #e6f9f0 0%, #f5fcf8 50%, #daf4e6 100%)' },
	{ label: 'Soft Lavender', value: 'linear-gradient(135deg, #efe9f7 0%, #f9f6fc 50%, #e4daf1 100%)' },
]

const getPreviewUrl = (url?: string) => {
	if (!url) return '/images/product-placeholder.webp'
	if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
	if (url.startsWith('/images/')) return `http://localhost:5173${url}`
	return `${FG_GROUP_FILE_BASE_URL}${url}`
}

export default function PromoBannerManage() {
	const [banners, setBanners] = useState<PromoBannerItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [uploadingImage, setUploadingImage] = useState<boolean>(false)
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [editingBanner, setEditingBanner] = useState<PromoBannerItem | null>(null)

	const [formData, setFormData] = useState<{
		brand: string
		title: string
		subtitle: string
		priceText: string
		priceValue: string
		image: string
		bgGradient: string
		url: string
		status: boolean
	}>({
		brand: 'GOMZI GEAR',
		title: '',
		subtitle: '',
		priceText: 'Starts @',
		priceValue: '₹299',
		image: '',
		bgGradient: 'linear-gradient(135deg, #e4e7ec 0%, #f4f5f8 50%, #e2e5ea 100%)',
		url: '/gomzi-supplement',
		status: true,
	})

	const fetchBanners = async () => {
		try {
			setLoading(true)
			const res = await GetPromoBannersAdmin()
			if (res?.data?.banners) {
				setBanners(res.data.banners)
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to load promo banners')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchBanners()
	}, [])

	const handleOpenModal = (banner?: PromoBannerItem) => {
		if (banner) {
			setEditingBanner(banner)
			setFormData({
				brand: banner.brand || 'GOMZI GEAR',
				title: banner.title || '',
				subtitle: banner.subtitle || '',
				priceText: banner.priceText || 'Starts @',
				priceValue: banner.priceValue || '₹299',
				image: banner.image || '',
				bgGradient: banner.bgGradient || 'linear-gradient(135deg, #e4e7ec 0%, #f4f5f8 50%, #e2e5ea 100%)',
				url: banner.url || '/gomzi-supplement',
				status: banner.status !== undefined ? banner.status : true,
			})
		} else {
			setEditingBanner(null)
			setFormData({
				brand: 'GOMZI GEAR',
				title: '',
				subtitle: '',
				priceText: 'Starts @',
				priceValue: '₹299',
				image: '',
				bgGradient: 'linear-gradient(135deg, #e4e7ec 0%, #f4f5f8 50%, #e2e5ea 100%)',
				url: '/gomzi-supplement',
				status: true,
			})
		}
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setEditingBanner(null)
	}

	const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		try {
			setUploadingImage(true)
			const res = await FileUploadToFGGroup(file)
			if (res?.data?.file) {
				setFormData((prev) => ({ ...prev, image: res.data.file }))
				toast.success('Banner product image uploaded')
			}
		} catch (err: any) {
			toast.error(err.message || 'Image upload failed')
		} finally {
			setUploadingImage(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title.trim()) {
			toast.error('Please enter banner title')
			return
		}

		try {
			setSaving(true)
			if (editingBanner) {
				await UpdatePromoBannerAdmin({ ...formData, id: editingBanner._id || editingBanner.id || '' })
				toast.success('Promo banner updated successfully')
			} else {
				await CreatePromoBannerAdmin(formData)
				toast.success('Promo banner created successfully')
			}

			handleCloseModal()
			fetchBanners()
		} catch (err: any) {
			toast.error(err.message || 'Failed to save promo banner')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string, title: string) => {
		if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return

		try {
			await DeletePromoBannerAdmin(id)
			toast.success('Promo banner deleted successfully')
			fetchBanners()
		} catch (err: any) {
			toast.error(err.message || 'Failed to delete promo banner')
		}
	}

	const handleToggleStatus = async (banner: PromoBannerItem) => {
		try {
			const id = banner._id || banner.id || ''
			await UpdatePromoBannerAdmin({ id, status: !banner.status })
			toast.success(`Banner ${!banner.status ? 'activated' : 'deactivated'}`)
			fetchBanners()
		} catch (err: any) {
			toast.error(err.message || 'Failed to toggle status')
		}
	}

	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const targetIndex = direction === 'up' ? index - 1 : index + 1
		if (targetIndex < 0 || targetIndex >= banners.length) return

		const updated = [...banners]
		const temp = updated[index]
		updated[index] = updated[targetIndex]
		updated[targetIndex] = temp

		setBanners(updated)

		try {
			await ReorderPromoBannersAdmin(updated)
			toast.success('Promo banner order updated')
		} catch (err: any) {
			toast.error(err.message || 'Failed to reorder')
			fetchBanners()
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Mid-Page Promotional Banners</PageTitle>

			<div className='card'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<h3 className='fw-bolder m-0 text-gray-800'>
								<FontAwesomeIcon icon={faImages} className='text-primary me-2' />
								Promotional Slider Strip Banners ({banners.length})
							</h3>
						</div>
					</div>
					<div className='card-toolbar'>
						<button
							type='button'
							className='btn btn-primary btn-sm'
							onClick={() => handleOpenModal()}>
							<FontAwesomeIcon icon={faPlus} className='me-2' />
							Add New Slide
						</button>
					</div>
				</div>

				<div className='card-body py-4'>
					{loading ? (
						<div className='text-center py-10'>
							<div className='spinner-border text-primary' role='status' />
							<div className='text-gray-500 mt-2'>Loading promo banners...</div>
						</div>
					) : banners.length === 0 ? (
						<div className='text-center py-10'>
							<p className='text-gray-500 fs-5'>No banners found. Click "Add New Slide" to create one.</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed fs-6 gy-5'>
								<thead>
									<tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
										<th style={{ width: '60px' }}>Order</th>
										<th style={{ width: '240px' }}>Banner Preview</th>
										<th>Brand & Title</th>
										<th>Subtitle</th>
										<th>Price Callout</th>
										<th>Status</th>
										<th className='text-end'>Actions</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{banners.map((b, idx) => {
										const bannerId = b._id || b.id || ''
										return (
											<tr key={bannerId || idx}>
												<td>
													<div className='d-flex flex-column align-items-center gap-1'>
														<button
															type='button'
															className='btn btn-icon btn-sm btn-light-primary'
															disabled={idx === 0}
															onClick={() => handleMove(idx, 'up')}
															title='Move Up'>
															<FontAwesomeIcon icon={faArrowUp} />
														</button>
														<span className='badge badge-light fw-bold'>{idx + 1}</span>
														<button
															type='button'
															className='btn btn-icon btn-sm btn-light-primary'
															disabled={idx === banners.length - 1}
															onClick={() => handleMove(idx, 'down')}
															title='Move Down'>
															<FontAwesomeIcon icon={faArrowDown} />
														</button>
													</div>
												</td>
												<td>
													<div
														style={{
															width: '220px',
															height: '80px',
															borderRadius: '12px',
															background: b.bgGradient || '#e4e7ec',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
															padding: '8px 12px',
															border: '1px solid rgba(0,0,0,0.1)',
														}}>
														<div style={{ maxWidth: '110px' }}>
															<span style={{ fontSize: '9px', fontWeight: 800, color: '#333' }}>{b.brand}</span>
															<h6 style={{ fontSize: '11px', fontWeight: 900, margin: 0, color: '#111' }}>{b.title}</h6>
														</div>
														<div
															style={{
																border: '1.5px dashed #b42318',
																borderRadius: '6px',
																background: '#fff',
																padding: '2px 6px',
																textAlign: 'center',
															}}>
															<div style={{ fontSize: '8px', color: '#b42318', fontWeight: 700 }}>{b.priceText}</div>
															<div style={{ fontSize: '11px', color: '#b42318', fontWeight: 900 }}>{b.priceValue}</div>
														</div>
													</div>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='badge badge-light-primary fw-bolder mb-1 align-self-start'>
															{b.brand}
														</span>
														<span className='text-gray-800 fw-bolder fs-6'>{b.title}</span>
														{b.url && (
															<a
																href={b.url}
																target='_blank'
																rel='noreferrer'
																className='text-primary fs-8 mt-1 text-truncate'
																style={{ maxWidth: '220px' }}>
																<FontAwesomeIcon icon={faLink} className='me-1' />
																{b.url}
															</a>
														)}
													</div>
												</td>
												<td>
													<span className='text-muted fs-7'>{b.subtitle || '--'}</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-muted fs-8'>{b.priceText}</span>
														<span className='text-danger fw-bolder fs-6'>{b.priceValue}</span>
													</div>
												</td>
												<td>
													<button
														type='button'
														className={`btn btn-sm btn-icon ${
															b.status ? 'btn-light-success' : 'btn-light-danger'
														}`}
														onClick={() => handleToggleStatus(b)}
														title={b.status ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}>
														<FontAwesomeIcon icon={b.status ? faCheck : faTimes} />
													</button>
												</td>
												<td className='text-end'>
													<button
														type='button'
														className='btn btn-icon btn-light-warning btn-sm me-2'
														onClick={() => handleOpenModal(b)}
														title='Edit Slide'>
														<FontAwesomeIcon icon={faEdit} />
													</button>
													<button
														type='button'
														className='btn btn-icon btn-light-danger btn-sm'
														onClick={() => handleDelete(bannerId, b.title)}
														title='Delete Slide'>
														<FontAwesomeIcon icon={faTrash} />
													</button>
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

			{/* Modal for Add / Edit Promo Slide */}
			{isModalOpen && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>
									{editingBanner ? 'Edit Promotional Slide' : 'Add New Promotional Slide'}
								</h5>
								<button
									type='button'
									className='btn-close'
									onClick={handleCloseModal}
								/>
							</div>

							<form onSubmit={handleSubmit}>
								<div className='modal-body'>
									<div className='row g-4'>
										<div className='col-md-6'>
											<div className='mb-3'>
												<label className='form-label required'>Brand Tag</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. WORKOUT PRO or GOMZI GEAR'
													value={formData.brand}
													onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
													required
												/>
											</div>

											<div className='mb-3'>
												<label className='form-label required'>Main Title</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. Lifting Gear & Straps'
													value={formData.title}
													onChange={(e) => setFormData({ ...formData, title: e.target.value })}
													required
												/>
											</div>

											<div className='mb-3'>
												<label className='form-label'>Subtitle / Feature List</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. Heavy-Duty Power Support • Max Grip'
													value={formData.subtitle}
													onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
												/>
											</div>

											<div className='row'>
												<div className='col-md-6 mb-3'>
													<label className='form-label'>Price Callout Label</label>
													<input
														type='text'
														className='form-control'
														placeholder='Starts @'
														value={formData.priceText}
														onChange={(e) => setFormData({ ...formData, priceText: e.target.value })}
													/>
												</div>
												<div className='col-md-6 mb-3'>
													<label className='form-label required'>Price Value</label>
													<input
														type='text'
														className='form-control'
														placeholder='₹299'
														value={formData.priceValue}
														onChange={(e) => setFormData({ ...formData, priceValue: e.target.value })}
														required
													/>
												</div>
											</div>
										</div>

										<div className='col-md-6'>
											<div className='mb-3'>
												<label className='form-label'>Target URL</label>
												<input
													type='text'
													className='form-control'
													placeholder='/gomzi-supplement'
													value={formData.url}
													onChange={(e) => setFormData({ ...formData, url: e.target.value })}
												/>
											</div>

											{/* Gradient Presets */}
											<div className='mb-3'>
												<label className='form-label'>Background Gradient</label>
												<div className='d-flex flex-wrap gap-2 mb-2'>
													{GRADIENT_PRESETS.map((g, idx) => (
														<button
															key={idx}
															type='button'
															className='btn btn-xs btn-light'
															style={{
																background: g.value,
																border: formData.bgGradient === g.value ? '2px solid #000' : '1px solid #ccc',
															}}
															onClick={() => setFormData((prev) => ({ ...prev, bgGradient: g.value }))}>
															{g.label}
														</button>
													))}
												</div>
												<input
													type='text'
													className='form-control form-control-sm'
													value={formData.bgGradient}
													onChange={(e) => setFormData({ ...formData, bgGradient: e.target.value })}
												/>
											</div>

											{/* Product Image (Optional) */}
											<div className='mb-3'>
												<label className='form-label'>Product Graphic Image (Optional)</label>
												<div className='input-group'>
													<input
														type='text'
														className='form-control'
														placeholder='/images/product-category/... (leave blank for default)'
														value={formData.image}
														onChange={(e) => setFormData({ ...formData, image: e.target.value })}
													/>
													<label className='btn btn-light-primary mb-0'>
														<FontAwesomeIcon icon={faUpload} className='me-1' />
														{uploadingImage ? 'Uploading...' : 'Upload'}
														<input
															type='file'
															className='d-none'
															accept='image/*'
															disabled={uploadingImage}
															onChange={handleImageFileUpload}
														/>
													</label>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className='modal-footer'>
									<button
										type='button'
										className='btn btn-light'
										onClick={handleCloseModal}>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-primary'
										disabled={saving || uploadingImage}>
										{saving ? 'Saving...' : editingBanner ? 'Update Slide' : 'Create Slide'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
