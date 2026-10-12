import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployerApplications } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployerInquiry: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [employerData, setEmployerData] = useState([])
	const [loading, setLoading] = useState(false)

	const fetchData = async () => {
		setLoading(true)
		try {
			const auth: any = await GetEmployerApplications()
			setEmployerData(auth.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredEmployerData = employerData.filter(
		(employerData: any) =>
			employerData.name && employerData.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedemployerData = filteredEmployerData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employer Inquiry</PageTitle>
			<KTCard>
				<div className='mx-8 m-5'>
					<div className='me-5'>
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
									<th>name</th>
									<th>Email</th>
									<th>Mobile</th>
									<th>Expected Salary (INR)</th>
									<th>Type</th>
									<th>Job Post</th>
									<th>Created On</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{loading ? (
									<tr>
										<td
											colSpan={12}
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
									paginatedemployerData
										.slice()
										.reverse()
										.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark ms-4 fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{data.name}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{data.email}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{data.mobile}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{data.estimated_salary}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{data.type}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{data.job_post}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold   mb-1 fs-6'>
															{DayJS(data.createdAt).format('DD-MM-YYYY  hh:mm:ss A')}
														</span>
													</td>
													<td>
														<div className='d-flex justify-content-center'>
															<TableButton
																action='view'
																to={'/fgiit/employer-inquiry-view?employer_id=' + data._id}
																text='Explore'
																showIcon={false}
																backgroundDark={true}
															/>
														</div>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{paginatedemployerData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedemployerData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(employerData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default EmployerInquiry
