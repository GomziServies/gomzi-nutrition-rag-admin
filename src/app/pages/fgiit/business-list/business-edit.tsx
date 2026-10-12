/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { AddListing, GetListingForAdmin, UpdateListing } from '../../../Functions/FGGroup'
import {
	emailPreferences,
	IEmailPreferences,
} from '../../../modules/fgiit/admin/components/settings/SettingsModel'

const BusinessEdit = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const business_owner_id: any = searchParams.get('list_id')
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [listingData, setListingData] = useState<any>({})
	const [faqs, setFaqs] = useState([{ question: '', answer: '' }])
	const [sameForAll, setSameForAll] = useState(false)
	const [data, setData] = useState<IEmailPreferences>(emailPreferences)
	const [businessHours, setBusinessHours] = useState([
		{ day: 'Mon', open: '10:00 AM', close: '07:00 PM' },
	])
	const [times, setTimes] = useState<any>({
		Monday: { opening: 'Opening Time', closing: 'Closing Time' },
		Tuesday: { opening: 'Opening Time', closing: 'Closing Time' },
		Wednesday: { opening: 'Opening Time', closing: 'Closing Time' },
		Thursday: { opening: 'Opening Time', closing: 'Closing Time' },
		Friday: { opening: 'Opening Time', closing: 'Closing Time' },
		Saturday: { opening: 'Opening Time', closing: 'Closing Time' },
		Sunday: { opening: 'Opening Time', closing: 'Closing Time' },
	})
	const timeOptions = [
		'01:00 AM',
		'02:00 AM',
		'03:00 AM',
		'04:00 AM',
		'05:00 AM',
		'06:00 AM',
		'07:00 AM',
		'08:00 AM',
		'09:00 AM',
		'10:00 AM',
		'11:00 AM',
		'12:00 AM',
		'01:00 PM',
		'02:00 PM',
		'03:00 PM',
		'04:00 PM',
		'05:00 PM',
		'06:00 PM',
		'07:00 PM',
		'08:00 PM',
		'09:00 PM',
		'10:00 PM',
		'11:00 PM',
		'12:00 PM',
		'Closed',
	]

	const fetchExpenseData = async () => {
		try {
			const response: any = await GetListingForAdmin({ listing_id: business_owner_id })
			const data: any = response.data[0]
			const locationData = data?.locations[0]
			const contactData = data?.contacts

			const emailData = contactData.find((contact: any) => contact.contact_type === 'email')
			const websiteData = contactData.find((contact: any) => contact.contact_type === 'website')
			const whatsappData = contactData.find((contact: any) => contact.contact_type === 'whatsapp')

			setListingData({
				listing_title: data.business_name,
				about_listing: data.description,
				categories: data.business_category[0],
				business_type: data.business_type,
				tags: data.tags,
				facilities: data.services,
				block_number: data.locations[0].address_line_1,
				street_colony: data.locations[0].address_line_2,
				city: data.locations[0].city,
				state: data.locations[0].state,
				country: data.locations[0].country,
				pin_code: data.locations[0].pin_code,
				address_link: data.locations[0].direction_link,
				contact: data.locations[0].contact.value,
				whatsapp_no: whatsappData?.value,
				email: emailData?.value,
				website: websiteData?.value,
				business_logo: data.business_logo,
				business_images: data.business_images,
				faqs: data.faqs,
				timings: data.timings,
			})

			// setBusinessImg(data.business_images)
			// setServices(data.services)
			// setUpdateData(data.approval_status)
			// setTags(data.tags)
			// setFaqs(data.faqs)
			// setTimings(data.timings)
			// setApprovalData(data.approval_status)
			// setSocialMedia(data.social_media)
			// setLocationD(locationData)
			// setContact(contactData)
			// setFormData(response.data[0])
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchExpenseData()
	}, [])

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setListingData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				profile_image: URL.createObjectURL(file),
				cover_image: URL.createObjectURL(file),
				editImage: true,
			}))
		} else {
			setListingData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}
	const updateData = (fieldsToUpdate: Partial<IEmailPreferences>) => {
		const updatedData = { ...data, ...fieldsToUpdate }
		setData(updatedData)
	}
	const handleTimeChange = (day: any, field: any, value: any) => {
		const updatedTimes: any = { ...times }
		updatedTimes[day][field] = value

		if (sameForAll) {
			Object.keys(updatedTimes).forEach((key) => {
				updatedTimes[key] = { ...updatedTimes[day] }
			})
		}

		setTimes(updatedTimes)
	}
	const handleCheckboxChange = (checked: any) => {
		setSameForAll(checked)
		if (checked) {
			const mondayTimes = times.Monday
			const updatedTimes: any = { ...times }
			Object.keys(updatedTimes).forEach((day) => {
				updatedTimes[day] = { ...mondayTimes }
			})
			setTimes(updatedTimes)
		}
	}
	const getBusinessHours = () => {
		const allDaysTime = Object.keys(times).map((day) => ({
			day,
			open: times[day].opening,
			close: times[day].closing,
		}))

		setBusinessHours(allDaysTime)
	}
	const handleAddFaq = () => {
		setFaqs([...faqs, { question: '', answer: '' }])
	}
	const handleRemoveFaq = (index: any) => {
		const updatedFaqs = [...faqs]
		updatedFaqs.splice(index, 1)
		setFaqs(updatedFaqs)
	}
	const handleFaqChange = (index: any, field: any, value: any) => {
		const updatedFaqs: any = [...faqs]
		updatedFaqs[index][field] = value
		setFaqs(updatedFaqs)
	}
	const handleAddButtonClicks = async () => {
		// if (!addListing.listing_title || !addListing.about_listing || !addListing.categories) {
		// 	toast.error('All Fields Required')
		// 	return
		// }

		try {
			const payload: any = {
				// listing_id: "6593b1bd19712b39b7eb5899",
				business_type: listingData.business_type,
				business_name: listingData.listing_title,
				description: listingData.about_listing,
				business_category: [listingData.categories],
				business_logo: listingData.logo,
				business_images: [listingData.images],
				services: [listingData.facilities],
				tags: [listingData.tags],
				social_media: [
					{
						social_media_type: 'facebook',
						link: 'fggroup.in',
					},
				],
				locations: [
					{
						location_name: listingData.block_number,
						address_line_1: listingData.street_colony,
						address_line_2: listingData.street_colony,
						city: listingData.city,
						state: listingData.state,
						country: listingData.country,
						pin_code: listingData.pin_code,
						landmark: 'punagam',
						direction_link: listingData.website,
						contact: {
							contact_type: 'contact',
							value: listingData.contact,
						},
					},
				],
				contacts: [
					{
						contact_type: 'whatsapp',
						value: listingData.whatsapp_no,
					},
				],
				faqs: [
					{
						question: listingData.question,
						answer: listingData.answer,
						// additional_links: [''],
					},
				],
				timings: [
					{
						title: 'monday',
						timings: [
							{
								from_time: listingData.monday_open,
								to_time: listingData.monday_closed,
							},
						],
					},
					{
						title: 'tuesday',
						timings: [
							{
								from_time: listingData.tuesday_open,
								to_time: listingData.tuesday_closed,
							},
						],
					},
					{
						title: 'wednesday',
						timings: [
							{
								from_time: listingData.wednesday_open,
								to_time: listingData.wednesday_closed,
							},
						],
					},
					{
						title: 'thursday',
						timings: [
							{
								from_time: listingData.thursday_open,
								to_time: listingData.thursday_closed,
							},
						],
					},
					{
						title: 'friday',
						timings: [
							{
								from_time: listingData.friday_open,
								to_time: listingData.friday_closed,
							},
						],
					},
					{
						title: 'saturday',
						timings: [
							{
								from_time: listingData.saturday_open,
								to_time: listingData.saturday_closed,
							},
						],
					},
					{
						title: 'sunday',
						timings: [
							{
								from_time: listingData.sunday_open,
								to_time: listingData.sunday_closed,
							},
						],
					},
				],
			}

			await UpdateListing(payload)

			toast.success('Book Created Successfully')
			setIsSubmitting(false)

			// navigate('/fgiit/books')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Business List</PageTitle>
			<div className='container'>
				<div className='card mb-4'>
					<div className='card-body'>
						<h1 className='card-title mb-8 p-2'>Listing Info</h1>
						<div className='mb-3 row'>
							<div className='col-md-6'>
								<InputField
									placeholder='Listing Title'
									type='text'
									className='col-12 fv-row mb-7'
									name='listing_title'
									label='Listing Title'
									htmlFor='listing_title'
									value={listingData.listing_title}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='About Listing'
									type='text'
									className='col-12 fv-row mb-7'
									name='about_listing'
									label='About Listing'
									htmlFor='about_listing'
									value={listingData.about_listing}
									onChange={handleInputChange}
								/>
							</div>
						</div>
						<div className='mb-3 row'>
							<div className='col-md-6'>
								<SelectField
									className='col-12 fv-row'
									name='categories'
									label='Categories'
									htmlFor='categories'
									value={listingData.categories}
									onChange={handleInputChange}
									options={[
										'Personal Trainer',
										'General Trainer',
										'Gym',
										'Dietician',
										'Nutritionist',
									]}
								/>
							</div>
							<div className='col-md-6'>
								<SelectField
									className='col-12 fv-row'
									name='business_type'
									label='Business Type'
									htmlFor='business_type'
									value={listingData.business_type}
									onChange={handleInputChange}
									options={['Personal', 'Business']}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Tags'
									type='text'
									className='col-12 fv-row mb-7'
									name='tags'
									label='Tags'
									htmlFor='tags'
									value={listingData.tags}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<SelectField
									className='col-12 fv-row'
									name='facilities'
									label='Facilities'
									htmlFor='facilities'
									value={listingData.facilities}
									onChange={handleInputChange}
									options={[
										'Wifi',
										'Steam Bath',
										'AC',
										'Parking',
										'Locker',
										'Changing Room',
										'Lounge Area',
										'Personal Trainer',
										'Message',
									]}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-8'>
					<div className='card-body'>
						<h1 className='card-title mb-8 p-2'>Location Info</h1>
						<div className='mb-3'>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<InputField
										placeholder='Block Number / Building Name'
										type='text'
										className='col-12 fv-row mb-7'
										name='block_number'
										label='Block Number / Building Name'
										htmlFor='block_number'
										value={listingData.block_number}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='Street / Colony Name'
										type='text'
										className='col-12 fv-row mb-7'
										name='street_colony'
										label='Street / Colony Name'
										htmlFor='street_colony'
										value={listingData.street_colony}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='City'
										type='text'
										className='col-12 fv-row mb-7'
										name='city'
										label='City'
										htmlFor='city'
										value={listingData.city}
										onChange={handleInputChange}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<InputField
										placeholder='State'
										type='email'
										className='col-12 fv-row mb-7'
										name='state'
										label='State'
										htmlFor='state'
										value={listingData.state}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='Country'
										type='text'
										className='col-12 fv-row mb-7'
										name='country'
										label='Country'
										htmlFor='country'
										value={listingData.country}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='Pin Code'
										type='text'
										className='col-12 fv-row mb-7'
										name='pin_code'
										label='Pin Code'
										htmlFor='pin_code'
										value={listingData.pin_code}
										onChange={handleInputChange}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<InputField
										placeholder='Address Link'
										type='text'
										className='col-12 fv-row mb-7'
										name='address_link'
										label='Address Link'
										htmlFor='address_link'
										value={listingData.address_link}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='Contact No'
										type='text'
										className='col-12 fv-row mb-7'
										name='contact'
										label='Contact No'
										htmlFor='contact'
										value={listingData.contact}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='WhatsApp No.'
										type='text'
										className='col-12 fv-row mb-7'
										name='whatsapp_no'
										label='WhatsApp No.'
										htmlFor='whatsapp_no'
										value={listingData.whatsapp_no}
										onChange={handleInputChange}
									/>
								</div>
							</div>
							<div className='mb-3 row'>
								<div className='col-md-4'>
									<InputField
										placeholder='Email'
										type='email'
										className='col-12 fv-row mb-7'
										name='email'
										label='Email'
										htmlFor='email'
										value={listingData.email}
										onChange={handleInputChange}
									/>
								</div>
								<div className='col-md-4'>
									<InputField
										placeholder='Website'
										type='text'
										className='col-12 fv-row mb-7'
										name='website'
										label='Website'
										htmlFor='website'
										value={listingData.website}
										onChange={handleInputChange}
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
								<div className='col-md-2 text-center'>
									<img
										alt='Photos'
										src={listingData.cover_image || '/media/avatars/300-1.jpg'}
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
											value={listingData.logo}
										/>
									</div>
								</div>
							</div>
							<div className='mb-3 mt-8'>
								<h2 style={{ marginBottom: '20px' }}>Business Photos</h2>

								<div className='col-md-2 text-center'>
									<img
										alt='Photos'
										src={listingData.cover_image || '/media/avatars/300-1.jpg'}
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
											value={listingData.images}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business Hours</h2>
							{/* <div className='form-check form-check-sm form-check-custom form-check-solid'>
								<input
									className='form-check-input p-3 mb-4'
									type='checkbox'
									name='email-preferences[]'
									defaultChecked={data.invoicePayments}
									onChange={() =>
										updateData({
											invoicePayments: !data.invoicePayments,
										})
									}
								/>
								<label
									htmlFor='Same with all'
									className='p-3 mb-4'>
									Same with all
								</label>
							</div> */}
							<div className='form-check mb-3'>
								<input
									type='checkbox'
									className='form-check-input'
									id='sameForAll'
									checked={sameForAll}
									onChange={(e) => handleCheckboxChange(e.target.checked)}
								/>
								<label
									className='form-check-label'
									htmlFor='sameForAll'>
									Same with all
								</label>
							</div>
							{Object.keys(times).map((day) => (
								<div
									className='row mb-3'
									key={day}>
									<label className='control-label col-lg-2 col-md-2'>{day}</label>
									<div className='col-lg-5 col-md-5'>
										<SelectField
											className='fv-row'
											name='opening_time'
											label='Opening Time'
											htmlFor='opening_time'
											showLabel={false}
											defaultOpening={true}
											value={times[day].opening || 'Opening time'}
											onChange={(e) => {
												handleTimeChange(day, 'opening', e.target.value)
												getBusinessHours()
											}}
											options={timeOptions}
										/>
									</div>
									<div className='col-lg-5 col-md-5'>
										<SelectField
											className='fv-row'
											name='closing_time'
											label='Closing Time'
											showLabel={false}
											htmlFor='closing_time'
											defaultClosing={true}
											value={times[day].closing || 'Closing time'}
											onChange={(e) => {
												handleTimeChange(day, 'closing', e.target.value)
												getBusinessHours()
											}}
											options={timeOptions}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<div className='card mb-4'>
					<div className='card-body'>
						<div className='mb-3'>
							<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>Business FAQ'S</h2>
							{faqs.map((faq, index) => (
								<div className=''>
									<InputField
										placeholder='Questions'
										type='text'
										className='col-12 fv-row mb-7'
										name='question'
										label='Questions'
										htmlFor='question'
										value={listingData.question}
										onChange={handleInputChange}
									/>
									<InputField
										placeholder='Answer'
										type='text'
										className='col-12 fv-row mb-7'
										name='answer'
										label='Answer'
										htmlFor='answer'
										value={listingData.answer}
										onChange={handleInputChange}
									/>
									<div className='row'>
										<div className='col-md-3'>
											<TableButton
												action='add'
												onClick={handleAddFaq}
												text={isSubmitting ? 'Please wait, Adding Lecture...' : 'Add FAQ'}
												disabled={isSubmitting}
												className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
											/>
										</div>
										<div className='col-md-3'>
											<TableButton
												action='remove'
												backgroundDark={true}
												onClick={() => handleRemoveFaq(index)}
											/>
										</div>
									</div>
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
								<div className='form-check form-check-sm form-check-custom form-check-solid'>
									<input
										className='form-check-input p-3 mb-4'
										type='checkbox'
										name='email-preferences[]'
										defaultChecked={data.invoicePayments}
										onChange={() =>
											updateData({
												invoicePayments: !data.invoicePayments,
											})
										}
									/>
									<label
										htmlFor='privacy'
										className='p-3 mb-4'>
										I hereby declare that the above-provided details are all correct
									</label>
								</div>
							</div>
							<div className='col-md-3 fv-row mt-4 mb-2 d-flex justify-content-end'>
								<TableButton
									action='add'
									onClick={handleAddButtonClicks}
									text={isSubmitting ? 'Please wait, Adding Lecture...' : 'Submit & Preview'}
									disabled={isSubmitting}
									showIcon={false}
									className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export { BusinessEdit }
