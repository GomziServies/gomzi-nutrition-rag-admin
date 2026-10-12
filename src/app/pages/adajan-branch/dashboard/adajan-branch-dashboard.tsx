import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdajanBranchClient } from '../../../Functions/FGGroup/AdajanBranchClient'
import { GetAdajanBranchEmployees } from '../../../Functions/FGGroup/AdajanBranchEmployee'
import { calculateMembershipDays } from '../../../utils/dateUtils'

// ===========================
// TYPES & INTERFACES
// ===========================

interface TimeSlot {
	id: string
	time: string
	maxCapacity: number
}

interface DashboardTrainer {
	_id: string
	name: string
	phone?: string
	email?: string
	timeSlotAssignments: { [timeSlotId: string]: string[] }
}

interface ClientRow {
	_id: string
	name: string
	phone: string
	email: string
	planDuration: string
	joiningDate: string
	expiryDate: string
	remainingDays: number | null
	image?: string
}

interface TrainerRow {
	_id: string
	name: string
	phone: string
	mobile?: string
	email: string
	totalClients: number
	image?: string
}

// ===========================
// DUMMY DATA (For Attendance Modal)
// ===========================

const DASHBOARD_TIME_SLOTS: TimeSlot[] = [
	{ id: '1', time: '06:00 AM - 07:00 AM', maxCapacity: 3 },
	{ id: '2', time: '07:00 AM - 08:00 AM', maxCapacity: 3 },
	{ id: '3', time: '08:00 AM - 09:00 AM', maxCapacity: 3 },
	{ id: '4', time: '09:00 AM - 10:00 AM', maxCapacity: 3 },
	{ id: '5', time: '10:00 AM - 11:00 AM', maxCapacity: 3 },
	{ id: '6', time: '05:00 PM - 06:00 PM', maxCapacity: 3 },
	{ id: '7', time: '06:00 PM - 07:00 PM', maxCapacity: 3 },
	{ id: '8', time: '07:00 PM - 08:00 PM', maxCapacity: 3 },
]

// ... (imports remain same)

// Remove DUMMY_TRAINERS_DATA constant

// ... (Helper functions remain same or can be moved inside if needed)

// ===========================
// HELPER FUNCTIONS
// ===========================

const getTrainerSlotLoad = (trainer: DashboardTrainer, timeSlotId: string): number => {
	const arr = trainer.timeSlotAssignments[timeSlotId]
	return arr ? arr.length : 0
}

// ===========================
// ATTENDANCE MODAL
// ===========================

const AttendanceModal: React.FC<{
	show: boolean
	onClose: () => void
	trainers: DashboardTrainer[]
	totalClients: number
}> = ({ show, onClose, trainers, totalClients }) => {
	if (!show) return null

	const totalTrainers = trainers.length
	const totalAttendance = trainers.reduce((acc, trainer) => {
		return (
			acc +
			Object.values(trainer.timeSlotAssignments).reduce((sum, clients) => sum + clients.length, 0)
		)
	}, 0)

	return (
		<>
			<div
				className='modal fade show d-block'
				tabIndex={-1}
				style={{ zIndex: 1055 }}>
				<div className='modal-dialog modal-dialog-centered modal-xl'>
					{/* ... (Modal content structure remains same, just using `trainers` prop) */}
					<div
						className='modal-content border-0 shadow-lg'
						style={{ borderRadius: '12px' }}>
						<div className='modal-header border-0 pb-0 pt-6 px-6'>
							<h5 className='modal-title fw-bold text-gray-800 fs-2'>
								Time Slot Attendance & Trainer Load
							</h5>
							<button
								type='button'
								className='btn btn-icon btn-sm btn-active-light-primary ms-auto'
								onClick={onClose}
								aria-label='Close'>
								<KTIcon
									iconName='cross'
									className='fs-1'
								/>
							</button>
						</div>
						<div
							className='modal-body pt-4 px-6 pb-6'
							style={{ maxHeight: '75vh', overflowY: 'auto' }}>
							<div className='table-responsive'>
								<table className='table table-row-bordered table-row-gray-200 align-middle gs-0 gy-4'>
									<thead>
										<tr className='fw-bold text-muted text-uppercase fs-7'>
											<th className='min-w-150px ps-4'>Time Slot</th>
											{trainers.map((trainer) => (
												<th
													key={trainer._id}
													className='min-w-120px text-center'>
													{trainer.name}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{DASHBOARD_TIME_SLOTS.map((slot) => {
											return (
												<tr key={slot.id}>
													<td className='ps-4'>
														<div className='d-flex flex-column'>
															<span className='text-gray-800 fw-bold fs-6'>{slot.time}</span>
															<span className='text-muted fs-7'>Capacity: {slot.maxCapacity}</span>
														</div>
													</td>
													{trainers.map((trainer) => {
														const load = getTrainerSlotLoad(trainer, slot.id)
														const isFull = load >= slot.maxCapacity
														const isWarning = load === slot.maxCapacity - 1 && slot.maxCapacity > 1

														return (
															<td
																key={trainer._id}
																className='text-center'>
																<div
																	className={`badge py-3 px-4 fs-7 w-100 ${
																		isFull
																			? 'badge-light-danger text-danger'
																			: isWarning
																			? 'badge-light-warning text-warning'
																			: 'badge-light-success text-success'
																	}`}
																	style={{
																		border: isFull
																			? '1px solid #f1416c'
																			: isWarning
																			? '1px solid #ffc700'
																			: 'none',
																	}}>
																	<span className='fw-bolder'>
																		{load}/{slot.maxCapacity}
																	</span>
																	{isFull && (
																		<span className='ms-1 d-block d-md-inline'>(FULL)</span>
																	)}
																</div>
															</td>
														)
													})}
												</tr>
											)
										})}
									</tbody>
								</table>
							</div>

							<div className='separator separator-dashed my-5'></div>
							<div className='row g-4'>
								<div className='col-md-4'>
									<div className='card bg-light-primary border-0 h-100'>
										<div className='card-body text-center py-5'>
											<KTIcon
												iconName='calendar-tick'
												className='fs-2x text-primary mb-2'
											/>
											<div className='fw-bold fs-2 text-gray-800'>{totalAttendance}</div>
											<div className='text-muted fs-7'>Total Attendance</div>
										</div>
									</div>
								</div>
								<div className='col-md-4'>
									<div className='card bg-light-success border-0 h-100'>
										<div className='card-body text-center py-5'>
											<KTIcon
												iconName='people'
												className='fs-2x text-success mb-2'
											/>
											<div className='fw-bold fs-2 text-gray-800'>{totalClients}</div>{' '}
											{/* Uses global const/prop if passed, but here simplified */}
											<div className='text-muted fs-7'>Total Members</div>
										</div>
									</div>
								</div>
								<div className='col-md-4'>
									<div className='card bg-light-info border-0 h-100'>
										<div className='card-body text-center py-5'>
											<KTIcon
												iconName='profile-user'
												className='fs-2x text-info mb-2'
											/>
											<div className='fw-bold fs-2 text-gray-800'>{totalTrainers}</div>
											<div className='text-muted fs-7'>Total Trainers</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='modal-footer border-0 pt-0 px-6 pb-6'>
							<button
								type='button'
								className='btn btn-light-danger'
								onClick={onClose}>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
			<div
				className='modal-backdrop fade show'
				onClick={onClose}
				style={{ zIndex: 1050 }}
				aria-hidden='true'
			/>
		</>
	)
}

// ===========================
// STATS CARDS COMPONENT
// ===========================

const DashboardStatsCards: React.FC = () => {
	const [showAttendanceModal, setShowAttendanceModal] = useState(false)
	const [totalClients, setTotalClients] = useState(0)
	const [totalTrainers, setTotalTrainers] = useState(0)
	const [processedTrainers, setProcessedTrainers] = useState<DashboardTrainer[]>([])
	const [loading, setLoading] = useState(false)

	const todayAttendance = processedTrainers.reduce((acc, t) => {
		return acc + Object.values(t.timeSlotAssignments).reduce((sum, c) => sum + c.length, 0)
	}, 0)

	const fetchTotals = async () => {
		setLoading(true)
		try {
			// 1. Fetch Clients (all) to get assignments
			const clientResponse: any = await GetAdajanBranchClient({
				page: 1,
				limit: 1000,
			})
			const clientList = clientResponse.data || []

			let clientCount = 0
			if (clientResponse.metadata?.pagination?.totalRecords) {
				clientCount = clientResponse.metadata.pagination.totalRecords
			} else {
				clientCount = clientList.length
			}
			setTotalClients(clientCount)

			// 2. Fetch Trainers (all)
			const employeeResponse: any = await GetAdajanBranchEmployees({
				page: 1,
				limit: 1000,
				position: 'Trainer',
			})
			const trainerList = employeeResponse.data || []

			let employeeCount = 0
			if (employeeResponse.metadata?.pagination?.totalRecords) {
				employeeCount = employeeResponse.metadata.pagination.totalRecords
			} else {
				employeeCount = trainerList.length
			}
			setTotalTrainers(employeeCount)

			// 3. Process Assignments
			const byTrainer: Record<string, Record<string, string[]>> = {}

			// Initialize for all trainers
			trainerList.forEach((t: any) => {
				byTrainer[t._id] = {}
			})

			clientList.forEach((client: any) => {
				if (client.assignedTrainer && client.timeSlotId) {
					const tId = client.assignedTrainer._id || client.assignedTrainer
					const sId = client.timeSlotId

					if (byTrainer[tId]) {
						if (!byTrainer[tId][sId]) byTrainer[tId][sId] = []
						byTrainer[tId][sId].push(client._id)
					}
				}
			})

			const processed: DashboardTrainer[] = trainerList.map((t: any) => ({
				_id: t._id,
				name: t.name,
				phone: t.mobile,
				email: t.email,
				timeSlotAssignments: byTrainer[t._id] || {},
			}))
			setProcessedTrainers(processed)
		} catch (error) {
			toast.error('Failed to load statistics')
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTotals()
	}, [])

	return (
		<>
			<div className='row g-5 g-xl-8 mb-5 mb-xl-8 align-items-stretch'>
				<div className='col-xl-4 col-md-6 d-flex'>
					<div
						className='card card-xl-stretch w-100 h-100'
						style={{ minHeight: '140px' }}>
						<div className='card-body d-flex align-items-center py-8'>
							<div className='symbol symbol-60px me-5'>
								<span className='symbol-label bg-light-primary'>
									<KTIcon
										iconName='people'
										className='fs-2x text-primary'
									/>
								</span>
							</div>
							<div className='flex-grow-1'>
								<span className='text-muted fw-semibold d-block fs-7 mb-1'>Total Clients</span>
								<span className='text-dark fw-bold fs-2x'>
									{loading ? (
										<span className='spinner-border spinner-border-sm'></span>
									) : (
										totalClients
									)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className='col-xl-4 col-md-6 d-flex'>
					<div
						className='card card-xl-stretch w-100 h-100'
						style={{ minHeight: '140px' }}>
						<div className='card-body d-flex align-items-center py-8'>
							<div className='symbol symbol-60px me-5'>
								<span className='symbol-label bg-light-success'>
									<KTIcon
										iconName='profile-user'
										className='fs-2x text-success'
									/>
								</span>
							</div>
							<div className='flex-grow-1'>
								<span className='text-muted fw-semibold d-block fs-7 mb-1'>Total Trainers</span>
								<span className='text-dark fw-bold fs-2x'>
									{loading ? (
										<span className='spinner-border spinner-border-sm'></span>
									) : (
										totalTrainers
									)}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className='col-xl-4 col-md-6 d-flex'>
					<div
						className='card card-xl-stretch w-100 h-100 cursor-pointer'
						onClick={() => setShowAttendanceModal(true)}
						style={{ minHeight: '140px', transition: 'transform 0.2s' }}
						onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
						onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
						<div className='card-body d-flex align-items-center py-8'>
							<div className='symbol symbol-60px me-5'>
								<span className='symbol-label bg-light-warning'>
									<KTIcon
										iconName='calendar-tick'
										className='fs-2x text-warning'
									/>
								</span>
							</div>
							<div className='flex-grow-1'>
								<span className='text-muted fw-semibold d-block fs-7 mb-1'>
									Today&apos;s Attendance
								</span>
								<span className='text-dark fw-bold fs-2x'>
									{loading ? (
										<span className='spinner-border spinner-border-sm'></span>
									) : (
										todayAttendance
									)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<AttendanceModal
				show={showAttendanceModal}
				onClose={() => setShowAttendanceModal(false)}
				trainers={processedTrainers}
				totalClients={totalClients}
			/>
		</>
	)
}

// ===========================
// CLIENT TABLE COMPONENT
// ===========================

const DashboardClientTable: React.FC = () => {
	const [clients, setClients] = useState<ClientRow[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>() // ✅ Add metadata state
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 5,
	})

	const fetchClients = async () => {
		setLoading(true)
		try {
			// Fetch all non-expired clients to filter by remaining days in frontend
			// (Using 1000 as a large enough limit for dashboard view)
			const response: any = await GetAdajanBranchClient({
				page: 1,
				limit: 1000,
				sort: 'expiryDate',
				sortOrder: 'asc',
				expired: false, // Only fetch active/remaining clients
			} as any)
			const clientData = response.data || []

			// Filter by remaining days <= 30 as requested
			const filteredSoonExpiring = clientData.filter((client: any) => {
				const rDays = client.remainingDays !== null ? client.remainingDays : 999999
				return rDays <= 30
			})

			// Sort by remaining days (ascending)
			const sortedClients = filteredSoonExpiring.sort((a: any, b: any) => {
				const aDays = a.remainingDays !== null ? a.remainingDays : 999999
				const bDays = b.remainingDays !== null ? b.remainingDays : 999999
				return aDays - bDays
			})

			setClients(sortedClients)
			setMetaData(response.metadata?.pagination) // ✅ Save metadata
		} catch (error: any) {
			toast.error('Failed to fetch clients')
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchClients()
	}, [pagination.page, pagination.itemsPerPage])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	return (
		<KTCard>
			<div className='card-header border-0 pt-6'>
				<div className='d-flex flex-wrap align-items-center justify-content-between w-100'>
					<div className='d-flex align-items-center'>
						<h3 className='card-title fw-bold me-3'>
							Adajan-Branch Clients (Expiring within 1 Month)
						</h3>
						{loading && <span className='spinner-border spinner-border-sm text-primary'></span>}
					</div>
					<LengthMenu
						expenseData={clients}
						handleItemsPerPageChange={handleItemsPerPageChange}
					/>
				</div>
			</div>
			<div className='py-4 card-body position-relative'>
				<div className='table-responsive'>
					<table
						className='table align-middle table-row-dashed gy-5'
						style={{
							opacity: loading ? 0.5 : 1,
							transition: 'opacity 0.3s ease-in-out',
							pointerEvents: loading ? 'none' : 'auto',
						}}>
						<thead>
							<tr className='text-start text-muted fw-bold text-uppercase gs-0'>
								<th className='min-w-50px text-center'>No.</th>
								<th className='min-w-150px'>Name</th>
								<th className='min-w-125px'>Phone</th>
								<th className='min-w-200px'>Email</th>
								<th className='min-w-100px'>Remaining Days</th>
								<th className='min-w-100px'>Plan Duration</th>
								<th className='min-w-125px'>Joining Date</th>
								<th className='min-w-100px text-end'>Action</th>
							</tr>
						</thead>
						<tbody className='fw-semibold'>
							{clients.map((client, index) => {
								const { remainingDays } = calculateMembershipDays(
									client.joiningDate,
									client.expiryDate
								)

								return (
									<tr key={client._id}>
										<td className='text-center'>
											<span className='text-dark fw-bold'>
												{(pagination.page - 1) * pagination.itemsPerPage + index + 1}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold'>{client.name}</span>
										</td>
										<td>
											<span className='text-dark'>{client.phone}</span>
										</td>
										<td>
											<span className='text-dark'>{client.email}</span>
										</td>
										<td>
											{remainingDays <= 0 ? (
												<span
													className='badge rounded-pill py-2 px-3'
													style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
													{Math.abs(remainingDays)} Days Expired
												</span>
											) : remainingDays <= 30 ? (
												<span
													className='badge rounded-pill py-2 px-3'
													style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
													{remainingDays} Days Remaining
												</span>
											) : (
												<span
													className='badge rounded-pill py-2 px-3'
													style={{ backgroundColor: '#e8fff3', color: '#50cd89' }}>
													{remainingDays} Days Remaining
												</span>
											)}
										</td>
										<td>
											<span className='badge badge-light-primary'>{client.planDuration}</span>
										</td>
										<td>
											<span className='text-dark'>
												{new Date(client.joiningDate).toLocaleDateString('en-IN', {
													day: '2-digit',
													month: 'short',
													year: 'numeric',
												})}
											</span>
										</td>
										<td className='text-end'>
											<TableButton
												action='view'
												to={`/adajan-branch/client/view?id=${client._id}`}
											/>
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>

				{clients.length === 0 && !loading && (
					<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
						<b>No records found</b>
					</div>
				)}

				{/* Pagination - always show when data exists */}
				{clients.length > 0 && (
					<div className='mt-5'>
						<UsersListPagination
							totalPages={
								metaData?.totalPages || Math.ceil(clients.length / pagination.itemsPerPage)
							}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>
		</KTCard>
	)
}

// ===========================
// TRAINER TABLE COMPONENT
// ===========================

const DashboardTrainerTable: React.FC = () => {
	const [trainers, setTrainers] = useState<TrainerRow[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>() // ✅ Add metadata state
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 5,
	})

	const fetchTrainers = async () => {
		setLoading(true)
		try {
			const response: any = await GetAdajanBranchEmployees({
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort: 'createdAt',
				sortOrder: 'desc',
				position: 'Trainer',
			})
			const trainerData = (response.data || []).map((emp: any) => ({
				_id: emp._id,
				name: emp.name,
				phone: emp.mobile || emp.phone || 'N/A',
				email: emp.email,
				totalClients: emp.totalClients || 0,
				image: emp.photo,
			}))
			setTrainers(trainerData)
			setMetaData(response.metadata?.pagination) // ✅ Save metadata
		} catch (error: any) {
			toast.error('Failed to fetch trainers')
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTrainers()
	}, [pagination.page, pagination.itemsPerPage])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	return (
		<KTCard>
			<div className='card-header border-0 pt-6'>
				<div className='d-flex flex-wrap align-items-center justify-content-between w-100'>
					<h3 className='card-title fw-bold'>Adajan-Branch Trainers</h3>
					<LengthMenu
						expenseData={trainers}
						handleItemsPerPageChange={handleItemsPerPageChange}
					/>
				</div>
			</div>
			<div className='py-4 card-body'>
				{loading ? (
					<div
						className='d-flex justify-content-center align-items-center'
						style={{ minHeight: '200px' }}>
						<span className='spinner-border spinner-border-lg'></span>
					</div>
				) : (
					<>
						<div className='table-responsive'>
							<table className='table align-middle table-row-dashed gy-5'>
								<thead>
									<tr className='text-start text-muted fw-bold text-uppercase gs-0'>
										<th className='min-w-50px text-center'>No.</th>
										<th className='min-w-150px'>Name</th>
										<th className='min-w-125px'>Phone</th>
										<th className='min-w-200px'>Email</th>
										<th className='min-w-100px text-center'>Total Members</th>
										<th className='min-w-100px text-end'>Action</th>
									</tr>
								</thead>
								<tbody className='fw-semibold'>
									{trainers.map((trainer, index) => (
										<tr key={trainer._id}>
											<td className='text-center'>
												<span className='text-dark fw-bold'>
													{(pagination.page - 1) * pagination.itemsPerPage + index + 1}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold'>{trainer.name}</span>
											</td>
											<td>
												<span className='text-dark'>{trainer.phone}</span>
											</td>
											<td>
												<span className='text-dark'>{trainer.email}</span>
											</td>
											<td className='text-center'>
												<span className=''>{trainer.totalClients}</span>
											</td>
											<td className='text-end'>
												<TableButton
													action='view'
													to='/adajan-branch/trainer/list'
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{trainers.length === 0 && (
							<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
								<b>No records found</b>
							</div>
						)}

						{/* ✅ Pagination - always show when data exists */}
						{trainers.length > 0 && (
							<div className='mt-5'>
								<UsersListPagination
									totalPages={
										metaData?.totalPages || Math.ceil(trainers.length / pagination.itemsPerPage)
									}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							</div>
						)}
					</>
				)}
			</div>
		</KTCard>
	)
}

// ===========================
// EXPIRED CLIENT TABLE COMPONENT
// ===========================

const DashboardExpiredClientTable: React.FC = () => {
	const [clients, setClients] = useState<ClientRow[]>([])
	const [loading, setLoading] = useState(false)
	const [metaData, setMetaData] = useState<any>()
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 5,
	})

	const fetchClients = async () => {
		setLoading(true)
		try {
			const response: any = await GetAdajanBranchClient({
				page: pagination.page,
				limit: pagination.itemsPerPage,
				sort: 'expiryDate',
				sortOrder: 'desc',
				expired: true,
			} as any)
			const clientData = response.data || []
			setClients(clientData)
			setMetaData(response.metadata?.pagination)
		} catch (error: any) {
			toast.error('Failed to fetch expired clients')
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchClients()
	}, [pagination.page, pagination.itemsPerPage])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	return (
		<KTCard
			className='shadow-sm overflow-hidden'
			style={{
				border: '1px solid #fca5bc',
				borderRadius: '12px',
				backgroundColor: '#fffafb',
			}}>
			{/* ── Card Header ── */}
			<div
				className='card-header border-0 pt-5 pb-4 px-6 bg-light-danger'
				style={{ borderRadius: '10px 10px 0 0' }}>
				<div className='d-flex flex-wrap align-items-center justify-content-between w-100'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center'
							style={{
								width: 40,
								height: 40,
								backgroundColor: 'rgba(241, 65, 108, 0.1)',
								borderRadius: '10px',
							}}>
							<i className='bi bi-exclamation-triangle-fill text-danger fs-4'></i>
						</div>
						<div>
							<h3 className='card-title fw-bold text-danger mb-0 fs-4'>Expired Clients</h3>
							<span className='text-gray-600 fs-8'>Plan expired — renewal required</span>
						</div>
						{loading && <span className='spinner-border spinner-border-sm text-danger ms-2'></span>}
					</div>
					<div>
						<LengthMenu
							expenseData={clients}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				</div>
			</div>

			{/* ── Card Body ── */}
			<div className='py-4 card-body position-relative px-6'>
				<div className='table-responsive'>
					<table
						className='table align-middle gy-4'
						style={{
							opacity: loading ? 0.5 : 1,
							transition: 'opacity 0.3s ease-in-out',
							pointerEvents: loading ? 'none' : 'auto',
						}}>
						<thead>
							<tr
								style={{
									backgroundColor: '#fef0f4',
									borderRadius: '8px',
								}}>
								<th
									className='min-w-50px text-center fw-bold text-uppercase fs-8 ps-4 py-3'
									style={{ borderRadius: '8px 0 0 8px', color: '#c4607a' }}>
									No.
								</th>
								<th
									className='min-w-150px fw-bold text-uppercase fs-8 py-3'
									style={{ color: '#c4607a' }}>
									Name
								</th>
								<th
									className='min-w-125px fw-bold text-uppercase fs-8 py-3'
									style={{ color: '#c4607a' }}>
									Phone
								</th>
								<th
									className='min-w-200px fw-bold text-uppercase fs-8 py-3'
									style={{ color: '#c4607a' }}>
									Email
								</th>
								<th
									className='min-w-100px fw-bold text-uppercase fs-8 py-3'
									style={{ color: '#c4607a' }}>
									Plan
								</th>
								<th
									className='min-w-125px fw-bold text-uppercase fs-8 py-3'
									style={{ color: '#c4607a' }}>
									Joining Date
								</th>
								<th
									className='min-w-125px fw-bold text-uppercase fs-8 py-3'
									style={{ color: '#c4607a' }}>
									Expiry Date
								</th>
								<th
									className='min-w-100px text-end fw-bold text-uppercase fs-8 pe-4 py-3'
									style={{ borderRadius: '0 8px 8px 0', color: '#c4607a' }}>
									Action
								</th>
							</tr>
						</thead>
						<tbody>
							{clients.map((client, index) => (
								<tr
									key={client._id}
									style={{
										backgroundColor: index % 2 === 0 ? '#fffafb' : '#fff',
										borderBottom: '1px solid #fde8ee',
										transition: 'background-color 0.2s',
									}}
									onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff0f4')}
									onMouseLeave={(e) =>
										(e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fffafb' : '#fff')
									}>
									{/* No. */}
									<td className='text-center ps-4'>
										<span
											className='fw-bold fs-7'
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: 28,
												height: 28,
												borderRadius: '50%',
												backgroundColor: '#fde8ee',
												color: '#c4607a',
											}}>
											{(pagination.page - 1) * pagination.itemsPerPage + index + 1}
										</span>
									</td>

									{/* Name with avatar */}
									<td>
										<div className='d-flex align-items-center gap-3'>
											<div
												className='fw-bold fs-7 d-flex align-items-center justify-content-center flex-shrink-0'
												style={{
													width: 34,
													height: 34,
													borderRadius: '8px',
													backgroundColor: '#fde8ee',
													color: '#c4607a',
													letterSpacing: 0.5,
												}}>
												{client.name?.charAt(0).toUpperCase()}
											</div>
											<span className='text-gray-800 fw-bold fs-6'>{client.name}</span>
										</div>
									</td>

									{/* Phone */}
									<td>
										<span className='text-gray-700 fs-6'>{client.phone}</span>
									</td>

									{/* Email */}
									<td>
										<span className='text-gray-700 fs-6'>{client.email}</span>
									</td>

									{/* Plan Duration */}
									<td>
										<span
											className='badge fw-semibold px-3 py-2'
											style={{
												backgroundColor: '#fde8ee',
												color: '#c4607a',
												borderRadius: '6px',
												fontSize: '12px',
											}}>
											{client.planDuration}
										</span>
									</td>

									{/* Joining Date */}
									<td>
										<span className='text-gray-700 fs-6'>
											{new Date(client.joiningDate).toLocaleDateString('en-IN', {
												day: '2-digit',
												month: 'short',
												year: 'numeric',
											})}
										</span>
									</td>

									{/* Expiry Date */}
									<td>
										<span
											className='d-flex align-items-center gap-1 fw-semibold fs-7'
											style={{ color: '#f1416c' }}>
											<i
												className='bi bi-calendar-x-fill'
												style={{ fontSize: 13 }}></i>
											{client.expiryDate
												? new Date(client.expiryDate).toLocaleDateString('en-IN', {
														day: '2-digit',
														month: 'short',
														year: 'numeric',
												  })
												: '-'}
										</span>
										<div className='mt-1'>
											<span
												className='badge rounded-pill py-1 px-2'
												style={{ backgroundColor: '#fff5f8', color: '#f1416c', fontSize: '10px' }}>
												{calculateMembershipDays(client.joiningDate, client.expiryDate).expiredDays}{' '}
												Days Expired
											</span>
										</div>
									</td>

									{/* Action */}
									<td className='text-end pe-4'>
										<TableButton
											action='view'
											to={`/adajan-branch/client/view?id=${client._id}`}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Empty state */}
				{clients.length === 0 && !loading && (
					<div className='d-flex flex-column align-items-center justify-content-center py-10'>
						<i
							className='bi bi-check-circle-fill text-success'
							style={{ fontSize: 48 }}></i>
						<p className='text-muted fw-semibold mt-3 mb-0'>No expired clients — great job!</p>
					</div>
				)}

				{/* Pagination */}
				{clients.length > 0 && (
					<div className='mt-5'>
						<UsersListPagination
							totalPages={
								metaData?.totalPages || Math.ceil(clients.length / pagination.itemsPerPage)
							}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>
		</KTCard>
	)
}

// ===========================
// MAIN DASHBOARD
// ===========================

const DashboardPage = () => {
	return (
		<>
			<div className='row g-5 g-xl-5'>
				<div className='col-12'>
					<DashboardStatsCards />
				</div>
				<div className='col-12'>
					<DashboardExpiredClientTable />
				</div>
				<div className='col-12'>
					<DashboardClientTable />
				</div>
				<div className='col-12'>
					<DashboardTrainerTable />
				</div>
			</div>
		</>
	)
}

const DashboardAdajanBranch = () => {
	return (
		<>
			<PageTitle breadcrumbs={[]}>Adajan-Branch Dashboard</PageTitle>
			<DashboardPage />
		</>
	)
}

export { DashboardAdajanBranch }
