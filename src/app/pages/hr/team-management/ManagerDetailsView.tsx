import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import Card from 'react-bootstrap/Card'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateTeam, GetTeams, RemoveTeam } from '../../../Functions/FGGroup/Team'

interface Employee {
	id: string
	name: string
	email: string
	phone: string
	position: string
	department: string
	joiningDate: string
}

interface Manager {
	id: string
	managerName: string
	email: string
	phone: string
	teamCount: number
	employees: Employee[]
	rating: number
}

interface AssignedTeam {
	id: string
	teamName: string
	leaderName: string
	memberCount: number
	memberNames: string[]
	rating: number
	assignedDate: string
	status: string
}

const ManagerDetailsView: React.FC = () => {
	const [searchParams] = useSearchParams()
	const id = searchParams.get('id')
	const navigate = useNavigate()
	const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
	const [showAddTeamModal, setShowAddTeamModal] = useState(false)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	// Add Team Form State
	const [allEmployees, setAllEmployees] = useState<any[]>([])
	const [newTeamData, setNewTeamData] = useState({
		teamName: '',
		position: '',
		leaderId: '',
		memberIds: [] as string[],
	})

	const [managerData, setManagerData] = useState({
		manager_name: 'Loading...',
		phone_no: '-',
		email: '-',
		team_count: 0,
		rating: 0,
	})

	// Filter states for Assigned Teams Table
	const [searchTerm, setSearchTerm] = useState('')
	const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)
	const [sort, setSort] = useState('assignedDate')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [metaData, setMetaData] = useState<any>({
		totalPages: 1,
		currentPage: 1,
		totalItems: 0,
	})

	const [assignedTeams, setAssignedTeams] = useState<AssignedTeam[]>([])

	const fetchEmployees = async () => {
		try {
			const response: any = await GetEmployees()
			if (response.status === 200 || response.data) {
				setAllEmployees(Array.isArray(response.data) ? response.data : [])
			}
		} catch (error) {
			console.error('Error fetching employees:', error)
		}
	}

	const handleViewTeamTasks = (team: any) => {
		const ids = [team.leaderId, ...(team.memberIds || [])].filter(Boolean).join(',')
		navigate(`/hr/team-tasks?ids=${ids}&position=${team.teamName}`)
	}

	const fetchTeams = async (managerId: string) => {
		setLoading(true)
		try {
			const response: any = await GetTeams({
				manager_id: managerId,
				page: pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort: sort === 'assignedDate' ? 'createdAt' : sort === 'teamName' ? 'position' : sort,
				sortOrder: sortOrder,
			})

			if (response.status === 200 || response.data) {
				const mappedTeams: AssignedTeam[] = (response.data || []).map((t: any) => ({
					id: t._id,
					teamName: t.position,
					leaderName: t.leader_id?.full_name || 'Unknown',
					memberCount: (t.members?.length || 0) + 1,
					memberNames: (t.members || []).map((m: any) => m.full_name).filter(Boolean),
					leaderId: t.leader_id?._id,
					memberIds: (t.members || []).map((m: any) => m._id),
					rating: 0,
					assignedDate: t.createdAt,
					status: t.status ? 'Active' : 'Inactive',
				}))
				setAssignedTeams(mappedTeams)

				const paginationData = response.metadata?.pagination || response.pagination
				if (paginationData) {
					const totalDocs = paginationData.totalDocs || paginationData.total_items || 0
					setMetaData({
						totalPages: paginationData.totalPages || paginationData.total_pages || 1,
						currentPage: paginationData.page || paginationData.current_page || 1,
						totalItems: totalDocs,
					})
					// Update real team count in header stats
					setManagerData((prev) => ({ ...prev, team_count: totalDocs }))
				}
			}
		} catch (error) {
			console.error('Error fetching teams:', error)
			toast.error('Failed to load teams')
		} finally {
			setLoading(false)
		}
	}

	const fetchManagerInfo = async (managerId: string) => {
		try {
			const response: any = await GetEmployees({ id: managerId })
			if (response.status === 200 || response.data) {
				const data = Array.isArray(response.data) ? response.data[0] : response.data
				if (data) {
					setManagerData({
						manager_name: data.full_name || 'N/A',
						phone_no: data.mobile || 'N/A',
						email: data.email || 'N/A',
						// These stats will be derived from teams/tasks fetching
						team_count: 0,
						rating: 0,
					})
					setSelectedManager({
						id: data._id,
						managerName: data.full_name,
						email: data.email,
						phone: data.mobile,
						teamCount: 0,
						employees: [],
						rating: 0,
					})
				}
			}
		} catch (error) {
			console.error('Error fetching manager info:', error)
			toast.error('Failed to load manager profile')
		}
	}

	useEffect(() => {
		if (id) {
			fetchManagerInfo(id)
			fetchTeams(id)
		}
		fetchEmployees()
	}, [id, pagination.page, pagination.itemsPerPage, searchTerm, sort, sortOrder])

	const filteredAssignedTeams = assignedTeams.filter((team) => {
		const matchesSearch =
			searchTerm === '' ||
			team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			team.leaderName.toLowerCase().includes(searchTerm.toLowerCase())

		let matchesDate = true
		if (dateRange && dateRange[0] && dateRange[1]) {
			const assignedDate = new Date(team.assignedDate)
			matchesDate = assignedDate >= dateRange[0] && assignedDate <= dateRange[1]
		}

		return matchesSearch && matchesDate
	})

	useEffect(() => {
		const totalPages = Math.ceil(filteredAssignedTeams.length / pagination.itemsPerPage)
		setMetaData({
			totalPages: totalPages || 1,
			currentPage: pagination.page,
			totalItems: filteredAssignedTeams.length,
		})
	}, [filteredAssignedTeams, pagination.itemsPerPage, pagination.page])

	const handleCreateTeam = () => {
		setShowAddTeamModal(true)
		setNewTeamData({
			teamName: '',
			position: '',
			leaderId: '',
			memberIds: [],
		})
	}

	const handleConfirmCreateTeam = async () => {
		if (!newTeamData.position || !newTeamData.leaderId) {
			toast.error('Please fill in all required fields')
			return
		}

		try {
			const response: any = await CreateTeam({
				manager_id: selectedManager?.id || '',
				leader_id: newTeamData.leaderId,
				members: newTeamData.memberIds,
				position: newTeamData.position,
			})

			if (response.status === 200) {
				toast.success('Team created successfully!')
				setShowAddTeamModal(false)
				// Refresh data or add locally
				const leader = allEmployees.find((emp) => emp._id === newTeamData.leaderId)
				const memberNames = allEmployees
					.filter((emp) => newTeamData.memberIds.includes(emp._id))
					.map((emp) => emp.full_name)

				const newTeam: AssignedTeam = {
					id: response.data?._id || `T-${Date.now()}`,
					teamName: newTeamData.position,
					leaderName: leader?.full_name || 'Unknown',
					memberCount: newTeamData.memberIds.length + 1,
					memberNames: memberNames,
					rating: 0,
					assignedDate: new Date().toISOString(),
					status: 'Active',
				}
				setAssignedTeams([newTeam, ...assignedTeams])
			} else {
				toast.error(response.message || 'Failed to create team')
			}
		} catch (error: any) {
			console.error('Error creating team:', error)
			toast.error(error.message || 'Something went wrong')
		}
	}

	const handleRemoveTeam = async (teamId: string) => {
		try {
			const result = await Swal.fire({
				title: 'Are you sure?',
				text: 'Do you really want to remove this team? This action cannot be undone.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#d33',
				cancelButtonColor: '#3085d6',
				confirmButtonText: 'Yes, remove it!',
				cancelButtonText: 'Cancel',
			})

			if (result.isConfirmed) {
				const response: any = await RemoveTeam({ team_id: teamId })
				if (response.status === 200) {
					toast.success('Team removed successfully!')
					if (selectedManager) fetchTeams(selectedManager.id)
				} else {
					toast.error(response.message || 'Failed to remove team')
				}
			}
		} catch (error: any) {
			console.error('Error removing team:', error)
			toast.error(error.message || 'Something went wrong')
		}
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	// Derived data for form
	const uniquePositions = Array.from(
		new Set(allEmployees.map((emp) => emp?.employee?.position).filter(Boolean))
	).filter((pos: any) => pos !== 'Manager')
	const filteredLeaders = allEmployees.filter(
		(emp) => emp?.employee?.position === newTeamData.position
	)

	const sortableFields = [
		{ title: 'Team Leader', field: 'leaderName' },
		{ title: 'Position', field: 'teamName' },
		{ title: 'Members', field: 'memberCount' },
		{ title: 'Assigned Date', field: 'assignedDate' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Manager Dashboard</PageTitle>

			<div
				className='card shadow-sm mb-7'
				style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
				<div className='card-body p-0'>
					<div style={{ borderRadius: '12px 12px 0 0', padding: '2rem' }}>
						<div className='d-flex align-items-center'>
							<div
								className='symbol symbol-70px symbol-circle me-4'
								style={{
									border: '2px solid #6366f1',
									boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.25)',
									flexShrink: 0,
								}}>
								<span
									className='symbol-label fs-2x fw-bold'
									style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
									{managerData.manager_name.charAt(0)}
								</span>
							</div>
							<div>
								<h1 className='text-dark fw-bold mb-2 fs-2x'>{managerData.manager_name}</h1>
								<div className='d-flex flex-wrap gap-4'>
									<span className='text-muted fs-6'>
										<i className='bi bi-telephone-fill me-2'></i>
										{managerData.phone_no}
									</span>
									<span className='text-muted fs-6'>
										<i className='bi bi-envelope-fill me-2'></i>
										{managerData.email}
									</span>
								</div>
							</div>
							{/* <div className='ms-auto'>
                 <button className='btn btn-light-primary btn-sm' onClick={() => navigate('/hr/team-management')}>
                    <i className='bi bi-arrow-left me-2'></i>Back to List
                 </button>
              </div> */}
						</div>
					</div>
				</div>
			</div>

			<Card
				className='mb-5 border-0 shadow-sm'
				style={{ borderRadius: '24px' }}>
				<Card.Body style={{ padding: '2rem' }}>
					<div className='d-flex align-items-center justify-content-between mb-7'>
						<div className='d-flex align-items-center'>
							<div className='bg-primary w-40px h-40px rounded-3 d-flex align-items-center justify-content-center me-3'>
								<i className='bi bi-diagram-3-fill text-white fs-4'></i>
							</div>
							<div>
								<h4 className='fw-bold mb-0'>Assigned Teams</h4>
								<p className='text-muted fs-7 mb-0'>Teams managed by {managerData.manager_name}</p>
							</div>
						</div>
					</div>

					<div className='row mb-4'>
						<div className='col-md-5'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='col-md-7 d-flex justify-content-end gap-3'>
							<LengthMenu
								expenseData={assignedTeams}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
							<TableButton
								action='add'
								onClick={handleCreateTeam}
								text='Assign Team'
							/>
						</div>
					</div>

					<div className='table-responsive'>
						{assignedTeams.length === 0 && !loading ? (
							<div
								className='text-center py-20'
								style={{ background: '#fcfcfc', borderRadius: '12px' }}>
								<div className='d-flex flex-column align-items-center justify-content-center'>
									<div className='symbol symbol-60px symbol-circle bg-light mb-4 shadow-sm'>
										<span className='symbol-label bg-white border border-secondary border-dashed'>
											<i className='bi bi-people fs-2x text-gray-500'></i>
										</span>
									</div>
									<h5 className='text-gray-600 fw-bold mb-1'>No teams found</h5>
									<p className='text-muted fs-7 mb-0'>
										This manager currently has no active teams assigned.
									</p>
								</div>
							</div>
						) : (
							<Table
								data={assignedTeams}
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
								renderRow={(team: any, index: number, actualIndex: number, isVisible: boolean) => {
									return (
										<tr key={team.id}>
											<td className='ps-4'>
												<span className='fw-bold text-black'>{actualIndex}</span>
											</td>
											<td style={{ width: '20%' }}>
												<span className='fw-bold text-black'>{team.leaderName}</span>
											</td>
											<td style={{ width: '18%' }}>
												<div className='fw-bold text-black'>{team.teamName}</div>
											</td>
											<td style={{ width: '25%' }}>
												<div className='d-flex flex-column gap-2'>
													{team.memberNames && team.memberNames.length > 0 ? (
													team.memberNames.map((name: string, i: number) => (
															<div
																key={i}
																className='d-flex align-items-center'>
																<div className='bg-black w-4px h-4px rounded-circle me-2'></div>
																<span className='fw-bold text-black fs-7'>{name}</span>
															</div>
														))
													) : (
														<span className='text-black fs-8 italic'>No members</span>
													)}
												</div>
											</td>
											<td>
												<span className='text-black fw-bold'>
													{DayJS(team.assignedDate).format('DD/MM/YYYY')}
												</span>
											</td>
											<td className='d-flex align-items-center gap-2'>
												<button
													className='btn btn-light-warning btn-sm'
													title='Team Rating'
													onClick={() => navigate(`/hr/team-rating?id=${id}&team_id=${team.id}`)}>
													<i className='bi bi-star-fill fs-4 me-1'></i>
													Rating
												</button>
												<TableButton
													action='view'
													onClick={() => handleViewTeamTasks(team)}
												/>
												<TableButton
													action='remove'
													onClick={() => handleRemoveTeam(team.id)}
												/>
											</td>
										</tr>
									)
								}}
							/>
						)}
					</div>

					{filteredAssignedTeams.length > 0 && (
						<div className='mt-5'>
							<UsersListPagination
								totalPages={metaData.totalPages}
								currentPage={pagination.page}
								onPageChange={(p) => setPagination({ ...pagination, page: p })}
							/>
						</div>
					)}
				</Card.Body>
			</Card>

			{/* Add Team Modal */}
			<Modal
				show={showAddTeamModal}
				onHide={() => setShowAddTeamModal(false)}
				centered
				size='lg'>
				<Modal.Header
					closeButton
					className='border-0 pt-7 px-9'>
					<Modal.Title className='fw-bolder fs-1'>Assign Team</Modal.Title>
				</Modal.Header>
				<Modal.Body className='py-8 px-9'>
					<Form>
						<div className='mb-8'>
							<Form.Group className='mb-6'>
								<Form.Label className='fw-bold fs-6 mb-2 d-flex align-items-center'>
									<i className='bi bi-briefcase text-primary me-2 fs-4'></i>
									<span>Select Position</span>
								</Form.Label>
								<Form.Select
									className='form-select form-select-solid fw-bold fs-6 h-50px'
									value={newTeamData.position}
									onChange={(e) =>
										setNewTeamData({ ...newTeamData, position: e.target.value, leaderId: '' })
									}>
									<option value=''>Choose a role for this team...</option>
									{uniquePositions.map((pos) => (
										<option
											key={pos}
											value={pos}>
											{pos}
										</option>
									))}
								</Form.Select>
								<Form.Text className='text-muted fs-7 ps-1'>
									Choosing a position will unlock the matching leader list.
								</Form.Text>
							</Form.Group>

							<Form.Group className='mb-6'>
								<Form.Label className='fw-bold fs-6 mb-2 d-flex align-items-center'>
									<i className='bi bi-person-badge text-primary me-2 fs-4'></i>
									<span>Select Team Leader</span>
								</Form.Label>
								<Form.Select
									className='form-select form-select-solid fw-bold fs-6 h-50px'
									disabled={!newTeamData.position}
									value={newTeamData.leaderId}
									onChange={(e) => setNewTeamData({ ...newTeamData, leaderId: e.target.value })}>
									<option value=''>Choose the team head...</option>
									{filteredLeaders.map((emp) => (
										<option
											key={emp._id}
											value={emp._id}>
											{emp.full_name}
										</option>
									))}
								</Form.Select>
								{!newTeamData.position && (
									<Form.Text className='text-danger fs-8 ps-1 italic'>
										* Please select a position first
									</Form.Text>
								)}
							</Form.Group>
						</div>

						<Form.Group>
							<Form.Label className='fw-bold fs-6 mb-4 d-flex align-items-center'>
								<i className='bi bi-people text-primary me-2 fs-4'></i>
								<span>Select Team Members</span>
							</Form.Label>
							<div className='multi-select-container'>
								<MultiSelect
									options={filteredLeaders
										.filter((emp) => emp._id !== newTeamData.leaderId)
										.map((emp) => ({
											label: emp.full_name,
											value: emp._id,
										}))}
									value={filteredLeaders
										.filter((emp) => newTeamData.memberIds.includes(emp._id))
										.map((emp) => ({
											label: emp.full_name,
											value: emp._id,
										}))}
									valueRenderer={(selected, _options) => {
										if (selected.length === 0)
											return !newTeamData.position
												? 'Choose a position first...'
												: 'Select team members...'
										return selected.map(({ label }) => label).join(', ')
									}}
									disabled={!newTeamData.position}
									onChange={(selected: any) =>
										setNewTeamData({
											...newTeamData,
											memberIds: selected.map((s: any) => s.value),
										})
									}
									labelledBy='Select Team Members'
									className='form-control-solid fw-bold'
									overrideStrings={{
										selectSomeItems: !newTeamData.position
											? 'Choose a position first...'
											: 'Select team members...',
										allItemsAreSelected: 'All members selected',
										selectAll: 'Select All',
										search: 'Search members...',
									}}
								/>
							</div>
						</Form.Group>
					</Form>
				</Modal.Body>
				<Modal.Footer className='border-0 pt-0 pb-10 px-9'>
					<Button
						variant='secondary'
						className='btn btn-active-light-primary fw-bold me-3'
						onClick={() => setShowAddTeamModal(false)}>
						Cancel
					</Button>
					<Button
						className='btn btn-primary fw-bold px-8'
						disabled={!newTeamData.position || !newTeamData.leaderId}
						onClick={handleConfirmCreateTeam}>
						Assign Team
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}

export default ManagerDetailsView
