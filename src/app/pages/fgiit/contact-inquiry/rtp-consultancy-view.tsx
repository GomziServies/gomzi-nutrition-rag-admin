import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TextareaField from '../../../components/TextareaField'
import { GetRTPConsultancy } from '../../../Functions/FGGroup'
import TableButton from '../../../components/TableButton'

const RTPConsultancyView: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const booking_id: string | any = searchParams.get('id')
	const [userData, setUserData] = useState<any>({})
	const [rtpBooking, setRTPBooking] = useState({
		name: '',
		email: '',
		book_title: '',
		description: '',
		mobile: '',
		subject: '',
		file_url: '',
		source: '',
		message: '',
	})

	const fetchBookData = async () => {
		try {
			const response: FGGroupAPIResponse = await GetRTPConsultancy({ booking_id: booking_id })
			const data: any = response.data
			setRTPBooking(data[0])
			setUserData(data[0]?.user)
		} catch (error) {
			console.error(error)
		}
	}
	useEffect(() => {
		fetchBookData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setRTPBooking((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setRTPBooking({ ...rtpBooking, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>RTP Consultancy Bookings</PageTitle>
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='row'>
									<InputField
										placeholder='Name'
										type='text'
										className='col-md-3 fv-row mb-7'
										name='name'
										label='Name'
										htmlFor='name'
										value={userData.first_name + ' ' + userData.last_name || 'N/A'}
										onChange={(e) => handleInputChange(e)}
										readOnly
									/>
									<InputField
										placeholder='Email'
										type='text'
										className='col-md-3 fv-row mb-7'
										name='email'
										label='Email'
										htmlFor='email'
										value={userData.email || '-'}
										onChange={handleInputChange}
										readOnly
									/>
									<InputField
										placeholder='Mobile Number'
										type='number'
										className='col-md-3 fv-row mb-7'
										name='mobile'
										label='Mobile Number'
										htmlFor='mobile'
										value={userData.mobile || '-'}
										onChange={(e) => handleInputChange(e)}
										readOnly
									/>
									<InputField
										placeholder='Subject'
										type='text'
										className='col-md-3 fv-row mb-7'
										name='subject'
										label='Subject'
										htmlFor='subject'
										value={rtpBooking.subject || '-'}
										onChange={(e) => handleInputChange(e)}
										readOnly
									/>
								</div>
								<InputField
									placeholder='Source/Page'
									type='text'
									className='col-md-6 fv-row mb-7'
									name='source'
									label='Source/Page'
									htmlFor='source'
									value={rtpBooking.source || '-'}
									onChange={(e) => handleInputChange(e)}
									readOnly
								/>
								<div className='col-md-6 fv-row mb-7'>
									<label
										htmlFor='download_file'
										className='required fw-bold fs-6 mb-5'>
										<b>File</b>
									</label>
									<a
										href={'https://files.fggroup.in/' + rtpBooking.file_url}
										download
										target='blank'
										className='form-control btn btn-success mx-2 mb-4'>
										Download
									</a>
								</div>
								<TextareaField
									className='col-md-12 fv-row'
									label='Message'
									placeholder='Message'
									name='message'
									htmlFor='message'
									value={rtpBooking.message || '-'}
									onChange={handleNotesChange}
									readOnly
								/>
								<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
									<TableButton
										action="view"
										text="Back"
										to='/fgiit/rtp-consultancy'
										backgroundDark={true}
										showIcon={false}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default RTPConsultancyView
