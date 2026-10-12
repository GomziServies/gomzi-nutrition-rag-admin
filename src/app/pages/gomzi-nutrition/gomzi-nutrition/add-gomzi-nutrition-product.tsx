import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { AddProduct, FileUploadToFGGroup } from '../../../Functions/FGGroup'

const AddGomziNutritionProduct = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
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
			{
				title: '',
				value: '',
			},
		],

		benefits: [
			{
				title: '',
			},
		],

		ingredients: [''],

		usageInstructions: [
			{
				stepNumber: '',
				description: '',
			},
		],

		variations: [],
	})

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

	const updateNutrition = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			nutrition: {
				...prev.nutrition,
				[field]: value,
			},
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

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)
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

				toast.success('Images uploaded successfully')
			}

			if (!formData.name.trim()) {
				toast.error('Product name is required')
				return
			}

			if (!formData.price || Number(formData.price) <= 0) {
				toast.error('Valid price is required')
				return
			}

			const payload = {
				name: formData.name.trim(),
				price: Number(formData.price),
				discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
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

			toast.success('Product Add Successfully')

			setFormData({
				name: '',
				shortDescription: '',
				description: '',
				price: '',
				discountPrice: '',
				private_note: '',
				storageInstructions: '',
				stock: '',
				flavour: '',
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

				highlights: formData.highlights.filter((item) => item.title.trim()),

				benefits: formData.benefits.filter((item) => item.title.trim()),

				ingredients: [''],

				usageInstructions: [
					{
						stepNumber: '',
						description: '',
					},
				],

				variations: [],
			})
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const addHighlight = () => {
		setFormData((prev) => ({
			...prev,
			highlights: [
				...prev.highlights,
				{
					title: '',
					value: '',
				},
			],
		}))
	}

	const removeHighlight = (index: number) => {
		setFormData((prev) => ({
			...prev,
			highlights: prev.highlights.filter((_, i) => i !== index),
		}))
	}

	const updateHighlight = (index: number, field: 'title' | 'value', value: string) => {
		setFormData((prev) => {
			const updated = [...prev.highlights]

			updated[index] = {
				...updated[index],
				[field]: value,
			}

			return {
				...prev,
				highlights: updated,
			}
		})
	}

	const addUsageInstructions = () => {
		setFormData((prev) => ({
			...prev,
			usageInstructions: [
				...prev.usageInstructions,
				{
					stepNumber: '',
					description: '',
				},
			],
		}))
	}

	const removeUsageInstructions = (index: number) => {
		setFormData((prev) => ({
			...prev,
			usageInstructions: prev.usageInstructions.filter((_, i) => i !== index),
		}))
	}

	const updateUsageInstructions = (
		index: number,
		field: 'stepNumber' | 'description',
		value: string
	) => {
		setFormData((prev) => {
			const updated = [...prev.usageInstructions]

			updated[index] = {
				...updated[index],
				[field]: value,
			}

			return {
				...prev,
				usageInstructions: updated,
			}
		})
	}

	const addBenefit = () => {
		setFormData((prev) => ({
			...prev,
			benefits: [
				...prev.benefits,
				{
					title: '',
				},
			],
		}))
	}

	const removeBenefit = (index: number) => {
		setFormData((prev) => ({
			...prev,
			benefits: prev.benefits.filter((_, i) => i !== index),
		}))
	}

	const updateBenefit = (index: number, field: 'title', value: string) => {
		setFormData((prev) => {
			const updated = [...prev.benefits]

			updated[index] = {
				...updated[index],
				[field]: value,
			}

			return {
				...prev,
				benefits: updated,
			}
		})
	}

	const addIngredient = () => {
		setFormData((prev) => ({
			...prev,
			ingredients: [...prev.ingredients, ''],
		}))
	}

	const removeIngredient = (index: number) => {
		setFormData((prev) => ({
			...prev,
			ingredients: prev.ingredients.filter((_, i) => i !== index),
		}))
	}

	const updateIngredient = (index: number, value: string) => {
		setFormData((prev) => {
			const updated = [...prev.ingredients]

			updated[index] = value

			return {
				...prev,
				ingredients: updated,
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Product Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-5'>
									<div className='card-header'>
										<h3 className='card-title fw-bold'>Product Images</h3>
									</div>

									<div className='card-body'>
										<div className='mb-5'>
											<input
												type='file'
												multiple
												accept='image/*'
												className='form-control'
												onChange={handleImageChange}
											/>
										</div>

										{formData.displayImages.length === 0 && (
											<div className='text-center py-10 border rounded'>
												<img
													src='/media/logos/rag-favicon-logo.png'
													alt='preview'
													style={{
														maxHeight: '150px',
													}}
												/>

												<div className='text-muted mt-3'>No images selected</div>
											</div>
										)}

										{formData.displayImages.length > 0 && (
											<div className='row'>
												{formData.displayImages.map((image, index) => (
													<div
														className='col-md-3 mb-5'
														key={index}>
														<div
															className='position-relative border rounded overflow-hidden'
															style={{
																height: '180px',
															}}>
															<img
																src={image}
																alt='product'
																className='w-100 h-100'
																style={{
																	objectFit: 'cover',
																}}
															/>

															<button
																type='button'
																className='btn btn-danger btn-sm position-absolute top-0 end-0 m-2'
																onClick={() => removeImage(index)}>
																×
															</button>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
								<div className='col-md-7'>
									<div className='row justify-content-end'>
										<div className='col-12'>
											<div className='card mb-7'>
												<div className='card-header'>
													<h3 className='card-title fw-bold'>Basic Information</h3>
												</div>

												<div className='card-body'>
													<div className='row'>
														{/* Product Name */}
														<div className='col-md-12'>
															<InputField
																placeholder='Enter Product Name'
																type='text'
																name='name'
																label='Product Name'
																htmlFor='name'
																value={formData.name}
																onChange={handleInputChange}
																required
															/>
														</div>

														{/* Price */}
														<div className='col-md-4'>
															<InputField
																placeholder='0'
																type='number'
																name='price'
																label='Price'
																htmlFor='price'
																value={formData.price}
																onChange={handleInputChange}
																required
															/>
														</div>

														{/* Discount Price */}
														<div className='col-md-4'>
															<InputField
																placeholder='0'
																type='number'
																name='discountPrice'
																label='Discount Price'
																htmlFor='discountPrice'
																value={formData.discountPrice}
																onChange={handleInputChange}
															/>
														</div>

														<div className='col-md-4'>
															<InputField
																placeholder='0'
																type='number'
																name='stock'
																label='Stock'
																htmlFor='stock'
																value={formData.stock}
																onChange={handleInputChange}
															/>
														</div>

														<div className='col-md-6'>
															<InputField
																placeholder='enter flavour'
																type='text'
																name='flavour'
																label='Flavour'
																htmlFor='flavour'
																value={formData.flavour}
																onChange={handleInputChange}
															/>
														</div>

														<div className='col-md-4'>
															<InputField
																placeholder='500'
																type='number'
																name='weightAmount'
																label='Weight'
																htmlFor='weightAmount'
																value={formData.weight.amount}
																onChange={(e) => updateWeight('amount', e.target.value)}
															/>
														</div>

														<div className='col-md-2'>
															<label className='form-label'>Weight Unit</label>

															<select
																className='form-select mt-3'
																value={formData.weight.unit}
																onChange={(e) => updateWeight('unit', e.target.value)}>
																<option value='g'>g</option>
																<option value='kg'>kg</option>
																<option value='mg'>mg</option>
																<option value='lb'>lb</option>
																<option value='oz'>oz</option>
															</select>
														</div>

														{/* Categories */}
														<div className='col-md-6'>
															<InputField
																type='text'
																placeholder='Protein, Weight Loss, Wellness'
																name='categories'
																label='Categories'
																htmlFor='Categories'
																marginRemove
																value={formData.categories}
																onChange={handleInputChange}
															/>

															<div className='text-muted fs-8 mt-2'>
																Separate categories with commas
															</div>
														</div>

														{/* Tags */}
														<div className='col-md-6'>
															<InputField
																type='text'
																placeholder='Gym, Fitness, Muscle'
																name='tags'
																value={formData.tags}
																onChange={handleInputChange}
																label='Tags'
																marginRemove
																htmlFor='tags'
															/>

															<div className='text-muted fs-8 mt-2'>Separate tags with commas</div>
														</div>

														{/* Short Description */}
														<div className='col-md-12 mt-5'>
															<TextareaField
																className=''
																label='Short Description'
																htmlFor='Short Description'
																name='shortDescription'
																value={formData.shortDescription}
																onChange={handleInputChange as any}
																placeholder='Short product summary'
															/>
														</div>

														{/* Description */}
														<div className='col-md-12'>
															<TextareaField
																className=''
																label='Product Description'
																htmlFor='Product Description'
																name='description'
																value={formData.description}
																onChange={handleInputChange as any}
																placeholder='Detailed product description'
															/>
														</div>

														{/* storageInstructions */}
														<div className='col-md-12'>
															<TextareaField
																className=''
																label='Storage Instructions'
																htmlFor='Storage Instructions'
																name='storageInstructions'
																value={formData.storageInstructions}
																onChange={handleInputChange as any}
																placeholder='Storage Instructions'
															/>
														</div>

														{/* Private Note */}
														<div className='col-md-12'>
															<TextareaField
																className=''
																label='Private Note'
																htmlFor='Private Note'
																name='private_note'
																value={formData.private_note}
																onChange={handleInputChange as any}
																placeholder='Only visible to admins'
															/>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-12'>
									<div className='col-12'>
										<div className='card mb-7'>
											<div className='card-header'>
												<div className='card-title'>
													<h3>Product Highlights</h3>
												</div>

												<div className='card-toolbar'>
													<button
														type='button'
														className='btn btn-primary btn-sm'
														onClick={addHighlight}>
														Add Highlight
													</button>
												</div>
											</div>

											<div className='card-body'>
												{formData.highlights.map((item, index) => (
													<div
														className='row mb-4 align-items-center'
														key={index}>
														<div className='col-md-7'>
															<InputField
																type='text'
																htmlFor='Title'
																label='Title'
																name='title'
																labelMarginRemove
																value={item.title}
																placeholder='Protein'
																onChange={(e) => updateHighlight(index, 'title', e.target.value)}
															/>
														</div>

														<div className='col-md-4'>
															<InputField
																type='text'
																htmlFor='value'
																label='Value'
																name='value'
																labelMarginRemove
																value={item.value}
																placeholder='25g'
																onChange={(e) => updateHighlight(index, 'value', e.target.value)}
															/>
														</div>
														<div className='col-md-1'>
															<button
																type='button'
																className='btn btn-danger'
																onClick={() => removeHighlight(index)}>
																×
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
										<div className='card mb-7'>
											<div className='card-header'>
												<div className='card-title'>
													<h3>How to make it</h3>
												</div>

												<div className='card-toolbar'>
													<button
														type='button'
														className='btn btn-primary btn-sm'
														onClick={addUsageInstructions}>
														Add Step
													</button>
												</div>
											</div>

											<div className='card-body'>
												{formData.usageInstructions.map((item, index) => (
													<div
														className='row mb-4 align-items-center'
														key={index}>
														<div className='col-md-4'>
															<InputField
																type='number'
																htmlFor='stepNumber'
																label='Step Number'
																name='stepNumber'
																labelMarginRemove
																value={item.stepNumber}
																placeholder='1'
																onChange={(e) =>
																	updateUsageInstructions(index, 'stepNumber', e.target.value)
																}
															/>
														</div>

														<div className='col-md-7'>
															<InputField
																type='text'
																htmlFor='description'
																label='Description'
																name='description'
																labelMarginRemove
																value={item.description}
																placeholder='Example: Add 400ml of water to NARA shaker'
																onChange={(e) =>
																	updateUsageInstructions(index, 'description', e.target.value)
																}
															/>
														</div>
														<div className='col-md-1'>
															<button
																type='button'
																className='btn btn-danger'
																onClick={() => removeUsageInstructions(index)}>
																×
															</button>
														</div>
													</div>
												))}
											</div>
										</div>
										<div className='row'>
											<div className='col-md-6'>
												<div className='card mb-7'>
													<div className='card-header'>
														<div className='card-title'>
															<h3>Product Benefits</h3>
														</div>

														<div className='card-toolbar'>
															<button
																type='button'
																className='btn btn-primary btn-sm'
																onClick={addBenefit}>
																Add Benefit
															</button>
														</div>
													</div>
													<div className='card-body'>
														{formData.benefits.map((item, index) => (
															<div
																className='row mb-5 align-items-end'
																key={index}>
																<div className='col-md-10'>
																	<input
																		type='text'
																		className='form-control'
																		value={item.title}
																		placeholder='Builds Muscle'
																		onChange={(e) => updateBenefit(index, 'title', e.target.value)}
																	/>
																</div>
																<div className='col-md-2'>
																	<button
																		type='button'
																		className='btn btn-danger'
																		onClick={() => removeBenefit(index)}>
																		×
																	</button>
																</div>
															</div>
														))}
													</div>
												</div>
											</div>
											<div className='col-md-6'>
												<div className='card mb-7'>
													{' '}
													<div className='card-header'>
														<div className='card-title'>
															<h3>Ingredients</h3>
														</div>

														<div className='card-toolbar'>
															<button
																type='button'
																className='btn btn-primary btn-sm'
																onClick={addIngredient}>
																Add Ingredient
															</button>
														</div>
													</div>
													<div className='card-body'>
														{formData.ingredients.map((item, index) => (
															<div
																className='row mb-4 align-items-end'
																key={index}>
																<div className='col-md-10'>
																	<input
																		type='text'
																		className='form-control'
																		value={item}
																		placeholder='Ingredient name'
																		onChange={(e) => updateIngredient(index, e.target.value)}
																	/>
																</div>

																<div className='col-md-2'>
																	<button
																		type='button'
																		className='btn btn-danger'
																		onClick={() => removeIngredient(index)}>
																		×
																	</button>
																</div>
															</div>
														))}
													</div>
												</div>
											</div>
										</div>
										<div className='card mb-7'>
											<div className='card-header'>
												<div className='card-title'>
													<h3>Nutrition Information</h3>
												</div>
											</div>

											<div className='card-body'>
												<div className='row'>
													<div className='col-md-3'>
														<InputField
															type='text'
															name='servingSize'
															label='Serving Size'
															htmlFor='servingSize'
															value={formData.nutrition.servingSize}
															onChange={(e) => updateNutrition('servingSize', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='text'
															name='unit'
															label='Unit'
															htmlFor='unit'
															value={formData.nutrition.unit}
															onChange={(e) => updateNutrition('unit', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='energy'
															label='Energy'
															htmlFor='energy'
															value={String(formData.nutrition.energy)}
															onChange={(e) => updateNutrition('energy', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='protein'
															label='Protein'
															htmlFor='protein'
															value={String(formData.nutrition.protein)}
															onChange={(e) => updateNutrition('protein', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='carbohydrates'
															label='Carbohydrates'
															htmlFor='carbohydrates'
															value={String(formData.nutrition.carbohydrates)}
															onChange={(e) => updateNutrition('carbohydrates', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='fat'
															label='Fat'
															htmlFor='fat'
															value={String(formData.nutrition.fat)}
															onChange={(e) => updateNutrition('fat', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='fiber'
															label='Fiber'
															htmlFor='fiber'
															value={String(formData.nutrition.fiber)}
															onChange={(e) => updateNutrition('fiber', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='vitaminC'
															label='Vitamin C'
															htmlFor='vitaminC'
															value={String(formData.nutrition.vitaminC)}
															onChange={(e) => updateNutrition('vitaminC', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='iron'
															label='Iron'
															htmlFor='iron'
															value={String(formData.nutrition.iron)}
															onChange={(e) => updateNutrition('iron', e.target.value)}
														/>
													</div>

													<div className='col-md-3'>
														<InputField
															type='number'
															name='resveratrol'
															label='Resveratrol'
															htmlFor='resveratrol'
															value={String(formData.nutrition.resveratrol)}
															onChange={(e) => updateNutrition('resveratrol', e.target.value)}
														/>
													</div>
												</div>
											</div>
										</div>
										<div className='col-md-2 fv-row mb-7'>
											<TableButton
												action='add'
												onClick={handleAddButtonClick}
												text={isSubmitting ? 'Please wait, Adding Product...' : 'Add Product'}
												showIcon={false}
												disabled={isSubmitting}
												className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { AddGomziNutritionProduct }
