import { faAngleDown, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { createQuotation, FileUploadToFGGroup } from '../../../Functions/FGGroup'
import {
	CreateGnFollowUpReport,
	GetGnFollowUpReport,
	UpdatePitchReport,
	UpdateProductDetails,
	UpdateSampleSelection,
	UpdateSampleUpdate,
} from '../../../Functions/FGGroup/GnFollowUpReport'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'
import './follow-up-report.css'

interface Country {
	id: string
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
	email: string
	billing_address_line_1: string
	billing_country: string
	billing_state: string
	billing_city: string
	billing_pin_code: string
	products: ProductEntry[]
	interested: string
	experience: string
	brochure_sent: string
	remarks: string
	total_amount: string
	additional_note?: string
}

interface PlanType {
	item_type: string
	items: string
	item_weight: string
	item_weight_type: string
	amount: string
	quantity: string
	totalPayment: string
	gst: string
	isDiscountPercentage: boolean
	discount: string
}

interface QuotationPlanType {
	item_name: string
	item_type: string
	item_weight: string
	item_weight_type: string
	amount: string
	quantity: string
	totalAmount: string
	gst: string
	isDiscountPercentage: boolean
	discount: string
}

interface FormData {
	date: string
	branch_name: string
	name: string
	billing_address: string
	mobile: string
	email: string
	net_amount: string
	gst: string
	discount: string
}

interface QuotationData {
	date: string
	name: string
	email: string
	mobile: string
	billing_address: string
	net_amount: string
}

interface PitchReport {
	telecaller_name: string
	interest_level: string
	follow_up_date: string
	call_recording: File | string | null
	objections: string
}

interface SectionDisabled {
	personalDetails: boolean
	addressDetails: boolean
	productDetails: boolean
	sampleSelection: boolean
	sampleUpdate: boolean
	pitchReport: boolean
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

const defaultPlan: PlanType = {
	item_type: '',
	items: '',
	item_weight: '',
	item_weight_type: 'kg',
	amount: '',
	quantity: '',
	totalPayment: '',
	gst: '',
	discount: '',
	isDiscountPercentage: true,
}

function AddFollowUpReport(): JSX.Element {
	const [selectedSamples, setSelectedSamples] = useState<string[]>([])
	const [sampleUpdate, setSampleUpdate] = useState<string>('')
	const [negotiationRemarks, setNegotiationRemarks] = useState<string>('')
	const [sampleInterested, setSampleInterested] = useState<string>('')
	const [sampleInterestedRemarks, setSampleInterestedRemarks] = useState<string>('')
	const [sampleFinalFollowUpDate, setSampleFinalFollowUpDate] = useState<string>('')
	const [sampleFinalRemarks, setSampleFinalRemarks] = useState<string>('')

	const [sectionDisabled, setSectionDisabled] = useState<SectionDisabled>({
		personalDetails: false,
		addressDetails: false,
		productDetails: false,
		sampleSelection: false,
		sampleUpdate: false,
		pitchReport: false,
	})

	const [sectionSkipped, setSectionSkipped] = useState({
		sampleSelection: false,
		sampleUpdate: false,
	})

	const [countries, setCountries] = useState<Country[]>([])
	const [states, setStates] = useState<State[]>([])
	const [cities, setCities] = useState<City[]>([])
	const [loadingCountries, setLoadingCountries] = useState<boolean>(false)
	const [loadingStates, setLoadingStates] = useState<boolean>(false)
	const [loadingCities, setLoadingCities] = useState<boolean>(false)

	const [formData, setFormData] = useState<FormData>({
		date: '',
		branch_name: 'Adajan',
		name: '',
		billing_address: '',
		mobile: '',
		email: '',
		net_amount: '',
		gst: '',
		discount: '',
	})

	const [plans, setPlans] = useState<PlanType[]>([{ ...defaultPlan }])

	const [quotationData, setQuotationData] = useState<QuotationData>({
		date: '',
		name: '',
		email: '',
		mobile: '',
		billing_address: '',
		net_amount: '',
	})

	const [quotationPlanData, setQuotationPlanData] = useState<QuotationPlanType[]>([])
	const [downloadBtn, setDownloadBtn] = useState<boolean>(false)
	const [dueAmount, setDueAmount] = useState<string>('')
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
	const adminType = localStorage.getItem('admin') || 'Store'

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
	const [isPitchReportPending, setIsPitchReportPending] = useState<boolean>(false)

	const location = useLocation()
	const initialPersonalDetails = (location.state as any)?.personalDetails || {}

	const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
		client_name: initialPersonalDetails.name || '',
		mobile: initialPersonalDetails.mobile || '',
		email: initialPersonalDetails.email || '',
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
		remarks: '',
		total_amount: '',
		additional_note: initialPersonalDetails.additional_note || '',
	})

	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const adNameFromUrl = queryParams.get('ad_name') || ''
	const leadCreatedAtFromUrl = queryParams.get('lead_created_at') || ''
	const platformFromUrl = queryParams.get('platform') || ''
	const isPullMarketing = platformFromUrl.toLowerCase() === 'pull_marketing'

	const getBackUrl = () => {
		const params = new URLSearchParams()
		params.set('mobile', personalDetails.mobile)
		params.set('name', personalDetails.client_name)
		if (adNameFromUrl) params.set('ad_name', adNameFromUrl)
		if (leadCreatedAtFromUrl) params.set('lead_created_at', leadCreatedAtFromUrl)
		if (platformFromUrl) params.set('platform', platformFromUrl)
		return `/rag/follow-up-report-inner-list?${params.toString()}`
	}

	const isPastDate = (dateString: string): boolean => {
		if (!dateString) return false
		const selectedDate = new Date(dateString)
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		return selectedDate < today
	}

	const handlePersonalDetailsChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	): void => {
		const { name, value } = e.target

		if (name === 'follow_up_date' && isPastDate(value)) {
			toast.error('Follow-up date cannot be in the past')
			return
		}

		if (name === 'billing_country') {
			setPersonalDetails((prev) => ({
				...prev,
				billing_country: value,
				billing_state: '',
				billing_city: '',
			}))
			fetchStates(value)
			setStates([])
			setCities([])
			return
		}

		if (name === 'billing_state') {
			setPersonalDetails((prev) => ({ ...prev, billing_state: value, billing_city: '' }))
			const selectedState = states.find((state) => state.name === value)
			if (selectedState && personalDetails.billing_country) {
				fetchCities(personalDetails.billing_country, selectedState.name)
			}
			setCities([])
			return
		}

		setPersonalDetails((prev) => ({ ...prev, [name]: value }))
	}

	const handleSampleToggle = (value: string): void => {
		setSelectedSamples((prev) =>
			prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
		)
	}

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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
		setQuotationData((prev) => ({ ...prev, [name]: value }))
	}

	const recalculateTotals = (updatedPlans: PlanType[]): void => {
		const totalAmount: number = updatedPlans.reduce(
			(sum, plan) => sum + (parseFloat(plan.totalPayment) || 0),
			0
		)
		const totalDiscount: number = updatedPlans.reduce((sum, plan) => {
			const planDiscount = parseFloat(plan.discount) || 0
			const planQuantity = parseFloat(plan.quantity) || 0
			const planAmount = parseFloat(plan.amount) || 0
			const baseAmount = planQuantity * planAmount
			const discountValue =
				plan.isDiscountPercentage ?? true ? (baseAmount * planDiscount) / 100 : planDiscount
			return sum + discountValue
		}, 0)
		setFormData((prev) => ({
			...prev,
			net_amount: String(totalAmount),
			discount: String(totalDiscount),
		}))
	}

	const handlePlanInputChange = (
		index: number,
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	): void => {
		const { name, value } = e.target
		const newPlans = [...plans]
		newPlans[index] = { ...newPlans[index], [name]: value }

		const quantity = parseFloat(newPlans[index].quantity) || 0
		const amount = parseFloat(newPlans[index].amount) || 0
		const gst = parseFloat(newPlans[index].gst) || 0
		const discount = parseFloat(newPlans[index].discount) || 0
		const isDiscountPercentage = newPlans[index].isDiscountPercentage ?? true

		const baseAmount = quantity * amount
		const discountForCalculation = isDiscountPercentage ? (baseAmount * discount) / 100 : discount

		let total = baseAmount
		if (gst) total += (baseAmount * gst) / 100
		if (discountForCalculation) total -= discountForCalculation

		newPlans[index].totalPayment = total.toFixed(0)
		setPlans(newPlans)
		recalculateTotals(newPlans)
	}

	const addPlan = (e: React.MouseEvent<HTMLButtonElement>): void => {
		e.preventDefault()
		setPlans([...plans, { ...defaultPlan }])
	}

	const removePlan = (index: number, e: React.MouseEvent<HTMLButtonElement>): void => {
		e.preventDefault()
		const newPlans = [...plans]
		newPlans.splice(index, 1)
		setPlans(newPlans)
		recalculateTotals(newPlans)
	}

	const handleDiscountTypeToggle = (index: number): void => {
		const newPlans = [...plans]
		const plan = newPlans[index]
		const currentIsPercentage = plan.isDiscountPercentage ?? true
		const newIsPercentage = !currentIsPercentage

		let discountValue = parseFloat(plan.discount) || 0
		const quantity = parseFloat(plan.quantity) || 0
		const amount = parseFloat(plan.amount) || 0
		const baseAmount = quantity * amount

		if (discountValue > 0 && baseAmount > 0) {
			if (currentIsPercentage && !newIsPercentage) {
				discountValue = (baseAmount * discountValue) / 100
			} else if (!currentIsPercentage && newIsPercentage) {
				discountValue = (discountValue / baseAmount) * 100
			}
		}

		newPlans[index] = {
			...plan,
			isDiscountPercentage: newIsPercentage,
			discount: discountValue.toFixed(2),
		}
		setPlans(newPlans)
		recalculateTotals(newPlans)
	}

	const handleAddProduct = () => {
		setPersonalDetails((prev) => ({
			...prev,
			products: [
				...prev.products,
				{
					product_type: '',
					product_flavour: '',
					weight: '',
					weight_unit: 'kg',
					quantity: '',
					budget: '',
				},
			],
		}))
	}

	const handleRemoveProduct = (index: number) => {
		setPersonalDetails((prev) => {
			const updatedProducts = prev.products.filter((_, i) => i !== index)
			const totalAmount = updatedProducts.reduce((sum, product) => {
				const budget = parseFloat(product.budget) || 0
				return sum + budget
			}, 0)

			return {
				...prev,
				products: updatedProducts,
				total_amount: totalAmount > 0 ? totalAmount.toString() : '',
			}
		})
	}

	const handleProductChange = (index: number, field: keyof ProductEntry, value: string) => {
		setPersonalDetails((prev) => {
			const updatedProducts = [...prev.products]
			updatedProducts[index] = { ...updatedProducts[index], [field]: value }

			const totalAmount = updatedProducts.reduce((sum, product) => {
				const budget = parseFloat(product.budget) || 0
				return sum + budget
			}, 0)

			return {
				...prev,
				products: updatedProducts,
				total_amount: totalAmount > 0 ? totalAmount.toString() : '',
			}
		})
	}

	const handleCreateQuotation = async (): Promise<void> => {
		const plansData: QuotationPlanType[] = plans.map((plan) => ({
			item_name: plan.items,
			item_type: plan.item_type || '',
			amount: plan.amount,
			gst: plan.gst,
			discount: plan.discount,
			totalAmount: plan.totalPayment,
			quantity: plan.quantity,
			isDiscountPercentage: plan.isDiscountPercentage,
			item_weight: plan.item_weight,
			item_weight_type: plan.item_weight_type || '',
		}))

		// For API: numeric values, paid_amount required
		const apiItems = plans.map((plan) => ({
			item_name: plan.items,
			item_type: plan.item_type || undefined,
			amount: Number(plan.amount),
			gst: Number(plan.gst),
			discount: Number(plan.discount),
			totalAmount: Number(plan.totalPayment),
			quantity: Number(plan.quantity),
			isDiscountPercentage: plan.isDiscountPercentage,
			item_weight: plan.item_weight ? Number(plan.item_weight) : 0,
			item_weight_type: plan.item_weight_type || undefined,
		}))

		try {
			setIsSubmitting(true)
			const payload = {
				quotation_category: adminType === 'Store' ? adminType : 'Gomzi Nutrition',
				date: DayJS(formData.date).format('YYYY/MM/DD'),
				name: formData.name,
				branch_name: formData.branch_name,
				email: formData.email,
				mobile: formData.mobile,
				billing_address: { address_line_1: formData.billing_address },
				net_amount: Number(formData.net_amount),
				paid_amount: 0,
				note: '',
				items: apiItems,
			}

			const response = await createQuotation(payload)

			if (response.status === 200) {
				toast.success('Quotation Created Successfully')
				setQuotationData(formData)
				setQuotationPlanData(plansData)
				setDownloadBtn(true)
				const due = payload.net_amount - 0
				setDueAmount(due.toString())
				setIsSubmitting(false)
				setTimeout(() => generatePDF(formData.name), 1000)
			} else {
				toast.error(response.message || 'Failed to create quotation')
				setIsSubmitting(false)
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
			setIsSubmitting(false)
		}
	}

	const generatePDF = async (name: string): Promise<void> => {
		const quotationContent = document.getElementById('quotationContent')
		if (quotationContent) {
			const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
			const margin = 10
			const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
			const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin
			html2canvas(quotationContent, { scale: 2, useCORS: true }).then((canvas) => {
				const imgData = canvas.toDataURL('image/jpeg', 1)
				doc.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight)
				doc.save(`${name || 'demoName'}.pdf`)
			})
		}
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
		if (queryParams.get('edit') !== 'true') {
			// Brand new record logic: Extract mobile, name, email, city from queryParams if available
			const mobileParam = queryParams.get('mobile')
			const nameParam = queryParams.get('name')
			const emailParam = queryParams.get('email')
			const cityParam = queryParams.get('city')

			if (mobileParam || nameParam) {
				// Clean placeholder values like '-' or 'N/A' — treat them as empty
				const cleanName = nameParam && nameParam !== '-' && nameParam !== 'N/A' ? nameParam : ''
				const cleanEmail =
					emailParam && emailParam !== '-' && emailParam !== 'N/A' && emailParam !== 'undefined'
						? emailParam
						: ''
				setPersonalDetails((prev) => ({
					...prev,
					client_name: cleanName,
					mobile: mobileParam || '',
					email: cleanEmail,
					billing_city: cityParam || '',
				}))
			}
			return
		}

		const id = queryParams.get('id')
		const isPitchPendingMode = queryParams.get('pitchPending') === 'true'

		if (!id) return

		setRecordId(id)
		setLatestCallHistoryId(null)
		setIsEditMode(true)
		setIsPitchReportPending(isPitchPendingMode)

		const fetchData = async (): Promise<void> => {
			try {
				const response = await GetGnFollowUpReport({ id })
				if (response.status === 200 && response.data && response.data.length > 0) {
					const data = response.data[0]
					const latestCall = data.callHistory?.[data.callHistory.length - 1] || {}
					// pitchPending mode: update the EXISTING call entry
					// Add Follow Up mode: null so the first section saved creates a NEW callHistory entry
					setLatestCallHistoryId(isPitchPendingMode ? latestCall?._id || null : null)

					const isSampleSelectionSkipped = latestCall.sampleSelection?.is_skipped || false
					const isSampleUpdateSkipped = latestCall.sampleUpdate?.is_skipped || false

					const hasPersonalDetails = Boolean(
						data.personalDetails?.client_name || data.personalDetails?.mobile
					)
					const hasAddressDetails = Boolean(
						data.personalDetails?.address?.address_line_1 || data.personalDetails?.address?.city
					)
					const hasProductDetails = Boolean(
						latestCall.productDetails &&
							(latestCall.productDetails.budget ||
								latestCall.productDetails.product_type?.length ||
								latestCall.productDetails.experience ||
								latestCall.productDetails.total_amount ||
								latestCall.productDetails.remarks)
					)
					const hasSampleSelection =
						isSampleSelectionSkipped || latestCall.sampleSelection?.sample_interested !== undefined
					const hasSampleUpdate = Boolean(
						isSampleUpdateSkipped || latestCall.sampleUpdate?.sample_taste_feedback
					)

					setSectionDisabled({
						personalDetails: hasPersonalDetails,
						addressDetails: hasAddressDetails,
						productDetails: hasProductDetails,
						sampleSelection: hasSampleSelection,
						sampleUpdate: hasSampleUpdate,
						pitchReport: false,
					})

					setSectionSkipped({
						sampleSelection: isSampleSelectionSkipped,
						sampleUpdate: isSampleUpdateSkipped,
					})

					setPersonalDetails({
						client_name: data.personalDetails?.client_name || '',
						mobile: data.personalDetails?.mobile || '',
						email: data.personalDetails?.email || '',
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
						remarks: latestCall.productDetails?.remarks || '',
						total_amount: latestCall.productDetails?.total_amount || '',
						additional_note: data.personalDetails?.additional_note || '',
					})

					if (latestCall.sampleSelection?.sample_interested !== undefined) {
						setSampleInterested(latestCall.sampleSelection.sample_interested ? 'Yes' : 'No')
						setSampleInterestedRemarks(latestCall.sampleSelection.sample_interested_remarks || '')
					}
					setSelectedSamples(latestCall.sampleSelection?.selected_samples || [])

					if (hasSampleUpdate) {
						setSampleUpdate(latestCall.sampleUpdate?.sample_taste_feedback || '')
						setNegotiationRemarks(latestCall.sampleUpdate?.sample_taste_remarks || '')
						setSampleFinalFollowUpDate(
							latestCall.sampleUpdate?.final_follow_up_date
								? new Date(latestCall.sampleUpdate.final_follow_up_date).toISOString().split('T')[0]
								: ''
						)
						setSampleFinalRemarks(latestCall.sampleUpdate?.final_remarks || '')
					} else {
						setSampleUpdate('')
						setNegotiationRemarks('')
						setSampleFinalFollowUpDate('')
						setSampleFinalRemarks('')
					}

					if (data.personalDetails?.address?.country) {
						await fetchStates(data.personalDetails.address.country)
						if (data.personalDetails.address.state) {
							await fetchCities(
								data.personalDetails.address.country,
								data.personalDetails.address.state
							)
						}
					}
				} else if (
					response.status === 400 &&
					response.message?.toLowerCase().includes('call history')
				) {
					toast('No call history found - report will be saved without call history', {
						icon: 'ℹ️',
						duration: 4000,
					})
				}
			} catch (error: any) {
				if (
					error?.response?.status === 400 &&
					error?.response?.data?.message?.toLowerCase().includes('call history')
				) {
					toast('No call history found - report will be saved without call history', {
						icon: 'ℹ️',
						duration: 4000,
					})
				} else {
					toast.error('Failed to load existing data')
				}
			}
		}

		fetchData()

		setTimeout(() => {
			document.getElementById('kt_personal_details')?.classList.add('show')
			document.getElementById('kt_pitch_report')?.classList.add('show')
		}, 100)
	}, [location])

	const renderAdditionalNoteFields = () => {
		if (!personalDetails.additional_note) return null
		return (
			<div className='col-md-12 mb-7'>
				<div className='card bg-light-primary border border-primary border-dashed rounded p-5'>
					<h5 className='text-primary fw-bold mb-3'>Lead Answers / Additional Notes</h5>
					<div className='d-flex flex-column gap-2'>
						{personalDetails.additional_note.split(' | ').map((note: string, index: number) => {
							const [key, ...values] = note.split(':')
							const val = values.join(':').trim()
							if (!key) return null
							return (
								<div
									key={index}
									className='d-flex align-items-start'>
									<span className='bullet bullet-dot bg-primary me-2 mt-2'></span>
									<div>
										<span className='fw-bold text-gray-800 me-2'>{key.trim()}:</span>
										<span className='text-gray-600'>{val || '-'}</span>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}

	const handleCreateReport = async (): Promise<void> => {
		try {
			setIsSubmitting(true)
			const payload = {
				personalDetails: {
					client_name: personalDetails.client_name,
					mobile: personalDetails.mobile,
					email: personalDetails.email,
					address: {
						address_line_1: personalDetails.billing_address_line_1,
						city: personalDetails.billing_city,
						state: personalDetails.billing_state,
						country: personalDetails.billing_country,
						pin_code: personalDetails.billing_pin_code,
					},
					additional_note: personalDetails.additional_note,
				},
				callHistory: [
					{
						callDate: new Date(),
						returnFrom: 'Product Details',
						productDetails: {
							products: personalDetails.products,
							interested: personalDetails.interested === 'Yes',
							experience: personalDetails.experience,
							brochure_sent: personalDetails.brochure_sent === 'Yes',
							remarks: personalDetails.remarks,
							total_amount: personalDetails.total_amount,
						},
					},
				],
			}

			const response = await CreateGnFollowUpReport(payload)

			if (response.status === 201 || response.status === 200) {
				toast.success('Personal Details & Product Details saved successfully')
				const data = Array.isArray(response.data) ? response.data[0] : response.data
				setRecordId(data?._id || data?.id)
				if (data?.callHistory && data.callHistory.length > 0) {
					const latestCall = data.callHistory[data.callHistory.length - 1]
					setLatestCallHistoryId(latestCall._id || latestCall.id || null)
				}
				setIsEditMode(true)
				setSectionDisabled((prev) => ({
					...prev,
					personalDetails: true,
					productDetails: true,
				}))
				setFormData((prev) => ({
					...prev,
					name: personalDetails.client_name,
					mobile: personalDetails.mobile,
					billing_address: `${personalDetails.billing_address_line_1}${
						personalDetails.billing_city ? ', ' + personalDetails.billing_city : ''
					}`,
				}))
				document.getElementById('kt_personal_details')?.classList.remove('show')
				document.getElementById('kt_interested_sample')?.classList.add('show')
			} else {
				toast.error(response.message || 'Failed to create report')
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSkipSection = async (section: keyof SectionDisabled): Promise<void> => {
		if (!recordId) {
			toast.error('Please complete Personal Details first')
			return
		}

		try {
			setIsSubmitting(true)
			let response: any
			const query = { id: recordId, callHistoryId: latestCallHistoryId || undefined }

			switch (section) {
				case 'sampleSelection':
					response = await UpdateSampleSelection(query, { sampleSelection: { is_skipped: true } })
					break
				case 'sampleUpdate':
					response = await UpdateSampleUpdate(query, { sampleUpdate: { is_skipped: true } })
					break
				default:
					return
			}

			if (response.status === 200) {
				toast.success(`${section.replace(/([A-Z])/g, ' $1').trim()} skipped`)
				setSectionDisabled((prev) => ({ ...prev, [section]: true }))
				setSectionSkipped((prev) => ({ ...prev, [section]: true }))

				// Move to next accordion
				if (section === 'sampleSelection') {
					document.getElementById('kt_interested_sample')?.classList.remove('show')
					document.getElementById('kt_sample_update_negotiation')?.classList.add('show')
				} else if (section === 'sampleUpdate') {
					document.getElementById('kt_sample_update_negotiation')?.classList.remove('show')
					document.getElementById('kt_pitch_report')?.classList.add('show')
				}
			} else {
				toast.error(response.message || 'Failed to skip section')
			}
		} catch (error: any) {
			console.error('Skip Error:', error)
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateProductDetails = async (): Promise<boolean> => {
		if (!recordId) {
			toast.error('No record ID found')
			return false
		}
		try {
			setIsSubmitting(true)
			const response = await UpdateProductDetails(
				{
					id: recordId,
					...(latestCallHistoryId ? { callHistoryId: latestCallHistoryId } : {}),
				},
				{
					personalDetails: {
						client_name: personalDetails.client_name,
						mobile: personalDetails.mobile,
						email: personalDetails.email,
						address: {
							address_line_1: personalDetails.billing_address_line_1,
							city: personalDetails.billing_city,
							state: personalDetails.billing_state,
							country: personalDetails.billing_country,
							pin_code: personalDetails.billing_pin_code,
						},
						additional_note: personalDetails.additional_note,
					},
					productDetails: {
						products: personalDetails.products,
						interested: personalDetails.interested === 'Yes',
						experience: personalDetails.experience,
						brochure_sent: personalDetails.brochure_sent === 'Yes',
						remarks: personalDetails.remarks,
						total_amount: personalDetails.total_amount,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Product details saved successfully!')
				const data = Array.isArray(response.data) ? response.data[0] : response.data
				if (data?.callHistory) {
					const latestCall = data.callHistory[data.callHistory.length - 1]
					setLatestCallHistoryId(latestCall._id || latestCall.id || latestCallHistoryId)
				}
				setSectionDisabled((prev) => ({
					...prev,
					personalDetails: true,
					productDetails: true,
				}))
				return true
			} else {
				toast.error(response.message || 'Failed to update')
				return false
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
			return false
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateSampleSelection = async (): Promise<boolean> => {
		if (!recordId) {
			toast.error('No record ID found')
			return false
		}
		try {
			setIsSubmitting(true)
			const response = await UpdateSampleSelection(
				{
					id: recordId,
					...(latestCallHistoryId ? { callHistoryId: latestCallHistoryId } : {}),
				},
				{
					sampleSelection: {
						sample_interested: sampleInterested === 'Yes',
						sample_interested_remarks: sampleInterestedRemarks,
						selected_samples: selectedSamples,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Sample selection saved successfully!')
				const data = Array.isArray(response.data) ? response.data[0] : response.data
				if (data?.callHistory) {
					const latestCall = data.callHistory[data.callHistory.length - 1]
					setLatestCallHistoryId(latestCall._id || latestCall.id || latestCallHistoryId)
				}
				setSectionDisabled((prev) => ({ ...prev, sampleSelection: true }))
				return true
			} else {
				toast.error(response.message || 'Failed to update')
				return false
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
			return false
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateSampleUpdate = async (): Promise<boolean> => {
		if (isPastDate(sampleFinalFollowUpDate)) {
			toast.error('Follow-up date cannot be in the past')
			return false
		}

		if (!recordId) {
			toast.error('No record ID found')
			return false
		}
		try {
			setIsSubmitting(true)
			const response = await UpdateSampleUpdate(
				{
					id: recordId,
					...(latestCallHistoryId ? { callHistoryId: latestCallHistoryId } : {}),
				},
				{
					sampleUpdate: {
						sample_taste_feedback: sampleUpdate,
						sample_taste_remarks: negotiationRemarks,
						final_follow_up_date: sampleFinalFollowUpDate
							? new Date(sampleFinalFollowUpDate)
							: null,
						final_remarks: sampleFinalRemarks,
					},
				}
			)
			if (response.status === 200) {
				toast.success('Sample update saved successfully!')
				const data = Array.isArray(response.data) ? response.data[0] : response.data
				if (data?.callHistory) {
					const latestCall = data.callHistory[data.callHistory.length - 1]
					setLatestCallHistoryId(latestCall._id || latestCall.id || latestCallHistoryId)
				}
				setSectionDisabled((prev) => ({ ...prev, sampleUpdate: true }))
				document.getElementById('kt_sample_update_negotiation')?.classList.remove('show')
				document.getElementById('kt_pitch_report')?.classList.add('show')
				return true
			} else {
				toast.error(response.message || 'Failed to update')
				return false
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
			return false
		} finally {
			setIsSubmitting(false)
		}
	}

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
				navigate(getBackUrl())
			} else {
				toast.error(response.message || 'Failed to save pitch report')
			}
		} catch (error: unknown) {
			toast.error(error instanceof Error ? error.message : 'Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleNextFromPersonalDetails = async (): Promise<void> => {
		if (!recordId && !isEditMode) {
			await handleCreateReport()
		} else if (recordId) {
			const success = await handleUpdateProductDetails()
			if (success) {
				setFormData((prev) => ({
					...prev,
					name: personalDetails.client_name,
					mobile: personalDetails.mobile,
					billing_address: `${personalDetails.billing_address_line_1}${
						personalDetails.billing_city ? ', ' + personalDetails.billing_city : ''
					}`,
				}))
				document.getElementById('kt_personal_details')?.classList.remove('show')
				document.getElementById('kt_interested_sample')?.classList.add('show')
			}
		}
	}

	const handleNextFromSampleSelection = async (): Promise<void> => {
		if (recordId) {
			const success = await handleUpdateSampleSelection()
			if (success) {
				document.getElementById('kt_interested_sample')?.classList.remove('show')
				document.getElementById('kt_sample_update_negotiation')?.classList.add('show')
			}
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Follow Up Report</PageTitle>

			{/* Breadcrumb */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/follow-up-report-list'>Follow-Up Reports</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Add Follow-Up Record</span>
			</div>

			{/* Header */}
			<div className='gz-mgmt-header mb-6'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Add Follow-Up Report</h1>
					<p className='gz-mgmt-subtitle'>
						Capture customer requirements, sample allocations, negotiation remarks, and quotation details.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link to='/rag/follow-up-report-list' className='gz-mgmt-btn-secondary'>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Leads</span>
					</Link>
				</div>
			</div>

			<div className='col-12'>
				{/* Personal Details */}
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
						className={`collapse ${sectionDisabled.personalDetails ? 'show' : ''}`}>
						<div className='section-body'>
							{renderAdditionalNoteFields()}
							<div className='field-group-title'>
								<i className='bi bi-person'></i>Basic Information
							</div>

							<div className='row'>
								<InputField
									placeholder='Enter Client Name'
									type='text'
									className='col-md-4 fv-row'
									name='client_name'
									label='Client Name'
									htmlFor='client_name'
									value={personalDetails.client_name}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails && !isPullMarketing}
								/>
								<InputField
									placeholder='Enter Mobile Number'
									type='text'
									className='col-md-4 fv-row'
									name='mobile'
									label='Mobile Number'
									htmlFor='mobile'
									value={personalDetails.mobile}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails}
								/>
								<InputField
									placeholder='Enter Email Address'
									type='email'
									className='col-md-4 fv-row'
									name='email'
									label='Email Address'
									htmlFor='email'
									value={personalDetails.email}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.personalDetails && !isPullMarketing}
								/>
							</div>

							<div className='row'>
								<SelectField
									label='Country'
									name='billing_country'
									className='col-md-4 fv-row'
									htmlFor='billing_country'
									value={personalDetails.billing_country}
									onChange={handlePersonalDetailsChange}
									options={[
										loadingCountries ? 'Loading...' : 'Select',
										...countries.map((c) => c.name),
									]}
									disabled={sectionDisabled.addressDetails}
								/>
								<SelectField
									label='State'
									name='billing_state'
									className='col-md-4 fv-row'
									htmlFor='billing_state'
									value={personalDetails.billing_state}
									onChange={handlePersonalDetailsChange}
									options={[loadingStates ? 'Loading...' : 'Select', ...states.map((s) => s.name)]}
									disabled={sectionDisabled.addressDetails}
								/>
								<SelectField
									label='City'
									name='billing_city'
									className='col-md-4 fv-row'
									htmlFor='billing_city'
									value={personalDetails.billing_city}
									onChange={handlePersonalDetailsChange}
									options={[loadingCities ? 'Loading...' : 'Select', ...cities.map((c) => c.name)]}
									disabled={sectionDisabled.addressDetails}
								/>
								<InputField
									placeholder='Enter Address'
									type='text'
									className='col-md-8 fv-row'
									name='billing_address_line_1'
									label='Address'
									htmlFor='billing_address_line_1'
									value={personalDetails.billing_address_line_1}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.addressDetails}
								/>
								<InputField
									placeholder='Enter Pin Code'
									type='text'
									className='col-md-4 fv-row'
									name='billing_pin_code'
									label='Pin Code'
									htmlFor='billing_pin_code'
									value={personalDetails.billing_pin_code}
									onChange={handlePersonalDetailsChange}
									disabled={sectionDisabled.addressDetails}
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
										{personalDetails.products.length > 1 && (
											<button
												type='button'
												className='btn btn-icon btn-sm btn-light-danger'
												onClick={() =>
													!sectionDisabled.productDetails && handleRemoveProduct(index)
												}
												disabled={sectionDisabled.productDetails}>
												<i className='bi bi-trash fs-4'></i>
											</button>
										)}
									</div>
									<div className='row'>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Product Type</label>
											<select
												className='form-select inputfield-bg'
												value={product.product_type}
												onChange={(e) => handleProductChange(index, 'product_type', e.target.value)}
												disabled={sectionDisabled.productDetails}>
												<option value=''>Select Type</option>
												{productTypeOptions.map((opt) => (
													<option
														key={opt.value}
														value={opt.value}>
														{opt.label}
													</option>
												))}
											</select>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Product Flavour</label>
											<input
												type='text'
												className='form-control inputfield-bg'
												placeholder='Enter Flavour'
												value={product.product_flavour}
												onChange={(e) =>
													handleProductChange(index, 'product_flavour', e.target.value)
												}
												disabled={sectionDisabled.productDetails}
											/>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Weight</label>
											<div className='d-flex gap-2'>
												<input
													type='text'
													className='form-control inputfield-bg'
													placeholder='Enter Weight'
													value={product.weight}
													onChange={(e) => handleProductChange(index, 'weight', e.target.value)}
													disabled={sectionDisabled.productDetails}
												/>
												<select
													className='form-select inputfield-bg w-100px'
													value={product.weight_unit}
													onChange={(e) =>
														handleProductChange(index, 'weight_unit', e.target.value)
													}
													disabled={sectionDisabled.productDetails}>
													<option value='kg'>kg</option>
													<option value='g'>g</option>
													<option value='lbs'>lbs</option>
												</select>
											</div>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Quantity</label>
											<input
												type='number'
												className='form-control inputfield-bg'
												placeholder='Enter Quantity'
												value={product.quantity}
												onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
												disabled={sectionDisabled.productDetails}
											/>
										</div>
										<div className='col-md-4 fv-row mb-4'>
											<label className='form-label fw-bolder text-dark fs-6'>Budget</label>
											<div className='budget-input-wrapper'>
												<span className='currency-symbol'>₹</span>
												<input
													type='text'
													className='form-control inputfield-bg'
													placeholder='Enter Budget'
													name='budget'
													value={product.budget}
													onChange={(e) => handleProductChange(index, 'budget', e.target.value)}
													disabled={sectionDisabled.productDetails}
												/>
											</div>
										</div>
										{index === personalDetails.products.length - 1 && (
											<div className='col-md-4 mb-4'>
												<label className='form-label d-block'>&nbsp;</label>
												<button
													type='button'
													className='btn btn-sm btn-light-primary fw-bolder w-100 py-3'
													onClick={handleAddProduct}
													disabled={sectionDisabled.productDetails}>
													<i className='bi bi-plus-lg me-2'></i>Add Product
												</button>
											</div>
										)}
									</div>
								</div>
							))}

							<div className='row mt-2 mb-8 ms-0'>
								<div className='col-md-4 fv-row'>
									<label className='form-label fw-bolder text-dark fs-6'>Total Amount</label>
									<div className='budget-input-wrapper'>
										<span className='currency-symbol'>₹</span>
										<input
											type='text'
											className='form-control inputfield-bg'
											placeholder='Enter Total Amount'
											name='total_amount'
											value={personalDetails.total_amount}
											onChange={handlePersonalDetailsChange}
											disabled={sectionDisabled.productDetails}
										/>
									</div>
								</div>
							</div>

							<div className='divider-line'></div>
							<div className='field-group-title'>
								<i className='bi bi-star'></i>Interest & Experience
							</div>

							<div className='row'>
								{(['Yes', 'No'] as const).map((option) => null)}
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
												onClick={() =>
													!sectionDisabled.productDetails &&
													setPersonalDetails((prev) => ({
														...prev,
														interested: option,
													}))
												}
												style={{
													pointerEvents: sectionDisabled.productDetails ? 'none' : 'auto',
													opacity: sectionDisabled.productDetails ? 0.6 : 1,
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
													onClick={() =>
														!sectionDisabled.productDetails &&
														setPersonalDetails((prev) => ({
															...prev,
															experience: option,
														}))
													}
													style={{
														pointerEvents: sectionDisabled.productDetails ? 'none' : 'auto',
														opacity: sectionDisabled.productDetails ? 0.6 : 1,
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
												onClick={() =>
													!sectionDisabled.productDetails &&
													setPersonalDetails((prev) => ({
														...prev,
														brochure_sent: option,
													}))
												}
												style={{
													pointerEvents: sectionDisabled.productDetails ? 'none' : 'auto',
													opacity: sectionDisabled.productDetails ? 0.6 : 1,
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
										placeholder='Enter short note / remarks about the client...'
										name='remarks'
										value={personalDetails.remarks}
										onChange={handlePersonalDetailsChange}
										disabled={sectionDisabled.productDetails}
									/>
								</div>
							</div>

							<div className='d-flex justify-content-end mt-2'>
								{(!sectionDisabled.personalDetails || !sectionDisabled.productDetails) && (
									<button
										type='button'
										className='btn btn-primary btn-sm fw-bold'
										disabled={isSubmitting}
										onClick={handleNextFromPersonalDetails}>
										{isSubmitting ? 'Saving...' : 'Next'}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/*  Sample Selection */}
				{!isPitchReportPending && (
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
									{sectionSkipped.sampleSelection && (
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
								className={`collapse ${sectionDisabled.sampleSelection ? 'show' : ''}`}>
								<div className='section-body'>
									<div className='field-group-title'>
										<i className='bi bi-star'></i>Client Interest
									</div>

									<div className='row'>
										<div className='col-md-4 fv-row mb-7'>
											<label className='form-label fw-bolder text-dark fs-6 mb-3'>
												Interested?
											</label>
											<div className='d-flex gap-3'>
												{(['Yes', 'No'] as string[]).map((option) => (
													<div
														key={option}
														className={`radio-card ${
															sampleInterested === option
																? option === 'Yes'
																	? 'active-yes'
																	: 'active-no'
																: ''
														}`}
														onClick={() =>
															!sectionDisabled.sampleSelection && setSampleInterested(option)
														}
														style={{
															pointerEvents: sectionDisabled.sampleSelection ? 'none' : 'auto',
															opacity: sectionDisabled.sampleSelection ? 0.6 : 1,
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
												{sectionDisabled.sampleSelection
													? 'Sample Products'
													: 'Select Sample Products to Send'}
											</div>
											<div className='d-flex gap-3 flex-wrap'>
												{sampleProductOptions.map((sample) => {
													const isSelected = selectedSamples.includes(sample.value)
													return (
														<div
															key={sample.value}
															className={`product-type-card ${isSelected ? 'active' : ''}`}
															onClick={() =>
																!sectionDisabled.sampleSelection && handleSampleToggle(sample.value)
															}
															style={{
																pointerEvents: sectionDisabled.sampleSelection ? 'none' : 'auto',
																opacity: sectionDisabled.sampleSelection ? 0.6 : 1,
															}}>
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
											{!sectionDisabled.sampleSelection && (
												<div className='multi-select-hint'>
													<i className='bi bi-info-circle'></i>Select samples to send to interested
													clients
												</div>
											)}

											<div className='row mt-5'>
												<div className='col-md-12 fv-row mb-7'>
													<label className='form-label fw-bolder text-dark fs-6 mb-3'>
														Remarks
													</label>
													<textarea
														className='remarks-textarea'
														rows={3}
														placeholder='Enter short note / remarks about the client...'
														value={sampleInterestedRemarks}
														onChange={(e) => setSampleInterestedRemarks(e.target.value)}
														disabled={sectionDisabled.sampleSelection}
													/>
												</div>
											</div>
										</div>
									)}

									{!sectionDisabled.sampleSelection && (
										<div className='d-flex justify-content-end mt-4 gap-3'>
											<button
												type='button'
												className='btn btn-secondary btn-sm fw-bold'
												disabled={isSubmitting}
												onClick={() => handleSkipSection('sampleSelection')}>
												{isSubmitting ? 'Skipping...' : 'Skip'}
											</button>
											<button
												type='button'
												className='btn btn-primary btn-sm fw-bold'
												disabled={isSubmitting}
												onClick={handleNextFromSampleSelection}>
												{isSubmitting ? 'Saving...' : 'Next'}
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/*  Sample Update  */}
				{!isPitchReportPending && (
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
									{sectionSkipped.sampleUpdate && (
										<span className='ms-3 badge badge-light-danger fw-bold'>Skipped</span>
									)}
								</h3>
								<FontAwesomeIcon
									icon={faAngleDown}
									className='fs-4 text-muted'
								/>
							</div>

							<div
								id='kt_sample_update_negotiation'
								className={`collapse ${sectionDisabled.sampleUpdate ? 'show' : ''}`}>
								<div className='section-body'>
									<div className='field-group-title'>
										<i className='bi bi-clipboard-check'></i>Sample Taste Update
									</div>

									<div className='row'>
										<SelectField
											className='col-md-12 fv-row mb-7'
											label='Sample Taste Feedback'
											name='sample_taste_feedback'
											value={sampleUpdate}
											onChange={(e) => setSampleUpdate(e.target.value)}
											htmlFor='sample_taste_feedback'
											options={sampleTasteFeedbackOptions}
											disabled={sectionDisabled.sampleUpdate}
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
												placeholder='Enter negotiation details, pricing discussion, objections...'
												value={negotiationRemarks}
												onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
													setNegotiationRemarks(e.target.value)
												}
												disabled={sectionDisabled.sampleUpdate}
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
												placeholder='Enter final conversation notes, deal closure details, or reasons for rejection...'
												value={sampleFinalRemarks}
												onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
													setSampleFinalRemarks(e.target.value)
												}
												disabled={sectionDisabled.sampleUpdate}
											/>
										</div>
									</div>

									{!sectionDisabled.sampleUpdate && (
										<div className='d-flex justify-content-end mt-4 gap-3'>
											<button
												type='button'
												className='btn btn-secondary btn-sm fw-bold'
												disabled={isSubmitting}
												onClick={() => handleSkipSection('sampleUpdate')}>
												{isSubmitting ? 'Skipping...' : 'Skip'}
											</button>
											<button
												type='button'
												className='btn btn-primary btn-sm fw-bold'
												disabled={isSubmitting}
												onClick={async () => {
													if (recordId) await handleUpdateSampleUpdate()
													else toast.error('Please complete Personal Details first')
												}}>
												{isSubmitting ? 'Saving...' : 'Next'}
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/*  Pitch Report  */}
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
						className={`collapse ${sectionDisabled.pitchReport ? 'show' : ''}`}>
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
										setPitchReport((prev) => ({
											...prev,
											objections: e.target.value,
										}))
									}
								/>
							</div>

							<div className='d-flex justify-content-end'>
								<button
									type='button'
									className='btn btn-primary btn-sm fw-bold'
									disabled={isSubmitting}
									onClick={async () => {
										if (recordId) await handleSavePitchReport()
										else toast.error('Please complete Personal Details first')
									}}>
									{isSubmitting ? 'Saving...' : 'Save Report'}
								</button>
							</div>
						</div>
					</div>
				</div>

				{/*  Create Quotation  */}
				{!isPitchReportPending && (
					<>
						<div className='card section-card'>
							<div
								className='section-header'
								role='button'
								data-bs-toggle='collapse'
								data-bs-target='#kt_oder_view_pitch_report_quotation'>
								<h3>
									<span
										className='header-icon'
										style={{ background: '#fff8ea', color: '#ffc107' }}>
										<i className='bi bi-receipt'></i>
									</span>
									Create Quotation
								</h3>
								<FontAwesomeIcon
									icon={faAngleDown}
									className='fs-4 text-muted'
								/>
							</div>

							<div
								id='kt_oder_view_pitch_report_quotation'
								className='collapse'>
								<div className='section-body'>
									<form>
										<div className='row'>
											<InputField
												className='col-md-6 fv-row'
												label='Date'
												placeholder='Date'
												type='date'
												name='date'
												htmlFor='date'
												value={formData.date}
												onChange={handleInputChange}
											/>
											<SelectField
												className='col-md-6 fv-row mb-7'
												label='Branch Name'
												name='branch_name'
												value={formData.branch_name}
												onChange={handleInputChange}
												htmlFor='txt_company'
												options={['Adajan', 'Katargam']}
											/>
											<InputField
												className='col-md-3 fv-row'
												label='Full Name'
												placeholder='Enter Full Name'
												type='text'
												name='name'
												htmlFor='name'
												value={formData.name}
												onChange={handleInputChange}
											/>
											<InputField
												className='col-md-3 fv-row'
												label='Address'
												placeholder='Enter Address'
												type='text'
												name='billing_address'
												htmlFor='billing_address'
												value={formData.billing_address}
												onChange={handleInputChange}
											/>
											<InputField
												className='col-md-3 fv-row'
												label='Phone No.'
												placeholder='Enter Phone No.'
												type='text'
												name='mobile'
												htmlFor='mobile'
												value={formData.mobile}
												onChange={handleInputChange}
											/>
											<InputField
												className='col-md-3 fv-row'
												label='Email'
												placeholder='Enter Email'
												type='email'
												name='email'
												htmlFor='email'
												value={formData.email}
												onChange={handleInputChange}
											/>

											<div className='divider-line'></div>
											<div className='field-group-title'>
												<i className='bi bi-box-seam'></i>Supplements
											</div>

											{plans.map((plan, index) => (
												<div
													key={index}
													className='col-12 mb-5'>
													<div
														className='row'
														style={{
															border: '2px solid #f1f3f9',
															borderRadius: '12px',
															backgroundColor: '#fafbff',
															padding: '8px 0',
														}}>
														<div className='col-11 row py-3 pb-0'>
															<SelectField
																className='col-md-2 fv-row mb-7'
																label='Product Type'
																name='item_type'
																value={plan.item_type || ''}
																onChange={(e) => handlePlanInputChange(index, e)}
																htmlFor='item_type'
																options={[
																	'Peanut butter',
																	'Mass gainer',
																	'Whey protein',
																	'Eaa',
																	'Bcaa',
																	'Pre-workout',
																	'Creatine',
																	'Energy drink',
																]}
															/>
															<InputField
																className='col-md-6 fv-row'
																label='Product'
																placeholder='Enter Product'
																type='text'
																name='items'
																htmlFor='items'
																value={plan.items}
																onChange={(e) => handlePlanInputChange(index, e)}
															/>

															<div className='col-md-4 fv-row mb-7'>
																<label className='fw-bold fs-6 mb-md-5 mb-2'>Weight</label>
																<div className='d-flex align-items-center'>
																	<input
																		type='number'
																		name='item_weight'
																		value={plan.item_weight || ''}
																		onChange={(e) => handlePlanInputChange(index, e)}
																		placeholder='Enter Weight'
																		className='form-control rounded-end-0 border-end-0 inputfield-bg'
																		style={{
																			borderTopRightRadius: 0,
																			borderBottomRightRadius: 0,
																			borderRight: 'none',
																		}}
																	/>
																	<select
																		name='item_weight_type'
																		value={plan.item_weight_type || 'kg'}
																		onChange={(e) => handlePlanInputChange(index, e)}
																		className='form-select rounded-start-0'
																		style={{
																			borderTopLeftRadius: 0,
																			borderBottomLeftRadius: 0,
																			width: 'auto',
																			minWidth: '80px',
																		}}>
																		<option value='gm'>gm</option>
																		<option value='kg'>kg</option>
																		<option value='ml'>ml</option>
																		<option value='ltr'>ltr</option>
																	</select>
																</div>
															</div>

															<InputField
																className='col-md-4 fv-row'
																label='Rate'
																placeholder='Enter Rate'
																type='text'
																name='amount'
																htmlFor='amount'
																value={plan.amount || ''}
																onChange={(e) => handlePlanInputChange(index, e)}
															/>
															<InputField
																className='col-md-4 fv-row'
																label='Quantity'
																placeholder='Enter Quantity'
																type='text'
																name='quantity'
																htmlFor='quantity'
																value={plan.quantity || ''}
																onChange={(e) => handlePlanInputChange(index, e)}
															/>
															<InputField
																className='col-md-4 fv-row'
																label='Amount'
																placeholder='Amount'
																type='text'
																name='totalPayment'
																htmlFor='totalPayment'
																value={String(
																	(Number(plan.amount) || 0) * (Number(plan.quantity) || 0)
																)}
																disabled
															/>
															<InputField
																className='col-md-4 fv-row'
																label='GST'
																placeholder='GST'
																type='number'
																name='gst'
																htmlFor='gst'
																value={plan.gst || ''}
																onChange={(e) => handlePlanInputChange(index, e)}
															/>

															<div className='col-md-4 fv-row'>
																<div className='d-flex align-items-center mb-2'>
																	<label
																		htmlFor={`discount-${index}`}
																		className='fw-bold fs-6 mb-3'>
																		Discount
																	</label>
																	<div className='form-check form-switch form-check-custom form-check-solid mb-2 ms-2'>
																		<input
																			className='form-check-input w-25px h-15px'
																			type='checkbox'
																			id={`discountTypeSwitch-${index}`}
																			checked={plan.isDiscountPercentage ?? true}
																			onChange={() => handleDiscountTypeToggle(index)}
																		/>
																		<label
																			className='form-check-label fw-bold fs-8 ms-1'
																			htmlFor={`discountTypeSwitch-${index}`}>
																			{plan.isDiscountPercentage ?? true ? '(%)' : '(₹)'}
																		</label>
																	</div>
																</div>
																<input
																	type='number'
																	className='form-control inputfield-bg'
																	id={`discount-${index}`}
																	name='discount'
																	placeholder={`Discount in ${
																		plan.isDiscountPercentage ?? true ? 'percentage' : 'rupees'
																	}`}
																	value={plan.discount || ''}
																	onChange={(e) => handlePlanInputChange(index, e)}
																/>
															</div>

															<InputField
																className='col-md-4 fv-row'
																label='Total'
																placeholder='Total'
																type='text'
																name='totalPayment'
																htmlFor='totalPayment'
																value={plan.totalPayment || ''}
																disabled
															/>
														</div>

														<div className='col-1'>
															<div className='mt-17 d-flex justify-content-end'>
																<button
																	className='btn btn-icon btn-light-danger btn-sm'
																	onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
																		removePlan(index, e)
																	}>
																	<i className='bi bi-trash fs-3'></i>
																</button>
															</div>
														</div>
													</div>
												</div>
											))}

											<div className='col-12 my-3 d-flex justify-content-end'>
												<button
													className='btn btn-primary btn-sm gap-2 mx-2 me-1'
													onClick={addPlan}>
													<i className='bi bi-plus-lg me-1'></i>Add Product
												</button>
											</div>

											<div className='divider-line'></div>
											<div className='col-12 row'>
												<InputField
													className='col-md-3 fv-row'
													label='Total Amount'
													placeholder='Enter Total Amount'
													type='text'
													name='net_amount'
													htmlFor='net_amount'
													value={formData.net_amount || ''}
													onChange={handleInputChange}
												/>
											</div>

											<div className='col-md-12 fv-row mb-7'>
												<div className='d-flex justify-content-end gap-3'>
													<button
														type='button'
														className={`btn btn-primary ${isSubmitting ? 'disabled' : ''}`}
														onClick={handleCreateQuotation}
														disabled={isSubmitting}>
														{isSubmitting ? (
															<>
																<span className='spinner-border spinner-border-sm me-2'></span>
																Downloading...
															</>
														) : (
															<>
																<i className='bi bi-download me-2'></i>
																Download Quotation
															</>
														)}
													</button>
												</div>
											</div>
										</div>
									</form>
								</div>
							</div>
						</div>

						{/* Call Script */}
						<div className='card section-card mt-5 mb-5'>
							<div
								className='section-header'
								role='button'
								data-bs-toggle='collapse'
								data-bs-target='#kt_call_script'>
								<h3>
									<span
										className='header-icon'
										style={{ background: '#eef6ff', color: '#3699ff' }}>
										<i className='bi bi-telephone-fill'></i>
									</span>
									Call Script
								</h3>
								<FontAwesomeIcon
									icon={faAngleDown}
									className='fs-4 text-muted'
								/>
							</div>

							<div
								id='kt_call_script'
								className='collapse'>
								<div className='section-body'>
									<div
										className='script-container p-5 rounded'
										style={{ backgroundColor: '#f8f9fa', fontSize: '14px', lineHeight: '1.6' }}>
										<h4 className='text-center fw-bold mb-8'>
											LIVE CALL SCRIPT – BOTH SIDE CONVERSATION (MILAN | GOMZI LIFESCIENCES)
										</h4>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-box-arrow-in-right me-2'></i>CALL START
											</h5>
											<p className='mb-2'>
												<strong>You (Milan):</strong> Hello Rajatbhai, good morning! Rajatbhai se
												baat ho rahi hai?
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Haan bol raha hu, kaun?
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Main Milan bol raha hu Gomzi Lifesciences se. Aapki
												inquiry aayi thi ki aap apna supplement brand start karna chahte ho, right?
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Haan haan, inquiry kari thi
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-search me-2'></i>BACKGROUND UNDERSTANDING
											</h5>
											<p className='mb-2'>
												<strong>You:</strong> Great Rajatbhai. Thoda aapke bare me bataye — abhi aap
												kya business kar rahe ho?
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Gym hai / Trading karta hu / New start karna hai
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Perfect Rajatbhai, agar aap fitness background me ho
												to brand grow karna aur easy ho jata hai.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-clipboard-check me-2'></i>REQUIREMENT DISCUSSION
											</h5>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, aapka plan kya hai — Apna own brand launch
												karna hai ya resale?
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Own brand launch karna hai
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Very good. Starting me approx kitna investment socha
												hai?
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> 50k / 1 lakh / dekh rahe hai
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Perfect Rajatbhai, us hisaab se main aapko proper plan
												suggest karunga.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-box-seam me-2'></i>PRODUCT PITCH
											</h5>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, Gomzi Lifesciences me hum complete
												manufacturing karte hai:
											</p>
											<ul className='mb-3 text-dark'>
												<li>Whey Protein (Concentrate, Isolate, Blend)</li>
												<li>Pre-workout (Beginner, Intermediate, Advanced)</li>
												<li>Creatine</li>
												<li>BCAA</li>
												<li>EAA</li>
											</ul>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Whey me kya options hai?
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, whey me aapko 3 main options milte hai:
											</p>
											<ul className='mb-3 text-dark'>
												<li>Concentrate (budget friendly)</li>
												<li>Isolate (premium high protein)</li>
												<li>Blend (best seller balanced)</li>
											</ul>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-cup-straw me-2'></i>FLAVOUR SELLING
											</h5>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Flavours kya milenge?
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, multiple trending flavours available hai:
											</p>
											<ul className='mb-3 text-dark'>
												<li>Chocolate, Coffee, Mango</li>
												<li>Cookies & Cream, Vanilla Caramel</li>
												<li>Coconut Caramel, Mava Kulfi (unique best seller)</li>
											</ul>
											<p className='mb-2'>
												<strong>Aur Pre-workout / BCAA / EAA me:</strong>
											</p>
											<ul className='mb-3 text-dark'>
												<li>Green Apple, Fruit Punch, Blueberry</li>
												<li>Lemon Pineapple, Kiwi, Cranberry</li>
											</ul>
											<p className='mb-2'>
												Aap apne brand ke hisaab se custom flavour bhi develop kar sakte ho.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-shield-check me-2'></i>TRUST BUILDING
											</h5>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Quality kaisi rahegi?
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, hum proper standards follow karte hai. Best
												ye rahega ki aap pehle sample try karo. Aap khud check karo, phir
												confidently brand launch karo.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-tag me-2'></i>PRICE DISCUSSION
											</h5>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Price kya rahega?
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, pricing depend karegi: <br />• Quantity
												<br />• Product type
												<br />• Packaging
											</p>
											<p className='mb-2'>
												Approx idea ke liye: Whey ₹XXX/kg se start hota hai. Exact requirement ke
												baad main proper costing share kar dunga.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-box me-2'></i>SAMPLE CLOSING
											</h5>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, main suggest karunga: Aap 2–3 whey variants
												+ 1 pre-workout + creatine ka sample try karo. Isse aapko clear idea mil
												jayega.
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Sample ka charge?
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Nominal cost hota hai + shipping. Aur jab aap order
												karte ho to adjust ho jata hai.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-x-circle me-2'></i>OBJECTION HANDLING
											</h5>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Thoda mehenga lag raha hai
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Samajh sakta hu Rajatbhai. But supplement me taste +
												result + repeat customer sabse important hai. Agar product strong hoga to
												aap easily achha margin bana sakte ho.
											</p>
											<p className='mb-2 text-muted'>
												<strong>Client:</strong> Mujhe sochna padega
											</p>
											<p className='mb-2'>
												<strong>You:</strong> Bilkul Rajatbhai. Main WhatsApp pe details bhej deta
												hu. Aap check karo, phir hum discuss kar lenge.
											</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-primary border-bottom pb-2'>
												<i className='bi bi-check-all me-2'></i>FINAL CLOSING
											</h5>
											<p className='mb-2'>
												<strong>You:</strong> Rajatbhai, main abhi aapko send karta hu: <br />•
												Product list
												<br />• Flavours
												<br />• Sample details
											</p>
											<p className='mb-2'>Aap confirm kar dena kaunsa sample bhejna hai.</p>
										</div>

										<div className='mb-6'>
											<h5 className='fw-bolder text-success border-bottom pb-2'>
												<i className='bi bi-whatsapp me-2'></i>AFTER CALL MESSAGE
											</h5>
											<p className='mb-2'>
												<strong>You (WhatsApp):</strong> Rajatbhai details send kar di hai Gomzi
												Lifesciences ki. Check karke batana kaunsa sample proceed karna hai.
											</p>
										</div>

										<div className='mt-8 p-6 bg-white border border-gray-300 rounded shadow-sm'>
											<h6 className='fw-bolder text-danger mb-4 fs-5'>FINAL STRATEGY:</h6>
											<div className='d-flex flex-column gap-3'>
												<div className='d-flex align-items-center'>
													<span className='badge badge-light-danger fs-6 me-3 py-2 px-3'>
														Step 1
													</span>{' '}
													<span className='fs-6 fw-bold'>Trust build</span>
												</div>
												<div className='d-flex align-items-center'>
													<span className='badge badge-light-danger fs-6 me-3 py-2 px-3'>
														Step 2
													</span>{' '}
													<span className='fs-6 fw-bold'>Sample close</span>
												</div>
												<div className='d-flex align-items-center'>
													<span className='badge badge-light-danger fs-6 me-3 py-2 px-3'>
														Step 3
													</span>{' '}
													<span className='fs-6 fw-bold'>Bulk order</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Quotation Preview */}
						<div
							className='col-md-6 mt-3'
							id='quotationContent'>
							<div className='card section-card'>
								<div className='card-body'>
									<p className='fw-bold fs-5 text-center mb-2'>QUOTATION</p>
									<div className='border border-black'>
										<div className='invoice-header row mt-2 p-3 align-items-start'>
											<div className='col-md-8'>
												<p className='fs-4 mb-1'>
													<b>
														{adminType === 'Store' ? 'Gomzi Nutrition ' : 'Gomzi Lifesciences LLP'}
													</b>
												</p>
												{formData.branch_name === 'Adajan' ? (
													<p
														style={{ fontSize: '12px' }}
														className='mt-1 mb-1'>
														{adminType === 'Store'
															? 'G-23-TIME SQUARE, Gaurav Path Road, TP 10 Main Rd, Surat, Gujarat, Opp. Shree Bharti Residency, Surat, Gujarat 394510'
															: '547,548, FIRST FLOOR, RJD TEXTILES PARK, Hazira Rd, Ichchhapor, PAL, Surat, Gujarat 394510'}
													</p>
												) : formData.branch_name === 'Katargam' ? (
													<p
														style={{ fontSize: '12px' }}
														className='mt-1 mb-1'>
														{adminType === 'Store'
															? 'G-23-TIME SQUARE, Gaurav Path Road, TP 10 Main Rd, Surat, Gujarat, Opp. Shree Bharti Residency, Surat, Gujarat 394510'
															: "323 3'rd floor, Laxmi Enclave-1, opp. Gajera School, Chitrakut Society, Katargam, Surat, Gujarat 395004"}
													</p>
												) : (
													<p
														style={{ fontSize: '12px' }}
														className='mb-1'>
														Address:
													</p>
												)}
												<p
													style={{ fontSize: '12px' }}
													className='mb-1'>
													Phone no.:
													<strong>
														{adminType === 'Store' ? '8866465275 / 9081091068' : '8320077993'}
													</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mb-1'>
													Email:
													<strong>
														{adminType === 'Store'
															? 'gomzinutrition.palshop@gmail.com'
															: 'Sales@Gomzilifesciences.In'}
													</strong>
												</p>
												<p
													style={{ fontSize: '12px' }}
													className='mb-1'>
													GSTIN:
													<strong>{adminType === 'Store' ? '-' : '24ABBFG3336P1Z9'}</strong>
													{adminType === 'Store' ? '' : ' , State: Gujarat'}
												</p>
											</div>
											<div className='col-md-4'>
												<div className='text-center'>
													<img
														src='/media/logos/rag-logo.webp'
														width='60%'
														alt='Company Logo'
													/>
												</div>
											</div>
										</div>

										<div className='invoice-details d-flex'>
											<div className='col-md-5 border border-black px-0'>
												<div className='quotation-bill-to border-bottom border-black'>Bill To</div>
												<strong>
													<p
														className='mt-2 px-2'
														style={{ fontSize: '14px' }}>
														{quotationData.name || '-'}
													</p>
												</strong>
												<strong>
													<p
														className='px-2'
														style={{ fontSize: '14px' }}>
														{quotationData.email || '-'}
													</p>
												</strong>
											</div>
											<div className='col-md-7 border border-black text-right'>
												<div className='bill-name-date px-2'>
													<p>
														<strong>Date :-</strong>
														<span>{quotationData.date || '-'}</span>
													</p>
													<p>
														<strong>Phone No. :-</strong>
														<span>{quotationData.mobile || '-'}</span>
													</p>
													<p>
														<strong>Address :-</strong>
														<span>{quotationData.billing_address || '-'}</span>
													</p>
												</div>
											</div>
										</div>

										<div className='invoice-items quotation-items'>
											<table className='border border-black'>
												<thead>
													<tr>
														<th className='border border-black'>Product</th>
														<th className='border border-black'>Weight</th>
														<th className='border border-black'>Rate</th>
														<th className='border border-black'>Quantity</th>
														<th className='border border-black'>Amount</th>
														<th className='border border-black'>GST</th>
														<th className='border border-black'>Dis</th>
														<th className='border border-black'>Total</th>
													</tr>
												</thead>
												<tbody>
													{quotationPlanData.length === 0 ? (
														<tr>
															{[...Array(8)].map((_, i) => (
																<td
																	key={i}
																	className='border border-black'>
																	-
																</td>
															))}
														</tr>
													) : (
														quotationPlanData.map((item: QuotationPlanType, index: number) => (
															<tr key={index}>
																<td>{item.item_name}</td>
																<td>
																	{item.item_weight
																		? `${item.item_weight} ${item.item_weight_type || ''}`
																		: '-'}
																</td>
																<td>{item.amount || '-'}</td>
																<td>{item.quantity || '-'}</td>
																<td>{Number(item.amount) * Number(item.quantity) || '-'}</td>
																<td>{item.gst ? item.gst + '%' : '-'}</td>
																<td>
																	{item.discount || '0'}
																	{item.isDiscountPercentage ?? true ? '%' : '₹'}
																</td>
																<td>{item.totalAmount || '-'}</td>
															</tr>
														))
													)}
												</tbody>
											</table>
										</div>

										<div className='invoice-details d-flex'>
											<div className='col-md-12 border border-black px-0'>
												<div className='quotation-bill-to px-2 border-bottom border-black'>
													Amount :-
												</div>
												<div className='bill-name-date px-2'>
													<p>
														<strong>Total Amount :-</strong>
														<span> {quotationData.net_amount || '-'}</span>
													</p>
												</div>
											</div>
										</div>

										<div className='invoice-details d-flex'>
											<div className='col-md-7 border border-black px-0'>
												<div className='quotation-bill-to px-2 border-bottom border-black'>
													Terms and Conditions :-
												</div>
												<div className='px-2'>
													<p
														style={{ fontSize: '13px' }}
														className='mt-1'>
														<strong>*</strong> GST will be applicable additionally on all payments.
													</p>
													<p style={{ fontSize: '13px' }}>
														<strong>*</strong> Courier charges will be borne by the customer
														additionally.
													</p>
													<p style={{ fontSize: '13px' }}>
														<strong>*</strong> Payment made is non-refundable, non-transferable, and
														non-cancellable.
													</p>
													<p style={{ fontSize: '13px' }}>
														<strong>*</strong> 70% advance payment is required to confirm the order,
														and the balance 30% payment is due upon delivery.
													</p>
												</div>
											</div>
											<div className='col-md-5 border border-black px-0'>
												<div className='quotation-bill-to px-2 border-bottom border-black'>
													Administrator :-
												</div>
												<div className='px-2'>
													<img
														src={
															adminType === 'Store'
																? '/media/sign/chirag.png'
																: '/media/sign/goutam_sir.png'
														}
														alt='sign'
														width='100%'
													/>
												</div>
											</div>
										</div>

										<div className='invoice-details d-flex'>
											<div className='col-12 border border-black px-0'>
												<div className='bill-to px-2 border-bottom border-black'>
													Payment Details
												</div>
												<div className='d-flex'>
													<div className='px-2'>
														<img
															src='/media/gomzi-nutrition/payment_scan.png'
															alt='sign'
															width='120px'
														/>
													</div>
													<div className='bill-name-date px-2'>
														<p className='my-1'>
															<strong>Bank Name: Axis Bank Adajan</strong>
														</p>
														<p className='my-1'>
															<strong>Account Holder Name: Gomzi life Science LLP</strong>
														</p>
														<p className='my-1'>
															<strong>Account Number: 924020043956068</strong>
														</p>
														<p className='my-1'>
															<strong>IFSC: UTIB0000566</strong>
														</p>
														<p className='my-1'>
															<strong>Account Type: Current Account</strong>
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export default AddFollowUpReport
