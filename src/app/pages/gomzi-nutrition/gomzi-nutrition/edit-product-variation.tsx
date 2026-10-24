/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPenToSquare,
	faCloudArrowUp,
	faArrowLeft,
	faCircleNotch,
	faCopy,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import SelectField from '../../../components/SelectField'
import { FileUploadToFGGroup, GetProduct, UpdateProductVariation } from '../../../Functions/FGGroup'
import '../products-theme.css'

const EditGomziNutritionVariationProduct: React.FC = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const product_id: string = searchParams.get('product_id') || ''
	const variation_id: string = searchParams.get('variation_id') || ''
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [isLoading, setIsLoading] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [activeSection, setActiveSection] = useState<string>('basic')
	const [parentProduct, setParentProduct] = useState<any>(null)

	const [formData, setFormData] = useState({
		name: '',
		sku: '',
		price: '',
		flavour: '',
		discountPrice: '',
		stock: '',
		servings: '',
		weight: {
			amount: '',
			unit: 'g',
		},
		isAvailable: true,
		displayImages: [] as string[],
		selectedFiles: [] as File[],
	})

	useEffect(() => {
		const fetchProductData = async () => {
			setIsLoading(true)
			try {
				const response: any = await GetProduct({ id: product_id })
				const parent = response?.data?.[0] || {}
				setParentProduct(parent)

				let data = parent?.variations || []
				const variant = data.find((product: any) => product._id == variation_id)

				if (variant) {
					setFormData({
						name: variant.name || '',
						sku: variant.sku || '',
						price: variant.price || '',
						discountPrice: variant.discountPrice || '',
						stock: variant.stock || '',
						servings: variant.servings || '',
						flavour: variant.flavour || '',
						weight: {
							amount: variant.weight?.amount || '',
							unit: variant.weight?.unit || 'g',
						},
						isAvailable: variant.isAvailable ?? true,
						displayImages:
							variant.displayImages?.map((img: string) =>
								img.startsWith('http') ? img : `https://files.fggroup.in/${img}`
							) || [],
						selectedFiles: [],
					})
				}
			} catch (error: any) {
				toast.error(error?.message || 'Failed to load variation data')
				console.error(error)
			} finally {
				setIsLoading(false)
			}
		}

		if (product_id && variation_id) {
			fetchProductData()
		} else {
			setIsLoading(false)
		}
	}, [product_id, variation_id])

	// Scroll tracking for sticky nav
	useEffect(() => {
		const sections = ['basic', 'pricing', 'weight', 'images']
		const handleScroll = () => {
			const scrollPos = window.scrollY + 160
			for (const sec of sections) {
				const el = document.getElementById(`section-${sec}`)
				if (el) {
					const top = el.offsetTop
					const height = el.offsetHeight
					if (scrollPos >= top && scrollPos < top + height) {
						setActiveSection(sec)
						break
					}
				}
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const scrollToSection = (id: string) => {
		setActiveSection(id)
		const el = document.getElementById(`section-${id}`)
		if (el) {
			const yOffset = -120
			const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
			window.scrollTo({ top: y, behavior: 'smooth' })
		}
	}

	const handleCopy = (text: string, label: string) => {
		if (!text) return
		navigator.clipboard
			.writeText(text)
			.then(() => toast.success(`${label} copied to clipboard!`))
			.catch(() => toast.error('Failed to copy!'))
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFormData((prevData) => ({
				...prevData,
				selectedFiles: [...prevData.selectedFiles, file],
				displayImages: [...prevData.displayImages, URL.createObjectURL(file)],
			}))
		} else {
			setFormData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return

		const files = Array.from(e.target.files)
		setFormData((prev) => ({
			...prev,
			selectedFiles: [...prev.selectedFiles, ...files],
			displayImages: [...prev.displayImages, ...files.map((file) => URL.createObjectURL(file))],
		}))
	}

	const removeImage = (index: number) => {
		setFormData((prev) => ({
			...prev,
			selectedFiles: prev.selectedFiles.filter((_, i) => i !== index),
			displayImages: prev.displayImages.filter((_, i) => i !== index),
		}))
	}

	const updateWeight = (field: 'amount' | 'unit', value: string) => {
		setFormData((prev) => ({
			...prev,
			weight: {
				...prev.weight,
				[field]: value,
			},
		}))
	}

	const handleUpdateButtonClick = async () => {
		try {
			if (!formData.name.trim()) {
				toast.error('Product variation name is required')
				return
			}

			if (!formData.price || Number(formData.price) <= 0) {
				toast.error('Valid price is required')
				return
			}

			setIsSubmitting(true)

			const existingImages = formData.displayImages
				.filter((img) => !img.startsWith('blob:'))
				.map((img) => img.replace('https://files.fggroup.in/', ''))

			let imageUrls = [...existingImages]

			if (formData.selectedFiles.length > 0) {
				const uploadedImages = await Promise.all(
					formData.selectedFiles.map(async (file) => {
						const response: any = await FileUploadToFGGroup([file], {
							directory: 'products',
						})
						return response.data?.fileURLs?.[0]
					})
				)
				imageUrls = [...existingImages, ...uploadedImages.filter(Boolean)]
			}

			const payload = {
				product_id,
				variant_id: variation_id,
				name: formData.name,
				sku: formData.sku,
				flavour: formData.flavour,
				price: Number(formData.price),
				discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
				weight: {
					amount: Number(formData.weight.amount || 0),
					unit: formData.weight.unit,
				},
				servings: formData.servings ? Number(formData.servings) : undefined,
				displayImages: imageUrls,
				stock: Number(formData.stock || 0),
				isAvailable: formData.isAvailable,
			}

			await UpdateProductVariation(payload)
			toast.success('Product Updated Successfully')
			navigate(`/rag/product-list/variation-list?product_id=${product_id}`)
		} catch (error: any) {
			toast.error(error?.message || 'Failed to update variation')
			console.error(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const backUrl = `/rag/product-list/variation-list?product_id=${product_id}`

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Edit Product Variation</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/product-list'>Products &amp; Orders</Link>
				<span className='sep'>&gt;</span>
				<Link to={backUrl}>
					{parentProduct?.name ? `${parentProduct.name} Variations` : 'Variations'}
				</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Edit Variation</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Edit Product Variation</h1>
					<p className='gz-prod-subtitle'>
						{formData.name
							? `Updating details and inventory for ${formData.name}`
							: 'Modify pricing, flavor, inventory, and packaging details'}
					</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<button
						type='button'
						className='gz-prod-btn-cancel'
						onClick={() => navigate(backUrl)}>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Cancel</span>
					</button>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={handleUpdateButtonClick}
						disabled={isSubmitting || isLoading}>
						{isSubmitting ? (
							<>
								<FontAwesomeIcon icon={faCircleNotch} spin />
								<span>Updating...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faPenToSquare} />
								<span>Update Variation</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* =========================================================================
			    SPLIT LAYOUT: STICKY NAV + FORM SECTIONS
			    ========================================================================= */}
			<div className='gz-prod-split-layout'>
				{/* Left: Sticky Section Navigator */}
				<div className='gz-prod-sticky-nav'>
					{[
						{ id: 'basic', num: 1, label: 'Basic Details' },
						{ id: 'pricing', num: 2, label: 'Pricing & Stock' },
						{ id: 'weight', num: 3, label: 'Weight & Pack' },
						{ id: 'images', num: 4, label: 'Variant Images' },
					].map((item) => (
						<button
							key={item.id}
							type='button'
							className={`gz-prod-nav-item ${activeSection === item.id ? 'active' : ''}`}
							onClick={() => scrollToSection(item.id)}>
							<span className='gz-prod-nav-num'>{item.num}</span>
							<span>{item.label}</span>
						</button>
					))}
				</div>

				{/* Right: Form Sections */}
				<div className='gz-prod-form-content'>
					{/* SECTION 1: Basic Details */}
					<div className='gz-prod-form-section' id='section-basic'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>1. Basic Details</h3>
								<div className='gz-prod-form-section-sub'>
									Identifiers, variant name, flavour, and SKU code
								</div>
							</div>
						</div>

						{/* System Identifiers */}
						<div className='row mb-2'>
							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>
										<span>Product ID (Parent)</span>
									</label>
									<div className='d-flex align-items-center gap-2'>
										<input
											type='text'
											className='gz-prod-input'
											value={product_id}
											disabled
											style={{ background: '#F8FAFD', color: '#64748B' }}
										/>
										<button
											type='button'
											className='gz-prod-page-btn'
											onClick={() => handleCopy(product_id, 'Product ID')}
											title='Copy Product ID'>
											<FontAwesomeIcon icon={faCopy} />
										</button>
									</div>
								</div>
							</div>

							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>
										<span>Variant ID</span>
									</label>
									<div className='d-flex align-items-center gap-2'>
										<input
											type='text'
											className='gz-prod-input'
											value={variation_id}
											disabled
											style={{ background: '#F8FAFD', color: '#64748B' }}
										/>
										<button
											type='button'
											className='gz-prod-page-btn'
											onClick={() => handleCopy(variation_id, 'Variant ID')}
											title='Copy Variant ID'>
											<FontAwesomeIcon icon={faCopy} />
										</button>
									</div>
								</div>
							</div>
						</div>

						<div className='row'>
							<div className='col-md-12'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='name'>
										<span>Variant Name</span>
										<span className='req'>*</span>
									</label>
									<input
										id='name'
										type='text'
										name='name'
										className='gz-prod-input'
										placeholder='e.g. Chocolate Fudge Whey Protein - 1kg'
										value={formData.name}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='flavour'>
										<span>Flavour</span>
									</label>
									<input
										id='flavour'
										type='text'
										name='flavour'
										className='gz-prod-input'
										placeholder='e.g. Chocolate, Vanilla, Unflavoured'
										value={formData.flavour}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='sku'>
										<span>SKU</span>
									</label>
									<input
										id='sku'
										type='text'
										name='sku'
										className='gz-prod-input'
										placeholder='e.g. GOMZI-WP-CHOC-1KG'
										value={formData.sku}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-md-12'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='servings'>
										<span>Servings</span>
									</label>
									<input
										id='servings'
										type='text'
										name='servings'
										className='gz-prod-input'
										placeholder='e.g. 30 Servings'
										value={formData.servings}
										onChange={handleInputChange}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* SECTION 2: Pricing & Stock */}
					<div className='gz-prod-form-section' id='section-pricing'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>2. Pricing &amp; Stock</h3>
								<div className='gz-prod-form-section-sub'>
									Price, discounted selling price, inventory count and availability
								</div>
							</div>
						</div>

						<div className='row'>
							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='price'>
										<span>Regular Price (₹)</span>
										<span className='req'>*</span>
									</label>
									<input
										id='price'
										type='number'
										name='price'
										className='gz-prod-input'
										placeholder='e.g. 2499'
										value={formData.price}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='discountPrice'>
										<span>Discount Price (₹)</span>
									</label>
									<input
										id='discountPrice'
										type='number'
										name='discountPrice'
										className='gz-prod-input'
										placeholder='e.g. 1999'
										value={formData.discountPrice}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='stock'>
										<span>Stock Quantity</span>
									</label>
									<input
										id='stock'
										type='number'
										name='stock'
										className='gz-prod-input'
										placeholder='e.g. 100'
										value={formData.stock}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>
										<span>Availability Status</span>
									</label>
									<div className='d-flex align-items-center gap-4 mt-2'>
										<label
											className='d-flex align-items-center gap-2'
											style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 500 }}>
											<input
												type='radio'
												name='isAvailable'
												id='edit-avail-yes'
												checked={formData.isAvailable === true}
												onChange={() =>
													setFormData((prev: any) => ({ ...prev, isAvailable: true }))
												}
											/>
											<span>Active / Available</span>
										</label>
										<label
											className='d-flex align-items-center gap-2'
											style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 500 }}>
											<input
												type='radio'
												name='isAvailable'
												id='edit-avail-no'
												checked={formData.isAvailable === false}
												onChange={() =>
													setFormData((prev: any) => ({ ...prev, isAvailable: false }))
												}
											/>
											<span>Inactive / Unavailable</span>
										</label>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* SECTION 3: Weight & Packaging */}
					<div className='gz-prod-form-section' id='section-weight'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>3. Weight &amp; Packaging</h3>
								<div className='gz-prod-form-section-sub'>
									Unit weight and measure for shipping and labels
								</div>
							</div>
						</div>

						<div className='row'>
							<div className='col-md-8'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='weightAmount'>
										<span>Weight Amount</span>
									</label>
									<input
										id='weightAmount'
										type='number'
										name='weight'
										className='gz-prod-input'
										placeholder='e.g. 1000'
										value={formData.weight.amount}
										onChange={(e) => updateWeight('amount', e.target.value)}
									/>
								</div>
							</div>

							<div className='col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label' htmlFor='weightUnit'>
										<span>Unit</span>
									</label>
									<SelectField
										id='weightUnit'
										value={formData.weight.unit}
										onChange={(e: any) => updateWeight('unit', e.target.value)}
										options={[
											{ label: 'g (Grams)', value: 'g' },
											{ label: 'kg (Kilograms)', value: 'kg' },
											{ label: 'mg (Milligrams)', value: 'mg' },
											{ label: 'lb (Pounds)', value: 'lb' },
											{ label: 'oz (Ounces)', value: 'oz' },
										]}
										showLabel={false}
										marginRemove={true}
										hideDefaultOption={true}
										searchable={false}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* SECTION 4: Variant Images */}
					<div className='gz-prod-form-section' id='section-images'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>4. Variant Images</h3>
								<div className='gz-prod-form-section-sub'>
									Product photos specific to this variation / flavor
								</div>
							</div>
						</div>

						<div
							className='gz-prod-upload-zone'
							onClick={() => fileInputRef.current?.click()}>
							<input
								ref={fileInputRef}
								type='file'
								multiple
								accept='image/*'
								className='d-none'
								onChange={handleImageChange}
							/>
							<div className='gz-prod-upload-icon'>
								<FontAwesomeIcon icon={faCloudArrowUp} />
							</div>
							<div className='gz-prod-upload-text'>
								Click to upload or drag &amp; drop new variant images
							</div>
							<div className='gz-prod-upload-hint'>
								PNG, JPG, WEBP recommended up to 5MB each
							</div>
						</div>

						{formData.displayImages.length > 0 && (
							<div className='gz-prod-image-previews'>
								{formData.displayImages.map((image, index) => (
									<div className='gz-prod-image-card' key={index}>
										<img src={image} alt={`Variant preview ${index + 1}`} />
										<button
											type='button'
											className='gz-prod-image-remove'
											onClick={(e) => {
												e.stopPropagation()
												removeImage(index)
											}}
											title='Remove image'>
											×
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Bottom Actions */}
					<div className='d-flex justify-content-end align-items-center gap-3 pt-3'>
						<button
							type='button'
							className='gz-prod-btn-cancel'
							onClick={() => navigate(backUrl)}>
							Cancel
						</button>
						<button
							type='button'
							className='gz-prod-btn-primary'
							onClick={handleUpdateButtonClick}
							disabled={isSubmitting || isLoading}>
							{isSubmitting ? (
								<>
									<FontAwesomeIcon icon={faCircleNotch} spin />
									<span>Updating...</span>
								</>
							) : (
								<>
									<FontAwesomeIcon icon={faPenToSquare} />
									<span>Update Product Variation</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export { EditGomziNutritionVariationProduct }
export default EditGomziNutritionVariationProduct
