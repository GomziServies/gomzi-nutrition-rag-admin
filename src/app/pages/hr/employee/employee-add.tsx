/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateEmployee, GetNextEmployeeCode } from '../../../Functions/FGGroup/Employee'

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
			<div className='row'>
				<div className='col-12 mt-3'>
					<div className='card py-10'>
						<div className='card-body'>
							<div className='row'>
								<div className='col-md-12'>
									<h2 className='mb-5'>Personal Details:</h2>
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
										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Family Details:</h2>
											<div className='row'>
												{family_details.map((family, index) => (
													<div
														className='row'
														key={index}>
														<div className='col-md-5 fv-row'>
															<InputField
																placeholder='Name'
																type='text'
																className='col-12 fv-row'
																name='name'
																label='Name'
																htmlFor='name'
																value={family.name}
																onChange={(e: any) => handleFamilyChange(index, e)}
															/>
														</div>
														<div className='col-md-5 fv-row'>
															<InputField
																placeholder='Contact Number'
																type='number'
																className='col-12 fv-row'
																name='mobile'
																label='Contact Number'
																htmlFor='number'
																value={family.mobile}
																onChange={(e: any) => handleFamilyChange(index, e)}
															/>
														</div>
														{family_details.length > 1 && index != 0 ? (
															<div className='col-2 d-flex  align-items-center'>
																<div className='d-flex mt-5 justify-content-center align-items-center'>
																	<TableButton
																		action='remove'
																		backgroundDark={true}
																		onClick={(e) => removePlan(index, e)}
																	/>
																</div>
															</div>
														) : (
															''
														)}
													</div>
												))}
											</div>
										</div>

										<div className='col-12 my-3 d-flex justify-content-end'>
											<button
												className='btn-primary btn gap-2 mx-2 btn-sm me-1'
												onClick={(e) => addPlan(e)}>
												<strong>
													<big>+</big>
												</strong>{' '}
												Add
											</button>
										</div>
										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Account Details:</h2>
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
										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Shift Time:</h2>
											<div className='row'>
												<div className='col-md-4 fv-row mb-md-7'>
													<InputField
														placeholder='In-Time'
														type='time'
														className='col-12 fv-row mb-7'
														name='in_time'
														label='In-Time'
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
														label='Out-Time'
														htmlFor='out_time'
														value={employeeData.out_time}
														onChange={handleInputChange}
													/>
												</div>
											</div>
										</div>

										<div className='col-md-12 fv-row mt-4 mb-2 d-flex justify-content-end'>
											<button
												type='button'
												className='btn btn-success mx-2 mb-4'
												onClick={handleAddButtonClick}
												disabled={isSubmitting}>
												{isSubmitting ? 'Submitting...' : 'Submit'}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export { HREmployeeAdd }
