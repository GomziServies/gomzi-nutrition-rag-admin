import React, { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateTask } from '../../../Functions/FGGroup/TaskManagement'

type TaskFormData = {
	taskName: string
	remark: string
	start_date: Date | any
	end_date: Date | any
	financial_worth: string
	social_worth: string
	files: File[]
}

const TaskAdd = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employeeId: any = searchParams.get('employeeId')

	const [showModal, setShowModal] = useState(true)
	const [selectedOption, setSelectedOption] = useState('fileUpload')
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioURL, setAudioURL] = useState<string | null>(null)
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [submitLoading, setSubmitLoading] = useState(false)

	const [loading, setLoading] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [assignTaskData, setAssignTaskData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>()

	const [taskFormData, setTaskFormData] = useState<TaskFormData>({
		taskName: '',
		remark: '',
		start_date: null,
		end_date: null,
		financial_worth: '',
		social_worth: '',
		files: [],
	})

	const handleInputTask = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, files } = e.target

		if (name === 'files' && files) {
			const selectedFiles = Array.from(files)
			setTaskFormData((prevState) => ({
				...prevState,
				files: selectedFiles,
			}))
		} else {
			setTaskFormData((prevState) => ({
				...prevState,
				[name]: name === 'endDate' ? new Date(value) : value,
			}))
		}
	}

	const startRecording = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault()
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		const recorder = new MediaRecorder(stream)
		setMediaRecorder(recorder)
		recorder.ondataavailable = (event) => {
			const blob = event.data
			setAudioBlob(blob)
			setAudioURL(URL.createObjectURL(blob)) // Update audioURL with the recorded audio

			const file = new File([blob], 'recording.mp3', { type: 'audio/mp3' })
			setAudioFile(file)

			// Assuming we want to add the audio file to the files array for submission
			setTaskFormData((prevState) => ({
				...prevState,
				files: [file],
			}))
		}
		recorder.start()
		setIsRecording(true)
	}

	const startAudio = (e: any) => {
		const audio = new Audio(audioURL || '')
		audio.play()
		setIsPlaying(true)
		audio.onended = () => {
			setIsPlaying(false)
		}
	}

	const stopRecording = () => {
		mediaRecorder?.stop()
		setIsRecording(false)
	}
	const stopAudio = () => {
		setIsPlaying(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		setSubmitLoading(true)

		try {
			const { taskName, remark, start_date, end_date, files, financial_worth, social_worth } =
				taskFormData

			let fileUrls: string[] = []
			if (files.length > 0) {
				const response: any = await FileUploadToFGGroup(files, {
					directory: 'files',
				})
				fileUrls = response.data?.fileURLs || []
				toast.success('Files uploaded successfully')
			}

			const payload: any = {
				task_title: taskName,
				remark_by_hr: remark,
				start_date: start_date,
				end_date: end_date,
				financial_worth: financial_worth,
				social_worth: social_worth,
				file_url: fileUrls,
				admin_id: employeeId,
			}

			await CreateTask(payload)

			setShowModal(false)
			toast.success('Task Created Successfully')
			setTaskFormData({
				taskName: '',
				remark: '',
				start_date: '',
				end_date: '',
				financial_worth: '',
				social_worth: '',
				files: [],
			})
			window.history.back()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		} finally {
			setSubmitLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Team Task</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				<div className='card-header border-0 pt-6 pb-4 px-6 d-flex align-items-center justify-content-between'>
					<div>
						<h3 className='fw-bolder text-gray-900 m-0'>Assign New Team Task</h3>
						<span className='text-muted fs-7'>Create and assign a task to your team member</span>
					</div>
					<button
						className='btn btn-light rounded-pill px-4 fw-semibold'
						onClick={() => window.history.back()}>
						Back
					</button>
				</div>

				<Form className='p-6 pt-0'>
					{/* Task Title + Remark */}
					<div className='row mb-3'>
						<div className='col-md-6'>
							<Form.Group controlId='taskTitle'>
								<Form.Label>Task Title</Form.Label>
								<Form.Control
									className='inputfield-bg'
									type='text'
									placeholder='Enter task title'
									name='taskName'
									value={taskFormData.taskName}
									onChange={handleInputTask}
									required
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group controlId='remark'>
								<Form.Label>Remark</Form.Label>
								<Form.Control
									className='inputfield-bg'
									type='text'
									placeholder='Type your remark here (optional)'
									name='remark'
									value={taskFormData.remark}
									onChange={handleInputTask}
									required
								/>
							</Form.Group>
						</div>
					</div>

					{/* Start Date + End Date */}
					<div className='row mb-3'>
						<div className='col-md-6'>
							<Form.Group controlId='start_date'>
								<Form.Label>Start Date</Form.Label>
								<Form.Control
									className='inputfield-bg'
									type='date'
									name='start_date'
									value={taskFormData.start_date}
									onChange={handleInputTask}
									required
								/>
							</Form.Group>
						</div>
						<div className='col-md-6 mb-3'>
							<Form.Group controlId='end_date'>
								<Form.Label>End Date</Form.Label>
								<Form.Control
									className='inputfield-bg'
									type='date'
									name='end_date'
									value={taskFormData.end_date}
									onChange={handleInputTask}
									required
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Financial worth</Form.Label>
								<Form.Control
									as='textarea'
									className='inputfield-bg'
									name='financial_worth'
									rows={3}
									value={taskFormData.financial_worth}
									onChange={handleInputTask}
								/>
							</Form.Group>
						</div>
						<div className='col-md-6'>
							<Form.Group className='mb-3'>
								<Form.Label>Social worth</Form.Label>
								<Form.Control
									as='textarea'
									className='inputfield-bg'
									name='social_worth'
									rows={3}
									value={taskFormData.social_worth}
									onChange={handleInputTask}
								/>
							</Form.Group>
						</div>

						<div className='col-6'>
							{/* File Upload */}
							{selectedOption === 'fileUpload' && (
								<div className='row mb-3'>
									<div className='col-12'>
										<Form.Group controlId='files'>
											<Form.Label>File Upload (Multiple files allowed)</Form.Label>
											<Form.Control
												className='inputfield-bg'
												type='file'
												name='files'
												onChange={handleInputTask}
												multiple
												required
											/>
											{taskFormData.files.length > 0 && (
												<div className='mt-3'>
													<p className='mb-2'>Selected Files:</p>
													{taskFormData.files.map((file, index) => (
														<div
															key={index}
															className='d-flex align-items-center mb-2'>
															<span className='me-2'>{file.name}</span>
															<Button
																variant='danger'
																size='sm'
																onClick={() => {
																	const newFiles = taskFormData.files.filter((_, i) => i !== index)
																	setTaskFormData((prev) => ({
																		...prev,
																		files: newFiles,
																	}))
																}}>
																Remove
															</Button>
														</div>
													))}
												</div>
											)}
										</Form.Group>
									</div>
								</div>
							)}

							{/* Audio Recording */}
							{selectedOption === 'sendAudio' && (
								<div className='row mb-3'>
									<div className='col-12'>
										<Form.Group controlId='audio'>
											<Form.Label>Send Audio</Form.Label>
											<div>
												<Button
													variant='success'
													size='sm'
													onClick={startRecording}
													disabled={isRecording}>
													Record Audio
												</Button>
												<Button
													variant='info'
													size='sm'
													className='mx-3'
													onClick={startAudio}
													disabled={!audioURL || isPlaying}>
													Start Audio
												</Button>
												<Button
													variant='danger'
													size='sm'
													onClick={isRecording ? stopRecording : stopAudio}
													disabled={!isRecording && !isPlaying}>
													{isRecording ? 'Stop Recording' : 'Stop Audio'}
												</Button>
											</div>
											{audioURL && (
												<audio
													controls
													src={audioURL}
													className='mt-3'>
													<track
														kind='captions'
														srcLang='en'
														label='English captions'
														default
													/>
													Your browser does not support the audio element.
												</audio>
											)}
										</Form.Group>
									</div>
								</div>
							)}
						</div>
						<div className='col-6'>
							<Form.Group controlId='uploadOption'>
								<Form.Label className='mt-3'>Select File / Audio</Form.Label>
								<div className='d-flex'>
									<Form.Check
										type='radio'
										label='File Upload'
										name='uploadOption'
										id='fileUpload'
										checked={selectedOption === 'fileUpload'}
										onChange={() => setSelectedOption('fileUpload')}
										className='me-4'
									/>
									<Form.Check
										type='radio'
										label='Send Audio'
										name='uploadOption'
										id='sendAudio'
										checked={selectedOption === 'sendAudio'}
										onChange={() => setSelectedOption('sendAudio')}
									/>
								</div>
							</Form.Group>
						</div>
					</div>

					{/* Buttons */}

					<div className='row'>
						<div className='col-12 text-end'>
							<Button
								variant='primary'
								onClick={handleSubmit}
								disabled={submitLoading} // loading ma disable
							>
								{submitLoading ? (
									<>
										<span
											className='spinner-border spinner-border-sm me-2'
											role='status'
											aria-hidden='true'></span>
										Processing...
									</>
								) : (
									'+ Add Task'
								)}
							</Button>
						</div>
					</div>
				</Form>
			</div>
		</>
	)
}

export default TaskAdd
