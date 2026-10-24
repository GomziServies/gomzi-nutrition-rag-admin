import { faEdit, faEye, faPlus, faRotateLeft, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateTarget, DeleteTarget, GetTarget, UpdateTarget } from '../../../Functions/FGGroup/Target'

const EmployeeTarget: React.FC = () => {
	const [loading, setLoading] = useState(true)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [targetData, setTargetData] = useState<any[]>([])
	const [showAddModal, setShowAddModal] = useState(false)
	const [showUpdateModal, setShowUpdateModal] = useState(false)

	const [targetAddData, setTargetAddData] = useState({
		target_title: '',
		from_date: '',
		to_date: '',
		target_description: '',
		position: '',
	})

	const [targetUpdateData, setTargetUpdateData] = useState({
		target_id: '',
		target_title: '',
		from_date: '',
		to_date: '',
		target_description: '',
		position: '',
	})

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const getStoredEmployee = () => {
		try {
			const raw =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			return raw ? JSON.parse(raw) : {}
		} catch {
			return {}
		}
	}

	const fetchAssignTaskData = async () => {
		setLoading(true)
		try {
			const employee = getStoredEmployee()
			const empId = employee?._id || employee?.id
			let empPosition = employee?.position

			if (empId) {
				try {
					const positionData: any = await GetEmployees({ id: empId })
					if (positionData?.data?.[0]?.employee?.position) {
						empPosition = positionData.data[0].employee.position
					}
				} catch (posErr) {
					console.warn('Could not fetch employee profile position:', posErr)
				}
			}

			const response: any = await GetTarget()
			let filteredData: any[] = response?.data || []

			if (empPosition) {
				const targetMatches = filteredData.filter(
					(el: any) => !el.position || el.position.toLowerCase() === empPosition.toLowerCase()
				)
				if (targetMatches.length > 0) {
					filteredData = targetMatches
				}
			}
			setTargetData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchAssignTaskData()
	}, [])

	const handleSubmit = async () => {
		try {
			const { target_title, from_date, to_date, target_description, position } = targetAddData

			if (!target_title.trim()) {
				toast.error('Target Title is required')
				return
			}

			const payload: any = {
				target_title,
				from_date,
				to_date,
				target_description,
				position,
			}

			await CreateTarget(payload)
			toast.success('Target Created Successfully')
			setShowAddModal(false)
			setTargetAddData({
				target_title: '',
				from_date: '',
				to_date: '',
				target_description: '',
				position: '',
			})

			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message || 'Failed to create target')
			console.error(error)
		}
	}

	const handleUpdate = async () => {
		try {
			const { target_id, target_title, from_date, to_date, target_description, position } =
				targetUpdateData

			if (!target_title.trim()) {
				toast.error('Target Title is required')
				return
			}

			const payload: any = {
				target_id: target_id,
				target_title,
				from_date,
				to_date,
				target_description,
				position,
			}

			await UpdateTarget(payload)
			toast.success('Target Updated Successfully')
			setShowUpdateModal(false)

			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message || 'Failed to update target')
			console.error(error)
		}
	}

	const handleDeleteTarget = async (targetId: string, title: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `Do you want to delete the target "${title}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		})

		if (result.isConfirmed) {
			try {
				await DeleteTarget({ target_id: targetId })
				Swal.fire('Deleted!', 'Target has been deleted.', 'success')
				fetchAssignTaskData()
			} catch (error) {
				console.error('Error deleting target:', error)
				Swal.fire('Error!', 'Failed to delete target.', 'error')
			}
		}
	}

	const handleOpenEdit = (target: any) => {
		setTargetUpdateData({
			target_id: target._id || '',
			target_title: target.target_title || '',
			from_date: target.from_date || '',
			to_date: target.to_date || '',
			target_description: target.target_description || '',
			position: target.position || '',
		})
		setShowUpdateModal(true)
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setTargetAddData({ ...targetAddData, [name]: value })
	}

	const handleUpdateInputChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target
		setTargetUpdateData({ ...targetUpdateData, [name]: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredtargetData = targetData.filter(
		(sale) =>
			(sale.target_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(sale.target_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(sale.position || '').toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedtargetData = filteredtargetData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Target Title', field: 'target_title' },
		{ title: 'Description', field: 'target_description' },
		{ title: 'Position', field: 'position' },
		{ title: 'Start Date', field: 'createdAt' },
		{ title: 'End Date', field: 'updatedAt' },
		{ title: 'Target Days', field: 'days' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		setVisibleDetails(visibleDetails === id ? null : id)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>My Targets</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-column gap-4'>
					{/* Header Top: Title & Right Actions */}
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 w-100'>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h2 className='fw-bolder text-gray-900 mb-0'>My Targets</h2>
								<span className='badge badge-light-primary fw-bold fs-8'>
									{filteredtargetData.length} records
								</span>
							</div>
							<span className='text-muted fs-7 fw-semibold mt-1'>
								Track performance goals, assigned quotas, milestone deadlines, and progress metrics
							</span>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<button
								type='button'
								className='btn btn-sm btn-light d-flex align-items-center gap-2 px-3'
								style={{ height: '38px', borderRadius: '10px' }}
								onClick={fetchAssignTaskData}
								disabled={loading}>
								<FontAwesomeIcon icon={faRotateLeft} className={loading ? 'fa-spin' : ''} />
								<span>Refresh</span>
							</button>

							<button
								type='button'
								className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
								style={{ height: '38px', borderRadius: '10px' }}
								onClick={() => setShowAddModal(true)}>
								<FontAwesomeIcon icon={faPlus} />
								<span>Add Target</span>
							</button>
						</div>
					</div>

					{/* Header Bottom: Filter Bar */}
					<div className='d-flex align-items-center flex-wrap gap-3 w-100 pb-2'>
						<div style={{ minWidth: '220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search targets by title or position...'
							/>
						</div>

						<LengthMenu
							expenseData={targetData}
							handleItemsPerPageChange={(val) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
							}
						/>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={paginatedtargetData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(target: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={target._id || index}>
									<tr
										onClick={() => handleRowClick(target._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{target.target_title || 'N/A'}
											</span>
										</td>
										<td>
											<span className='text-gray-700 fs-7'>
												{target.target_description || 'N/A'}
											</span>
										</td>
										<td>
											<span className='badge badge-light-primary fw-semibold px-3 py-1 fs-7'>
												{target.position || 'All Roles'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{target.createdAt ? DayJS(target.createdAt).format('DD/MM/YYYY') : 'N/A'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
												{target.to_date
													? DayJS(target.to_date).format('DD/MM/YYYY')
													: target.updatedAt
													? DayJS(target.updatedAt).format('DD/MM/YYYY')
													: 'N/A'}
											</span>
										</td>
										<td>
											<span className='badge badge-light-info fw-bold px-3 py-1 fs-7'>
												{target.createdAt && (target.to_date || target.updatedAt)
													? Math.max(
															1,
															DayJS(target.to_date || target.updatedAt).diff(
																DayJS(target.createdAt),
																'day'
															)
													  )
													: '0'}{' '}
												Days
											</span>
										</td>
										<td className='text-center py-4'>
											<div className='d-flex align-items-center justify-content-center gap-2'>
												<TableButton
													action='view'
													title='View Target Details'
													onClick={(e) => {
														e.stopPropagation()
														handleRowClick(target._id)
													}}
												/>
												<TableButton
													action='edit'
													title='Edit Target'
													onClick={(e) => {
														e.stopPropagation()
														handleOpenEdit(target)
													}}
												/>
												<TableButton
													action='remove'
													title='Delete Target'
													onClick={(e) => {
														e.stopPropagation()
														handleDeleteTarget(target._id, target.target_title)
													}}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-3 bg-light rounded-3'>
													<div className='row g-3'>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Target Title:</strong>
															<div className='text-gray-900 fw-bold'>{target.target_title || 'N/A'}</div>
														</div>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Assigned Role / Position:</strong>
															<div>
																<span className='badge badge-light-primary fw-semibold px-2 py-1 mt-1'>
																	{target.position || 'All Roles'}
																</span>
															</div>
														</div>
														<div className='col-md-4'>
															<strong className='text-gray-700'>Duration:</strong>
															<div className='text-primary fw-bold'>
																{target.createdAt && (target.to_date || target.updatedAt)
																	? `${Math.max(
																			1,
																			DayJS(target.to_date || target.updatedAt).diff(
																				DayJS(target.createdAt),
																				'day'
																			)
																	  )} Days`
																	: 'N/A'}
															</div>
														</div>
														<div className='col-md-6'>
															<strong className='text-gray-700'>Start Date:</strong>
															<div className='text-gray-800'>
																{target.createdAt ? DayJS(target.createdAt).format('DD/MM/YYYY, hh:mm A') : 'N/A'}
															</div>
														</div>
														<div className='col-md-6'>
															<strong className='text-gray-700'>Deadline / End Date:</strong>
															<div className='text-gray-800'>
																{target.to_date
																	? DayJS(target.to_date).format('DD/MM/YYYY, hh:mm A')
																	: target.updatedAt
																	? DayJS(target.updatedAt).format('DD/MM/YYYY, hh:mm A')
																	: 'N/A'}
															</div>
														</div>
														<div className='col-12'>
															<strong className='text-gray-700'>Description & Key Milestones:</strong>
															<div className='text-gray-800'>{target.target_description || 'N/A'}</div>
														</div>
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

					{filteredtargetData.length === 0 && !loading && (
						<div className='d-flex flex-column align-items-center justify-content-center text-center py-10 w-100'>
							<div
								className='rounded-circle d-flex align-items-center justify-content-center mb-3'
								style={{ width: '56px', height: '56px', background: '#eff6ff' }}>
								<i className='bi bi-bullseye fs-2' style={{ color: '#2563EB' }}></i>
							</div>
							<span className='fw-bold text-gray-700 fs-6'>No targets found</span>
							<span className='text-muted fs-7'>Targets assigned to your position will appear here.</span>
						</div>
					)}

					{filteredtargetData.length > 0 && (
						<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
							<div className='text-muted fs-7 fw-semibold'>
								Showing {filteredtargetData.length === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1} to{' '}
								{Math.min(pagination.page * pagination.itemsPerPage, filteredtargetData.length)} of {filteredtargetData.length} records
							</div>
							<UsersListPagination
								totalPages={Math.ceil(filteredtargetData.length / pagination.itemsPerPage) || 1}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Target Add Modal */}
			<Modal
				show={showAddModal}
				onHide={() => setShowAddModal(false)}
				centered
				dialogClassName='mw-650px'>
				<div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
					<div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder text-gray-900 m-0'>Add New Target</h3>
						<button
							type='button'
							className='btn btn-sm btn-icon btn-light-danger rounded-circle'
							onClick={() => setShowAddModal(false)}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>
					<div className='modal-body p-6'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Target Title'
									type='text'
									name='target_title'
									label='Target Title'
									htmlFor='target_title'
									value={targetAddData.target_title}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Target Description'
									type='text'
									name='target_description'
									label='Target Description'
									htmlFor='target_description'
									value={targetAddData.target_description}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='From Date'
									type='date'
									name='from_date'
									label='From Date'
									htmlFor='from_date'
									value={targetAddData.from_date}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='To Date'
									type='date'
									name='to_date'
									label='To Date'
									htmlFor='to_date'
									value={targetAddData.to_date}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-12'>
								<SelectField
									className=''
									name='position'
									label='Set position For'
									htmlFor='position'
									value={targetAddData.position}
									onChange={handleInputChange}
									options={[
										'Developer',
										'Marketing',
										'Franchise Owner',
										'Graphic Designer',
										'Telecalling',
									]}
								/>
							</div>
						</div>
					</div>
					<div className='modal-footer border-top border-gray-200 px-6 py-4'>
						<button
							type='button'
							className='btn btn-light rounded-pill px-5 fw-semibold'
							onClick={() => setShowAddModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary rounded-pill px-6 fw-bold'
							onClick={handleSubmit}>
							Save Target
						</button>
					</div>
				</div>
			</Modal>

			{/* Target Update Modal */}
			<Modal
				show={showUpdateModal}
				onHide={() => setShowUpdateModal(false)}
				centered
				dialogClassName='mw-650px'>
				<div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
					<div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder text-gray-900 m-0'>Update Target</h3>
						<button
							type='button'
							className='btn btn-sm btn-icon btn-light-danger rounded-circle'
							onClick={() => setShowUpdateModal(false)}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>
					<div className='modal-body p-6'>
						<div className='row g-4'>
							<div className='col-md-6'>
								<InputField
									placeholder='Target Title'
									type='text'
									name='target_title'
									label='Target Title'
									htmlFor='target_title'
									value={targetUpdateData.target_title}
									onChange={handleUpdateInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='Target Description'
									type='text'
									name='target_description'
									label='Target Description'
									htmlFor='target_description'
									value={targetUpdateData.target_description}
									onChange={handleUpdateInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='From Date'
									type='date'
									name='from_date'
									label='From Date'
									htmlFor='from_date'
									value={
										targetUpdateData.from_date
											? DayJS(targetUpdateData.from_date).format('YYYY-MM-DD')
											: ''
									}
									onChange={handleUpdateInputChange}
								/>
							</div>
							<div className='col-md-6'>
								<InputField
									placeholder='To Date'
									type='date'
									name='to_date'
									label='To Date'
									htmlFor='to_date'
									value={
										targetUpdateData.to_date
											? DayJS(targetUpdateData.to_date).format('YYYY-MM-DD')
											: ''
									}
									onChange={handleUpdateInputChange}
								/>
							</div>
							<div className='col-md-12'>
								<SelectField
									className=''
									name='position'
									label='Set position For'
									htmlFor='position'
									value={targetUpdateData.position}
									onChange={handleUpdateInputChange}
									options={[
										'Developer',
										'Marketing',
										'Franchise Owner',
										'Graphic Designer',
										'Telecalling',
									]}
								/>
							</div>
						</div>
					</div>
					<div className='modal-footer border-top border-gray-200 px-6 py-4'>
						<button
							type='button'
							className='btn btn-light rounded-pill px-5 fw-semibold'
							onClick={() => setShowUpdateModal(false)}>
							Cancel
						</button>
						<button
							type='button'
							className='btn btn-primary rounded-pill px-6 fw-bold'
							onClick={handleUpdate}>
							Update Target
						</button>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default EmployeeTarget
