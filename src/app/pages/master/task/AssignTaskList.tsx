import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { CreateTask, DeleteTask, GetTask, UpdateTask } from '../../../Functions/FGGroup/TaskManagement'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import SelectField from '../../../components/SelectField'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type TaskFormData = {
	taskName: string
	remark: string
	endDate: Date | null
	file: File | null
}

const AssignTaskList: React.FC = () => {
	const intl = useIntl()

	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employeeId: any = searchParams.get('employeeId')
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedEmployee, setSelectedEmployee] = useState<string>('')
	const [showModal, setShowModal] = useState(false)
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [audioURL, setAudioURL] = useState<string | null>(null);
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [editTaskData, setEditTaskData] = useState<any>({});
	const [employeeData, setEmployeeData] = useState<any>([{ name: '', id: '' }])
	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		remark: '',
		endDate: null,
		file: null,
	})

	const fetchAssignTaskData = async (page?: number) => {
		try {
			const response = await GetTask({ task_id: employeeId })
			const filteredData: any = response.data
			setAssignTaskData(filteredData)
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
			});
			const filteredData: any = response.data;
			setEmployeeData(filteredData.map((el: any) => ({ name: el.name, id: el._id })));
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchAssignTaskData()
		fetchEmployeeData()
	}, [searchTerm, selectedEmployee])

	const handleEmployeeSelect = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		if (event.target instanceof HTMLSelectElement) {
			const selectedName = event.target.value;
			setSelectedEmployee(selectedName);  // Store the employee's name

			// const selectedEmployeeObj = employeeData.find((el: any) => el.name === selectedName);
			// const selectedId = selectedEmployeeObj ? selectedEmployeeObj.id : '';


			// // Update the URL with the selected employee ID
			// const newUrl = new URL(window.location.href);
			// newUrl.searchParams.set('employeeId', selectedId);
			// window.history.pushState({}, '', newUrl.toString());
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		try {
			const { taskName, remark, endDate, file } = taskFormData;

			const payload: any = {
				task_title: taskName,
				remarks: remark,
				start_date: endDate,
				end_date: endDate,
				file_url: file?.name,
				employee_id: assignTaskData[0].employee_id,
			}

			await CreateTask(payload)

			setShowModal(false);
			toast.success('Task Created Successfully')
			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	};

	const handleUpdate = async (e: React.FormEvent) => {
		try {
			const { id, taskName, remark, endDate, status } = editTaskData;

			const payload: any = {
				task_id: id,
				task_title: taskName,
				remarks: remark,
				end_date: endDate,
				status: status,
			}

			await UpdateTask(payload)

			setShowModal(false);
			toast.success('Task Updated Successfully')
			fetchAssignTaskData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}

	};

	const deleteTask = async () => {
		try {
			const { id } = editTaskData;
			await DeleteTask({ task_id: id })
			fetchAssignTaskData()
			toast.success('Task remove successfully')
		} catch (error) {
			console.error(error)
		}
	}

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files } = e.target;

		if (name === 'file' && files) {
			const selectedFile = files[0];
			setTaskFormData(prevState => ({
				...prevState,
				file: selectedFile,
			}));
		} else {
			setTaskFormData(prevState => ({
				...prevState,
				[name]: name === 'endDate' ? new Date(value) : value
			}));
		}
	};

	const handleInputEditTask = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;

		setEditTaskData((prevState: any) => ({
			...prevState,
			[name]: name === 'endDate' ? new Date(value) : value
		}));
	};

	const startRecording = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault(); // Prevent form submission
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const recorder = new MediaRecorder(stream);
		setMediaRecorder(recorder);
		recorder.ondataavailable = (event) => {
			const blob = event.data;
			setAudioBlob(blob);
			setAudioURL(URL.createObjectURL(blob)); // Update audioURL with the recorded audio

			const file = new File([blob], 'recording.mp3', { type: 'audio/mp3' });
			setAudioFile(file);

			setTaskFormData((prevState) => ({
				...prevState,
				file: file,
			}));
		};
		recorder.start();
		setIsRecording(true);
	};

	const stopRecording = () => {
		mediaRecorder?.stop();
		setIsRecording(false);
	};

	const startAudio = (e: any) => {
		const audio = new Audio(audioURL || '');
		audio.play();
		setIsPlaying(true);
		audio.onended = () => {
			setIsPlaying(false);
		};
	};

	const stopAudio = () => {
		const audio = new Audio(audioURL || '');
		audio.pause();
		setIsPlaying(false);
	};

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredassignTaskData = assignTaskData.filter((sale) =>
		sale.task_title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedassignTaskData = filteredassignTaskData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<button
				onClick={() => setAssignTaskData([''])}
				className='d-none'></button>
			<button className='d-none'>{selectedEmployee}</button>
			<button className='d-none'>{showModal}</button>
			<h1 className='fw-bold text-dark fs-1 mb-6 '>Task Assignment</h1>
			<div className='card p-5 mb-5'>
				<div className='d-flex mt-3 justify-content-between'>
					<SelectField
						className='fv-row m-0'
						label='Select Employee'
						name='employee'
						value={selectedEmployee}
						onChange={handleEmployeeSelect}
						htmlFor='employee'
						options={employeeData.map((el: any) => el.name)}
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
							Add Task
						</button>
					</div>
				</div>
			</div>
			<KTCard>
				<div className='card-header border-0 pt-4 align-items-center px-5'>
					<h2 className='mb-0'>Currently Running Tasks</h2>
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
								placeholder='Search user'
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

									<th>Task</th>
									<th>Remark</th>
									<th>File</th>
									<th>Audio</th>
									<th>Deadline</th>
									<th>Status</th>
									<th>Employee File</th>
									<th>Employee Remark</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{paginatedassignTaskData.map((employee, index) => (
									<tr key={index}>
										<td>{index + 1}</td>
										<td>{employee.task_title}</td>
										<td>{employee.remarks}</td>
										<td>{employee.file_url}</td>
										<td>{employee.adminAudio ? employee.adminAudio : 'N/A'}</td>
										<td>{DayJS(employee.end_date).format('DD/MM/YYYY hh:mm:ss A')}</td>
										<td>{employee.status}</td>
										<td>{employee.employee_file ? employee.employee_file : 'N/A'}</td>
										<td>{employee.employee_remarks ? employee.employee_remarks : 'N/A'}</td>
										<td>
											<button
												className='btn btn-success btn-sm'
												data-bs-toggle='modal'
												data-bs-target='#kt_modal_2'
												onClick={() =>
													setEditTaskData({
														id: employee._id,
														taskName: employee.task_title,
														remark: employee.remarks,
														endDate: employee.end_date ? new Date(employee.end_date) : null,
													})
												}
											>
												Edit
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{assignTaskData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{assignTaskData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(assignTaskData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>


				<div
					className='modal fade center'
					tabIndex={-1}
					id='kt_modal_1'>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>Add Task</h5>
								<button
									className='btn-close'
									data-bs-dismiss='modal'
									aria-label='Close'></button>
							</div>
							<div className='modal-body'>
								{/* Form fields */}
								<div className='mb-3'>
									<label htmlFor='taskTitle' className='form-label'>
										Task Title
									</label>
									<input
										type='text'
										className='form-control'
										placeholder='Enter task title'
										name='taskName'
										value={taskFormData.taskName}
										onChange={handleInputTask}
										required
									/>
								</div>
								{/* Form fields */}
								<div className='mb-3'>
									<label htmlFor='remark' className='form-label'>
										Remark
									</label>
									<input
										type='text'
										className='form-control'
										placeholder='Type your remark here (optional)'
										name='remark'
										value={taskFormData.remark}
										onChange={handleInputTask}
										required
									/>
								</div>
								{/* Form fields */}
								<div className='mb-3'>
									<label htmlFor='endDate' className='form-label'>
										End Date
									</label>
									<input
										type='date'
										className='form-control'
										name='endDate'
										value={taskFormData.endDate ? taskFormData.endDate.toISOString().substring(0, 10) : ''}
										onChange={handleInputTask}
										required
									/>
								</div>
								{/* Form fields */}
								<div className='mb-3'>
									<label htmlFor='file' className='form-label'>
										File Upload
									</label>
									<input
										type='file'
										className='form-control'
										name='file'
										onChange={handleInputTask}
										required
									/>
								</div>
								{/* Form fields */}
								<div className='mb-3'>
									<label htmlFor='audio' className='form-label'>
										Send Audio
									</label>
									<br />
									<button
										type="button"  // Ensure this is type="button" to prevent form submission
										className='btn btn-success btn-sm'
										onClick={startRecording}
										disabled={isRecording}
									>
										Record Audio
									</button>
									<button
										className='btn btn-info btn-sm mx-3'
										onClick={startAudio}
										disabled={!audioURL || isPlaying}
									>
										Start Audio
									</button>
									<button
										className='btn btn-danger btn-sm'
										onClick={isRecording ? stopRecording : stopAudio}
										disabled={!isRecording && !isPlaying}
									>
										{isRecording ? 'Stop Recording' : 'Stop Audio'}
									</button>
									{audioURL && (
										<audio controls src={audioURL} className='mt-5'>
											<track kind="captions" srcLang="en" label="English captions" default />
											Your browser does not support the audio element.
										</audio>
									)}
								</div>
							</div>
							<div className='modal-footer'>
								<button
									type='button'
									className='btn btn-light'
									data-bs-dismiss='modal'>
									Close
								</button>
								<button
									className='btn btn-primary'
									onClick={handleSubmit}
									data-bs-dismiss='modal'>
									Add Task
								</button>
							</div>
						</div>
					</div>
				</div>

				<div
					className='modal fade center'
					tabIndex={-1}
					id='kt_modal_2'>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content'>
							<div className='modal-header'>
								<h5 className='modal-title'>Add Task</h5>
								<button
									className='btn-close'
									data-bs-dismiss='modal'
									aria-label='Close'></button>
							</div>
							<div className='modal-body'>
								<div className='mb-3'>
									<label htmlFor='taskTitle' className='form-label'>
										Task Title
									</label>
									<input
										type='text'
										className='form-control'
										placeholder='Enter task title'
										name='taskName'
										value={editTaskData.taskName || ''}
										onChange={handleInputEditTask}
										required
									/>
								</div>
								<div className='mb-3'>
									<label htmlFor='remark' className='form-label'>
										Remark
									</label>
									<input
										type='text'
										className='form-control'
										placeholder='Type your remark here (optional)'
										name='remark'
										value={editTaskData.remark || ''}
										onChange={handleInputEditTask}
										required
									/>
								</div>
								<div className='mb-3'>
									<label htmlFor='endDate' className='form-label'>
										End Date
									</label>
									<input
										type='date'
										className='form-control'
										name='endDate'
										value={editTaskData.endDate ? editTaskData.endDate.toISOString().substring(0, 10) : ''}
										onChange={handleInputEditTask}
										required
									/>
								</div>
								<div className='mb-3'>
									<SelectField
										className='fv-row m-0'
										label='status'
										name='status'
										value={editTaskData.status}
										onChange={handleInputEditTask}
										htmlFor='status'
										options={[
											'PENDING',
											'COMPLETED',
											'REJECTED',
										]}
									/>
								</div>
							</div>
							<div className='modal-footer d-flex justify-content-between'>
								<button
									type='button'
									className='btn btn-light'
									data-bs-dismiss='modal'>
									Close
								</button>
								<div>
									<button
										type='button'
										className='btn btn-danger me-2'
										onClick={deleteTask}
										data-bs-dismiss='modal'>
										Delete
									</button>
									<button
										className='btn btn-primary'
										onClick={handleUpdate}
										data-bs-dismiss='modal'>
										Save Changes
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</KTCard>
		</>
	)
}

export default AssignTaskList
