import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdajanBranchSalary } from '../../../Functions/FGGroup/AdajanBranchSalary'

export const AdajanBranchEmployeeSalary = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salaryData, setSalaryData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedSubject, setSelectedSubject] = useState('')
	const [selectedStatus, setSelectedStatus] = useState('')
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchSalaryData = async (page?: number) => {
		setLoading(true)
		let startDate: any
		let endDate: any

		if (selectedDateRange) {
			startDate = new Date(selectedDateRange[0])
			startDate.setHours(0, 0, 0, 0)

			endDate = new Date(selectedDateRange[1])
			endDate.setHours(23, 59, 59, 999)
		} else {
			const now = new Date()
			// Get of last month by default
			startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
		}

		const query: any = {
			from_date: DayJS(startDate).format('YYYY-MM-DD'),
			to_date: DayJS(endDate).format('YYYY-MM-DD'),
		}

		try {
			const salaryResponse: any = await GetAdajanBranchSalary(query)
			const salaryRecords = salaryResponse?.data || []
			setSalaryData(Array.isArray(salaryRecords) ? salaryRecords : [])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchSalaryData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedSubject,
	])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			fetchSalaryData()
		}
	}, [searchTerm])

	const filteredData = salaryData.filter((item: any) =>
		(item.employee_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
	)
	const paginatedData = filteredData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const sortableFields = [
		{ title: 'Employee', field: 'employee_name' },
		{ title: 'Salary', field: 'total_salary' },
		{ title: 'Final Salary', field: 'final_salary' },
		{ title: 'Present', field: 'total_present' },
		{ title: 'Absent', field: 'total_absent' },
		{ title: 'Period', field: 'period' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Adajan Branch Employee Salary</PageTitle>
			<div className='card'>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>
								Adajan Branch Employee Salary Sheet
							</span>
						</h3>
					</div>
				</div>

				<div className='card-header row border-0 pt-6'>
					<div className='col-md-6 d-flex'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='d-md-block d-none'>
							<LengthMenu
								expenseData={salaryData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-md-6 pe-md-6'>
						<div className='row justify-content-end'>
							<div className='col-md-6 my-md-0 my-5 pe-0'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									leftValue='-600px'
									lastMonth={true}
								/>
							</div>
						</div>
					</div>
					<div className='col-md-3 d-flex d-md-none justify-content-between p-0'>
						<LengthMenu
							expenseData={salaryData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				</div>

				<div className='card-body py-3'>
					<div className='table-responsive'>
						<Table
							data={paginatedData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(salary: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={salary?.employee_id}>
									<tr
										onClick={() => handleRowClick(salary?.employee_id)}
										className='data-row'>
										<td className='text-center align-middle'>
											<div className='d-flex align-items-center justify-content-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>

										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={
															salary?.employee_photo
																? `https://files.fggroup.in/${salary?.employee_photo}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt={salary?.employee_name}
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{salary?.employee_name} {salary?.employee_code ? ` - ${salary?.employee_code}` : ''}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{salary?.mobile}
													</span>
												</div>
											</div>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_salary ? salary?.total_salary : '-'}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.final_salary !== undefined && salary?.final_salary !== null && salary?.final_salary !== '-'
													? salary?.final_salary
													: '-'}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_present !== undefined && salary?.total_present !== null
													? salary?.total_present
													: '-'}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.total_absent === 0
													? 0
													: salary?.total_absent
														? salary?.total_absent
														: '-'}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.period ? salary?.period : '-'}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												onClick={() => {
													if (selectedDateRange) {
														localStorage.setItem(
															'selectedAdajanDateRange',
															JSON.stringify({
																from: DayJS(selectedDateRange[0]).format('YYYY-MM-DD'),
																to: DayJS(selectedDateRange[1]).format('YYYY-MM-DD'),
															})
														)
													}
													window.location.href = `/adajan-branch/employee-salary-view?employee_id=${salary?.employee_id}`
												}}
											/>
										</td>
									</tr>
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{paginatedData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(salaryData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default AdajanBranchEmployeeSalary
