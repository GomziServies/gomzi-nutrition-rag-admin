import { faMinus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SelectField from '../../../components/SelectField'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateSOP, DeleteSOP, GetSOP, UpdateSOP } from '../../../Functions/FGGroup/SOP'

type TaskFormData = {
	taskName: string
	description: string
	remark: string
	endDate: Date | null
	file: File | null
}

const AssignSopList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedService, setSelectedService] = useState<any>({
		title: '',
		description: '',
		sop_id: '',
		employee_ids: '',
	})
	const [showModal, setShowModal] = useState(false)
	const [updateService, setUpdateService] = useState(false)
	const [showAddService, setShowAddService] = useState<boolean>(false)
	const [employeeData, setEmployeeData] = useState<any>([{ name: '', id: '' }])
	const [assignSOPData, setAssignSOPData] = useState<any[]>([
		{ title: '', description: '', sop_id: '', employee_ids: '' },
	])
	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		description: '',
		remark: '',
		endDate: null,
		file: null,
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchAssignTaskData = async (page?: number) => {
		try {
			const response = await GetSOP()
			const filteredData: any = response.data
			const combinedData: any[] = []

			filteredData.forEach((el: any) => {
				const serviceDetails = el.service_details.map((row: any) => ({
					title: row.title,
					description: row.description,
				}))

				serviceDetails.forEach((detail: any) => {
					combinedData.push({
						...detail,
						sop_id: el._id,
						employee_ids: el.employee_ids,
					})
				})
			})

			setAssignSOPData(combinedData)
		} catch (error) {
			console.error(error)
		}
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
		fetchAssignTaskData()
		fetchEmployeeData()
	}, [searchTerm])

	const handleAddServiceClick = () => {
		setShowAddService(true)
	}

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

	const handleServiceSelect = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		const { name, value } = event.target

		setSelectedService((prevState: any) => ({
			...prevState,
			[name]: value,
		}))
	}

	const handleSubmit = async (id: any) => {
		try {
			const { title, description, sop_id, employee_ids } = selectedService

			const payload: any = {
				service_name: title,
				service_details: [{ title, description }],
				employee_ids: updateService ? employee_ids : id,
				...(updateService && { sop_id }),
			}

			if (updateService) {
				await UpdateSOP(payload)
				toast.success('Task Updated Successfully')
			} else {
				await CreateSOP(payload)
				toast.success('Task Created Successfully')
			}

			setShowModal(false)
			setUpdateService(false)
			setSelectedService({ title: '', description: '' })
			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handleDeleteSOP = async (sop_id: string) => {
		try {
			await DeleteSOP({ sop_id })
			toast.success('Task Delete Successfully')

			setShowModal(false)
			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredassignSOPData = assignSOPData.filter((sale) =>
		sale?.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedassignSOPData = filteredassignSOPData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<h1 className='fw-bold text-dark fs-1 mb-6 '>SOP Assignment</h1>
			<div className='card p-5 mb-5'>
				<div className='row mt-3'>
					<div className='col-sm-3 col-12'>
						<SelectField
							className='fv-row m-0'
							label='Select service'
							name='service'
							value={selectedService}
							onChange={handleServiceSelect}
							htmlFor='service'
							options={employeeData.map((el: any) => el.position)}
						/>
					</div>
					<div className='col-sm-9 col-12 hr-row'>
						{selectedService && (
							<div className='row'>
								<div className='card-toolbar mt-sm-11 mt-2'>
									<button
										data-bs-toggle='modal'
										data-bs-target='#kt_modal_update'
										className='btn btn-primary'>
										<KTIcon
											iconName='pencil'
											className='fs-2'
										/>
										Update Service Name
									</button>
								</div>
								<div className='card-toolbar mt-sm-11 mt-2'>
									<button
										className='btn btn-info'
										onClick={handleAddServiceClick}>
										<KTIcon
											iconName='plus'
											className='fs-2'
										/>
										Add Service
									</button>
								</div>
								<div className='card-toolbar mt-sm-11 mt-2'>
									<button
										data-bs-toggle='modal'
										data-bs-target='#kt_modal_delete'
										className='btn btn-danger'>
										<KTIcon
											iconName='trash'
											className='fs-2'
										/>
										Delete Service
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			{showAddService && (
				<div
					className='card p-5 mb-5'
					id='add-service'>
					<div className='d-flex justify-content-between'>
						<h4>Add Services</h4>
						<FontAwesomeIcon
							icon={faMinus}
							className='fs-3 text-muted pe-auto'
							onClick={() => setShowAddService(false)}
						/>
					</div>
					<div className='d-flex mt-3'>
						<input
							type='text'
							className='form-control w-50'
							placeholder='Enter Service Name'
							value={taskFormData.taskName}
							onChange={(e) => setTaskFormData({ ...taskFormData, taskName: e.target.value })}
							required
						/>
						<div className='card-toolbar mx-3'>
							<button
								data-bs-toggle='modal'
								data-bs-target='#kt_modal_1'
								className='btn btn-primary'>
								<KTIcon
									iconName='plus'
									className='fs-2'
								/>
								Add Services
							</button>
						</div>
					</div>
				</div>
			)}
			<div
				className='accordion card'
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
						<div className='px-5 pb-5'>
							<div className='d-flex mt-3'>
								<select
									className='form-select w-50'
									aria-label='Select employee'
									onChange={handleServiceSelect}>
									<option>Select Services</option>
									<option value='1'>Graphic Designer</option>
									<option value='2'>Video Editor</option>
									<option value='3'>Marketing</option>
									<option value='4'>Developer</option>
								</select>
								<input
									type='date'
									className='form-control w-25 mx-3'
									placeholder='Enter Service Name'
									value={taskFormData.taskName}
									onChange={(e) => setTaskFormData({ ...taskFormData, taskName: e.target.value })}
									required
								/>
								<input
									type='date'
									className='form-control w-25'
									placeholder='Enter Service Name'
									value={taskFormData.taskName}
									onChange={(e) => setTaskFormData({ ...taskFormData, taskName: e.target.value })}
									required
								/>
							</div>
						</div>
						<div className='card-header border-0 pt-4 align-items-center px-5'>
							<h2 className='mb-0'>Updated Sop's</h2>
							<div>
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
						</div>
						<div className='py-4 card-body'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
											<th>No.</th>
											<th>SOP Title</th>
											<th>SOP Description</th>
											<th>Feedback Remark</th>
											<th>Feedback File</th>
											<th>Feedback Date</th>
										</tr>
									</thead>
									<tbody className='text-gray-600 fw-bold'>
										{paginatedassignSOPData.map((employee, index) => (
											<tr key={index}>
												<td>{index + 1}</td>
												<td>{employee.taskTitle}</td>
												<td>{employee.description}</td>
												<td>{employee.remark}</td>
												<td>{employee.files}</td>
												<td>{employee.deadline}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{assignSOPData.length === 0 && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{assignSOPData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(assignSOPData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
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
								<SelectField
									className='fv-row m-0'
									label='Select service'
									name='service'
									value={selectedService.title}
									onChange={handleServiceSelect}
									htmlFor='service'
									options={employeeData.map((el: any) => `${el.name} - ${el.position}`)}
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
									value={selectedService.description}
									onChange={handleServiceSelect}
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
													<input
														type='text'
														className='form-control'
														value={sop.title}
													/>
												</td>
												<td>
													<input
														type='text'
														className='form-control'
														value={sop.description}
													/>
												</td>
												<td>
													<button
														className='btn btn-success btn-sm'
														onClick={() => {
															setSelectedService({
																title: sop.title,
																description: sop.description,
																sop_id: sop.sop_id,
																employee_ids: sop.employee_ids,
															})
															setUpdateService(true)
														}}>
														Update
													</button>
													<button
														className='btn btn-danger btn-sm mx-sm-3 mx-0 my-sm-0 my-2'
														onClick={() => notify(sop.sop_id)}>
														Delete
													</button>
												</td>
											</tr>
										))}
										<tr>
											<td>{assignSOPData.length + 1}</td>
											<td>
												<input
													type='text'
													className='form-control'
													placeholder='Enter Title'
													value={selectedService.title}
													onChange={handleServiceSelect}
													name='title'
												/>
											</td>
											<td>
												<input
													type='text'
													className='form-control'
													placeholder='Enter Description'
													value={selectedService.description}
													onChange={handleServiceSelect}
													name='description'
												/>
											</td>
											<td>
												{updateService ? (
													<button
														className='btn btn-primary btn-sm'
														onClick={() => handleSubmit(assignSOPData[1].employee_ids)}>
														Update
													</button>
												) : (
													<button
														className='btn btn-primary btn-sm'
														onClick={() => handleSubmit(assignSOPData[1].employee_ids)}>
														Add
													</button>
												)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							{assignSOPData.length === 0 && (
								<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
									<b>No records found</b>
								</div>
							)}
							{assignSOPData.length > 0 && (
								<UsersListPagination
									totalPages={Math.ceil(assignSOPData.length / pagination.itemsPerPage)}
									currentPage={pagination.page}
									onPageChange={handlePageChange}
								/>
							)}
						</div>
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default AssignSopList
