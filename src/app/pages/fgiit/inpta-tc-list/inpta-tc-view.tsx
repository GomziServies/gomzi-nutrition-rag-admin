import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'
import {
	ActionInptaTCListing,
	GetTCListingForInptaAdmin,
} from '../../../Functions/FGGroup/InptaListing'
import images from './300-9.jpg'
import certificateImg from './certificate.jpg'
import logoImg from './logo.png'
import dustbinImg from './dustbin.jpg'
import gstImg from './gst.jpg'
import gymAreaImg from './gym-area.jpeg'
import medicalKitImg from './medical-kit.jpeg'
import panCardImg from './pancard.jpeg'
import receptionImg from './reception.jpeg'
import staffImg from './staff.jpg'
import washroomImg from './washroom.webp'

const InptaTCView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const inpta_owner_id: any = searchParams.get('inpta_owner_id')
	const [approvalData, setApprovalData] = useState<any>('')
	const [businessImg, setBusinessImg] = useState<any>([])
	const [services, setServices] = useState<any>([])
	const [tags, setTags] = useState<any>([])
	const [socialMedia, setSocialMedia] = useState<any>([])
	const [timings, setTimings] = useState<any>([])
	const [faqs, setFaqs] = useState<any>([])
	const [contact, setContact] = useState<any>([])
	const [formData, setFormData] = useState<any>({
		business_name: '',
		owner: { email: '', first_name: '', last_name: '', mobile: '', profile_image: '', _id: '' },
		business_type: '',
		business_category: [],
		business_logo: '',
		approval_status: { feedback: '', status: '' },
	})
	const [locationD, setLocationD] = useState<any>({
		address_line_1: '',
		address_line_2: '',
		city: '',
		country: '',
		landmark: '',
		pin_code: '',
		state: '',
	})
	const [updateData, setUpdateData] = useState({
		listing_id: '',
		approval_status: '',
		comment: '',
	})

	const handleInputUpdateChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setUpdateData({ ...updateData, [name]: value })
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setApprovalData({ ...formData, [name]: value })
	}

	useEffect(() => {
		const fetchExpenseData = async () => {
			try {
				const response: any = await GetTCListingForInptaAdmin({ listing_id: inpta_owner_id })
				const data: any = response.data?.[0]
				const locationData = data?.locations?.[0]
				const contactData = data?.contacts

				setBusinessImg(data.business_images)
				setServices(data.services)
				setUpdateData(data.approval_status)
				setTags(data.tags)
				setFaqs(data.faqs)
				setTimings(data.timings)
				setApprovalData(data.approval_status)
				setSocialMedia(data.social_media)
				setLocationD(locationData)
				setContact(contactData)
				setFormData(response.data?.[0])
			} catch (error) {
				console.error(error)
			}
		}

		fetchExpenseData()
	}, [])

	const handleUpdateData = async () => {
		try {
			const payload: any = {
				listing_id: inpta_owner_id,
				approval_status: approvalData.status,
				comment: updateData.comment,
			}
			await ActionInptaTCListing(payload)
			toast.success('Approve Status Update Successfully')

			setUpdateData({
				listing_id: '',
				approval_status: '',
				comment: '',
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>INPTA Training Partner List</PageTitle>
			<div className='container'>
				<div className='card mb-4'>
					<div className='card-body'>
						<h1 className='card-title mb-8'>Personal Details</h1>
						<div className='mb-3 row'>
							<div className='col-md-6'>
								<label
									htmlFor='first_name'
									className='form-label'>
									First Name:
								</label>
								<input
									type='text'
									className='form-control fv-row'
									id='first_name'
									disabled
									value={formData.owner.first_name}
								/>
							</div>
							<div className='col-md-6'>
								<label
									htmlFor='lastName'
									className='form-label'>
									Last Name:
								</label>
								<input
									type='text'
									className='form-control fv-row'
									id='last_name'
									disabled
									value={formData.owner.last_name}
								/>
							</div>
						</div>
						<div className='mb-3 row'>
							<div className='col-md-6'>
								<label
									htmlFor='phoneNumber'
									className='form-label'>
									Phone No.:
								</label>
								<input
									type='tel'
									className='form-control fv-row'
									id='mobile'
									disabled
									value={formData.owner.mobile}
								/>
							</div>
							<div className='col-md-6'>
								<label
									htmlFor='email'
									className='form-label'>
									Email Address:
								</label>
								<input
									type='email'
									className='form-control fv-row'
									id='email'
									disabled
									value={formData.owner.email}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<h1 className='card-title mb-8'>Business Details</h1>
						<div className='mb-3 row'>
							<div className='col-md-12'>
								<label
									htmlFor='first_name'
									className='form-label'>
									Title:
								</label>
								<input
									type='text'
									className='form-control fv-row'
									id='first_name'
									disabled
									value={'Fitness with Gomzi'}
								/>
							</div>
						</div>
						<div className='mb-3 row'>
							<div className='col-md-12'>
								<label
									htmlFor='description'
									className='form-label'>
									description:
								</label>
								<textarea
									className='form-control fv-row'
									name='description'
									disabled
									id='description'
									>
									From Diet And Exercise Plans To Provide Digital Marketing Knowledge, We Give You The Best Knowledge Overall.
								</textarea>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div>
							<h1
								className='card-title'
								style={{ marginBottom: '40px', marginTop: '20px' }}>
								Logo and Images
							</h1>
							<div className='mb-3'>
								<h2 style={{ marginBottom: '20px' }}>Logo</h2>
								<div>
									{/* {formData.aadhaar_card ? ( */}
									<img
										src={
											formData.aadhaar_card
												? `https://files.fggroup.in/${formData.aadhaar_card}`
												: logoImg
										}
										alt='Business 1'
										style={{ width: '150px', marginLeft: '10px' }}
									/>
									{/* ) : (
										'No Logo Found'
									)} */}
								</div>
							</div>
							<div className='mb-3'>
								<h2 style={{ marginBottom: '20px' }}>Images</h2>
								<div className='row'>
									{/* {formData.aadhaar_card ? ( */}
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Washroom:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: washroomImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Dustbin:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: dustbinImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Medical Kit:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: medicalKitImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Gym Area:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: gymAreaImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Reception:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: receptionImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Staff:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: staffImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									{/* // ) : (
									// 	'No Logo Found'
									// )} */}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div>
							<h1
								className='card-title'
								style={{ marginBottom: '40px', marginTop: '20px' }}>
								Documents And Certificate
							</h1>
							<div className='mb-3'>
								<h2 style={{ marginBottom: '20px' }}>Documents</h2>
								<div className='row'>
									{/* {formData.aadhaar_card ? ( */}
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Pan Card:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: panCardImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											GST Certificate:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: gstImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									{/* // ) : (
									// 	'No Logo Found'
									// )} */}
								</div>
							</div>
							<div className='mb-3'>
								<h2 style={{ marginBottom: '20px' }}>Certificates</h2>
								<div className='row'>
									{/* {formData.aadhaar_card ? ( */}
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											DPT Certificate:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: certificateImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											DNC Certificate:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: certificateImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									<div className='col-md-2 text-center'>
										<label
											htmlFor='description'
											className='form-label d-block fw-bolder'>
											Train The Trainer:
										</label>
										<img
											src={
												formData.aadhaar_card
													? `https://files.fggroup.in/${formData.aadhaar_card}`
													: certificateImg
											}
											alt='Business 1'
											style={{ width: '150px', marginLeft: '10px' }}
										/>
									</div>
									{/* // ) : (
									// 	'No Logo Found'
									// )} */}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business Approval</h2>
							<div className='row'>
								<div className='col-md-4'>
									<select
										value={approvalData.status}
										name='status'
										onChange={handleInputChange}
										className='form-select'
										style={{
											padding: '8px',
											fontSize: '16px',
											border: '1px solid #ced4da',
											borderRadius: '4px',
											marginBottom: '10px',
										}}>
										<option
											value=''
											style={{ color: '#6c757d' }}>
											Select Action
										</option>
										<option value='APPROVED'>Approve</option>
										<option value='REJECTED'>Reject</option>
										<option value='BANNED'>Banned</option>
									</select>
								</div>
								<div className='col-md-8'>
									<input
										type='text'
										className='form-control fv-row'
										id='comment'
										name='comment'
										placeholder='Enter Feedback (optional)'
										style={{ marginBottom: '10px' }}
										value={approvalData.comment}
										onChange={handleInputUpdateChange}
									/>
								</div>
							</div>
							<TableButton
								action='add'
								onClick={() => handleUpdateData()}
								text='Submit'
								showIcon={false}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default InptaTCView
