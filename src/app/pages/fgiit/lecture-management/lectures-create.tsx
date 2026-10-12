import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import { AddLectureReminder, GetMentor } from '../../../Functions/FGGroup'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup/AccountFunctions'

interface Mentor {
	_id: string
	name: string
	email: string
}

const LecturesCreate = () => {
	const navigate = useNavigate()
	const [mentors, setMentors] = useState<Mentor[]>([])
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		mentor_id: '',
		lecture_topic: '',
		lecture_pdf: '',
		lecture_date: '',
		lecture_start_time: '',
	})

	const [pdfFile, setPdfFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)
	const [isDragOver, setIsDragOver] = useState(false)

	const fetchMentors = async () => {
		try {
			const response: any = await GetMentor({ limit: 100 })
			if (response.data) {
				setMentors(response.data)
			}
		} catch (error) {
			console.error('Error fetching mentors:', error)
			toast.error('Failed to load mentors')
		}
	}

	useEffect(() => {
		fetchMentors()
	}, [])

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target

		setFormData((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const isTimeInPast = (dateString: string, timeString: string) => {
		if (!dateString || !timeString) return false
		const selectedDate = new Date(dateString)
		const now = new Date()
		const [hours, minutes] = timeString.split(':').map(Number)
		selectedDate.setHours(hours, minutes, 0, 0)
		const isToday = now.toDateString() === selectedDate.toDateString()
		return isToday && selectedDate < now
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			handleFile(file)
		}
	}

	const handleFile = (file: File | undefined) => {
		if (!file) return

		// Validate file type
		if (file.type !== 'application/pdf') {
			toast.error('Please select a PDF file')
			return
		}

		// Validate file size (limit to 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB in bytes
		if (file.size > maxSize) {
			toast.error('File size exceeds 10MB limit. Please select a smaller PDF file.')
			return
		}

		// Validate file name
		const fileName = file.name.toLowerCase();
		if (!fileName.endsWith('.pdf')) {
			toast.error('File extension must be .pdf');
			return;
		}

		// Additional validation: Check if file name is not empty
		if (!fileName.trim()) {
			toast.error('File name cannot be empty');
			return;
		}

		setPdfFile(file)
		setFormData((prev) => ({
			...prev,
			lecture_pdf: '',
		}))
		toast.success('PDF file selected successfully!')
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
		const file = e.dataTransfer.files?.[0]
		if (file) {
			handleFile(file)
		}
	}

	const removeFile = () => {
		setPdfFile(null)
		setFormData((prev) => ({
			...prev,
			lecture_pdf: '',
		}))
	}

	const uploadPdfFile = async (): Promise<string> => {
		if (!pdfFile) return ''

		// Re-validate file before upload to ensure it still meets requirements
		if (pdfFile.type !== 'application/pdf') {
			toast.error('Invalid file type. Please select a PDF file.')
			setUploading(false);
			return '';
		}

		const fileName = pdfFile.name.toLowerCase();
		if (!fileName.endsWith('.pdf')) {
			toast.error('File extension must be .pdf');
			setUploading(false);
			return '';
		}

		setUploading(true)
		try {
			const response: any = await FileUploadToFGGroup([pdfFile], { directory: 'lecture-pdfs' })
			if (
				response &&
				response.data &&
				response.data.fileURLs &&
				response.data.fileURLs.length > 0
			) {
				const fileUrl = response.data.fileURLs[0]
				toast.success('PDF uploaded successfully')
				return fileUrl
			} else {
				throw new Error('File upload failed')
			}
		} catch (error: any) {
			console.error('Error uploading file:', error)
			toast.error(error.message || 'Failed to upload PDF')
			throw error
		} finally {
			setUploading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (
			!formData.mentor_id ||
			!formData.lecture_topic ||
			!formData.lecture_date ||
			!formData.lecture_start_time
		) {
			toast.error('Please fill all required fields')
			return
		}

		let pdfUrl = formData.lecture_pdf
		if (pdfFile && !pdfUrl) {
			// Validate file before attempting upload
			if (pdfFile.type !== 'application/pdf') {
				toast.error('Invalid file type. Please select a PDF file.');
				return;
			}

			const maxSize = 10 * 1024 * 1024; // 10MB in bytes
			if (pdfFile.size > maxSize) {
				toast.error('File size exceeds 10MB limit. Please select a smaller PDF file.');
				return;
			}

			const fileName = pdfFile.name.toLowerCase();
			if (!fileName.endsWith('.pdf')) {
				toast.error('File extension must be .pdf');
				return;
			}

			try {
				pdfUrl = await uploadPdfFile()
			} catch (error) {
				return
			}
		}

		setLoading(true)
		try {
			await AddLectureReminder({
				mentor_id: formData.mentor_id,
				lecture_topic: formData.lecture_topic,
				lecture_pdf: pdfUrl || undefined,
				lecture_date: formData.lecture_date,
				lecture_start_time: formData.lecture_start_time,
			})

			toast.success('Lecture reminder created successfully')
			navigate('/fgiit/lectures-list')
		} catch (error: any) {
			console.error('Error creating lecture reminder:', error)
			toast.error(error.message || 'Failed to create lecture reminder')
		} finally {
			setLoading(false)
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Lecture Reminder</PageTitle>

			<div className='row g-5 g-xl-8'>
				{/* Main Form Card */}
				<div className='col-xl-8'>
					<KTCard className='shadow-sm'>
						<div className='card-header border-0 pt-6'>
							<div className='card-title'>
								<div className='d-flex align-items-center'>
									<div className='symbol symbol-50px me-4'>
										<span className='symbol-label bg-light-primary'>
											<i className='fas fa-chalkboard-teacher fs-2 text-primary'></i>
										</span>
									</div>
									<div>
										<h3 className='fw-bold mb-0'>New Lecture Reminder</h3>
										<span className='text-muted fs-7'>
											Fill in the details to create a new lecture reminder
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className='card-body pt-0'>
							<form onSubmit={handleSubmit}>
								{/* Mentor & Topic Section */}
								<div className='mb-8'>
									<h5 className='text-gray-800 mb-4 d-flex align-items-center'>
										<span className='bullet bullet-vertical h-20px bg-primary me-3'></span>
										Basic Information
									</h5>
									<div className='row'>
										<div className='col-md-6 mb-5'>
											<label className='form-label required fs-6 fw-semibold'>
												Select Mentor
											</label>
											<div className='input-group'>
												<span className='input-group-text bg-light border-end-0'>
													<i className='fas fa-user-tie text-gray-500'></i>
												</span>
												<select
													className='form-select border-start-0 ps-0'
													name='mentor_id'
													value={formData.mentor_id}
													onChange={handleInputChange}
													required>
													<option value=''>Choose a mentor...</option>
													{mentors.map((mentor) => (
														<option
															key={mentor._id}
															value={mentor._id}>
															{mentor.name} ({mentor.email})
														</option>
													))}
												</select>
											</div>
										</div>

										<div className='col-md-6 mb-5'>
											<label className='form-label required fs-6 fw-semibold'>
												Lecture Topic
											</label>
											<div className='input-group'>
												<span className='input-group-text bg-light border-end-0'>
													<i className='fas fa-book text-gray-500'></i>
												</span>
												<input
													type='text'
													className='form-control border-start-0 ps-0'
													name='lecture_topic'
													value={formData.lecture_topic}
													onChange={handleInputChange}
													placeholder='Enter lecture topic...'
													required
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Date & Time Section */}
								<div className='mb-8'>
									<h5 className='text-gray-800 mb-4 d-flex align-items-center'>
										<span className='bullet bullet-vertical h-20px bg-success me-3'></span>
										Schedule
									</h5>
									<div className='row'>
										<div className='col-md-6 mb-5'>
											<label className='form-label required fs-6 fw-semibold'>
												Lecture Date
											</label>
											<div className='input-group'>
												<span className='input-group-text bg-light border-end-0'>
													<i className='fas fa-calendar-alt text-gray-500'></i>
												</span>
												<input
													type='date'
													className='form-control border-start-0 ps-0'
													name='lecture_date'
													value={formData.lecture_date}
													onChange={handleInputChange}
													min={new Date().toISOString().split('T')[0]}
													required
												/>
											</div>
										</div>

										<div className='col-md-6 mb-5'>
											<label className='form-label required fs-6 fw-semibold'>
												Start Time
											</label>
											<div className='input-group'>
												<span className='input-group-text bg-light border-end-0'>
													<i className='fas fa-clock text-gray-500'></i>
												</span>
												<input
													type='time'
													className='form-control border-start-0 ps-0'
													name='lecture_start_time'
													value={formData.lecture_start_time}
													onChange={handleInputChange}
													required
												/>
											</div>
										</div>
									</div>
								</div>

								{/* PDF Upload Section */}
								<div className='mb-8'>
									<h5 className='text-gray-800 mb-4 d-flex align-items-center'>
										<span className='bullet bullet-vertical h-20px bg-warning me-3'></span>
										Lecture Materials
										<span className='badge badge-light-warning ms-2'>Optional</span>
									</h5>

									{!pdfFile && !formData.lecture_pdf ? (
										<div
											className={`dropzone ${isDragOver ? 'bg-light-primary border-primary' : ''}`}
											onDragOver={handleDragOver}
											onDragLeave={handleDragLeave}
											onDrop={handleDrop}
											style={{
												border: `2px dashed ${isDragOver ? '#009ef7' : '#e4e6ef'}`,
												borderRadius: '12px',
												padding: '40px',
												textAlign: 'center',
												cursor: 'pointer',
												transition: 'all 0.3s ease',
												backgroundColor: isDragOver ? '#f1faff' : '#fafafa',
											}}>
											<input
												type='file'
												accept='.pdf,application/pdf'
												onChange={handleFileChange}
												disabled={uploading}
												style={{ display: 'none' }}
												id='pdf-upload'
											/>
											<label
												htmlFor='pdf-upload'
												style={{ cursor: 'pointer' }}>
												<div className='mb-3'>
													<i
														className='fas fa-cloud-upload-alt text-primary'
														style={{ fontSize: '48px' }}></i>
												</div>
												<h4 className='text-gray-700 mb-1'>
													Drag & Drop your PDF here
												</h4>
												<p className='text-muted mb-3'>or click to browse</p>
												<p className='text-muted mb-3'><small>Max file size: 10MB</small></p>
												<span className='btn btn-sm btn-light-primary'>
													<i className='fas fa-file-pdf me-2'></i>
													Select PDF File
												</span>
											</label>
										</div>
									) : (
										<div
											className='d-flex align-items-center p-4 rounded'
											style={{
												backgroundColor: '#f8f9fa',
												border: '1px solid #e9ecef',
											}}>
											<div
												className='symbol symbol-50px me-4'
												style={{ minWidth: '50px' }}>
												<span className='symbol-label bg-light-danger'>
													<i className='fas fa-file-pdf fs-2 text-danger'></i>
												</span>
											</div>
											<div className='flex-grow-1'>
												<div className='fw-semibold text-gray-800'>
													{pdfFile?.name || 'Uploaded PDF'}
												</div>
												{pdfFile && (
													<span className='text-muted fs-7'>
														{formatFileSize(pdfFile.size)}
													</span>
												)}
												{formData.lecture_pdf && (
													<div className='mt-1'>
														<a
															href={formData.lecture_pdf.startsWith("http") ? formData.lecture_pdf : `https://files.fggroup.in/${formData.lecture_pdf}`}
															target='_blank'
															rel='noopener noreferrer'
															className='text-primary fs-7'>
															<i className='fas fa-external-link-alt me-1'></i>
															View PDF
														</a>
													</div>
												)}
												{pdfFile && !formData.lecture_pdf && (
													<span className='badge badge-light-warning mt-1'>
														<i className='fas fa-info-circle me-1'></i>
														Will upload on submit
													</span>
												)}
											</div>
											<button
												type='button'
												className='btn btn-sm btn-icon btn-light-danger'
												onClick={removeFile}
												title='Remove file'>
												<i className='fas fa-trash-alt'></i>
											</button>
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<div className='separator my-8'></div>
								<div className='d-flex justify-content-end gap-3'>
									<button
										type='button'
										className='btn btn-light btn-active-light-primary'
										onClick={() => navigate('/fgiit/lectures-list')}>
										<i className='fas fa-times me-2'></i>
										Cancel
									</button>
									<button
										type='submit'
										className='btn btn-primary'
										disabled={loading || uploading}>
										{loading ? (
											<>
												<span className='spinner-border spinner-border-sm me-2'></span>
												Creating...
											</>
										) : uploading ? (
											<>
												<span className='spinner-border spinner-border-sm me-2'></span>
												Uploading PDF...
											</>
										) : (
											<>
												<i className='fas fa-check me-2'></i>
												Create Reminder
											</>
										)}
									</button>
								</div>
							</form>
						</div>
					</KTCard>
				</div>

				{/* Side Info Card */}
				<div className='col-xl-4'>
					{/* Tips Card */}
					<KTCard className='shadow-sm mb-5'>
						<div className='card-header border-0'>
							<h3 className='card-title'>
								<i className='fas fa-lightbulb text-warning me-2'></i>
								Quick Tips
							</h3>
						</div>
						<div className='card-body pt-0'>
							<div className='d-flex align-items-start mb-4'>
								<span className='bullet bullet-dot bg-primary h-10px w-10px mt-2 me-3'></span>
								<div className='text-gray-600 fs-7'>
									Select the mentor who will be conducting the lecture
								</div>
							</div>
							<div className='d-flex align-items-start mb-4'>
								<span className='bullet bullet-dot bg-success h-10px w-10px mt-2 me-3'></span>
								<div className='text-gray-600 fs-7'>
									Set the date and time for the scheduled lecture
								</div>
							</div>
							<div className='d-flex align-items-start'>
								<span className='bullet bullet-dot bg-warning h-10px w-10px mt-2 me-3'></span>
								<div className='text-gray-600 fs-7'>
									Upload lecture PDF (max 10MB) to share materials with students
								</div>
							</div>
						</div>
					</KTCard>

					{/* Selected Preview Card */}
					{(formData.mentor_id || formData.lecture_topic) && (
						<KTCard className='shadow-sm bg-light-primary border-0'>
							<div className='card-header border-0'>
								<h3 className='card-title'>
									<i className='fas fa-eye text-primary me-2'></i>
									Preview
								</h3>
							</div>
							<div className='card-body pt-0'>
								{formData.mentor_id && (
									<div className='mb-3'>
										<small className='text-muted'>Mentor</small>
										<div className='fw-semibold text-gray-800'>
											{mentors.find((m) => m._id === formData.mentor_id)?.name || '-'}
										</div>
									</div>
								)}
								{formData.lecture_topic && (
									<div className='mb-3'>
										<small className='text-muted'>Topic</small>
										<div className='fw-semibold text-gray-800'>
											{formData.lecture_topic}
										</div>
									</div>
								)}
								{formData.lecture_date && (
									<div className='mb-3'>
										<small className='text-muted'>Date & Time</small>
										<div className='fw-semibold text-gray-800'>
											{new Date(formData.lecture_date).toLocaleDateString('en-IN', {
												weekday: 'long',
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})}
											{formData.lecture_start_time && (
												<span className='ms-2 badge badge-light-primary'>
													{formData.lecture_start_time}
												</span>
											)}
										</div>
									</div>
								)}
							</div>
						</KTCard>
					)}
				</div>
			</div>
		</>
	)
}

export default LecturesCreate