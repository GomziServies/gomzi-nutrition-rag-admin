import { faPlusCircle, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { MultiSelect } from 'react-multi-select-component'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectFieldManual from '../../../components/SelectFieldManual'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateSOP, DeleteSOP, GetSOP, UpdateSOP } from '../../../Functions/FGGroup/SOP'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const HRAssignSopList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(false)
	const [showAdd, setShowAdd] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('asc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [updateService, setUpdateService] = useState(false)
	const [employeeData, setEmployeeData] = useState<any[]>([])
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [assignSOPData, setAssignSOPData] = useState<any[]>([])
	const [selectedService, setSelectedService] = useState<any>({
		title: '',
		description: '',
		sop_id: '',
		admin_ids: [],
	})
	const [selectedSop, setSelectedSop] = useState<any>({
		title: '',
		description: '',
		sop_id: '',
		admin_ids: [],
	})
	const [sopFormData, setSopFormData] = useState<any>({
		service_name: '',
		service_details: [
			{
				title: '',
				description: '',
			},
		],
		admin_ids: [],
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleEmployeeSelect = async (
		event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
	) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedId = event.target.value

			if (selectedId === 'Select Employee') {
				setSelectedEmployee(null)
			} else {
				const selectedEmployeeObj = employeeData.find((el: any) => el._id === selectedId)
				if (selectedEmployeeObj) {
					setSelectedEmployee(selectedEmployeeObj)
					await fetchAssignSOPsData(selectedEmployeeObj._id)
				}
			}
		}
	}

	const fetchEmployeeData = async () => {
		try {
			const response = await GetEmployees()
			const filteredData: any = response.data
			setEmployeeData(filteredData)
		} catch (error) {
			console.error(error)
		}
	}

	const fetchAssignSOPsData = async (admin_id?: string) => {
		try {
			const response = await GetSOP({ admin_id })
			const filteredData: any = response.data
			const combinedData: any[] = []

			filteredData.forEach((el: any) => {
				const serviceDetails = el.service_details.map((row: any) => ({
					title: row.title,
					description: row.description,
					completed_by: row.completed_by,
				}))

				serviceDetails.forEach((detail: any) => {
					combinedData.push({
						...detail,
						sop_id: el._id,
						service_name: el.service_name,
						admin_ids: el.admin_ids,
					})
				})
			})
			setAssignSOPData(combinedData)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [searchTerm])

	useEffect(() => {
		if (selectedEmployee) {
			fetchAssignSOPsData(selectedEmployee._id)
		}
	}, [selectedEmployee])

	const notify = (id: string) =>
		Swal.fire({
			icon: 'warning',
			title: 'Are you sure?',
			text: 'Once Delete, you will not be able to undone!',
			showCancelButton: true,
			confirmButtonText: 'Ok',
		}).then((result) => {
			if (result.isConfirmed) {
				handleDeleteSOP(id)
			}
		})

	const handleSubmitSop = async () => {
		try {
			const payload: any = {
				service_name: sopFormData.service_name,
				service_details: sopFormData.service_details,
				admin_ids: sopFormData.admin_ids.map((admin: any) => admin.value),
			}

			await CreateSOP(payload)
			toast.success('SOP ADDED Successfully')

			setSopFormData({
				service_name: '',
				service_details: [
					{
						title: '',
						description: '',
					},
				],
				admin_ids: [],
			})
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleDeleteSOP = async (sop_id: string) => {
		try {
			await DeleteSOP({ sop_id })
			toast.success('SOP Delete Successfully')

			setShowModal(false)
			fetchAssignSOPsData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleSortChange = (newSort: string, newSortOrder: string) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleMultiSelectChange = (selected: any) => {
		setSopFormData((prevData: any) => ({
			...prevData,
			admin_ids: selected,
		}))
	}

	const addNewSopInput = () => {
		setSopFormData((prevData: any) => ({
			...prevData,
			service_details: [
				...prevData.service_details,
				{
					title: '',
					description: '',
				},
			],
		}))
	}

	const removeSopInput = (index: number) => {
		setSopFormData((prevData: any) => ({
			...prevData,
			service_details: prevData.service_details.filter((_id: any, i: number) => i !== index),
		}))
	}

	const sortableFields = [
		{ title: 'SOP Title', field: 'taskTitle' },
		{ title: 'SOP Description', field: 'description' },
		{ title: 'Feedback Remark', field: 'remark' },
		{ title: 'Feedback Date', field: 'deadline' },
	]

	const employeeOption = employeeData.map((data: any) => ({
		name: data.full_name,
		value: data._id,
	}))

	const employeeUpdateSopOption = employeeData.map((data: any) => ({
		name: `${data.full_name} - ${data?.employee?.position}`,
		value: data._id,
	}))

	const employeeSelectOption = employeeData.map((data: any) => ({
		label: `${data.full_name}`,
		value: data._id,
		id: data._id,
	}))

	const handleShowSOPUpdateModal = (sop_data: any) => {
		setSelectedSop(sop_data)
		setShowModal(true)
	}

	const handleUpdateSOP = async () => {
		try {
			const payload: any = {
				sop_id: selectedSop.sop_id,
				service_name: selectedSop.service_name,
				service_details: [
					{
						title: selectedSop.title,
						description: selectedSop.description,
					},
				],
				admin_ids: [selectedSop.admin_ids.toString()],
			}

			await UpdateSOP(payload)
			toast.success('SOP Update Successfully')
			setShowModal(false)

			fetchAssignSOPsData(selectedService.admin_ids)
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleInputChangeForSopFormData = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = event.target

		setSopFormData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setSelectedSop((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>SOP Assignment</PageTitle>
			<div
				className='accordion card'
				id='kt_accordion_3'>
				<KTCard className='accordion-item'>
					<h2
						className='accordion-header'
						id='kt_accordion_3_header_3'>
						<button
							className='accordion-button fs-2 fw-bold collapsed'
							type='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_accordion_3_body_3'
							aria-expanded='false'
							aria-controls='kt_accordion_3_body_3'
							onClick={() => setShowAdd(false)}>
							Add SOP
						</button>
					</h2>
					<div
						className='card p-5 collapse'
						id='kt_accordion_3_body_3'
						aria-labelledby='kt_accordion_3_header_3'
						data-bs-parent='#kt_accordion_3'>
						<div className='row mt-3'>
							<div className='col-md-6'>
								<InputField
									placeholder='Enter Service Name'
									type='text'
									label='Service Name'
									className=''
									name='service_name'
									htmlFor='service_name'
									value={sopFormData.service_name}
									onChange={handleInputChangeForSopFormData}
								/>
							</div>
							<div className='col-md-6 fv-row mb-7'>
								<label
									htmlFor='employee'
									className='fw-bold fs-6 mb-5'>
									Assign to Employee
								</label>
								<MultiSelect
									options={employeeSelectOption}
									value={sopFormData.admin_ids}
									onChange={handleMultiSelectChange}
									labelledBy='Select Employee'
									className='fv-row'
								/>
							</div>
							<div className='col-md-12'>
								<label
									htmlFor='employee'
									className='fw-bold fs-6 mb-5'>
									Add Sop to Service
								</label>
								<div>
									{sopFormData.service_details.map((service: any, index: number) => (
										<div
											key={index}
											className='row mb-3 align-items-center'>
											<div className='col-md-5'>
												<input
													type='text'
													className='form-control me-2'
													placeholder='Enter Title'
													value={service.title}
													onChange={(e) => {
														const newServiceDetails = [...sopFormData.service_details]
														newServiceDetails[index].title = e.target.value
														setSopFormData({ ...sopFormData, service_details: newServiceDetails })
													}}
													name='title'
												/>
											</div>
											<div className='col-md-5 my-md-0 my-5'>
												<input
													type='text'
													className='form-control me-2'
													placeholder='Enter Description'
													value={service.description}
													onChange={(e) => {
														const newServiceDetails = [...sopFormData.service_details]
														newServiceDetails[index].description = e.target.value
														setSopFormData({ ...sopFormData, service_details: newServiceDetails })
													}}
													name='description'
												/>
											</div>
											<div className='col-md-2'>
												<div className='row justify-content-md-between justify-content-end'>
													<div className='col-md-6 col-3'>
														{index === sopFormData.service_details.length - 1 && (
															<button
																className='btn btn-primary'
																onClick={addNewSopInput}>
																Add
															</button>
														)}
													</div>
													<div className='col-md-6 col-3'>
														<button
															className='btn btn-danger'
															onClick={() => removeSopInput(index)}>
															<FontAwesomeIcon
																icon={faTrash}
																className='fs-5'
															/>
														</button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
							<div className='col-md-4 card-toolbar'>
								<button
									onClick={handleSubmitSop}
									className='btn btn-primary mt-3'>
									<KTIcon
										iconName='plus'
										className='fs-2'
									/>
									Add SOP
								</button>
							</div>
						</div>
					</div>
				</KTCard>
			</div>
			<div
				className='accordion card mt-5'
				id='kt_accordion_1'>
				<KTCard className='accordion-item'>
					<h2
						className='accordion-header'
						id='kt_accordion_1_header_1'>
						<button
							className='accordion-button fs-2 fw-bold collapsed'
							type='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_accordion_1_body_1'
							aria-expanded='false'
							aria-controls='kt_accordion_1_body_1'>
							SOP Feedback
						</button>
					</h2>
					<div
						id='kt_accordion_1_body_1'
						className='accordion-collapse collapse show'
						aria-labelledby='kt_accordion_1_header_1'
						data-bs-parent='#kt_accordion_1'>
						<div className='px-5'>
							<div className='row mt-3 justify-content-between'>
								<SelectFieldManual
									className='col-md-4 fv-row'
									label='Employee'
									name='employee'
									value={selectedEmployee?._id}
									onChange={handleEmployeeSelect}
									htmlFor='employee'
									options={employeeOption}
								/>
								{!showAdd && (
									<div
										className='col-md-2 d-flex align-items-center'
										data-bs-toggle='collapse'
										data-bs-target='#kt_accordion_3_body_3'
										aria-expanded='false'
										aria-controls='kt_accordion_3_body_3'>
										<TableButton
											action='add'
											text='Add SOP'
											onClick={() => setShowAdd(true)}
										/>
									</div>
								)}
							</div>
						</div>
						<div className='gz-filter-card mb-4 mx-5'>
							<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1 w-100'>
								{/* 1. Searchbar */}
								<div style={{ minWidth: '220px', maxWidth: '340px', flex: '1 1 220px' }}>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
										placeholder='Search SOP...'
										className='me-0'
									/>
								</div>

								{/* 2. Page Size */}
								<div>
									<LengthMenu
										data={assignSOPData}
										itemsPerPage={pagination.itemsPerPage}
										handleItemsPerPageChange={(val) =>
											setPagination((prev) => ({ ...prev, itemsPerPage: val, page: 1 }))
										}
										className='me-0'
									/>
								</div>

								{/* 3. Download Excel Button */}
								<div>
									<DownloadExcelButton
										data={assignSOPData}
										columns={sortableFields}
										filename='Assigned_SOPs'
									/>
								</div>
							</div>
						</div>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<Table
									data={assignSOPData}
									columns={sortableFields}
									sort={sort}
									removeAction={true}
									sortOrder={sortOrder}
									onSortChange={handleSortChange}
									renderRow={(sop: any, index: number, actualIndex: number, isVisible: boolean) => (
										<React.Fragment key={sop._id}>
											<tr
												onClick={() => handleRowClick(sop._id)}
												className='data-row'>
												<td className='text-center'>
													<div className='d-flex'>
														<FontAwesomeIcon
															icon={faPlusCircle}
															className='mx-2 ms-5 mb-1 plus-icon'
															style={{ color: '#607D8B', fontSize: '18px' }}
														/>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sop.title}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sop.description}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sop?.completed_by[0] ? sop?.completed_by[0]?.remarks : '-'}
													</span>
													{sop?.completed_by[0]?.file_url && (
														<a
															href={'https://files.fggroup.in' + sop?.completed_by[0]?.file_url}
															target='_blank'
															rel='noopener noreferrer'
															className='d-inline-block mt-1'>
															<img
																src={'https://files.fggroup.in' + sop?.completed_by[0]?.file_url}
																alt='Attachment'
																style={{
																	width: '42px',
																	height: '42px',
																	objectFit: 'cover',
																	borderRadius: '8px',
																	border: '1px solid #e2e8f0',
																}}
															/>
														</a>
													)}
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sop?.completed_by[0]?.completed_at
															? DayJS(sop?.completed_by[0]?.completed_at).format(
																	'DD/MM/YYYY hh:mm:ss A'
															  )
															: 'Not Updated'}
													</span>
												</td>
											</tr>
											{isVisible && (
												<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
													<td colSpan={12}>
														<div>
															<strong>{sortableFields[0].title}:</strong> {sop.title}
															<br />
															<strong>{sortableFields[1].title}:</strong> {sop.description}
															<br />
															<strong>{sortableFields[2].title}:</strong>{' '}
															{sop?.completed_by[0] ? sop?.completed_by[0]?.remarks : '-'}
															{sop?.completed_by[0]?.file_url && (
																<a
																	href={'https://files.fggroup.in' + sop?.completed_by[0]?.file_url}
																	target='_blank'
																	rel='noopener noreferrer'
																	className='d-inline-block mt-1'>
																	<img
																		src={'https://files.fggroup.in' + sop?.completed_by[0]?.file_url}
																		alt='Attachment'
																		style={{
																			width: '60px',
																			height: '60px',
																			objectFit: 'cover',
																			borderRadius: '8px',
																			border: '1px solid #e2e8f0',
																		}}
																	/>
																</a>
															)}
															<br />
															<strong>{sortableFields[3].title}:</strong>{' '}
															{sop?.completed_by[0]?.completed_at
																? DayJS(sop?.completed_by[0]?.completed_at).format(
																		'DD/MM/YYYY hh:mm:ss A'
																  )
																: 'Not Updated'}
															<br />
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
							{selectedEmployee == null && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<h2>Select Employee</h2>
								</div>
							)}
							{selectedEmployee && assignSOPData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{assignSOPData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(assignSOPData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									totalRecords={assignSOPData.length}
									itemsPerPage={pagination.itemsPerPage}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>
				</KTCard>
			</div>
			<div
				className='accordion card mt-5'
				id='kt_accordion_2'>
				<KTCard className='accordion-item'>
					<h2
						className='accordion-header'
						id='kt_accordion_2_header_2'>
						<button
							className='accordion-button fs-2 fw-bold collapsed'
							type='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_accordion_2_body_2'
							aria-expanded='false'
							aria-controls='kt_accordion_2_body_2'>
							SOP Data
						</button>
					</h2>
					<div
						id='kt_accordion_2_body_2'
						className='accordion-collapse collapse'
						aria-labelledby='kt_accordion_2_header_2'
						data-bs-parent='#kt_accordion_2'>
						<div className='card-header border-0 align-items-center px-5'>
							<div className='d-flex mt-3'>
								<SelectFieldManual
									className='fv-row'
									label='Employee'
									name='employee'
									value={selectedEmployee?._id}
									onChange={handleEmployeeSelect}
									htmlFor='employee'
									options={employeeUpdateSopOption}
								/>
							</div>
							<div className='d-flex align-items-center position-relative my-1'>
								<KTIcon
									iconName='magnifier'
									className='fs-1 position-absolute ms-6'
								/>
								<input
									type='text'
									data-kt-user-table-filter='search'
									className='form-control form-control-solid w-250px ps-14'
									placeholder='Search..'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
											<th>No.</th>
											<th>Title</th>
											<th>Description</th>
											<th>Action</th>
										</tr>
									</thead>
									<tbody className='text-gray-600 fw-bold'>
										{assignSOPData.map((sop, index) => (
											<tr key={index}>
												<td>{index + 1}</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sop.title}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{sop.description}
													</span>
												</td>
												<td>
													<button
														className='btn btn-success btn-sm mb-5'
														onClick={() => handleShowSOPUpdateModal(sop)}>
														Update
													</button>
													<button
														className='btn btn-danger btn-sm mb-5 mx-3'
														onClick={() => notify(sop.sop_id)}>
														Delete
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{selectedEmployee == null && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<h2>Select Employee</h2>
								</div>
							)}
							{selectedEmployee && assignSOPData.length === 0 && !loading && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{assignSOPData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(assignSOPData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									totalRecords={assignSOPData.length}
									itemsPerPage={pagination.itemsPerPage}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>
				</KTCard>
			</div>
			<Modal
				show={showModal}
				centered
				onHide={() => setShowModal(false)}
				className='modal fade'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={() => setShowModal(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body scroll-y mx-3 pt-0'>
						<div className='mb-13'>
							<h2 className='mb-3'>Update SOP</h2>
						</div>
						<div className='border-bottom'>
							<InputField
								placeholder='Employee Name'
								disabled
								type='text'
								className='mb-3 w-100 fv-row'
								name='employee_name'
								label='Employee Name'
								htmlFor='full_name'
								value={selectedEmployee?.full_name || '-'}
							/>
							<InputField
								placeholder='Service Name'
								type='text'
								className='mb-3 w-100 fv-row'
								name='position'
								label='Service Name'
								htmlFor='position'
								value={selectedEmployee?.employee?.position}
								disabled
							/>
							<InputField
								placeholder='SOP Title'
								type='text'
								className='mb-3 w-100 fv-row'
								name='title'
								label='SOP Title'
								htmlFor='title'
								value={selectedSop.title}
								onChange={handleInputChange}
							/>
							<InputField
								placeholder='SOP Description'
								type='text'
								className='mb-3 mt-4 w-100 fv-row'
								name='description'
								label='SOP Description'
								htmlFor='description'
								value={selectedSop.description}
								onChange={handleInputChange}
							/>
						</div>
						<div className='mt-7'>
							<TableButton
								action='add'
								showIcon={false}
								onClick={() => handleUpdateSOP()}
								text='Update'
							/>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default HRAssignSopList
