import React, { useEffect, useState } from 'react'
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
	faMobileScreen,
	faPlus,
	faRotateLeft,
	faTrash,
	faUpload,
} from '@fortawesome/free-solid-svg-icons'

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
	const [previewTab, setPreviewTab] = useState<'desktop' | 'mobile'>('desktop')

	// Current active slide editing state
	const [desktopFile, setDesktopFile] = useState<File | null>(null)
	const [desktopPreview, setDesktopPreview] = useState<string>('')
	const [mobileFile, setMobileFile] = useState<File | null>(null)
	const [mobilePreview, setMobilePreview] = useState<string>('')

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
		setMobileFile(null)
		setDesktopPreview(getPreviewUrl(slide?.desktop_image || DEFAULT_BANNER.desktop_image))
		setMobilePreview(getPreviewUrl(slide?.mobile_image || DEFAULT_BANNER.mobile_image || ''))
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

	const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0]
			setMobileFile(file)
			setMobilePreview(URL.createObjectURL(file))
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

			// Upload Mobile File if new file selected
			if (mobileFile) {
				const uploadRes: any = await FileUploadToFGGroup([mobileFile], {
					directory: 'hero-banner',
				})
				const uploadedKey = uploadRes?.data?.fileURLs?.[0]
				if (uploadedKey) {
					finalMobile = uploadedKey
					setMobilePreview(getPreviewUrl(uploadedKey))
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
				setMobileFile(null)
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
		<>
			<PageTitle breadcrumbs={[{ title: 'RAG Dashboard', path: '/rag/dashboard', isSeparator: false, isActive: false }]}>
				Hero Banner Slider Management
			</PageTitle>

			<div className='container-fluid py-6'>
				{/* Top Action Header */}
				<div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-6'>
					<div>
						<h1 className='text-gray-900 fw-bolder fs-2 mb-1'>Hero Banner Slider (Multi-Swipe)</h1>
						<p className='text-gray-600 fs-7 mb-0'>
							Manage multiple hero banner slides. Users can swipe through them on touch devices or watch them autoplay on the live website.
						</p>
					</div>

					<div className='d-flex align-items-center gap-3'>
						<button
							type='button'
							onClick={handleAddNewSlide}
							className='btn btn-light-primary btn-sm d-flex align-items-center gap-2'
							disabled={saving || loading}>
							<FontAwesomeIcon icon={faPlus} />
							<span>Add New Slide</span>
						</button>

						<button
							type='button'
							onClick={() => handleSaveCurrentSlide()}
							className='btn btn-primary btn-sm d-flex align-items-center gap-2'
							disabled={saving || loading}>
							{saving ? (
								<>
									<span className='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>
									<span>Saving Slide...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faCheck} />
									<span>Save Active Slide</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Slide Navigation Tabs */}
				<div className='card card-flush shadow-sm mb-6'>
					<div className='card-body py-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
						<div className='d-flex flex-wrap align-items-center gap-2'>
							<span className='text-muted fw-bold fs-7 me-2'>BANNER SLIDES:</span>
							{slides.map((slide, idx) => (
								<button
									key={slide._id || idx}
									type='button'
									onClick={() => handleSelectSlide(idx)}
									className={`btn btn-sm d-flex align-items-center gap-2 px-4 py-2 ${
										activeSlideIndex === idx
											? 'btn-primary shadow-sm'
											: 'btn-light text-gray-700 hover:bg-light-primary'
									}`}>
									<FontAwesomeIcon icon={faImage} />
									<span className='fw-bolder'>Slide #{idx + 1}</span>
									<span
										className={`badge ms-1 ${
											slide.status !== false
												? activeSlideIndex === idx
													? 'badge-light-success bg-white text-success'
													: 'badge-light-success'
												: 'badge-light-danger'
										}`}
										style={{ fontSize: '10px' }}>
										{slide.status !== false ? 'Active' : 'Disabled'}
									</span>
								</button>
							))}

							<button
								type='button'
								onClick={handleAddNewSlide}
								className='btn btn-sm btn-outline btn-outline-dashed btn-outline-primary d-flex align-items-center gap-1.5 px-3 py-2'>
								<FontAwesomeIcon icon={faPlus} />
								<span>Add Slide</span>
							</button>
						</div>

						{slides.length > 1 && (
							<button
								type='button'
								onClick={handleDeleteSlide}
								disabled={deleting || saving}
								className='btn btn-sm btn-light-danger d-flex align-items-center gap-2'>
								<FontAwesomeIcon icon={faTrash} />
								<span>Delete Slide #{activeSlideIndex + 1}</span>
							</button>
						)}
					</div>
				</div>

				{loading ? (
					<div className='card card-flush shadow-sm p-10 text-center'>
						<div className='spinner-border text-primary mx-auto mb-4' role='status'></div>
						<div className='text-gray-600 fs-6'>Loading hero banner slides...</div>
					</div>
				) : (
					<div className='row g-6'>
						{/* Left Column: Edit Active Slide */}
						<div className='col-lg-7 col-xl-7'>
							{/* Card: Desktop Image */}
							<div className='card card-flush shadow-sm mb-6'>
								<div className='card-header pt-6'>
									<div className='card-title d-flex align-items-center gap-3'>
										<div className='symbol symbol-40px symbol-light-primary'>
											<span className='symbol-label bg-light-primary text-primary fs-5'>
												<FontAwesomeIcon icon={faDesktop} />
											</span>
										</div>
										<div>
											<h3 className='fw-bolder fs-4 mb-0'>
												Slide #{activeSlideIndex + 1}: Desktop Banner Image
											</h3>
											<span className='text-muted fs-7'>
												Shown on desktop screens &ge; 1024px (Recommended: 1920 &times; 800px, WebP or JPG)
											</span>
										</div>
									</div>
								</div>

								<div className='card-body pt-4'>
									<div className='mb-4'>
										<label className='form-label fw-semibold fs-7 text-gray-700'>
											Upload New Desktop Image File
										</label>
										<div className='input-group'>
											<input
												type='file'
												accept='image/webp,image/png,image/jpeg,image/jpg'
												onChange={handleDesktopFileChange}
												className='form-control'
												id='desktopFileInput'
											/>
											<label className='input-group-text bg-light' htmlFor='desktopFileInput'>
												<FontAwesomeIcon icon={faUpload} className='me-2' /> Browse
											</label>
										</div>
										{desktopFile && (
											<div className='text-success fs-8 mt-1'>
												Selected: {desktopFile.name} ({(desktopFile.size / 1024).toFixed(1)} KB)
											</div>
										)}
									</div>

									<div className='mb-0'>
										<label className='form-label fw-semibold fs-7 text-gray-700'>
											Or S3 Key / Full Image URL
										</label>
										<div className='input-group'>
											<span className='input-group-text bg-light text-gray-600'>
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
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Card: Mobile Image */}
							<div className='card card-flush shadow-sm mb-6'>
								<div className='card-header pt-6'>
									<div className='card-title d-flex align-items-center gap-3'>
										<div className='symbol symbol-40px symbol-light-info'>
											<span className='symbol-label bg-light-info text-info fs-5'>
												<FontAwesomeIcon icon={faMobileScreen} />
											</span>
										</div>
										<div>
											<h3 className='fw-bolder fs-4 mb-0'>
												Slide #{activeSlideIndex + 1}: Mobile Banner Image
											</h3>
											<span className='text-muted fs-7'>
												Shown on mobile screens &lt; 1024px (Recommended: 800 &times; 1100px, WebP or JPG)
											</span>
										</div>
									</div>
								</div>

								<div className='card-body pt-4'>
									<div className='mb-4'>
										<label className='form-label fw-semibold fs-7 text-gray-700'>
											Upload New Mobile Image File
										</label>
										<div className='input-group'>
											<input
												type='file'
												accept='image/webp,image/png,image/jpeg,image/jpg'
												onChange={handleMobileFileChange}
												className='form-control'
												id='mobileFileInput'
											/>
											<label className='input-group-text bg-light' htmlFor='mobileFileInput'>
												<FontAwesomeIcon icon={faUpload} className='me-2' /> Browse
											</label>
										</div>
										{mobileFile && (
											<div className='text-success fs-8 mt-1'>
												Selected: {mobileFile.name} ({(mobileFile.size / 1024).toFixed(1)} KB)
											</div>
										)}
									</div>

									<div className='mb-0'>
										<label className='form-label fw-semibold fs-7 text-gray-700'>
											Or Mobile S3 Key / Image URL
										</label>
										<div className='input-group'>
											<span className='input-group-text bg-light text-gray-600'>
												<FontAwesomeIcon icon={faLink} />
											</span>
											<input
												type='text'
												value={currentSlide.mobile_image || ''}
												onChange={(e) => {
													handleFieldChange('mobile_image', e.target.value)
													if (!mobileFile) setMobilePreview(getPreviewUrl(e.target.value))
												}}
												placeholder='/images/banner-(gls)-mobile-view.webp'
												className='form-control'
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Card: Slide Configuration */}
							<div className='card card-flush shadow-sm mb-6'>
								<div className='card-header pt-6'>
									<h3 className='card-title fw-bolder fs-4 mb-0'>Slide Link & Status Settings</h3>
								</div>

								<div className='card-body pt-4'>
									<div className='row g-4'>
										<div className='col-md-6'>
											<label className='form-label fw-semibold fs-7 text-gray-700'>
												Shop Button Destination
											</label>
											<input
												type='text'
												value={currentSlide.shop_link || ''}
												onChange={(e) => handleFieldChange('shop_link', e.target.value)}
												placeholder='/gomzi-supplement'
												className='form-control'
											/>
										</div>

										<div className='col-md-6'>
											<label className='form-label fw-semibold fs-7 text-gray-700'>
												Brochure Download Path
											</label>
											<div className='input-group'>
												<span className='input-group-text bg-light text-gray-600'>
													<FontAwesomeIcon icon={faFilePdf} />
												</span>
												<input
													type='text'
													value={currentSlide.brochure_url || ''}
													onChange={(e) => handleFieldChange('brochure_url', e.target.value)}
													placeholder='/pdf/gomzi-brochure.pdf'
													className='form-control'
												/>
											</div>
										</div>

										<div className='col-md-12'>
											<label className='form-label fw-semibold fs-7 text-gray-700'>
												Alt Text (Accessibility)
											</label>
											<input
												type='text'
												value={currentSlide.alt_text || ''}
												onChange={(e) => handleFieldChange('alt_text', e.target.value)}
												placeholder='Science-backed sports nutrition products by Gomzi Supplement.'
												className='form-control'
											/>
										</div>

										<div className='col-md-12'>
											<div className='form-check form-switch form-check-custom form-check-solid mt-2'>
												<input
													className='form-check-input'
													type='checkbox'
													id='statusSwitch'
													checked={currentSlide.status !== false}
													onChange={(e) => handleFieldChange('status', e.target.checked)}
												/>
												<label className='form-check-label fw-bold text-gray-800 fs-7' htmlFor='statusSwitch'>
													Slide Active Status (Include in live swipe carousel)
												</label>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column: Live Multi-Slide Swiper Simulator */}
						<div className='col-lg-5 col-xl-5'>
							<div className='card card-flush shadow-sm sticky-top' style={{ top: '90px' }}>
								<div className='card-header pt-6 border-0'>
									<div className='card-title d-flex align-items-center gap-2'>
										<FontAwesomeIcon icon={faEye} className='text-primary' />
										<h3 className='fw-bolder fs-4 mb-0'>Live Swiper Preview</h3>
									</div>

									<div className='card-toolbar d-flex align-items-center gap-2'>
										{/* Slide switcher arrows */}
										<div className='btn-group btn-group-sm me-2'>
											<button
												type='button'
												onClick={() =>
													handleSelectSlide((activeSlideIndex - 1 + slides.length) % slides.length)
												}
												className='btn btn-light-secondary'
												title='Previous Slide'>
												<FontAwesomeIcon icon={faChevronLeft} />
											</button>
											<span className='btn btn-light-secondary text-gray-800 fw-bold fs-8 px-2'>
												{activeSlideIndex + 1} / {slides.length}
											</span>
											<button
												type='button'
												onClick={() => handleSelectSlide((activeSlideIndex + 1) % slides.length)}
												className='btn btn-light-secondary'
												title='Next Slide'>
												<FontAwesomeIcon icon={faChevronRight} />
											</button>
										</div>

										<ul className='nav nav-pills nav-pills-sm bg-light p-1 rounded'>
											<li className='nav-item'>
												<button
													type='button'
													onClick={() => setPreviewTab('desktop')}
													className={`nav-link py-1 px-3 fs-7 fw-bold border-0 ${
														previewTab === 'desktop' ? 'active bg-primary text-white' : 'text-gray-700'
													}`}>
													<FontAwesomeIcon icon={faDesktop} className='me-1' /> Desktop
												</button>
											</li>
											<li className='nav-item'>
												<button
													type='button'
													onClick={() => setPreviewTab('mobile')}
													className={`nav-link py-1 px-3 fs-7 fw-bold border-0 ${
														previewTab === 'mobile' ? 'active bg-primary text-white' : 'text-gray-700'
													}`}>
													<FontAwesomeIcon icon={faMobileScreen} className='me-1' /> Mobile
												</button>
											</li>
										</ul>
									</div>
								</div>

								<div className='card-body pt-2'>
									<div className='text-muted fs-8 mb-3'>
										Showing Slide #{activeSlideIndex + 1} with fixed static branding overlay:
									</div>

									{/* Simulated Stage */}
									<div
										className='border rounded-3 overflow-hidden shadow-sm position-relative mx-auto bg-dark'
										style={{
											maxWidth: previewTab === 'mobile' ? '300px' : '100%',
											transition: 'max-width 0.3s ease',
										}}>
										<div className='position-relative w-100'>
											<img
												src={
													previewTab === 'desktop'
														? desktopPreview || getPreviewUrl(currentSlide.desktop_image)
														: mobilePreview ||
														  getPreviewUrl(currentSlide.mobile_image || '') ||
														  desktopPreview ||
														  getPreviewUrl(currentSlide.desktop_image)
												}
												alt='Hero Slide Preview'
												className='w-100 h-auto d-block object-fit-cover'
												onError={(e: any) => {
													e.target.src = '/images/banner-(gls)-web-view.webp'
												}}
											/>

											{/* Static Typography & Badges Overlay */}
											<div
												className='position-absolute'
												style={{
													top: previewTab === 'mobile' ? '4%' : '8%',
													left: previewTab === 'mobile' ? '50%' : '5%',
													transform: previewTab === 'mobile' ? 'translateX(-50%)' : 'none',
													width: previewTab === 'mobile' ? '92%' : '55%',
													textAlign: previewTab === 'mobile' ? 'center' : 'left',
													zIndex: 10,
													pointerEvents: 'none',
												}}>
												{/* 3-Line Heading */}
												<div style={{ lineHeight: '0.94', fontWeight: 900, textTransform: 'uppercase' }}>
													<div style={{ color: '#964816', fontSize: previewTab === 'mobile' ? '12px' : '17px' }}>
														SCIENCE-BACKED
													</div>
													<div
														style={{
															color: '#23150E',
															fontSize: previewTab === 'mobile' ? '12px' : '17px',
															marginTop: '2px',
														}}>
														NUTRITION FOR EVERYDAY
													</div>
													<div
														style={{
															color: '#23150E',
															fontSize: previewTab === 'mobile' ? '12px' : '17px',
															marginTop: '2px',
														}}>
														PERFORMANCE
													</div>
												</div>

												{/* Subtitle */}
												<div
													style={{
														color: '#5A2F20',
														fontWeight: 700,
														fontSize: previewTab === 'mobile' ? '8px' : '10px',
														marginTop: previewTab === 'mobile' ? '3px' : '5px',
													}}>
													Premium Protein | Wellness | No Amino Spiking 100%
												</div>

												{/* Buttons */}
												<div
													style={{
														display: 'flex',
														gap: '6px',
														justifyContent: previewTab === 'mobile' ? 'center' : 'flex-start',
														marginTop: previewTab === 'mobile' ? '8px' : '10px',
													}}>
													<span
														className='badge'
														style={{
															background: 'linear-gradient(135deg, #5C3124 0%, #48261c 100%)',
															color: '#fff',
															padding: previewTab === 'mobile' ? '4px 7px' : '5px 10px',
															fontSize: previewTab === 'mobile' ? '8px' : '9.5px',
															borderRadius: '6px',
															border: '1px solid rgba(251, 191, 36, 0.4)',
															boxShadow: '0 3px 6px rgba(0,0,0,0.25)',
														}}>
														Shop Now &rarr;
													</span>

													<span
														className='badge'
														style={{
															background: 'rgba(255, 255, 255, 0.95)',
															color: '#3d1e15',
															padding: previewTab === 'mobile' ? '4px 7px' : '5px 10px',
															fontSize: previewTab === 'mobile' ? '8px' : '9.5px',
															borderRadius: '6px',
															border: '1px solid rgba(92, 49, 36, 0.3)',
															boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
														}}>
														Download Brochure
													</span>
												</div>

												{/* Badges */}
												<div
													style={{
														display: 'flex',
														flexWrap: 'wrap',
														gap: '3px',
														justifyContent: previewTab === 'mobile' ? 'center' : 'flex-start',
														marginTop: previewTab === 'mobile' ? '6px' : '8px',
													}}>
													{['FSSAI', 'ISO', 'GMP', 'KOSHER', 'HACCP', 'HALAL', 'FDA'].map((badge) => (
														<span
															key={badge}
															className='badge'
															style={{
																fontSize: '6.5px',
																padding: '2px 4px',
																background: 'rgba(255,255,255,0.95)',
																color: '#1B5E20',
																border: '1px solid rgba(27,94,32,0.4)',
																fontWeight: 800,
																borderRadius: '4px',
															}}>
															{badge}
														</span>
													))}
												</div>
											</div>
										</div>
									</div>

									{/* Status Info */}
									<div className='mt-4 p-3 bg-light rounded text-gray-700 fs-8'>
										<div className='d-flex justify-content-between mb-1'>
											<span className='fw-bold'>Total Slides:</span>
											<span className='badge badge-light-primary'>{slides.length} Slides</span>
										</div>
										<div className='d-flex justify-content-between mb-1'>
											<span className='fw-bold'>Active Slide:</span>
											<span>Slide #{activeSlideIndex + 1}</span>
										</div>
										<div className='d-flex justify-content-between text-truncate'>
											<span className='fw-bold me-2'>Shop Route:</span>
											<span className='text-primary text-truncate'>{currentSlide.shop_link || '/gomzi-supplement'}</span>
										</div>
									</div>

									<div className='mt-4 d-grid'>
										<button
											type='button'
											onClick={() => handleSaveCurrentSlide()}
											disabled={saving}
											className='btn btn-primary fw-bolder py-3'>
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
		</>
	)
}