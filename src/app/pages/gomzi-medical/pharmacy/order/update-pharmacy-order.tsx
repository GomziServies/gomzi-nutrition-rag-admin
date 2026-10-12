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
	UpdateMedicalPharmacyOrder,
} from '../../../../Functions/FGGroup'

const GMPharmacyOrderView: React.FC = () => {
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
	const [pharmacyEditData, setPharmacyEditData] = useState<any>({
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
				setPharmacyEditData((prevData: any) => ({
					...prevData,
					selectedSignFile: file,
					sign_image: URL.createObjectURL(file),
					editSignImage: true,
				}))
			} else if (name === 'stamp') {
				const file = event.target.files[0]
				setPharmacyEditData((prevData: any) => ({
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

	const handleProductInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		itemId?: string
	) => {
		const { name, value } = event.target
		if ((name === 'quantity' || name === 'amount') && itemId) {
			const updatedItems = formData.items.map((item: any) => {
				if (item.item_id === itemId) {
					const updatedQuantity = name === 'quantity' ? Number(value) : Number(item.quantity)
					const updatedAmount = name === 'amount' ? Number(value) : Number(item.amount)
					const updatedTotalPayment = updatedQuantity * updatedAmount
					return {
						...item,
						[name]: value,
						totalPayment: updatedTotalPayment,
					}
				}
				return item
			})

			const updatedTotalAmount = updatedItems.reduce(
				(acc: number, item: any) => acc + item.totalPayment,
				0
			)

			setFormData((prevData: any) => ({
				...prevData,
				items: updatedItems,
				totalAmount: updatedTotalAmount,
			}))
		}
	}

	const handleUpdateMedicalPharmacyOrder = async (event: any) => {
		event.preventDefault()
		let signUrl = ''

		if (pharmacyEditData.selectedSignFile) {
			const imageUrl: any = await FileUploadToFGGroup([pharmacyEditData.selectedSignFile], {
				directory: 'files',
			})
			signUrl = imageUrl.data?.fileURLs[0]
			toast.success('Sign image uploaded successfully')
		}
		let stampUrl = ''

		if (pharmacyEditData.selectedStampFile) {
			const imageUrl: any = await FileUploadToFGGroup([pharmacyEditData.selectedStampFile], {
				directory: 'files',
			})
			stampUrl = imageUrl.data?.fileURLs[0]
			toast.success('Stamp image uploaded successfully')
		}

		try {
			setIsSubmitting(true)
			const payload: any = {
				order_id: order_id,
				sign: signUrl ? signUrl : pharmacyEditData.sign_image,
				stamp: stampUrl ? stampUrl : pharmacyEditData.stamp_image,
				items: formData.items.map((data: any) => ({
					item_id: data.item_id,
					quantity: parseInt(data.quantity),
					amount: parseInt(data.totalPayment),
					item_type: 'MEDICAL_PRODUCT',
				})),
			}
			await UpdateMedicalPharmacyOrder(payload)
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
			const data = response.data[0]
			const userData = data.user_info
			const setData = {
				date: DayJS(userData.date).format('YYYY-MM-DD'),
				name: userData.first_name + ' ' + userData.last_name,
				mobile: userData.mobile,
				email: userData.email,
				address: `${data.notes.address_line_1}, ${data.notes.address_line_2}, ${data.notes.city} - ${data.notes.pin_code}`,
				disease: data.disease,
				items: data.CART.map((itemData: any) => {
					const multiProductData = data.multiple_items.find(
						(multiData: any) => multiData.item_id === itemData._id
					)
					return {
						item_id: itemData._id,
						name: itemData.name,
						item_type: multiProductData.item_type,
						quantity: multiProductData.quantity,
						amount: multiProductData.amount / multiProductData.quantity,
						totalPayment: multiProductData.amount, // Add the total payment here
					}
				}),
			}
			setPharmacyEditData({
				sign_image: data.pharmacy_approval.sign,
				stamp_image: data.pharmacy_approval.stamp,
			})

			setFormData(setData)

			// Calculate the total amount of all products
			const totalAmount = setData.items.reduce(
				(acc: number, item: any) => acc + item.totalPayment,
				0
			)
			setFormData((prevData: any) => ({
				...prevData,
				totalAmount,
			}))
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchOrderData()
	}, [])

	const generatePDF = (name: any) => {
		const invoiceContent = document.getElementById('invoiceContent')

		if (invoiceContent) {
			invoiceContent.classList.add('pdf-font-black')

			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

			Promise.all([html2canvas(invoiceContent, { scale: 2, useCORS: true })]).then(
				([invoiceCanvas]) => {
					const invoiceImg = invoiceCanvas.toDataURL('image/jpeg', 1)

					invoiceContent.classList.remove('pdf-font-black')

					// Page 1 - Invoice
					doc.addImage(invoiceImg, 'JPEG', margin, margin, contentWidth, contentHeight)

					const pdfName = `${name || 'demoName'}.pdf`
					doc.save(pdfName)
				}
			)
		} else {
			console.error('Invoice content or terms not found.')
		}
	}

	const handleRemoveProduct = (itemId: string) => {
		const updatedItems = formData.items.filter((item: any) => item.item_id !== itemId)

		const updatedTotalAmount = updatedItems.reduce(
			(acc: number, item: any) => acc + item.totalPayment,
			0
		)

		setFormData((prevData: any) => ({
			...prevData,
			items: updatedItems,
			totalAmount: updatedTotalAmount,
		}))
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Bill</PageTitle>

			{/* <h1 className='fw-bold text-dark fs-1 mb-6 '>Create Invoice</h1> */}
			<div className='row'>
				<div className='col-md-6 mt-3'>
					<div className='card'>
						<div className='card-body'>
							<p className='fw-bold fs-2 mb-4'>Update Bill</p>
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
									<h1 className='mb-4'>Product Details:</h1>
									{formData?.items?.map((product: any, index: any) => {
										return (
											<div
												className='col-12 mb-5'
												key={index}>
												<div
													className='row'
													style={{
														border: '1px solid #00000008',
														borderRadius: '10px',
														backgroundColor: '#00000008',
													}}>
													<div className='col-md-12 row py-5 pb-0'>
														<div className='col-10 row'>
															<InputField
																className='col-md-6 fv-row'
																label='Product Name'
																placeholder='Enter Product Name'
																type='text'
																name='item_name'
																htmlFor='item_name'
																value={product.name}
																disabled
															/>
															<InputField
																className='col-md-6'
																label='Quantity'
																placeholder='Enter Quantity'
																type='number'
																name='quantity'
																value={product.quantity}
																htmlFor={`quantity-${index}`}
																onChange={(e) => handleProductInputChange(e, product.item_id)}
															/>
														</div>
														<div className='col-10 row'>
															<InputField
																className='col-md-6'
																label='Amount'
																placeholder='Enter Amount'
																type='number'
																name='amount'
																value={product.amount}
																htmlFor={`amount-${index}`}
																onChange={(e) => handleProductInputChange(e, product.item_id)}
															/>
															<InputField
																className='col-md-6 fv-row'
																label='Total'
																placeholder='Total'
																type='Number'
																name='totalPayment'
																htmlFor='totalPayment'
																disabled
																value={product.totalPayment}
															/>
														</div>
														<div className='col'></div>
														<div
															className='col-md-2'
															style={{ marginTop: '-30px' }}>
															<div className='mt-md-5 mb-md-0 mb-5 d-flex justify-content-md-end justify-content-center'>
																<TableButton
																	action='remove'
																	backgroundDark={true}
																	onClick={() => handleRemoveProduct(product.item_id)}
																/>
															</div>
														</div>
													</div>
												</div>
											</div>
										)
									})}
									<InputField
										className='col-md-12 fv-row'
										label='Total Amount'
										placeholder='Total Amount'
										type='Number'
										name='totalAmount'
										htmlFor='totalAmount'
										disabled
										value={formData.totalAmount}
									/>
									<div className='col-md-12 fv-row mb-7'>
										<TableButton
											action='edit'
											onClick={handleUpdateMedicalPharmacyOrder}
											text={isSubmitting ? 'Please wait, updating bill...' : 'Update Bill'}
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
														<span id='inv-name'>{formData.name || 'Yash Sutariya'}</span>
													</p>
												</div>
												<div className='col-md-12'>
													<p className=''>
														Address :-
														<span id='inv-address'>
															{formData.address || '102, Gajanand Apt, Katargan, Surat-4'}
														</span>
													</p>
												</div>
												<div className='col-md-6'>
													<p className=''>
														Date :-
														<span id='inv-date'>{formData.date || '15-04-2024'}</span>
													</p>
												</div>
												<div className='col-md-6'>
													<p className=''>
														Phone No. :-
														<span id='inv-mobile'>{formData.mobile || '8758742696'}</span>
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
													<div className='col-md-8 border px-0'>
														<p
															style={{ fontSize: '14px' }}
															className='mt-1 mb-1'>
															{product.name}
														</p>
													</div>
													<div className='col-md-2 border px-0'>
														<p
															style={{ fontSize: '14px' }}
															className='mt-1 mb-1'>
															X {product.quantity}
														</p>
													</div>
													<div className='col-md-2 border px-0'>
														<p
															style={{ fontSize: '14px' }}
															className='mt-1 mb-1'>
															₹{product.totalPayment} /-
														</p>
													</div>
												</>
											)
										})}
										<div className='col-md-8 border-top border px-0'>
											<p
												style={{ fontSize: '14px' }}
												className='mt-1 mb-1'></p>
										</div>
										<div className='col-md-2 border-top border px-0'>
											<p
												style={{ fontSize: '14px' }}
												className='mt-1 mb-1'>
												<b>Total</b>
											</p>
										</div>
										<div className='col-md-2 border-top border px-0'>
											<p
												style={{ fontSize: '14px' }}
												className='mt-1 mb-1'>
												<b>₹{formData.totalAmount} /-</b>
											</p>
										</div>
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
														pharmacyEditData.stamp_image
															? pharmacyEditData.editStampImage == true
																? pharmacyEditData.stamp_image
																: `https://files.fggroup.in/${pharmacyEditData.stamp_image}`
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
														pharmacyEditData.sign_image
															? pharmacyEditData.editSignImage == true
																? pharmacyEditData.sign_image
																: `https://files.fggroup.in/${pharmacyEditData.sign_image}`
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
									onClick={() => generatePDF(formData.name)}>
									Download Invoice
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default GMPharmacyOrderView
