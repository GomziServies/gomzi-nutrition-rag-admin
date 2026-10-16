/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faPlus,
	faTrash,
	faCloudArrowUp,
	faCheck,
	faArrowLeft,
	faCircleNotch,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import { AddProduct, FileUploadToFGGroup } from '../../../Functions/FGGroup'
import '../products-theme.css'

export const AddGomziNutritionProduct: React.FC = () => {
	const navigate = useNavigate()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [activeSection, setActiveSection] = useState<string>('basic')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

	const [formData, setFormData] = useState({
		name: '',
		shortDescription: '',
		description: '',
		price: '',
		discountPrice: '',
		stock: '',
		private_note: '',
		flavour: '',
		storageInstructions: '',
		additionalInstructions: '',
		weight: {
			amount: '',
			unit: 'g',
		},
		categories: '',
		tags: '',
		nutrition: {
			servingSize: '',
			energy: '',
			protein: '',
			carbohydrates: '',
			fat: '',
			fiber: '',
			vitaminC: '',
			iron: '',
			resveratrol: '',
			unit: 'g',
		},
		displayImages: [] as string[],
		selectedFiles: [] as File[],
		highlights: [
			{ title: '', value: '' },
		],
		benefits: [
			{ title: '' },
		],
		ingredients: [''],
		usageInstructions: [
			{ stepNumber: '1', description: '' },
		],
		variations: [],
	})

	// Section intersection observer to update active nav item on scroll
	useEffect(() => {
		const sections = ['basic', 'images', 'highlights', 'usage', 'benefits', 'ingredients', 'nutrition']
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
			const yOffset = -100
			const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
			window.scrollTo({ top: y, behavior: 'smooth' })
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}))
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

	const updateNutrition = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			nutrition: {
				...prev.nutrition,
				[field]: value,
			},
		}))
	}

	// Highlights
	const addHighlight = () => {
		setFormData((prev) => ({
			...prev,
			highlights: [...prev.highlights, { title: '', value: '' }],
		}))
	}

	const removeHighlight = (idx: number) => {
		setFormData((prev) => ({
			...prev,
			highlights: prev.highlights.filter((_, i) => i !== idx),
		}))
	}

	const updateHighlight = (idx: number, field: 'title' | 'value', val: string) => {
		setFormData((prev) => {
			const arr = [...prev.highlights]
			arr[idx] = { ...arr[idx], [field]: val }
			return { ...prev, highlights: arr }
		})
	}

	// Usage Instructions
	const addStep = () => {
		setFormData((prev) => ({
			...prev,
			usageInstructions: [
				...prev.usageInstructions,
				{ stepNumber: String(prev.usageInstructions.length + 1), description: '' },
			],
		}))
	}

	const removeStep = (idx: number) => {
		setFormData((prev) => ({
			...prev,
			usageInstructions: prev.usageInstructions
				.filter((_, i) => i !== idx)
				.map((step, i) => ({ ...step, stepNumber: String(i + 1) })),
		}))
	}

	const updateStep = (idx: number, description: string) => {
		setFormData((prev) => {
			const arr = [...prev.usageInstructions]
			arr[idx] = { ...arr[idx], description }
			return { ...prev, usageInstructions: arr }
		})
	}

	// Benefits
	const addBenefit = () => {
		setFormData((prev) => ({
			...prev,
			benefits: [...prev.benefits, { title: '' }],
		}))
	}

	const removeBenefit = (idx: number) => {
		setFormData((prev) => ({
			...prev,
			benefits: prev.benefits.filter((_, i) => i !== idx),
		}))
	}

	const updateBenefit = (idx: number, title: string) => {
		setFormData((prev) => {
			const arr = [...prev.benefits]
			arr[idx] = { ...arr[idx], title }
			return { ...prev, benefits: arr }
		})
	}

	// Ingredients
	const addIngredient = () => {
		setFormData((prev) => ({
			...prev,
			ingredients: [...prev.ingredients, ''],
		}))
	}

	const removeIngredient = (idx: number) => {
		setFormData((prev) => ({
			...prev,
			ingredients: prev.ingredients.filter((_, i) => i !== idx),
		}))
	}

	const updateIngredient = (idx: number, val: string) => {
		setFormData((prev) => {
			const arr = [...prev.ingredients]
			arr[idx] = val
			return { ...prev, ingredients: arr }
		})
	}

	const handleSaveProduct = async () => {
		try {
			setIsSubmitting(true)

			if (!formData.name.trim()) {
				toast.error('Product name is required')
				setIsSubmitting(false)
				return
			}

			if (!formData.price || Number(formData.price) <= 0) {
				toast.error('Valid price is required')
				setIsSubmitting(false)
				return
			}

			let imageUrls: string[] = []
			if (formData.selectedFiles.length > 0) {
				const uploadedImages = await Promise.all(
					formData.selectedFiles.map(async (file) => {
						const response: any = await FileUploadToFGGroup([file], {
							directory: 'products',
						})
						return response.data?.fileURLs?.[0]
					})
				)
				imageUrls = uploadedImages.filter(Boolean)
			}

			const payload = {
				name: formData.name.trim(),
				price: Number(formData.price),
				discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
				stock: formData.stock ? Number(formData.stock) : 0,
				shortDescription: formData.shortDescription,
				description: formData.description,
				private_note: formData.private_note,
				flavour: formData.flavour,
				displayImages: imageUrls,
				weight:
					formData.weight.amount !== ''
						? {
								amount: Number(formData.weight.amount),
								unit: formData.weight.unit,
						  }
						: undefined,
				categories: formData.categories
					.split(',')
					.map((x) => x.trim())
					.filter(Boolean),
				tags: formData.tags
					.split(',')
					.map((x) => x.trim())
					.filter(Boolean),
				highlights: formData.highlights.filter((item) => item.title.trim()),
				benefits: formData.benefits.filter((item) => item.title.trim()),
				ingredients: formData.ingredients.filter((item) => item.trim()),
				nutrition: {
					servingSize: formData.nutrition.servingSize,
					energy: Number(formData.nutrition.energy || 0),
					protein: Number(formData.nutrition.protein || 0),
					carbohydrates: Number(formData.nutrition.carbohydrates || 0),
					fat: Number(formData.nutrition.fat || 0),
					fiber: Number(formData.nutrition.fiber || 0),
					vitaminC: Number(formData.nutrition.vitaminC || 0),
					iron: Number(formData.nutrition.iron || 0),
					resveratrol: Number(formData.nutrition.resveratrol || 0),
					unit: formData.nutrition.unit,
				},
				usageInstructions: formData.usageInstructions.filter(
					(item) => String(item.stepNumber).trim() !== '' && item.description.trim() !== ''
				),
				storageInstructions: formData.storageInstructions,
				additionalInstructions: formData.additionalInstructions,
				variations: [],
			}

			await AddProduct(payload)
			toast.success('Product Added Successfully')
			navigate('/rag/product-list')
		} catch (error: any) {
			console.error('Error adding product:', error)
			toast.error(error?.message || 'Failed to add product')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className='gz-prod-container'>
			<PageTitle breadcrumbs={[]}>Add Product</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-prod-breadcrumb'>
				<Link to='/rag/product-list'>Products & Orders</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Add Product</span>
			</div>

			{/* =========================================================================
			    HEADER
			    ========================================================================= */}
			<div className='gz-prod-header'>
				<div>
					<h1 className='gz-prod-title'>Add Product</h1>
					<p className='gz-prod-subtitle'>Create a new product for your catalog</p>
				</div>
				<div className='d-flex align-items-center gap-3'>
					<button
						type='button'
						className='gz-prod-btn-cancel'
						onClick={() => navigate('/rag/product-list')}>
						Cancel
					</button>
					<button
						type='button'
						className='gz-prod-btn-primary'
						onClick={handleSaveProduct}
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<FontAwesomeIcon icon={faCircleNotch} spin />
								<span>Saving Product...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faPlus} />
								<span>Save Product</span>
							</>
						)}
					</button>
				</div>
			</div>

			{/* =========================================================================
			    TWO COLUMN SPLIT LAYOUT (STICKY NAV + FORM SECTIONS)
			    ========================================================================= */}
			<div className='gz-prod-split-layout'>
				{/* Left: Sticky Navigation */}
				<div className='gz-prod-sticky-nav'>
					{[
						{ id: 'basic', num: 1, label: 'Basic Information' },
						{ id: 'images', num: 2, label: 'Images' },
						{ id: 'highlights', num: 3, label: 'Highlights' },
						{ id: 'usage', num: 4, label: 'How to make it' },
						{ id: 'benefits', num: 5, label: 'Benefits' },
						{ id: 'ingredients', num: 6, label: 'Ingredients' },
						{ id: 'nutrition', num: 7, label: 'Nutrition Facts' },
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
					{/* Section 1: Basic Information */}
					<div className='gz-prod-form-section' id='section-basic'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>Basic Information</h3>
								<div className='gz-prod-form-section-sub'>General product attributes, SKU, pricing and catalog classification</div>
							</div>
						</div>

						<div className='row g-4'>
							<div className='col-12 col-md-8'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>
										Product Name <span className='req'>*</span>
									</label>
									<input
										type='text'
										name='name'
										className='gz-prod-input'
										placeholder='Enter product name'
										value={formData.name}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Flavour</label>
									<input
										type='text'
										name='flavour'
										className='gz-prod-input'
										placeholder='e.g., Chocolate, Unflavoured'
										value={formData.flavour}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>
										Price (₹) <span className='req'>*</span>
									</label>
									<input
										type='number'
										name='price'
										className='gz-prod-input'
										placeholder='0.00'
										value={formData.price}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Discount Price (₹)</label>
									<input
										type='number'
										name='discountPrice'
										className='gz-prod-input'
										placeholder='0.00'
										value={formData.discountPrice}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Initial Stock</label>
									<input
										type='number'
										name='stock'
										className='gz-prod-input'
										placeholder='0'
										value={formData.stock}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Weight</label>
									<div className='d-flex gap-2'>
										<input
											type='number'
											className='gz-prod-input flex-grow-1'
											placeholder='e.g., 500, 1'
											value={formData.weight.amount}
											onChange={(e) => updateWeight('amount', e.target.value)}
										/>
										<select
											className='gz-prod-select'
											style={{ width: '90px' }}
											value={formData.weight.unit}
											onChange={(e) => updateWeight('unit', e.target.value)}>
											<option value='g'>g</option>
											<option value='kg'>kg</option>
											<option value='ml'>ml</option>
											<option value='l'>L</option>
										</select>
									</div>
								</div>
							</div>

							<div className='col-12 col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Categories</label>
									<input
										type='text'
										name='categories'
										className='gz-prod-input'
										placeholder='Proteins, Supplements, Gym (comma separated)'
										value={formData.categories}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Tags</label>
									<input
										type='text'
										name='tags'
										className='gz-prod-input'
										placeholder='whey, isolate, fitness (comma separated)'
										value={formData.tags}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12 col-md-6'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Private Admin Note</label>
									<input
										type='text'
										name='private_note'
										className='gz-prod-input'
										placeholder='Internal operational remarks'
										value={formData.private_note}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Short Description</label>
									<textarea
										name='shortDescription'
										className='gz-prod-textarea'
										rows={2}
										placeholder='Brief product overview displayed on catalog cards'
										value={formData.shortDescription}
										onChange={handleInputChange}
									/>
								</div>
							</div>

							<div className='col-12'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Full Product Description</label>
									<textarea
										name='description'
										className='gz-prod-textarea'
										rows={4}
										placeholder='Comprehensive details and product overview'
										value={formData.description}
										onChange={handleInputChange}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Section 2: Product Images */}
					<div className='gz-prod-form-section' id='section-images'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>Product Images</h3>
								<div className='gz-prod-form-section-sub'>Upload high resolution product imagery and packaging shots</div>
							</div>
						</div>

						<input
							type='file'
							ref={fileInputRef}
							className='d-none'
							multiple
							accept='image/*'
							onChange={handleImageChange}
						/>

						<div
							className='gz-prod-upload-zone'
							onClick={() => fileInputRef.current?.click()}>
							<div className='gz-prod-upload-icon'>
								<FontAwesomeIcon icon={faCloudArrowUp} />
							</div>
							<div className='gz-prod-upload-text'>
								Drag & drop images here or <span style={{ color: '#2563EB' }}>click to upload</span>
							</div>
							<div className='gz-prod-upload-hint'>
								Supports JPG, PNG, WebP (Max 5MB each)
							</div>
						</div>

						{formData.displayImages.length > 0 && (
							<div className='gz-prod-image-previews'>
								{formData.displayImages.map((imgUrl, idx) => (
									<div key={idx} className='gz-prod-image-card'>
										<img src={imgUrl} alt={`Product preview ${idx + 1}`} />
										<button
											type='button'
											className='gz-prod-image-remove'
											onClick={() => removeImage(idx)}
											title='Remove image'>
											✕
										</button>
									</div>
								))}

								<button
									type='button'
									className='gz-prod-image-card d-flex flex-column align-items-center justify-content-center text-muted border-dashed'
									style={{ background: '#F8FAFC', cursor: 'pointer', border: '2px dashed #CBD5E1' }}
									onClick={() => fileInputRef.current?.click()}>
									<FontAwesomeIcon icon={faPlus} className='mb-1 text-primary' />
									<span style={{ fontSize: '11px', fontWeight: 600 }}>Add more</span>
								</button>
							</div>
						)}
					</div>

					{/* Section 3: Highlights */}
					<div className='gz-prod-form-section' id='section-highlights'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>Product Highlights</h3>
								<div className='gz-prod-form-section-sub'>Key bullet points and specifications (e.g., 24g Protein per scoop)</div>
							</div>
							<button type='button' className='gz-prod-add-row-btn' onClick={addHighlight}>
								<FontAwesomeIcon icon={faPlus} />
								<span>Add Highlight</span>
							</button>
						</div>

						{formData.highlights.map((hl, idx) => (
							<div key={idx} className='gz-prod-repeatable-row'>
								<input
									type='text'
									className='gz-prod-input'
									placeholder='Title (e.g., Protein Content)'
									value={hl.title}
									onChange={(e) => updateHighlight(idx, 'title', e.target.value)}
									style={{ maxWidth: '35%' }}
								/>
								<input
									type='text'
									className='gz-prod-input flex-grow-1'
									placeholder='Value (e.g., 24g Pure Whey Isolate)'
									value={hl.value}
									onChange={(e) => updateHighlight(idx, 'value', e.target.value)}
								/>
								{formData.highlights.length > 1 && (
									<button
										type='button'
										className='gz-prod-row-delete-btn'
										onClick={() => removeHighlight(idx)}
										title='Remove highlight'>
										<FontAwesomeIcon icon={faTrash} />
									</button>
								)}
							</div>
						))}
					</div>

					{/* Section 4: How to Make It */}
					<div className='gz-prod-form-section' id='section-usage'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>How to make it</h3>
								<div className='gz-prod-form-section-sub'>Numbered steps for preparation and consumption instructions</div>
							</div>
							<button type='button' className='gz-prod-add-row-btn' onClick={addStep}>
								<FontAwesomeIcon icon={faPlus} />
								<span>Add Step</span>
							</button>
						</div>

						{formData.usageInstructions.map((step, idx) => (
							<div key={idx} className='gz-prod-repeatable-row'>
								<span className='gz-prod-repeatable-num'>{step.stepNumber}</span>
								<input
									type='text'
									className='gz-prod-input flex-grow-1'
									placeholder={`Step ${idx + 1} instructions (e.g., Add 1 scoop to 250ml cold water)`}
									value={step.description}
									onChange={(e) => updateStep(idx, e.target.value)}
								/>
								{formData.usageInstructions.length > 1 && (
									<button
										type='button'
										className='gz-prod-row-delete-btn'
										onClick={() => removeStep(idx)}
										title='Remove step'>
										<FontAwesomeIcon icon={faTrash} />
									</button>
								)}
							</div>
						))}
					</div>

					{/* Section 5: Benefits */}
					<div className='gz-prod-form-section' id='section-benefits'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>Product Benefits</h3>
								<div className='gz-prod-form-section-sub'>Core nutritional and health advantages for users</div>
							</div>
							<button type='button' className='gz-prod-add-row-btn' onClick={addBenefit}>
								<FontAwesomeIcon icon={faPlus} />
								<span>Add Benefit</span>
							</button>
						</div>

						{formData.benefits.map((benefit, idx) => (
							<div key={idx} className='gz-prod-repeatable-row'>
								<span className='gz-prod-repeatable-num'>{idx + 1}</span>
								<input
									type='text'
									className='gz-prod-input flex-grow-1'
									placeholder='Benefit statement (e.g., Accelerates muscle recovery post-workout)'
									value={benefit.title}
									onChange={(e) => updateBenefit(idx, e.target.value)}
								/>
								{formData.benefits.length > 1 && (
									<button
										type='button'
										className='gz-prod-row-delete-btn'
										onClick={() => removeBenefit(idx)}
										title='Remove benefit'>
										<FontAwesomeIcon icon={faTrash} />
									</button>
								)}
							</div>
						))}
					</div>

					{/* Section 6: Ingredients */}
					<div className='gz-prod-form-section' id='section-ingredients'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>Ingredients</h3>
								<div className='gz-prod-form-section-sub'>List of active ingredients and formulation components</div>
							</div>
							<button type='button' className='gz-prod-add-row-btn' onClick={addIngredient}>
								<FontAwesomeIcon icon={faPlus} />
								<span>Add Ingredient</span>
							</button>
						</div>

						{formData.ingredients.map((ing, idx) => (
							<div key={idx} className='gz-prod-repeatable-row'>
								<span className='gz-prod-repeatable-num'>{idx + 1}</span>
								<input
									type='text'
									className='gz-prod-input flex-grow-1'
									placeholder='Ingredient name (e.g., Whey Protein Isolate 90%, Cocoa Powder, Stevia Extract)'
									value={ing}
									onChange={(e) => updateIngredient(idx, e.target.value)}
								/>
								{formData.ingredients.length > 1 && (
									<button
										type='button'
										className='gz-prod-row-delete-btn'
										onClick={() => removeIngredient(idx)}
										title='Remove ingredient'>
										<FontAwesomeIcon icon={faTrash} />
									</button>
								)}
							</div>
						))}
					</div>

					{/* Section 7: Nutrition Facts */}
					<div className='gz-prod-form-section' id='section-nutrition'>
						<div className='gz-prod-form-section-header'>
							<div>
								<h3 className='gz-prod-form-section-title'>Nutrition Facts</h3>
								<div className='gz-prod-form-section-sub'>Nutritional values per serving breakdown</div>
							</div>
						</div>

						<div className='row g-3'>
							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Serving Size</label>
									<input
										type='text'
										className='gz-prod-input'
										placeholder='e.g., 1 Scoop (30g)'
										value={formData.nutrition.servingSize}
										onChange={(e) => updateNutrition('servingSize', e.target.value)}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Energy (kcal)</label>
									<input
										type='number'
										className='gz-prod-input'
										placeholder='0'
										value={formData.nutrition.energy}
										onChange={(e) => updateNutrition('energy', e.target.value)}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Protein (g)</label>
									<input
										type='number'
										className='gz-prod-input'
										placeholder='0'
										value={formData.nutrition.protein}
										onChange={(e) => updateNutrition('protein', e.target.value)}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Carbohydrates (g)</label>
									<input
										type='number'
										className='gz-prod-input'
										placeholder='0'
										value={formData.nutrition.carbohydrates}
										onChange={(e) => updateNutrition('carbohydrates', e.target.value)}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Fat (g)</label>
									<input
										type='number'
										className='gz-prod-input'
										placeholder='0'
										value={formData.nutrition.fat}
										onChange={(e) => updateNutrition('fat', e.target.value)}
									/>
								</div>
							</div>

							<div className='col-12 col-md-4'>
								<div className='gz-prod-field-group'>
									<label className='gz-prod-label'>Fiber (g)</label>
									<input
										type='number'
										className='gz-prod-input'
										placeholder='0'
										value={formData.nutrition.fiber}
										onChange={(e) => updateNutrition('fiber', e.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AddGomziNutritionProduct
