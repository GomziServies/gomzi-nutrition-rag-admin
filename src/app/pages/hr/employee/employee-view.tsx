/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { GetEmployees, UpdateEmployee } from '../../../Functions/FGGroup/Employee'

const POSITION_OPTIONS = [
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
]

const HRMemberDetail = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const employee_id: any = searchParams.get('employee_id')
	const [activeTab, setActiveTab] = useState<
		'profile' | 'banking' | 'shift' | 'family' | 'documents'
	>('profile')
	const [loading, setLoading] = useState(false)
	const [documentLoading, setDocumentLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [memberData, setMemberData] = useState<any>([])
	const [memberDetailData, setMemberDetailData] = useState<any>({
		admin_id: '',
		employee_code: '',
		name: '',
		photo: '',
		position: '',
		mobile: '',
		bank_name: '',
		account_details: '',
		IFSC: '',
		email: '',
		salary: '',
		account_detail: '',
		blood_group: '',
		address: '',
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

			if (!member.mobile) {
				toast.error(`Family Details Contact number is required`)
				return false
			}
		}

		return true
	}

	const [memberDetailAddData, setMemberDetailAddData] = useState({
		document_type: '',
		upload_photo: '',
		file_url: '',
		editImage: false,
		selectedFile: null as File | null,
		joining_date: '',
		expiry_date: '',
	})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [joiningTime, setJoiningTime] = useState<any>(null)

	const fetchEmployeeData = async () => {
		setLoading(true)
		try {
			const response: any = await GetEmployees({ id: employee_id })
			const filteredData: any = response.data[0]

			const joiningDate = filteredData?.employee?.joining_date

			let joiningDuration = ''
			if (joiningDate) {
				const start = DayJS(joiningDate)
				const now = DayJS()
				const years = now.diff(start, 'year')
				const months = now.diff(start, 'month') % 12
				const days = now.diff(start, 'day') % 30

				if (years > 0) joiningDuration += `${years} Years`
				if (months > 0) joiningDuration += `${joiningDuration ? ', ' : ''}${months} Months`
				if (years === 0 && months === 0) joiningDuration = `${days} Days`
			}

			setMemberDetailData({
				admin_id: filteredData?._id,
				employee_code: filteredData?.employee?.employee_code,
				name: filteredData?.full_name,
				photo: filteredData?.employee?.photo,
				position: filteredData?.employee?.position,
				mobile: filteredData?.mobile,
				bank_name: filteredData?.employee?.account_details?.bank_name,
				account_details: filteredData?.employee?.account_details?.account_number,
				IFSC: filteredData?.employee.account_details.IFSC,
				email: filteredData?.email,
				salary: filteredData?.employee?.salary,
				blood_group: filteredData?.employee?.blood_group,
				address: filteredData?.employee?.address,
				document: filteredData?.employee?.document,
				proof: filteredData?.employee?.proof,
				in_time: filteredData?.employee?.in_time,
				out_time: filteredData?.employee?.out_time,
				joining_date: joiningDate,
				branch_name: filteredData?.employee?.branch_name,
			})

			if (
				Array.isArray(filteredData?.employee?.family_details) &&
				filteredData.employee.family_details.length > 0
			) {
				setFamilyDetails(filteredData.employee.family_details)
			} else {
				// Set default empty row
				setFamilyDetails([{ name: '', mobile: '' }])
			}

			setJoiningTime(joiningDuration)
			setMemberData(filteredData?.employee?.document)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchEmployeeData()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		setMemberDetailData((prevData: any) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target
		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setMemberDetailAddData((prevData) => ({
				...prevData,
				selectedFile: file,
				file_url: URL.createObjectURL(file),
				editImage: true,
			}))
		}

		setMemberDetailAddData((prevData) => ({
			...prevData,
			[name]: value,
		}))
	}

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, files } = event.target as HTMLInputElement
		if (files && files[0]) {
			setMemberDetailData((prevData: any) => ({
				...prevData,
				[name]: files[0],
			}))
		}
	}

	const sortableFields = [
		{ title: 'Document Type', field: 'document_type' },
		{ title: 'Joining Date', field: 'joining_date' },
		{ title: 'Expiry Date', field: 'expiry_date' },
		{ title: 'Preview', field: 'link' },
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

	const handleUpdateDocument = async (data: any) => {
		if (!validateFamilyDetails()) {
			return
		}
		setDocumentLoading(true)

		try {
			let imgUrl = ''

			if (data === 'Document') {
				if (!memberDetailAddData.document_type) {
					toast.error('Please select a document type')
					setDocumentLoading(false)
					return
				}
				if (!memberDetailAddData.selectedFile) {
					toast.error('Please select a file to upload')
					setDocumentLoading(false)
					return
				}

				if (memberDetailAddData.selectedFile) {
					const imageUrl: any = await FileUploadToFGGroup([memberDetailAddData.selectedFile], {
						directory: 'books',
					})
					imgUrl = imageUrl.data?.fileURLs[0]
					toast.success('Document uploaded successfully')
				}
			}

			const {
				admin_id,
				employee_code,
				name,
				position,
				salary,
				mobile,
				bank_name,
				account_details,
				IFSC,
				blood_group,
				email,
				address,
				in_time,
				out_time,
				joining_date,
				branch_name,
			} = memberDetailData

			const payload: any = {
				admin_id,
				type: 'Employee',
				employee_code,
				name,
				position,
				salary,
				blood_group,
				family_details,
				mobile,
				account_details: {
					bank_name,
					account_number: account_details,
					IFSC,
				},
				email,
				address,
				in_time,
				out_time,
				joining_date,
				...(position === 'Sales Person' ? { branch_name } : {}),
				document: (data === 'Document'
					? [
							...memberData,
							{
								document_type: memberDetailAddData.document_type || 'Joining Letter ',
								link: imgUrl,
								joining_date: memberDetailAddData.joining_date,
								expiry_date: memberDetailAddData.expiry_date,
							},
					  ]
					: memberData
				).filter((doc: any) => doc.document_type && doc.link),
			}

			await UpdateEmployee(payload)

			if (data === 'Document') {
				toast.success('Document Updated Successfully')
			} else {
				toast.success('Employee Data Updated Successfully')
			}

			// Clear form data after successful update
			setMemberDetailAddData({
				document_type: '',
				upload_photo: '',
				file_url: '',
				editImage: false,
				selectedFile: null,
				joining_date: '',
				expiry_date: '',
			})

			fetchEmployeeData()
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
		setDocumentLoading(false)
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Employee Profile</PageTitle>

			{/* Top Bar with Back Navigation & Quick Actions */}
			<div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-5'>
				<Link
					to='/hr/employee-detail'
					className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2'
					style={{ borderRadius: '10px', height: '38px', padding: '0 14px' }}>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-bold'>Back to Directory</span>
				</Link>

				<div className='d-flex align-items-center flex-wrap gap-2'>
					{memberDetailData?.employee_code && (
						<span
							className='badge badge-light-secondary text-dark fw-bold px-3 py-2 fs-7'
							style={{ letterSpacing: '0.5px' }}>
							<i className='bi bi-person-badge text-muted me-1.5'></i>
							{memberDetailData.employee_code}
						</span>
					)}
					{memberDetailData?.position && (
						<span className='badge badge-light-primary fw-bold px-3 py-2 fs-7'>
							{memberDetailData.position}
						</span>
					)}
					{joiningTime && (
						<span className='badge badge-light-success fw-bold px-3 py-2 fs-7'>
							<i className='bi bi-clock-history me-1'></i>
							{joiningTime}
						</span>
					)}
					<button
						type='button'
						onClick={() => handleUpdateDocument('Employee')}
						disabled={documentLoading}
						className='btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-4 ms-2'
						style={{ borderRadius: '10px', height: '38px' }}>
						<i className='bi bi-check2-circle fs-5'></i>
						<span className='fw-bold'>Save Changes</span>
					</button>
				</div>
			</div>

			{/* Hero Profile Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #ded8d2',
					background: '#ffffff',
				}}>
				<div className='card-body p-6'>
					<div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
						{/* Left: Avatar & Info */}
						<div className='d-flex align-items-center gap-4'>
							<div
								style={{
									width: '80px',
									height: '80px',
									minWidth: '80px',
									minHeight: '80px',
									borderRadius: '16px',
									overflow: 'hidden',
									border: '2px solid #e2e8f0',
									boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
									background: '#f8fafc',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								{memberDetailData?.photo ? (
									<img
										src={'https://files.fggroup.in/' + memberDetailData.photo}
										alt={memberDetailData.name || 'Employee Photo'}
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											display: 'block',
										}}
									/>
								) : (
									<span className='fs-1 fw-bolder text-primary'>
										{memberDetailData?.name ? memberDetailData.name.charAt(0).toUpperCase() : 'E'}
									</span>
								)}
							</div>

							<div>
								<div className='d-flex align-items-center gap-2 mb-1'>
									<h2 className='fw-bold text-gray-900 fs-2 m-0'>
										{memberDetailData?.name || 'Unnamed Employee'}
									</h2>
									{memberDetailData?.branch_name && (
										<span className='badge badge-light-info fw-semibold fs-8 px-2.5 py-1'>
											{memberDetailData.branch_name}
										</span>
									)}
								</div>
								<div className='text-muted fs-7 fw-semibold mb-2'>
									{memberDetailData?.position || 'Team Member'}
									{memberDetailData?.employee_code ? ` • ${memberDetailData.employee_code}` : ''}
								</div>

								{/* Quick Contact Chips */}
								<div className='d-flex flex-wrap align-items-center gap-2'>
									{memberDetailData?.email && (
										<a
											href={`mailto:${memberDetailData.email}`}
											className='badge badge-light text-muted fw-semibold fs-8 px-2.5 py-1.5 text-decoration-none'
											title='Send email'>
											<i className='bi bi-envelope text-primary me-1'></i>
											{memberDetailData.email}
										</a>
									)}
									{memberDetailData?.mobile && (
										<a
											href={`tel:${memberDetailData.mobile}`}
											className='badge badge-light text-muted fw-semibold fs-8 px-2.5 py-1.5 text-decoration-none'
											title='Call'>
											<i className='bi bi-telephone text-success me-1'></i>
											{memberDetailData.mobile}
										</a>
									)}
									{memberDetailData?.blood_group && (
										<span className='badge badge-light-danger fw-semibold fs-8 px-2.5 py-1.5'>
											<i className='bi bi-droplet-fill me-1'></i>
											{memberDetailData.blood_group}
										</span>
									)}
									{(memberDetailData?.in_time || memberDetailData?.out_time) && (
										<span className='badge badge-light-warning fw-semibold fs-8 px-2.5 py-1.5'>
											<i className='bi bi-clock me-1'></i>
											{memberDetailData.in_time || '09:30'} - {memberDetailData.out_time || '18:30'}
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Right: Quick Overview Pills */}
						<div className='d-flex align-items-center flex-wrap gap-3'>
							<div
								className='p-3 rounded-3 text-center'
								style={{
									background: '#f8fafc',
									border: '1px solid #e2e8f0',
									minWidth: '120px',
								}}>
								<span className='text-muted fs-8 fw-bold text-uppercase d-block mb-1'>Salary</span>
								<span className='fs-5 fw-bolder text-gray-900'>
									{memberDetailData?.salary
										? `₹${Number(memberDetailData.salary).toLocaleString()}`
										: '₹0'}
								</span>
							</div>

							<div
								className='p-3 rounded-3 text-center'
								style={{
									background: '#f8fafc',
									border: '1px solid #e2e8f0',
									minWidth: '120px',
								}}>
								<span className='text-muted fs-8 fw-bold text-uppercase d-block mb-1'>Tenure</span>
								<span className='fs-6 fw-bold text-gray-800'>
									{joiningTime || '-'}
								</span>
							</div>

							<div
								className='p-3 rounded-3 text-center'
								style={{
									background: '#f8fafc',
									border: '1px solid #e2e8f0',
									minWidth: '120px',
								}}>
								<span className='text-muted fs-8 fw-bold text-uppercase d-block mb-1'>Documents</span>
								<span className='fs-5 fw-bolder text-primary'>
									{memberData?.length || 0} Files
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Navigation Tabs Bar */}
				<div
					className='px-6 border-top border-gray-200'
					style={{ background: '#fafaf9', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
					<div className='d-flex flex-wrap align-items-center gap-2 py-2'>
						{[
							{ id: 'profile', label: 'Personal & Job', icon: 'bi-person-circle' },
							{ id: 'banking', label: 'Payroll & Banking', icon: 'bi-bank' },
							{ id: 'shift', label: 'Shift & Schedule', icon: 'bi-clock-history' },
							{
								id: 'family',
								label: `Family & Emergency (${family_details.filter((f) => f.name).length})`,
								icon: 'bi-people',
							},
							{
								id: 'documents',
								label: `Documents & Records (${memberData?.length || 0})`,
								icon: 'bi-folder2-open',
							},
						].map((tab) => {
							const isActive = activeTab === tab.id
							return (
								<button
									key={tab.id}
									type='button'
									onClick={() => setActiveTab(tab.id as any)}
									className='btn btn-sm d-inline-flex align-items-center gap-2'
									style={{
										height: '38px',
										padding: '0 14px',
										borderRadius: '9px',
										fontSize: '13px',
										fontWeight: isActive ? 700 : 500,
										color: isActive ? '#2563eb' : '#475569',
										backgroundColor: isActive ? '#eff6ff' : 'transparent',
										border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
										transition: 'all 0.15s ease',
									}}>
									<i
										className={`bi ${tab.icon}`}
										style={{
											fontSize: '14px',
											color: isActive ? '#2563eb' : '#94a3b8',
										}}></i>
									<span>{tab.label}</span>
								</button>
							)
						})}
					</div>
				</div>
			</div>

			{/* TAB 1: PERSONAL & JOB PROFILE */}
			{activeTab === 'profile' && (
				<div className='row g-6'>
					{/* Left: Photos & Proofs */}
					<div className='col-lg-4 col-md-5'>
						<div
							className='card shadow-sm border-0 mb-6'
							style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
							<div className='card-header border-0 pt-5 pb-2 px-6'>
								<h3 className='card-title fw-bold text-gray-900 fs-5 m-0'>Profile Photo</h3>
							</div>
							<div className='card-body px-6 pb-6 pt-2 text-center'>
								<div
									className='p-3 rounded-3 bg-light-subtle d-flex align-items-center justify-content-center'
									style={{ border: '1px dashed #cbd5e1', minHeight: '220px' }}>
									{memberDetailData?.photo ? (
										<img
											src={'https://files.fggroup.in/' + memberDetailData.photo}
											className='w-100 object-fit-cover shadow-sm'
											style={{ borderRadius: '12px', maxHeight: '220px' }}
											alt='Profile preview'
										/>
									) : (
										<div className='text-center py-6'>
											<i className='bi bi-person text-muted fs-3x d-block mb-2'></i>
											<span className='text-muted fs-7'>No profile photo uploaded</span>
										</div>
									)}
								</div>
								<span className='text-muted fs-8 d-block mt-3'>
									Employee headshot shown in directory & badges
								</span>
							</div>
						</div>

						<div
							className='card shadow-sm border-0'
							style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
							<div className='card-header border-0 pt-5 pb-2 px-6'>
								<h3 className='card-title fw-bold text-gray-900 fs-5 m-0'>Identity Proof</h3>
							</div>
							<div className='card-body px-6 pb-6 pt-2 text-center'>
								<div
									className='p-3 rounded-3 bg-light-subtle d-flex align-items-center justify-content-center'
									style={{ border: '1px dashed #cbd5e1', minHeight: '180px' }}>
									{memberDetailData?.proof ? (
										<img
											src={'https://files.fggroup.in/' + memberDetailData.proof}
											className='w-100 object-fit-cover shadow-sm'
											style={{ borderRadius: '12px', maxHeight: '180px' }}
											alt='Proof preview'
										/>
									) : (
										<div className='text-center py-6'>
											<i className='bi bi-file-earmark-check text-muted fs-3x d-block mb-2'></i>
											<span className='text-muted fs-7'>No identity proof uploaded</span>
										</div>
									)}
								</div>
								<span className='text-muted fs-8 d-block mt-3'>
									Official government ID / Aadhaar verification
								</span>
							</div>
						</div>
					</div>

					{/* Right: Personal & Designation Form */}
					<div className='col-lg-8 col-md-7'>
						<div
							className='card shadow-sm border-0'
							style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
							<div className='card-header border-0 pt-6 pb-3 px-6 d-flex align-items-center justify-content-between'>
								<div>
									<h3 className='card-title fw-bold text-gray-900 fs-4 m-0'>
										Personal & Designation Details
									</h3>
									<span className='text-muted fs-7'>
										Basic identity, designation, and primary contact information
									</span>
								</div>
							</div>

							<div className='card-body px-6 py-4'>
								<div className='row'>
									<div className='col-md-4'>
										<InputField
											className='col-12 fv-row'
											placeholder='Employee Code'
											type='text'
											name='employee_code'
											label='Employee Code'
											htmlFor='employee_code'
											value={memberDetailData.employee_code}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-md-4'>
										<InputField
											className='col-12 fv-row'
											placeholder='Full Name'
											type='text'
											name='name'
											label='Full Name'
											htmlFor='name'
											value={memberDetailData.name}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-md-4'>
										<SelectField
											className='col-12 fv-row'
											name='position'
											label='Position / Role'
											htmlFor='position'
											value={memberDetailData?.position}
											onChange={handleInputChange}
											options={POSITION_OPTIONS}
										/>
									</div>

									{memberDetailData.position === 'Sales Person' && (
										<div className='col-md-4'>
											<SelectField
												className='col-12 fv-row'
												name='branch_name'
												label='Branch Name'
												htmlFor='branch_name'
												value={memberDetailData?.branch_name}
												onChange={handleInputChange}
												options={['FG Group', 'FWG', 'Gomzi Nutrition']}
											/>
										</div>
									)}

									<div className='col-md-4'>
										<InputField
											className='col-12 fv-row'
											placeholder='Mobile Number'
											type='text'
											name='mobile'
											label='Mobile Number'
											htmlFor='mobile'
											value={memberDetailData.mobile}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-md-4'>
										<InputField
											className='col-12 fv-row'
											placeholder='Email Address'
											type='email'
											name='email'
											label='Email Address'
											htmlFor='email'
											value={memberDetailData.email}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-md-4'>
										<SelectField
											className='col-12 fv-row'
											name='blood_group'
											label='Blood Group'
											htmlFor='bloodGroup'
											value={memberDetailData?.blood_group}
											onChange={handleInputChange}
											options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
										/>
									</div>

									<div className='col-md-6'>
										<InputField
											className='col-12 fv-row'
											placeholder='Joining Date'
											type='date'
											name='joining_date'
											label={`Joining Date (${joiningTime || 'N/A'})`}
											htmlFor='joining_date'
											value={memberDetailData?.joining_date}
											onChange={handleInputChange}
										/>
									</div>
									<div className='col-md-6'>
										<InputField
											className='col-12 fv-row'
											placeholder='Full Residential Address'
											type='text'
											name='address'
											label='Residential Address'
											htmlFor='address'
											value={memberDetailData.address}
											onChange={handleInputChange}
										/>
									</div>
								</div>
							</div>

							<div className='card-footer border-0 d-flex justify-content-end px-6 py-4 bg-light-subtle rounded-bottom-4'>
								<button
									type='button'
									onClick={() => handleUpdateDocument('Employee')}
									disabled={documentLoading}
									className='btn btn-primary px-6 d-flex align-items-center gap-2'
									style={{ borderRadius: '10px', height: '40px' }}>
									<i className='bi bi-check2-circle fs-5'></i>
									<span className='fw-bold'>Save Personal Info</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* TAB 2: PAYROLL & BANKING */}
			{activeTab === 'banking' && (
				<div
					className='card shadow-sm border-0'
					style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
					<div className='card-header border-0 pt-6 pb-3 px-6'>
						<div>
							<h3 className='card-title fw-bold text-gray-900 fs-4 m-0'>
								Payroll & Banking Credentials
							</h3>
							<span className='text-muted fs-7'>
								Direct deposit accounts, IFSC routing code, and monthly compensation
							</span>
						</div>
					</div>

					<div className='card-body px-6 py-4'>
						<div className='p-4 rounded-3 mb-6 bg-light-primary border border-primary-subtle d-flex align-items-center gap-3'>
							<i className='bi bi-info-circle-fill text-primary fs-3 flex-shrink-0'></i>
							<span className='text-gray-800 fs-7'>
								Click the clipboard icon next to Bank Name, Account Number, or IFSC Code to quickly copy credentials during payroll processing.
							</span>
						</div>

						<div className='row'>
							<div className='col-md-6 mb-4'>
								<InputField
									className='col-12 fv-row'
									placeholder='Monthly Salary (₹)'
									type='text'
									name='salary'
									label='Monthly Salary (₹)'
									htmlFor='salary'
									value={memberDetailData.salary}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6 mb-4'>
								<CopyableInput
									placeholder='Bank Name (e.g. HDFC, SBI)'
									type='text'
									className='col-12 fv-row'
									name='bank_name'
									label='Bank Name'
									htmlFor='bank_name'
									value={memberDetailData.bank_name}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6 mb-4'>
								<CopyableInput
									placeholder='Bank Account Number'
									type='text'
									className='col-12 fv-row'
									name='account_details'
									label='Account Number'
									htmlFor='account_details'
									value={memberDetailData.account_details}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-6 mb-4'>
								<CopyableInput
									placeholder='IFSC Code (e.g. HDFC0001234)'
									type='text'
									className='col-12 fv-row'
									name='IFSC'
									label='IFSC Code'
									htmlFor='IFSC'
									value={memberDetailData.IFSC}
									onChange={handleInputChange}
								/>
							</div>
						</div>
					</div>

					<div className='card-footer border-0 d-flex justify-content-end px-6 py-4 bg-light-subtle rounded-bottom-4'>
						<button
							type='button'
							onClick={() => handleUpdateDocument('Employee')}
							disabled={documentLoading}
							className='btn btn-primary px-6 d-flex align-items-center gap-2'
							style={{ borderRadius: '10px', height: '40px' }}>
							<i className='bi bi-check2-circle fs-5'></i>
							<span className='fw-bold'>Save Banking Info</span>
						</button>
					</div>
				</div>
			)}

			{/* TAB 3: SHIFT & SCHEDULE */}
			{activeTab === 'shift' && (
				<div
					className='card shadow-sm border-0'
					style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
					<div className='card-header border-0 pt-6 pb-3 px-6'>
						<div>
							<h3 className='card-title fw-bold text-gray-900 fs-4 m-0'>
								Shift Timing & Work Schedule
							</h3>
							<span className='text-muted fs-7'>
								Daily reporting schedule for biometric attendance and hours logging
							</span>
						</div>
					</div>

					<div className='card-body px-6 py-4'>
						<div className='row g-6 align-items-center'>
							<div className='col-md-4'>
								<InputField
									placeholder='In-Time'
									type='time'
									className='col-12 fv-row'
									name='in_time'
									label='Standard In-Time'
									htmlFor='in_time'
									value={memberDetailData.in_time}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-4'>
								<InputField
									placeholder='Out-Time'
									type='time'
									className='col-12 fv-row'
									name='out_time'
									label='Standard Out-Time'
									htmlFor='out_time'
									value={memberDetailData.out_time}
									onChange={handleInputChange}
								/>
							</div>
							<div className='col-md-4'>
								<div
									className='p-4 rounded-3 text-center'
									style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
									<span className='text-muted fs-8 fw-bold text-uppercase d-block mb-1'>Configured Shift</span>
									<span className='fs-5 fw-bold text-primary'>
										{memberDetailData.in_time || '09:30'} — {memberDetailData.out_time || '18:30'}
									</span>
									<span className='text-muted fs-8 d-block mt-1'>Standard Day Shift</span>
								</div>
							</div>
						</div>
					</div>

					<div className='card-footer border-0 d-flex justify-content-end px-6 py-4 bg-light-subtle rounded-bottom-4'>
						<button
							type='button'
							onClick={() => handleUpdateDocument('Employee')}
							disabled={documentLoading}
							className='btn btn-primary px-6 d-flex align-items-center gap-2'
							style={{ borderRadius: '10px', height: '40px' }}>
							<i className='bi bi-check2-circle fs-5'></i>
							<span className='fw-bold'>Save Shift Timing</span>
						</button>
					</div>
				</div>
			)}

			{/* TAB 4: FAMILY & EMERGENCY CONTACTS */}
			{activeTab === 'family' && (
				<div
					className='card shadow-sm border-0'
					style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
					<div className='card-header border-0 pt-6 pb-3 px-6 d-flex align-items-center justify-content-between'>
						<div>
							<h3 className='card-title fw-bold text-gray-900 fs-4 m-0'>
								Family Details & Emergency Contacts
							</h3>
							<span className='text-muted fs-7'>
								Primary emergency contacts and family relationships on record
							</span>
						</div>
						<button
							type='button'
							onClick={(e) => addPlan(e)}
							className='btn btn-sm btn-light-primary d-inline-flex align-items-center gap-2'
							style={{ borderRadius: '9px', height: '36px' }}>
							<i className='bi bi-plus-lg fs-6'></i>
							<span className='fw-semibold'>Add Family Member</span>
						</button>
					</div>

					<div className='card-body px-6 py-4'>
						<div className='d-flex flex-column gap-4'>
							{family_details.map((family, index) => (
								<div
									key={index}
									className='p-4 rounded-3 border border-gray-200'
									style={{ backgroundColor: '#fafaf9' }}>
									<div className='d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-gray-200'>
										<span className='fw-bold text-gray-800 fs-7 text-uppercase' style={{ letterSpacing: '0.5px' }}>
											Family Member #{index + 1}
										</span>
										{family_details.length > 1 && index !== 0 && (
											<button
												type='button'
												onClick={(e) => removePlan(index, e)}
												className='btn btn-sm btn-icon btn-light-danger'
												title='Remove family member'
												style={{ width: '30px', height: '30px', borderRadius: '8px' }}>
												<i className='bi bi-trash fs-6'></i>
											</button>
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

					<div className='card-footer border-0 d-flex justify-content-end px-6 py-4 bg-light-subtle rounded-bottom-4'>
						<button
							type='button'
							onClick={() => handleUpdateDocument('Employee')}
							disabled={documentLoading}
							className='btn btn-primary px-6 d-flex align-items-center gap-2'
							style={{ borderRadius: '10px', height: '40px' }}>
							<i className='bi bi-check2-circle fs-5'></i>
							<span className='fw-bold'>Save Family Contacts</span>
						</button>
					</div>
				</div>
			)}

			{/* TAB 5: DOCUMENTS & COMPLIANCE */}
			{activeTab === 'documents' && (
				<div className='d-flex flex-column gap-6'>
					{/* Card A: Upload New Document */}
					<div
						className='card shadow-sm border-0'
						style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
						<div className='card-header border-0 pt-6 pb-2 px-6'>
							<h3 className='card-title fw-bold text-gray-900 fs-4 m-0 d-flex align-items-center gap-2'>
								<i className='bi bi-file-earmark-arrow-up text-primary fs-3'></i>
								<span>Upload Employment Document</span>
							</h3>
						</div>
						<div className='card-body px-6 py-4'>
							<div className='row'>
								{(() => {
									const isDateVisible =
										memberDetailAddData.document_type === 'Joining Letter ' ||
										memberDetailAddData.document_type === 'HR Agreement '
									const colSize = isDateVisible ? 'col-lg-3' : 'col-lg-6'

									return (
										<>
											<div className={`${colSize} col-md-6 fv-row mb-4`}>
												<SelectField
													className='col-12'
													name='document_type'
													label='Document Type'
													htmlFor='document_type'
													value={memberDetailAddData.document_type}
													onChange={handleSelectChange}
													options={[
														'Joining Letter ',
														'Termination Letter ',
														'HR Agreement ',
														'Experience Letter ',
														'Google Pay QR Code',
													]}
												/>
											</div>
											<div className={`${colSize} col-md-6 fv-row mb-4`}>
												<InputField
													placeholder='Upload Document File'
													type='file'
													className='col-12'
													name='upload_photo'
													id='fileInput'
													label='Choose Document (Image or PDF)'
													htmlFor='upload_photo'
													onChange={(e) => handleSelectChange(e)}
												/>
											</div>
											{isDateVisible && (
												<>
													<div className='col-lg-3 col-md-6 fv-row mb-4'>
														<InputField
															className='col-12'
															placeholder='Joining Date'
															type='date'
															name='joining_date'
															label='Joining Date'
															htmlFor='joining_date'
															value={memberDetailAddData?.joining_date}
															onChange={handleSelectChange}
														/>
													</div>
													<div className='col-lg-3 col-md-6 fv-row mb-4'>
														<InputField
															className='col-12'
															placeholder='Expiry Date'
															type='date'
															name='expiry_date'
															label='Expiry Date'
															htmlFor='expiry_date'
															value={memberDetailAddData?.expiry_date}
															onChange={handleSelectChange}
														/>
													</div>
												</>
											)}
										</>
									)
								})()}
							</div>
						</div>
						<div className='card-footer border-0 d-flex justify-content-end px-6 py-4 bg-light-subtle rounded-bottom-4'>
							<button
								type='button'
								onClick={() => handleUpdateDocument('Document')}
								disabled={documentLoading}
								className='btn btn-primary px-6 d-flex align-items-center gap-2'
								style={{ borderRadius: '10px', height: '40px' }}>
								<i className='bi bi-cloud-arrow-up fs-5'></i>
								<span className='fw-bold'>Upload Document</span>
							</button>
						</div>
					</div>

					{/* Card B: Document Repository */}
					<div
						className='card shadow-sm border-0'
						style={{ borderRadius: '14px', border: '1px solid #ded8d2' }}>
						<div className='card-header border-0 pt-6 pb-2 px-6 d-flex align-items-center justify-content-between'>
							<div className='d-flex align-items-center gap-2'>
								<h3 className='card-title fw-bold text-gray-900 fs-4 m-0'>Stored Documents</h3>
								<span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
									{memberData?.length || 0} Files
								</span>
							</div>
						</div>

						<div className='card-body px-6 py-4'>
							<div className='table-responsive'>
								<Table
									data={memberData}
									columns={sortableFields}
									sort={sort}
									sortOrder={sortOrder}
									onSortChange={handleSortChange}
									removeAction={true}
									renderRow={(
										member: any,
										index: number,
										actualIndex: number,
										isVisible: boolean
									) => {
										const isPdf = member?.link?.endsWith('.pdf')
										const fileUrl = 'https://files.fggroup.in/' + member?.link
										return (
											<React.Fragment key={member._id || index}>
												<tr
													onClick={() => handleRowClick(member._id)}
													className='data-row'>
													<td className='text-center ps-4'>
														<span className='text-muted fw-bold fs-7'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='badge badge-light-primary fw-semibold fs-7 px-3 py-2'>
															{member.document_type}
														</span>
													</td>
													<td>
														<span className='text-gray-800 fw-semibold fs-7'>
															{member.joining_date
																? DayJS(member.joining_date).format('DD MMM YYYY')
																: '-'}
														</span>
													</td>
													<td>
														<span className='text-gray-800 fw-semibold fs-7'>
															{member.expiry_date
																? DayJS(member.expiry_date).format('DD MMM YYYY')
																: '-'}
														</span>
													</td>
													<td width={'35%'}>
														{isPdf ? (
															<div className='d-flex align-items-center gap-3'>
																<div className='d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-2 border border-gray-200'>
																	<i className='bi bi-file-earmark-pdf-fill text-danger fs-4'></i>
																	<span className='text-gray-800 fw-semibold fs-7'>PDF Document</span>
																</div>
																<button
																	type='button'
																	onClick={() => window.open(fileUrl)}
																	className='btn btn-sm btn-light-primary px-3 py-1.5'
																	style={{ borderRadius: '8px' }}>
																	<i className='bi bi-box-arrow-up-right me-1'></i> View PDF
																</button>
															</div>
														) : (
															<a
																href={fileUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='d-inline-block'>
																<img
																	src={fileUrl}
																	style={{
																		width: '52px',
																		height: '52px',
																		borderRadius: '10px',
																		objectFit: 'cover',
																		border: '1px solid #e2e8f0',
																	}}
																	alt='Document preview'
																/>
															</a>
														)}
													</td>
												</tr>
												{isVisible && (
													<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
														<td colSpan={12} className='bg-light-subtle p-3'>
															<div>
																<strong>{sortableFields[0].title}:</strong> {member.document_type}
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

							{memberData.length === 0 && !loading && (
								<div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
									<i className='bi bi-folder2-open text-muted fs-2x mb-2'></i>
									<span className='text-gray-700 fw-bold fs-6'>No documents uploaded yet</span>
									<span className='text-muted fs-7'>Uploaded agreements and certificates will appear here</span>
								</div>
							)}

							{memberData.length > 0 && (
								<div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
									<div className='text-muted fs-7 fw-semibold'>
										Showing {Math.min((pagination.page - 1) * pagination.itemsPerPage + 1, memberData.length)} to{' '}
										{Math.min(pagination.page * pagination.itemsPerPage, memberData.length)} of {memberData.length} documents
									</div>
									<UsersListPagination
										totalPages={Math.ceil(memberData.length / pagination.itemsPerPage)}
										currentPage={pagination.page}
										onPageChange={handlePageChange}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Document Loading Overlay */}
			{documentLoading && (
				<div className='loader-background'>
					<div
						className='spinner-border spinner-border-1 text-white'
						style={{ width: '50px', height: '50px' }}
						role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			)}
		</>
	)
}

export { HRMemberDetail }
