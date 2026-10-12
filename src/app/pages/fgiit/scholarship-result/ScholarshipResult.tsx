import { faDownload, faEnvelope, faEnvelopeOpen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetScholarshipResultsList } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const ScholarshipResult: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [scholarshipData, setScholarshipData] = useState<any[]>([])
	const [selectedSubject, setSelectedSubject] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const fetchScholarshipData = async () => {
		setLoading(true)
		try {
			const response = await GetScholarshipResultsList()
			let filteredData: any = response.data

			// Ensure mobile number is never negative
			filteredData = filteredData.map((data: any) => {
				if (data.mobile && parseInt(data.mobile) < 0) {
					data.mobile = '0' // or any default non-negative value
				}
				if (data.submission && typeof data.submission === 'object') {
					data.submission = Object.keys(data.submission).map((submissionKey: any) => {
						return data.submission[submissionKey]
					})
				}
				return data
			})

			setScholarshipData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchScholarshipData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	// Filter the data by subject and search term
	let filteredData = scholarshipData
		.flatMap((data: any) =>
			data.submission.map((submission: any) => ({
				...data,
				submission,
			}))
		)
		.filter((data: any) => {
			const matchesSearchTerm = data.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
			const matchesSubject =
				!selectedSubject || data.submission.course?.course_name === selectedSubject
			return matchesSearchTerm && matchesSubject
		})

	// Sort the filtered data by date in descending order
	filteredData = filteredData.sort(
		(a, b) =>
			new Date(b.submission.createdAt).getTime() - new Date(a.submission.createdAt).getTime()
	)

	// Apply pagination
	const paginatedScholarshipData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	let globalIndex = (pagination.page - 1) * pagination.itemsPerPage + 1

	const downloadExcel = () => {
		const worksheetData: any[] = []

		paginatedScholarshipData.forEach((data: any, index: number) => {
			if (data.submission) {
				const formattedData = {
					'Student Name': `${data?.first_name} ${data?.last_name || ''}` || '-',
					Mobile: `${data?.country_code} ${data?.mobile}` || '-',
					'Submission ID': data?.submission?.submission_id || '-',
					Course: data?.submission?.course?.course_name || '-',
					Date: DayJS(data?.submission?.createdAt).format('DD/MM/YYYY hh:mm:ss A') || '-',
				}

				worksheetData.push(formattedData)
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Scholarship Result</PageTitle>
			<KTCard>
				<div className='row mx-2 mt-5 align-items-center justify-content-between'>
					<div className='col-md-6'>
						<div className='row'>
							<div className='col-md-3 mt-md-1 mt-3 order-md-0 order-1'>
								<LengthMenu
									expenseData={scholarshipData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<div className='col-md-3 mt-md-1 mt-3 order-md-0 order-1'>
								<button
									className='btn btn-primary'
									onClick={downloadExcel}
									disabled={loading}>
									<FontAwesomeIcon
										icon={faDownload}
										className='fs-3'
									/>
								</button>
							</div>
						</div>
					</div>
					<div className='col-md-6 d-flex mt-8 justify-content-end order-md-1 order-0'>
						<SelectField
							className='col-7 fv-row mb-7 me-5'
							label='Subject'
							showLabel={false}
							name='Filter Subject'
							value={selectedSubject}
							onChange={(e) => setSelectedSubject(e.target.value)}
							htmlFor='Filter Subject'
							options={[
								'Anabolic Androgenic Steroids',
								'Diploma In Nutrition Course',
								'Nutri Trainer',
								'Injury Rehabilitation Masterclass',
								'Group Instructor Masterclass',
								'Diploma In Nutrition',
								'Advance Clinical Nutrition',
								'Mix Martial Arts Workshop',
								'Anabolic Androgenic Steroids Masterclass',
								'Functional Training Workshop',
								'Diploma In Personal Training',
								'Powerlifting Coach Workshop',
								'Diploma In Business Management',
								'Tabata Workshop',
								'Certified Nutrition Course',
								'TRX band workshop',
								'Python Programming',
								'Injury Rehabilitation Workshop',
								'Injury Rehab Course',
								'Certified Personal Trainer',
								'Flexible Learning',
								'Certified Wellness Consultant',
								'Gym Management Course',
								'Digital Marketing',
								'Tabata & Functional Trainer',
								'Tabata & Functional Workshop',
								'Group Instructor Workshop',
							]}
						/>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Student Name</th>
									<th>Mobile</th>
									<th>Submission ID</th>
									<th>Course</th>
									<th>Date</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={7}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedScholarshipData.map((data: any, index: any) => {
										const allData: any[] = []

										// Extract and format the data
										data.submission &&
											allData.push([
												globalIndex++,
												data?.submission?.read_receipt,
												`${data?.first_name} ${data?.last_name || ''}`,
												`${data?.country_code} ${data?.mobile}`,
												data?.submission?.submission_id,
												data?.submission?.course?.course_name || '-',
												DayJS(data?.submission?.createdAt).format('DD/MM/YYYY hh:mm:ss A'),
											])

										return allData.map((item, itemIndex) => (
											<tr key={`${index}-${item[3]}-${itemIndex}`}>
												<td className='text-center'>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item[0]}
													</span>
													{item[1] === false ? (
														<FontAwesomeIcon
															icon={faEnvelope}
															className=''
															style={{ color: '#f00000', fontSize: '18px' }}
														/>
													) : (
														<FontAwesomeIcon
															icon={faEnvelopeOpen}
															className=''
															style={{ color: '#50cd89', fontSize: '18px' }}
														/>
													)}
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item[2]}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item[3]}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item[4]}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item[5]}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item[6]}
													</span>
												</td>
												<td>
													<TableButton
														action='view'
														to={`/fgiit/scholarship-result/submissionResult?user_id=${data._id}&submission_id=${data.submission.submission_id}`}
													/>
												</td>
											</tr>
										))
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedScholarshipData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{filteredData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default ScholarshipResult
