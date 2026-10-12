import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import TableButton from '../../../../components/TableButton'
import {
	FileUploadToFGGroup,
	GetMedicalOrders,
	UpdateMedicalDoctorOrder,
} from '../../../../Functions/FGGroup'

const GMDoctorOrderView: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const order_id: string | null = searchParams.get('order_id')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<any>({
		date: '',
		name: '',
		mobile: '',
		email: '',
	})
	const [orderData, setOrderData] = useState<any>({
		date: '',
		name: '',
		mobile: '',
		email: '',
	})
	const [doctorEditData, setDoctorEditData] = useState<any>({
		sign_image: '',
		editSignImage: false,
		selectedSignFile: null as File | null,
		stamp_image: '',
		editStampImage: false,
		selectedStampFile: null as File | null,
	})

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		if (event.target instanceof HTMLInputElement && event.target.files) {
			if (name === 'sign') {
				const file = event.target.files[0]
				setDoctorEditData((prevData: any) => ({
					...prevData,
					selectedSignFile: file,
					sign_image: URL.createObjectURL(file),
					editSignImage: true,
				}))
			} else if (name === 'stamp') {
				const file = event.target.files[0]
				setDoctorEditData((prevData: any) => ({
					...prevData,
					selectedStampFile: file,
					stamp_image: URL.createObjectURL(file),
					editStampImage: true,
				}))
			}
		} else {
			setFormData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const handleUpdateMedicalDoctorOrder = async (event: any) => {
		event.preventDefault()
		let signUrl = ''

		if (doctorEditData.selectedSignFile) {
			const imageUrl: any = await FileUploadToFGGroup([doctorEditData.selectedSignFile], {
				directory: 'files',
			})
			signUrl = imageUrl.data?.fileURLs[0]
			toast.success('Sign image uploaded successfully')
		}
		let stampUrl = ''

		if (doctorEditData.selectedStampFile) {
			const imageUrl: any = await FileUploadToFGGroup([doctorEditData.selectedStampFile], {
				directory: 'files',
			})
			stampUrl = imageUrl.data?.fileURLs[0]
			toast.success('Stamp image uploaded successfully')
		}

		try {
			setIsSubmitting(true)
			const payload: any = {
				order_id: order_id,
				sign: signUrl,
				stamp: stampUrl,
			}
			await UpdateMedicalDoctorOrder(payload)
			toast.success('Order Updated Successfully')

			fetchOrderData()
			setIsSubmitting(false)
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	const fetchOrderData = async () => {
		try {
			const response: any = await GetMedicalOrders({ order_id: String(order_id) })
			const userData = response.data[0].user_info
			const setData = {
				date: DayJS(userData.date).format('YYYY-MM-DD'),
				name: userData.first_name + ' ' + userData.last_name,
				mobile: userData.mobile,
				email: userData.email,
				address: `${response.data[0].notes.address_line_1}, ${response.data[0].notes.address_line_2}, ${response.data[0].notes.city} - ${response.data[0].notes.pin_code}`,
				disease: response.data[0].disease,
				items: response.data[0].CART.map((itemData: any) => {
					const multiProductData = response.data[0].multiple_items.find(
						(multiData: any) => multiData.item_id === itemData?._id
					)
					return {
						item_id: itemData?._id,
						name: itemData.name,
						quantity: multiProductData.quantity,
					}
				}),
			}
			setDoctorEditData({
				sign_image: response.data[0].doctor_approval.sign,
				stamp_image: response.data[0].doctor_approval.stamp,
			})
			setOrderData(setData)
			setFormData(setData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [])

	const generatePDF = (name: any) => {
		const orderContent = document.getElementById('orderContent')

		if (orderContent) {
			orderContent.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			Promise.all([html2canvas(orderContent, { scale: 2, useCORS: true })]).then(
				([orderCanvas]) => {
					const orderImg = orderCanvas.toDataURL('image/jpeg', 1)

					orderContent.classList.remove('pdf-font-black')

					// Page 1 - Order Prescription
					doc.addImage(orderImg, 'JPEG', margin, margin, contentWidth, contentHeight)

					const pdfName = `${name || 'demoName'}.pdf`
					doc.save(pdfName)
				}
			)
		} else {
			console.error('Prescription content or terms not found.')
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Prescription</PageTitle>

			<div className='row'>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Update Prescription</p>
							<form>
								<div className='row'>
									<InputField
										className='col-md-6 fv-row'
										label='Date'
										placeholder="Date'"
										type='date'
										name='date'
										htmlFor='date'
										value={formData.date}
										onChange={handleInputChange}
										disabled
									/>
									<InputField
										className='col-md-6 fv-row'
										label='Full Name'
										placeholder='Enter Full Name'
										type='text'
										name='name'
										htmlFor='name'
										value={formData.name}
										onChange={handleInputChange}
										disabled
									/>
									<InputField
										className='col-md-12 fv-row'
										label='Address'
										placeholder='Enter Address'
										type='text'
										name='address'
										htmlFor='address'
										value={formData.address}
										onChange={handleInputChange}
										disabled
									/>
									<InputField
										className='col-md-12 fv-row'
										label='Phone No.'
										placeholder='Enter Phone No.'
										type='Number'
										name='mobile'
										htmlFor='mobile'
										value={formData.mobile}
										onChange={handleInputChange}
										disabled
									/>
									<InputField
										className='col-md-12 fv-row'
										label='Disease'
										placeholder='Enter Disease'
										type='text'
										name='disease'
										htmlFor='disease'
										value={formData.disease}
										onChange={handleInputChange}
										disabled
									/>
									<InputField
										className='col-md-12 fv-row'
										label='Add Sign'
										type='file'
										name='sign'
										htmlFor='sign'
										onChange={handleInputChange}
									/>
									<InputField
										className='col-md-12 fv-row'
										label='Add Stamp'
										type='file'
										name='stamp'
										htmlFor='stamp'
										onChange={handleInputChange}
									/>
									<div className='col-md-12 fv-row mb-0'>
										<TableButton
											action='edit'
											onClick={handleUpdateMedicalDoctorOrder}
											text={
												isSubmitting
													? 'Please wait, updating prescription...'
													: 'Update Prescription'
											}
											showIcon={false}
											disabled={isSubmitting}
											backgroundDark={true}
											className={`mb-4 w-100 btn-block ${isSubmitting ? 'disabled' : ''}`}
										/>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<div id='orderContent'>
								<div className='border'>
									<div className='invoice-header row mt-2 p-3'>
										<div className='col-md-8'>
											<p className='fs-4 mb-1'>
												<b>Fitness with Gomzi International Institute of Teaching</b>
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mt-1 mb-1'>
												323 3'rd floor, Laxmi Enclave-1, opp. Gajera School, Chitrakut Society,
												Katargam, Surat, Gujarat 395004
											</p>
											<p
												style={{ fontSize: '12px' }}
												className='mb-1'>
												Phone no. :<strong> 8866842520</strong>
											</p>
										</div>
										<div className='col-md-4'>
											<div className='text-center'>
												<img
													src='/media/logos/doctor-logo.jpeg'
													width='90%'
													alt='Company Logo'
												/>
											</div>
										</div>
									</div>
									<div className='invoice-details row p-3'>
										<div className='col-md-12 border px-0'>
											<div className='doctor-bill-to'>Bill To</div>
										</div>
										<div className='col-md-12 border text-right'>
											<div className='bill-name-date border-bottom row px-2'>
												<div className='col-md-12'>
													<p className=''>
														Full Name :-
														<span id='inv-name'>{orderData.name || 'Yash Sutariya'}</span>
													</p>
												</div>
												<div className='col-md-12'>
													<p className=''>
														Address :-
														<span id='inv-address'>
															{orderData.address || '102, Gajanand Apt, Katargan, Surat-4'}
														</span>
													</p>
												</div>
												<div className='col-md-6'>
													<p className=''>
														Date :-
														<span id='inv-date'>{orderData.date || '15-04-2024'}</span>
													</p>
												</div>
												<div className='col-md-6'>
													<p className=''>
														Phone No. :-
														<span id='inv-mobile'>{orderData.mobile || '8758742696'}</span>
													</p>
												</div>
											</div>
										</div>
										<div className='col-md-12 border px-0'>
											<div className='doctor-bill-to'>
												<b>Rx</b>
											</div>
										</div>
										{formData?.items?.map((product: any, index: any) => {
											return (
												<>
													<div className='col-md-9 border px-0'>
														<p
															style={{ fontSize: '14px' }}
															className='mt-1 mb-1'>
															{product.name}
														</p>
													</div>
													<div className='col-md-3 border px-0'>
														<p
															style={{ fontSize: '14px' }}
															className='mt-1 mb-1'>
															X {product.quantity}
														</p>
													</div>
												</>
											)
										})}
									</div>
									<div className='invoice-details d-flex'>
										<div className='col-md-6 border border-black px-0'>
											<div className='doctor-bill-to'>
												<b>Stamp:</b>
											</div>
											<div className='px-2 d-flex justify-content-center py-2'>
												{/* <img
													src={'/media/stamp/doctor-stamp.jpg'}
													alt='sign'
													width='60%'
												/> */}
												<img
													alt='Users'
													src={
														doctorEditData.stamp_image
															? doctorEditData.editStampImage == true
																? doctorEditData.stamp_image
																: `https://files.fggroup.in/${doctorEditData.stamp_image}`
															: '/media/avatars/300-1.jpg'
													}
													style={{ width: '90%' }}
												/>
											</div>
										</div>
										<div className='col-md-6 border border-black px-0'>
											<div className='doctor-bill-to'>
												<b>Sign:</b>
											</div>
											<div className='px-2 d-flex justify-content-center py-2'>
												{/* <img
													src={'/media/sign/goutam_sir.png'}
													alt='sign'
													width='90%'
												/> */}
												<img
													alt='Users'
													src={
														doctorEditData.sign_image
															? doctorEditData.editSignImage == true
																? doctorEditData.sign_image
																: `https://files.fggroup.in/${doctorEditData.sign_image}`
															: '/media/avatars/300-1.jpg'
													}
													style={{ width: '90%' }}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className='col-md-12 fv-row mt-10 text-center'>
								<button
									type='button'
									className='btn btn-success'
									onClick={() => generatePDF(orderData.name)}>
									Download Prescription
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default GMDoctorOrderView
