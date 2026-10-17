import React, { useEffect, useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateEmployeeMemo } from '../../../Functions/FGGroup/Employee'
import { errorToast, successToast } from '../../../../_metronic/helpers/Utils'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons'

const CreateMemo = () => {
	const navigate = useNavigate()
	const [employees, setEmployees] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
	const [showPDFPreview, setShowPDFPreview] = useState(false)
	const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]) // Default to today
	const [subject, setSubject] = useState("")
	
	// Static subject for memos
	const STATIC_SUBJECT = "Unplanned / Unauthorized Leave";

	// Get logged-in admin ID from localStorage
	const getLoggedInAdminId = () => {
		const adminData = localStorage.getItem('fg_group_info')
		if (adminData) {
			try {
				const parsedData = JSON.parse(adminData)
				return parsedData._id
			} catch (error) {
				console.error('Error parsing admin data:', error)
				return null
			}
		}
		return null
	}
	
	// Get logged-in admin details from localStorage
	const getLoggedInAdminDetails = () => {
		const adminData = localStorage.getItem('fg_group_info')
		if (adminData) {
			try {
				return JSON.parse(adminData)
			} catch (error) {
				console.error('Error parsing admin data:', error)
				return null
			}
		}
		return null
	}

	// Fetch employees for dropdown
	useEffect(() => {
		const fetchEmployees = async () => {
			setLoading(true)
			try {
				const response: any = await GetEmployees()
				if (response.status === 200 && response.data) {
					// Filter active employees only
					const activeEmployees = response.data.filter((emp: any) => emp.employee?.status === true)
					setEmployees(activeEmployees)
				} else {
					errorToast('Failed to fetch employees')
				}
			} catch (error) {
				errorToast('Error fetching employees')
				console.error('Error fetching employees:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchEmployees()
	}, [])

	// Form validation schema
	const memoValidationSchema = Yup.object().shape({
		employee_id: Yup.string().required('Employee is required')
	})

	// Handle employee selection
	const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const employeeId = e.target.value
		formik.handleChange(e)
		
		// Find selected employee details
		const employee = employees.find(emp => emp.employee_id === employeeId)
		setSelectedEmployee(employee || null)
	}
	
	// Handle date change
	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedDate(e.target.value)
	}

	// Format date as dd-mm-yyyy
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
		const year = date.getFullYear();
		return `${day}-${month}-${year}`;
	};

	// Generate PDF
	const generatePDF = async () => {
		const memoContent = document.getElementById('memoContent')
		
		if (memoContent) {
			try {
				// Use html2canvas with optimized settings for text clarity
				const canvas = await html2canvas(memoContent, {
					scale: 2, // Reduced scale to decrease file size while maintaining readability
					useCORS: true,
					logging: false,
					backgroundColor: '#ffffff',
					allowTaint: true,
					scrollX: 0,
					scrollY: 0
				})
				const imgData = canvas.toDataURL('image/jpeg', 0.8) // Use JPEG with 80% quality to reduce file size
				
				// Create PDF with proper A4 dimensions
				const pdf = new jsPDF('p', 'mm', 'a4')
				const pdfWidth = pdf.internal.pageSize.getWidth()
				const pdfHeight = pdf.internal.pageSize.getHeight()
				
				// Calculate dimensions with proper margins
				const margin = 15
				const imgWidth = pdfWidth - (margin * 2)
				const imgHeight = (canvas.height * imgWidth) / canvas.width
				const xOffset = margin
				const yOffset = margin
				
				// Check if content fits on one page, otherwise adjust
				if (imgHeight > (pdfHeight - (margin * 2))) {
					// Scale down to fit page
					const scaleFactor = (pdfHeight - (margin * 2)) / imgHeight
					const scaledWidth = imgWidth * scaleFactor
					const scaledHeight = imgHeight * scaleFactor
					const scaledXOffset = (pdfWidth - scaledWidth) / 2
					
					pdf.addImage(imgData, 'JPEG', scaledXOffset, yOffset, scaledWidth, scaledHeight)
				} else {
					// Content fits, center it
					const centerYOffset = (pdfHeight - imgHeight) / 2
					pdf.addImage(imgData, 'JPEG', xOffset, centerYOffset, imgWidth, imgHeight)
				}
				
				// Save the PDF with a meaningful name
				pdf.save(`Unplanned_Leave_Memo_${selectedEmployee ? selectedEmployee.full_name : 'Employee'}.pdf`)
			} catch (error) {
				console.error('Error generating PDF:', error)
				// Fallback to manual content if html2canvas fails
				generatePDFFallback()
			}
		} else {
			// Fallback to manual content if element not found
			generatePDFFallback()
		}
	}

	// Fallback PDF generation method
	const generatePDFFallback = () => {
		const doc = new jsPDF()
		
		doc.setFontSize(12)
		doc.text("Formal Notice – Unplanned / Unauthorized Leave", 20, 20)
		
		const currentDate = new Date().toLocaleDateString()
		doc.text(`Date: ${currentDate}`, 20, 35)
		
		if (selectedEmployee) {
			doc.text(`To: ${selectedEmployee.full_name}`, 20, 45)
			doc.text(`Employee ID: ${selectedEmployee.employee?.employee_code || ''}`, 20, 55)
			doc.text(`Department/Designation: ${selectedEmployee.employee?.position || ''}`, 20, 65)
		}
		
		doc.text(`Subject: ${STATIC_SUBJECT}`, 20, 75)
		
		const formattedDate = formatDate(selectedDate)
		
		const content = [
			"",
			`Dear ${selectedEmployee ? selectedEmployee.full_name : 'Employee'},`,
			"",
			"This is to formally notify you regarding your unplanned/unauthorized leave taken on",
			`${formattedDate}, during which no prior approval or timely communication was provided to`,
			"either your Reporting Manager or the HR Department.",
			"",
			"Your absence without authorization has caused disruption to workflow and has adversely",
			"impacted team operations. As per company policy, all employees are required to obtain",
			"prior approval for any leave of absence except in cases of genuine emergency, in which",
			"immediate intimation is mandatory.",
			"",
			"You are hereby instructed to submit a written explanation for your unauthorized absence",
			`within 24/48 hours of receiving this notice. Failure to provide a satisfactory explanation`,
			"may result in disciplinary action as per company rules, which may include:",
			"",
			"• Deduction of salary for the unauthorized period of absence,",
			"",
			"• Issuance of a warning or show-cause notice,",
			"",
			"• Recording of misconduct in your employee file, and",
			"",
			"• Any further action as deemed appropriate under company policy.",
			"",
			"You are advised to ensure strict adherence to the leave policy henceforth to avoid further",
			"consequences.",
			"",
			"",
			`Sincerely,`,
			"",
			`${getLoggedInAdminDetails()?.full_name || 'Administrator'}`,
			`HR Manager`,
			`FG Group`
		]
		
		doc.setFontSize(11)
		doc.text(content, 20, 85)
		doc.save(`Unplanned_Leave_Memo_${selectedEmployee ? selectedEmployee.full_name : 'Employee'}.pdf`)
	}

	// Form handler
	const formik = useFormik({
		initialValues: {
			employee_id: ''
		},
		validationSchema: memoValidationSchema,
		onSubmit: async (values, { resetForm }) => {
			setSubmitting(true)
			try {
				const admin_id = getLoggedInAdminId()
				if (!admin_id) {
					errorToast('Unable to get logged-in user information')
					setSubmitting(false)
					return
				}

				const response: any = await CreateEmployeeMemo({
					admin_id,
					employee_id: values.employee_id,
					memo: {
						subject: subject || STATIC_SUBJECT,
						date: selectedDate
					}
				})

				if (response.status === 200) {
					successToast('Memo created successfully')
					// Show PDF preview
					setShowPDFPreview(true)
					// Generate PDF automatically after successful memo creation
					generatePDF()
					resetForm()
					setSelectedEmployee(null)
				} else {
					errorToast(response.message || 'Failed to create memo')
				}
			} catch (error) {
				errorToast('Error creating memo')
				console.error('Error creating memo:', error)
			} finally {
				setSubmitting(false)
			}
		}
	})

	return (
		<>
			<PageTitle breadcrumbs={[]}>Create Employee Memo</PageTitle>

			{/* Page Header */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<div className='d-flex flex-column'>
					<h2 className='text-gray-900 fw-bold fs-2 m-0'>Create Memo</h2>
					<span className='text-muted fs-7 fw-semibold mt-1'>
						Issue a formal notice for unplanned / unauthorized leave
					</span>
				</div>
				<Link
					to='/hr/memo-list'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Memos</span>
				</Link>
			</div>

			<div className='row g-5'>
				<div className='col-md-5 col-lg-4'>
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							background: '#ffffff',
							border: '1px solid #E4EAF2',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
						}}>
						<div className='card-body p-6'>
							<div className='d-flex align-items-center mb-6'>
								<div
									className='d-flex align-items-center justify-content-center me-3'
									style={{
										width: '40px',
										height: '40px',
										borderRadius: '10px',
										background: '#EAF1F8',
										color: '#1E4F8A',
									}}>
									<i className='bi bi-file-earmark-text fs-4'></i>
								</div>
								<div>
									<h4 className='fw-bold text-gray-900 m-0 fs-5'>Memo Details</h4>
									<span className='text-muted fs-7 fw-semibold'>
										Select employee, date & subject
									</span>
								</div>
							</div>
							<form onSubmit={formik.handleSubmit}>
								<div className='fv-row mb-5'>
									<label htmlFor='memo-employee' className='form-label required fw-bold fs-7'>Select Employee</label>
									<select
										id='memo-employee'
										className='gz-inv-select w-100'
										style={{ height: '38px', borderRadius: '8px' }}
										{...formik.getFieldProps('employee_id')}
										onChange={handleEmployeeChange}
										disabled={loading}>
										<option value=''>Select an employee...</option>
										{employees.map((employee) => (
											<option key={employee.employee_id} value={employee.employee_id}>
												{employee.full_name} ({employee.employee?.employee_code})
											</option>
										))}
									</select>
									{formik.touched.employee_id && formik.errors.employee_id && (
										<div className='fv-plugins-message-container mt-2'>
											<div className='fv-help-block text-danger fs-7 fw-semibold'>
												{formik.errors.employee_id}
											</div>
										</div>
									)}
								</div>

								<div className='fv-row mb-5'>
									<label htmlFor='memo-date' className='form-label required fw-bold fs-7'>Leave Date</label>
									<input
										id='memo-date'
										type='date'
										className='form-control'
										style={{
											height: '38px',
											borderRadius: '8px',
											border: '1px solid #E4EAF2',
											fontSize: '13px',
										}}
										value={selectedDate}
										onChange={handleDateChange}
									/>
								</div>

								<div className='fv-row mb-6'>
									<label htmlFor='memo-subject' className='form-label required fw-bold fs-7'>Subject</label>
									<input
										id='memo-subject'
										type='text'
										className='form-control'
										style={{
											height: '38px',
											borderRadius: '8px',
											border: '1px solid #E4EAF2',
											fontSize: '13px',
										}}
										value={subject}
										onChange={(e) => setSubject(e.target.value)}
										placeholder={STATIC_SUBJECT}
									/>
									<span className='text-muted fs-7 fw-semibold mt-2 d-block'>
										Defaults to “{STATIC_SUBJECT}” if left blank.
									</span>
								</div>

								<button
									type='submit'
									className='btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3'
									style={{ borderRadius: '10px', minHeight: '42px' }}
									disabled={submitting || loading || !formik.values.employee_id}>
									{submitting ? (
										<span className='spinner-border spinner-border-sm align-middle'></span>
									) : (
										<>
											<FontAwesomeIcon icon={faPaperPlane} className='fs-7' />
											<span className='fw-bold'>Submit Memo & Download PDF</span>
										</>
									)}
								</button>
							</form>
						</div>
					</div>
				</div>

				<div className='col-md-7 col-lg-8'>
					{(showPDFPreview || selectedEmployee) ? (
						<div
							className='card shadow-sm border-0 mb-6'
							style={{
								borderRadius: '16px',
								background: '#ffffff',
								border: '1px solid #E4EAF2',
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
							}}>
							<div className='card-body p-6'>
								<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-2'>
									<div className='d-flex align-items-center'>
										<div
											className='d-flex align-items-center justify-content-center me-3'
											style={{
												width: '40px',
												height: '40px',
												borderRadius: '10px',
												background: '#FEF4E6',
												color: '#A46A13',
											}}>
											<i className='bi bi-eye fs-4'></i>
										</div>
										<div>
											<h4 className='fw-bold text-gray-900 m-0 fs-5'>Live Preview</h4>
											<span className='text-muted fs-7 fw-semibold'>
												Exactly how the PDF will look
											</span>
										</div>
									</div>
									<span className='badge badge-light-primary fw-bold fs-8 px-3 py-2'>
										A4 • PDF Ready
									</span>
								</div>
								<div
									className='p-4 p-md-6'
									style={{ background: '#F8FAFD', borderRadius: '12px', border: '1px solid #EEF2F6' }}>
									<div id='memoContent' className='p-4' style={{
										border: '1px solid #000',
										fontFamily: 'Arial, sans-serif',
										maxWidth: '210mm',  // A4 width
										margin: '0 auto',
										backgroundColor: '#fff',
										color: '#000',
										lineHeight: '1.4',
										fontSize: '11pt'
									}}>
										<div className='text-center mb-5'>
											<h3 className='fw-bold' style={{ fontSize: '14pt' }}>Notice Regarding {subject || STATIC_SUBJECT}</h3>
										</div>
									
									{/* <div className='mb-3'>
										<div className='row'>
											<div className='col-6'>
												<p className='mb-1'><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
											</div>
										</div>
										
										{selectedEmployee && (
											<>
												<div className='row'>
													<div className='col-6'>
														<p className='mb-1'><strong>To:</strong> {selectedEmployee.full_name}</p>
													</div>
												</div>
												<div className='row'>
													<div className='col-6'>
														<p className='mb-1'><strong>Employee ID:</strong> {selectedEmployee.employee?.employee_code || ''}</p>
													</div>
												</div>
												<div className='row'>
													<div className='col-12'>
														<p className='mb-1'><strong>Department/Designation:</strong> {selectedEmployee.employee?.position || ''}</p>
													</div>
												</div>
											</>
										)}
										
										<div className='row'>
											<div className='col-12'>
												<p className='mb-1 mt-4'><strong>Subject:</strong> {STATIC_SUBJECT}</p>
											</div>
										</div>
									</div> */}
									
									<div className='mt-4'>
										<p>Dear<strong> {selectedEmployee ? selectedEmployee.full_name : 'Employee'},</strong></p>
										
										<p className='mt-3'>
											This is to formally notify you regarding your <strong>{subject || STATIC_SUBJECT}{' '}
											taken on {formatDate(selectedDate)}</strong>, during which no prior approval or timely communication was provided to 
											either your Reporting Manager or the HR Department.
										</p>
										
										<p className='mt-3'>
											Your absence without authorization has caused disruption to workflow and has adversely 
											impacted team operations. As per company policy, all employees are required to obtain 
											prior approval for any leave of absence except in cases of genuine emergency, in which 
											immediate intimation is mandatory.
										</p>
										
										<p className='mt-3'>
											You are hereby instructed to submit a written explanation for your unauthorized absence 
											within <strong>24/48 hours</strong> of receiving this notice. Failure to provide a satisfactory explanation 
											may result in disciplinary action as per company rules, which may include:
										</p>
										
										<ul className='mt-3' style={{ paddingLeft: '20px' }}>
											<li style={{ marginBottom: '8px' }}>
												Deduction of salary for the unauthorized period of absence,
											</li>
											<li style={{ marginBottom: '8px' }}>
												Issuance of a warning or show-cause notice,
											</li>
											<li style={{ marginBottom: '8px' }}>
												Recording of misconduct in your employee file, and
											</li>
											<li style={{ marginBottom: '8px' }}>
												Any further action as deemed appropriate under company policy.
											</li>
										</ul>
										
										<p className='mt-3'>
											You are advised to ensure strict adherence to the leave policy henceforth to avoid further 
											consequences.
										</p>
										
										<div className='mt-5'>
											<p className='mb-0'><strong>Sincerely,</strong></p>
											<br />
											<p className='mb-0'>Yash Sutariya</p>
											<p className='mb-0'>HR Manager</p>
											<p className='mb-0'>FG Group</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					) : (
						<div
							className='card shadow-sm border-0 mb-6'
							style={{
								borderRadius: '16px',
								background: '#ffffff',
								border: '1px solid #E4EAF2',
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
							}}>
							<div
								className='card-body p-10 d-flex flex-column align-items-center justify-content-center text-center'
								style={{ minHeight: '420px' }}>
								<div
									className='d-flex align-items-center justify-content-center mb-5'
									style={{
										width: '64px',
										height: '64px',
										borderRadius: '16px',
										background: '#F8FAFD',
										border: '1px dashed #CBD5E1',
									}}>
									<i className='bi bi-file-earmark-text fs-2x text-gray-400'></i>
								</div>
								<h4 className='fw-bold text-gray-800 mb-2'>Select an employee</h4>
								<p className='text-muted fs-7 fw-semibold mb-0' style={{ maxWidth: '320px' }}>
									Choose an employee and leave date to generate a live memo preview here.
								</p>
							</div>
						</div>
					)}
				</div>

			</div>
		</>
	)
}

export default CreateMemo