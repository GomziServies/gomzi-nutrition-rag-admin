import { faCheck, faDownload, faFileAlt, faRotateLeft, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CompleteSOP, GetSOP } from '../../../Functions/FGGroup/SOP'

const EmployeeSOP: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [loading, setLoading] = useState(true)
	const [sort, setSort] = useState('title')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [targetData, setTargetData] = useState<any[]>([])
	const [showModal, setShowModal] = useState(false)
	const [sopData, setSopData] = useState({
		services_id: '',
		sop_id: '',
	})

	const [targetAddData, setTargetAddData] = useState({
		remark: '',
		file: '',
		upload_photo: '',
		file_url: '',
		editImage: false,
		selectedFile: null as File | null,
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

	const fetchAssignSOPsData = async () => {
		setLoading(true)
		try {
			const employee = getStoredEmployee()
			const empId = employee?._id || employee?.id
			const response: any = await GetSOP()
			const filteredData: any[] = response?.data || []
			const combinedData: any[] = []

			filteredData.forEach((el: any) => {
				const isAssigned =
					!el.employee_ids ||
					el.employee_ids.length === 0 ||
					(empId && el.employee_ids.includes(empId))
				if (!isAssigned) return

				const serviceDetails = (el.service_details || []).map((row: any) => ({
					...row,
					title: row.title,
					description: row.description,
					services_id: row._id,
					completed_by: row.completed_by || [],
					file_url: row.file_url || row.file || row.document || '',
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
				}))

				serviceDetails.forEach((detail: any) => {
					combinedData.push({
						...el,
						...detail,
						sop_id: el._id,
						employee_ids: el.employee_ids,
						service_name: el.service_name,
					})
				})
			})
			setTargetData(combinedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	// Helper to resolve an absolute file URL from an uploaded file key/path
	const getFileUrl = (path: string | undefined | null): string => {
		if (!path || typeof path !== 'string') return ''
		const trimmed = path.trim()
		if (!trimmed) return ''
		if (
			trimmed.startsWith('http://') ||
			trimmed.startsWith('https://') ||
			trimmed.startsWith('blob:') ||
			trimmed.startsWith('data:')
		) {
			return trimmed
		}
		const cleanPath = trimmed.replace(/^\/+/, '')
		return `${FG_GROUP_FILE_BASE_URL}/${cleanPath}`
	}

	// Helper to resolve the proof/document URL attached to a completed SOP
	const getProofUrl = (item: any): string => {
		const completedList = Array.isArray(item?.completed_by) ? item.completed_by : []
		const employee = getStoredEmployee()
		const empId = employee?._id || employee?.id || employee?.admin_id

		const myCompletion =
			completedList.find((c: any) => {
				if (!c) return false
				if (typeof c === 'string') return c === empId
				return (
					c.admin_id === empId ||
					c.employee_id === empId ||
					c._id === empId ||
					c.id === empId
				)
			}) || completedList[0]

		const candidates = [
			myCompletion?.file_url,
			myCompletion?.file,
			myCompletion?.document,
			myCompletion?.proof,
			myCompletion?.upload_photo,
			item?.file_url,
			item?.file,
			item?.document,
			item?.attachment,
		]

		for (const c of candidates) {
			if (Array.isArray(c) && c.length > 0 && typeof c[0] === 'string' && c[0].trim()) {
				return c[0].trim()
			}
			if (c && typeof c === 'string' && c.trim()) {
				return c.trim()
			}
		}
		return ''
	}

	// Trigger robust download via blob or new tab with absolute URL
	const handleDownload = async (fileUrl: string, defaultName?: string) => {
		const fullUrl = getFileUrl(fileUrl)
		if (!fullUrl) {
			toast.error('No document file URL available')
			return
		}

		try {
			const response = await fetch(fullUrl, { mode: 'cors' })
			if (!response.ok) throw new Error('Fetch failed')
			const blob = await response.blob()
			const blobUrl = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = blobUrl
			const cleanName = (defaultName || 'SOP-Proof').replace(/[^a-zA-Z0-9_-]/g, '_')
			const rawExt = fullUrl.split('.').pop()?.split('?')[0]?.toLowerCase()
			const ext = rawExt && rawExt.length <= 4 ? rawExt : 'pdf'
			link.download = `${cleanName}.${ext}`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(blobUrl)
			toast.success('Download started')
		} catch (err) {
			// If direct fetch is restricted by CORS, open absolute URL directly in new tab
			window.open(fullUrl, '_blank', 'noopener,noreferrer')
		}
	}

	useEffect(() => {
		fetchAssignSOPsData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target
		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setTargetAddData((prevData) => ({
				...prevData,
				selectedFile: file,
				file_url: URL.createObjectURL(file),
				editImage: true,
			}))
		}
		setTargetAddData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredtargetData = targetData.filter((item) => {
		const isCompleted =
			(item.completed_by && item.completed_by.length > 0) ||
			item.status === 'Completed' ||
			item.status === 'COMPLETED'
		const itemStatus = isCompleted ? 'completed' : 'pending'

		const matchesStatus =
			statusFilter === 'all' || itemStatus === statusFilter.toLowerCase()

		const matchesSearch =
			(item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(item.service_name || '').toLowerCase().includes(searchTerm.toLowerCase())

		return matchesStatus && matchesSearch
	})

	const paginatedtargetData = filteredtargetData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Title', field: 'title' },
		{ title: 'Service Name', field: 'service_name' },
		{ title: 'Description', field: 'description' },
		{ title: 'Status', field: 'completed_by' },
	]

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		setVisibleDetails(visibleDetails === id ? null : id)
	}

	const handleOpenModal = (services_id: string, sop_id: string) => {
		setSopData({
			services_id: services_id,
			sop_id: sop_id,
		})
		setTargetAddData({
			remark: '',
			file: '',
			upload_photo: '',
			file_url: '',
			editImage: false,
			selectedFile: null,
		})
		setShowModal(true)
	}

	const handleUpdateSOP = async () => {
		try {
			let documentUrl = ''

			if (targetAddData.selectedFile) {
				const fileUrl: any = await FileUploadToFGGroup([targetAddData.selectedFile], {
					directory: 'documents',
				})
				documentUrl = fileUrl.data?.fileURLs?.[0] || ''
				toast.success('Document uploaded successfully')
			}

			const payload: any = {
				sop_id: sopData.sop_id,
				service_id: sopData.services_id,
				remarks: targetAddData.remark,
				file_url: documentUrl,
			}

			await CompleteSOP(payload)
			toast.success('SOP marked as completed successfully!')
			setShowModal(false)

			fetchAssignSOPsData()
		} catch (error: any) {
			toast.error(error.message || 'Failed to update SOP')
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Standard Operating Procedures (SOP)</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-column gap-4'>
					{/* Header Top: Title & Right Actions */}
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-3 w-100'>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h2 className='fw-bolder text-gray-900 mb-0'>Standard Operating Procedures (SOP)</h2>
								<span className='badge badge-light-primary fw-bold fs-8'>
									{filteredtargetData.length} records
								</span>
							</div>
							<span className='text-muted fs-7 fw-semibold mt-1'>
								Review operational guidelines, execute assigned procedure checklists, and upload proof of completion
							</span>
						</div>

						<div className='d-flex align-items-center gap-2'>
							<button
								type='button'
								className='btn btn-sm btn-light d-flex align-items-center gap-2 px-3'
								style={{ height: '38px', borderRadius: '10px' }}
								onClick={fetchAssignSOPsData}
								disabled={loading}>
								<FontAwesomeIcon icon={faRotateLeft} className={loading ? 'fa-spin' : ''} />
								<span>Refresh</span>
							</button>
						</div>
					</div>

					{/* Header Bottom: Filter Bar */}
					<div className='d-flex align-items-center flex-wrap gap-3 w-100 pb-2'>
						<div style={{ minWidth: '220px' }}>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								placeholder='Search SOPs by title, service or description...'
							/>
						</div>

						<LengthMenu
							expenseData={targetData}
							handleItemsPerPageChange={(val) =>
								setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
							}
						/>

						<div style={{ minWidth: '160px' }}>
							<select
								className='form-select form-select-sm'
								style={{
									height: '38px',
									borderRadius: '10px',
									border: '1px solid #E4EAF2',
									backgroundColor: '#ffffff',
									fontSize: '13px',
									fontWeight: 500,
									color: '#172b4d',
									cursor: 'pointer',
								}}
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}}>
								<option value='all'>All Status</option>
								<option value='pending'>Pending</option>
								<option value='completed'>Completed</option>
							</select>
						</div>
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
							renderRow={(
								item: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => {
								const isCompleted = item.completed_by && item.completed_by.length > 0
								const completionInfo = isCompleted ? item.completed_by[0] : null
								const proofUrl = getProofUrl(item)

								return (
									<React.Fragment key={item.services_id || index}>
										<tr
											onClick={() => handleRowClick(item.services_id)}
											className='data-row'>
											<td>
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
													{item.title}
												</span>
											</td>
											<td>
												{item.service_name ? (
													<span className='badge badge-light-primary fw-semibold px-3 py-1 fs-7'>
														{item.service_name}
													</span>
												) : (
													<span className='text-muted fs-7'>General</span>
												)}
											</td>
											<td>
												<span className='text-gray-700 fs-7'>
													{item.description}
												</span>
											</td>
											<td>
												{isCompleted ? (
													<span className='badge badge-light-success px-3 py-2 fs-7 fw-semibold'>
														<FontAwesomeIcon icon={faCheck} className='me-1' /> Completed
													</span>
												) : (
													<span className='badge badge-light-warning px-3 py-2 fs-7 fw-semibold'>
														Pending
													</span>
												)}
											</td>
											<td className='text-center py-4'>
												<div className='d-flex align-items-center justify-content-center gap-2'>
													<TableButton
														action='view'
														title='View SOP Details'
														onClick={(e) => {
															e.stopPropagation()
															handleRowClick(item.services_id)
														}}
													/>
													{isCompleted ? (
														proofUrl ? (
															<TableButton
																action='download'
																title='Download Supporting Proof Document'
																onClick={(e) => {
																	e.stopPropagation()
																	handleDownload(proofUrl, `${item.title || 'SOP'}-Proof`)
																}}
															/>
														) : (
															<TableButton
																action='download'
																title='No Proof Document Attached'
																disabled
																onClick={(e) => {
																	e.stopPropagation()
																	toast.error('No proof document attached for this procedure.')
																}}
															/>
														)
													) : (
														<TableButton
															action='approve'
															title='Mark Procedure as Completed'
															onClick={(e) => {
																e.stopPropagation()
																handleOpenModal(item.services_id, item.sop_id)
															}}
														/>
													)}
												</div>
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12}>
													<div className='p-3 bg-light rounded-3'>
														<div className='row g-3'>
															<div className='col-md-4'>
																<strong className='text-gray-700'>Procedure Title:</strong>
																<div className='text-gray-900 fw-bold'>{item.title}</div>
															</div>
															<div className='col-md-4'>
																<strong className='text-gray-700'>Service Category:</strong>
																<div>
																	<span className='badge badge-light-primary fw-semibold px-2 py-1 mt-1'>
																		{item.service_name || 'General'}
																	</span>
																</div>
															</div>
															<div className='col-md-4'>
																<strong className='text-gray-700'>Status:</strong>
																<div>
																	{isCompleted ? (
																		<span className='badge badge-light-success px-3 py-1 fs-7 fw-semibold'>
																			<FontAwesomeIcon icon={faCheck} className='me-1' /> Completed
																		</span>
																	) : (
																		<span className='badge badge-light-warning px-3 py-1 fs-7 fw-semibold'>
																			Pending Completion
																		</span>
																	)}
																</div>
															</div>
															<div className='col-12'>
																<strong className='text-gray-700'>Description:</strong>
																<div className='text-gray-800'>{item.description}</div>
															</div>
															{isCompleted && completionInfo && (
																<>
																	{completionInfo.remarks && (
																		<div className='col-md-8'>
																			<strong className='text-gray-700'>Completion Remarks:</strong>
																			<div className='text-gray-800'>{completionInfo.remarks}</div>
																		</div>
																	)}
																	{proofUrl && (
																		<div className='col-md-4'>
																			<strong className='text-gray-700'>Proof Attachment:</strong>
																			<div className='mt-1'>
																				<button
																					type='button'
																					onClick={(e) => {
																						e.stopPropagation()
																						handleDownload(proofUrl, `${item.title || 'SOP'}-Proof`)
																					}}
																					className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2'>
																					<FontAwesomeIcon icon={faDownload} />
																					<span>Download Proof</span>
																				</button>
																			</div>
																		</div>
																	)}
																</>
															)}
														</div>
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								)
							}}
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
								<i className='bi bi-journal-check fs-2' style={{ color: '#2563EB' }}></i>
							</div>
							<span className='fw-bold text-gray-700 fs-6'>No SOPs found</span>
							<span className='text-muted fs-7'>Standard Operating Procedures assigned to your role will appear here.</span>
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

			{/* Target complete SOP modal */}
			<Modal
				show={showModal}
				onHide={() => setShowModal(false)}
				centered
				dialogClassName='mw-600px'>
				<div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
					<div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
						<h3 className='fw-bolder text-gray-900 m-0'>Complete Procedure Step</h3>
						<button
							className='btn btn-sm btn-icon btn-light-danger rounded-circle'
							onClick={() => setShowModal(false)}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>
					<div className='modal-body p-6'>
						<div className='row g-4'>
							<div className='col-12'>
								<InputField
									placeholder='Enter completion remark or observation'
									type='text'
									name='remark'
									label='Completion Remarks'
									htmlFor='Remark'
									value={targetAddData.remark}
									onChange={(e) => handleInputChange(e)}
								/>
							</div>
							<div className='col-12'>
								<InputField
									placeholder='Upload proof or document'
									type='file'
									name='upload_photo'
									id='fileInput'
									label='Supporting Document / Screenshot (Optional)'
									htmlFor='upload_photo'
									onChange={(e) => handleInputChange(e)}
								/>
							</div>
						</div>
					</div>
					<div className='modal-footer border-top border-gray-200 px-6 py-4'>
						<button
							className='btn btn-light rounded-pill px-5 fw-semibold'
							onClick={() => setShowModal(false)}>
							Cancel
						</button>
						<button
							className='btn btn-primary rounded-pill px-6 fw-bold'
							onClick={() => handleUpdateSOP()}>
							Confirm Completion
						</button>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default EmployeeSOP
