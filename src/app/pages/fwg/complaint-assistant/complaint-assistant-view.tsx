import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { GetAdminUsers } from '../../../Functions/FGGroup'
import { ActionComplaint, GetComplaint } from '../../../Functions/FGGroup/ComplaintAssistant'

const ComplaintAssistantViewFWG = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const complaint_id: string | any = searchParams.get('complaint_id')
	const [isSubmitting, setIsSubmitting] = useState<any>(false)
	const [complaintData, setComplaintData] = useState<any>({})
	const [replyMessageData, setReplyMessageData] = useState<any>('')

	const fetchCommentData = async () => {
		try {
			const response: any = await GetComplaint({ complaint_id })
			const filteredData: any = response.data[0]

			if (filteredData.updatedBy) {
				const adminResponse: any = await GetAdminUsers({ adminID: filteredData.updatedBy })
				return setComplaintData({ ...filteredData, full_name: adminResponse.data.full_name })
			}

			setComplaintData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchCommentData()
	}, [])

	const handleAddButtonClick = async () => {
		if (!replyMessageData) {
			toast.error('reply Message is Required')
			return
		}

		try {
			setIsSubmitting(true)
			const payload = {
				complaint_id: complaint_id,
				reply_message: replyMessageData,
			}

			await ActionComplaint(payload)

			toast.success('Reply Send Successfully')
			setReplyMessageData('')
			fetchCommentData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Complaint Assistant View</PageTitle>
			<div className='card mb-5 mb-xl-10 mt-10'>
				<div className='card mt-4'>
					<div className='card-body pb-0'>
						<div className='row mb-3'>
							<InputField
								className='col-md-3 fv-row'
								label='Name'
								placeholder='Name'
								type='text'
								name='name'
								htmlFor='name'
								value={
									complaintData?.user_id?.first_name +
										' ' +
										complaintData?.user_id?.last_name || ''
								}
								disabled
							/>
							<InputField
								className='col-md-3 fv-row'
								label='Mobile'
								placeholder='Mobile'
								type='text'
								name='name'
								htmlFor='mobile'
								value={complaintData?.user_id?.mobile || ''}
								disabled
							/>
							<InputField
								className='col-md-3 fv-row'
								label='Email'
								placeholder='Email'
								type='text'
								name='email'
								htmlFor='email'
								value={complaintData?.user_id?.email || ''}
								disabled
							/>
							<InputField
								className='col-md-3 fv-row'
								label='Created At'
								placeholder='Created At'
								type='text'
								name='createdAt'
								htmlFor='createdAt'
								value={DayJS(complaintData?.createdAt).format('MMMM D, YYYY h:mm A') || ''}
								disabled
							/>
						</div>
						<div className='mb-3 row align-items-center border-bottom'>
							<div className='col-md-4'>
								<img
									src={complaintData?.complaint_media}
									alt=''
									width='100%'
								/>
							</div>
							<div className='col-md-6'>
								<div className='text-gray-800 mb-5'>
									<p className='fs-4 fw-bold mb-1'>
										Ticket No.:{' '}
										<span className='fs-4 fw-normal'>{complaintData?.tracking_id || ''}</span>{' '}
									</p>
									<p className='fs-4 fw-bold mb-1'>
										complaint:{' '}
										<span className='fs-4 fw-normal'>{complaintData?.complaint || ''}</span>{' '}
									</p>
									<p className='fs-4 fw-bold'>
										message:{' '}
										<span className='fs-4 fw-normal'>{complaintData?.message || ''}</span>{' '}
									</p>
								</div>
							</div>
						</div>
						<div className='mt-2'>
							<p className='fs-6 text-gray-800 fw-bold mb-4'>Replies:</p>
						</div>
						<div className='mb-7 ps-10'>
							{complaintData?.reply_message ? (
								<div className='d-flex mb-5'>
									<div className='d-flex flex-column flex-row-fluid'>
										<div className='d-flex align-items-center flex-wrap mb-1'>
											<p className='mb-0 text-gray-800  fw-bold me-2'>
												{complaintData?.full_name}
											</p>
											<span className='text-gray-400 fw-semibold fs-7'>
												{DayJS(complaintData?.updatedAt).format('MMMM D, YYYY h:mm A')}
											</span>
										</div>
										<span className='text-gray-800 fs-7 fw-normal pt-1'>
											{complaintData?.reply_message}
										</span>
									</div>
								</div>
							) : (
								<p>No replies found</p>
							)}
						</div>

						{!complaintData?.reply_message && (
							<>
								<div className='separator mb-4'></div>
								<form className='mb-6 row'>
									<div className='col-md-10'>
										<textarea
											className='form-control px-3'
											name='reply_message'
											rows={1}
											value={replyMessageData}
											onChange={(e) => setReplyMessageData(e.target.value)}
											placeholder='Reply..'></textarea>
									</div>

									<div className='col-md-2 mt-md-0 mt-3'>
										<TableButton
											action='add'
											onClick={() => handleAddButtonClick()}
											text={isSubmitting ? 'Sending...' : 'Send'}
											showIcon={false}
											disabled={isSubmitting}
											className={`btn-block mb-4 w-100 ${isSubmitting ? 'disabled' : ''}`}
										/>
									</div>
								</form>
							</>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
export default ComplaintAssistantViewFWG
