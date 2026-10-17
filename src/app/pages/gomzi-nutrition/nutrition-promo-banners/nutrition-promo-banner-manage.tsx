import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	NutritionPromoBannerItem,
	GetNutritionPromoBannersAdmin,
	CreateNutritionPromoBannerAdmin,
	UpdateNutritionPromoBannerAdmin,
	DeleteNutritionPromoBannerAdmin,
	ReorderNutritionPromoBannersAdmin,
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
	faImages,
	faImage,
	faRotateRight,
} from '@fortawesome/free-solid-svg-icons'

const getPreviewUrl = (url?: string) => {
	if (!url) return ''
	if (
		url.startsWith('http://') ||
		url.startsWith('https://') ||
		url.startsWith('blob:') ||
		url.startsWith('data:')
	) {
		return url
	}
	if (url.startsWith('/images/')) return `http://localhost:5173${url}`
	const cleanUrl = url.startsWith('/') ? url.slice(1) : url
	return `${FG_GROUP_FILE_BASE_URL}/${cleanUrl}`
}

export default function NutritionPromoBannerManage() {
	const [banners, setBanners] = useState<NutritionPromoBannerItem[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [uploadingImage, setUploadingImage] = useState<boolean>(false)
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
	const [editingBanner, setEditingBanner] = useState<NutritionPromoBannerItem | null>(null)
	const [localPreview, setLocalPreview] = useState<string>('')
	const [isDragging, setIsDragging] = useState<boolean>(false)

	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const [formData, setFormData] = useState<{
		title: string
		image: string
		url: string
		status: boolean
	}>({
		title: '',
		image: '',
		url: '/gomzi-supplement',
		status: true,
	})

	const fetchBanners = async () => {
		try {
			setLoading(true)
			const res = await GetNutritionPromoBannersAdmin()
			if (res?.data?.banners) {
				setBanners(res.data.banners)
			}
		} catch (err: any) {
			toast.error(err.message || 'Failed to load nutrition promo banners')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchBanners()
	}, [])

	const handleOpenModal = (banner?: NutritionPromoBannerItem) => {
		setLocalPreview('')
		if (banner) {
			setEditingBanner(banner)
			setFormData({
				title: banner.title || '',
				image: banner.image || '',
				url: banner.url || '/gomzi-supplement',
				status: banner.status !== undefined ? banner.status : true,
			})
		} else {
			setEditingBanner(null)
			setFormData({
				title: '',
				image: '',
				url: '/gomzi-supplement',
				status: true,
			})
		}
		setIsModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsModalOpen(false)
		setEditingBanner(null)
		setLocalPreview('')
		setUploadingImage(false)
	}

	const uploadFile = async (file: File) => {
		// 1. Show local preview immediately
		const localUrl = URL.createObjectURL(file)
		setLocalPreview(localUrl)

		try {
			setUploadingImage(true)
			toast.loading('Uploading offer banner image...', { id: 'upload-toast' })

			// Call file upload API
			const res: any = await FileUploadToFGGroup([file], {
				directory: 'nutrition-promo-banners',
			})

			// Robust extraction of uploaded file path
			const fileKey =
				res?.data?.fileURLs?.[0] ||
				res?.fileURLs?.[0] ||
				res?.data?.fileURL ||
				res?.fileURL ||
				res?.data?.file ||
				res?.file ||
				res?.data?.files?.[0] ||
				res?.files?.[0] ||
				res?.data?.url ||
				res?.url

			if (fileKey) {
				setFormData((prev) => ({ ...prev, image: fileKey }))
				toast.success('Offer banner image uploaded successfully!', { id: 'upload-toast' })
			} else {
				console.error('Unexpected upload response:', res)
				toast.error(res?.message || 'Server did not return uploaded file path', { id: 'upload-toast' })
			}
		} catch (err: any) {
			console.error('Upload error:', err)
			toast.error(err?.response?.data?.message || err?.message || 'Image upload failed', {
				id: 'upload-toast',
			})
		} finally {
			setUploadingImage(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			uploadFile(file)
		}
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)

		const file = e.dataTransfer.files?.[0]
		if (file) {
			if (!file.type.startsWith('image/')) {
				toast.error('Please upload an image file (PNG, JPG, WEBP)')
				return
			}
			uploadFile(file)
		}
	}

	const handleRemoveImage = () => {
		setFormData((prev) => ({ ...prev, image: '' }))
		setLocalPreview('')
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.title.trim()) {
			toast.error('Please enter offer banner title')
			return
		}
		if (!formData.image.trim() && !localPreview) {
			toast.error('Please upload an offer banner image')
			return
		}
		if (uploadingImage) {
			toast.error('Please wait until image upload finishes')
			return
		}

		try {
			setSaving(true)
			const payload = {
				...formData,
				brand: 'GOMZI NUTRITION',
				badge: 'UPTO',
				discount: '50% OFF',
				terms: '*On selected products',
				bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 45%, #6ee7b7 85%, #a7f3d0 100%)',
				url: formData.url.trim() || '/gomzi-supplement',
			}

			if (editingBanner) {
				await UpdateNutritionPromoBannerAdmin({ ...payload, id: editingBanner._id || editingBanner.id || '' })
				toast.success('Nutrition offer banner updated successfully')
			} else {
				await CreateNutritionPromoBannerAdmin(payload)
				toast.success('Nutrition offer banner created successfully')
			}

			handleCloseModal()
			fetchBanners()
		} catch (err: any) {
			toast.error(err.message || 'Failed to save nutrition banner')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string, title: string) => {
		if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return

		try {
			await DeleteNutritionPromoBannerAdmin(id)
			toast.success('Nutrition offer banner deleted successfully')
			fetchBanners()
		} catch (err: any) {
			toast.error(err.message || 'Failed to delete banner')
		}
	}

	const handleToggleStatus = async (banner: NutritionPromoBannerItem) => {
		try {
			const id = banner._id || banner.id || ''
			await UpdateNutritionPromoBannerAdmin({ id, status: !banner.status })
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
			await ReorderNutritionPromoBannersAdmin(updated)
			toast.success('Banner order updated')
		} catch (err: any) {
			toast.error(err.message || 'Failed to reorder')
			fetchBanners()
		}
	}

	const displayModalImage = localPreview || getPreviewUrl(formData.image)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Nutrition Promotional Banners</PageTitle>

			<div className='card card-custom'>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<h3 className='fw-bolder m-0 text-gray-800 d-inline-flex align-items-center'>
								<FontAwesomeIcon icon={faImages} className='me-2' style={{ color: '#172B4D' }} />
								Nutrition Promotional Banners{' '}
								{loading ? (
									<span
										className='gz-skeleton rounded ms-2'
										style={{ width: '36px', height: '22px', verticalAlign: 'middle' }}
									/>
								) : (
									`(${banners.length})`
								)}
							</h3>
						</div>
					</div>
					<div className='card-toolbar'>
						<button
							type='button'
							className='btn btn-sm text-white fw-bold d-inline-flex align-items-center shadow-sm'
							style={{
								backgroundColor: '#172B4D',
								borderColor: '#172B4D',
								borderRadius: '10px',
								padding: '9px 18px',
							}}
							onClick={() => handleOpenModal()}>
							<FontAwesomeIcon icon={faPlus} className='me-2' />
							Add New Offer Banner
						</button>
					</div>
				</div>

				<div className='card-body py-4'>
					{loading ? (
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed fs-6 gy-5'>
								<thead>
									<tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
										<th style={{ width: '70px' }}>Order</th>
										<th style={{ width: '280px' }}>Offer Banner Image</th>
										<th>Banner Title</th>
										<th>Target URL</th>
										<th style={{ width: '100px' }}>Status</th>
										<th className='text-end' style={{ width: '120px' }}>Actions</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{Array.from({ length: 5 }).map((_, idx) => (
										<tr key={`nutrition-promo-skeleton-${idx}`} className='gz-skeleton-tr'>
											<td>
												<div className='d-flex flex-column align-items-center gap-1'>
													<div className='gz-skeleton rounded' style={{ width: '28px', height: '28px' }} />
													<div className='gz-skeleton rounded' style={{ width: '20px', height: '14px' }} />
													<div className='gz-skeleton rounded' style={{ width: '28px', height: '28px' }} />
												</div>
											</td>
											<td>
												<div
													className='gz-skeleton'
													style={{
														width: '240px',
														height: '75px',
														borderRadius: '10px',
													}}
												/>
											</td>
											<td>
												<div className='d-flex flex-column gap-2'>
													<div className='gz-skeleton' style={{ width: '70%', height: '16px' }} />
													<div className='gz-skeleton' style={{ width: '40%', height: '12px' }} />
												</div>
											</td>
											<td>
												<div
													className='gz-skeleton rounded'
													style={{ width: '140px', height: '16px' }}
												/>
											</td>
											<td>
												<div
													className='gz-skeleton rounded'
													style={{ width: '70px', height: '24px' }}
												/>
											</td>
											<td className='text-end'>
												<div className='d-inline-flex gap-2 justify-content-end'>
													<div className='gz-skeleton rounded' style={{ width: '32px', height: '32px' }} />
													<div className='gz-skeleton rounded' style={{ width: '32px', height: '32px' }} />
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : banners.length === 0 ? (
						<div className='text-center py-12 bg-light rounded'>
							<FontAwesomeIcon icon={faImage} className='fs-2x text-gray-400 mb-3' />
							<p className='text-gray-600 fs-5 fw-bold mb-1'>No nutrition offer banners added yet</p>
							<p className='text-gray-400 fs-7 mb-4'>
								Upload offer banner images and set their titles to showcase in the website carousel
							</p>
							<button
								type='button'
								className='btn btn-sm text-white fw-bold d-inline-flex align-items-center shadow-sm'
								style={{
									backgroundColor: '#172B4D',
									borderColor: '#172B4D',
									borderRadius: '10px',
									padding: '9px 18px',
								}}
								onClick={() => handleOpenModal()}>
								<FontAwesomeIcon icon={faPlus} className='me-2' />
								Add First Banner
							</button>
						</div>
					) : (
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed fs-6 gy-5'>
								<thead>
									<tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
										<th style={{ width: '70px' }}>Order</th>
										<th style={{ width: '280px' }}>Offer Banner Image</th>
										<th>Banner Title</th>
										<th>Target URL</th>
										<th style={{ width: '100px' }}>Status</th>
										<th className='text-end' style={{ width: '120px' }}>Actions</th>
									</tr>
								</thead>
								<tbody className='text-gray-600 fw-bold'>
									{banners.map((b, idx) => {
										const bannerId = b._id || b.id || ''
										const previewSrc = getPreviewUrl(b.image)
										return (
											<tr key={bannerId || idx}>
												{/* Order */}
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

												{/* Banner Image Preview */}
												<td>
													{b.image ? (
														<div
															style={{
																width: '260px',
																height: '90px',
																borderRadius: '8px',
																overflow: 'hidden',
																border: '1px solid #e4e6ef',
																background: '#f9f9f9',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
															}}>
															<img
																src={previewSrc}
																alt={b.title}
																style={{
																	width: '100%',
																	height: '100%',
																	objectFit: 'cover',
																}}
																onError={(e) => {
																	;(e.target as HTMLElement).style.display = 'none'
																}}
															/>
														</div>
													) : (
														<div
															className='d-flex align-items-center justify-content-center text-muted fs-8'
															style={{
																width: '260px',
																height: '90px',
																borderRadius: '8px',
																border: '1px dashed #d1d5db',
																background: '#f9fafb',
															}}>
															<FontAwesomeIcon icon={faImage} className='me-2' />
															No Image Uploaded
														</div>
													)}
												</td>

												{/* Title */}
												<td>
													<div className='d-flex flex-column'>
														<span className='text-gray-900 fw-bolder fs-6'>{b.title}</span>
													</div>
												</td>

												{/* Target URL */}
												<td>
													{b.url ? (
														<a
															href={b.url.startsWith('http') ? b.url : `http://localhost:5173${b.url}`}
															target='_blank'
															rel='noreferrer'
															className='text-primary fs-7 d-inline-flex align-items-center text-truncate'
															style={{ maxWidth: '240px' }}>
															<FontAwesomeIcon icon={faLink} className='me-1' />
															{b.url}
														</a>
													) : (
														<span className='text-muted fs-7'>/gomzi-supplement</span>
													)}
												</td>

												{/* Status */}
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

												{/* Actions */}
												<td className='text-end'>
													<button
														type='button'
														className='btn btn-icon btn-light-warning btn-sm me-2'
														onClick={() => handleOpenModal(b)}
														title='Edit Offer Banner'>
														<FontAwesomeIcon icon={faEdit} />
													</button>
													<button
														type='button'
														className='btn btn-icon btn-light-danger btn-sm'
														onClick={() => handleDelete(bannerId, b.title)}
														title='Delete Offer Banner'>
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

			{/* Modal for Add / Edit Nutrition Promo Banner */}
			{isModalOpen && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
					<div className='modal-dialog modal-dialog-centered modal-lg'>
						<div className='modal-content shadow-lg border-0'>
							<div className='modal-header'>
								<h5 className='modal-title fw-bolder text-gray-900'>
									<FontAwesomeIcon icon={faImage} className='text-success me-2' />
									{editingBanner ? 'Edit Nutrition Offer Banner' : 'Add New Nutrition Offer Banner'}
								</h5>
								<button
									type='button'
									className='btn-close'
									onClick={handleCloseModal}
								/>
							</div>

							<form onSubmit={handleSubmit}>
								<div className='modal-body p-6'>
									{/* Offer Banner Title */}
									<div className='mb-6'>
										<label className='form-label fw-bold text-gray-800 required'>
											Offer Banner Title
										</label>
										<input
											type='text'
											className='form-control form-control-solid'
											placeholder='e.g. Fuel Muscle Recovery & Peak Strength'
											value={formData.title}
											onChange={(e) => setFormData({ ...formData, title: e.target.value })}
											required
										/>
										<div className='form-text text-muted'>
											Short descriptive headline title for identification and accessibility
										</div>
									</div>

									{/* Offer Banner Image Upload & Preview */}
									<div className='mb-6'>
										<label className='form-label fw-bold text-gray-800 required'>
											Offer Banner Image
										</label>

										{/* Hidden File Input accessible via ref */}
										<input
											ref={fileInputRef}
											type='file'
											className='d-none'
											accept='image/png,image/jpeg,image/webp,image/jpg'
											disabled={uploadingImage}
											onChange={handleFileInputChange}
										/>

										{displayModalImage ? (
											<div className='mb-3'>
												<div
													style={{
														width: '100%',
														height: '200px',
														borderRadius: '12px',
														overflow: 'hidden',
														border: '2px solid #e4e6ef',
														background: '#f8fafc',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														position: 'relative',
													}}>
													<img
														src={displayModalImage}
														alt='Banner Preview'
														style={{
															width: '100%',
															height: '100%',
															objectFit: 'contain',
														}}
													/>

													{uploadingImage && (
														<div
															className='position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center'
															style={{
																backgroundColor: 'rgba(255,255,255,0.85)',
																backdropFilter: 'blur(2px)',
															}}>
															<div className='spinner-border text-success mb-2' role='status' />
															<span className='fw-bold text-gray-800'>Uploading to server...</span>
														</div>
													)}

													<div
														className='position-absolute d-flex gap-2'
														style={{ top: '10px', right: '10px' }}>
														<button
															type='button'
															className='btn btn-light-success btn-sm'
															disabled={uploadingImage}
															onClick={() => fileInputRef.current?.click()}
															title='Change Image'>
															<FontAwesomeIcon icon={faRotateRight} className='me-1' />
															Change
														</button>
														<button
															type='button'
															className='btn btn-light-danger btn-sm'
															disabled={uploadingImage}
															onClick={handleRemoveImage}
															title='Remove Image'>
															<FontAwesomeIcon icon={faTrash} className='me-1' />
															Remove
														</button>
													</div>
												</div>
											</div>
										) : (
											<div
												className={`p-8 text-center rounded border-2 border-dashed mb-3 ${
													isDragging
														? 'border-success bg-light-success'
														: 'border-gray-300 bg-light-success'
												}`}
												style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
												onClick={() => fileInputRef.current?.click()}
												onDragOver={handleDragOver}
												onDragLeave={handleDragLeave}
												onDrop={handleDrop}>
												{uploadingImage ? (
													<div className='py-4'>
														<div className='spinner-border text-success mb-3' role='status' />
														<div className='fw-bold text-gray-800 fs-6'>Uploading banner...</div>
													</div>
												) : (
													<>
														<FontAwesomeIcon
															icon={faUpload}
															className='fs-2x text-success mb-3'
														/>
														<div className='fw-bolder text-gray-800 fs-5 mb-1'>
															Click to Upload or Drag & Drop Banner
														</div>
														<div className='text-muted fs-7 mb-4'>
															Recommended banner dimensions: 1200 × 300px or 1920 × 480px (PNG, JPG, WEBP)
														</div>
														<button
															type='button'
															className='btn btn-success btn-sm'
															onClick={(e) => {
																e.stopPropagation()
																fileInputRef.current?.click()
															}}>
															<FontAwesomeIcon icon={faUpload} className='me-2' />
															Choose Image File
														</button>
													</>
												)}
											</div>
										)}

										{/* Direct URL input if image already hosted */}
										<div className='input-group input-group-sm mt-2'>
											<span className='input-group-text bg-light text-muted'>Or Image URL</span>
											<input
												type='text'
												className='form-control'
												placeholder='https://... or /images/...'
												value={formData.image}
												onChange={(e) => {
													setFormData({ ...formData, image: e.target.value })
													setLocalPreview('')
												}}
											/>
											<button
												type='button'
												className='btn btn-light-success'
												onClick={() => fileInputRef.current?.click()}
												disabled={uploadingImage}>
												<FontAwesomeIcon icon={faUpload} className='me-1' />
												Browse
											</button>
										</div>
									</div>

									{/* Target URL */}
									<div className='mb-6'>
										<label className='form-label fw-bold text-gray-800'>
											Target / Redirect URL
										</label>
										<div className='input-group'>
											<span className='input-group-text bg-light'>
												<FontAwesomeIcon icon={faLink} className='text-muted' />
											</span>
											<input
												type='text'
												className='form-control form-control-solid'
												placeholder='/gomzi-supplement'
												value={formData.url}
												onChange={(e) => setFormData({ ...formData, url: e.target.value })}
											/>
										</div>
										<div className='form-text text-muted'>
											Page URL to navigate when a user clicks the banner (defaults to <code>/gomzi-supplement</code>)
										</div>
									</div>

									{/* Status Toggle */}
									<div className='form-check form-switch form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											id='bannerStatusSwitch'
											checked={formData.status}
											onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
										/>
										<label className='form-check-label fw-bold text-gray-800' htmlFor='bannerStatusSwitch'>
											Active (Display on website carousel immediately)
										</label>
									</div>
								</div>

								<div className='modal-footer bg-light py-3 px-6'>
									<button
										type='button'
										className='btn btn-light'
										onClick={handleCloseModal}>
										Cancel
									</button>
									<button
										type='submit'
										className='btn text-white fw-bold'
										style={{ backgroundColor: '#172B4D', borderColor: '#172B4D', borderRadius: '8px', padding: '9px 20px' }}
										disabled={saving || uploadingImage}>
										{saving ? (
											<>
												<span className='spinner-border spinner-border-sm me-2' role='status' />
												Saving...
											</>
										) : editingBanner ? (
											'Update Banner'
										) : (
											'Create Banner'
										)}
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
