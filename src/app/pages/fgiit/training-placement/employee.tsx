import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployeeApplication } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployeeInquiry: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [employeeData, setEmployeeData] = useState([])
	const [loading, setLoading] = useState(false)

	const fetchData = async () => {
		setLoading(true)
		try {
			const auth: any = await GetEmployeeApplication()
			setEmployeeData(auth.data)
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

	const filteredEmployeeData = employeeData.filter(
		(employeeData: any) =>
			employeeData.name && employeeData.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedemployeeData = filteredEmployeeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Inquiry</PageTitle>
			<KTCard>
				<div className='mx-3 m-5'>
					<div className='ms-5'>
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
									paginatedemployeeData
										.slice()
										.reverse()
										.map((data: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
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
															{data.expected_salary}
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
																to={'/fgiit/employee-inquiry-view?employee_id=' + data._id}
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
					{paginatedemployeeData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedemployeeData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(employeeData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default EmployeeInquiry
