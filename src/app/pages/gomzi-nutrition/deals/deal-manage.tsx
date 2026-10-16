import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	DealItem,
	GetDealsAdmin,
	CreateDealAdmin,
	UpdateDealAdmin,
	DeleteDealAdmin,
	ReorderDealsAdmin,
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
	faUpload,
	faRotateLeft,
	faLink,
	faPercent,
	faFire,
	faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'

const PRESET_PRODUCTS = [
	{
		label: 'Whey Protein Isolate',
		image: '/images/product-category/whey-protein.webp',
		url: '/gomzi-supplement/whey-protein',
		gradient: 'linear-gradient(180deg, #ffb877 0%, #ffd4a3 40%, #ffa556 100%)',
	},
	{
		label: 'Pure Creatine',
		image: '/images/product-category/creatine.webp',
		url: '/gomzi-supplement/creatine',
		gradient: 'linear-gradient(180deg, #f6ede3 0%, #faf4ed 45%, #e8ded3 100%)',
	},
	{
		label: 'Pre-Workout',
		image: '/images/product-category/pre-workout.webp',
		url: '/gomzi-supplement/pre-workout',
		gradient: 'linear-gradient(180deg, #fae4b2 0%, #fbedcb 45%, #efce86 100%)',
	},
	{
		label: 'BCAA Orange',
		image: '/images/product-category/Bcaa-tangy-orange.webp',
		url: '/gomzi-supplement/bcaa',
		gradient: 'linear-gradient(180deg, #fae799 0%, #fcedb6 45%, #f4d36e 100%)',
	},
	{
		label: 'Mass Gainer',
		image: '/images/product-category/mass-gainer.webp',
		url: '/gomzi-supplement/mass-gainer',
		gradient: 'linear-gradient(180deg, #ffd3b6 0%, #ffdfba 45%, #ffb380 100%)',
	},
	{
		label: 'Plant Protein',
		image: '/images/product-category/plant-protein.webp',
		url: '/gomzi-supplement/plant-protein',
		gradient: 'linear-gradient(180deg, #d4edda 0%, #e2f0d9 45%, #c3e6cb 100%)',
	},
]

const GRADIENT_PRESETS = [
	{ label: 'Orange Peach', value: 'linear-gradient(180deg, #ffb877 0%, #ffd4a3 40%, #ffa556 100%)' },
	{ label: 'Warm Almond', value: 'linear-gradient(180deg, #f6ede3 0%, #faf4ed 45%, #e8ded3 100%)' },
	{ label: 'Golden Sun', value: 'linear-gradient(180deg, #fae4b2 0%, #fbedcb 45%, #efce86 100%)' },
	{ label: 'Canary Gold', value: 'linear-gradient(180deg, #fae799 0%, #fcedb6 45%, #f4d36e 100%)' },
	{ label: 'Electric Mint', value: 'linear-gradient(180deg, #d2f4ea 0%, #e8fbf6 45%, #a6e9d5 100%)' },
	{ label: 'Rose Crimson', value: 'linear-gradient(180deg, #f8d7da 0%, #fce8e6 45%, #f5c6cb 100%)' },
]

const CATALOG_IMAGES = [
	{ label: 'Whey Protein Isolate', path: '/images/product-category/whey-protein.webp' },
	{ label: 'Pure Creatine', path: '/images/product-category/creatine.webp' },
	{ label: 'Pre-Workout Matrix', path: '/images/product-category/pre-workout.webp' },
	{ label: 'BCAA Tangy Orange', path: '/images/product-category/Bcaa-tangy-orange.webp' },
	{ label: 'Mass Gainer Extreme', path: '/images/product-category/mass-gainer.webp' },
	{ label: 'Organic Plant Protein', path: '/images/product-category/plant-protein.webp' },
	{ label: 'Daily Multivitamins', path: '/images/product-category/Multivitamins.webp' },
	{ label: 'High Protein Peanut Butter', path: '/images/product-category/peanut-butter.webp' },
]

const getPreviewUrl = (url?: string) => {
	if (!url) return '/images/product-placeholder.webp'
	if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
	if (url.startsWith('/images/') || url.startsWith('/')) return url
	return `${FG_GROUP_FILE_BASE_URL}/${url.replace(/^\/+/, '')}`
}

export default function DealManage() {
	const [deals, setDeals] = useState<DealItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [uploadingImage, setUploadingImage] = useState<boolean>(false)
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [editingDeal, setEditingDeal] = useState<DealItem | null>(null)

	const [formData, setFormData] = useState<{
		title: string
		subtitle: string
		tag: string
		originalPrice: number | string
		dealPrice: number | string
		code: string
		image: string
		bgGradient: string
		url: string
		status: boolean
	}>({
		title: '',
		subtitle: '',
		tag: 'PRICE DROPPED BY ₹450',
		originalPrice: 3270,
		dealPrice: 2820,
		code: 'WHEY450',
		image: '/images/product-category/whey-protein.webp',
		bgGradient: 'linear-gradient(180deg, #ffb877 0%, #ffd4a3 40%, #ffa556 100%)',
		url: '/gomzi-supplement/whey-protein',
		status: true,
	})

	const fetchDeals = async () => {
		try {
			setLoading(true)
			const res = await GetDealsAdmin()
			if (res?.data?.deals) {
				setDeals(res.data.deals)
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to load deals')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchDeals()
	}, [])

	const handleOpenModal = (deal?: DealItem) => {
		if (deal) {
			setEditingDeal(deal)
			setFormData({
				title: deal.title || '',
				subtitle: deal.subtitle || '',
				tag: deal.tag || 'LIMITED TIME DEAL',
				originalPrice: deal.originalPrice || 0,
				dealPrice: deal.dealPrice || 0,
				code: deal.code || '',
				image: deal.image || '/images/product-category/whey-protein.webp',
				bgGradient: deal.bgGradient || 'linear-gradient(180deg, #ffb877 0%, #ffd4a3 40%, #ffa556 100%)',
				url: deal.url || '/gomzi-supplement',
				status: deal.status !== undefined ? deal.status : true,
			})
		} else {
			setEditingDeal(null)
			setFormData({
				title: '',
				subtitle: '',
				tag: 'PRICE DROPPED BY ₹300',
				originalPrice: 2499,
				dealPrice: 1999,
				code: 'DEAL300',
				image: '/images/product-category/whey-protein.webp',
				bgGradient: 'linear-gradient(180deg, #ffb877 0%, #ffd4a3 40%, #ffa556 100%)',
				url: '/gomzi-supplement',
				status: true,
			})
		}
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setEditingDeal(null)
	}

	const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Immediate local blob preview for instant visual feedback in live card
		const localBlobUrl = URL.createObjectURL(file)
		setFormData((prev) => ({ ...prev, image: localBlobUrl }))

		try {
			setUploadingImage(true)
			const res: any = await FileUploadToFGGroup([file], { directory: 'products' })
			const uploadedUrl =
				res?.data?.fileURLs?.[0] ||
				res?.data?.file ||
				res?.data?.url ||
				res?.fileURLs?.[0] ||
				res?.data?.[0]

			if (uploadedUrl) {
				setFormData((prev) => ({ ...prev, image: uploadedUrl }))
				toast.success('Product image uploaded successfully')
			} else {
				toast.success('Image selected')
			}
		} catch (err: any) {
			console.error('Deal image upload error:', err)
			toast.error(err.message || 'Image upload to storage failed, using local preview')
		} finally {
			setUploadingImage(false)
			e.target.value = ''
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title.trim()) {
			toast.error('Please enter deal title')
			return
		}
		if (!formData.dealPrice || Number(formData.dealPrice) <= 0) {
			toast.error('Please enter valid deal price')
			return
		}

		try {
			setSaving(true)
			const payload = {
				...formData,
				originalPrice: Number(formData.originalPrice) || 0,
				dealPrice: Number(formData.dealPrice),
			}

			if (editingDeal) {
				await UpdateDealAdmin({ ...payload, id: editingDeal._id || editingDeal.id || '' })
				toast.success('Deal updated successfully')
			} else {
				await CreateDealAdmin(payload)
				toast.success('Deal created successfully')
			}

			handleCloseModal()
			fetchDeals()
		} catch (err: any) {
			toast.error(err.message || 'Failed to save deal')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string, title: string) => {
		if (!window.confirm(`Are you sure you want to delete deal "${title}"?`)) return

		try {
			await DeleteDealAdmin(id)
			toast.success('Deal deleted successfully')
			fetchDeals()
		} catch (err: any) {
			toast.error(err.message || 'Failed to delete deal')
		}
	}

	const handleToggleStatus = async (deal: DealItem) => {
		try {
			const id = deal._id || deal.id || ''
			await UpdateDealAdmin({ id, status: !deal.status })
			toast.success(`Deal ${!deal.status ? 'activated' : 'deactivated'}`)
			fetchDeals()
		} catch (err: any) {
			toast.error(err.message || 'Failed to toggle status')
		}
	}

	const handleMove = async (index: number, direction: 'up' | 'down') => {
		const targetIndex = direction === 'up' ? index - 1 : index + 1
		if (targetIndex < 0 || targetIndex >= deals.length) return

		const updated = [...deals]
		const temp = updated[index]
		updated[index] = updated[targetIndex]
		updated[targetIndex] = temp

		setDeals(updated)

		try {
			await ReorderDealsAdmin(updated)
			toast.success('Deals order updated')
		} catch (err: any) {
			toast.error(err.message || 'Failed to reorder')
			fetchDeals()
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Promotional Trending Deals</PageTitle>

			<div className='card'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<h3 className='fw-bolder m-0 text-gray-800'>
								<FontAwesomeIcon icon={faFire} className='text-warning me-2' />
								Landing Page Trending Promotional Cards ({deals.length})
							</h3>
						</div>
					</div>
					<div className='card-toolbar'>
						<button
							type='button'
							className='btn btn-primary btn-sm'
							onClick={() => handleOpenModal()}>
							<FontAwesomeIcon icon={faPlus} className='me-2' />
							Add New Deal
						</button>
					</div>
				</div>

				<div className='card-body py-4'>
					{loading ? (
						<div className='text-center py-10'>
							<div className='spinner-border text-primary' role='status' />
							<div className='text-gray-500 mt-2'>Loading promotional deals...</div>
						</div>
					) : deals.length === 0 ? (
						<div className='text-center py-10'>
							<p className='text-gray-500 fs-5'>No deals found. Click "Add New Deal" to create one.</p>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed fs-6 gy-5'>
								<thead>
									<tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
										<th style={{ width: '60px' }}>Order</th>
										<th style={{ width: '140px' }}>Card Preview</th>
										<th>Deal Title & Subtitle</th>
										<th>Badge / Tag</th>
										<th>Pricing</th>
										<th>Coupon</th>
										<th>Status</th>
										<th className='text-end'>Actions</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{deals.map((deal, idx) => {
										const dealId = deal._id || deal.id || ''
										return (
											<tr key={dealId || idx}>
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
															disabled={idx === deals.length - 1}
															onClick={() => handleMove(idx, 'down')}
															title='Move Down'>
															<FontAwesomeIcon icon={faArrowDown} />
														</button>
													</div>
												</td>
												<td>
													<div
														style={{
															width: '100px',
															height: '120px',
															borderRadius: '16px',
															background: deal.bgGradient || '#ffb877',
															display: 'flex',
															flexDirection: 'column',
															alignItems: 'center',
															justifyContent: 'flex-end',
															padding: '8px',
															boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
														}}>
														<img
															src={getPreviewUrl(deal.image)}
															alt={deal.title}
															style={{
																maxWidth: '70px',
																maxHeight: '85px',
																objectFit: 'contain',
																filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.25))',
															}}
															onError={(e: any) => {
																e.target.src = '/images/product-placeholder.webp'
															}}
														/>
													</div>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-800 fw-bolder fs-6'>{deal.title}</span>
														{deal.subtitle && (
															<span className='text-muted fs-7'>{deal.subtitle}</span>
														)}
														{deal.url && (
															<a
																href={deal.url}
																target='_blank'
																rel='noreferrer'
																className='text-primary fs-8 mt-1 text-truncate'
																style={{ maxWidth: '240px' }}>
																<FontAwesomeIcon icon={faLink} className='me-1' />
																{deal.url}
															</a>
														)}
													</div>
												</td>
												<td>
													<span className='badge badge-light-danger fw-bolder'>
														{deal.tag || 'SPECIAL DEAL'}
													</span>
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bolder fs-6'>
															₹{deal.dealPrice?.toLocaleString('en-IN')}
														</span>
														{deal.originalPrice ? (
															<span className='text-decoration-line-through text-muted fs-7'>
																MRP: ₹{deal.originalPrice?.toLocaleString('en-IN')}
															</span>
														) : null}
													</div>
												</td>
												<td>
													{deal.code ? (
														<span
															className='badge badge-light-warning fw-bolder text-dark px-3 py-2'
															style={{ border: '1.5px dashed #f59e0b', letterSpacing: '1px' }}>
															{deal.code}
														</span>
													) : (
														<span className='text-muted fs-7'>None</span>
													)}
												</td>
												<td>
													<button
														type='button'
														className={`btn btn-sm btn-icon ${
															deal.status ? 'btn-light-success' : 'btn-light-danger'
														}`}
														onClick={() => handleToggleStatus(deal)}
														title={deal.status ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}>
														<FontAwesomeIcon icon={deal.status ? faCheck : faTimes} />
													</button>
												</td>
												<td className='text-end'>
													<button
														type='button'
														className='btn btn-icon btn-light-warning btn-sm me-2'
														onClick={() => handleOpenModal(deal)}
														title='Edit Deal'>
														<FontAwesomeIcon icon={faEdit} />
													</button>
													<button
														type='button'
														className='btn btn-icon btn-light-danger btn-sm'
														onClick={() => handleDelete(dealId, deal.title)}
														title='Delete Deal'>
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

			{/* Modal for Add / Edit Deal */}
			{isModalOpen && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>
									{editingDeal ? 'Edit Promotional Deal' : 'Add New Promotional Deal'}
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
										<div className='col-md-8'>
											<div className='mb-3'>
												<label className='form-label required'>Deal Title</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. 100% Whey Protein Isolate'
													value={formData.title}
													onChange={(e) => setFormData({ ...formData, title: e.target.value })}
													required
												/>
											</div>

											<div className='mb-3'>
												<label className='form-label'>Subtitle / Weight / Spec</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. 1kg • 27g Protein / Scoop'
													value={formData.subtitle}
													onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
												/>
											</div>

											<div className='row'>
												<div className='col-md-6 mb-3'>
													<label className='form-label required'>Deal Price (₹)</label>
													<input
														type='number'
														className='form-control'
														placeholder='2820'
														value={formData.dealPrice}
														onChange={(e) => setFormData({ ...formData, dealPrice: e.target.value })}
														required
													/>
												</div>
												<div className='col-md-6 mb-3'>
													<label className='form-label'>Original MRP (₹)</label>
													<input
														type='number'
														className='form-control'
														placeholder='3270'
														value={formData.originalPrice}
														onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
													/>
												</div>
											</div>

											<div className='row'>
												<div className='col-md-6 mb-3'>
													<label className='form-label'>Promo Tag / Drop Text</label>
													<input
														type='text'
														className='form-control'
														placeholder='PRICE DROPPED BY ₹450'
														value={formData.tag}
														onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
													/>
												</div>
												<div className='col-md-6 mb-3'>
													<label className='form-label'>Coupon Code</label>
													<input
														type='text'
														className='form-control'
														placeholder='WHEY450'
														value={formData.code}
														onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
													/>
												</div>
											</div>

											<div className='mb-3'>
												<label className='form-label'>Target URL / Product Route</label>
												<input
													type='text'
													className='form-control'
													placeholder='/gomzi-supplement/whey-protein'
													value={formData.url}
													onChange={(e) => setFormData({ ...formData, url: e.target.value })}
												/>
											</div>
										</div>

										{/* Preview column */}
										<div className='col-md-4'>
											<label className='form-label'>Live Card Preview</label>
											<div
												style={{
													borderRadius: '24px',
													background: formData.bgGradient,
													padding: '20px 16px',
													minHeight: '260px',
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													justifyContent: 'space-between',
													textAlign: 'center',
													boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
												}}>
												<div>
													<h5 className='fw-bold mb-1 text-dark' style={{ fontSize: '14px' }}>
														{formData.title || 'Product Title'}
													</h5>
													<div className='badge badge-white text-dark mb-2' style={{ fontSize: '11px' }}>
														{formData.subtitle || 'Weight / Flavor'}
													</div>
													<div className='text-danger fw-bolder' style={{ fontSize: '10px' }}>
														{formData.tag}
													</div>
													<div
														style={{
															border: '1.5px dashed #e11d48',
															borderRadius: '10px',
															padding: '4px 10px',
															background: 'rgba(255,255,255,0.85)',
															marginTop: '4px',
														}}>
														<div className='text-muted text-decoration-line-through' style={{ fontSize: '10px' }}>
															₹{formData.originalPrice}
														</div>
														<div className='text-dark fw-bold' style={{ fontSize: '12px' }}>
															Grab @ ₹{formData.dealPrice}
														</div>
														{formData.code && (
															<div className='text-warning fw-bolder' style={{ fontSize: '10px' }}>
																CODE: {formData.code}
															</div>
														)}
													</div>
												</div>
												<img
													src={getPreviewUrl(formData.image)}
													alt='Preview'
													style={{
														maxHeight: '100px',
														maxWidth: '100px',
														objectFit: 'contain',
														marginTop: '10px',
														filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
													}}
													onError={(e: any) => {
														e.target.src = '/images/product-placeholder.webp'
													}}
												/>
											</div>
										</div>
									</div>

									{/* Product Presets */}
									<div className='mt-3'>
										<label className='form-label fs-7 text-muted'>Quick Preset Products</label>
										<div className='d-flex flex-wrap gap-2'>
											{PRESET_PRODUCTS.map((p, idx) => (
												<button
													key={idx}
													type='button'
													className='btn btn-xs btn-outline btn-outline-dashed btn-outline-secondary'
													onClick={() => {
														setFormData((prev) => ({
															...prev,
															title: prev.title || p.label,
															image: p.image,
															url: p.url,
															bgGradient: p.gradient,
														}))
													}}>
													{p.label}
												</button>
											))}
										</div>
									</div>

									{/* Gradient Presets */}
									<div className='mt-3'>
										<label className='form-label fs-7 text-muted'>Background Gradient</label>
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
											placeholder='linear-gradient(180deg, #ffb877 0%, ...)'
											value={formData.bgGradient}
											onChange={(e) => setFormData({ ...formData, bgGradient: e.target.value })}
										/>
									</div>

									{/* Image Upload or URL */}
									<div className='mt-3'>
										<label className='form-label d-flex justify-content-between align-items-center'>
											<span>Product Image</span>
											<span className='fs-8 text-muted'>PNG, WebP, JPG up to 10MB</span>
										</label>
										<div className='input-group mb-2'>
											<input
												type='text'
												className='form-control'
												placeholder='/images/product-category/whey-protein.webp'
												value={formData.image}
												onChange={(e) => setFormData({ ...formData, image: e.target.value })}
											/>
											<label
												className={`btn ${
													uploadingImage ? 'btn-secondary' : 'btn-primary'
												} mb-0 d-flex align-items-center cursor-pointer`}
												style={{ minWidth: '110px', justifyContent: 'center' }}>
												<FontAwesomeIcon
													icon={uploadingImage ? faRotateLeft : faUpload}
													className={`me-2 ${uploadingImage ? 'fa-spin' : ''}`}
												/>
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

										{/* Quick Pick from Official Catalog */}
										<div className='d-flex align-items-center gap-2 mt-2'>
											<span className='fs-8 text-muted text-nowrap'>Catalog Images:</span>
											<select
												className='form-select form-select-sm'
												value={CATALOG_IMAGES.some((c) => c.path === formData.image) ? formData.image : ''}
												onChange={(e) => {
													if (e.target.value) {
														setFormData({ ...formData, image: e.target.value })
													}
												}}>
												<option value=''>-- Quick Select Catalog Image --</option>
												{CATALOG_IMAGES.map((item, idx) => (
													<option key={idx} value={item.path}>
														{item.label} ({item.path.split('/').pop()})
													</option>
												))}
											</select>
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
										{saving ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
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
