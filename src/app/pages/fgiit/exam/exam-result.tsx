/* eslint-disable jsx-a11y/anchor-is-valid */
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetExam, GetResultExam } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

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

const StudentResults: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const exam_id: any = searchParams.get('exam_id')
	const allocation_id: any = searchParams.get('allocation_id')
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [searchTerm, setSearchTerm] = useState('')
	const [submissionData, setSubmissionData] = useState<any>({
		_id: '',
		uid: '',
		full_name: '',
		email: '',
		mobile: '',
		submission_id: '',
		course: '',
		start_time: '',
		end_time: '',
		allSubmission: [],
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
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	// Function to fetch and process exam data
	async function fetchData() {
		try {
			const response = await GetResultExam({ allocation_id })
			const filterData = response.data[0]

			if (!filterData) {
				console.error('No exam data found')
				return
			}

			// Set user submission data
			setSubmissionData({
				_id: filterData.user._id || '',
				uid: filterData.user._id || '',
				full_name: `${filterData.user.first_name} ${filterData.user.last_name}`,
				email: filterData.user.email,
				mobile: filterData.user.mobile,
				submission_id: filterData._id || '',
				course: filterData.courses?.[0] || {},
				start_time: filterData.attempt_information.start_time || '',
				end_time: filterData.attempt_information.end_time || '',
				allSubmission: filterData.exam_course || [],
			})

			const percent =
				(filterData.exam_result.question_correct / filterData.exam_result.total_question) * 100

			// Set exam analytics data
			setAnalyticData([
				{ id: 1, Analysis: 'Total Question', Value: filterData.exam_result.total_question },
				{ id: 2, Analysis: 'Attempt Question', Value: filterData.exam_result.question_submitted },
				{ id: 3, Analysis: 'Correct Answer', Value: filterData.exam_result.question_correct },
				{
					id: 4,
					Analysis: 'Wrong Answer',
					Value: filterData.exam_result.total_question - filterData.exam_result.question_correct,
				},
				{
					id: 5,
					Analysis: 'Total Point',
					Value: `${percent.toFixed(2)}%`,
				},
			])

			await fetchScholarshipData(filterData)
		} catch (error) {
			console.error('Error fetching exam data:', error)
		}
	}

	const fetchScholarshipData = async (filterData?: any) => {
		try {
			const response = await GetExam({ exam_id: exam_id })
			const data = response.data

			if (!data || !Array.isArray(data) || data.length === 0) {
				console.error('No scholarship data found')
				return
			}

			const scholar = data[0]

			// Set courseAddData
			setCourseAddData({
				course_name: scholar.courses?.[0]?.course_name || 'N/A',
				coaching_mode: scholar.courses?.[0]?.coaching_mode || 'N/A',
				amount: 'N/A',
				duration_days: scholar.options?.duration?.toString() || 'N/A',
				_id: scholar.courses?.[0]?._id || '',
			})

			// Process questions and set question data
			const questionData =
				scholar.questions?.map((question: any, index: any) => {
					const userAnswer =
						filterData?.answer_submission?.find((sub: any) => sub.question_id === question._id) ||
						{}
					const givenAnswer = userAnswer?.option_id
						? question.options.find((opt: any) => opt._id === userAnswer.option_id)?.option || '-'
						: '-'

					const correctOption = question.options.find((opt: any) => opt?.is_correct) || 'N/A'
					const compare =
						correctOption._id === userAnswer.option_id ? (
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
						Question: question.question || `Question ${index + 1}`,
						CorrectAnswer: correctOption?.option || 'N/A',
						GivenAnswer: givenAnswer,
						Result: compare,
					}
				}) || []

			setQuestionData(questionData)
		} catch (error) {
			console.error('Error fetching scholarship data:', error)
		}
	}

	useEffect(() => {
		fetchData()
	}, [exam_id])

	const handleInputChange = async (event: any) => {
		const { name, value } = event.target
		if (name === 'allSubmission') {
			await fetchScholarshipData()
		} else {
			setSubmissionData({ ...submissionData, [name]: value })
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredQuestionData = QuestionData.filter((admin: any) =>
		admin?.Question?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedQuestionData = filteredQuestionData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const CourseHandleInputChange = (event: any) => {
		const { name, value } = event.target
		setCourseAddData({ ...courseAddData, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exam Result View</PageTitle>

			<KTCard>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>User & Result Details</h2>
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
								type='date'
								className='col-12 fv-row mb-7'
								name='submission_id'
								label='Exam Start Time'
								htmlFor='submission_id'
								// value={submissionData.submission_id}
								value={DayJS(submissionData.start_time).format('YYYY-MM-DD')}
								onChange={handleInputChange}
								disabled
							/>
						</div>
						<div className='col-md-3 fv-row mb-7'>
							<InputField
								placeholder='Created At'
								type='date'
								className='col-12 fv-row mb-7'
								name='createdAt'
								label='Exam End Time'
								htmlFor='createdAt'
								value={DayJS(submissionData.end_time).format('YYYY-MM-DD')}
								onChange={handleInputChange}
								disabled
							/>
						</div>
					</div>
					<div className='text-end'>
						<TableButton
							action='view'
							to={`/fgiit/scholarship-result/UserDetails?id=${submissionData._id}`}
							text='Go to User'
							backgroundDark={true}
						/>
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
										<th className='px-3 text-dark fw-bolder ps-8 fs-4'>Analysis</th>
										<th className='px-3 text-dark fw-bolder fs-4'>Value</th>
									</tr>
								</thead>
								<tbody>
									{AnalyticData.map((data: any, index: any) => (
										<tr
											key={index}
											style={{ borderBottom: '1px solid #ddd' }}>
											<td className='px-3'>
												<span className='text-dark fw-bold  d-block ms-5 mb-1 fs-6'>
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
								{paginatedQuestionData.map((foodtime: any, index: any) => {
									const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
									return (
										<tr key={index}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
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
									)
								})}
							</tbody>
						</table>
					</div>
					{paginatedQuestionData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}

					{paginatedQuestionData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(QuestionData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default StudentResults
