import {
	faAward,
	faBriefcase,
	faCertificate,
	faCheck,
	faCheckCircle,
	faDownload,
	faEnvelope,
	faExternalLinkAlt,
	faFileAlt,
	faFilePdf,
	faIdCard,
	faPhone,
	faShareAlt,
	faUser,
	faUserCheck,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import TextareaField from '../../../components/TextareaField'
import { GetContactInquiry, UpdateReadReceipt } from '../../../Functions/FGGroup'

const ContactInquiryView: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const contactInquiry_id: any = searchParams.get('contactInquiry_id')!
	const [contactInquiry, setContactInquiry] = useState<any>(null)

	const fetchData = async () => {
		try {
			const response: any = await GetContactInquiry({ inquiry_id: contactInquiry_id })
			setContactInquiry(response?.data)
		} catch (error: any) {
			console.error(error)
			toast.error('Failed to fetch inquiry details')
		}
	}

	useEffect(() => {
		if (contactInquiry_id) {
			fetchData()
		}
	}, [contactInquiry_id])

	const inquiryItem = Array.isArray(contactInquiry) ? contactInquiry[0] : contactInquiry || {}
	const details = inquiryItem?.details || null
	const isPartnerProgram =
		Boolean(details) ||
		(inquiryItem?.subject &&
			inquiryItem.subject.toLowerCase().includes('partner'))

	const getFileUrl = (url?: string) => {
		if (!url || typeof url !== 'string') return ''
		if (url.startsWith('http://') || url.startsWith('https://')) return url
		return `${FG_GROUP_FILE_BASE_URL}/${url.replace(/^\/+/, '')}`
	}

	const isImageFile = (url?: string) => {
		if (!url) return false
		const lower = url.toLowerCase()
		return (
			lower.endsWith('.jpg') ||
			lower.endsWith('.jpeg') ||
			lower.endsWith('.png') ||
			lower.endsWith('.webp') ||
			lower.endsWith('.gif')
		)
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		if (Array.isArray(contactInquiry)) {
			setContactInquiry([{ ...contactInquiry[0], [name]: value }])
		} else {
			setContactInquiry({ ...contactInquiry, [name]: value })
		}
	}

	const handleInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		if (Array.isArray(contactInquiry)) {
			setContactInquiry([{ ...contactInquiry[0], [name]: value }])
		} else {
			setContactInquiry({ ...contactInquiry, [name]: value })
		}
	}

	const handleMarkAsRead = async () => {
		try {
			await UpdateReadReceipt({ inquiry_id: contactInquiry_id, read_receipt: true })
			if (Array.isArray(contactInquiry)) {
				setContactInquiry([{ ...contactInquiry[0], read_receipt: true }])
			} else {
				setContactInquiry({ ...contactInquiry, read_receipt: true })
			}
			toast.success('Message marked as read')
			fetchData()
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || 'Failed to mark as read')
		}
	}

	const handleMarkAsUnread = async () => {
		try {
			await UpdateReadReceipt({ inquiry_id: contactInquiry_id, read_receipt: false })
			if (Array.isArray(contactInquiry)) {
				setContactInquiry([{ ...contactInquiry[0], read_receipt: false }])
			} else {
				setContactInquiry({ ...contactInquiry, read_receipt: false })
			}
			toast.success('Message marked as unread')
			fetchData()
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || 'Failed to mark as unread')
		}
	}

	const renderFileAttachment = (label: string, fileUrl?: string, icon = faFileAlt) => {
		if (!fileUrl) {
			return (
				<div className='col-md-6 mb-4'>
					<label className='fw-bold fs-7 text-muted d-block mb-1'>{label}</label>
					<span className='badge badge-light-secondary py-2 px-3'>Not Provided</span>
				</div>
			)
		}

		const fullUrl = getFileUrl(fileUrl)
		const isImg = isImageFile(fullUrl)

		return (
			<div className='col-md-6 mb-4'>
				<label className='fw-bold fs-7 text-gray-700 d-block mb-2'>{label}</label>
				<div className='d-flex align-items-center gap-3 p-3 border rounded bg-light'>
					{isImg ? (
						<a href={fullUrl} target='_blank' rel='noreferrer'>
							<img
								src={fullUrl}
								alt={label}
								className='rounded shadow-sm'
								style={{ width: '56px', height: '56px', objectFit: 'cover' }}
							/>
						</a>
					) : (
						<div
							className='d-flex align-items-center justify-content-center bg-white border rounded'
							style={{ width: '56px', height: '56px' }}>
							<FontAwesomeIcon icon={icon} className='fs-2 text-primary' />
						</div>
					)}
					<div className='flex-grow-1 overflow-hidden'>
						<div
							className='fw-bold text-truncate text-gray-800'
							style={{ maxWidth: '200px' }}
							title={fileUrl}>
							{fileUrl.split('/').pop()}
						</div>
						<a
							href={fullUrl}
							target='_blank'
							rel='noreferrer'
							className='btn btn-sm btn-link p-0 text-primary fw-semibold'>
							<FontAwesomeIcon icon={faExternalLinkAlt} className='me-1' /> View File
						</a>
					</div>
					<a
						href={fullUrl}
						target='_blank'
						rel='noreferrer'
						download
						className='btn btn-sm btn-icon btn-light-primary'>
						<FontAwesomeIcon icon={faDownload} />
					</a>
				</div>
			</div>
		)
	}

	return (
		<KTCard>
			<PageTitle breadcrumbs={[]}>
				{isPartnerProgram ? 'RAG Pro Partner Application' : 'Contact Inquiry'}
			</PageTitle>

			<div className='container my-7'>
				{/* Top Status & Action Bar */}
				<div className='d-flex flex-wrap justify-content-between align-items-center mb-6 pb-4 border-bottom gap-3'>
					<div>
						<h3 className='fw-bolder mb-1 text-gray-900'>
							{isPartnerProgram
								? 'RAG Pro Partner Program Application'
								: 'Contact Inquiry Details'}
						</h3>
						<div className='text-muted fs-7'>
							Submitted on:{' '}
							<span className='fw-bold text-gray-800'>
								{inquiryItem?.createdAt
									? DayJS(inquiryItem.createdAt).format('DD/MM/YYYY hh:mm:ss A')
									: 'N/A'}
							</span>
							{' | '}
							Status:{' '}
							{inquiryItem?.read_receipt ? (
								<span className='badge badge-light-success fw-bold'>Read</span>
							) : (
								<span className='badge badge-light-danger fw-bold'>Unread</span>
							)}
						</div>
					</div>

					<div className='d-flex gap-2 align-items-center'>
						<TableButton
							action='view'
							text='Go Back'
							to='/rag/contact-inquiry/contact'
							backgroundDark={true}
							showIcon={false}
						/>

						{inquiryItem?.read_receipt ? (
							<button
								type='button'
								className='btn btn-danger'
								onClick={handleMarkAsUnread}>
								<FontAwesomeIcon icon={faCheck} className='me-1' /> Mark as Unread
							</button>
						) : (
							<button
								type='button'
								className='btn btn-warning'
								onClick={handleMarkAsRead}>
								<FontAwesomeIcon icon={faCheck} className='me-1' /> Mark as Read
							</button>
						)}
					</div>
				</div>

				{/* Primary Summary Overview */}
				<div className='card bg-light-primary border-primary border-dashed mb-7'>
					<div className='card-body py-4'>
						<div className='row g-3'>
							<div className='col-md-3 col-sm-6'>
								<span className='text-muted fs-8 text-uppercase fw-bolder d-block'>
									Applicant Name
								</span>
								<span className='fs-6 fw-bolder text-gray-900'>
									{inquiryItem?.name || details?.full_name || 'N/A'}
								</span>
							</div>
							<div className='col-md-3 col-sm-6'>
								<span className='text-muted fs-8 text-uppercase fw-bolder d-block'>
									Email
								</span>
								<a
									href={`mailto:${inquiryItem?.email || details?.email}`}
									className='fs-6 fw-bold text-primary text-truncate d-block'>
									{inquiryItem?.email || details?.email || 'N/A'}
								</a>
							</div>
							<div className='col-md-3 col-sm-6'>
								<span className='text-muted fs-8 text-uppercase fw-bolder d-block'>
									Mobile Number
								</span>
								<a
									href={`tel:${inquiryItem?.mobile || details?.mobile}`}
									className='fs-6 fw-bold text-dark d-block'>
									{inquiryItem?.mobile || details?.mobile || 'N/A'}
								</a>
							</div>
							<div className='col-md-3 col-sm-6'>
								<span className='text-muted fs-8 text-uppercase fw-bolder d-block'>
									Subject / Program
								</span>
								<span className='fs-6 fw-bold text-gray-800'>
									{inquiryItem?.subject || 'RAG Pro Partner Program'}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* RAG Pro Partner Program Sections */}
				{isPartnerProgram && details ? (
					<div className='partner-program-details'>
						{/* SECTION 1: Personal Information */}
						<div className='card card-bordered mb-6 shadow-xs'>
							<div className='card-header bg-white min-h-50px py-3'>
								<h5 className='card-title fw-bold text-gray-800 m-0'>
									<FontAwesomeIcon icon={faUser} className='text-primary me-2' />
									Section 1: Personal Information
								</h5>
							</div>
							<div className='card-body'>
								<div className='row'>
									<InputField
										className='col-md-4 fv-row'
										label='Full Name'
										placeholder='Full Name'
										type='text'
										name='name'
										htmlFor='name'
										value={details?.full_name || inquiryItem?.name || ''}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Date of Birth'
										placeholder='Date of Birth'
										type='text'
										name='dob'
										htmlFor='dob'
										value={details?.dob || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Gender'
										placeholder='Gender'
										type='text'
										name='gender'
										htmlFor='gender'
										value={details?.gender || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<CopyableInput
										className='col-md-4 fv-row'
										label='Mobile Number'
										placeholder='Mobile'
										type='text'
										name='mobile'
										htmlFor='mobile'
										value={details?.mobile || inquiryItem?.mobile || ''}
										onChange={() => {}}
										disabled
									/>
									<CopyableInput
										className='col-md-4 fv-row'
										label='WhatsApp Number'
										placeholder='WhatsApp'
										type='text'
										name='whatsapp'
										htmlFor='whatsapp'
										value={details?.whatsapp || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<CopyableInput
										className='col-md-4 fv-row'
										label='Email Address'
										placeholder='Email'
										type='email'
										name='email'
										htmlFor='email'
										value={details?.email || inquiryItem?.email || ''}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-6 fv-row'
										label='Complete Residential Address'
										placeholder='Address'
										type='text'
										name='address'
										htmlFor='address'
										value={details?.address || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-2 fv-row'
										label='City'
										placeholder='City'
										type='text'
										name='city'
										htmlFor='city'
										value={details?.city || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-2 fv-row'
										label='State'
										placeholder='State'
										type='text'
										name='state'
										htmlFor='state'
										value={details?.state || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-2 fv-row'
										label='PIN Code'
										placeholder='PIN'
										type='text'
										name='pincode'
										htmlFor='pincode'
										value={details?.pincode || 'N/A'}
										onChange={() => {}}
										disabled
									/>
								</div>

								<div className='row mt-4 pt-3 border-top'>
									{renderFileAttachment(
										'Passport-Size Photograph',
										details?.photo_url || details?.photo,
										faIdCard
									)}
									{renderFileAttachment(
										'Aadhaar Card / Valid Government-Issued ID Proof',
										details?.id_proof_url || details?.id_proof,
										faIdCard
									)}
								</div>
							</div>
						</div>

						{/* SECTION 2: Fitness & Professional Certifications */}
						<div className='card card-bordered mb-6 shadow-xs'>
							<div className='card-header bg-white min-h-50px py-3'>
								<h5 className='card-title fw-bold text-gray-800 m-0'>
									<FontAwesomeIcon icon={faCertificate} className='text-success me-2' />
									Section 2: Fitness & Professional Certifications
								</h5>
							</div>
							<div className='card-body'>
								<div className='row'>
									<InputField
										className='col-md-6 fv-row'
										label='Higher Education Qualification'
										placeholder='Higher Education'
										type='text'
										name='higher_education'
										htmlFor='higher_education'
										value={details?.higher_education || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-6 fv-row'
										label='Additional Qualifications in Nutrition, Sports Science, etc.'
										placeholder='Qualifications'
										type='text'
										name='additional_qualifications'
										htmlFor='additional_qualifications'
										value={details?.additional_qualifications || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<div className='col-md-12 mb-3'>
										<label className='fw-bold fs-6 mb-2'>
											Additional Fitness Certifications (if any)
										</label>
										<div className='form-control bg-light'>
											{details?.additional_certifications || 'None specified'}
										</div>
									</div>
								</div>

								<div className='row mt-4 pt-3 border-top'>
									{renderFileAttachment(
										'Fitness Certification Certificate',
										details?.certification_url || details?.certification_file,
										faCertificate
									)}
								</div>
							</div>
						</div>

						{/* SECTION 3: Professional Details */}
						<div className='card card-bordered mb-6 shadow-xs'>
							<div className='card-header bg-white min-h-50px py-3'>
								<h5 className='card-title fw-bold text-gray-800 m-0'>
									<FontAwesomeIcon icon={faBriefcase} className='text-warning me-2' />
									Section 3: Professional Details
								</h5>
							</div>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-4 mb-4'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Employment Type
										</label>
										<span className='badge badge-light-primary fs-7 px-3 py-2'>
											{details?.employment_type || 'N/A'}
										</span>
									</div>
									<InputField
										className='col-md-4 fv-row'
										label='Total Years of Experience'
										placeholder='Experience'
										type='text'
										name='experience_years'
										htmlFor='experience_years'
										value={details?.experience_years ? `${details.experience_years} Years` : 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Number of Active Clients Currently'
										placeholder='Clients'
										type='text'
										name='active_clients'
										htmlFor='active_clients'
										value={details?.active_clients || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<div className='col-md-4 mb-4'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Currently Recommend / Sell Supplements?
										</label>
										<span
											className={`badge fs-7 px-3 py-2 ${
												details?.recommend_supplements === 'Yes' ||
												details?.recommend_supplements === true
													? 'badge-light-success'
													: 'badge-light-danger'
											}`}>
											{details?.recommend_supplements || 'No'}
										</span>
									</div>
									<InputField
										className='col-md-4 fv-row'
										label='Supplement Brands Currently Recommended/Sold'
										placeholder='Brands'
										type='text'
										name='supplement_brands'
										htmlFor='supplement_brands'
										value={details?.supplement_brands || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Monthly Client Purchases Through Recommendations'
										placeholder='Purchases'
										type='text'
										name='monthly_supplement_purchases'
										htmlFor='monthly_supplement_purchases'
										value={details?.monthly_supplement_purchases || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<div className='col-md-6 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Primary Client Category
										</label>
										<span className='badge badge-light-info fs-7 px-3 py-2'>
											{details?.client_category || 'N/A'}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* SECTION 4: Social Media & Online Presence */}
						<div className='card card-bordered mb-6 shadow-xs'>
							<div className='card-header bg-white min-h-50px py-3'>
								<h5 className='card-title fw-bold text-gray-800 m-0'>
									<FontAwesomeIcon icon={faShareAlt} className='text-info me-2' />
									Section 4: Social Media & Online Presence
								</h5>
							</div>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Instagram Profile
										</label>
										{details?.instagram ? (
											<a
												href={
													details.instagram.startsWith('http')
														? details.instagram
														: `https://instagram.com/${details.instagram.replace('@', '')}`
												}
												target='_blank'
												rel='noreferrer'
												className='fw-bold text-primary text-truncate d-block'>
												{details.instagram} <FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
											</a>
										) : (
											<span className='text-muted'>N/A</span>
										)}
									</div>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Facebook Profile / Page
										</label>
										{details?.facebook ? (
											<a
												href={
													details.facebook.startsWith('http')
														? details.facebook
														: `https://${details.facebook}`
												}
												target='_blank'
												rel='noreferrer'
												className='fw-bold text-primary text-truncate d-block'>
												{details.facebook} <FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
											</a>
										) : (
											<span className='text-muted'>N/A</span>
										)}
									</div>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											YouTube Channel
										</label>
										{details?.youtube ? (
											<a
												href={
													details.youtube.startsWith('http')
														? details.youtube
														: `https://${details.youtube}`
												}
												target='_blank'
												rel='noreferrer'
												className='fw-bold text-primary text-truncate d-block'>
												{details.youtube} <FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
											</a>
										) : (
											<span className='text-muted'>N/A</span>
										)}
									</div>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											LinkedIn Profile
										</label>
										{details?.linkedin ? (
											<a
												href={
													details.linkedin.startsWith('http')
														? details.linkedin
														: `https://${details.linkedin}`
												}
												target='_blank'
												rel='noreferrer'
												className='fw-bold text-primary text-truncate d-block'>
												{details.linkedin} <FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
											</a>
										) : (
											<span className='text-muted'>N/A</span>
										)}
									</div>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Website / Online Coaching Profile
										</label>
										{details?.website ? (
											<a
												href={
													details.website.startsWith('http')
														? details.website
														: `https://${details.website}`
												}
												target='_blank'
												rel='noreferrer'
												className='fw-bold text-primary text-truncate d-block'>
												{details.website} <FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
											</a>
										) : (
											<span className='text-muted'>N/A</span>
										)}
									</div>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Other Professional Link
										</label>
										{details?.other_social ? (
											<a
												href={
													details.other_social.startsWith('http')
														? details.other_social
														: `https://${details.other_social}`
												}
												target='_blank'
												rel='noreferrer'
												className='fw-bold text-primary text-truncate d-block'>
												{details.other_social} <FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
											</a>
										) : (
											<span className='text-muted'>N/A</span>
										)}
									</div>
									<InputField
										className='col-md-4 fv-row'
										label='Instagram Followers (Approx)'
										placeholder='Followers'
										type='text'
										name='instagram_followers'
										htmlFor='instagram_followers'
										value={details?.instagram_followers || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Monthly Reach / Engagement'
										placeholder='Reach'
										type='text'
										name='monthly_reach'
										htmlFor='monthly_reach'
										value={details?.monthly_reach || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<div className='col-md-4 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Regularly Post Fitness/Nutrition Content?
										</label>
										<span
											className={`badge fs-7 px-3 py-2 ${
												details?.regular_posts === 'Yes' || details?.regular_posts === true
													? 'badge-light-success'
													: 'badge-light-danger'
											}`}>
											{details?.regular_posts || 'No'}
										</span>
									</div>
								</div>

								{(details?.portfolio_url || details?.portfolio_file) && (
									<div className='row mt-4 pt-3 border-top'>
										{renderFileAttachment(
											'Professional Portfolio or Client Transformation Work',
											details?.portfolio_url || details?.portfolio_file,
											faFilePdf
										)}
									</div>
								)}
							</div>
						</div>

						{/* SECTION 5: Business Potential & Supplement Sales */}
						<div className='card card-bordered mb-6 shadow-xs'>
							<div className='card-header bg-white min-h-50px py-3'>
								<h5 className='card-title fw-bold text-gray-800 m-0'>
									<FontAwesomeIcon icon={faAward} className='text-danger me-2' />
									Section 5: Business Potential & Supplement Sales
								</h5>
							</div>
							<div className='card-body'>
								<div className='row'>
									<div className='col-md-12 mb-4'>
										<label className='fw-bold fs-7 text-muted d-block mb-2'>
											How Do You Currently Acquire Clients?
										</label>
										<div className='d-flex flex-wrap gap-2'>
											{Array.isArray(details?.client_acquisition) ? (
												details.client_acquisition.map((item: string, idx: number) => (
													<span
														key={idx}
														className='badge badge-light-primary fs-7 py-2 px-3'>
														{item}
													</span>
												))
											) : details?.client_acquisition ? (
												<span className='badge badge-light-primary fs-7 py-2 px-3'>
													{details.client_acquisition}
												</span>
											) : (
												<span className='text-muted'>N/A</span>
											)}
										</div>
									</div>

									<InputField
										className='col-md-4 fv-row'
										label='Clients Interacted With Monthly'
										placeholder='Interactions'
										type='text'
										name='monthly_client_interactions'
										htmlFor='monthly_client_interactions'
										value={details?.monthly_client_interactions || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Clients Currently Using Supplements'
										placeholder='Supplement users'
										type='text'
										name='clients_using_supplements'
										htmlFor='clients_using_supplements'
										value={details?.clients_using_supplements || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<InputField
										className='col-md-4 fv-row'
										label='Most Common Supplement Purchased'
										placeholder='Common supplement'
										type='text'
										name='common_supplement_purchased'
										htmlFor='common_supplement_purchased'
										value={details?.common_supplement_purchased || 'N/A'}
										onChange={() => {}}
										disabled
									/>
									<div className='col-md-12 mb-3'>
										<label className='fw-bold fs-7 text-muted d-block mb-1'>
											Estimated Monthly Supplement Sales Potential
										</label>
										<span className='badge badge-success fs-6 py-2 px-4'>
											{details?.sales_potential || 'N/A'}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* SECTION 6: Verification & Declaration */}
						<div className='card card-bordered mb-6 shadow-xs'>
							<div className='card-header bg-white min-h-50px py-3'>
								<h5 className='card-title fw-bold text-gray-800 m-0'>
									<FontAwesomeIcon icon={faCheckCircle} className='text-primary me-2' />
									Section 6: Verification & Declaration
								</h5>
							</div>
							<div className='card-body'>
								<div className='d-flex flex-column gap-3'>
									<div className='d-flex align-items-center gap-2'>
										<FontAwesomeIcon
											icon={details?.declaration_accurate ? faCheckCircle : faCheck}
											className={
												details?.declaration_accurate
													? 'text-success fs-5'
													: 'text-muted fs-5'
											}
										/>
										<span className='fs-6 text-gray-800'>
											Confirmed that the submitted information is accurate
										</span>
										<span className='badge badge-light-success ms-auto'>Agreed</span>
									</div>
									<div className='d-flex align-items-center gap-2'>
										<FontAwesomeIcon
											icon={details?.declaration_verify ? faCheckCircle : faCheck}
											className={
												details?.declaration_verify
													? 'text-success fs-5'
													: 'text-muted fs-5'
											}
										/>
										<span className='fs-6 text-gray-800'>
											Authorized RAG Nutrition to verify professional certifications & profile
										</span>
										<span className='badge badge-light-success ms-auto'>Agreed</span>
									</div>
									<div className='d-flex align-items-center gap-2'>
										<FontAwesomeIcon
											icon={details?.declaration_privacy ? faCheckCircle : faCheck}
											className={
												details?.declaration_privacy
													? 'text-success fs-5'
													: 'text-muted fs-5'
											}
										/>
										<span className='fs-6 text-gray-800'>
											Consented to information handling in accordance with privacy policy
										</span>
										<span className='badge badge-light-success ms-auto'>Agreed</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				) : null}

				{/* Standard Message and Source Section */}
				<div className='card card-bordered mb-6 shadow-xs'>
					<div className='card-header bg-white min-h-50px py-3'>
						<h5 className='card-title fw-bold text-gray-800 m-0'>
							<FontAwesomeIcon icon={faEnvelope} className='text-primary me-2' />
							Submission Source & Raw Overview
						</h5>
					</div>
					<div className='card-body'>
						<div className='row'>
							<div className='col-md-12 mb-4'>
								<label htmlFor='source' className='fw-bold fs-6 mb-2 text-gray-700'>
									Source / Origin Page
								</label>
								<div className='form-control bg-light'>
									<a
										target='_blank'
										rel='noreferrer'
										href={inquiryItem?.source}
										className='text-primary fw-semibold'>
										{inquiryItem?.source || 'N/A'}{' '}
										<FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
									</a>
								</div>
							</div>
							<TextareaField
								className='col-md-12 fv-row'
								label='Complete Summary Message'
								placeholder='Message'
								name='message'
								htmlFor='message'
								rows={12}
								value={inquiryItem?.message || ''}
								onChange={handleNotesChange}
							/>
						</div>
					</div>
				</div>

				{/* Bottom Action Footer */}
				<div className='d-flex gap-3 pt-3'>
					<TableButton
						action='view'
						text='Go Back to Inquiries'
						to='/rag/contact-inquiry/contact'
						backgroundDark={true}
						showIcon={false}
					/>
					{inquiryItem?.read_receipt ? (
						<button
							type='button'
							className='btn btn-danger'
							onClick={handleMarkAsUnread}>
							<FontAwesomeIcon icon={faCheck} className='me-1' /> Mark as Unread
						</button>
					) : (
						<button
							type='button'
							className='btn btn-warning'
							onClick={handleMarkAsRead}>
							<FontAwesomeIcon icon={faCheck} className='me-1' /> Mark as Read
						</button>
					)}
				</div>
			</div>
		</KTCard>
	)
}

export default ContactInquiryView
