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
import { GetSalary } from '../../../Functions/FGGroup/Attendance'
import { GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'
import { GetAdminUsers } from '../../../Functions/FGGroup/AdminUsers'

const HREmployeeSalaryView = () => {
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

	const fetchSalaryData = async (page?: number) => {
		setLoading(true)
		let startDate: any
		let endDate: any

		const storedDateRange = localStorage.getItem('selectedDateRange')
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
			// Get of This month
			// startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			// endDate = new Date()

			// Get of last month
			startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
		}
		try {
			const response: any = await GetSalary({
				from_date: startDate,
				to_date: endDate,
				employee_id: employee_id,
			})

			const data = response.data

			setEmployeeData(data[0])

			const joiningDate = data[0]?.joining_date

			let joiningDuration = ''
			if (joiningDate) {
				const start = DayJS(joiningDate)
				const now = DayJS()
				const years = now.diff(start, 'year')
				const months = now.diff(start, 'month') % 12
				const days = now.diff(start, 'day') % 30

				if (years > 0) joiningDuration += `${years} Years`
				if (months > 0) joiningDuration += `${joiningDuration ? ', ' : ''}${months} Months`
				if (years === 0 && months === 0) joiningDuration = `${days} Days`
			}

			setJoiningTime(joiningDuration)
			setSalaryData(data[0].attendance)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchSalaryData()
		fetchExpenseData()
	}, [selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const storedDateRange = localStorage.getItem('selectedDateRange')
	useEffect(() => {
		if (storedDateRange) {
			setSelectedDateRange(JSON.parse(storedDateRange))
			localStorage.removeItem('selectedDateRange')
		}
	}, [storedDateRange])

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

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setEmployeeData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
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

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	// Fetch expense reports for the employee
	const fetchExpenseData = async () => {
		setLoadingExpenses(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

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
			
			const adminUsersResponse: any = await GetAdminUsers()
			
			// Find the admin user that has the employee_id field matching our employee_id
			const adminUser = adminUsersResponse.data.find((admin: any) => admin.employee_id === employee_id)
			
			if (!adminUser) {
				setExpenseData([])
				setLoadingExpenses(false)
				return
			}
			
			const adminId = adminUser._id

			const response: any = await GetExpenseReports({
				employee_id: adminId,
				from_date: startDate,
				to_date: endDate,
				status: 'Approved'
			})

			setExpenseData(response.data || [])
		} catch (error) {
			console.error('Error fetching expense data:', error)
		}
		setLoadingExpenses(false)
	}

	// -- salary slip --
	// const generatePDF = (name: any) => {
	// 	const invoiceContent = document.getElementById('invoiceContent')

	// 	if (invoiceContent) {
	// 		invoiceContent.classList.add('pdf-font-black')

	// 		const doc = new jsPDF({
	// 			orientation: 'portrait',
	// 			unit: 'mm',
	// 			format: 'a4',
	// 		})

	// 		// Add margins
	// 		const margin = 10
	// 		const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
	// 		const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

	// 		html2canvas(invoiceContent, { scale: 2, useCORS: true }).then((canvas) => {
	// 			const imgData = canvas.toDataURL('image/jpeg', 1)

	// 			invoiceContent.classList.remove('pdf-font-black')

	// 			doc.addImage(imgData, 'jpeg', margin, margin, contentWidth, contentHeight)

	// 			const pdfName = `${name || 'demoName'}.pdf`
	// 			doc.save(pdfName)
	// 		})
	// 	} else {
	// 		console.error('Invoice content not found.')
	// 	}
	// }

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Salary Details</PageTitle>

			<div className='row mb-6'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-2 d-md-block d-none text-center'>
									<img
										src={
											employeeData?.photo
												? `https://files.fggroup.in/${employeeData?.photo}`
												: toAbsoluteUrl('/media/logos/fgiit-logo.png')
										}
										alt={employeeData?.Name}
										style={{ borderRadius: '10px', width: '90%' }}
									/>
								</div>
								<div className='col-12 d-md-none d-block mb-5 text-center'>
									<img
										src={
											employeeData?.photo
												? `https://files.fggroup.in/${employeeData?.photo}`
												: toAbsoluteUrl('/media/logos/fgiit-logo.png')
										}
										alt={employeeData?.Name}
										style={{ borderRadius: '5px', width: '50%' }}
									/>
								</div>
								<div className='col-md-10'>
									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<CopyableInput
												placeholder='Employee Code'
												type='text'
												className='col-12 fv-row mb-7'
												name='employee_code'
												label='Employee Code'
												htmlFor='employee_code'
												value={employeeData?.employee_code}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Name'
												type='text'
												className='col-12 fv-row mb-7'
												name='full_name'
												label='Name'
												htmlFor='full_name'
												value={employeeData?.full_name}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Email'
												type='text'
												className='col-12 fv-row mb-7'
												name='email'
												label='Email'
												htmlFor='email'
												value={employeeData?.email}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Mobile'
												type='text'
												className='col-12 fv-row mb-7'
												name='mobile'
												label='Mobile'
												htmlFor='mobile'
												value={employeeData?.mobile}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Total Salary'
												type='text'
												className='col-12 fv-row mb-7'
												name='total_salary'
												label='total_salary'
												htmlFor='Total Salary'
												value={employeeData?.total_salary}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Final Salary'
												type='text'
												className='col-12 fv-row mb-7'
												name='final_salary'
												label='Final Salary'
												htmlFor='final_salary'
												value={employeeData?.final_salary}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='One Day Salary'
												type='text'
												className='col-12 fv-row mb-7'
												name='final_salary'
												label='One Day Salary'
												htmlFor='final_salary'
												value={`${Math.round(employeeData?.total_salary / 30)}`}
												onChange={handleInputChange}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												className='col-12 fv-row'
												placeholder='Joining Date'
												type='date'
												name='joining_date'
												label={`Joining Date (${joiningTime})`}
												htmlFor='joining_date'
												value={employeeData?.joining_date}
												onChange={handleInputChange}
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
														Task {employeeData?.task_rating?.rating || 0}% Rating Salary (
														{employeeData?.task_rating?.percentage?.value || 0}%)
													</td>
													{employeeData?.task_rating?.percentage?.type === 'plus' ? (
														<td className='text-center text-success fs-5 fw-bold'>
															+ ₹{employeeData?.task_rating?.task_rating_salary || 0} /-
														</td>
													) : (
														<td className='text-center text-danger fs-5 fw-bold'>
															- ₹{employeeData?.task_rating?.task_rating_salary || 0} /-
														</td>
													)}
												</tr>
												{/* Expense Information Section */}
												<tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Approved Expenses ({employeeData?.approved_expenses_count || 0} Items)
													</td>
													<td className='text-center text-success fs-5 fw-bold'>
														+ ₹{employeeData?.total_approved_expenses || 0} /-
													</td>
												</tr>
												{/* <tr>
													<td className='text-center fw-bold border-start-0 border-black'>
														Additional Salary
													</td>
													<td className='text-center text-success fs-5 fw-bold'>
														+ ₹{employeeData?.additional_salary || 0} /-
													</td>
												</tr> */}
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
														{/* ₹{employeeData?.final_salary || 0} /- */}₹
														{employeeData?.final_salary} /-
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

			<div className='card'>
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
								{/* <input type="month" name="" id="" /> */}
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
								<React.Fragment key={salary?._id}>
									<tr
										onClick={() => handleRowClick(salary?._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary.OverTime}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary.WorkTime}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(salary.date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.halfDay ? (
													salary?.status === 'Leave' || salary?.status === 'A' ? (
														<span className='badge badge-light-danger py-3 px-4 fs-7'>
															Half Day
														</span>
													) : (
														<span className='badge badge-light-success py-3 px-4 fs-7'>
															Half Day
														</span>
													)
												) : (
													'-'
												)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{salary?.status === 'Leave' || salary?.status === 'A' ? (
													DayJS(salary.date).format('dddd') == 'Sunday' ? (
														<span className='badge badge-light-danger py-3 px-4 fs-7'>
															{DayJS(salary.date).format('dddd')}
														</span>
													) : (
														<span className='badge badge-light-danger py-3 px-4 fs-7'>
															{salary?.status}
														</span>
													)
												) : DayJS(salary.date).format('dddd') == 'Sunday' ? (
													<>
														<span className='badge badge-light-success py-3 px-4 fs-7'>
															{DayJS(salary.date).format('dddd')} - {salary?.status}
														</span>
													</>
												) : (
													<span className='badge badge-light-success py-3 px-4 fs-7'>
														{salary?.status}
													</span>
												)}
											</span>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-5'>
															<img
																src={
																	salary?.photo
																		? `https://files.fggroup.in/${salary?.photo}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt={salary?.full_name}
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{salary?.full_name}</span>
															<span className='text-muted fw-semibold text-muted d-block fs-7'>
																{salary?.mobile}
															</span>
														</div>
													</div>
													<strong>{sortableFields[1].title}:</strong>{' '}
													{salary?.total_salary ? salary?.total_salary : '-'}
													<br />
													<strong>{sortableFields[2].title}:</strong>{' '}
													{salary?.final_salary ? salary?.final_salary : '-'}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{salary?.halfDay
														? salary?.total_present
															? 'Half Day / ' + salary?.total_present
															: '-'
														: salary?.total_present
														? salary?.total_present
														: '-'}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{salary?.total_absent == 0
														? 0
														: salary?.total_absent
														? salary?.total_absent
														: '-'}
													<br />
													<strong>{sortableFields[5].title}:</strong>{' '}
													{salary?.period ? salary?.period : '-'}
												</div>
											</td>
										</tr>
									)}
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
							totalPages={Math.ceil(salaryData?.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>

			{/* Expense Information Section */}
			<div className='card mt-8'>
				<div className='row justify-content-between mt-7 mx-6'>
					<div className='col-md-9'>
						<h3 className='card-title align-items-start flex-column'>
							<span className='card-label fw-bold fs-3 mb-1'>
								Approved Expense Reports
							</span>
						</h3>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						{expenseData && expenseData.length > 0 ? (
							<table className='table table-bordered shadow-sm mb-0'>
								<thead className='bg-light border-bottom border-black'>
									<tr className='border-black'>
										<th scope='col' className='text-center  border-black'>Date</th>
										<th scope='col' className='text-center  border-black'>Purpose</th>
										<th scope='col' className='text-center  border-black'>Items</th>
										<th scope='col' className='text-center  border-black border-end'>Amount</th>
									</tr>
								</thead>
								<tbody>
									{expenseData.map((expense: any) => (
										<tr key={expense._id} className='border-black'>
											<td className='text-center border-black'>
												{DayJS(expense.createdAt).format('DD/MM/YYYY')}
											</td>
											<td className='text-center border-black'>{expense.purpose}</td>
											<td className='text-center border-black'>
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
										<td colSpan={3} className='text-center border-black fw-bold'>
											Total Approved Expenses
										</td>
										<td className='text-center border-black fs-5 fw-bold text-success'>
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

			{/* -- salary slip -- */}
			{/* <div className='col-md-6 mt-3'>
				<div className='card'>
					<div className='card-body'>
						<div id='invoiceContent'>
							<p className='fw-bold fs-5 text-center mb-2'>Salary Slip</p>
							<div className='border'>
								<div className='invoice-header row p-3 pt-0'>
									<div className='bill-to'>Company Informaton</div>
									<div className='col-md-8 mt-2'>
										<p className='fs-4 mb-1'>
											<b>Fitness with Gomzi International Institute of Teaching</b>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mt-1 mb-1'>
											A- 301, Ambrosia Business Hub, VIP Road, beside SMC Garden, Vesu, Surat,
											Gujarat 395007
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Phone no.:
											<strong>8866842520</strong>
										</p>
										<p
											style={{ fontSize: '12px' }}
											className='mb-1'>
											Email:
											<strong id='emailLabel'>fitnesswithgomzi@gmail.com</strong>
										</p>
									</div>
									<div className='col-md-4'>
										<div className='text-center'>
											<img
												src='/media/logos/fgiit-logo.png'
												width='60%'
												alt='Company Logo'
											/>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-12 border px-0'>
										<div className='bill-to'>Employee Informaton</div>
										<div className='bill-name-date px-2'>
											<p>
												<strong>Name :</strong>
												<span
													className='mt-2 px-2'
													style={{ fontSize: '14px' }}
													id='inv-name'>
													{employeeData?.full_name || 'Brijesh Prajapati'}
												</span>
											</p>
											<p className=''>
												<strong>Address :-</strong>
												<span id='inv-n'>
													{employeeData?.address || '89, Akhand Anand Soc, Dabholi Road, Surat.'}
												</span>
											</p>
											<p className=''>
												<strong>Phone No. :-</strong>
												<span id='inv-mobile'>{employeeData?.mobile || '-'}</span>
											</p>
											<p>
												<strong>Email :</strong>
												<span
													className='px-2'
													style={{ fontSize: '14px' }}
													id='inv-email'>
													{employeeData?.email || '-'}
												</span>
											</p>
										</div>
									</div>
								</div>
								<div className='invoice-items'>
									<table>
										<thead>
											<tr>
												<th>Earnings</th>
												<th>Amount</th>
												<th>Deductions</th>
												<th>Amount</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<div>Basic</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div>Provident Fund</div>
												</td>
												<td>
													<span>{employeeData.net_amount || '20,000'}</span>
												</td>
											</tr>
											<tr>
												<td>
													<div>HRA</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div>ESI</div>
												</td>
												<td>
													<span>{employeeData.net_amount || '20,000'}</span>
												</td>
											</tr>
											<tr>
												<td>
													<div>Special Travelance</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div>Profrssional Tax</div>
												</td>
												<td>
													<span>{employeeData.net_amount || '20,000'}</span>
												</td>
											</tr>
											<tr>
												<td>
													<div>Gross Salary</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div>Salary Advance</div>
												</td>
												<td>
													<span>{employeeData.net_amount || '20,000'}</span>
												</td>
											</tr>
											<tr>
												<td>
													<div>Other Earnings</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div>TDS</div>
												</td>
												<td>
													<span>{employeeData.net_amount || '20,000'}</span>
												</td>
											</tr>
											<tr>
												<td>
													<div>Incentives</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div>Other Deduction</div>
												</td>
												<td>
													<span>{employeeData.net_amount || '20,000'}</span>
												</td>
											</tr>
											<tr>
												<td>
													<div>Bonus</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div></div>
												</td>
												<td>
													<span></span>
												</td>
											</tr>
											<tr>
												<td>
													<div>Over Time Pay</div>
												</td>
												<td>
													<span>{employeeData.paid_amount || '20,000'}</span>
												</td>
												<td>
													<div></div>
												</td>
												<td>
													<span></span>
												</td>
											</tr>
											<tr>
												<td>
													<div> &nbsp; </div>
												</td>
												<td>
													<span></span>
												</td>
												<td>
													<div></div>
												</td>
												<td>
													<span></span>
												</td>
											</tr>
											<tr>
												<td>
													<strong>Total Earnings</strong>
												</td>
												<td>
													<strong>{employeeData.paid_amount || '15,000'}</strong>
												</td>
												<td>
													<strong>Total Deductions</strong>
												</td>
												<td>
													<strong>{employeeData.net_amount || '5000'}</strong>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-6 border px-0'>
										<div className='bill-to px-2'>Net Pay :-</div>
										<p
											style={{ fontSize: '16px' }}
											className='px-2'>
											<b></b> <span id='inv-notes'> {employeeData.note || '₹20,000/-'}</span>{' '}
										</p>
									</div>
									<div className='col-md-6 border px-0'>
										<div className='bill-to px-2'>In Words :-</div>
										<div className='bill-name-date px-2'>
											<p>
												<span className='inv-paid'>
													{' '}
													{employeeData.paid_amount || 'Twenty Thousend Only'}
												</span>
											</p>
										</div>
									</div>
								</div>
								<div className='invoice-details d-flex'>
									<div className='col-md-6 border px-0'>
										<div className='bill-to px-2'>Prepaid By :-</div>
										<div className='bill-name-date px-2'>
											<p>
												<strong>Gautam Jani</strong>
											</p>
										</div>
									</div>
									<div className='col-md-6 border px-0'>
										<div className='bill-to px-2'>Received By :-</div>
										<div className='bill-name-date px-2'>
											<p>
												<strong>Brijesh Prajapati</strong>
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='col-md-12 fv-row mt-10 text-center'>
							<button
								type='button'
								className='btn btn-success'
								onClick={() => generatePDF(employeeData.name)}>
								Download Salary Slip
							</button>
						</div>
					</div>
				</div>
			</div> */}
		</>
	)
}

export default HREmployeeSalaryView