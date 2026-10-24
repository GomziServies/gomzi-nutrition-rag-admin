import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { ActionTask, GetTask } from '../../../Functions/FGGroup/TaskManagement'

const ManagerTasksView: React.FC = () => {
	const [searchParams] = useSearchParams()
	const managerId = searchParams.get('id')
	const navigate = useNavigate()

	const [searchTerm, setSearchTerm] = useState('')
	const [managerName, setManagerName] = useState('Manager')
	const [statusFilter, setStatusFilter] = useState<'Select' | 'Pending' | 'Employee Done'>('Select')
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(() => {
		const now = new Date()
		const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
		return [start, end]
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchManagerInfo = async () => {
		if (!managerId) return
		try {
			const res: any = await GetEmployees()
			const manager = res.data?.find((emp: any) => emp._id === managerId)
			if (manager) {
				setManagerName(manager.full_name)
			}
		} catch (error) {
			console.error(error)
		}
	}

	const fetchTasks = async () => {
		if (!managerId) return
		setLoading(true)
		try {
			let startDate: string | undefined
			let endDate: string | undefined

			if (selectedDateRange) {
				const start = selectedDateRange[0]
				const end = selectedDateRange[1]
				startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
					2,
					'0'
				)}-${String(start.getDate()).padStart(2, '0')}`
				endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(
					end.getDate()
				).padStart(2, '0')}`
			}

			const response: any = await GetTask({
				admin_id: managerId,
				start_date: startDate,
				end_date: endDate,
				limit: 1000,
			})

			let tasks = response.data || []

			// Filter
			if (statusFilter !== 'Select') {
				if (statusFilter === 'Pending') tasks = tasks.filter((t: any) => t.status === 'PENDING')
				else if (statusFilter === 'Employee Done')
					tasks = tasks.filter((t: any) => t.status === 'COMPLETED')
			}

			if (searchTerm) {
				const low = searchTerm.toLowerCase()
				tasks = tasks.filter((t: any) => t.task_title?.toLowerCase().includes(low))
			}

			// Sort
			tasks.sort((a: any, b: any) => {
				const valA = a[sort] || ''
				const valB = b[sort] || ''
				if (sortOrder === 'asc') return valA > valB ? 1 : -1
				return valA < valB ? 1 : -1
			})

			setAssignTaskData(tasks)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchManagerInfo()
	}, [managerId])

	useEffect(() => {
		fetchTasks()
	}, [managerId, selectedDateRange, sort, sortOrder, statusFilter, searchTerm])

	useEffect(() => {
		setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }))
	}, [managerId, selectedDateRange, sort, sortOrder, statusFilter, searchTerm])

	const totalPages = Math.max(1, Math.ceil(assignTaskData.length / pagination.itemsPerPage))

	useEffect(() => {
		if (pagination.page > totalPages) {
			setPagination((prev) => ({ ...prev, page: totalPages }))
		}
	}, [pagination.page, totalPages])

	const handleRowClick = (id: string) => setVisibleDetails(visibleDetails === id ? null : id)

	const openActionModal = (id: string) => {
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Please provide a remark for reassigning this task.',
			input: 'text',
			inputPlaceholder: 'Enter Remark (optional)',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then(async (result) => {
			if (result.isConfirmed) {
				await ActionTask({ task_id: id, status: 'PENDING', remark_by_hr: result.value })
				toast.success('Task Reassigned Successfully')
				fetchTasks()
			}
		})
	}

	const paginatedData = assignTaskData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>{`Tasks: ${managerName}`}</PageTitle>

			{/* Top Bar with Back Link */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<Link
					to='/hr/team-management'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Team Management</span>
				</Link>
				<h3 className='fw-bold m-0 fs-4' style={{ color: '#142447' }}>
					Manager Tasks: {managerName}
				</h3>
			</div>

			{/* Filter Toolbar (Order: Search -> LengthMenu -> DownloadExcel -> Filters -> Date) */}
			<div className='gz-filter-card mb-5'>
				<div className='d-flex align-items-center flex-wrap gap-3 w-100'>
					{/* 1. Search */}
					<div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder='Search task...'
						/>
					</div>

					{/* 2. Page Size */}
					<div>
						<LengthMenu
							expenseData={assignTaskData}
							handleItemsPerPageChange={(pageSize) =>
								setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: pageSize }))
							}
						/>
					</div>

					{/* 3. Export to Excel */}
					<div>
						<DownloadExcelButton
							data={assignTaskData}
							columns={[
								{ title: 'Task', field: 'task_title' },
								{ title: 'Start Date', field: 'start_date' },
								{ title: 'End Date', field: 'end_date' },
								{ title: 'Employee Status', field: 'status' },
							]}
							filename={`manager_tasks_${managerName}`}
						/>
					</div>

					{/* 4. Status Filter */}
					<div style={{ minWidth: '160px' }}>
						<SelectField
							showLabel={false}
							marginRemove={true}
							className='mb-0'
							height='38px'
							name='status'
							value={statusFilter === 'Select' ? '' : statusFilter}
							defaultLabel='All Statuses'
							options={[
								{ label: 'All Statuses', value: '' },
								{ label: 'Pending', value: 'Pending' },
								{ label: 'Employee Done', value: 'Employee Done' },
							]}
							onChange={(e: any) => {
								const val = e?.target?.value ?? e
								setStatusFilter(val || 'Select')
							}}
						/>
					</div>

					{/* 5. Date Filter */}
					<div>
						<DateFilter
							onDateRangeChange={setSelectedDateRange}
							rightValue='0'
						/>
					</div>
				</div>
			</div>

			{/* Table Card */}
			<div className='gz-inv-table-card'>
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<Table
							data={paginatedData}
							columns={[
								{ title: 'Task', field: 'task_title' },
								{ title: 'Start Date', field: 'start_date' },
								{ title: 'End Date', field: 'end_date' },
								{ title: 'Employee Status', field: 'status' },
							]}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={(f, o) => {
								setSort(f)
								setSortOrder(o)
							}}
							disableSortFields={['task_title', 'start_date', 'end_date', 'status']}
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
												<span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>{task.task_title}</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{DayJS(task.start_date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{DayJS(task.end_date).format('DD/MM/YYYY')}
											</span>
										</td>
										<td>
											<span
												className={`fw-bold d-block mb-1 fs-6 ${
													task.status === 'PENDING' ? 'text-warning' : 'text-success'
												}`}>
												{task.status.charAt(0).toUpperCase() + task.status.slice(1).toLowerCase()}
											</span>
										</td>
										<td>
											<div className='d-flex'>
												<TableButton
													action='view'
													onClick={() =>
														navigate(`/hr/task-view?taskId=${task._id}&adminId=${task.admin_id}`)
													}
												/>
												{task.status === 'COMPLETED' && (
													<TableButton
														action='assign'
														text='Re-assign'
														onClick={() => openActionModal(task._id)}
														className='ms-2 d-flex'
														showIcon={false}
													/>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr
											className='detail-row is-visible shadow-sm'
											style={{ background: '#f9f9f9' }}>
											<td
												colSpan={13}
												className='p-6'>
												<div className='row'>
													<div className='col-md-6'>
														<p className='mb-1'>
															<strong>Task Title:</strong> {task.task_title}
														</p>
														<p className='mb-1'>
															<strong>Remark by Employee:</strong> {task.remark_by_employee || '-'}
														</p>
														<p className='mb-1'>
															<strong>Remark by HR:</strong> {task.remark_by_hr || '-'}
														</p>
													</div>
													<div className='col-md-6'>
														<p className='mb-1'>
															<strong>Status:</strong> {task.status}
														</p>
														<p className='mb-1'>
															<strong>Period:</strong> {DayJS(task.start_date).format('DD/MM/YYYY')}{' '}
															to {DayJS(task.end_date).format('DD/MM/YYYY')}
														</p>
														<p className='mb-0'>
															<strong>File:</strong>{' '}
															{task.file_url ? (
																<Button
																	variant='link'
																	className='p-0'
																	onClick={() =>
																		window.open(`https://files.fggroup.in/${task.file_url}`)
																	}>
																	View Attachment
																</Button>
															) : (
																'None'
															)}
														</p>
													</div>
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
					{assignTaskData.length > 0 && (
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
							totalRecords={assignTaskData.length}
							itemsPerPage={pagination.itemsPerPage}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default ManagerTasksView
