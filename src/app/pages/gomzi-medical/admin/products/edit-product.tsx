import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import CopyableInput from '../../../../components/CopyableInput'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import { FileUploadToFGGroup, GetMedicalProduct, UpdateMedicalProduct } from '../../../../Functions/FGGroup'

const GMEditMedicalProduct = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const product_id: string | any = searchParams.get('product_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [displayImg, setDisplayImg] = useState<string | null>(null)
	const [formData, setFormData] = useState({
		_id: '',
		name: '',
		description: '',
		unit: '',
		display_image: '',
		selectedFile: null as File | null,
	})

	const handleInputChange = async (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			const objectURL = URL.createObjectURL(file)

			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				display_image: objectURL,
			}))

			const imageUrl: any = await FileUploadToFGGroup([file], {
				directory: 'products',
			})
			const imgUrl = imageUrl.data?.fileURLs[0]
			setDisplayImg(imgUrl)
			toast.success('image uploaded successfully')
		} else {
			setFormData((prevData) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	useEffect(() => {
		const fetchProductData = async () => {
			try {
				const response: any = await GetMedicalProduct({ id: product_id })
				const data = response.data[0]
				setFormData(data)
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

			const payload: any = {
				id: product_id,
				name: formData.name,
				description: formData.description,
				unit: formData.unit,
				display_image: displayImg,
			}
			await UpdateMedicalProduct(payload)

			toast.success('Product Updated Successfully')
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Product Details</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-3 text-center'>
									{displayImg ? (
										<img
											alt='product'
											src={`https://files.fggroup.in/${displayImg || '/media/avatars/300-1.jpg'}`}
											style={{ borderRadius: '10px', width: '70%' }}
										/>
									) : (
										<img
											alt='product'
											src={`https://files.fggroup.in/${
												formData.display_image || '/media/avatars/300-1.jpg'
											}`}
											style={{ borderRadius: '10px', width: '70%' }}
										/>
									)}
									<div>
										<button
											type='button'
											className='mt-5 px-2 py-1 mb-2 btn btn-success'
											onClick={handleFileButtonClick}>
											Upload Photo
										</button>
										<input
											type='file'
											id='fileInput'
											className='d-none'
											onChange={handleInputChange}
										/>
									</div>
								</div>
								<div className='col-md-9'>
									<div className='row'>
										<div className='col-md-6 fv-row mb-7'>
											<CopyableInput
												value={formData._id}
												label={'Product ID'}
												className='col-12 fv-row mb-7'
												htmlFor={'_id'}
												placeholder='Enter Product ID'
												type='text'
												name='_id'
												disabled
												onChange={handleInputChange}
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
												placeholder='Enter Unit'
												type='text'
												className='fv-row'
												name='unit'
												label='Unit'
												htmlFor='unit'
												value={formData.unit}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
											<InputField
												placeholder='Enter Description'
												type='text'
												className='fv-row'
												name='description'
												label='Description'
												htmlFor='description'
												value={formData.description}
												onChange={handleInputChange}
											/>
										</div>
										{/* <div className='col-md-6 fv-row mb-7'>
                                            <InputField
                                                placeholder='Enter Width In Number'
                                                type='number'
                                                className='fv-row'
                                                name='width'
                                                label='Width'
                                                htmlFor='Width'
                                                value={formData.width}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className='col-md-6 fv-row mb-7'>
                                            <InputField
                                                placeholder='Enter Height In Number'
                                                type='number'
                                                className='fv-row'
                                                name='height'
                                                label='Height'
                                                htmlFor='Height'
                                                value={formData.height}
                                                onChange={handleInputChange}
                                            />
                                        </div> */}
										<div className='col-md-12 fv-row text-end mb-7'>
											<TableButton
												action='edit'
												onClick={handleUpdateButtonClick}
												text={
													isSubmitting
														? 'Please wait, Updating Product Details...'
														: 'Update Product Details'
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

export { GMEditMedicalProduct }
