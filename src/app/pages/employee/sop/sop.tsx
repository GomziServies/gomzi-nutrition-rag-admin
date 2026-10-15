import { faCheck, faDownload, faFileAlt, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CompleteSOP, GetSOP } from '../../../Functions/FGGroup/SOP'

const EmployeeSOP: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
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
				const isAssigned = !el.employee_ids || el.employee_ids.length === 0 || (empId && el.employee_ids.includes(empId))
				if (!isAssigned) return

				const serviceDetails = (el.service_details || []).map((row: any) => ({
					title: row.title,
					description: row.description,
					services_id: row._id,
					completed_by: row.completed_by || [],
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
				}))

				serviceDetails.forEach((detail: any) => {
					combinedData.push({
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

	useEffect(() => {
		fetchAssignSOPsData()
	}, [searchTerm])

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

	const filteredtargetData = targetData.filter((item) =>
		(item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
		(item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
		(item.service_name || '').toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedtargetData = filteredtargetData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Title', field: 'title' },
		{ title: 'Description', field: 'description' },
		{ title: 'Status & Completion', field: 'completed_by' },
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
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3 flex-wrap'>
						<div className='d-flex align-items-center position-relative'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
					</div>
					<div className='d-flex align-items-center gap-3'>
						<LengthMenu
							expenseData={targetData}
							handleItemsPerPageChange={handlePageChange}
						/>
					</div>
				</div>

				<div className='card-body py-4 px-6'>
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

								return (
									<React.Fragment key={item.services_id || index}>
										<tr
											onClick={() => handleRowClick(item.services_id)}
											className='data-row'
											style={{ verticalAlign: 'middle', borderBottom: '1px solid #f1f1f4' }}>
											<td className='text-center py-3' style={{ width: '60px' }}>
												<span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>
													{actualIndex}
												</span>
											</td>
											<td className='py-3'>
												<span className='text-gray-900 fw-bold fs-6 d-block'>
													{item.title}
												</span>
												{item.service_name && (
													<span className='badge badge-light-primary fw-semibold px-2 py-1 mt-1' style={{ fontSize: '11px', borderRadius: '4px' }}>
														{item.service_name}
													</span>
												)}
											</td>
											<td className='py-3'>
												<span className='text-gray-700 fs-7'>
													{item.description}
												</span>
											</td>
											<td className='py-3 text-end pe-4'>
												{isCompleted ? (
													<div className='d-inline-flex flex-column align-items-end'>
														<span className='badge badge-light-success fw-bold px-3 py-1 mb-1' style={{ borderRadius: '6px' }}>
															<FontAwesomeIcon icon={faCheck} className='me-1' /> Completed
														</span>
														{completionInfo?.remarks && (
															<span className='text-muted fs-8 text-end' style={{ maxWidth: '220px' }}>
																{completionInfo.remarks}
															</span>
														)}
														{completionInfo?.file_url && (
															<a
																href={completionInfo.file_url}
																target='_blank'
																rel='noopener noreferrer'
																className='btn btn-link btn-color-primary btn-active-color-primary p-0 fs-8 fw-semibold mt-1'>
																<FontAwesomeIcon icon={faFileAlt} className='me-1' /> View Proof
															</a>
														)}
													</div>
												) : (
													<button
														className='btn btn-sm btn-light-success fw-semibold px-3 py-2 d-inline-flex align-items-center gap-2'
														style={{ borderRadius: '8px' }}
														onClick={(e) => {
															e.stopPropagation()
															handleOpenModal(item.services_id, item.sop_id)
														}}>
														<FontAwesomeIcon icon={faCheck} />
														<span>Mark Complete</span>
													</button>
												)}
											</td>
										</tr>
										{isVisible && (
											<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
												<td colSpan={12} className='p-4 bg-light-primary rounded-3'>
													<div className='fs-7'>
														<div><strong>Title:</strong> {item.title}</div>
														<div><strong>Description:</strong> {item.description}</div>
														{isCompleted && (
															<div className='mt-2'>
																<strong>Remark:</strong> {completionInfo?.remarks}
																{completionInfo?.file_url && (
																	<div className='mt-1'>
																		<a
																			href={completionInfo.file_url}
																			target='_blank'
																			rel='noopener noreferrer'
																			className='btn btn-sm btn-light-primary'>
																			<FontAwesomeIcon icon={faDownload} className='me-1' /> Download File
																		</a>
																	</div>
																)}
															</div>
														)}
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
						<div className='d-flex flex-column align-items-center justify-content-center py-12 text-center'>
							<div className='symbol symbol-60px mb-4'>
								<span className='symbol-label bg-light-primary text-primary fs-2'>📋</span>
							</div>
							<h5 className='fw-bold text-gray-800 mb-1'>No SOPs Found</h5>
							<p className='text-muted fs-7 mb-0'>Operating procedures assigned to your role will appear here.</p>
						</div>
					)}

					<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
						<div className='text-muted fs-7 fw-semibold'>
							Showing {filteredtargetData.length === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1} to{' '}
							{Math.min(pagination.page * pagination.itemsPerPage, filteredtargetData.length)} of {filteredtargetData.length} records
						</div>
						{filteredtargetData.length > 0 && (
							<UsersListPagination
								totalPages={Math.ceil(filteredtargetData.length / pagination.itemsPerPage) || 1}
								currentPage={pagination.page}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
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
