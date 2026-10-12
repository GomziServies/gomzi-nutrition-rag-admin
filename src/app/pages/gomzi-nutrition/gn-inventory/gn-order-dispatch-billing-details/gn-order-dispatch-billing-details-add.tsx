import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import { AddGnDispatchBill, FileUploadToFGGroup, GetGnClient } from '../../../../Functions/FGGroup'

const GomziNutritionProductDispatchDetailsAdd = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const clientIdFromUrl = searchParams.get('clientId') || ''
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [clientName, setClientName] = useState('Loading...')
	const [formData, setFormData] = useState({
		clientId: clientIdFromUrl,
		supplierName: '',
		trackingId: '',
		orderWeight: '',
		orderValue: '',
		shippingCharges: '',
		image: '/media/gomzi-nutrition/dispatch-bill-dummy.png',
		selectedFile: null as File | null,
		isFileUploaded: false,
	})

	useEffect(() => {
		if (clientIdFromUrl) {
			const fetchClientName = async () => {
				try {
					const response: FGGroupAPIResponse = await GetGnClient({ id: clientIdFromUrl })
					const client = Array.isArray(response.data) ? response.data[0] : response.data
					if (client) {
						setClientName(client.name || 'Unknown Client')
					} else {
						setClientName('Client not found')
					}
				} catch (error) {
					console.error('Error fetching client name:', error)
					setClientName('Error loading name')
				}
			}
			fetchClientName()
		} else {
			setClientName('No Client Selected')
		}
	}, [clientIdFromUrl])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			const isImage = file.type.startsWith('image/')
			setFormData((prevData) => ({
				...prevData,
				selectedFile: file,
				image: isImage ? URL.createObjectURL(file) : '/media/svg/files/pdf.svg', // Use a generic file icon if not an image
				isFileUploaded: true,
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
			// Basic required field validation
			if (
				!formData.clientId ||
				!formData.supplierName ||
				!formData.trackingId ||
				!formData.orderWeight ||
				!formData.orderValue ||
				!formData.shippingCharges
			) {
				toast.error('Please fill all required fields before submitting')
				return
			}

			setIsSubmitting(true)
			let imgUrl = formData.image

			if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
					directory: 'dispatch-bills',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('File uploaded successfully')
			}

			const payload: any = {
				clientId: formData.clientId,
				supplierName: formData.supplierName,
				trackingId: formData.trackingId,
				orderWeight: Number(formData.orderWeight),
				orderValue: Number(formData.orderValue),
				shippingCharges: Number(formData.shippingCharges),
				image: imgUrl,
			}

			await AddGnDispatchBill(payload)

			toast.success('Dispatch Bill Added Successfully')
			navigate(`/rag/inventory/view/list?clientId=${formData.clientId}`)
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Order Dispatch Add</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-3 text-center'>
									<img
										alt='Photos'
										src={formData.image}
										style={{ borderRadius: '10px', width: '70%' }}
									/>
									<div>
										<button
											type='button'
											className='mt-5 px-2 py-1 mb-2 btn btn-success'
											onClick={handleFileButtonClick}>
											{formData.isFileUploaded ? 'Change File' : 'Upload File'}
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
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Client Name'
														type='text'
														className='fv-row'
														name='name'
														label='Client Name'
														htmlFor='name'
														value={clientName}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Supplier Name'
														type='text'
														className='fv-row'
														name='supplierName'
														label='Supplier Name'
														htmlFor='supplierName'
														value={formData.supplierName}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Tracking Id'
														type='text'
														className='fv-row'
														name='trackingId'
														label='Tracking Id'
														htmlFor='trackingId'
														value={formData.trackingId}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Order Weight'
														type='number'
														className='fv-row'
														name='orderWeight'
														label='Order Weight'
														htmlFor='orderWeight'
														value={formData.orderWeight}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Order Value'
														type='number'
														className='fv-row'
														name='orderValue'
														label='Order Value'
														htmlFor='orderValue'
														value={formData.orderValue}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Enter Shipping Charges'
														type='number'
														className='fv-row'
														name='shippingCharges'
														label='Shipping Charges'
														htmlFor='shippingCharges'
														value={formData.shippingCharges}
														onChange={handleInputChange}
													/>
												</div>
											</div>
										</div>
										<div className='col-md-2 fv-row mb-7'>
											<TableButton
												action='add'
												onClick={handleAddButtonClick}
												text={isSubmitting ? 'Please wait, Adding Details...' : 'Add Details'}
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

export { GomziNutritionProductDispatchDetailsAdd }
