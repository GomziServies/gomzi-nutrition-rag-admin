import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import { AddMedicalProduct, FileUploadToFGGroup } from '../../../../Functions/FGGroup'

const GMAddMedicalProduct = () => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		unit: '',
		display_image: '',
		selectedFile: null as File | null,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				display_image: URL.createObjectURL(file),
			}))
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

	const handleAddButtonClick = async () => {
		try {
			setIsSubmitting(true)
			let imgUrl = ''

			if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
					directory: 'products',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('image uploaded successfully')
			}

			const payload: any = {
				name: formData.name,
				description: formData.description,
				unit: formData.unit,
				display_image: imgUrl,
			}

			await AddMedicalProduct(payload)

			toast.success('Product Add Successfully')

			setFormData({
				name: '',
				description: '',
				display_image: '',
				unit: '',
				selectedFile: null,
			})
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
									<img
										alt='Photos'
										src={formData.display_image || '/media/logos/rag-favicon-logo.png'}
										style={{ borderRadius: '10px', width: '70%' }}
									/>
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
									<div className='row justify-content-end'>
										<div className='col-12'>
											<div className='row'>
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
												<div className='col-md-12 fv-row mb-7'>
													<InputField
														placeholder='Enter Description'
														type='text'
														className='fv-row'
														name='description'
														label='Write Description'
														htmlFor='description'
														value={formData.description}
														onChange={handleInputChange}
													/>
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

export { GMAddMedicalProduct }
