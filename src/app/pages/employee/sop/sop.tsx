import { faCheck, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CompleteSOP, GetSOP } from '../../../Functions/FGGroup/SOP'

const EmployeeSOP: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [employeeData, setEmployeeData] = useState<any[]>([]) // Correct initialization
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

	const fetchAssignSOPsData = async (page?: number) => {
		setLoading(true)
		try {
			const response = await GetSOP()
			const filteredData: any = response.data
			const combinedData: any[] = []

			filteredData.forEach((el: any) => {
				const serviceDetails = el.service_details.map((row: any) => ({
					title: row.title,
					description: row.description,
					services_id: row._id,
					completed_by: row.completed_by,
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

	const fetchEmployeeData = async (page?: number) => {
		try {
			const response = await GetEmployees({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
			})
			const filteredData: any = response.data
			setEmployeeData(
				filteredData.map((el: any) => ({ name: el.name, id: el._id, position: el.position }))
			)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchAssignSOPsData()
		fetchEmployeeData()
	}, [searchTerm, pagination.page])

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

	const filteredtargetData = targetData.filter((sale) =>
		sale.title.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedtargetData = filteredtargetData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const sortableFields = [
		{ title: 'Title', field: 'title' },
		{ title: 'Description', field: 'description' },
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
		const data: any = {
			services_id: services_id,
			sop_id: sop_id,
		}
		setSopData(data)
		setShowModal(true)
	}

	const handleUpdateSOP = async () => {
		try {
			let documentUrl = ''

			if (targetAddData.selectedFile) {
				const fileUrl: any = await FileUploadToFGGroup([targetAddData.selectedFile], {
					directory: 'documents',
				})
				documentUrl = fileUrl.data?.fileURLs[0]
				toast.success('Document uploaded successfully')
			}

			const payload: any = {
				sop_id: sopData.sop_id,
				service_id: sopData.services_id,
				remarks: targetAddData.remark,
				file_url: documentUrl,
			}

			await CompleteSOP(payload)
			toast.success('SOP Update Successfully')
			setShowModal(false)

			fetchAssignSOPsData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>SOP</PageTitle>
			<div
				className='accordion card'
				id='kt_accordion_1'>
				<KTCard className='accordion-item mt-5'>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<Table
									data={paginatedtargetData}
									columns={sortableFields}
									sort={sort}
									sortOrder={sortOrder}
									onSortChange={handleSortChange}
									renderRow={(
										employee: any,
										index: number,
										actualIndex: number,
										isVisible: boolean
									) => (
										<React.Fragment key={employee._id}>
											<tr
												onClick={() => handleRowClick(employee._id)}
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
														{employee.title}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
														{employee.description}
													</span>
												</td>
												<td>
													{employee.completed_by && employee.completed_by.length > 0 ? (
														<div>
															<strong>Remark:</strong> {employee.completed_by[0].remarks}
															<br />
															{employee.completed_by[0].file_url && (
																<div>
																	<strong>File:</strong>{' '}
																	<a
																		href={employee.completed_by[0].file_url}
																		target='_blank'
																		rel='noopener noreferrer'>
																		View File
																	</a>
																</div>
															)}
														</div>
													) : (
														<button
															className='btn btn-success btn-sm'
															onClick={(e) => {
																e.stopPropagation()
																handleOpenModal(employee.services_id, employee.sop_id)
															}}>
															<FontAwesomeIcon
																icon={faCheck}
																className='fs-3 text-white'
															/>
														</button>
													)}
												</td>
											</tr>
											{isVisible && (
												<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
													<td colSpan={12}>
														<div>
															<strong>{sortableFields[0].title}:</strong> {employee.title}
															<br />
															<strong>{sortableFields[1].title}:</strong> {employee.description}
															<br />
															{employee.completed_by && employee.completed_by.length > 0 && (
																<div className='mt-3'>
																	<strong>Completion Details:</strong>
																	<br />
																	<strong>Remark:</strong> {employee.completed_by[0].remarks}
																	<br />
																	{employee.completed_by[0].file_url && (
																		<div>
																			<strong>File:</strong>{' '}
																			<a
																				href={employee.completed_by[0].file_url}
																				target='_blank'
																				rel='noopener noreferrer'>
																				View File
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
									)}
									visibleDetails={visibleDetails}
									pagination={pagination}
									setPagination={setPagination}
									loading={loading}
								/>
							</div>
							{targetData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{targetData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(targetData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>

					{/* target add modal */}
					<Modal
						show={showModal}
						onHide={() => setShowModal(false)}
						className='modal fade'>
						<div className='modal-content'>
							<div className='modal-header justify-content-between'>
								<h2 className='fw-bolder'>Details:</h2>
								<button
									className='btn btn-sm btn-icon btn-active-color-primary'
									onClick={() => setShowModal(false)}>
									<FontAwesomeIcon
										className='fs-1 position-absolute ms-3'
										icon={faXmark}
									/>
								</button>
							</div>
							<div className='modal-body scroll-y'>
								<div className='col-md-12'>
									<div className='row'>
										<div className='col-md-12 fv-row'>
											<InputField
												placeholder='Enter remark'
												type='text'
												className='col-12 fv-row mb-7'
												name='remark'
												label='Remark'
												htmlFor='Remark'
												value={targetAddData.remark}
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
										<div className='col-md-12 fv-row'>
											<InputField
												placeholder='Upload File'
												type='file'
												className='col-12 fv-row mb-7'
												name='upload_photo'
												id='fileInput'
												label='Upload File'
												htmlFor='upload_photo'
												onChange={(e) => handleInputChange(e)}
											/>
										</div>
									</div>
								</div>
							</div>
							<div className='modal-footer justify-content-end'>
								<button
									className='btn btn-primary'
									onClick={() => handleUpdateSOP()}>
									Complete SOP
								</button>
							</div>
						</div>
					</Modal>
				</KTCard>
			</div>
		</>
	)
}

export default EmployeeSOP
