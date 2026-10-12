import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'
import { GetMedicalOrders } from '../../../../Functions/FGGroup'

const GMOrderView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const order_id: any = searchParams.get('order_id')
	const [userData, setUserData] = useState<any>('')
	const [itemData, setItemData] = useState<any>('')
	const [loading, setLoading] = useState(false)
	const [doctorStatus, setDoctorStatus] = useState(null)
	const [pharmacyStatus, setPharmacyStatus] = useState(null)
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
	const [pharmacyEditData, setPharmacyEditData] = useState<any>({
		sign_image: '',
		editSignImage: false,
		selectedSignFile: null as File | null,
		stamp_image: '',
		editStampImage: false,
		selectedStampFile: null as File | null,
	})

	const fetchOrderData = async () => {
		setLoading(true)
		try {
			const response: any = await GetMedicalOrders({ order_id: order_id })
			const data: any = response.data?.[0]

			if (!data) {
				console.error('No data found')
				setLoading(false)
				return
			}

			const cartItems = data.CART || []
			const multipleItems = data.multiple_items || []
			let productData: any = []

			if (data.order_item_type === 'CART') {
				productData = multipleItems
					.map((multiItem: any) => {
						const cartItem = cartItems?.find((cart: any) => cart?._id === multiItem.item_id)

						if (cartItem) {
							return {
								name: cartItem.name,
								amount: multiItem.amount || 0,
								type: multiItem.item_type || 'Unknown',
								qty: multiItem.quantity || 1,
								id: multiItem?.item_id || 'Unknown',
							}
						}
						return null
					})
					.filter(Boolean)
			}

			const user = data.user_info || {}

			setItemData(productData)
			setUserData(user)

			const userData = response.data[0].user_info
			const setData = {
				date: DayJS(userData.date).format('YYYY-MM-DD'),
				name: userData.first_name + ' ' + userData.last_name,
				mobile: userData.mobile,
				email: userData.email,
				address: `${response.data[0].notes.address_line_1}, ${response.data[0].notes.address_line_2}, ${response.data[0].notes.city} - ${response.data[0].notes.pin_code}`,
				disease: response.data[0].disease,
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
						totalPayment: multiProductData.amount,
					}
				}),
			}
			setDoctorEditData({
				sign_image: response.data[0].doctor_approval.sign,
				stamp_image: response.data[0].doctor_approval.stamp,
			})
			setPharmacyEditData({
				sign_image: data.pharmacy_approval.sign,
				stamp_image: data.pharmacy_approval.stamp,
			})
			setOrderData(setData)
			setFormData(setData)
			
			setDoctorStatus(data.doctor_approval.status)
			setPharmacyStatus(data.pharmacy_approval.status)

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
			console.error('Error fetching order data:', error)
		} finally {
			setLoading(false)
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

	function viewFitnessOrder(book_order_id?: any) {
		window.open(`/fgiit/book-order-view?order_id=${book_order_id}`)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Order View</PageTitle>
			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_user_view'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>User Details</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_user_view'
					className='collapse show'>
					<div className='card-body border-top mt-4 mb-4'>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<div className='table-responsive d-md-block d-none'>
									<table
										id='kt_table_users'
										className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th>ID:</th>
												<th>Full Name:</th>
												<th>
													Email
													{userData.emailVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</th>
												<th>
													Mobile
													{userData.mobileVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{userData?._id || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{(userData.first_name || '-') + ' ' + (userData.last_name || '')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{userData.email || '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold   mb-1 fs-6'>
														{(userData.country_code || '') + ' ' + (userData.mobile || '-')}
													</span>
												</td>
											</tr>
										</tbody>
									</table>
								</div>

								<div className='table-responsive d-md-none d-block'>
									<div className='fw-bold text-muted'>
										<div className='mb-3'>
											<div>
												<b>ID:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{userData?._id || '-'}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>Full Name:</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{(userData.first_name || '-') + ' ' + (userData.last_name || '')}
											</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>
													Email
													{userData.emailVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>{userData.email || '-'}</div>
										</div>
										<div className='mb-3'>
											<div>
												<b>
													Mobile
													{userData.mobileVerified ? (
														<i
															className='fas fa-check-circle text-success mx-1'
															title='Verified'></i>
													) : (
														<i
															className='fa-solid fa-circle-xmark text-danger mx-1'
															title='Verification Pending'></i>
													)}
													:
												</b>
											</div>
											<div className='text-dark fw-bold  mb-1 fs-6'>
												{(userData.country_code || '') + ' ' + (userData.mobile || '-')}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='col-md-12 fv-row mt-5 mb-2 d-flex justify-content-end'>
							<TableButton
								action='view'
								to='/fgiit/users/view-user'
								text='View User'
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className='card mb-5 mb-xl-10'>
				<div
					className='card-header row border-0 cursor-pointer'
					role='button'
					data-bs-toggle='collapse'
					data-bs-target='#kt_item_data'>
					<div className='card-title m-0 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder m-0'>Item Details</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-3'
						/>
					</div>
				</div>
				<div
					id='kt_item_data'
					className='collapse show'>
					<div className='card-body border-top mt-4 mb-4'>
						<div className='row'>
							<div className='col-md-12 fv-row mb-7'>
								<div className='table-responsive'>
									<table
										id='kt_table_users'
										className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
										<thead>
											<tr className='fw-bold text-muted'>
												<th>Item ID:</th>
												<th>Item Name:</th>
												<th>Quantity:</th>
												<th>Item Type:</th>
												<th>Amount/Price:</th>
												<th>Action:</th>
											</tr>
										</thead>
										<tbody>
											{loading ? (
												<tr>
													<td
														colSpan={12}
														className='text-center'>
														<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
															<div
																className='spinner-border text-primary'
																role='status'>
																<span className='visually-hidden'>Loading...</span>
															</div>
														</div>
													</td>
												</tr>
											) : (
												itemData?.length > 0 &&
												itemData.map((item: any, index: number) => (
													<tr key={index}>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.id || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.name || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{item?.books ? item?.notes?.quantity || '-' : item?.qty || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{String(item?.type).split('_').join(' ') || '-'}
															</span>
														</td>
														<td>
															<span className='text-dark fw-bold  mb-1 fs-6'>
																{Number(item?.amount || 0).toFixed(2) + ' ' + 'INR'}
															</span>
														</td>
														<td>
															<TableButton
																action='view'
																to={`/gomzi-medical/product?product_id=${item.id}`}
															/>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
									{itemData?.length === 0 && !loading && (
										<div className='d-flex text-center w-100 align-content-center justify-content-center mt-7 mb-2'>
											<b>No records found</b>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='row'>
				{doctorStatus === "SUCCESS" && (
					<div className='col-md-6 mt-3'>
						<h3 className='fw-bolder m-0 text-center mb-3'>Doctor Prescription</h3>
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
				)}
				{pharmacyStatus === "SUCCESS" && (
					<div className='col-md-6 mt-3'>
						<h3 className='fw-bolder m-0 text-center mb-3'>Pharmacy Invoice</h3>
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
				)}
			</div>
		</>
	)
}
export { GMOrderView }
