import {
	faFacebook,
	faInstagram,
	faTwitter,
	faWhatsapp,
	faYoutube,
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { GetListingForAdmin, ListingAction } from '../../../Functions/FGGroup'
import logo from './image.png'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'

const BusinessView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const business_owner_id: any = searchParams.get('business_owner_id')
	const [approvalData, setApprovalData] = useState<any>('')
	const [formData, setFormData] = useState({
		business_name: '',
		owner: { email: '', first_name: '', last_name: '', mobile: '', profile_image: '', _id: '' },
		business_type: '',
		business_category: [],
		business_logo: '',
		approval_status: { feedback: '', status: '' },
	})
	const [businessImg, setBusinessImg] = useState<any>([])
	const [services, setServices] = useState<any>([])
	const [tags, setTags] = useState<any>([])
	const [socialMedia, setSocialMedia] = useState<any>([])
	const [timings, setTimings] = useState<any>([])
	const [faqs, setFaqs] = useState<any>([])
	const [locationD, setLocationD] = useState<any>({
		address_line_1: '',
		address_line_2: '',
		city: '',
		country: '',
		landmark: '',
		pin_code: '',
		state: '',
	})
	const [contact, setContact] = useState<any>([])

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
				const response: any = await GetListingForAdmin({ listing_id: business_owner_id })
				const data: any = response.data[0]
				const locationData = data?.locations[0]
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
				setFormData(response.data[0])
			} catch (error) {
				console.error(error)
			}
		}

		fetchExpenseData()
	}, [])

	const handleUpdateData = async () => {
		try {
			const payload: any = {
				listing_id: business_owner_id,
				approval_status: approvalData.status,
				comment: updateData.comment,
			}
			await ListingAction(payload)
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
			<PageTitle breadcrumbs={[]}>Business List</PageTitle>
			<div className='container'>
				<div className='card mb-4'>
					<div className='card-body'>
						<h1 className='card-title mb-8'>Business Owner Details</h1>
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
							<div className='col-md-6'>
								<label
									htmlFor='phoneNumber'
									className='form-label'>
									Phone Number:
								</label>
								<input
									type='tel'
									className='form-control fv-row'
									id='mobile'
									disabled
									value={formData.owner.mobile}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-8'>
					<div className='card-body'>
						<h1 className='card-title mb-8'>Business Details</h1>
						<div className='mb-3'>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<label
										htmlFor='businessName'
										className='form-label'>
										Business Name:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='business_name'
										disabled
										value={formData.business_name}
									/>
								</div>
								<div className='col-md-4'>
									<label
										htmlFor='businessCategory'
										className='form-label'>
										Business Category:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='business_category'
										disabled
										value={formData.business_category[0]}
									/>
								</div>
								<div className='col-md-4'>
									<label
										htmlFor='businessType'
										className='form-label'>
										Business Type:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='business_type'
										disabled
										value={formData.business_type}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-md-6'>
									<label
										htmlFor='businessEmail'
										className='form-label'>
										Business Email:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='website'
										disabled
										value={contact.find((c: any) => c.contact_type === 'email')?.value || ''}
									/>
								</div>
								<div className='col-md-6'>
									<label
										htmlFor='businessMobileNumber'
										className='form-label'>
										Business Mobile Number:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='businessMobileNumber'
										disabled
										value={formData?.owner.mobile || 'N/A'}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<label
										htmlFor='plotHouse'
										className='form-label'>
										Plot/House:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='address_line_1'
										disabled
										value={locationD.address_line_1}
									/>
								</div>
								<div className='col-md-4'>
									<label
										htmlFor='address'
										className='form-label'>
										Address:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='address_line_2'
										disabled
										value={locationD.address_line_2}
									/>
								</div>
								<div className='col-md-4'>
									<label
										htmlFor='city'
										className='form-label'>
										City:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='city'
										disabled
										value={locationD.city}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<label
										htmlFor='state'
										className='form-label'>
										State:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='state'
										disabled
										value={locationD.state}
									/>
								</div>
								<div className='col-md-4'>
									<label
										htmlFor='country'
										className='form-label'>
										Country:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='country'
										disabled
										value={locationD.country}
									/>
								</div>
								<div className='col-md-4'>
									<label
										htmlFor='pincode'
										className='form-label'>
										Pincode:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='pin_code'
										disabled
										value={locationD.pin_code}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-12'>
									<label
										htmlFor='website'
										className='form-label'>
										Website:
									</label>
									<input
										type='text'
										className='form-control fv-row'
										id='website'
										disabled
										value={contact.find((c: any) => c.contact_type === 'website')?.value || ''}
									/>
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
								Business Photos
							</h1>
							<div className='mb-3'>
								<h2 style={{ marginBottom: '20px' }}>Business Logo</h2>
								<div>
									{formData.business_logo ? (
										<img
											src={
												formData.business_category
													? `https://files.fggroup.in/${formData.business_logo}`
													: logo
											}
											alt='Business 1'
											style={{ width: '150px', height: '150px', marginLeft: '10px' }}
										/>
									) : (
										'No Logo Found'
									)}
								</div>
							</div>
							<div className='mb-3 mt-8'>
								<h2 style={{ marginBottom: '20px' }}>Business Photos</h2>
								{formData.business_logo ? (
									<div
										className='d-flex'
										style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
										{businessImg.map((photo: string, index: number) => (
											<img
												key={index}
												src={photo ? `https://files.fggroup.in/${photo}` : logo}
												alt={`Business ${index + 1}`}
												style={{
													width: '150px',
													height: '150px',
													marginLeft: index === 0 ? '15px' : '20px',
												}}
											/>
										))}
									</div>
								) : (
									'No Image Found'
								)}
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>
								Business Services and Tags
							</h2>
							<div className='row'>
								<div className='col-md-6'>
									<p className='fs-4 fw-bold'>Services</p>
									<ul>
										{services.map((value: string) => (
											<li className='fs-5 mb-2'>{value}</li>
										))}
									</ul>
								</div>
								<div className='col-md-6'>
									<p className='fs-4 fw-bold'>Tags</p>
									<ul>
										{tags.map((tag: string) => (
											<li className='fs-5 mb-2'>{tag}</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business Social Media</h2>
							<div className='mb-3 row'>
								{socialMedia.map((media: any, index: number) => {
									const socialMediaIcons = {
										facebook: faFacebook,
										twitter: faTwitter,
										instagram: faInstagram,
										youtube: faYoutube,
										whatsapp: faWhatsapp,
									}

									const socialMediaTypeMapping: { [key: string]: keyof typeof socialMediaIcons } = {
										facebook: 'facebook',
										twitter: 'twitter',
										instagram: 'instagram',
										youtube: 'youtube',
										whatsapp: 'whatsapp',
									}

									const capitalizeFirstLetter = (string: string) => {
										return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
									}
									return (
										<div key={index}>
											<div>
												<label
													htmlFor={media.social_media_type}
													className='form-label'>
													<FontAwesomeIcon
														icon={
															socialMediaIcons[
															socialMediaTypeMapping[media.social_media_type.toLowerCase()]
															]
														}
														className='fs-2 me-1'
													/>
													{/* {capitalizeFirstLetter(media.social_media_type)} */}:
												</label>
												<a
													href={media.url}
													target='_blank'
													rel='noopener noreferrer'>
													<span className='ms-2'>
														<a href={media.link}>{media.link}</a>
													</span>
												</a>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					</div>
				</div>
				{/* <div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business Social Media</h2>
							<ul>
								{socialMedia.map((media: any, index: number) => (
									<li
										key={index}
										className='fs-4 mb-3'>
										<FontAwesomeIcon
											icon={fa +}
											className='fs-5'
										/>{media.social_media_type}: <a href={media.link}>{media.link}</a>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div> */}

				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business Hours</h2>
							{timings.map((day: any, index: number) => (
								<ul
									key={index}
									className='d-flex'>
									<li className='fs-4 fw-bold'>{day.title}</li>
									<li
										className='fs-4 fw-bold'
										style={{ marginLeft: '90px' }}>
										{day.timings[0].from_time} to {day.timings[0].to_time}
									</li>
								</ul>
							))}
						</div>
					</div>
				</div>

				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business FAQ'S</h2>
							{faqs.map((faq: any, index: number) => (
								<div
									key={index}
									className=''>
									<p className='fs-3 mb-2 fw-bold'>
										{index + 1 + '.'} {faq.question}
									</p>
									<p className='fs-5 fw-bold'>Ans. {faq.answer + ' ' + faq.additional_links[0]}</p>
								</div>
							))}
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
								action="add"
								onClick={() => handleUpdateData()}
								text="Submit"
								showIcon={false}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default BusinessView
