import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetDailyReporting } from '../../../Functions/FGGroup/DailyTaskReporting'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'

interface PaginationState {
	page: number
	itemsPerPage: number
}

const DailyReportList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState(
		() => localStorage.getItem('daily_report_searchTerm') || ''
	)
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [employeeDataList, setEmployeeDataList] = useState<any[]>([])
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(() => {
		try {
			const saved = localStorage.getItem('daily_report_selectedEmployee')
			return saved ? JSON.parse(saved) : null
		} catch (e) {
			return null
		}
	})
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const isDateFilterInitialized = React.useRef(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		try {
			const saved = localStorage.getItem('daily_report_selectedDateRange')
			if (saved && saved !== 'undefined') {
				const [start, end] = JSON.parse(saved)
				return [new Date(start), new Date(end)]
			}
		} catch (e) {}

		const now = new Date()
		const start = new Date(now.getFullYear(), now.getMonth(), 1)
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
		return [start, end]
	})

	let navigate = useNavigate()

	const [pagination, setPagination] = useState<PaginationState>(() => {
		try {
			const saved = localStorage.getItem('daily_report_pagination')
			return saved ? JSON.parse(saved) : { page: 1, itemsPerPage: 10 }
		} catch (e) {
			return { page: 1, itemsPerPage: 10 }
		}
	})

	const fetchAssignTaskData = async (page?: number) => {
		setLoading(true)
		let startDate: Date | null = null
		let endDate: Date | null = null

		if (selectedDateRange) {
			startDate = new Date(selectedDateRange[0])
			endDate = new Date(selectedDateRange[1])
			endDate.setHours(23, 59, 59, 999)
		} else {
			const now = new Date()
			startDate = new Date(now.getFullYear(), now.getMonth(), 1)
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
		}

		try {
			const queryParams: any = {
				page: page || pagination?.page || 1,
				limit: pagination?.itemsPerPage || 10,
				search: searchTerm || '',
				sort: sort || 'createdAt',
				sortOrder: sortOrder || 'desc',
				from_date: DayJS(startDate).format('YYYY-MM-DD'),
				to_date: DayJS(endDate).format('YYYY-MM-DD'),
			}

			if (selectedEmployee?.id) {
				queryParams.admin_id = selectedEmployee.id
			}

			const response = await GetDailyReporting(queryParams)

			let filteredData: any = response?.data || []

			// Secondary client-side filtering to ensure accuracy
			filteredData = filteredData.filter((task: any) => {
				const taskDate = new Date(task.createdAt)
				return taskDate >= startDate! && taskDate <= endDate!
			})

			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setAssignTaskData(filteredData)

			const apiMetadata: any = response?.metadata
			if (apiMetadata?.pagination) {
				setMetaData(apiMetadata.pagination)
			} else {
				// Fallback if metadata is missing
				setMetaData({
					totalPages: Math.ceil((filteredData.length || 0) / (pagination.itemsPerPage || 10)) || 1,
					totalItems: filteredData.length || 0,
				})
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchEmployeeData = async () => {
		try {
			const response = await GetEmployees()
			const filteredData: any = response.data
			setEmployeeDataList(filteredData.map((el: any) => ({ name: el.full_name, id: el._id })))
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchAssignTaskData()
		fetchEmployeeData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedEmployee,
	])

	const isFirstRender = React.useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		localStorage.setItem('daily_report_searchTerm', searchTerm)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm])

	useEffect(() => {
		localStorage.setItem('daily_report_selectedEmployee', JSON.stringify(selectedEmployee))
	}, [selectedEmployee])

	useEffect(() => {
		if (selectedDateRange) {
			const rangeJson = JSON.stringify(selectedDateRange)
			localStorage.setItem('daily_report_selectedDateRange', rangeJson)
		} else {
			localStorage.removeItem('daily_report_selectedDateRange')
		}
	}, [selectedDateRange])

	useEffect(() => {
		localStorage.setItem('daily_report_pagination', JSON.stringify(pagination))
	}, [pagination])

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	const sortableFields = [
		{ title: 'Employee Name', field: 'employee_name' },
		{ title: 'Task', field: 'task_title' },
		{ title: 'Remarks', field: 'remarks' },
		{ title: 'Created At', field: 'createdAt' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const DownloadDocument = async (fileName: string) => {
		let downloadName = fileName.split('/').pop() || fileName
		const lowerName = downloadName.toLowerCase()

		if (lowerName.includes('spreadsheetml.sheet') || lowerName.includes('ms-excel')) {
			if (
				!lowerName.endsWith('.xlsx') &&
				!lowerName.endsWith('.xls') &&
				!lowerName.endsWith('.csv')
			) {
				downloadName += '.xlsx'
			}
		}

		try {
			const response = await fetch(`https://files.fggroup.in/${fileName}`)
			if (!response.ok) throw new Error('Fetch failed')
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)

			const link = window.document.createElement('a')
			link.href = url
			link.setAttribute('download', downloadName)
			window.document.body.appendChild(link)
			link.click()

			window.document.body.removeChild(link)
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Download failed, falling back to direct link', error)
			const link = window.document.createElement('a')
			link.href = `https://files.fggroup.in/${fileName}?response-content-disposition=attachment;%20filename="${encodeURIComponent(
				downloadName
			)}"`
			link.setAttribute('download', downloadName)
			window.document.body.appendChild(link)
			link.click()
			window.document.body.removeChild(link)
		}
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const ShowDocument = (document: any) => {
		const downloadUrl = `https://files.fggroup.in/${document}`
		window.open(downloadUrl)
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		// Ignore the first call on mount.
		// The parent state is already initialized to the correct value (saved or current month).
		if (!isDateFilterInitialized.current) {
			isDateFilterInitialized.current = true
			return
		}

		const isSame =
			(!range && !selectedDateRange) ||
			(range &&
				selectedDateRange &&
				range[0].getTime() === selectedDateRange[0].getTime() &&
				range[1].getTime() === selectedDateRange[1].getTime())

		if (!isSame) {
			setSelectedDateRange(range)
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const handleEmployeeSelect = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedName = event.target.value

			if (selectedName === 'Select') {
				setSelectedEmployee(null)
			} else {
				const selectedEmployeeObj = employeeDataList.find((el: any) => el.name === selectedName)
				setSelectedEmployee(selectedEmployeeObj)
			}
			setPagination((prev) => ({ ...prev, page: 1 }))
		}
	}

	const paginatedTaskData = (assignTaskData || []).slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

	const toggleDescription = (index: number) => {
		setExpandedDescription((prevState) => ({
			...prevState,
			[index]: !prevState[index],
		}))
	}

	const truncateString = (str: any, num: any) => {
		if (!str || typeof str !== 'string') {
			return ''
		}
		if (str.length <= num) {
			return str
		}
		return str.slice(0, num) + '...'
	}

	const handlenavigate = (ReportId: any, employeeId: any) => {
		// Pass both the report ID and the employee ID for that report
		navigate(`/hr/daily-report-view?id=${ReportId}&employeeId=${employeeId}`)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Daily Reporting</PageTitle>
			<KTCard>
				<h2 className='m-6 mb-0'>Daily Reports</h2>
				<div className='row card-header border-0 pt-0 align-items-center ms-0 mx-md-6 p-0'>
					<div className='col-md-12'>
						<div className='row mt-3 justify-content-between'>
							<div className='col-md-4 fv-row ps-md-0'>
								<SelectField
									className='fv-row m-0'
									label='Select Employee'
									name='employee'
									value={selectedEmployee?.name || 'Select'}
									onChange={handleEmployeeSelect}
									htmlFor='employee'
									options={['Select', ...employeeDataList.map((el: any) => el.name)]}
									marginRemove={true}
								/>
							</div>
							<div className='col-md-4 mt-md-7 mb-0 d-flex justify-content-end align-items-end card-toolbar'>
								<div className='d-md-flex'>
									<div className='d-md-flex me-3'>
										{assignTaskData?.length > 0 && (
											<select
												className='form-select form-select-sm mx-3'
												style={{ width: '80px' }}
												value={pagination.itemsPerPage}
												onChange={(e) =>
													setPagination((prev) => ({
														...prev,
														itemsPerPage: Number(e.target.value),
														page: 1,
													}))
												}>
												<option value='10'>10</option>
												<option value='50'>50</option>
												<option value='100'>100</option>
											</select>
										)}
									</div>
									<DateFilter
										onDateRangeChange={handleDateRangeChange}
										leftValue='-270px'
										storageKey='daily_report_selectedDateRange'
									/>
								</div>
							</div>
							<div className='col-md-3 mt-md-7 mt-2 mb-0 d-flex align-items-end position-relative ps-0 '>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedTaskData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							disableSortFields={[
								'employee_name',
								'task_title',
								'remarks',
								'file_url',
								'createdAt',
								'url',
							]}
							onSortChange={handleSortChange}
							renderRow={(task: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={task._id}>
									<tr
										onClick={() => handleRowClick(task._id)}
										className='data-row'>
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{employeeDataList.find((emp: any) => emp.id === task.admin_id)?.name || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{task.task_title}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{task.remarks}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{DayJS(task.createdAt).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center gap-2'>
												<button
													className='btn btn-info btn-sm'
													onClick={() => handlenavigate(task._id, task.admin_id)}>
													<i className='fas fa-eye p-0'></i>
												</button>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>Employee Name:</strong>{' '}
													{employeeDataList.find((emp: any) => emp.id === task.admin_id)?.name ||
														'-'}
													<br />
													<strong>{sortableFields[1].title}:</strong> {task.task_title}
													<br />
													<strong>{sortableFields[2].title}:</strong> {task.remarks}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{task.file_url
														? (() => {
																const file = task.file_url
																const isExcelFile =
																	file.toLowerCase().match(/\.(xlsx|xls|csv)$/) ||
																	file.toLowerCase().includes('spreadsheetml.sheet') ||
																	file.toLowerCase().includes('ms-excel')
																const isPdfFile = file.toLowerCase().endsWith('.pdf')
																const isImageFile = file
																	.toLowerCase()
																	.match(/\.(jpg|jpeg|png|gif|svg)$/)
																const isWordFile = file.toLowerCase().match(/\.(doc|docx)$/)
																const isAudioFile = file.toLowerCase().endsWith('.mp3')

																if (isAudioFile) {
																	return (
																		<audio
																			controls
																			src={`https://files.fggroup.in/${file}`}
																		/>
																	)
																} else if (isExcelFile) {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-success bg-light-success'
																			style={{ width: '150px' }}
																			onClick={() => DownloadDocument(file)}>
																			<i className='fas fa-file-excel text-success fs-1 mb-2'></i>
																			<span
																				className='text-success fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																} else if (isPdfFile) {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-warning bg-light-warning'
																			style={{ width: '150px' }}
																			onClick={() => DownloadDocument(file)}>
																			<i className='fas fa-file-pdf text-warning fs-1 mb-2'></i>
																			<span
																				className='text-warning fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																} else if (isImageFile) {
																	return (
																		<img
																			onClick={() => ShowDocument(file)}
																			src={`https://files.fggroup.in/${file}`}
																			alt='task file'
																			style={{ width: '150px', height: 'auto' }}
																			role='button'
																		/>
																	)
																} else if (isWordFile) {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-primary bg-light-primary'
																			style={{ width: '150px' }}
																			onClick={() => ShowDocument(file)}>
																			<i className='fas fa-file-word text-primary fs-1 mb-2'></i>
																			<span
																				className='text-primary fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																} else {
																	return (
																		<div
																			className='d-flex flex-column align-items-center cursor-pointer p-3 border rounded border-secondary bg-light'
																			style={{ width: '150px' }}
																			onClick={() => ShowDocument(file)}>
																			<i className='fas fa-file text-secondary fs-1 mb-2'></i>
																			<span
																				className='text-secondary fw-bold small text-center'
																				style={{
																					display: '-webkit-box',
																					WebkitLineClamp: 2,
																					WebkitBoxOrient: 'vertical',
																					overflow: 'hidden',
																					textOverflow: 'ellipsis',
																					width: '100%',
																				}}
																				title={file.split('/').pop()}>
																				{file.split('/').pop()}
																			</span>
																		</div>
																	)
																}
														  })()
														: 'No file'}
													<br />
													<strong>{sortableFields[4].title}:</strong>{' '}
													{DayJS(task.createdAt).format('DD/MM/YYYY')}
													<br />
													{/* URL Section */}
													{task.url && task.url.length > 0 && (
														<>
															<strong>URLs:</strong>
															<br />
															<ul className='list-group'>
																{task.url.map((urlArray: any, index: number) =>
																	Array.isArray(urlArray)
																		? urlArray.map((urlItem: any, subIndex: number) => (
																				<li
																					key={`url-${index}-${subIndex}`}
																					className='list-group-item'>
																					<strong>{urlItem.url_type}:</strong>{' '}
																					<a
																						href={urlItem.link}
																						target='_blank'
																						rel='noopener noreferrer'>
																						{urlItem.link}
																					</a>
																				</li>
																		  ))
																		: null
																)}
															</ul>
														</>
													)}
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
					{paginatedTaskData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}

					{paginatedTaskData.length > 0 && (
						<UsersListPagination
							totalPages={
								metaData?.totalPages ||
								metaData?.total_pages ||
								Math.ceil(
									(metaData?.totalItems || metaData?.total || metaData?.count || 0) /
										pagination.itemsPerPage
								) ||
								1
							}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default DailyReportList
