import React, { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { faListCheck, faPlus, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { GetTeams } from '../../../Functions/FGGroup/Team'

interface ManagerSummary {
	id: string
	name: string
	email: string
	phone: string
	teamCount: number
	rating: number
	tasksCompleted: number

	totalTasks: number
}

const TeamManagement: React.FC = () => {
	const navigate = useNavigate()
	const [searchTerm, setSearchTerm] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('name')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [managers, setManagers] = useState<ManagerSummary[]>([])
	const [metaData, setMetaData] = useState<any>()
	const [showTeamsModal, setShowTeamsModal] = useState(false)
	const [selectedTeams, setSelectedTeams] = useState<any[]>([])
	const [loadingTeams, setLoadingTeams] = useState(false)

	const [selectedManagerName, setSelectedManagerName] = useState('')
	const [selectedManagerForTask, setSelectedManagerForTask] = useState('')

	const fetchManagers = async () => {
		setLoading(true)
		try {
			// Fetching all employees and filtering for 'Manager' in the frontend
			const response: any = await GetEmployees()

			if (response.status === 200 || response.data) {
				const allEmployees = response.data || []
				const filteredManagers = allEmployees.filter(
					(emp: any) => emp.employee?.position === 'Manager'
				)

				const managerList = await Promise.all(
					filteredManagers.map(async (emp: any) => {
						const teamRes: any = await GetTeams({ manager_id: emp._id })

						return {
							id: emp._id,
							name: emp.full_name,
							email: emp.email,
							phone: emp.mobile,
							teamCount: teamRes.data?.length || 0,
							rating: 4.5,
							tasksCompleted: 0,
							totalTasks: 0,
						}
					})
				)
				setManagers(managerList)
			}
		} catch (error) {
			console.error('Error fetching managers:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchManagers()
	}, [])

	const filteredManagers = managers.filter(
		(m) =>
			m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			m.email.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const sortManagers = (list: ManagerSummary[]) => {
		return [...list].sort((a, b) => {
			const aValue = a[sort as keyof ManagerSummary]
			const bValue = b[sort as keyof ManagerSummary]

			if (aValue === bValue) return 0
			if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1
			if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
			}

			const aString = String(aValue).toLowerCase()
			const bString = String(bValue).toLowerCase()
			const comparison = aString.localeCompare(bString)

			return sortOrder === 'asc' ? comparison : -comparison
		})
	}

	const sortedFilteredManagers = sortManagers(filteredManagers)
	const selectedManagers = selectedManagerForTask
		? sortedFilteredManagers.filter((manager) => manager.id === selectedManagerForTask)
		: sortedFilteredManagers

	useEffect(() => {
		setPagination((prev) => ({ ...prev, page: 1 }))
	}, [searchTerm, selectedManagerForTask])

	useEffect(() => {
		const totalPages = Math.ceil(selectedManagers.length / pagination.itemsPerPage)
		const safeCurrentPage = totalPages > 0 ? Math.min(pagination.page, totalPages) : 1

		if (safeCurrentPage !== pagination.page) {
			setPagination((prev) => ({ ...prev, page: safeCurrentPage }))
		}

		setMetaData({
			totalPages: totalPages || 1,
			currentPage: safeCurrentPage,
			totalItems: selectedManagers.length,
		})
	}, [selectedManagers.length, pagination.itemsPerPage, pagination.page])

	const handleViewDetails = (manager: ManagerSummary) => {
		navigate(`/hr/manager-details?id=${manager.id}`)
	}

	const handleShowTeams = async (manager: ManagerSummary) => {
		setSelectedManagerName(manager.name)
		setShowTeamsModal(true)
		setLoadingTeams(true)
		try {
			const response: any = await GetTeams({ manager_id: manager.id })
			if (response.data && Array.isArray(response.data)) {
				setSelectedTeams(response.data)
			} else {
				setSelectedTeams([])
			}
		} catch (error) {
			console.error('Error fetching manager teams:', error)
			toast.error('Failed to load team details')
		} finally {
			setLoadingTeams(false)
		}
	}
	const handleAddTaskNavigation = () => {
		if (!selectedManagerForTask) {
			toast.error('Please select an employee first')
			return
		}
		navigate(`/hr/team-task-add?employeeId=${selectedManagerForTask}`)
	}

	const sortableFields = [
		{ title: 'Manager Name', field: 'name' },
		{ title: 'Contact info', field: 'email' },
		{ title: 'Teams', field: 'teamCount' },
	]

	const paginatedSelectedManagers = selectedManagers.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Team Management</PageTitle>

			{/* Filter Toolbar (Order: SearchFilter -> LengthMenu -> Manager -> Add Task Button) */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
				}}>
				<div className='card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3'>
					<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
						{/* 1. Search */}
						<div style={{ minWidth: '240px', maxWidth: '340px', flex: '1 1 240px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search manager...'
								className='me-0'
							/>
						</div>

						{/* 2. Page Size */}
						<div>
							<LengthMenu
								expenseData={managers}
								handleItemsPerPageChange={(val) =>
									setPagination({ ...pagination, itemsPerPage: val, page: 1 })
								}
								className='me-0'
							/>
						</div>

						{/* 3. Download Excel Button */}
						<div>
							<DownloadExcelButton
								data={selectedManagers}
								columns={sortableFields}
								filename='Manager_List'
							/>
						</div>

						{/* 4. Manager Dropdown */}
						<div style={{ minWidth: '190px' }}>
							<SelectField
								showLabel={false}
								marginRemove={true}
								className='mb-0'
								height='38px'
								name='manager'
								value={selectedManagerForTask}
								defaultLabel='All Managers'
								options={managers.map((m) => ({ label: m.name, value: m.id }))}
								onChange={(e: any) => {
									const val = e?.target?.value ?? e
									setSelectedManagerForTask(val || '')
								}}
							/>
						</div>
					</div>

					{/* 6. End me right side Add Task Button */}
					{selectedManagerForTask && (
						<div className='flex-shrink-0 ms-auto'>
							<button
								type='button'
								className='btn btn-primary d-flex align-items-center gap-2 px-4'
								style={{ height: '38px', borderRadius: '8px' }}
								onClick={handleAddTaskNavigation}>
								<FontAwesomeIcon icon={faPlus} className='text-white' />
								<span>Add Task</span>
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Main Table Card */}
			<div className='gz-inv-table-card'>
				<div className='table-responsive'>
						<Table
							data={paginatedSelectedManagers}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={(field, order) => {
								setSort(field)
								setSortOrder(order)
							}}
							visibleDetails={visibleDetails}
							loading={loading}
							pagination={pagination}
							setPagination={setPagination}
							renderRow={(
								manager: ManagerSummary,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => {
								return (
									<tr key={manager.id}>
										<td>
											<span className='text-dark fw-bold mb-1 fs-6 ps-4'>{actualIndex}</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-circle symbol-50px overflow-hidden me-3'>
													<div className='symbol-label fs-3 bg-light-primary text-primary fw-bold'>
														{manager.name.charAt(0)}
													</div>
												</div>
												<div className='d-flex flex-column'>
													<span className='text-gray-800 fw-bold mb-1'>{manager.name}</span>
												</div>
											</div>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-gray-800 fw-semibold fs-6'>{manager.email}</span>
												<span className='text-muted fs-7'>{manager.phone}</span>
											</div>
										</td>
										<td>
											<div
												className='badge badge-light-primary fw-bold px-4 py-3 cursor-pointer hover-elevate-up'
												onClick={() => handleShowTeams(manager)}>
												<i className='bi bi-diagram-3-fill me-2'></i>
												{manager.teamCount} Teams
											</div>
										</td>

										<td className='text-start'>
											<div className='d-flex align-items-center justify-content-start gap-2'>
												<TableButton
													action='view'
													onClick={() => handleViewDetails(manager)}
												/>
												<button
													type='button'
													className='gz-inv-action-btn warning'
													title='Manager Rating'
													onClick={() => navigate(`/hr/manager-rating?id=${manager.id}`)}>
													<FontAwesomeIcon icon={faStar} />
												</button>
												<button
													type='button'
													className='gz-inv-action-btn edit'
													title='Manager Tasks'
													onClick={() => navigate(`/hr/manager-tasks-view?id=${manager.id}`)}>
													<FontAwesomeIcon icon={faListCheck} />
												</button>
											</div>
										</td>
									</tr>
								)
							}}
						/>
					</div>

					<div className='mt-5'>
						<UsersListPagination
							totalPages={metaData?.totalPages || 1}
							currentPage={pagination.page}
							totalRecords={metaData?.totalRecords || metaData?.total || metaData?.count}
							itemsPerPage={pagination.itemsPerPage}
							onPageChange={(p) => setPagination({ ...pagination, page: p })}
						/>
					</div>
				</div>

			<Modal
				show={showTeamsModal}
				onHide={() => setShowTeamsModal(false)}
				size='lg'
				centered>
				<Modal.Header closeButton>
					<Modal.Title>Teams Managed by {selectedManagerName}</Modal.Title>
				</Modal.Header>
				<Modal.Body className='py-8 px-10'>
					{loadingTeams ? (
						<div className='text-center py-10'>
							<Spinner
								animation='border'
								variant='primary'
							/>
							<div className='text-muted mt-3'>Loading teams...</div>
						</div>
					) : selectedTeams.length === 0 ? (
						<div className='text-center py-10 text-muted'>No teams assigned to this manager.</div>
					) : (
						<div className='row g-4'>
							{selectedTeams.map((team, index) => (
								<div
									key={team._id}
									className='col-12'>
									<div className='card bg-light-primary border border-primary border-dashed rounded-3 shadow-none'>
										<div className='card-body p-6'>
											{/* Position Header */}
											<div className='d-flex align-items-center mb-4'>
												<span className='fw-bold text-gray-800 fs-5 me-2'>Position:</span>
												<span className='fs-5 text-dark fw-bolder'>{team.position}</span>
											</div>

											{/* Members List */}
											<div className='ps-2'>
												{/* Leader is always #1 */}
												<div className='d-flex align-items-center mb-2'>
													<span className='text-gray-400 fw-bold me-3'>1.</span>
													<span className='text-gray-800 fw-bold fs-6'>
														{team.leader_id?.full_name || 'N/A'}
														<span className='badge badge-light-danger fs-9 ms-3'>Team Leader</span>
													</span>
												</div>

												{/* Members follow */}
												{(team.members || []).map((member: any, mIndex: number) => (
													<div
														key={member._id}
														className='d-flex align-items-center mb-2'>
														<span className='text-gray-400 fw-bold me-3'>{mIndex + 2}.</span>
														<span className='text-dark fw-semibold fs-6'>{member.full_name}</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</Modal.Body>
			</Modal>
		</>
	)
}

export default TeamManagement
