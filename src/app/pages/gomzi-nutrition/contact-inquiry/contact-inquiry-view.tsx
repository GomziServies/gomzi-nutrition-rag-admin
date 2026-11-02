import {
	faArrowLeft,
	faAward,
	faBriefcase,
	faCalendarAlt,
	faCertificate,
	faCheck,
	faCheckCircle,
	faClock,
	faCopy,
	faDownload,
	faDumbbell,
	faEnvelope,
	faExternalLinkAlt,
	faEye,
	faFileAlt,
	faFilePdf,
	faGlobe,
	faGraduationCap,
	faIdCard,
	faMapMarkerAlt,
	faPhone,
	faRotateLeft,
	faShareAlt,
	faShareNodes,
	faUser,
	faUserCheck,
} from '@fortawesome/free-solid-svg-icons'
import {
	faFacebook,
	faInstagram,
	faLinkedin,
	faWhatsapp,
	faYoutube,
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { GetContactInquiry, UpdateReadReceipt } from '../../../Functions/FGGroup'
import { isOrderInquiry } from './contactInquiryUtils'
import '../common-management.css'
import './contact-inquiry.css'

const ContactInquiryView: React.FC = () => {
	const location = useLocation()
	const basePath = location.pathname.startsWith('/hr') ? '/hr' : '/rag'
	const searchParams = new URLSearchParams(location.search)
	const contactInquiry_id: any = searchParams.get('contactInquiry_id')!
	const [contactInquiry, setContactInquiry] = useState<any>(null)
	const [loading, setLoading] = useState(true)

	const fetchData = async () => {
		try {
			setLoading(true)
			const response: any = await GetContactInquiry({ inquiry_id: contactInquiry_id })
			setContactInquiry(response?.data)
		} catch (error: any) {
			console.error(error)
			toast.error('Failed to fetch inquiry details')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (contactInquiry_id) {
			fetchData()
		}
	}, [contactInquiry_id])

	const inquiryItem = Array.isArray(contactInquiry) ? contactInquiry[0] : contactInquiry || {}
	const details = inquiryItem?.details || null
	const isOrder = isOrderInquiry(inquiryItem)
	const isPartnerProgram =
		!isOrder &&
		(Boolean(
			details?.full_name ||
				details?.higher_education ||
				details?.experience_years ||
				details?.employment_type ||
				details?.certification_url ||
				details?.social_platform
		) ||
			Boolean(
				inquiryItem?.subject &&
					inquiryItem.subject.toLowerCase().includes('partner')
			))

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

	const copyToClipboard = (text?: string, label = 'Copied to clipboard!') => {
		if (!text) return
		navigator.clipboard.writeText(text)
		toast.success(label)
	}

	const handleMarkAsRead = async () => {
		try {
			await UpdateReadReceipt({ inquiry_id: contactInquiry_id, read_receipt: true })
			if (Array.isArray(contactInquiry)) {
				setContactInquiry([{ ...contactInquiry[0], read_receipt: true }])
			} else {
				setContactInquiry({ ...contactInquiry, read_receipt: true })
			}
			toast.success('Inquiry marked as read')
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
			toast.success('Inquiry marked as unread')
			fetchData()
		} catch (error: any) {
			console.error(error)
			toast.error(error.message || 'Failed to mark as unread')
		}
	}

	const copyFullSummary = () => {
		const lines: string[] = []
		lines.push(`CONTACT INQUIRY DETAILS`)
		lines.push(`================================`)
		lines.push(`Name: ${inquiryItem?.name || details?.full_name || 'N/A'}`)
		lines.push(`Email: ${inquiryItem?.email || details?.email || 'N/A'}`)
		lines.push(`Mobile: ${inquiryItem?.mobile || details?.mobile || 'N/A'}`)
		lines.push(`Subject: ${inquiryItem?.subject || 'N/A'}`)
		if (inquiryItem?.source) lines.push(`Origin URL: ${inquiryItem.source}`)
		if (inquiryItem?.createdAt) {
			lines.push(`Submitted: ${DayJS(inquiryItem.createdAt).format('DD/MM/YYYY hh:mm:ss A')}`)
		}
		if (inquiryItem?.message) {
			lines.push(`\nMessage:\n${inquiryItem.message}`)
		}
		copyToClipboard(lines.join('\n'), 'Full inquiry details copied!')
	}

	const renderInfoTile = (
		label: string,
		value?: any,
		options?: {
			copyable?: boolean
			href?: string
			isMonospace?: boolean
			span?: 1 | 2 | 3
			badgeClass?: string
		}
	) => {
		const valStr = value !== undefined && value !== null && value !== '' ? String(value) : 'N/A'
		const isNA = valStr === 'N/A' || valStr === 'None specified' || valStr === 'None'
		const spanClass = options?.span === 3 ? 'span-3' : options?.span === 2 ? 'span-2' : ''

		return (
			<div className={`gz-inq-tile ${spanClass}`}>
				<div className='gz-inq-tile-label'>
					<span>{label}</span>
					{options?.copyable && !isNA && (
						<button
							type='button'
							className='gz-copy-btn'
							title={`Copy ${label}`}
							onClick={() => copyToClipboard(valStr, `${label} copied!`)}>
							<FontAwesomeIcon icon={faCopy} />
						</button>
					)}
				</div>
				{options?.badgeClass ? (
					<div>
						<span className={options.badgeClass}>{valStr}</span>
					</div>
				) : options?.href && !isNA ? (
					<a
						href={options.href}
						target={options.href.startsWith('http') ? '_blank' : undefined}
						rel='noreferrer'
						className={`gz-inq-tile-value text-primary ${options?.isMonospace ? 'monospace' : ''}`}
						style={{ textDecoration: 'none' }}>
						{valStr}
						{options.href.startsWith('http') && (
							<FontAwesomeIcon icon={faExternalLinkAlt} className='ms-1 fs-8' />
						)}
					</a>
				) : (
					<span className={`gz-inq-tile-value ${options?.isMonospace ? 'monospace' : ''} ${isNA ? 'text-muted fw-normal' : ''}`}>
						{valStr}
					</span>
				)}
			</div>
		)
	}

	const renderFileAttachment = (label: string, fileUrl?: string, icon = faFileAlt) => {
		if (!fileUrl) {
			return (
				<div className='gz-inq-attachment-card'>
					<div
						className='gz-inq-attachment-icon-box'
						style={{ background: '#F1F5F9', color: '#94A3B8', borderColor: '#E2E8F0' }}>
						<FontAwesomeIcon icon={icon} />
					</div>
					<div className='gz-inq-attachment-meta'>
						<span className='gz-inq-attachment-label'>{label}</span>
						<span className='text-muted fs-8'>Not Provided</span>
					</div>
				</div>
			)
		}

		const fullUrl = getFileUrl(fileUrl)
		const isImg = isImageFile(fullUrl)
		const fileName = fileUrl.split('/').pop() || 'document'

		return (
			<div className='gz-inq-attachment-card'>
				{isImg ? (
					<a href={fullUrl} target='_blank' rel='noreferrer' title='View Full Image'>
						<img
							src={fullUrl}
							alt={label}
							className='gz-inq-attachment-thumb'
						/>
					</a>
				) : (
					<div className='gz-inq-attachment-icon-box'>
						<FontAwesomeIcon icon={icon} />
					</div>
				)}
				<div className='gz-inq-attachment-meta'>
					<span className='gz-inq-attachment-label'>{label}</span>
					<span className='gz-inq-attachment-name' title={fileName}>
						{fileName}
					</span>
				</div>
				<div className='gz-inq-attachment-actions'>
					<a
						href={fullUrl}
						target='_blank'
						rel='noreferrer'
						className='gz-inq-action-btn'
						title='View File'>
						<FontAwesomeIcon icon={faEye} />
					</a>
					<a
						href={fullUrl}
						target='_blank'
						rel='noreferrer'
						download
						className='gz-inq-action-btn'
						title='Download'>
						<FontAwesomeIcon icon={faDownload} />
					</a>
				</div>
			</div>
		)
	}

	const applicantName = inquiryItem?.name || details?.full_name || 'Guest User'
	const initials = applicantName
		.split(' ')
		.map((n: string) => n[0])
		.filter(Boolean)
		.join('')
		.substring(0, 2)
		.toUpperCase() || 'CI'

	const formattedDate = inquiryItem?.createdAt
		? DayJS(inquiryItem.createdAt).format('DD MMM YYYY, hh:mm A')
		: 'N/A'

	const primaryMobile = inquiryItem?.mobile || details?.mobile || ''
	const primaryEmail = inquiryItem?.email || details?.email || ''
	const whatsappNumber = details?.whatsapp || primaryMobile

	return (
		<div className='gz-inq-container'>
			<PageTitle breadcrumbs={[]}>
				{isPartnerProgram ? 'RAG Pro Partner Application' : 'Contact Inquiry'}
			</PageTitle>

			{/* Breadcrumb Navigation */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to={`${basePath}/dashboard`}>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to={`${basePath}/contact-inquiry/contact`}>Contact Inquiries</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>{applicantName}</span>
			</div>

			{isOrder && (
				<div className='alert alert-warning d-flex align-items-center justify-content-between p-5 mb-6 rounded-3 shadow-sm'>
					<div className='d-flex flex-column'>
						<h4 className='mb-1 text-dark'>Product Order Entry</h4>
						<span>
							This record is an online product order submission. Product orders can be managed in the{' '}
							<Link to={`${basePath}/product-order`} className='fw-bold text-primary text-decoration-underline'>
								Product Orders
							</Link>{' '}
							section.
						</span>
					</div>
					<Link to={`${basePath}/product-order`} className='btn btn-sm btn-primary ms-4'>
						View Product Orders
					</Link>
				</div>
			)}

			{/* Hero / Header Card */}
			<div className='gz-inq-hero-card'>
				<div className='gz-inq-hero-left'>
					<div className='gz-inq-avatar'>{initials}</div>
					<div className='gz-inq-hero-meta'>
						<div className='gz-inq-hero-title-row'>
							<h1 className='gz-inq-hero-name'>{applicantName}</h1>
							{inquiryItem?.read_receipt ? (
								<span className='gz-inq-badge-read'>
									<FontAwesomeIcon icon={faCheckCircle} />
									Read
								</span>
							) : (
								<span className='gz-inq-badge-unread'>
									<FontAwesomeIcon icon={faClock} />
									Unread
								</span>
							)}
							{isPartnerProgram && (
								<span className='gz-inq-badge-type'>
									<FontAwesomeIcon icon={faAward} className='me-1' />
									Partner Program
								</span>
							)}
						</div>
						<p className='gz-inq-hero-subtitle'>
							<FontAwesomeIcon icon={faCalendarAlt} className='text-muted' />
							Submitted on <strong>{formattedDate}</strong>
							{inquiryItem?.source && (
								<>
									<span className='mx-1'>•</span>
									<span className='text-muted'>via website form</span>
								</>
							)}
						</p>
					</div>
				</div>

				<div className='gz-inq-hero-actions'>
					<Link to={`${basePath}/contact-inquiry/contact`} className='gz-mgmt-btn-secondary'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Inquiries</span>
					</Link>

					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={copyFullSummary}
						title='Copy all details to clipboard'>
						<FontAwesomeIcon icon={faCopy} />
						<span>Copy Info</span>
					</button>

					{inquiryItem?.read_receipt ? (
						<button
							type='button'
							className='btn-gz-mark-unread'
							onClick={handleMarkAsUnread}>
							<FontAwesomeIcon icon={faRotateLeft} />
							<span>Mark as Unread</span>
						</button>
					) : (
						<button
							type='button'
							className='btn-gz-mark-read'
							onClick={handleMarkAsRead}>
							<FontAwesomeIcon icon={faCheck} />
							<span>Mark as Read</span>
						</button>
					)}
				</div>
			</div>

			{/* 4-Column Overview Quick Contact Cards */}
			<div className='gz-inq-overview-grid'>
				<div className='gz-inq-overview-card'>
					<div className='gz-inq-card-icon blue'>
						<FontAwesomeIcon icon={faUser} />
					</div>
					<div className='gz-inq-card-content'>
						<span className='gz-inq-card-label'>Applicant Name</span>
						<div className='gz-inq-card-val-row'>
							<span className='gz-inq-card-val' title={applicantName}>
								{applicantName}
							</span>
							<button
								type='button'
								className='gz-copy-btn'
								title='Copy Name'
								onClick={() => copyToClipboard(applicantName, 'Name copied!')}>
								<FontAwesomeIcon icon={faCopy} />
							</button>
						</div>
					</div>
				</div>

				<div className='gz-inq-overview-card'>
					<div className='gz-inq-card-icon purple'>
						<FontAwesomeIcon icon={faEnvelope} />
					</div>
					<div className='gz-inq-card-content'>
						<span className='gz-inq-card-label'>Email Address</span>
						<div className='gz-inq-card-val-row'>
							{primaryEmail ? (
								<>
									<a
										href={`mailto:${primaryEmail}`}
										className='gz-inq-card-val text-primary'
										title={primaryEmail}>
										{primaryEmail}
									</a>
									<button
										type='button'
										className='gz-copy-btn'
										title='Copy Email'
										onClick={() => copyToClipboard(primaryEmail, 'Email copied!')}>
										<FontAwesomeIcon icon={faCopy} />
									</button>
								</>
							) : (
								<span className='text-muted fs-7'>N/A</span>
							)}
						</div>
					</div>
				</div>

				<div className='gz-inq-overview-card'>
					<div className='gz-inq-card-icon green'>
						<FontAwesomeIcon icon={faPhone} />
					</div>
					<div className='gz-inq-card-content'>
						<span className='gz-inq-card-label'>Contact Phone</span>
						<div className='gz-inq-card-val-row'>
							{primaryMobile ? (
								<>
									<a
										href={`tel:${primaryMobile}`}
										className='gz-inq-card-val'
										title={primaryMobile}>
										{primaryMobile}
									</a>
									<button
										type='button'
										className='gz-copy-btn'
										title='Copy Phone'
										onClick={() => copyToClipboard(primaryMobile, 'Phone copied!')}>
										<FontAwesomeIcon icon={faCopy} />
									</button>
									{whatsappNumber && (
										<a
											href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
											target='_blank'
											rel='noreferrer'
											className='gz-copy-btn text-success'
											title='Open WhatsApp'>
											<FontAwesomeIcon icon={faWhatsapp} />
										</a>
									)}
								</>
							) : (
								<span className='text-muted fs-7'>N/A</span>
							)}
						</div>
					</div>
				</div>

				<div className='gz-inq-overview-card'>
					<div className='gz-inq-card-icon amber'>
						<FontAwesomeIcon icon={faBriefcase} />
					</div>
					<div className='gz-inq-card-content'>
						<span className='gz-inq-card-label'>Inquiry Subject / Topic</span>
						<div className='gz-inq-card-val-row'>
							<span
								className='gz-inq-card-val text-dark fw-bold'
								title={inquiryItem?.subject || 'General Inquiry'}>
								{inquiryItem?.subject || (isPartnerProgram ? 'RAG Pro Partner Program' : 'General Inquiry')}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* RAG Pro Partner Program Detailed Sections */}
			{isPartnerProgram && details ? (
				<div className='partner-program-sections'>
					{/* SECTION 1: Personal Information */}
					<div className='gz-inq-card'>
						<div className='gz-inq-card-header'>
							<h5 className='gz-inq-card-title'>
								<span className='gz-inq-card-title-icon blue'>
									<FontAwesomeIcon icon={faUser} />
								</span>
								Section 1: Personal Information
							</h5>
							<span className='gz-inq-badge-type'>Identity &amp; Address</span>
						</div>
						<div className='gz-inq-card-body'>
							<div className='gz-inq-tiles-grid'>
								{renderInfoTile('Full Legal Name', details?.full_name || inquiryItem?.name, { copyable: true })}
								{renderInfoTile('Date of Birth', details?.dob)}
								{renderInfoTile('Gender', details?.gender)}
								{renderInfoTile('Mobile Number', details?.mobile || inquiryItem?.mobile, {
									copyable: true,
									href: (details?.mobile || inquiryItem?.mobile) ? `tel:${details?.mobile || inquiryItem?.mobile}` : undefined,
									isMonospace: true,
								})}
								{renderInfoTile('WhatsApp Number', details?.whatsapp, {
									copyable: true,
									href: details?.whatsapp ? `https://wa.me/${String(details.whatsapp).replace(/[^0-9]/g, '')}` : undefined,
									isMonospace: true,
								})}
								{renderInfoTile('Email Address', details?.email || inquiryItem?.email, {
									copyable: true,
									href: (details?.email || inquiryItem?.email) ? `mailto:${details?.email || inquiryItem?.email}` : undefined,
								})}
								{renderInfoTile('Residential Address', details?.address, { span: 2, copyable: true })}
								{renderInfoTile('City', details?.city)}
								{renderInfoTile('State', details?.state)}
								{renderInfoTile('PIN Code', details?.pincode, { isMonospace: true })}
							</div>

							{(details?.photo_url || details?.photo || details?.id_proof_url || details?.id_proof) && (
								<div className='gz-inq-attachments-grid'>
									{renderFileAttachment(
										'Passport-Size Photograph',
										details?.photo_url || details?.photo,
										faIdCard
									)}
									{renderFileAttachment(
										'Aadhaar / Government ID Proof',
										details?.id_proof_url || details?.id_proof,
										faIdCard
									)}
								</div>
							)}
						</div>
					</div>

					{/* SECTION 2: Fitness & Professional Certifications */}
					<div className='gz-inq-card'>
						<div className='gz-inq-card-header'>
							<h5 className='gz-inq-card-title'>
								<span className='gz-inq-card-title-icon green'>
									<FontAwesomeIcon icon={faCertificate} />
								</span>
								Section 2: Fitness &amp; Professional Certifications
							</h5>
							<span className='gz-inq-badge-type'>Qualifications</span>
						</div>
						<div className='gz-inq-card-body'>
							<div className='gz-inq-tiles-grid'>
								{renderInfoTile('Higher Education Qualification', details?.higher_education)}
								{renderInfoTile('Nutrition / Sports Science Specialization', details?.additional_qualifications)}
								{renderInfoTile('Additional Fitness Certifications', details?.additional_certifications, { span: 3 })}
							</div>

							{(details?.certification_url || details?.certification_file) && (
								<div className='gz-inq-attachments-grid'>
									{renderFileAttachment(
										'Fitness Certification Document / Certificate',
										details?.certification_url || details?.certification_file,
										faCertificate
									)}
								</div>
							)}
						</div>
					</div>

					{/* SECTION 3: Professional Details */}
					<div className='gz-inq-card'>
						<div className='gz-inq-card-header'>
							<h5 className='gz-inq-card-title'>
								<span className='gz-inq-card-title-icon amber'>
									<FontAwesomeIcon icon={faBriefcase} />
								</span>
								Section 3: Professional Experience &amp; Practice
							</h5>
							<span className='gz-inq-badge-type'>Track Record</span>
						</div>
						<div className='gz-inq-card-body'>
							<div className='gz-inq-tiles-grid'>
								{renderInfoTile('Employment Type', details?.employment_type, {
									badgeClass: 'gz-inq-badge-type',
								})}
								{renderInfoTile('Total Experience', details?.experience_years ? `${details.experience_years} Years` : 'N/A')}
								{renderInfoTile('Active Clients Count', details?.active_clients, { isMonospace: true })}
								{renderInfoTile('Recommends Supplements Currently?', details?.recommend_supplements ? 'Yes' : 'No', {
									badgeClass: (details?.recommend_supplements === 'Yes' || details?.recommend_supplements === true)
										? 'gz-inq-badge-read'
										: 'gz-inq-badge-unread',
								})}
								{renderInfoTile('Recommended Supplement Brands', details?.supplement_brands)}
								{renderInfoTile('Monthly Supplement Purchases', details?.monthly_supplement_purchases)}
								{renderInfoTile('Primary Client Category', details?.client_category, {
									badgeClass: 'gz-inq-badge-type',
								})}
							</div>
						</div>
					</div>

					{/* SECTION 4: Social Media & Online Presence */}
					<div className='gz-inq-card'>
						<div className='gz-inq-card-header'>
							<h5 className='gz-inq-card-title'>
								<span className='gz-inq-card-title-icon purple'>
									<FontAwesomeIcon icon={faShareNodes} />
								</span>
								Section 4: Social Media &amp; Online Footprint
							</h5>
							<span className='gz-inq-badge-type'>Audience Reach</span>
						</div>
						<div className='gz-inq-card-body'>
							<div className='gz-inq-tiles-grid mb-4'>
								{renderInfoTile('Instagram Followers (Approx)', details?.instagram_followers, { isMonospace: true })}
								{renderInfoTile('Monthly Reach / Engagement', details?.monthly_reach, { isMonospace: true })}
								{renderInfoTile('Regularly Posts Fitness/Nutrition Content?', details?.regular_posts ? 'Yes' : 'No', {
									badgeClass: (details?.regular_posts === 'Yes' || details?.regular_posts === true)
										? 'gz-inq-badge-read'
										: 'gz-inq-badge-unread',
								})}
							</div>

							{/* Social Profiles Grid */}
							<div className='gz-inq-social-grid'>
								{details?.social_platform && details?.social_link && (
									<a
										href={
											details.social_link.startsWith('http')
												? details.social_link
												: `https://${details.social_link.replace('@', '')}`
										}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faGlobe} className='text-primary' />
										<span>{details.social_platform}: {details.social_link}</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}

								{details?.instagram && (
									<a
										href={
											details.instagram.startsWith('http')
												? details.instagram
												: `https://instagram.com/${details.instagram.replace('@', '')}`
										}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faInstagram} style={{ color: '#E1306C' }} />
										<span>Instagram: {details.instagram}</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}

								{details?.facebook && (
									<a
										href={details.facebook.startsWith('http') ? details.facebook : `https://${details.facebook}`}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faFacebook} style={{ color: '#1877F2' }} />
										<span>Facebook: {details.facebook}</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}

								{details?.youtube && (
									<a
										href={details.youtube.startsWith('http') ? details.youtube : `https://${details.youtube}`}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faYoutube} style={{ color: '#FF0000' }} />
										<span>YouTube Channel</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}

								{details?.linkedin && (
									<a
										href={details.linkedin.startsWith('http') ? details.linkedin : `https://${details.linkedin}`}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faLinkedin} style={{ color: '#0A66C2' }} />
										<span>LinkedIn Profile</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}

								{details?.website && (
									<a
										href={details.website.startsWith('http') ? details.website : `https://${details.website}`}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faGlobe} className='text-success' />
										<span>Personal Website</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}

								{details?.other_social && (
									<a
										href={details.other_social.startsWith('http') ? details.other_social : `https://${details.other_social}`}
										target='_blank'
										rel='noreferrer'
										className='gz-inq-social-pill'>
										<FontAwesomeIcon icon={faShareAlt} className='text-muted' />
										<span>Other Link: {details.other_social}</span>
										<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8 ms-1' />
									</a>
								)}
							</div>

							{(details?.portfolio_url || details?.portfolio_file) && (
								<div className='gz-inq-attachments-grid mt-4'>
									{renderFileAttachment(
										'Professional Portfolio / Client Transformation Proof',
										details?.portfolio_url || details?.portfolio_file,
										faFilePdf
									)}
								</div>
							)}
						</div>
					</div>

					{/* SECTION 5: Business Potential & Supplement Sales */}
					<div className='gz-inq-card'>
						<div className='gz-inq-card-header'>
							<h5 className='gz-inq-card-title'>
								<span className='gz-inq-card-title-icon teal'>
									<FontAwesomeIcon icon={faAward} />
								</span>
								Section 5: Business Potential &amp; Supplement Sales
							</h5>
							<span className='gz-inq-badge-type'>Revenue Projections</span>
						</div>
						<div className='gz-inq-card-body'>
							<div className='mb-4'>
								<label className='gz-inq-card-label d-block mb-2'>
									How Do You Currently Acquire Clients?
								</label>
								<div className='d-flex flex-wrap gap-2'>
									{Array.isArray(details?.client_acquisition) ? (
										details.client_acquisition.map((item: string, idx: number) => (
											<span key={idx} className='gz-inq-badge-type'>
												{item}
											</span>
										))
									) : details?.client_acquisition ? (
										<span className='gz-inq-badge-type'>
											{details.client_acquisition}
										</span>
									) : (
										<span className='text-muted fs-7'>None specified</span>
									)}
								</div>
							</div>

							<div className='gz-inq-tiles-grid'>
								{renderInfoTile('Clients Interacted With Monthly', details?.monthly_client_interactions, { isMonospace: true })}
								{renderInfoTile('Clients Currently Using Supplements', details?.clients_using_supplements, { isMonospace: true })}
								{renderInfoTile('Most Common Supplement Purchased', details?.common_supplement_purchased)}
							</div>

							{details?.sales_potential && (
								<div className='gz-inq-sales-highlight'>
									<div>
										<div className='gz-inq-sales-label'>
											Estimated Monthly Supplement Sales Potential
										</div>
										<div className='gz-inq-sales-val'>
											{details.sales_potential}
										</div>
									</div>
									<span className='gz-inq-badge-read py-2 px-3 fs-7'>
										<FontAwesomeIcon icon={faAward} />
										High Potential Tier
									</span>
								</div>
							)}
						</div>
					</div>

					{/* SECTION 6: Verification & Declaration */}
					<div className='gz-inq-card'>
						<div className='gz-inq-card-header'>
							<h5 className='gz-inq-card-title'>
								<span className='gz-inq-card-title-icon rose'>
									<FontAwesomeIcon icon={faCheckCircle} />
								</span>
								Section 6: Verification &amp; Declaration
							</h5>
							<span className='gz-inq-badge-read'>
								<FontAwesomeIcon icon={faUserCheck} />
								Applicant Confirmed
							</span>
						</div>
						<div className='gz-inq-card-body'>
							<div className='gz-inq-declaration-row'>
								<div className='gz-inq-check-icon'>
									<FontAwesomeIcon icon={faCheck} />
								</div>
								<span className='gz-inq-check-text'>
									Confirmed that the submitted professional and personal information is completely accurate
								</span>
								<span className='gz-inq-badge-read ms-auto'>Agreed</span>
							</div>

							<div className='gz-inq-declaration-row'>
								<div className='gz-inq-check-icon'>
									<FontAwesomeIcon icon={faCheck} />
								</div>
								<span className='gz-inq-check-text'>
									Authorized RAG Nutrition to verify fitness credentials, certifications &amp; online presence
								</span>
								<span className='gz-inq-badge-read ms-auto'>Agreed</span>
							</div>

							<div className='gz-inq-declaration-row'>
								<div className='gz-inq-check-icon'>
									<FontAwesomeIcon icon={faCheck} />
								</div>
								<span className='gz-inq-check-text'>
									Consented to application data processing in accordance with Gomzi / RAG privacy policies
								</span>
								<span className='gz-inq-badge-read ms-auto'>Agreed</span>
							</div>
						</div>
					</div>
				</div>
			) : null}

			{/* Primary Message & Origin Source Section */}
			<div className='gz-inq-card'>
				<div className='gz-inq-card-header'>
					<h5 className='gz-inq-card-title'>
						<span className='gz-inq-card-title-icon blue'>
							<FontAwesomeIcon icon={faEnvelope} />
						</span>
						Inquiry Message &amp; Origin Source
					</h5>
					{inquiryItem?.message && (
						<button
							type='button'
							className='gz-mgmt-btn-secondary'
							style={{ height: '34px', padding: '0 12px', fontSize: '12.5px' }}
							onClick={() => copyToClipboard(inquiryItem.message, 'Message copied!')}>
							<FontAwesomeIcon icon={faCopy} />
							<span>Copy Message</span>
						</button>
					)}
				</div>
				<div className='gz-inq-card-body'>
					{inquiryItem?.source && (
						<div className='gz-inq-source-banner'>
							<span>
								<strong>Origin Form / Page:</strong>
							</span>
							<a
								href={inquiryItem.source}
								target='_blank'
								rel='noreferrer'
								className='gz-inq-source-link'>
								{inquiryItem.source}
								<FontAwesomeIcon icon={faExternalLinkAlt} className='fs-8' />
							</a>
						</div>
					)}

					<label className='gz-inq-card-label d-block mb-2'>
						Submitted Message Content
					</label>
					<div className='gz-inq-message-box'>
						{inquiryItem?.message ? (
							inquiryItem.message
						) : (
							<span className='text-muted fst-italic'>
								No raw text message attached with this inquiry submission.
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Bottom Action Bar */}
			<div className='gz-inq-bottom-bar'>
				<Link to={`${basePath}/contact-inquiry/contact`} className='gz-mgmt-btn-secondary'>
					<FontAwesomeIcon icon={faArrowLeft} />
					<span>Back to Inquiries List</span>
				</Link>

				<div className='d-flex align-items-center gap-2'>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={copyFullSummary}>
						<FontAwesomeIcon icon={faCopy} />
						<span>Copy All Details</span>
					</button>

					{inquiryItem?.read_receipt ? (
						<button
							type='button'
							className='btn-gz-mark-unread'
							onClick={handleMarkAsUnread}>
							<FontAwesomeIcon icon={faRotateLeft} />
							<span>Mark as Unread</span>
						</button>
					) : (
						<button
							type='button'
							className='btn-gz-mark-read'
							onClick={handleMarkAsRead}>
							<FontAwesomeIcon icon={faCheck} />
							<span>Mark as Read</span>
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default ContactInquiryView
export { ContactInquiryView }
