import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import { FileUploadToFGGroup } from '../../../../Functions/FGGroup'
import {
	GetGnDispatchBill,
	UpdateGnDispatchBill,
} from '../../../../Functions/FGGroup/GnDispatchBill'

const GomziNutritionProductDispatchDetailsEdit = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const dispatchId = searchParams.get('id')
	const clientIdFromUrl = searchParams.get('clientId')

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [formData, setFormData] = useState({
		clientId: '',
		clientName: '',
		supplierName: '',
		trackingId: '',
		orderWeight: '',
		orderValue: '',
		shippingCharges: '',
		image: '',
		selectedFile: null as File | null,
		isImage: true,
	})

	useEffect(() => {
		if (dispatchId) {
			fetchDispatchDetails(dispatchId)
		} else {
			toast.error('Dispatch ID not found')
			navigate(-1)
		}
	}, [dispatchId])

	const fetchDispatchDetails = async (id: string) => {
		setIsLoading(true)
		try {
			const response = await GetGnDispatchBill({ id })
			if (response?.data?.[0]) {
				const data = response.data[0]
				let imageUrl = data.image || ''
				if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
					imageUrl = `https://files.fggroup.in/${imageUrl}`
				}
				const isImage =
					/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(imageUrl) || imageUrl.startsWith('data:image')
				setFormData({
					clientId: data.clientId?._id || data.clientId,
					clientName: data.clientName || data.clientId?.name || 'N/A',
					supplierName: data.supplierName || '',
					trackingId: data.trackingId || '',
					orderWeight: data.orderWeight || '',
					orderValue: data.orderValue || '',
					shippingCharges: data.shippingCharges || '',
					image: imageUrl,
					selectedFile: null,
					isImage: isImage,
				})
			} else {
				toast.error('Dispatch record not found')
				navigate(-1)
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to fetch dispatch details')
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			const isImage = file.type.startsWith('image/')
			const reader = new FileReader()
			reader.onloadend = () => {
				setFormData((prevData) => ({
					...prevData,
					selectedFile: file,
					image: isImage ? (reader.result as string) : '/media/svg/files/pdf.svg',
					isImage: isImage,
				}))
			}
			reader.readAsDataURL(file)
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

	const handleUpdateButtonClick = async () => {
		try {
			if (
				!formData.supplierName ||
				!formData.orderWeight ||
				!formData.orderValue ||
				!formData.trackingId
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
			} else if (imgUrl.startsWith('https://files.fggroup.in/')) {
				imgUrl = imgUrl.replace('https://files.fggroup.in/', '')
			}

			const payload: any = {
				id: dispatchId,
				clientId: formData.clientId,
				clientName: formData.clientName,
				supplierName: formData.supplierName,
				trackingId: formData.trackingId,
				orderWeight: Number(formData.orderWeight),
				orderValue: Number(formData.orderValue),
				shippingCharges: Number(formData.shippingCharges),
				image: imgUrl,
			}

			await UpdateGnDispatchBill(payload)

			toast.success('Dispatch Bill Updated Successfully')

			// Navigate back to the inventory list page
			const redirectClientId = formData.clientId || clientIdFromUrl
			if (redirectClientId) {
				navigate(`/rag/inventory/view/list?clientId=${redirectClientId}`)
			} else {
				navigate(-1)
			}

			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message || 'Failed to update dispatch bill')
			setIsSubmitting(false)
			console.error(error)
		}
	}

	if (isLoading) {
		return (
			<div
				className='d-flex align-items-center justify-content-center'
				style={{ minHeight: '400px' }}>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
				<span className='ms-3 fs-4 text-gray-700'>Loading Dispatch Details...</span>
			</div>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Gomzi Nutrition Order Dispatch Edit</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-3 text-center'>
									<div className='position-relative d-inline-block'>
										<img
											alt='Dispatch Bill'
											src={
												formData.isImage
													? formData.image || '/media/gomzi-nutrition/dispatch-bill-dummy.png'
													: '/media/svg/files/pdf.svg'
											}
											style={{
												borderRadius: '10px',
												width: '100%',
												maxWidth: '250px',
												height: 'auto',
												objectFit: 'contain',
											}}
											className='shadow-sm border'
										/>
										<div className='mt-5'>
											<button
												type='button'
												className='btn btn-light-success btn-sm w-100'
												onClick={handleFileButtonClick}>
												<i className='bi bi-file-earmark-arrow-up me-2'></i>
												Change File
											</button>
											<input
												type='file'
												id='fileInput'
												className='d-none'
												onChange={handleInputChange}
											/>
										</div>
									</div>
								</div>
								<div className='col-md-9'>
									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Enter Client Name'
												type='text'
												className='fv-row'
												name='name'
												label='Client Name'
												htmlFor='name'
												value={formData.clientName}
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
												value={formData.orderWeight.toString()}
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
												value={formData.orderValue.toString()}
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
												value={formData.shippingCharges.toString()}
												onChange={handleInputChange}
											/>
										</div>
									</div>
									<div className='d-flex justify-content-end mt-10'>
										<button
											type='button'
											className='btn btn-light me-3'
											onClick={() => navigate(-1)}
											disabled={isSubmitting}>
											Cancel
										</button>
										<button
											type='button'
											className='btn btn-primary'
											onClick={handleUpdateButtonClick}
											disabled={isSubmitting}>
											{isSubmitting ? (
												<>
													<span
														className='spinner-border spinner-border-sm me-2'
														role='status'
														aria-hidden='true'></span>
													Updating...
												</>
											) : (
												'Update details'
											)}
										</button>
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

export { GomziNutritionProductDispatchDetailsEdit }
