/* eslint-disable jsx-a11y/anchor-is-valid */
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import { GetScholarshipResult, UpdateReadReceiptOfScholarship } from '../../../Functions/FGGroup'

type Submission = {
	[key: string]: {
		course: {
			course_name: string
			coaching_mode: string
			amount: string
			duration_days: string
		}
		response: any
		result: any
		createdAt: string
	}
}

type Scholar = {
	_id: string
	uid: string
	first_name: string
	last_name: string
	email: string
	mobile: string
	submission: Submission
}

const SubmissionResult: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const user_id = searchParams.get('user_id')
	const submission_id: any = searchParams.get('submission_id')
	const [submissionData, setSubmissionData] = useState<any>({
		_id: '',
		uid: '',
		full_name: '',
		email: '',
		mobile: '',
		submission_id: '',
		course: '',
		createdAt: '',
		allSubmission: [],
		read_receipt: '',
	})
	const [courseAddData, setCourseAddData] = useState({
		course_name: '',
		coaching_mode: '',
		amount: '',
		duration_days: '',
		_id: '',
	})
	const [AnalyticData, setAnalyticData] = useState([
		{ id: 1, Analysis: 'Total Question', Value: 0 },
		{ id: 2, Analysis: 'Attempt Question', Value: 0 },
		{ id: 3, Analysis: 'Correct Answer', Value: 0 },
		{ id: 4, Analysis: 'Wrong Answer', Value: 0 },
		{ id: 5, Analysis: 'Total Point', Value: 0 },
		{ id: 6, Analysis: 'Scholarship Applied', Value: '' },
		{ id: 7, Analysis: 'Discount', Value: 0 },
		{ id: 8, Analysis: 'Failed to Evaluate', Value: 0 },
	])
	const [QuestionData, setQuestionData] = useState([
		{
			Question: '',
			CorrectAnswer: '',
			GivenAnswer: '',
			Result: '',
		},
	])

	const handleMarkAsRead = async () => {
		try {
			await UpdateReadReceiptOfScholarship({ submission_id: submission_id, read_receipt: true })
			setSubmissionData({ ...submissionData, read_receipt: true })
			toast.success('Result marked as read')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	const handleMarkAsUnread = async () => {
		try {
			await UpdateReadReceiptOfScholarship({ submission_id: submission_id, read_receipt: false })
			setSubmissionData({ ...submissionData, read_receipt: false })
			toast.success('Result marked as unread')
		} catch (error: any) {
			console.error(error)
			toast.error(error.message)
		}
	}

	const fetchScholarshipData = async (id: any = user_id, sub_id: any = submission_id) => {
		try {
			const response = await GetScholarshipResult({ user_id: id })
			let data = response.data
			data = [data]
			if (data && Array.isArray(data) && data.length > 0) {
				const ScholarData = data
				const scholar = ScholarData[0]
				const submissionCourse = Object.keys(scholar.submission)
				const submissionKey = sub_id || Object.keys(scholar.submission)[0]
				const submission = scholar.submission[submissionKey]

				setSubmissionData({
					_id: scholar._id,
					uid: scholar.uid,
					full_name: `${scholar.first_name} ${scholar.last_name}`,
					email: scholar.email,
					mobile: scholar.mobile,
					submission_id: submissionKey,
					course: scholar.submission,
					createdAt: submission?.createdAt,
					allSubmission: submissionCourse,
					read_receipt: submission.read_receipt,
				})

				setCourseAddData({
					course_name: submission?.course?.course_name,
					coaching_mode: submission?.course?.coaching_mode,
					amount: submission?.course?.amount,
					duration_days: submission?.course?.duration_days,
					_id: submission?.course?._id,
				})

				setAnalyticData([
					{ id: 1, Analysis: 'Total Question', Value: submission.result.totalQuestion },
					{ id: 2, Analysis: 'Attempt Question', Value: submission.result.attempt },
					{ id: 3, Analysis: 'Correct Answer', Value: submission.result.trueCount },
					{ id: 4, Analysis: 'Wrong Answer', Value: submission.result.falseCount },
					{ id: 5, Analysis: 'Total Point', Value: submission.result.point },
					{
						id: 6,
						Analysis: 'Scholarship Applied',
						Value: submission.result.scholarship_applied ? 'yes' : 'no',
					},
					{ id: 7, Analysis: 'Discount', Value: submission.result.discount_rate + '%' },
					{ id: 8, Analysis: 'Failed to Evaluate', Value: submission.result.question_not_found },
				])

				const QuestionFilterData = submission?.response.map((el: any) => {
					const givenAnswers = el.question.option.filter((answer: any) => answer.isAnswer)
					const givenAnswerValues = givenAnswers.map((answer: any) => answer.option)

					const compare =
						el.answer === givenAnswerValues[0] ? (
							<span className='text-success fw-bolder'>
								<FontAwesomeIcon
									icon={faCheck}
									className='fs-3'
								/>
							</span>
						) : (
							<span className='text-danger fw-bolder'>
								<FontAwesomeIcon
									icon={faXmark}
									className='fs-3'
								/>
							</span>
						)

					return {
						Question: el.question.question,
						CorrectAnswer: el.answer,
						GivenAnswer: givenAnswerValues[0],
						Result: compare,
					}
				})
				setQuestionData(QuestionFilterData)
			} else {
				console.error('No scholarship data found')
			}
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchScholarshipData()
	}, [user_id])

	const handleInputChange = async (event: any) => {
		const { name, value } = event.target
		if (name === 'allSubmission') {
			await fetchScholarshipData(user_id, value)
		} else {
			setSubmissionData({ ...submissionData, [name]: value })
		}
	}

	const CourseHandleInputChange = (event: any) => {
		const { name, value } = event.target
		setCourseAddData({ ...courseAddData, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Submission Result View</PageTitle>

			<KTCard>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>
						User & Submission Details
					</h2>
					<div className='row'>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='User ID'
								type='text'
								className='col-12 fv-row mb-7'
								name='uid'
								label='User ID'
								htmlFor='uid'
								value={submissionData.uid}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Full Name'
								type='text'
								className='col-12 fv-row mb-7'
								name='full_name'
								label='Full Name'
								htmlFor='full_name'
								value={submissionData.full_name}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Email'
								type='text'
								className='col-12 fv-row mb-7'
								name='email'
								label='Email'
								htmlFor='email'
								value={submissionData.email || 'N/A'}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Mobile'
								type='text'
								className='col-12 fv-row mb-7'
								name='mobile'
								label='Mobile'
								htmlFor='mobile'
								value={submissionData.mobile || 'N/A'}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Submission ID'
								type='text'
								className='col-12 fv-row mb-7'
								name='submission_id'
								label='Submission ID'
								htmlFor='submission_id'
								value={submissionData.submission_id}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Created At'
								type='text'
								className='col-12 fv-row mb-7'
								name='createdAt'
								label='Created At'
								htmlFor='createdAt'
								value={submissionData.createdAt}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-5 fv-row mb-7'>
							<label
								htmlFor='Other Submission'
								className='required fw-bold fs-6 mb-5'>
								Other Submission
							</label>
							<select
								className='form-control form-select form-control-solid mb-3 mb-lg-0'
								name='allSubmission'
								value={submissionData.submission_id}
								onChange={handleInputChange}>
								{submissionData.allSubmission.map((el: any) => {
									const course = submissionData.course[el]?.course
									if (course) {
										return (
											<option
												key={el}
												value={el}>
												{course.course_name} [{el}]
											</option>
										)
									}
									return null
								})}
							</select>
						</div>
					</div>
					<div className='text-end'>
						<TableButton
							action='view'
							text='Go Back'
							to='/fgiit/scholarship-result'
							backgroundDark={true}
							showIcon={false}
						/>
						{submissionData ? (
							submissionData.read_receipt ? (
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
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>Course Details</h2>
					<div className='row'>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Course Name'
								type='text'
								className='col-12 fv-row mb-7'
								name='course_name'
								label='Course Name'
								htmlFor='course_name'
								value={courseAddData.course_name}
								onChange={CourseHandleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Coaching Mode'
								type='text'
								className='col-12 fv-row mb-7'
								name='coaching_mode'
								label='Coaching Mode'
								htmlFor='coaching_mode'
								value={courseAddData.coaching_mode}
								onChange={CourseHandleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Amount (Current)'
								type='text'
								className='col-12 fv-row mb-7'
								name='amount'
								label='Amount (Current)'
								htmlFor='amount'
								value={courseAddData.amount}
								onChange={CourseHandleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Course Duration'
								type='text'
								className='col-12 fv-row mb-7'
								name='duration_days'
								label='Course Duration'
								htmlFor='duration_days'
								value={courseAddData.duration_days}
								onChange={CourseHandleInputChange}
								disabled
							/>
						</div>
					</div>
					<div className='text-end'>
						<div className='text-end'>
							<TableButton
								action='view'
								to={`/fgiit/fitness-courses?course_id=${courseAddData._id}`}
								text='View Course'
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>Overall Analytics</h2>
					<div style={{ border: '1px solid #000', borderRadius: '5px' }}>
						<div className='table-responsive'>
							<table
								id='kt_table_users'
								className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
								<thead style={{ borderBottom: '1px solid #ddd' }}>
									<tr className='fw-bold text-muted'>
										<th className='px-3 text-dark fs-4'>Analysis</th>
										<th className='px-3 text-dark fs-4'>Value</th>
									</tr>
								</thead>
								<tbody>
									{AnalyticData.map((data: any, index: any) => (
										<tr
											key={index}
											style={{ borderBottom: '1px solid #ddd' }}>
											<td className='px-3'>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.Analysis}
												</span>
											</td>
											<td className='px-3'>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.Value}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{AnalyticData.length === 0 && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						)}
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<h2 className='fw-bold text-dark fs-1 mb-0 m-6 '>Questions</h2>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th>No.</th>
									<th>Question</th>
									<th>Correct Answer</th>
									<th>Given Answer</th>
									<th>Result</th>
								</tr>
							</thead>
							<tbody>
								{QuestionData.map((foodtime: any, index: any) => (
									<tr key={index}>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{index + 1}
											</span>
										</td>
										<td>
											<span
												className='text-dark fw-bold  d-block mb-1 fs-6'
												data-bs-toggle='modal'
												data-bs-target='#kt_modal_food_time'>
												{foodtime.Question}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.CorrectAnswer}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.GivenAnswer}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{foodtime.Result}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{QuestionData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default SubmissionResult
