import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup, GetProduct, UpdateProductVariation } from '../../../Functions/FGGroup'

const EditGomziNutritionVariationProduct = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const product_id: string | any = searchParams.get('product_id')
	const variation_id: string | any = searchParams.get('variation_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
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

	const [activeImageIndex, setActiveImageIndex] = useState(0)

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

	useEffect(() => {
		const fetchProductData = async () => {
			try {
				const response: any = await GetProduct({ id: product_id })
				let data = response.data[0]?.variations

				data = data.find((product: any) => product._id == variation_id)

				setFormData({
					name: data.name || '',
					sku: data.sku || '',
					price: data.price || '',
					discountPrice: data.discountPrice || '',
					stock: data.stock || '',
					servings: data.servings || '',
					flavour: data.flavour || '',
					weight: {
						amount: data.weight?.amount || '',
						unit: data.weight?.unit || 'g',
					},
					isAvailable: data.isAvailable ?? true,
					displayImages:
						data.displayImages?.map((img: string) => `https://files.fggroup.in/${img}`) || [],
					selectedFiles: [],
				})
			} catch (error: any) {
				toast.error(error.message)
				console.error(error)
			}
		}

		fetchProductData()
	}, [])

	const handleUpdateButtonClick = async () => {
		try {
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
					amount: Number(formData.weight.amount),
					unit: formData.weight.unit,
				},
				servings: formData.servings ? Number(formData.servings) : undefined,
				displayImages: imageUrls,
				stock: Number(formData.stock || 0),
				isAvailable: formData.isAvailable,
			}

			await UpdateProductVariation(payload)

			toast.success('Product Updated Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
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

	return (
		<>
			<PageTitle breadcrumbs={[]}>Product Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row px-6 justify-content-between'>
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
									<div className='row'>
										<div className='col-md-6 fv-row mb-7'>
											<CopyableInput
												value={product_id}
												label={'Product ID'}
												className='col-12 fv-row mb-7'
												htmlFor={'product_id'}
												placeholder='Enter Product ID'
												type='text'
												name='product_id'
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<CopyableInput
												value={variation_id}
												label={'Variant ID'}
												className='col-12 fv-row mb-7'
												htmlFor={'variant_id'}
												placeholder='Enter Product ID'
												type='text'
												name='variant_id'
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Enter Product Name'
												type='text'
												className='fv-row'
												name='name'
												label='Product Name'
												htmlFor='name'
												value={formData.name}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Enter Price'
												type='number'
												className='fv-row'
												name='price'
												label='Price'
												htmlFor='price'
												value={formData.price}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Enter Discount Price'
												type='number'
												className='fv-row'
												name='discountPrice'
												label='Discount Price'
												htmlFor='discountPrice'
												value={formData.discountPrice}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Enter Stock'
												type='number'
												className='fv-row'
												name='stock'
												label='Stock'
												htmlFor='stock'
												value={formData.stock}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												labelMarginRemove
												placeholder='enter flavour'
												type='text'
												name='flavour'
												label='Flavour'
												htmlFor='flavour'
												value={formData.flavour}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												labelMarginRemove
												label='SKU'
												name='sku'
												htmlFor='sku'
												type='text'
												value={formData.sku}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												labelMarginRemove
												label='Servings'
												name='servings'
												htmlFor='servings'
												type='text'
												value={formData.servings}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<InputField
												labelMarginRemove
												label='Weight Amount'
												htmlFor='WeightAmount'
												name='weight'
												type='number'
												value={formData.weight.amount}
												onChange={(e) => updateWeight('amount', e.target.value)}
											/>
										</div>
										<div className='col-md-6 fv-row'>
											<SelectField
												label='Weight Unit'
												name='unit'
												htmlFor='weightUnit'
												value={formData.weight.unit}
												onChange={(e) => updateWeight('unit', e.target.value)}
												options={['g', 'kg', 'mg', 'lb', 'oz']}
												searchable={false}
												hideDefaultOption
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<label
												htmlFor='isAvailable'
												className='fw-bold fs-6 mb-md-5 mb-2'>
												isAvailable
											</label>
											<br />
											<div className='d-flex'>
												<div className='me-4'>
													<input
														type='radio'
														name='isAvailable'
														id='Yes'
														checked={formData.isAvailable === true}
														onChange={() =>
															setFormData((prevData: any) => ({
																...prevData,
																isAvailable: true,
															}))
														}
													/>{' '}
													<label
														htmlFor='Yes'
														className='fw-bold fs-6 mb-md-5 mb-2'>
														Yes
													</label>
												</div>
												<div>
													<input
														type='radio'
														name='isAvailable'
														id='No'
														checked={formData.isAvailable === false}
														onChange={() =>
															setFormData((prevData: any) => ({
																...prevData,
																isAvailable: false,
															}))
														}
													/>{' '}
													<label
														htmlFor='No'
														className='fw-bold fs-6 mb-md-5 mb-2'>
														No
													</label>
												</div>
											</div>
										</div>
										<div className='col-md-12 fv-row text-end mb-7'>
											<TableButton
												action='edit'
												onClick={handleUpdateButtonClick}
												text={
													isSubmitting
														? 'Please wait, Updating Product Variation...'
														: 'Update Product Variation'
												}
												showIcon={false}
												disabled={isSubmitting}
												backgroundDark={true}
												className={`mb-4 btn-block ${isSubmitting ? 'disabled' : ''}`}
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

export { EditGomziNutritionVariationProduct }
