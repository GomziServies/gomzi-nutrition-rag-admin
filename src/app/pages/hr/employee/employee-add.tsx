/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateEmployee, GetNextEmployeeCode } from '../../../Functions/FGGroup/Employee'
import './employee-add.css'

const HREmployeeAdd = () => {
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [employee_code, setEmployee_code] = useState()
	const [employeeData, setEmployeeData] = useState({
		employee_code: '',
		name: '',
		position: '',
		salary: '',
		bank_name: '',
		account_details: '',
		IFSC: '',
		email: '',
		mobile: '',
		blood_group: '',
		address: '',
		photo: '',
		proof: '',
		document: '',
		password: '',
		editImage: false,
		selectedFile: '',
		in_time: '',
		out_time: '',
		joining_date: '',
		branch_name: '',
	})

	const [family_details, setFamilyDetails] = useState([
		{
			name: '',
			mobile: '',
		},
	])

	const handleFamilyChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target

		const updatedDetails = [...family_details]

		// Ensure 'name' is a valid key of FamilyMember
		if (name in updatedDetails[index]) {
			updatedDetails[index] = {
				...updatedDetails[index],
				[name]: value,
			}
			setFamilyDetails(updatedDetails)
		}
	}

	const addPlan = (event: any) => {
		event.preventDefault()
		setFamilyDetails([
			...family_details,
			{
				name: '',
				mobile: '',
			},
		])
	}

	const removePlan = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault()
		let copy = [...family_details]
		copy.splice(index, 1)
		setFamilyDetails(copy)
	}

	const validateFamilyDetails = (): boolean => {
		for (let i = 0; i < family_details.length; i++) {
			const member = family_details[i]

			if (!member.name.trim()) {
				toast.error(`Family Details is required`)
				return false
			}

			if (!member.mobile.trim()) {
				toast.error(`Family Details Contact number is required`)
				return false
			}

			if (!/^\d{10}$/.test(member.mobile.trim())) {
				toast.error(`Family Details ${i + 1}: Enter a valid 10-digit number`)
				return false
			}
		}

		return true
	}

	const fetchEmployeeData = async (page?: number) => {
		try {
			const response: any = await GetNextEmployeeCode()
			setEmployee_code(response.data.employee_code)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setEmployeeData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, files } = event.target as HTMLInputElement
		if (files && files[0]) {
			setEmployeeData((prevData) => ({
				...prevData,
				[name]: files[0],
			}))
		}
	}

	const handleAddButtonClick = async () => {
		if (!validateFamilyDetails()) {
			return
		}

		try {
			setIsSubmitting(true)
			let imgUrl = ''
			let proofUrl = ''
			let docUrl = ''

			if (employeeData.photo) {
				const imageUrl: any = await FileUploadToFGGroup([employeeData.photo], {
					directory: 'files',
				})
				imgUrl = imageUrl.data?.fileURLs[0]
				toast.success('Image uploaded successfully')
			}

			if (employeeData.document) {
				const proofDataUrl: any = await FileUploadToFGGroup([employeeData.proof], {
					directory: 'files',
				})
				proofUrl = proofDataUrl.data?.fileURLs[0]
				toast.success('Proof uploaded successfully')
			}

			if (employeeData.document) {
				const documentUrl: any = await FileUploadToFGGroup([employeeData.document], {
					directory: 'files',
				})
				docUrl = documentUrl.data?.fileURLs[0]
				toast.success('Document uploaded successfully')
			}

			const payload: any = {
				employee_code: employeeData?.employee_code ? employeeData?.employee_code : employee_code,
				name: employeeData.name,
				position: employeeData.position,
				salary: Number(employeeData.salary),
				// salary: employeeData.salary,
				account_details: {
					bank_name: employeeData.bank_name,
					account_number: employeeData.account_details,
					IFSC: employeeData.IFSC,
				},
				email: employeeData.email,
				mobile: employeeData.mobile,
				blood_group: employeeData.blood_group,
				family_details: family_details,
				address: employeeData.address,
				photo: imgUrl,
				proof: proofUrl,
				documents: docUrl,
				password: employeeData.password,
				in_time: employeeData.in_time,
				out_time: employeeData.out_time,
				joining_date: employeeData?.joining_date,
				branch_name:
					employeeData.position === 'Sales Person' ? employeeData.branch_name : undefined,
			}

			await CreateEmployee(payload)

			toast.success('Employee added successfully')
			setIsSubmitting(false)

			navigate('/hr/employee-detail')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Employee</PageTitle>

			{/* Top Bar with Back Navigation */}
			<div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-5'>
				<Link
					to='/hr/employee-detail'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-add-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Directory</span>
				</Link>

				<div className='d-flex align-items-center flex-wrap gap-2'>
					{(employeeData.employee_code || employee_code) && (
						<span
							className='badge badge-light-secondary fw-bold px-3 py-2 fs-7'
							style={{ letterSpacing: '0.5px', color: '#142447' }}>
							<i className='bi bi-person-badge text-muted me-1.5'></i>
							{employeeData.employee_code ? employeeData.employee_code : employee_code}
						</span>
					)}
					<span className='badge badge-light-success fw-bold px-3 py-2 fs-7'>
						New Joining
					</span>
				</div>
			</div>

			{/* Header Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
					boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
				}}>
				<div className='card-body p-6 d-flex flex-wrap align-items-center gap-4'>
					<div
						className='d-flex align-items-center justify-content-center flex-shrink-0'
						style={{
							width: '56px',
							height: '56px',
							borderRadius: '14px',
							background: '#EAF1FB',
							border: '1px solid #DCE8F8',
						}}>
						<i
							className='bi bi-person-plus-fill fs-3'
							style={{ color: '#172B4D' }}></i>
					</div>
					<div>
						<h2
							className='fw-bold fs-3 m-0'
							style={{ color: '#142447' }}>
							New Employee
						</h2>
						<span
							className='fs-7'
							style={{ color: '#71809A' }}>
							Create the directory profile, payroll credentials and shift schedule
						</span>
					</div>
				</div>
			</div>

			{/* Section 1: Personal & Job Details */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
					boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
				}}>
				<div className='card-header border-0 pt-6 pb-3 px-6'>
					<div>
						<h3 className='gz-add-panel-title'>Personal & Job Details</h3>
						<p className='gz-add-panel-sub'>
							Identity, designation and primary contact information
						</p>
					</div>
				</div>
				<div className='card-body px-6 py-4'>
					<div className='row'>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Employee Code'
												type='text'
												className='col-12 fv-row mb-7'
												name='employee_code'
												label='Employee Code'
												htmlFor='employee_code'
												value={
													employeeData.employee_code ? employeeData.employee_code : employee_code
												}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-3 fv-row mb-md-7'>
											<InputField
												placeholder='Joining Date'
												type='date'
												className='col-12 fv-row mb-7'
												name='joining_date'
												label='Joining Date'
												htmlFor='joining_date'
												value={employeeData.joining_date}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Name'
												type='text'
												className='col-12 fv-row mb-7'
												name='name'
												label='Name'
												htmlFor='name'
												value={employeeData.name}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<SelectField
												className='col-12 fv-row'
												name='position'
												label='Position'
												htmlFor='position'
												value={employeeData.position}
												onChange={handleInputChange}
												options={[
													'Web Developer',
													'Web Designer',
													'Digital marketing',
													'Franchise Owner',
													'Graphics Designer',
													'Sales Manager',
													'Sales Person',
													'Video Editor',
													'Back Office',
													'faculty',
													'Trainer',
													'Dietitian',
													'Worker',
													'Branch Manager',
													'Human Resources',
													'Team Leader',
													'Manager',
													'Admin',
													'Receptionist',
													'Director',
													'Social Media Assistant',
													'Fitness Counselor',
													'Production Manager',
													'SEO',
													'Junior Production Manager',
													'Content Creator',
													'R&D and Procurement Manager',
													'R&D and Procurement Jr. Manager',
												]}
											/>
										</div>
										{employeeData.position === 'Sales Person' && (
											<div className='col-md-3 fv-row mb-7'>
												<SelectField
													className='col-12 fv-row'
													name='branch_name'
													label='Branch Name'
													htmlFor='branch_name'
													value={employeeData.branch_name}
													onChange={handleInputChange}
													options={['FG Group', 'FWG', 'Gomzi Nutrition']}
												/>
											</div>
										)}
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Salary'
												type='text'
												className='col-12 fv-row mb-7'
												name='salary'
												label='Salary'
												htmlFor='salary'
												value={employeeData.salary}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Mobile No.'
												type='number'
												className='col-12 fv-row mb-7'
												name='mobile'
												label='Mobile No.'
												htmlFor='mobile'
												value={employeeData.mobile}
												onChange={handleInputChange}
											/>
										</div>
										<SelectField
											className='col-2 fv-row mb-7'
											name='blood_group'
											label='Blood Group'
											htmlFor='bloodGroup'
											value={employeeData.blood_group}
											onChange={handleInputChange}
											options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
										/>
										<div className='col-md-3 fv-row mb-7'>
											<InputField
												placeholder='Address'
												type='text'
												className='col-12 fv-row mb-7'
												name='address'
												label='Address'
												htmlFor='address'
												value={employeeData.address}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-3 fv-row'>
											<InputField
												placeholder='Email'
												type='text'
												className='col-12 fv-row'
												name='email'
												label='Email'
												htmlFor='email'
												value={employeeData.email}
												onChange={handleInputChange}
											/>
										</div>
										<div className='d-flex col-md-4 fv-row'>
											<InputField
												placeholder='Password'
												type={showPassword ? 'text' : 'password'}
												className='col-12 fv-row'
												name='password'
												label='Password'
												htmlFor='password'
												value={employeeData.password}
												onChange={handleInputChange}
											/>
										</div>
									</div>
								</div>
							</div>

						{/* Section 2: Family Details & Emergency Contacts */}
						<div
							className='card shadow-sm border-0 mb-6'
							style={{
								borderRadius: '14px',
								border: '1px solid #E4EAF2',
								background: '#ffffff',
								boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
							}}>
							<div className='card-header border-0 pt-6 pb-3 px-6 d-flex align-items-center justify-content-between flex-wrap gap-3'>
								<div>
									<h3 className='gz-add-panel-title'>Family Details & Emergency Contacts</h3>
									<p className='gz-add-panel-sub'>
										Primary emergency contacts and family relationships on record
									</p>
								</div>
								<button
									type='button'
									className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2 gz-add-light-action'
									style={{ borderRadius: '8px', height: '36px' }}
									onClick={(e) => addPlan(e)}>
									<i className='bi bi-plus-lg fs-6'></i>
									<span className='fw-semibold'>Add Family Member</span>
								</button>
							</div>
							<div className='card-body px-6 py-4'>
								<div className='d-flex flex-column gap-4'>
									{family_details.map((family, index) => (
										<div
											className='p-4 rounded-3 border'
											style={{ backgroundColor: '#F8FAFD', borderColor: '#E4EAF2' }}
											key={index}>
											<div
												className='d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom'
												style={{ borderColor: '#E4EAF2' }}>
												<span
													className='fw-bold fs-7 text-uppercase'
													style={{ letterSpacing: '0.5px', color: '#142447' }}>
													Family Member #{index + 1}
												</span>
												{family_details.length > 1 && index != 0 ? (
													<TableButton
														action='remove'
														backgroundDark={true}
														onClick={(e) => removePlan(index, e)}
													/>
												) : (
													''
												)}
											</div>
											<div className='row'>
												<div className='col-md-6 fv-row mb-2'>
													<InputField
														placeholder='Full Name (e.g. Spouse, Father)'
														type='text'
														className='col-12 fv-row'
														name='name'
														label='Relation / Name'
														htmlFor={`family-name-${index}`}
														value={family.name}
														onChange={(e: any) => handleFamilyChange(index, e)}
													/>
												</div>
												<div className='col-md-6 fv-row mb-2'>
													<InputField
														placeholder='Emergency Contact Number'
														type='number'
														className='col-12 fv-row'
														name='mobile'
														label='Contact Number'
														htmlFor={`family-mobile-${index}`}
														value={family.mobile}
														onChange={(e: any) => handleFamilyChange(index, e)}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Section 3: Payroll & Banking */}
						<div
							className='card shadow-sm border-0 mb-6'
							style={{
								borderRadius: '14px',
								border: '1px solid #E4EAF2',
								background: '#ffffff',
								boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
							}}>
							<div className='card-header border-0 pt-6 pb-3 px-6'>
								<div>
									<h3 className='gz-add-panel-title'>Payroll & Banking Credentials</h3>
									<p className='gz-add-panel-sub'>
										Direct deposit accounts, IFSC routing code and monthly compensation
									</p>
								</div>
							</div>
							<div className='card-body px-6 py-4'>
								<div
									className='p-4 rounded-3 mb-6 d-flex align-items-center gap-3'
									style={{ background: '#EAF1FB', border: '1px solid #DCE8F8' }}>
									<i
										className='bi bi-info-circle-fill fs-3 flex-shrink-0'
										style={{ color: '#172B4D' }}></i>
									<span
										className='fs-7'
										style={{ color: '#142447' }}>
										Double-check the account number and IFSC code — these are used for
										salary disbursal and cannot be auto-verified.
									</span>
								</div>
								<div className='row'>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Bank Name'
														type='text'
														className='col-12 fv-row mb-7'
														name='bank_name'
														label='Bank Name'
														htmlFor='bank_name'
														value={employeeData.bank_name}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Account No.'
														type='text'
														className='col-12 fv-row mb-7'
														name='account_details'
														label='Account No.'
														htmlFor='account_details'
														value={employeeData.account_details}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='IFSC Code'
														type='text'
														className='col-12 fv-row mb-7'
														name='IFSC'
														label='IFSC Code'
														htmlFor='IFSC'
														value={employeeData.IFSC}
														onChange={handleInputChange}
													/>
												</div>
											</div>
										</div>
									</div>

									{/* Section 4: Documents & Shift Schedule */}
									<div
										className='card shadow-sm border-0 mb-6'
										style={{
											borderRadius: '14px',
											border: '1px solid #E4EAF2',
											background: '#ffffff',
											boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
										}}>
										<div className='card-header border-0 pt-6 pb-3 px-6'>
											<div>
												<h3 className='gz-add-panel-title'>Documents & Shift Schedule</h3>
												<p className='gz-add-panel-sub'>
													Identity documents and daily reporting schedule for attendance
												</p>
											</div>
										</div>
										<div className='card-body px-6 py-4'>
											<div className='row'>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Upload Photo'
														type='file'
														className='col-12 fv-row mb-7'
														name='photo'
														label='Upload Photo'
														htmlFor='photo'
														onChange={handleFileChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Upload Proof'
														type='file'
														className='col-12 fv-row mb-7'
														name='proof'
														label='Upload Proof'
														htmlFor='proof'
														onChange={handleFileChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-7'>
													<InputField
														placeholder='Upload Pdf'
														type='file'
														className='col-12 fv-row mb-7'
														name='document'
														label='Upload Pdf'
														htmlFor='document'
														onChange={handleFileChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-md-7'>
													<InputField
														placeholder='In-Time'
														type='time'
														className='col-12 fv-row mb-7'
														name='in_time'
														label='Standard In-Time'
														htmlFor='in_time'
														value={employeeData.in_time}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4 fv-row mb-md-7'>
													<InputField
														placeholder='Out-Time'
														type='time'
														className='col-12 fv-row mb-7'
														name='out_time'
														label='Standard Out-Time'
														htmlFor='out_time'
														value={employeeData.out_time}
														onChange={handleInputChange}
													/>
												</div>
												<div className='col-md-4'>
													<div
														className='p-4 rounded-3 text-center h-100 d-flex flex-column justify-content-center'
														style={{ background: '#F5F7FB', border: '1px solid #E4EAF2' }}>
														<span
															className='fs-8 fw-bold text-uppercase d-block mb-1'
															style={{ color: '#71809A', letterSpacing: '0.05em' }}>
															Configured Shift
														</span>
														<span
															className='fs-5 fw-bold'
															style={{ color: '#172B4D' }}>
															{employeeData.in_time || '09:30'} — {employeeData.out_time || '18:30'}
														</span>
														<span
															className='fs-8 d-block mt-1'
															style={{ color: '#71809A' }}>
															Standard Day Shift
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* Submit Bar */}
									<div
										className='card shadow-sm border-0'
										style={{
											borderRadius: '14px',
											border: '1px solid #E4EAF2',
											background: '#ffffff',
											boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
										}}>
										<div className='card-body p-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
											<span
												className='fs-7'
												style={{ color: '#71809A' }}>
												Review personal, family and banking details before creating the profile.
											</span>
											<div className='d-flex align-items-center gap-2'>
												<Link
													to='/hr/employee-detail'
													className='btn btn-sm btn-light d-inline-flex align-items-center gap-2 px-5'
													style={{ borderRadius: '8px', height: '42px' }}>
													<span className='fw-semibold'>Cancel</span>
												</Link>
												<button
													type='button'
													className='btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-6'
													style={{ borderRadius: '8px', height: '42px' }}
													onClick={handleAddButtonClick}
													disabled={isSubmitting}>
													<i className='bi bi-check2-circle fs-5'></i>
													<span className='fw-bold'>
														{isSubmitting ? 'Submitting...' : 'Create Employee'}
													</span>
												</button>
											</div>
										</div>
									</div>
		</>
	)
}

export { HREmployeeAdd }
