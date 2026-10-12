import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdajanBranchSalary } from '../../../Functions/FGGroup/AdajanBranchSalary'
import { GetAdminUsers } from '../../../Functions/FGGroup/AdminUsers'
import { GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'

export const AdajanBranchEmployeeSalaryView = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id: string | any = searchParams.get('employee_id')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [salaryData, setSalaryData] = useState<any>([])
	const [employeeData, setEmployeeData] = useState<any>({})
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('date')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [joiningTime, setJoiningTime] = useState<any>(null)
	const [expenseData, setExpenseData] = useState<any[]>([])
	const [loadingExpenses, setLoadingExpenses] = useState(false)

	const fetchSalaryData = async () => {
		setLoading(true)
		let startDate: any
		let endDate: any

		const storedDateRange = localStorage.getItem('selectedAdajanDateRange')
		if (storedDateRange) {
			const parsedRange = JSON.parse(storedDateRange)
			startDate = new Date(parsedRange.from)
			startDate.setHours(0, 0, 0, 0)

			endDate = new Date(parsedRange.to)
			endDate.setHours(23, 59, 59, 999)
		} else if (selectedDateRange) {
			startDate = new Date(selectedDateRange[0])
			startDate.setHours(0, 0, 0, 0)

			endDate = new Date(selectedDateRange[1])
			endDate.setHours(23, 59, 59, 999)
		} else {
			const now = new Date()
			startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
		}

		try {
			const response: any = await GetAdajanBranchSalary({
				from_date: DayJS(startDate).format('YYYY-MM-DD'),
				to_date: DayJS(endDate).format('YYYY-MM-DD'),
				employee_id: employee_id,
			})

			const data = response.data[0]
			setEmployeeData(data)

			const joiningDate = data?.joining_date
			let joiningDuration = ''
			if (joiningDate) {
				const start = DayJS(joiningDate, 'DD/MM/YYYY')
				const now = DayJS()
				const years = now.diff(start, 'year')
				const months = now.diff(start, 'month') % 12
				const days = now.diff(start, 'day') % 30

				if (years > 0) joiningDuration += `${years} Years`
				if (months > 0) joiningDuration += `${joiningDuration ? ', ' : ''}${months} Months`
				if (years === 0 && months === 0) joiningDuration = `${days} Days`
			}
			setJoiningTime(joiningDuration)
			// Note: Adajan branch API might need to be updated to return attendance details
			setSalaryData(data?.attendance || [])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchSalaryData()
		fetchExpenseData()
	}, [selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const fetchExpenseData = async () => {
		setLoadingExpenses(true)
		try {
			let startDate: any
			let endDate: any

			if (selectedDateRange) {
				startDate = new Date(selectedDateRange[0])
				startDate.setHours(0, 0, 0, 0)
				endDate = new Date(selectedDateRange[1])
				endDate.setHours(23, 59, 59, 999)
			} else {
				const now = new Date()
				startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
				endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
			}

			// For Adajan branch, we might need to find if there's an associated admin user
			// or if expense reports are directly linked to adajan employee ID.
			// Following HR's pattern of looking up admin user:
			const adminUsersResponse: any = await GetAdminUsers()
			const adminUser = adminUsersResponse.data.find(
				(admin: any) => admin.employee_id === employee_id
			)

			if (!adminUser) {
				setExpenseData([])
				setLoadingExpenses(false)
				return
			}

			const response: any = await GetExpenseReports({
				employee_id: adminUser._id,
				from_date: startDate,
				to_date: endDate,
				status: 'Approved',
			})

			setExpenseData(response.data || [])
		} catch (error) {
			console.error('Error fetching expense data:', error)
		}
		setLoadingExpenses(false)
	}

	useEffect(() => {
		const storedDateRange = localStorage.getItem('selectedAdajanDateRange')
		if (storedDateRange) {
			setSelectedDateRange(JSON.parse(storedDateRange))
			localStorage.removeItem('selectedAdajanDateRange')
		}
	}, [])

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredSalaryData = salaryData?.filter((admin: any) =>
		admin?.date?.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedSalaryData = filteredSalaryData?.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Over Time', field: 'OverTime' },
		{ title: 'Work Time', field: 'WorkTime' },
		{ title: 'Date', field: 'date' },
		{ title: 'Half Day', field: 'halfDay' },
		{ title: 'Status', field: 'status' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Adajan Branch Employee Salary Details</PageTitle>

			<div className='row mb-6'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-2 d-md-block d-none text-center'>
									<img
										src={
											employeeData?.employee_photo
												? `https://files.fggroup.in/${employeeData?.employee_photo}`
												: toAbsoluteUrl('/media/logos/fgiit-logo.png')
										}
										alt={employeeData?.employee_name}
										style={{ borderRadius: '10px', width: '90%' }}
									/>
								</div>
								<div className='col-12 d-md-none d-block mb-5 text-center'>
									<img
										src={
											employeeData?.employee_photo
												? `https://files.fggroup.in/${employeeData?.employee_photo}`
												: toAbsoluteUrl('/media/logos/fgiit-logo.png')
										}
										alt={employeeData?.employee_name}
										style={{ borderRadius: '5px', width: '50%' }}
									/>
								</div>
								<div className='col-md-10'>
									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<CopyableInput
												placeholder='Employee Code'
												type='text'
												name='employee_code'
												label='Employee Code'
												htmlFor='employee_code'
												value={employeeData?.employee_code}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Name'
												type='text'
												name='employee_name'
												label='Name'
												htmlFor='employee_name'
												value={employeeData?.employee_name}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Email'
												type='text'
												name='email'
												label='Email'
												htmlFor='email'
												value={employeeData?.email}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Mobile'
												type='text'
												name='mobile'
												label='Mobile'
												htmlFor='mobile'
												value={employeeData?.mobile}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Total Salary'
												type='text'
												name='total_salary'
												label='Total Salary'
												htmlFor='total_salary'
												value={employeeData?.total_salary}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Final Salary'
												type='text'
												name='final_salary'
												label='Final Salary'
												htmlFor='final_salary'
												value={employeeData?.final_salary}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='One Day Salary'
												type='text'
												name='one_day_salary'
												label='One Day Salary'
												htmlFor='one_day_salary'
												value={`${Math.round(employeeData?.total_salary / 30)}`}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Joining Date'
												type='date'
												name='joining_date'
												label={`Joining Date (${joiningTime})`}
												htmlFor='joining_date'
												value={employeeData?.joining_date}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className='container mt-7 mx-6'>
								<div className='row align-items-center mb-5'>
									<div className='col-md-6 px-0'>
										<h3 className='fw-bold fs-3'>Salary Calculation</h3>
									</div>
									<div className='col-md-4 px-0 mb-5'>
										<DateFilter
											onDateRangeChange={handleDateRangeChange}
											leftValue='-450px'
											lastMonth={true}
										/>
									</div>
								</div>

								<div className='row'>
									<div className='col-md-10 p-0'>
										<table className='table table-bordered shadow-sm mb-0'>
											<thead className='bg-light border-bottom border-black'>
												<tr className=' border-top-0'>
													<th
														scope='col'
														className='text-center border-0'>
														Description
													</th>
													<th
														scope='col'
														className='text-center border-end '>
														Amount
													</th>
												</tr>
											</thead>
											<tbody className=''>
												<tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Salary
													</td>
													<td className='text-center fs-5 fw-bold'>
														₹{employeeData?.total_salary || 0} /-
													</td>
												</tr>
												<tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Absent ({employeeData?.absent_cutting_salary?.[0]?.absent || 0} Days)
														{employeeData?.absent_cutting_salary?.[0]?.sandwichLeave ? (
															<span className='ms-2 badge bg-success text-light-success'>
																{employeeData?.absent_cutting_salary?.[0]?.sandwichLeave} Sandwich
																Leave Apply
															</span>
														) : (
															''
														)}
														{employeeData?.absent_cutting_salary?.[0]?.paidLeave ? (
															<span className='ms-2 badge bg-success text-light-success'>
																Paid Leave Apply
															</span>
														) : (
															''
														)}
													</td>
													<td className='text-center text-danger fs-5 fw-bold'>
														- ₹{employeeData?.absent_cutting_salary?.[0]?.salary || 0} /-
													</td>
												</tr>
												<tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Half-Day ({employeeData?.half_day_salary?.[0]?.halfDay || 0} Half)
														{employeeData?.half_day_salary?.[0]?.paidLeave ? (
															<span className='ms-2 badge bg-success text-light-success'>
																Paid Leave Apply
															</span>
														) : (
															''
														)}
													</td>
													<td className='text-center text-danger fs-5 fw-bold'>
														- ₹{employeeData?.half_day_salary?.[0]?.salary || 0} /-
													</td>
												</tr>
												<tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Deducted Salary
													</td>
													<td className='text-center text-danger fs-5 fw-bold'>
														- ₹{employeeData?.deducted_salary || 0} /-
													</td>
												</tr>
												<tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Approved Expenses ({employeeData?.approved_expenses_count || 0} Items)
													</td>
													<td className='text-center text-success fs-5 fw-bold'>
														+ ₹{employeeData?.total_approved_expenses || 0} /-
													</td>
												</tr>
												<tr className='border-top border-black'>
													<td className='text-center border-start-0 border-black fw-bold'>
														10% Salary
													</td>
													<td className='text-center border-0 fs-5 text-danger fw-bold'>
														- ₹{employeeData?.ten_percent_salary || 0} /-
													</td>
												</tr>
												<tr className=''>
													<td className='text-center fw-bolder border-start-0 border-black fw-bold'>
														Final Salary
													</td>
													<td className='text-center fs-4 fw-bold'>
														₹{employeeData?.final_salary || 0} /-
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='card mt-5'>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>
								Absent, Present, OverTime, Half-Day Data:
							</span>
						</h3>
					</div>
				</div>

				<div className='card-header row border-0 pt-6'>
					<div className='col-md-6 d-flex'>
						<div className='d-md-block d-none'>
							<LengthMenu
								expenseData={salaryData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-md-6 pe-md-6'>
						<div className='row justify-content-end'>
							<div className='col-md-8 my-md-0 my-5 pe-0'>
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
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedSalaryData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							removeAction={true}
							renderRow={(salary: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={index}>
									<tr className='data-row'>
										<td className='text-center align-middle'>
											<div className='d-flex align-items-center justify-content-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{salary.OverTime || '-'}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{salary.WorkTime || '-'}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{DayJS(salary.date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{salary?.halfDay ? (
													<span className='badge badge-light-danger py-3 px-4 fs-7'>Half Day</span>
												) : (
													'-'
												)}
											</span>
										</td>
										<td className='text-center align-middle'>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{salary?.status === 'A' ? (
													<span className='badge badge-light-danger py-3 px-4 fs-7'>
														{salary?.status}
													</span>
												) : (
													<span className='badge badge-light-success py-3 px-4 fs-7'>
														{salary?.status}
													</span>
												)}
											</span>
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
					{paginatedSalaryData?.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedSalaryData?.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredSalaryData?.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>

			<div className='card mt-8'>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>Approved Expense Reports</span>
						</h3>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						{expenseData && expenseData.length > 0 ? (
							<table className='table table-bordered shadow-sm mb-0'>
								<thead className='bg-light border-bottom border-black'>
									<tr className='border-black'>
										<th
											scope='col'
											className='text-center  border-black'>
											Date
										</th>
										<th
											scope='col'
											className='text-center  border-black'>
											Purpose
										</th>
										<th
											scope='col'
											className='text-center  border-black'>
											Items
										</th>
										<th
											scope='col'
											className='text-center  border-black border-end'>
											Amount
										</th>
									</tr>
								</thead>
								<tbody>
									{expenseData.map((expense: any) => (
										<tr
											key={expense._id}
											className='border-black'>
											<td className='text-center align-middle border-black'>
												{DayJS(expense.createdAt).format('DD/MM/YYYY')}
											</td>
											<td className='text-center border-black'>{expense.purpose}</td>
											<td className='text-center align-middle border-black'>
												{expense.expenses?.map((item: any, index: number) => (
													<div key={index}>
														{item.type}: {item.description} (₹{item.amount})
													</div>
												))}
											</td>
											<td className='text-center border-black fs-5 fw-bold'>
												₹{expense.total_amount || 0} /-
											</td>
										</tr>
									))}
									<tr className='border-top border-black'>
										<td
											colSpan={3}
											className='text-center border-black fw-bold'>
											Total Approved Expenses
										</td>
										<td className='text-center align-middle border-black fs-5 fw-bold text-success'>
											+ ₹{employeeData?.total_approved_expenses || 0} /-
										</td>
									</tr>
								</tbody>
							</table>
						) : (
							<div className='d-flex justify-content-center align-items-center'>
								<div className='text-center '>
									<h3 className='fw-bolder text-gray-600'>No Approved Expense Reports Found</h3>
								</div>
							</div>
						)}
					</div>

					{expenseData?.length === 0 && !loadingExpenses && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No expense reports found</b>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default AdajanBranchEmployeeSalaryView
