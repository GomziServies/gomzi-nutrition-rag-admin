import { faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import TableButton from '../../../components/TableButton'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { GetGnFollowUpReport, UpdatePitchReport } from '../../../Functions/FGGroup/GnFollowUpReport'
import './follow-up-report.css'

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

type ReturnFromType = 'Product Details' | 'Sample Selection' | 'Sample Update' | null

export interface ProductEntry {
	product_type: string
	product_flavour: string
	weight: string
	weight_unit: string
	quantity: string
	budget: string
}

interface PersonalDetails {
	client_name: string
	mobile: string
	billing_address_line_1: string
	billing_country: string
	billing_state: string
	billing_city: string
	billing_pin_code: string
	products: ProductEntry[]
	interested: string
	experience: string
	brochure_sent: string
	follow_up_date: string
	remarks: string
	additional_note: string
}

interface PitchReport {
	telecaller_name: string
	interest_level: string
	follow_up_date: string
	call_recording: File | string | null
	objections: string
}

interface LoadedSampleUpdate {
	sample_taste_feedback: string
	sample_taste_remarks: string
	final_follow_up_date: string
	final_remarks: string
}

interface ProductOption {
	value: string
	icon: string
	label: string
}

const productTypeOptions: ProductOption[] = [
	{ value: 'Peanut Butter', icon: '🥜', label: 'Peanut Butter' },
	{ value: 'Mass Gainer', icon: '💪', label: 'Mass Gainer' },
	{ value: 'Whey Protein', icon: '🥛', label: 'Whey Protein' },
	{ value: 'Pre Workout', icon: '⚡', label: 'Pre Workout' },
	{ value: 'BCAA', icon: '🧬', label: 'BCAA' },
	{ value: 'EAA', icon: '🔬', label: 'EAA' },
	{ value: 'Creatine', icon: '💊', label: 'Creatine' },
	{ value: 'Energy Drink', icon: '🥤', label: 'Energy Drink' },
]

const sampleProductOptions: ProductOption[] = [
	{ value: 'Peanut Butter Sample', icon: '🥜', label: 'Peanut Butter' },
	{ value: 'Mass Gainer Sample', icon: '💪', label: 'Mass Gainer' },
	{ value: 'Whey Protein Sample', icon: '🥛', label: 'Whey Protein' },
	{ value: 'Pre Workout Sample', icon: '⚡', label: 'Pre Workout' },
	{ value: 'BCAA Sample', icon: '🧬', label: 'BCAA' },
	{ value: 'EAA Sample', icon: '🔬', label: 'EAA' },
	{ value: 'Creatine Sample', icon: '💊', label: 'Creatine' },
	{ value: 'Energy Drink Sample', icon: '🥤', label: 'Energy Drink' },
]

const sampleTasteFeedbackOptions: string[] = [
	'Select',
	'Excellent - Loved the taste',
	'Very Good - Really liked it',
	'Good - Satisfied with taste',
	'Average - Okay taste',
	'Below Average - Not impressed',
	'Poor - Did not like',
	'Very Poor - Terrible taste',
	'Client did not try yet',
]

const defaultPersonalDetails: PersonalDetails = {
	client_name: '',
	mobile: '',
	billing_address_line_1: '',
	billing_country: '',
	billing_state: '',
	billing_city: '',
	billing_pin_code: '',
	products: [
		{
			product_type: '',
			product_flavour: '',
			weight: '',
			weight_unit: 'kg',
			quantity: '',
			budget: '',
		},
	],
	interested: '',
	experience: '',
	brochure_sent: '',
	follow_up_date: '',
	remarks: '',
	additional_note: '',
}

function UpdateFollowUpReport(): JSX.Element {
	const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
		...defaultPersonalDetails,
	})

	const [loadedSampleUpdate, setLoadedSampleUpdate] = useState<LoadedSampleUpdate>({
		sample_taste_feedback: '',
		sample_taste_remarks: '',
		final_follow_up_date: '',
		final_remarks: '',
	})

	const [returnFrom, setReturnFrom] = useState<ReturnFromType>(null)

	const [selectedSamples, setSelectedSamples] = useState<string[]>([])
	const [sampleInterested, setSampleInterested] = useState<'Yes' | 'No' | ''>('')
	const [sampleInterestedRemarks, setSampleInterestedRemarks] = useState<string>('')
	const [sampleSelectionSkipped, setSampleSelectionSkipped] = useState<boolean>(false)
	const [sampleUpdate, setSampleUpdate] = useState<string>('')
	const [negotiationRemarks, setNegotiationRemarks] = useState<string>('')
	const [sampleUpdateSkipped, setSampleUpdateSkipped] = useState<boolean>(false)

	// Address state
	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState<boolean>(false)
	const [loadingStates, setLoadingStates] = useState<boolean>(false)
	const [loadingCities, setLoadingCities] = useState<boolean>(false)

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

	const [pitchReport, setPitchReport] = useState<PitchReport>({
		telecaller_name: '',
		interest_level: 'LOW',
		follow_up_date: '',
		call_recording: null,
		objections: '',
	})

	const [recordId, setRecordId] = useState<string | null>(null)
	const [latestCallHistoryId, setLatestCallHistoryId] = useState<string | null>(null)
	const [isEditMode, setIsEditMode] = useState<boolean>(false)

	const navigate = useNavigate()
	const location = useLocation()

	const isPastDate = (dateString: string): boolean => {
		if (!dateString) return false
		const selectedDate = new Date(dateString)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		return selectedDate < today
	}

	const queryParams = new URLSearchParams(location.search)
	const isPitchPendingParams = queryParams.get('pitchPending') === 'true'
	const adNameFromUrl = queryParams.get('ad_name') || ''
	const leadCreatedAtFromUrl = queryParams.get('lead_created_at') || ''
	const platformFromUrl = queryParams.get('platform') || ''

	const showSampleSelectionAccordion: boolean =
		!isEditMode ||
		sampleSelectionSkipped ||
		returnFrom === 'Sample Selection' ||
		returnFrom === 'Sample Update'

	const showSampleUpdateAccordion: boolean =
		!isEditMode || sampleUpdateSkipped || returnFrom === 'Sample Update'

	const showPitchReportAccordion: boolean = !isEditMode || !returnFrom || isPitchPendingParams

	const handlePitchReportChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	): void => {
		const { name, value } = e.target

		if (name === 'follow_up_date' && isPastDate(value)) {
			toast.error('Follow-up date cannot be in the past')
			return
		}

		setPitchReport((prev) => ({ ...prev, [name]: value }))
	}

	const fetchCountries = async (): Promise<void> => {
		setLoadingCountries(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries')
			const data = await response.json()
			if (data?.data) {
				setCountries(
					data.data.map((country: { iso2: string; country: string }) => ({
						id: country.iso2,
						name: country.country,
						iso2: country.iso2,
					}))
				)
			}
		} catch {
			toast.error('Failed to load countries')
		} finally {
			setLoadingCountries(false)
		}
	}

	const fetchStates = async (countryCode: string): Promise<void> => {
		if (!countryCode) {
			setStates([])
			setCities([])
			return
		}
		setLoadingStates(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: countryCode }),
			})
			const data = await response.json()
			if (data?.data?.states) {
				setStates(
					data.data.states.map((state: { name: string; state_code?: string }, index: number) => ({
						id: index,
						name: state.name,
						country_id: 0,
						country_code: countryCode,
						state_code: state.state_code || '',
					}))
				)
			}
		} catch {
			toast.error('Failed to load states')
		} finally {
			setLoadingStates(false)
		}
	}

	const fetchCities = async (countryCode: string, stateName: string): Promise<void> => {
		if (!countryCode || !stateName) {
			setCities([])
			return
		}
		setLoadingCities(true)
		try {
			const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ country: countryCode, state: stateName }),
			})
			const data = await response.json()
			if (data?.data) {
				setCities(
					data.data.map((city: string, index: number) => ({
						id: index,
						name: city,
						state_id: 0,
						state_code: '',
						country_id: 0,
						country_code: countryCode,
						latitude: '',
						longitude: '',
					}))
				)
			}
		} catch {
			toast.error('Failed to load cities')
		} finally {
			setLoadingCities(false)
		}
	}

	useEffect(() => {
		fetchCountries()
	}, [])

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		if (queryParams.get('edit') !== 'true') return

		const id = queryParams.get('id')
		if (!id) return

		setRecordId(id)
		setLatestCallHistoryId(null)
		setIsEditMode(true)

		const fetchData = async (): Promise<void> => {
			try {
				const response = await GetGnFollowUpReport({ id })
				if (response.status === 200 && response.data?.length > 0) {
					const data = response.data[0]

					const callId = queryParams.get('call_id')
					let latestCall: any = {}

					if (callId) {
						latestCall = data.callHistory?.find((c: any) => c._id === callId) || {}
					} else {
						latestCall = data.callHistory?.[data.callHistory.length - 1] || {}
					}

					setLatestCallHistoryId(latestCall?._id || null)

					const latestReturnFrom: ReturnFromType = latestCall.returnFrom || null
					setReturnFrom(latestReturnFrom)

					// Sample selection
					const lastCallSamples: string[] = latestCall.sampleSelection?.selected_samples || []
					const rawSampleInterested: boolean | undefined =
						latestCall.sampleSelection?.sample_interested
					const rawSampleSelectionSkipped: boolean = latestCall.sampleSelection?.is_skipped || false
					const loadedSI: 'Yes' | 'No' | '' =
						rawSampleInterested === true ? 'Yes' : rawSampleInterested === false ? 'No' : ''

					setSampleInterested(loadedSI)
					setSampleSelectionSkipped(rawSampleSelectionSkipped)

					if (lastCallSamples.length > 0) {
						setSelectedSamples(lastCallSamples)
					}

					// Sample update
					const sampleUpdateCall = data.callHistory?.find(
						(call: { returnFrom?: string }) => call.returnFrom === 'Sample Update'
					)
					if (sampleUpdateCall?.sampleUpdate) {
						const su = sampleUpdateCall.sampleUpdate
						const loadedSU: LoadedSampleUpdate = {
							sample_taste_feedback: su.sample_taste_feedback || '',
							sample_taste_remarks: su.sample_taste_remarks || '',
							final_follow_up_date: su.final_follow_up_date
								? new Date(su.final_follow_up_date).toISOString().split('T')[0]
								: '',
							final_remarks: su.final_remarks || '',
						}
						setLoadedSampleUpdate(loadedSU)
						setSampleUpdate(loadedSU.sample_taste_feedback)
						setNegotiationRemarks(loadedSU.sample_taste_remarks)
						setSampleUpdateSkipped(su.is_skipped || false)
					}

					// Personal & product details
					const loaded: PersonalDetails = {
						client_name: data.personalDetails?.client_name || '',
						mobile: data.personalDetails?.mobile || '',
						billing_address_line_1: data.personalDetails?.address?.address_line_1 || '',
						billing_country: data.personalDetails?.address?.country || '',
						billing_state: data.personalDetails?.address?.state || '',
						billing_city: data.personalDetails?.address?.city || '',
						billing_pin_code: data.personalDetails?.address?.pin_code || '',
						products: latestCall.productDetails?.products?.length
							? latestCall.productDetails.products
							: [
									{
										product_type: '',
										product_flavour: '',
										weight: '',
										weight_unit: 'kg',
										quantity: '',
										budget: '',
									},
							  ],
						interested: latestCall.productDetails?.interested ? 'Yes' : 'No',
						experience: latestCall.productDetails?.experience || '',
						brochure_sent: latestCall.productDetails?.brochure_sent ? 'Yes' : 'No',
						follow_up_date: latestCall.productDetails?.follow_up_date
							? new Date(latestCall.productDetails.follow_up_date).toISOString().split('T')[0]
							: '',
						remarks: latestCall.productDetails?.remarks || '',
						additional_note: data.personalDetails?.additional_note || '',
					}
					setPersonalDetails(loaded)

					// Pitch report
					setPitchReport({
						telecaller_name: latestCall.pitchReport?.telecaller_name || '',
						interest_level: latestCall.pitchReport?.interest_level || 'LOW',
						follow_up_date: latestCall.pitchReport?.pitch_follow_up_date
							? new Date(latestCall.pitchReport.pitch_follow_up_date).toISOString().split('T')[0]
							: '',
						call_recording: latestCall.pitchReport?.call_recording || null,
						objections: latestCall.pitchReport?.objections || '',
					})

					if (loaded.billing_country) {
						await fetchStates(loaded.billing_country)
						if (loaded.billing_state) {
							await fetchCities(loaded.billing_country, loaded.billing_state)
						}
					}
				}
			} catch (error) {
				toast.error('Failed to load existing data')
			}
		}

		fetchData()

		setTimeout(() => {
			document.getElementById('kt_personal_details')?.classList.add('show')
			document.getElementById('kt_pitch_report')?.classList.add('show')
		}, 100)
	}, [location])

	const handleSavePitchReport = async (): Promise<void> => {
		if (isPastDate(pitchReport.follow_up_date)) {
			toast.error('Follow-up date cannot be in the past')
			return
		}

		if (!recordId) {
			toast.error('No record ID found')
			return
		}
		try {
			setIsSubmitting(true)

			// Upload call recording if a new file was selected (optional)
			let callRecordingUrl =
				typeof pitchReport.call_recording === 'string' ? pitchReport.call_recording : ''
			if (pitchReport.call_recording instanceof File) {
				try {
					const audioRes: any = await FileUploadToFGGroup(pitchReport.call_recording, {
						directory: 'call-recordings',
					})
					let audioUrl = audioRes?.data?.fileURLs?.[0]
					if (audioUrl) {
						if (!audioUrl.startsWith('http')) audioUrl = `https://files.fggroup.in/${audioUrl}`
						callRecordingUrl = audioUrl
					}
				} catch (audioErr) {
					console.error('Failed to upload call recording', audioErr)
				}
			}

			const response = await UpdatePitchReport(
				{
					id: recordId,
					...(latestCallHistoryId ? { callHistoryId: latestCallHistoryId } : {}),
				},
				{
					pitchReport: {
						telecaller_name: pitchReport.telecaller_name,
						interest_level: pitchReport.interest_level,
						pitch_follow_up_date: pitchReport.follow_up_date
							? new Date(pitchReport.follow_up_date)
							: null,
						call_recording: callRecordingUrl,
						objections: pitchReport.objections,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Pitch report saved successfully!')
				const params = new URLSearchParams()
				params.set('mobile', personalDetails.mobile)
				params.set('name', personalDetails.client_name)
				if (adNameFromUrl) params.set('ad_name', adNameFromUrl)
				if (leadCreatedAtFromUrl) params.set('lead_created_at', leadCreatedAtFromUrl)
				if (platformFromUrl) params.set('platform', platformFromUrl)
				navigate(`/rag/follow-up-report-inner-list?${params.toString()}`)
			} else {
				toast.error(response.message || 'Failed to save pitch report')
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Follow Up Report</PageTitle>

			{/* Personal Details & Product Details  */}
			<div className='col-12'>
				<div className='card section-card'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_personal_details'>
						<h3>
							<span
								className='header-icon'
								style={{ background: '#eef6ff', color: '#3699ff' }}>
								<i className='bi bi-person-lines-fill'></i>
							</span>
							Personal Details & Product Details
						</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-4 text-muted'
						/>
					</div>

					<div
						id='kt_personal_details'
						className='collapse show'>
						<div className='section-body'>
							{personalDetails.additional_note && personalDetails.additional_note !== '-' && (
								<div className='row'>
									<div className='col-12 mb-7'>
										<div
											className='alert alert-primary d-flex align-items-center p-5 mb-0'
											style={{
												backgroundColor: '#f1faff',
												border: '1px dashed #b9dfff',
												borderRadius: '8px',
											}}>
											<i className='bi bi-info-circle-fill fs-2hx text-primary me-4'></i>
											<div className='d-flex flex-column'>
												<h4 className='mb-1 text-primary'>Lead Answers / Additional Notes</h4>
												<div
													className='d-flex flex-column gap-1 mt-2'
													style={{ fontSize: '13px', color: '#181c32' }}>
													{personalDetails.additional_note.split(' | ').map((note, idx) => (
														<div
															key={idx}
															className='d-flex align-items-start gap-2'>
															<span className='text-primary fw-bolder mt-1'>•</span>
															{note.includes(':') ? (
																<span>
																	<strong>{note.split(':')[0]}:</strong>
																	{note.split(':').slice(1).join(':')}
																</span>
															) : (
																<span>{note}</span>
															)}
														</div>
													))}
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
							<div className='field-group-title'>
								<i className='bi bi-person'></i>Basic Information
							</div>

							<div className='row'>
								<InputField
									placeholder='Enter Client Name'
									type='text'
									className='col-md-6 fv-row'
									name='client_name'
									label='Client Name'
									htmlFor='client_name'
									value={personalDetails.client_name}
									onChange={() => {}}
									disabled
								/>
								<InputField
									placeholder='Enter Mobile Number'
									type='number'
									className='col-md-6 fv-row'
									name='mobile'
									label='Mobile Number'
									htmlFor='mobile'
									value={personalDetails.mobile}
									onChange={() => {}}
									disabled
								/>
							</div>

							<div className='row'>
								<SelectField
									label='Country'
									name='billing_country'
									className='col-md-4 fv-row'
									htmlFor='billing_country'
									value={personalDetails.billing_country}
									onChange={() => {}}
									options={[
										loadingCountries ? 'Loading...' : 'Select',
										...countries.map((c) => c.name),
									]}
									disabled
								/>
								<SelectField
									label='State'
									name='billing_state'
									className='col-md-4 fv-row'
									htmlFor='billing_state'
									value={personalDetails.billing_state}
									onChange={() => {}}
									options={[loadingStates ? 'Loading...' : 'Select', ...states.map((s) => s.name)]}
									disabled
								/>
								<SelectField
									label='City'
									name='billing_city'
									className='col-md-4 fv-row'
									htmlFor='billing_city'
									value={personalDetails.billing_city}
									onChange={() => {}}
									options={[loadingCities ? 'Loading...' : 'Select', ...cities.map((c) => c.name)]}
									disabled
								/>
								<InputField
									placeholder='Enter Address'
									type='text'
									className='col-md-8 fv-row'
									name='billing_address_line_1'
									label='Address'
									htmlFor='billing_address_line_1'
									value={personalDetails.billing_address_line_1}
									onChange={() => {}}
									disabled
								/>
								<InputField
									placeholder='Enter Pin Code'
									type='text'
									className='col-md-4 fv-row'
									name='billing_pin_code'
									label='Pin Code'
									htmlFor='billing_pin_code'
									value={personalDetails.billing_pin_code}
									onChange={() => {}}
									disabled
								/>
							</div>

							<div className='field-group-title'>
								<i className='bi bi-box-seam'></i>Product Information
							</div>

							{personalDetails.products.map((product, index) => (
								<div
									key={index}
									className='product-entry-row mb-5 p-5 border rounded'>
									<div className='d-flex justify-content-between mb-3'>
										<h5 className='fw-bolder'>Product {index + 1}</h5>
									</div>
									<div className='row'>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Product Type</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={product.product_type}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Product Flavour</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												value={product.product_flavour}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Weight</label>
											<div className='d-flex gap-2'>
												<input
													type='text'
													className='form-control inputfield-bg'
													value={product.weight}
													disabled
												/>
												<input
													type='text'
													className='form-control inputfield-bg w-100px'
													value={product.weight_unit}
													disabled
												/>
											</div>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Quantity</label>
											<input
												type='number'
												className='form-control inputfield-bg'
												value={product.quantity}
												disabled
											/>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Budget</label>
											<div className='budget-input-wrapper'>
												<span className='currency-symbol'>₹</span>
												<input
													type='text'
													className='form-control inputfield-bg'
													value={product.budget}
													disabled
												/>
											</div>
										</div>
									</div>
								</div>
							))}

							<div className='divider-line'></div>

							<div className='field-group-title'>
								<i className='bi bi-star'></i>Interest & Experience
							</div>

							<div className='row'>
								<div className='col-md-3 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>Interested?</label>
									<div className='d-flex gap-3'>
										{(['Yes', 'No'] as string[]).map((option) => (
											<div
												key={option}
												className={`radio-card ${
													personalDetails.interested === option
														? option === 'Yes'
															? 'active-yes'
															: 'active-no'
														: ''
												}`}
												style={{
													pointerEvents: 'none',
													opacity: personalDetails.interested === option ? 1 : 0.45,
												}}>
												<span className='radio-dot'></span>
												<span className='radio-label'>{option}</span>
											</div>
										))}
									</div>
								</div>

								<div className='col-md-6 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>Experience</label>
									<div className='d-flex gap-3'>
										{(['First time buyer', 'Already buying from some where'] as string[]).map(
											(option) => (
												<div
													key={option}
													className={`radio-card ${
														personalDetails.experience === option ? 'active' : ''
													}`}
													style={{
														pointerEvents: 'none',
														opacity: personalDetails.experience === option ? 1 : 0.45,
													}}>
													<span className='radio-dot'></span>
													<span className='radio-label'>{option}</span>
												</div>
											)
										)}
									</div>
								</div>

								<div className='col-md-3 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>
										Brochure / Price List Sent?
									</label>
									<div className='d-flex gap-3'>
										{(['Yes', 'No'] as string[]).map((option) => (
											<div
												key={option}
												className={`radio-card ${
													personalDetails.brochure_sent === option
														? option === 'Yes'
															? 'active-yes'
															: 'active-no'
														: ''
												}`}
												style={{
													pointerEvents: 'none',
													opacity: personalDetails.brochure_sent === option ? 1 : 0.45,
												}}>
												<span className='radio-dot'></span>
												<span className='radio-label'>{option}</span>
											</div>
										))}
									</div>
								</div>
							</div>

							<div className='divider-line'></div>

							<div className='row'>
								<div className='col-md-12 fv-row mb-7'>
									<label className='form-label fw-bolder text-dark fs-6 mb-3'>Remarks</label>
									<textarea
										className='remarks-textarea'
										rows={3}
										name='remarks'
										value={personalDetails.remarks}
										onChange={() => {}}
										disabled
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Interested & Sample Selection */}
			{showSampleSelectionAccordion && (
				<div className='col-12'>
					<div className='card section-card'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_interested_sample'>
							<h3>
								<span
									className='header-icon'
									style={{ background: '#e8f5e9', color: '#388e3c' }}>
									<i className='bi bi-hand-thumbs-up'></i>
								</span>
								Interested & Sample Selection
								{sampleSelectionSkipped && (
									<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
								)}
							</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-4 text-muted'
							/>
						</div>

						<div
							id='kt_interested_sample'
							className='collapse show'>
							<div
								className='section-body'
								style={{
									pointerEvents: sampleSelectionSkipped ? 'none' : 'auto',
									opacity: sampleSelectionSkipped ? 0.6 : 1,
								}}>
								<div className='field-group-title'>
									<i className='bi bi-star'></i>Client Interest
								</div>

								<div className='row'>
									<div className='col-md-4 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>Interested?</label>
										<div className='d-flex gap-3'>
											{(['Yes', 'No'] as const).map((option) => (
												<div
													key={option}
													className={`radio-card ${
														sampleInterested === option
															? option === 'Yes'
																? 'active-yes'
																: 'active-no'
															: ''
													}`}
													style={{
														pointerEvents: 'none',
														opacity: sampleInterested === option ? 1 : 0.45,
													}}>
													<span className='radio-dot'></span>
													<span className='radio-label'>{option}</span>
												</div>
											))}
										</div>
									</div>
								</div>

								{sampleInterested === 'Yes' && (
									<div className='sample-section'>
										<div className='sample-title'>
											<i className='bi bi-gift-fill'></i>
											Selected Sample Products
										</div>
										<div className='d-flex gap-3 flex-wrap'>
											{sampleProductOptions.map((sample) => {
												const isSelected = selectedSamples.includes(sample.value)
												return (
													<div
														key={sample.value}
														className={`product-type-card ${
															isSelected ? 'active' : ''
														} disabled-card`}>
														{isSelected && (
															<span className='check-badge'>
																<i className='bi bi-check2'></i>
															</span>
														)}
														<span className='product-icon'>{sample.icon}</span>
														<span className='product-label'>{sample.label}</span>
													</div>
												)
											})}
										</div>

										<div className='row mt-5'>
											<div className='col-md-12 fv-row mb-7'>
												<label className='form-label fw-bolder text-dark fs-6 mb-3'>Remarks</label>
												<textarea
													className='remarks-textarea'
													rows={3}
													value={sampleInterestedRemarks}
													onChange={() => {}}
													disabled
												/>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/*  Sample Update */}
			{showSampleUpdateAccordion && (
				<div className='col-12'>
					<div className='card section-card'>
						<div
							className='section-header'
							role='button'
							data-bs-toggle='collapse'
							data-bs-target='#kt_sample_update_negotiation'>
							<h3>
								<span
									className='header-icon'
									style={{ background: '#fff3e0', color: '#f57c00' }}>
									<i className='bi bi-chat-dots'></i>
								</span>
								Sample Update
								{sampleUpdateSkipped && (
									<span className='ms-3 p-2 badge badge-light-danger fw-bold'>Skipped</span>
								)}
							</h3>
							<FontAwesomeIcon
								icon={faAngleDown}
								className='fs-4 text-muted'
							/>
						</div>

						<div
							id='kt_sample_update_negotiation'
							className='collapse show'>
							<div
								className='section-body'
								style={{
									pointerEvents: sampleUpdateSkipped ? 'none' : 'auto',
									opacity: sampleUpdateSkipped ? 0.6 : 1,
								}}>
								<div className='field-group-title'>
									<i className='bi bi-clipboard-check'></i>Sample Taste Update
								</div>

								<div className='row'>
									<SelectField
										className='col-md-12 fv-row mb-7'
										label='Sample Taste Feedback'
										name='sample_taste_feedback'
										value={sampleUpdate}
										onChange={() => {}}
										htmlFor='sample_taste_feedback'
										options={sampleTasteFeedbackOptions}
										disabled
									/>
								</div>

								<div className='row'>
									<div className='col-md-12 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>
											Sample Test Remarks
										</label>
										<textarea
											className='remarks-textarea'
											rows={3}
											value={negotiationRemarks}
											onChange={() => {}}
											disabled
										/>
									</div>
								</div>

								<div className='divider-line'></div>

								<div className='field-group-title'>
									<i className='bi bi-chat-text'></i>Final Remarks
								</div>

								<div className='row'>
									<div className='col-md-12 fv-row mb-7'>
										<label className='form-label fw-bolder text-dark fs-6 mb-3'>
											Final Remarks
										</label>
										<textarea
											className='remarks-textarea'
											rows={4}
											name='remarks'
											value={loadedSampleUpdate.final_remarks}
											onChange={() => {}}
											disabled
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/*  Pitch Report */}
			{showPitchReportAccordion && (
				<div className='card section-card'>
					<div
						className='section-header'
						role='button'
						data-bs-toggle='collapse'
						data-bs-target='#kt_pitch_report'>
						<h3>
							<span
								className='header-icon'
								style={{ background: '#f0fff4', color: '#28a745' }}>
								<i className='bi bi-megaphone'></i>
							</span>
							Pitch Report
						</h3>
						<FontAwesomeIcon
							icon={faAngleDown}
							className='fs-4 text-muted'
						/>
					</div>

					<div
						id='kt_pitch_report'
						className='collapse show'>
						<div className='section-body'>
							<div className='row'>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Telecaller Name'
									name='telecaller_name'
									value={pitchReport.telecaller_name}
									onChange={handlePitchReportChange}
									htmlFor='telecaller_name'
									options={['Milan', 'Shahid', 'Manikandan']}
								/>
								<SelectField
									className='col-md-4 fv-row mb-7'
									label='Interest Level'
									name='interest_level'
									value={pitchReport.interest_level}
									onChange={handlePitchReportChange}
									htmlFor='interest_level'
									options={['LOW', 'MEDIUM', 'HIGH']}
								/>
								<InputField
									placeholder='Select Next Follow up Date'
									type='date'
									className='col-md-4 fv-row'
									label='Next Follow up Date'
									name='follow_up_date'
									htmlFor='follow_up_date'
									value={pitchReport.follow_up_date}
									onChange={handlePitchReportChange}
								/>
							</div>

							<div className='col-md-12 fv-row mb-7 mt-5'>
								<label className='form-label fw-bolder text-dark fs-6'>
									Call Recording
									<span className='text-muted fs-7 fw-normal ms-2'>(optional)</span>
								</label>
								{pitchReport.call_recording instanceof File ? (
									<div className='d-flex align-items-center gap-3 mt-2'>
										<i className='bi bi-file-earmark-music fs-2 text-primary'></i>
										<span className='text-gray-700 fw-semibold'>
											{(pitchReport.call_recording as File).name}
										</span>
										<button
											type='button'
											className='btn btn-sm btn-icon btn-danger'
											onClick={() => setPitchReport((p: any) => ({ ...p, call_recording: null }))}>
											<i className='bi bi-x'></i>
										</button>
									</div>
								) : typeof pitchReport.call_recording === 'string' &&
								  pitchReport.call_recording !== '' ? (
									<div className='d-flex flex-column gap-3 mt-2'>
										<div className='d-flex align-items-center gap-3'>
											<audio
												controls
												src={pitchReport.call_recording}
												style={{ height: '40px' }}>
												Your browser does not support the audio element.
											</audio>
											<button
												type='button'
												className='btn btn-sm btn-icon btn-danger'
												onClick={() => setPitchReport((p: any) => ({ ...p, call_recording: null }))}
												title='Remove Recording'>
												<i className='bi bi-trash'></i>
											</button>
										</div>
									</div>
								) : (
									<input
										type='file'
										accept='audio/*'
										className='form-control form-control-solid'
										onChange={(e) => {
											const file = e.target.files?.[0] || null
											setPitchReport((p: any) => ({ ...p, call_recording: file }))
										}}
									/>
								)}
							</div>

							<div className='col-md-12 fv-row mb-7'>
								<label className='form-label fw-bolder text-dark fs-6 mb-3'>Objections</label>
								<textarea
									className='remarks-textarea'
									rows={3}
									placeholder='Enter objections or client concerns...'
									name='objections'
									value={pitchReport.objections}
									onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
										setPitchReport((prev) => ({ ...prev, objections: e.target.value }))
									}
								/>
							</div>

							<div className='d-flex justify-content-end'>
								<TableButton
									action='add'
									text={isSubmitting ? 'Saving...' : 'Save Report'}
									showIcon={false}
									backgroundDark={true}
									onClick={async () => {
										if (recordId) await handleSavePitchReport()
										else toast.error('No record ID found')
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default UpdateFollowUpReport
