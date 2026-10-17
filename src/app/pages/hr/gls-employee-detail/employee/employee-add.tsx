/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import SelectField from '../../../../components/SelectField'
import TableButton from '../../../../components/TableButton'
import {
	CreateGlsEmployee,
	FileUploadToFGGroup,
	GetNextGlsEmployeeCode,
} from '../../../../Functions/FGGroup'

// Add interfaces for location data
interface Country {
	id: number
	name: string
	iso2: string
}

interface State {
	id: number
	name: string
	country_id: number
	country_code: string
	state_code: string
}

interface City {
	id: number
	name: string
	state_id: number
	state_code: string
	country_id: number
	country_code: string
	latitude: string
	longitude: string
}

const EmployeeAdd = () => {
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [employee_code, setEmployee_code] = useState('')
	const [employeeData, setEmployeeData] = useState({
		employee_code: '',
		name: '',
		position: '',
		salary: '',
		bank_name: '',
		account_details: '',
		IFSC: '',
		mobile: '',
		blood_group: '',
		billing_country: '',
		billing_state: '',
		billing_city: '',
		billing_address_line_1: '',
		billing_pin_code: '',
		photo: '',
		proof: '',
		document: '',
		editImage: false,
		selectedFile: '',
		in_time: '',
		out_time: '',
		joining_date: '',
	})

	// Add state variables for location data
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [loadingStates, setLoadingStates] = useState(false)
	const [loadingCities, setLoadingCities] = useState(false)

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
			const response: any = await GetNextGlsEmployeeCode()
			setEmployee_code(response.data.employee_code)
		} catch (error) {
			console.error(error)
		}
	}

	// Add API functions for fetching location data
	const fetchCountries = async () => {
		setLoadingCountries(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries')
			const data = await response.json()
			if (data && data.data) {
				const countriesData = data.data.map((country: any) => ({
					id: country.iso2,
					name: country.country,
					iso2: country.iso2,
				}))
				setCountries(countriesData)
			}
		} catch (error) {
			console.error('Error fetching countries:', error)
			toast.error('Failed to load countries')
		} finally {
			setLoadingCountries(false)
		}
	}

	const fetchStates = async (countryCode: string) => {
		if (!countryCode) {
			setStates([])
			setCities([])
			return
		}

		setLoadingStates(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ country: countryCode }),
			})
			const data = await response.json()
			if (data && data.data && data.data.states) {
				const statesData = data.data.states.map((state: any, index: number) => ({
					id: index,
					name: state.name,
					country_id: 0,
					country_code: countryCode,
					state_code: state.state_code || '',
				}))
				setStates(statesData)
			}
		} catch (error) {
			console.error('Error fetching states:', error)
			toast.error('Failed to load states')
		} finally {
			setLoadingStates(false)
		}
	}

	const fetchCities = async (countryCode: string, stateName: string) => {
		if (!countryCode || !stateName) {
			setCities([])
			return
		}

		setLoadingCities(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					country: countryCode,
					state: stateName,
				}),
			})
			const data = await response.json()
			if (data && data.data) {
				const citiesData = data.data.map((city: string, index: number) => ({
					id: index,
					name: city,
					state_id: 0,
					state_code: '',
					country_id: 0,
					country_code: countryCode,
					latitude: '',
					longitude: '',
				}))
				setCities(citiesData)
			}
		} catch (error) {
			console.error('Error fetching cities:', error)
			toast.error('Failed to load cities')
		} finally {
			setLoadingCities(false)
		}
	}

	useEffect(() => {
		fetchEmployeeData()
		fetchCountries()
	}, [])

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		// Handle country change - fetch states when country changes
		if (name === 'billing_country') {
			setEmployeeData((prev) => ({
				...prev,
				[name]: value,
				billing_state: '',
				billing_city: '',
			}))
			fetchStates(value)
			setStates([])
			setCities([])
			return
		}

		// Handle state change - fetch cities when state changes
		if (name === 'billing_state') {
			const selectedState = states.find((state) => state.name === value)
			if (selectedState && employeeData.billing_country) {
				fetchCities(employeeData.billing_country, selectedState.name)
			}
			setEmployeeData((prev) => ({
				...prev,
				[name]: value,
				billing_city: '',
			}))
			setCities([])
			return
		}

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

			if (employeeData.proof) {
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
				mobile: employeeData.mobile,
				blood_group: employeeData.blood_group,
				family_details: family_details,
				address: `${employeeData.billing_address_line_1}, ${employeeData.billing_city}, ${employeeData.billing_state}, ${employeeData.billing_country} - ${employeeData.billing_pin_code}`,
				photo: imgUrl,
				proof: proofUrl,
				document: docUrl ? [{ document_type: 'Joining Letter', link: docUrl }] : [],
				in_time: employeeData.in_time,
				out_time: employeeData.out_time,
				joining_date: employeeData?.joining_date,
			}

			await CreateGlsEmployee(payload)

			toast.success('Employee added successfully')
			setIsSubmitting(false)

			navigate('/hr/gls-employees')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add GLS Employee</PageTitle>

			{/* Page Header Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '16px',
					background: '#ffffff',
					border: '1px solid #E4EAF2',
					boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
				}}>
				<div className='card-body p-6 d-flex flex-wrap align-items-center justify-content-between gap-4'>
					<div className='d-flex align-items-center gap-4'>
						<div
							className='d-flex align-items-center justify-content-center flex-shrink-0'
							style={{
								width: '52px',
								height: '52px',
								borderRadius: '12px',
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
								New GLS Employee
							</h2>
							<span
								className='fs-7'
								style={{ color: '#71809A' }}>
								Create the directory profile, bank credentials and shift timings
							</span>
						</div>
					</div>
					<div>
						<Link
							to='/hr/gls-employees'
							className='btn btn-sm d-inline-flex align-items-center gap-2 gz-back-btn'>
							<i className='bi bi-arrow-left fs-6'></i>
							<span className='fw-semibold'>Back to Directory</span>
						</Link>
					</div>
				</div>
			</div>

			<div className='row'>
				<div className='col-12 mt-1'>
					<div
						className='card shadow-sm border-0 mb-6'
						style={{
							borderRadius: '16px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
						}}>
						<div className='card-body p-6 p-md-8'>
							<div className='row'>
								<div className='col-md-12'>
									<h3 className='fw-bold text-gray-900 fs-4 mb-5 pb-3 border-bottom'>Personal Details</h3>
									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<InputField
												placeholder='Employee Code'
												type='text'
												className='col-12 fv-row mb-7'
												name='employee_code'
												label='Employee Code'
												htmlFor='employee_code'
												value={employeeData.employee_code || employee_code || ''}
												onChange={handleInputChange}
											/>
										</div>
										<div className='col-md-4 fv-row mb-md-7'>
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
										<div className='col-md-4 fv-row mb-7'>
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
										<div className='col-md-6 fv-row mb-7'>
											<SelectField
												className='col-12 fv-row'
												name='position'
												label='Position'
												htmlFor='position'
												value={employeeData.position}
												onChange={handleInputChange}
												options={[
													'Franchise Owner',
													'Sales manager',
													'Back Office',
													'Dietitian',
													'Worker',
													'Branch Manager',
													'Team Leader',
													'Director',
													'Fitness Counselor',
													'Production Manager',
													'Junior Production Manager',
													'R&D and Procurement Manager',
													'R&D and Procurement Executive',
													'Production Supervisor',
													'Machine Operator',
													'Lab Technician',
													'Security Guard',
													'Helper',
													'Other',
													'Admin',
													'Receptionist',
												]}
											/>
										</div>
										<div className='col-md-6 fv-row mb-7'>
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
										<div className='col-md-6 fv-row mb-7'>
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
										<div className='col-md-6 fv-row mb-7'>
											<SelectField
												className='col-12 fv-row'
												name='blood_group'
												label='Blood Group'
												htmlFor='bloodGroup'
												value={employeeData.blood_group}
												onChange={handleInputChange}
												options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
											/>
										</div>

										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Address Details:</h2>
											<div className='row'>
												<SelectField
													className='col-md-4 fv-row mb-7'
													label='Country'
													name='billing_country'
													value={employeeData.billing_country}
													onChange={handleInputChange}
													htmlFor='billing_country'
													options={countries.map((country) => country.name)}
													disabled={loadingCountries}
												/>
												<SelectField
													className='col-md-4 fv-row mb-7'
													label='State'
													name='billing_state'
													value={employeeData.billing_state}
													onChange={handleInputChange}
													htmlFor='billing_state'
													options={states.map((state) => state.name)}
													disabled={loadingStates || !employeeData.billing_country}
												/>
												<SelectField
													className='col-md-4 fv-row mb-7'
													label='City'
													name='billing_city'
													value={employeeData.billing_city}
													onChange={handleInputChange}
													htmlFor='billing_city'
													options={cities.map((city) => city.name)}
													disabled={loadingCities || !employeeData.billing_state}
												/>
												<InputField
													className='col-md-8 fv-row'
													label='Address'
													placeholder='Enter Address'
													type='text'
													name='billing_address_line_1'
													htmlFor='billing_address_line_1'
													value={employeeData.billing_address_line_1}
													onChange={handleInputChange}
												/>
												<InputField
													className='col-md-4 fv-row'
													label='Postal/Zip Code'
													placeholder='Enter Postal/Zip Code'
													type='text'
													name='billing_pin_code'
													htmlFor='billing_pin_code'
													value={employeeData.billing_pin_code}
													onChange={handleInputChange}
												/>
											</div>
										</div>

										<div className='col-md-12 mt-3'>
											<h2 className='mb-5'>Family Details:</h2>
											<div className='row'>
												{family_details.map((family, index) => (
													<div
														className='row'
														key={index}>
														<div className='col-md-6 fv-row'>
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
														<div className='col-md-6 fv-row'>
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
												<div className='col-md-6 fv-row mb-md-7'>
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
												<div className='col-md-6 fv-row mb-md-7'>
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

									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Bottom Action Card */}
					<div
						className='card shadow-sm border-0 mb-6'
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
								Review personal, address and banking details before creating the GLS profile.
							</span>
							<div className='d-flex align-items-center gap-2'>
								<Link
									to='/hr/gls-employees'
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
				</div>
			</div>
		</>
	)
}

export default EmployeeAdd
