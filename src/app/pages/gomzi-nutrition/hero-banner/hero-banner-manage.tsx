import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
	DeleteHeroBanner,
	FileUploadToFGGroup,
	GetHeroBanner,
	UpdateHeroBanner,
} from '../../../Functions/FGGroup'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCheck,
	faChevronLeft,
	faChevronRight,
	faDesktop,
	faEye,
	faFilePdf,
	faImage,
	faLink,
	faPlus,
	faRotateLeft,
	faTrash,
	faUpload,
} from '@fortawesome/free-solid-svg-icons'
import '../common-management.css'
import '../products-theme.css'

export interface BannerSlide {
	_id?: string
	id?: string
	title?: string
	subtitle?: string
	desktop_image: string
	mobile_image?: string
	alt_text?: string
	shop_link?: string
	brochure_url?: string
	order?: number
	status?: boolean
}

const DEFAULT_BANNER: BannerSlide = {
	title: 'SCIENCE-BACKED NUTRITION FOR EVERYDAY PERFORMANCE',
	subtitle: 'Premium Protein | Wellness | No Amino Spiking 100%',
	desktop_image: '/images/banner-(gls)-web-view.webp',
	mobile_image: '/images/banner-(gls)-mobile-view.webp',
	alt_text: 'Science-backed sports nutrition products by Gomzi Supplement.',
	shop_link: '/gomzi-supplement',
	brochure_url: '/pdf/gomzi-brochure.pdf',
	status: true,
	order: 0,
}

const getPreviewUrl = (url: string) => {
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

export default function HeroBannerManage() {
	const [slides, setSlides] = useState<BannerSlide[]>([DEFAULT_BANNER])
	const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0)
	const [loading, setLoading] = useState<boolean>(true)
	const [saving, setSaving] = useState<boolean>(false)
	const [deleting, setDeleting] = useState<boolean>(false)

	// Current active slide editing state
	const [desktopFile, setDesktopFile] = useState<File | null>(null)
	const [desktopPreview, setDesktopPreview] = useState<string>('')

	const currentSlide: BannerSlide = slides[activeSlideIndex] || DEFAULT_BANNER

	useEffect(() => {
		fetchBannerData()
	}, [])

	const fetchBannerData = async () => {
		try {
			setLoading(true)
			const res: any = await GetHeroBanner()
			if (res && res.data) {
				const data = res.data
				let bannerList: BannerSlide[] = []

				if (Array.isArray(data.banners) && data.banners.length > 0) {
					bannerList = data.banners
				} else if (data.desktop_image) {
					bannerList = [data]
				} else {
					bannerList = [DEFAULT_BANNER]
				}

				setSlides(bannerList)
				setActiveSlideIndex(0)
				initSlideForm(bannerList[0])
			}
		} catch (error: any) {
			console.error('Error fetching hero banners:', error)
			toast.error('Failed to load hero banner data')
		} finally {
			setLoading(false)
		}
	}

	const initSlideForm = (slide: BannerSlide) => {
		setDesktopFile(null)
		setDesktopPreview(getPreviewUrl(slide?.desktop_image || DEFAULT_BANNER.desktop_image))
	}

	const handleSelectSlide = (index: number) => {
		setActiveSlideIndex(index)
		initSlideForm(slides[index])
	}

	const handleAddNewSlide = () => {
		const newSlideNumber = slides.length + 1
		const newSlide: BannerSlide = {
			title: 'SCIENCE-BACKED NUTRITION FOR EVERYDAY PERFORMANCE',
			subtitle: 'Premium Protein | Wellness | No Amino Spiking 100%',
			desktop_image: '/images/banner-(gls)-web-view.webp',
			mobile_image: '/images/banner-(gls)-mobile-view.webp',
			alt_text: 'Science-backed sports nutrition products by Gomzi Supplement.',
			shop_link: '/gomzi-supplement',
			brochure_url: '/pdf/gomzi-brochure.pdf',
			order: slides.length,
			status: true,
		}

		const updated = [...slides, newSlide]
		setSlides(updated)
		setActiveSlideIndex(updated.length - 1)
		initSlideForm(newSlide)
		toast.success(`New Slide #${newSlideNumber} added. Configure image and click Save!`)
	}

	const handleDeleteSlide = async () => {
		if (slides.length <= 1) {
			toast.error('You must keep at least 1 hero banner slide.')
			return
		}

		const slideToDelete = slides[activeSlideIndex]
		if (!window.confirm(`Are you sure you want to delete Slide #${activeSlideIndex + 1}?`)) {
			return
		}

		try {
			setDeleting(true)
			const slideId = slideToDelete._id || slideToDelete.id

			if (slideId) {
				await DeleteHeroBanner(slideId)
			}

			const updated = slides.filter((_, idx) => idx !== activeSlideIndex)
			setSlides(updated)
			const nextIdx = Math.max(0, activeSlideIndex - 1)
			setActiveSlideIndex(nextIdx)
			initSlideForm(updated[nextIdx])
			toast.success('Slide removed successfully!')
		} catch (err: any) {
			console.error('Error deleting slide:', err)
			toast.error(err.message || 'Failed to delete slide')
		} finally {
			setDeleting(false)
		}
	}

	const handleDesktopFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setDesktopFile(file)
			setDesktopPreview(URL.createObjectURL(file))
		}
	}

	const handleFieldChange = (field: keyof BannerSlide, value: any) => {
		const updated = [...slides]
		updated[activeSlideIndex] = {
			...updated[activeSlideIndex],
			[field]: value,
		}
		setSlides(updated)
	}

	const handleSaveCurrentSlide = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()

		try {
			setSaving(true)
			let finalDesktop = currentSlide.desktop_image
			let finalMobile = currentSlide.mobile_image

			// Upload Desktop File if new file selected
			if (desktopFile) {
				const uploadRes: any = await FileUploadToFGGroup([desktopFile], {
					directory: 'hero-banner',
				})
				const uploadedKey = uploadRes?.data?.fileURLs?.[0]
				if (uploadedKey) {
					finalDesktop = uploadedKey
					setDesktopPreview(getPreviewUrl(uploadedKey))
				}
			}

			if (!finalDesktop) {
				toast.error('Please specify or upload a Desktop Banner Image.')
				setSaving(false)
				return
			}

			const slideId = currentSlide._id || currentSlide.id
			const payload: any = {
				...(slideId ? { id: slideId } : { isNew: true }),
				title: currentSlide.title,
				subtitle: currentSlide.subtitle,
				desktop_image: finalDesktop,
				mobile_image: finalMobile || finalDesktop,
				alt_text: currentSlide.alt_text,
				shop_link: currentSlide.shop_link,
				brochure_url: currentSlide.brochure_url,
				order: typeof currentSlide.order === 'number' ? currentSlide.order : activeSlideIndex,
				status: typeof currentSlide.status === 'boolean' ? currentSlide.status : true,
			}

			const res: any = await UpdateHeroBanner(payload)

			if (res && (res.status === 200 || res.data)) {
				toast.success(`Slide #${activeSlideIndex + 1} saved successfully!`)
				if (res.data?.banners && Array.isArray(res.data.banners)) {
					setSlides(res.data.banners)
				} else if (res.data?.banner?._id) {
					const updated = [...slides]
					updated[activeSlideIndex] = {
						...updated[activeSlideIndex],
						_id: res.data.banner._id,
						desktop_image: finalDesktop,
						mobile_image: finalMobile,
					}
					setSlides(updated)
				}
				setDesktopFile(null)
			} else {
				toast.error(res?.message || 'Failed to save banner slide')
			}
		} catch (error: any) {
			console.error('Error saving banner slide:', error)
			toast.error(error.message || 'Something went wrong while saving')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>
				Hero Banner Slider Management
			</PageTitle>

			{/* Breadcrumb */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span>Content</span>
				<span className='sep'>&gt;</span>
				<span className='current'>Hero Banners</span>
			</div>

			{/* Top Action Header */}
			<div className='gz-mgmt-header mb-6'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Hero Banner Slider</h1>
					<p className='gz-mgmt-subtitle'>
						Configure multi-swipe homepage carousel banners, responsive desktop and mobile graphics, CTA links, and live preview.
					</p>
				</div>

				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						onClick={handleAddNewSlide}
						className='gz-mgmt-btn-secondary'
						disabled={saving || loading}>
						<FontAwesomeIcon icon={faPlus} />
						<span>Add New Slide</span>
					</button>

					<button
						type='button'
						onClick={() => handleSaveCurrentSlide()}
						className='gz-mgmt-btn-primary'
						disabled={saving || loading}>
						{saving ? (
							<>
								<span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
								<span>Saving Slide...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faCheck} className='me-2' />
								<span>Save Active Slide</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* KPI Metric Summary Grid */}
			<div className='gz-prod-summary-grid mb-6'>
				{loading ? (
					<>
						<div className='gz-prod-summary-card blue'>
							<div className='gz-skeleton' style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
							<div className='gz-prod-summary-info'>
								<div className='gz-skeleton mb-1' style={{ width: '70px', height: '12px' }} />
								<div className='gz-skeleton' style={{ width: '40px', height: '22px' }} />
							</div>
						</div>
						<div className='gz-prod-summary-card green'>
							<div className='gz-skeleton' style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
							<div className='gz-prod-summary-info'>
								<div className='gz-skeleton mb-1' style={{ width: '90px', height: '12px' }} />
								<div className='gz-skeleton' style={{ width: '40px', height: '22px' }} />
							</div>
						</div>
						<div className='gz-prod-summary-card amber'>
							<div className='gz-skeleton' style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
							<div className='gz-prod-summary-info'>
								<div className='gz-skeleton mb-1' style={{ width: '80px', height: '12px' }} />
								<div className='gz-skeleton' style={{ width: '65px', height: '22px' }} />
							</div>
						</div>
						<div className='gz-prod-summary-card purple'>
							<div className='gz-skeleton' style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
							<div className='gz-prod-summary-info'>
								<div className='gz-skeleton mb-1' style={{ width: '95px', height: '12px' }} />
								<div className='gz-skeleton' style={{ width: '55px', height: '22px' }} />
							</div>
						</div>
					</>
				) : (
					<>
						<div className='gz-prod-summary-card blue'>
							<div className='gz-prod-summary-icon'>
								<FontAwesomeIcon icon={faImage} />
							</div>
							<div className='gz-prod-summary-info'>
								<span className='gz-prod-summary-label'>Total Slides</span>
								<span className='gz-prod-summary-value'>{slides.length}</span>
							</div>
						</div>

						<div className='gz-prod-summary-card green'>
							<div className='gz-prod-summary-icon'>
								<FontAwesomeIcon icon={faCheck} />
							</div>
							<div className='gz-prod-summary-info'>
								<span className='gz-prod-summary-label'>Active Carousel</span>
								<span className='gz-prod-summary-value' style={{ color: '#168064' }}>
									{slides.filter((s) => s.status !== false).length}
								</span>
							</div>
						</div>

						<div className='gz-prod-summary-card amber'>
							<div className='gz-prod-summary-icon'>
								<FontAwesomeIcon icon={faEye} />
							</div>
							<div className='gz-prod-summary-info'>
								<span className='gz-prod-summary-label'>Selected Slide</span>
								<span className='gz-prod-summary-value' style={{ fontSize: '1.25rem', color: '#172B4D' }}>
									Slide #{activeSlideIndex + 1}
								</span>
							</div>
						</div>

						<div className='gz-prod-summary-card purple'>
							<div className='gz-prod-summary-icon'>
								<FontAwesomeIcon icon={faDesktop} />
							</div>
							<div className='gz-prod-summary-info'>
								<span className='gz-prod-summary-label'>Preview Viewport</span>
								<span className='gz-prod-summary-value' style={{ fontSize: '1.1rem', textTransform: 'capitalize', color: '#7C3AED' }}>
									Desktop
								</span>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Slide Navigation Strip Card */}
			<div className='gz-mgmt-card mb-6'>
				<div className='p-4 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					{loading ? (
						<div className='d-flex flex-wrap align-items-center gap-2'>
							<div className='gz-skeleton me-2' style={{ width: '120px', height: '14px' }} />
							<div className='gz-skeleton' style={{ width: '105px', height: '36px', borderRadius: '10px' }} />
							<div className='gz-skeleton' style={{ width: '105px', height: '36px', borderRadius: '10px' }} />
							<div className='gz-skeleton' style={{ width: '105px', height: '36px', borderRadius: '10px' }} />
							<div className='gz-skeleton' style={{ width: '95px', height: '36px', borderRadius: '10px' }} />
						</div>
					) : (
						<>
							<div className='d-flex flex-wrap align-items-center gap-2'>
								<span className='text-muted fw-bold fs-8 text-uppercase me-2' style={{ letterSpacing: '0.05em' }}>
									Banner Carousel:
								</span>
								{slides.map((slide, idx) => (
									<button
										key={slide._id || idx}
										type='button'
										onClick={() => handleSelectSlide(idx)}
										className='btn btn-sm d-flex align-items-center gap-2 px-4 py-2 transition-all'
										style={{
											backgroundColor: activeSlideIndex === idx ? '#172B4D' : '#F8FAFD',
											color: activeSlideIndex === idx ? '#ffffff' : '#334155',
											border: activeSlideIndex === idx ? '1px solid #172B4D' : '1px solid #E2E8F0',
											borderRadius: '10px',
											boxShadow: activeSlideIndex === idx ? '0 4px 12px rgba(23, 43, 77, 0.2)' : 'none',
											fontWeight: 600,
										}}>
										<FontAwesomeIcon icon={faImage} />
										<span>Slide #{idx + 1}</span>
										<span
											className={`badge ms-1 ${
												slide.status !== false
													? activeSlideIndex === idx
														? 'bg-white text-success'
														: 'bg-light-success text-success'
													: 'bg-light-danger text-danger'
											}`}
											style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '6px' }}>
											{slide.status !== false ? 'Active' : 'Draft'}
										</span>
									</button>
								))}

								<button
									type='button'
									onClick={handleAddNewSlide}
									className='btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 text-primary fw-bold'
									style={{
										backgroundColor: '#EFF6FF',
										border: '1px dashed #93C5FD',
										borderRadius: '10px',
									}}>
									<FontAwesomeIcon icon={faPlus} />
									<span>Add Slide</span>
								</button>
							</div>

							{slides.length > 1 && (
								<button
									type='button'
									onClick={handleDeleteSlide}
									disabled={deleting || saving}
									className='btn btn-sm d-flex align-items-center gap-2 text-danger fw-bold'
									style={{
										backgroundColor: '#FEF2F2',
										border: '1px solid #FECACA',
										borderRadius: '10px',
									}}>
									<FontAwesomeIcon icon={faTrash} />
									<span>Delete Slide #{activeSlideIndex + 1}</span>
								</button>
							)}
						</>
					)}
				</div>
			</div>

			{loading ? (
				<div className='row g-6'>
					{/* Left Column: Edit Active Slide Form Skeleton */}
					<div className='col-lg-7 col-xl-7'>
						{/* Card 1: Desktop Image Skeleton */}
						<div className='gz-mgmt-card mb-6'>
							<div
								className='p-5 border-bottom d-flex align-items-center justify-content-between'
								style={{ backgroundColor: '#F8FAFD' }}>
								<div className='d-flex align-items-center gap-3'>
									<div className='gz-skeleton' style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
									<div>
										<div className='gz-skeleton mb-1' style={{ width: '180px', height: '16px' }} />
										<div className='gz-skeleton' style={{ width: '250px', height: '12px' }} />
									</div>
								</div>
								<div className='gz-skeleton' style={{ width: '68px', height: '24px', borderRadius: '6px' }} />
							</div>
							<div className='p-6'>
								<div className='mb-4'>
									<div className='gz-skeleton mb-2' style={{ width: '150px', height: '14px' }} />
									<div className='gz-skeleton' style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
								</div>
								<div>
									<div className='gz-skeleton mb-2' style={{ width: '210px', height: '14px' }} />
									<div className='gz-skeleton' style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
								</div>
							</div>
						</div>

						{/* Card 2: Mobile Image Skeleton */}
						<div className='gz-mgmt-card mb-6'>
							<div
								className='p-5 border-bottom d-flex align-items-center justify-content-between'
								style={{ backgroundColor: '#F8FAFD' }}>
								<div className='d-flex align-items-center gap-3'>
									<div className='gz-skeleton' style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
									<div>
										<div className='gz-skeleton mb-1' style={{ width: '170px', height: '16px' }} />
										<div className='gz-skeleton' style={{ width: '240px', height: '12px' }} />
									</div>
								</div>
								<div className='gz-skeleton' style={{ width: '64px', height: '24px', borderRadius: '6px' }} />
							</div>
							<div className='p-6'>
								<div className='mb-4'>
									<div className='gz-skeleton mb-2' style={{ width: '150px', height: '14px' }} />
									<div className='gz-skeleton' style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
								</div>
								<div>
									<div className='gz-skeleton mb-2' style={{ width: '210px', height: '14px' }} />
									<div className='gz-skeleton' style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
								</div>
							</div>
						</div>

						{/* Card 3: Slide Details Skeleton */}
						<div className='gz-mgmt-card mb-6'>
							<div
								className='p-5 border-bottom d-flex align-items-center justify-content-between'
								style={{ backgroundColor: '#F8FAFD' }}>
								<div className='d-flex align-items-center gap-3'>
									<div className='gz-skeleton' style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
									<div>
										<div className='gz-skeleton mb-1' style={{ width: '220px', height: '16px' }} />
										<div className='gz-skeleton' style={{ width: '180px', height: '12px' }} />
									</div>
								</div>
							</div>
							<div className='p-6'>
								<div className='row g-4'>
									<div className='col-12'>
										<div className='gz-skeleton mb-2' style={{ width: '120px', height: '14px' }} />
										<div className='gz-skeleton' style={{ width: '100%', height: '42px', borderRadius: '10px' }} />
									</div>
									<div className='col-12'>
										<div className='gz-skeleton mb-2' style={{ width: '140px', height: '14px' }} />
										<div className='gz-skeleton' style={{ width: '100%', height: '42px', borderRadius: '10px' }} />
									</div>
									<div className='col-md-6'>
										<div className='gz-skeleton mb-2' style={{ width: '130px', height: '14px' }} />
										<div className='gz-skeleton' style={{ width: '100%', height: '42px', borderRadius: '10px' }} />
									</div>
									<div className='col-md-6'>
										<div className='gz-skeleton mb-2' style={{ width: '130px', height: '14px' }} />
										<div className='gz-skeleton' style={{ width: '100%', height: '42px', borderRadius: '10px' }} />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column: Live Preview Skeleton */}
					<div className='col-lg-5 col-xl-5'>
						<div className='gz-mgmt-card sticky-top' style={{ top: '24px' }}>
							<div
								className='p-5 border-bottom d-flex align-items-center justify-content-between'
								style={{ backgroundColor: '#F8FAFD' }}>
								<div className='d-flex align-items-center gap-2'>
									<div className='gz-skeleton' style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
									<div className='gz-skeleton' style={{ width: '150px', height: '16px' }} />
								</div>
								<div className='d-flex gap-2'>
									<div className='gz-skeleton' style={{ width: '75px', height: '30px', borderRadius: '8px' }} />
									<div className='gz-skeleton' style={{ width: '70px', height: '30px', borderRadius: '8px' }} />
								</div>
							</div>
							<div className='p-6'>
								<div className='gz-skeleton mb-4' style={{ width: '100%', height: '220px', borderRadius: '14px' }} />
								<div className='p-4 rounded-3' style={{ backgroundColor: '#F8FAFD', border: '1px solid #E2E8F0' }}>
									<div className='gz-skeleton mb-2' style={{ width: '35%', height: '13px' }} />
									<div className='gz-skeleton mb-2' style={{ width: '80%', height: '15px' }} />
									<div className='gz-skeleton' style={{ width: '55%', height: '13px' }} />
								</div>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='row g-6'>
					{/* Left Column: Edit Active Slide Form */}
					<div className='col-lg-7 col-xl-7'>
						{/* Card: Desktop Image */}
						<div className='gz-mgmt-card mb-6'>
							<div
								className='p-5 border-bottom d-flex align-items-center justify-content-between'
								style={{ backgroundColor: '#F8FAFD' }}>
								<div className='d-flex align-items-center gap-3'>
									<div
										className='d-flex align-items-center justify-content-center rounded-3'
										style={{ width: '40px', height: '40px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
										<FontAwesomeIcon icon={faDesktop} />
									</div>
									<div>
										<h3 className='fs-5 fw-bolder text-dark mb-0'>
											Slide #{activeSlideIndex + 1}: Desktop Image
										</h3>
										<span className='text-muted fs-8'>
											Recommended: 1920 &times; 800px (WebP or JPG) for screens &ge; 1024px
										</span>
									</div>
								</div>
								<span className='badge bg-light-primary text-primary fw-bold px-3 py-1'>Desktop</span>
							</div>

							<div className='p-6'>
								<div className='mb-4'>
									<label className='form-label fw-bold fs-7 text-dark mb-2'>
										Upload Desktop Graphic
									</label>
									<div className='input-group'>
										<input
											type='file'
											accept='image/webp,image/png,image/jpeg,image/jpg'
											onChange={handleDesktopFileChange}
											className='form-control'
											id='desktopFileInput'
											style={{ borderRadius: '10px 0 0 10px', height: '44px' }}
										/>
										<label
											className='input-group-text bg-light text-dark fw-bold'
											htmlFor='desktopFileInput'
											style={{ borderRadius: '0 10px 10px 0', cursor: 'pointer' }}>
											<FontAwesomeIcon icon={faUpload} className='me-2' /> Browse
										</label>
									</div>
									{desktopFile && (
										<div className='text-success fs-8 mt-2 fw-semibold'>
											Selected: {desktopFile.name} ({(desktopFile.size / 1024).toFixed(1)} KB)
										</div>
									)}
								</div>

								<div className='mb-0'>
									<label className='form-label fw-bold fs-7 text-dark mb-2'>
										Or Direct Image URL / S3 Asset Key
									</label>
									<div className='input-group'>
										<span
											className='input-group-text text-muted'
											style={{ backgroundColor: '#F8FAFD', borderRadius: '10px 0 0 10px' }}>
											<FontAwesomeIcon icon={faLink} />
										</span>
										<input
											type='text'
											value={currentSlide.desktop_image || ''}
											onChange={(e) => {
												handleFieldChange('desktop_image', e.target.value)
												if (!desktopFile) setDesktopPreview(getPreviewUrl(e.target.value))
											}}
											placeholder='/images/banner-(gls)-web-view.webp'
											className='form-control'
											style={{ borderRadius: '0 10px 10px 0', height: '44px' }}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Card: Slide Configuration */}
						<div className='gz-mgmt-card mb-6'>
							<div
								className='p-5 border-bottom'
								style={{ backgroundColor: '#F8FAFD' }}>
								<h3 className='fs-5 fw-bolder text-dark mb-0'>Slide Navigation & Action Links</h3>
							</div>

							<div className='p-6'>
								<div className='row g-4'>
									<div className='col-md-6'>
										<label className='form-label fw-bold fs-7 text-dark mb-2'>
											Shop Now Destination URL
										</label>
										<input
											type='text'
											value={currentSlide.shop_link || ''}
											onChange={(e) => handleFieldChange('shop_link', e.target.value)}
											placeholder='/gomzi-supplement'
											className='form-control'
											style={{ borderRadius: '10px', height: '44px' }}
										/>
									</div>

									<div className='col-md-6'>
										<label className='form-label fw-bold fs-7 text-dark mb-2'>
											Brochure Download Path
										</label>
										<div className='input-group'>
											<span
												className='input-group-text text-muted'
												style={{ backgroundColor: '#F8FAFD', borderRadius: '10px 0 0 10px' }}>
												<FontAwesomeIcon icon={faFilePdf} />
											</span>
											<input
												type='text'
												value={currentSlide.brochure_url || ''}
												onChange={(e) => handleFieldChange('brochure_url', e.target.value)}
												placeholder='/pdf/gomzi-brochure.pdf'
												className='form-control'
												style={{ borderRadius: '0 10px 10px 0', height: '44px' }}
											/>
										</div>
									</div>

									<div className='col-md-12'>
										<label className='form-label fw-bold fs-7 text-dark mb-2'>
											Image Alt Text (SEO & Accessibility)
										</label>
										<input
											type='text'
											value={currentSlide.alt_text || ''}
											onChange={(e) => handleFieldChange('alt_text', e.target.value)}
											placeholder='Science-backed sports nutrition products by Gomzi Supplement.'
											className='form-control'
											style={{ borderRadius: '10px', height: '44px' }}
										/>
									</div>

									<div className='col-md-12'>
										<div
											className='p-4 rounded-3 d-flex align-items-center justify-content-between mt-2'
											style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
											<div>
												<span className='fw-bold text-dark d-block fs-7'>
													Slide Active Status
												</span>
												<span className='text-muted fs-8'>
													When enabled, this slide is rendered inside the live customer homepage carousel.
												</span>
											</div>
											<div className='form-check form-switch form-check-custom form-check-solid m-0'>
												<input
													className='form-check-input'
													type='checkbox'
													id='statusSwitch'
													style={{ width: '48px', height: '24px', cursor: 'pointer' }}
													checked={currentSlide.status !== false}
													onChange={(e) => handleFieldChange('status', e.target.checked)}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column: Live Multi-Slide Swiper Simulator */}
					<div className='col-lg-5 col-xl-5'>
						<div className='gz-mgmt-card sticky-top' style={{ top: '90px' }}>
							<div
								className='p-5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2'
								style={{ backgroundColor: '#F8FAFD' }}>
								<div className='d-flex align-items-center gap-2'>
									<FontAwesomeIcon icon={faEye} className='text-primary' />
									<h3 className='fs-5 fw-bolder text-dark mb-0'>Live Simulator</h3>
								</div>

								<div className='d-flex align-items-center gap-2'>
									{/* Slide carousel controls */}
									<div className='d-flex align-items-center gap-1 me-2'>
										<button
											type='button'
											onClick={() =>
												handleSelectSlide((activeSlideIndex - 1 + slides.length) % slides.length)
											}
											className='btn btn-sm btn-light p-2'
											style={{ borderRadius: '8px', width: '32px', height: '32px' }}
											title='Previous Slide'>
											<FontAwesomeIcon icon={faChevronLeft} />
										</button>
										<span className='text-dark fw-bold fs-8 px-2'>
											{activeSlideIndex + 1} / {slides.length}
										</span>
										<button
											type='button'
											onClick={() => handleSelectSlide((activeSlideIndex + 1) % slides.length)}
											className='btn btn-sm btn-light p-2'
											style={{ borderRadius: '8px', width: '32px', height: '32px' }}
											title='Next Slide'>
											<FontAwesomeIcon icon={faChevronRight} />
										</button>
									</div>

									{/* Desktop View Badge */}
									<span
										className='badge px-3 py-2 fw-bold text-dark d-inline-flex align-items-center'
										style={{ backgroundColor: '#EEF2F7', borderRadius: '8px' }}>
										<FontAwesomeIcon icon={faDesktop} className='me-1.5 text-primary' /> Desktop Preview
									</span>
								</div>
							</div>

							<div className='p-6'>
								<div className='text-muted fs-8 mb-3 fw-semibold'>
									Slide #{activeSlideIndex + 1} live storefront composition:
								</div>

								{/* Simulated Device Stage */}
								<div
									className='overflow-hidden shadow-sm position-relative mx-auto bg-dark'
									style={{
										maxWidth: '100%',
										borderRadius: '14px',
										border: '2px solid #0F172A',
									}}>
									<div className='position-relative w-100'>
										<img
											src={desktopPreview || getPreviewUrl(currentSlide.desktop_image)}
											alt='Hero Slide Preview'
											className='w-100 h-auto d-block object-fit-cover'
											onError={(e: any) => {
												e.target.src = '/images/banner-(gls)-web-view.webp'
											}}
										/>
									</div>
								</div>

								{/* Status Breakdown Info */}
								<div
									className='mt-4 p-4 rounded-3 text-gray-700 fs-8'
									style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
									<div className='d-flex justify-content-between mb-2'>
										<span className='fw-bold text-muted'>Total Slides:</span>
										<span className='badge bg-light-primary text-primary fw-bold'>{slides.length} Slides</span>
									</div>
									<div className='d-flex justify-content-between mb-2'>
										<span className='fw-bold text-muted'>Active Editing:</span>
										<span className='fw-bold text-dark'>Slide #{activeSlideIndex + 1}</span>
									</div>
									<div className='d-flex justify-content-between text-truncate'>
										<span className='fw-bold text-muted me-2'>Shop Route:</span>
										<span className='text-primary fw-bold text-truncate'>{currentSlide.shop_link || '/gomzi-supplement'}</span>
									</div>
								</div>

								<div className='mt-4 d-grid'>
									<button
										type='button'
										onClick={() => handleSaveCurrentSlide()}
										disabled={saving}
										className='gz-mgmt-btn-primary w-100 justify-content-center'
										style={{ height: '46px', fontSize: '14px' }}>
										{saving ? (
											<>
												<span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true'></span>
												Saving Slide #{activeSlideIndex + 1}...
											</>
										) : (
											<>
												<FontAwesomeIcon icon={faCheck} className='me-2' />
												Save Slide #{activeSlideIndex + 1}
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}