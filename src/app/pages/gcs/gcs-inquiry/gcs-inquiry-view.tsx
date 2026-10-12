import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TextareaField from '../../../components/TextareaField'
import { GetContactInquiry, UpdateReadReceipt } from '../../../Functions/GCS'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const GCSInquiryView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const contactInquiry_id: any = searchParams.get('inquiry_id')!
	const [contactInquiry, setContactInquiry] = useState<any>([])

	const fetchData = async () => {
		try {
			const response: any = await GetContactInquiry({ inquiry_id: contactInquiry_id })
			setContactInquiry(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [])

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setContactInquiry({ ...contactInquiry, [name]: value })
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setContactInquiry({ ...contactInquiry, [name]: value })
	}

	const handleMarkAsRead = async () => {
		try {
			await UpdateReadReceipt({ inquiry_id: contactInquiry_id, read_receipt: true })
			setContactInquiry({ ...contactInquiry, read_receipt: true })
			toast.success('Message marked as read')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	const handleMarkAsUnread = async () => {
		try {
			await UpdateReadReceipt({ inquiry_id: contactInquiry_id, read_receipt: false })
			setContactInquiry({ ...contactInquiry, read_receipt: false })
			toast.success('Message marked as unread')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	return (
		<KTCard>
			<PageTitle breadcrumbs={[]}>Contact Inquiry</PageTitle>
			<div className='container my-7'>
				<form>
					<div className='row mt-7'>
						<InputField
							className='col-md-3 fv-row'
							label='Name'
							placeholder='Name'
							type='text'
							name='name'
							htmlFor='name'
							value={contactInquiry[0] ? contactInquiry[0].name : contactInquiry.name}
							onChange={handleInputChange}
							disabled
						/>
						<InputField
							className='col-md-3 fv-row'
							label='Email'
							placeholder='Email'
							type='email'
							name='email'
							htmlFor='email'
							value={contactInquiry[0] ? contactInquiry[0].email : contactInquiry.email}
							onChange={handleInputChange}
							disabled
						/>
						<InputField
							className='col-md-3 fv-row'
							label='Phone Number'
							placeholder='Phone Number'
							type='number'
							name='mobile'
							htmlFor='mobile'
							value={contactInquiry[0] ? contactInquiry[0].mobile : contactInquiry.mobile}
							onChange={handleInputChange}
							disabled
						/>
						<InputField
							className='col-md-3 fv-row'
							label='Subject'
							placeholder='Subject'
							type='text'
							name='subject'
							htmlFor='subject'
							value={contactInquiry[0] ? contactInquiry[0].subject : contactInquiry.subject}
							onChange={handleInputChange}
							disabled
						/>
						<InputField
							className='col-md-3 fv-row'
							label='Date'
							placeholder='Date'
							type='text'
							name='date'
							htmlFor='date'
							value={
								contactInquiry[0]
									? DayJS(contactInquiry[0].createdAt).format('DD/MM/YYYY hh:mm:ss A')
									: DayJS(contactInquiry.createdAt).format('DD/MM/YYYY hh:mm:ss A')
							}
							onChange={handleInputChange}
							disabled
						/>
						<InputField
							className='col-md-9 fv-row'
							label='Source/Page'
							placeholder='Source/Page'
							type='text'
							name='sourcePage'
							htmlFor='sourcePage'
							value={contactInquiry[0] ? contactInquiry[0].source : contactInquiry.source}
							onChange={handleInputChange}
							disabled
						/>
						<TextareaField
							className='col-md-12 fv-row'
							label='Message'
							placeholder='Message'
							name='message'
							htmlFor='message'
							value={contactInquiry[0] ? contactInquiry[0].message : contactInquiry.message}
							onChange={handleNotesChange}
						/>
					</div>
					<div className='mb-3'>
						<Link
							to='/gcs/contact'
							className='btn btn-success me-2'>
							<FontAwesomeIcon icon={faArrowLeft} /> Go Back
						</Link>
						{contactInquiry[0] ? (
							contactInquiry[0].read_receipt ? (
								<button
									type='button'
									className='btn btn-danger'
									onClick={handleMarkAsUnread}>
									<FontAwesomeIcon icon={faCheck} /> Mark as Unread
								</button>
							) : (
								<button
									type='button'
									className='btn btn-warning'
									onClick={handleMarkAsRead}>
									<FontAwesomeIcon icon={faCheck} /> Mark as Read
								</button>
							)
						) : (
							''
						)}
					</div>
				</form>
			</div>
		</KTCard>
	)
}

export default GCSInquiryView
