import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import {
	CreateGlsEmployee,
	FileUploadToFGGroup,
	GetNextGlsEmployeeCode,
} from '../../../Functions/FGGroup'
import '../common-management.css'

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

			navigate('/rag/employee')
		} catch (error: any) {
			toast.error(error.message)
			setIsSubmitting(false)
			console.error(error)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Add Employee</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<Link to='/rag/employees'>Staff Management</Link>
				<span className='sep'>/</span>
				<span className='current'>Add Employee</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Onboard New Employee</h1>
					<p className='gz-mgmt-subtitle'>Register employee credentials, role designation, family emergency contacts, and bank accounts</p>
				</div>
				<Link to='/rag/employees' className='gz-mgmt-btn-secondary text-decoration-none'>
					Back to Staff
				</Link>
			</div>

			<div className='gz-mgmt-form-card'>
				{/* Section 1: Personal Details */}
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>1</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Personal & Role Details</h3>
						<p className='gz-mgmt-section-subtitle'>Basic identification, joining date, and corporate designation</p>
					</div>
				</div>

				<div className='row mb-6'>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Employee Code'
							type='text'
							className='col-12 fv-row'
							name='employee_code'
							label='Employee Code'
							htmlFor='employee_code'
							value={employeeData.employee_code || employee_code || ''}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Joining Date'
							type='date'
							className='col-12 fv-row'
							name='joining_date'
							label='Joining Date'
							htmlFor='joining_date'
							value={employeeData.joining_date}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Full Name'
							type='text'
							className='col-12 fv-row'
							name='name'
							label='Name'
							htmlFor='name'
							value={employeeData.name}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-6 fv-row mb-4'>
						<SelectField
							className='col-12 fv-row'
							name='position'
							label='Position / Role'
							htmlFor='position'
							value={employeeData.position}
							onChange={handleInputChange}
							options={[
								'Web Developer',
								'Web Designer',
								'Digital marketing',
								'Franchise Owner',
								'Graphics Designer',
								'Sales manager',
								'Video Editor',
								'Back Office',
								'faculty',
								'Trainer',
								'Dietitian',
								'Admin',
								'Receptionist',
								'Worker',
								'Branch Manager',
								'Human Resources',
								'Team Leader',
								'Manager',
								'Director',
								'Social Media Assistant',
								'Fitness Counselor',
								'Production Manager',
								'Seo',
								'Junior Production Manager',
								'Content Creator',
								'R&D and Procurement Manager',
								'R&D and Procurement Jr. Manager',
							]}
						/>
					</div>
					<div className='col-md-6 fv-row mb-4'>
						<InputField
							placeholder='Salary'
							type='text'
							className='col-12 fv-row'
							name='salary'
							label='Salary (₹)'
							htmlFor='salary'
							value={employeeData.salary}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-6 fv-row mb-4'>
						<InputField
							placeholder='Mobile No.'
							type='number'
							className='col-12 fv-row'
							name='mobile'
							label='Mobile Number'
							htmlFor='mobile'
							value={employeeData.mobile}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-6 fv-row mb-4'>
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
				</div>

				{/* Section 2: Address Details */}
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>2</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Address Information</h3>
						<p className='gz-mgmt-section-subtitle'>Residential location and regional postal routing</p>
					</div>
				</div>

				<div className='row mb-6'>
					<SelectField
						className='col-md-4 fv-row mb-4'
						label='Country'
						name='billing_country'
						value={employeeData.billing_country}
						onChange={handleInputChange}
						htmlFor='billing_country'
						options={countries.map((country) => country.name)}
						disabled={loadingCountries}
					/>
					<SelectField
						className='col-md-4 fv-row mb-4'
						label='State'
						name='billing_state'
						value={employeeData.billing_state}
						onChange={handleInputChange}
						htmlFor='billing_state'
						options={states.map((state) => state.name)}
						disabled={loadingStates || !employeeData.billing_country}
					/>
					<SelectField
						className='col-md-4 fv-row mb-4'
						label='City'
						name='billing_city'
						value={employeeData.billing_city}
						onChange={handleInputChange}
						htmlFor='billing_city'
						options={cities.map((city) => city.name)}
						disabled={loadingCities || !employeeData.billing_state}
					/>
					<div className='col-md-8 fv-row mb-4'>
						<InputField
							className='col-12 fv-row'
							label='Full Address'
							placeholder='Street address, flat/unit number, landmark'
							type='text'
							name='billing_address_line_1'
							htmlFor='billing_address_line_1'
							value={employeeData.billing_address_line_1}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							className='col-12 fv-row'
							label='Postal / Zip Code'
							placeholder='6-digit Pincode'
							type='text'
							name='billing_pin_code'
							htmlFor='billing_pin_code'
							value={employeeData.billing_pin_code}
							onChange={handleInputChange}
						/>
					</div>
				</div>

				{/* Section 3: Family Details */}
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>3</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Family & Emergency Contacts</h3>
						<p className='gz-mgmt-section-subtitle'>Immediate relatives and emergency notification numbers</p>
					</div>
				</div>

				<div className='mb-6'>
					{family_details.map((family, index) => (
						<div key={index} className='gz-mgmt-item-row'>
							<div className='row flex-grow-1'>
								<div className='col-md-6 fv-row'>
									<InputField
										placeholder='Relative Name'
										type='text'
										className='col-12 fv-row'
										name='name'
										label={`Family Member #${index + 1} Name`}
										htmlFor={`name-${index}`}
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
										htmlFor={`number-${index}`}
										value={family.mobile}
										onChange={(e: any) => handleFamilyChange(index, e)}
									/>
								</div>
							</div>
							{family_details.length > 1 && index !== 0 && (
								<div className='ms-3 d-flex align-items-center'>
									<TableButton
										action='remove'
										backgroundDark={true}
										onClick={(e) => removePlan(index, e)}
									/>
								</div>
							)}
						</div>
					))}

					<div className='d-flex justify-content-end mt-3'>
						<button
							type='button'
							className='gz-mgmt-btn-secondary'
							onClick={(e) => addPlan(e)}>
							<i className='bi bi-plus-lg me-1'></i> Add Family Contact
						</button>
					</div>
				</div>

				{/* Section 4: Account Details */}
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>4</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Bank Account Details</h3>
						<p className='gz-mgmt-section-subtitle'>Direct deposit payout and banking credentials</p>
					</div>
				</div>

				<div className='row mb-6'>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Bank Name'
							type='text'
							className='col-12 fv-row'
							name='bank_name'
							label='Bank Name'
							htmlFor='bank_name'
							value={employeeData.bank_name}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Account Number'
							type='text'
							className='col-12 fv-row'
							name='account_details'
							label='Account Number'
							htmlFor='account_details'
							value={employeeData.account_details}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='IFSC Code'
							type='text'
							className='col-12 fv-row'
							name='IFSC'
							label='IFSC Code'
							htmlFor='IFSC'
							value={employeeData.IFSC}
							onChange={handleInputChange}
						/>
					</div>
				</div>

				{/* Section 5: Documents & Shift Time */}
				<div className='gz-mgmt-section-header'>
					<div className='gz-mgmt-section-badge'>5</div>
					<div>
						<h3 className='gz-mgmt-section-title'>Documents & Shift Timings</h3>
						<p className='gz-mgmt-section-subtitle'>Identity verification proofs and daily attendance window</p>
					</div>
				</div>

				<div className='row mb-6'>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Upload Photo'
							type='file'
							className='col-12 fv-row'
							name='photo'
							label='Profile Photo'
							htmlFor='photo'
							onChange={handleFileChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Upload Proof'
							type='file'
							className='col-12 fv-row'
							name='proof'
							label='ID / Address Proof'
							htmlFor='proof'
							onChange={handleFileChange}
						/>
					</div>
					<div className='col-md-4 fv-row mb-4'>
						<InputField
							placeholder='Upload PDF'
							type='file'
							className='col-12 fv-row'
							name='document'
							label='Supporting PDF Document'
							htmlFor='document'
							onChange={handleFileChange}
						/>
					</div>
					<div className='col-md-6 fv-row mb-4'>
						<InputField
							placeholder='In-Time'
							type='time'
							className='col-12 fv-row'
							name='in_time'
							label='Shift In-Time'
							htmlFor='in_time'
							value={employeeData.in_time}
							onChange={handleInputChange}
						/>
					</div>
					<div className='col-md-6 fv-row mb-4'>
						<InputField
							placeholder='Out-Time'
							type='time'
							className='col-12 fv-row'
							name='out_time'
							label='Shift Out-Time'
							htmlFor='out_time'
							value={employeeData.out_time}
							onChange={handleInputChange}
						/>
					</div>
				</div>

				{/* Footer submit */}
				<div className='d-flex justify-content-end align-items-center gap-3 pt-4' style={{ borderTop: '1px solid #F1F5F9' }}>
					<Link to='/rag/employees' className='gz-mgmt-btn-secondary text-decoration-none'>
						Cancel
					</Link>
					<button
						type='button'
						className='gz-mgmt-btn-primary'
						onClick={handleAddButtonClick}
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<span
									className='spinner-border spinner-border-sm me-2'
									role='status'
									aria-hidden='true'></span>
								Registering Employee...
							</>
						) : (
							<>
								<i className='bi bi-person-check me-2'></i>
								Register Employee
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default EmployeeAdd
