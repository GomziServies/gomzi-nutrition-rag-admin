import {
	faArrowLeft,
	faCalendarAlt,
	faClock,
	faEnvelope,
	faHistory,
	faPhone,
	faPlus,
	faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetGnFollowUpReport } from '../../../Functions/FGGroup/GnFollowUpReport'
import {
	GetIVRCallLogs,
	GetIVRMembers,
	InitiateCall,
} from '../../../Functions/FGGroup/IVRFunctions'
import '../common-management.css'
import '../products-theme.css'
import '../orders-theme.css'
import './follow-up-report.css'

const FollowUpReportInnerList: React.FC = () => {
	const intl = useIntl()
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const adNameFromUrl = decodeURIComponent(searchParams.get('ad_name') || '')
	const leadCreatedAtFromUrl = decodeURIComponent(searchParams.get('lead_created_at') || '')

	const [searchTerm, setSearchTerm] = useState('')
	const [rawApiData, setRawApiData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>({ totalPages: 1 })
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const [loading, setLoading] = useState(false)
	const [salesPerson, setSalesPerson] = useState('')

	const salesPersonList = [
		{ label: 'All Sales Person', value: '' },
		{ label: 'Rahul Patel', value: 'rahul_patel' },
		{ label: 'Amit Shah', value: 'amit_shah' },
	]

	const [sort, setSort] = useState('returned_from')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

	const [selectedData, setSelectedData] = useState<any>(null)

	const [ivrMembers, setIvrMembers] = useState<any[]>([])
	const [selectedIvrMemberId, setSelectedIvrMemberId] = useState<string>('')
	const [showCallModal, setShowCallModal] = useState(false)
	const [callLogs, setCallLogs] = useState<any[]>([])
	const [logsLoading, setLogsLoading] = useState(false)
	const [logsPage, setLogsPage] = useState(1)
	const logsPerPage = 5

	// Initialize selected data from query params
	useEffect(() => {
		const mobileParam = searchParams.get('mobile')
		const emailParam = searchParams.get('email')
		const nameParam = searchParams.get('name')
		const cityParam = searchParams.get('city')
		const platformParam = searchParams.get('platform')

		if (mobileParam || nameParam) {
			setSelectedData({
				name: nameParam || 'N/A',
				phone: mobileParam || 'N/A',
				email: emailParam || 'N/A',
				city: cityParam || 'N/A',
				platform: platformParam || '',
				ad_name: adNameFromUrl || 'N/A',
				lead_created_at: leadCreatedAtFromUrl || 'N/A',
				full_record: null,
			})
		}
	}, [])

	const fetchIvrMembers = async () => {
		try {
			const response = await GetIVRMembers()
			const members = response?.getmember || []
			if (Array.isArray(members)) {
				const gnNumbers = [
					'08780127993', // Siddharth GLS
					'09924291998', // Sahid GLS
					'07878262098', // Milan Vanara
				]
				const normalize = (n: any) => n?.toString().replace(/^0+/, '').replace(/^91/, '').trim()
				const gnNumbersNormalized = gnNumbers.map(normalize)

				const filteredMembers = members.filter((m: any) =>
					gnNumbersNormalized.includes(normalize(m.member_num))
				)
				setIvrMembers(filteredMembers)
				if (filteredMembers.length > 0) {
					setSelectedIvrMemberId(filteredMembers[0].member_id)
				}
			}
		} catch (error) {
			console.error('Error fetching IVR members:', error)
		}
	}

	const stripPhone = (num: string) => {
		if (!num) return ''
		let s = num.replace(/\D/g, '')
		s = s.replace(/^0+/, '')
		if (s.length === 12 && s.startsWith('91')) {
			s = s.substring(2)
		}
		return s
	}

	const fetchCallLogs = async (phone: string, showLoading = true) => {
		if (showLoading) setLogsLoading(true)
		try {
			const strippedSearch = stripPhone(phone)
			const response = await GetIVRCallLogs({
				search: strippedSearch,
				limit: 20,
			})
			if (response && response.data) {
				const logs = Array.isArray(response.data) ? response.data : response.data.data || []
				setCallLogs(logs.filter((l: any) => l.recording_url))
			} else if (Array.isArray(response)) {
				setCallLogs(response.filter((l: any) => l.recording_url))
			}
		} catch (error) {
			console.error('Error fetching call logs:', error)
		} finally {
			setLogsLoading(false)
		}
	}

	const handleInitiateCall = async () => {
		const clientPhone =
			selectedData?.phone && selectedData.phone !== 'N/A' ? selectedData.phone : null
		if (!clientPhone) {
			toast.error('Client phone number not available')
			return
		}

		const member = ivrMembers.find((m) => m.member_id === selectedIvrMemberId)
		if (!member) {
			toast.error('Please select a member')
			return
		}

		try {
			toast.loading('Initiating call...', { id: 'initiate-call' })
			const response = await InitiateCall({
				party_a: member.member_num,
				party_b: clientPhone,
				deskphone: '08069220266',
			})

			if (response?.type === 'error' || response?.status === 'error') {
				toast.error(response?.message || 'Failed to initiate call', { id: 'initiate-call' })
			} else {
				toast.success('Call initiated successfully', { id: 'initiate-call' })
				setShowCallModal(false)
			}
		} catch (error: any) {
			console.error('Error initiating call:', error)
			toast.error(error?.message || 'Failed to initiate call', { id: 'initiate-call' })
		}
	}

	// Fetch data from API
	const fetchFollowUpReports = async () => {
		setLoading(true)
		try {
			const mobileParam = searchParams.get('mobile')
			const response = await GetGnFollowUpReport({
				mobile: mobileParam || undefined,
				search: searchTerm,
				page: pagination.page,
				limit: pagination.itemsPerPage,
			})
			if (response.status === 200 && response.data) {
				// Store raw API data - transformation will happen in useMemo
				setRawApiData(response.data)

				setMetaData({
					totalPages: (response as any).metadata?.pagination?.totalPages || 1,
				})
			} else {
				if (!response.message?.toLowerCase().includes('call history')) {
					toast.error(response.message || 'Failed to fetch follow-up reports')
				}
			}
		} catch (error: any) {
			console.error('Error fetching follow-up reports:', error)
			const errorMessage = error?.response?.data?.message || error.message || ''
			if (!errorMessage.toLowerCase().includes('call history')) {
				toast.error(errorMessage || 'Something went wrong')
			}
		} finally {
			setLoading(false)
		}
	}

	// Transform raw API data - memoized for performance
	const jobData = useMemo(() => {
		const transformedData: any[] = []

		rawApiData.forEach((item: any) => {
			const personalDetails = item.personalDetails || {}

			// Loop through each callHistory item
			item.callHistory?.forEach((call: any, callIndex: number) => {
				const pitchReport = call.pitchReport || {}

				const hasPitchReport = Boolean(
					pitchReport.telecaller_name ||
						pitchReport.interest_level ||
						pitchReport.pitch_follow_up_date ||
						pitchReport.objections
				)

				// Get next follow-up date
				const followUpDate =
					call.pitchReport?.pitch_follow_up_date ||
					call.productDetails?.follow_up_date ||
					call.sampleUpdate?.final_follow_up_date

				// TRACKER for already shown filled sections for THIS item
				const filledSections = new Set<string>()
				// We identify filled sections from PREVIOUS calls only
				for (let i = 0; i < callIndex; i++) {
					const prevCall = item.callHistory[i]
					if (
						prevCall.productDetails &&
						(prevCall.productDetails.products?.some((p: any) => p.budget) ||
							prevCall.productDetails.products?.length > 0)
					) {
						filledSections.add('Product Details')
					}
					// If skip happened, it's not "filled" yet? Or is it?
					// User says if it was filled in first, it shouldn't show in second.
					if (
						prevCall.sampleSelection &&
						!prevCall.sampleSelection.is_skipped &&
						(prevCall.sampleSelection.sample_interested !== undefined ||
							prevCall.sampleSelection.selected_samples?.length > 0)
					) {
						filledSections.add('Sample Selection')
					}
					if (
						prevCall.sampleUpdate &&
						!prevCall.sampleUpdate.is_skipped &&
						Object.keys(prevCall.sampleUpdate).length > 0
					) {
						filledSections.add('Sample Update')
					}
				}

				// Collect sections to show for this call
				const sectionsToShow: { name: string; isSkipped: boolean }[] = []

				// Product Details
				if (
					call.productDetails &&
					(call.productDetails.products?.some((p: any) => p.budget) ||
						call.productDetails.products?.length > 0)
				) {
					if (!filledSections.has('Product Details')) {
						sectionsToShow.push({ name: 'Product Details', isSkipped: false })
					}
				}

				// Sample Selection
				if (
					call.sampleSelection &&
					(call.sampleSelection.sample_interested !== undefined ||
						call.sampleSelection.selected_samples?.length > 0 ||
						call.sampleSelection.is_skipped)
				) {
					const isSkipped = call.sampleSelection.is_skipped === true
					if (isSkipped || !filledSections.has('Sample Selection')) {
						sectionsToShow.push({ name: 'Sample Selection', isSkipped })
					}
				}

				// Sample Update
				if (
					call.sampleUpdate &&
					(Object.keys(call.sampleUpdate).length > 0 || call.sampleUpdate.is_skipped)
				) {
					const isSkipped = call.sampleUpdate.is_skipped === true
					if (isSkipped || !filledSections.has('Sample Update')) {
						sectionsToShow.push({ name: 'Sample Update', isSkipped })
					}
				}

				const returnedFrom =
					sectionsToShow.length > 0 ? sectionsToShow : [{ name: 'N/A', isSkipped: false }]

				transformedData.push({
					_id: `${item._id}_${call._id}`,
					parent_id: item._id,
					call_id: call._id,
					call_number: callIndex + 1,
					name: personalDetails?.client_name || 'N/A',
					phone: personalDetails?.mobile || 'N/A',
					email: personalDetails?.email || 'N/A',
					ad_name: personalDetails?.ad_name || 'N/A',
					lead_created_at: personalDetails?.lead_created_at || 'N/A',
					telecaller_name: pitchReport?.telecaller_name || 'N/A',
					returned_from: returnedFrom,
					call_date: call.callDate
						? new Date(call.callDate).toLocaleString('en-IN', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
						  })
						: 'N/A',
					follow_up_date: followUpDate
						? new Date(followUpDate).toLocaleString('en-IN', {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
								hour12: true,
						  })
						: 'N/A',
					is_pitch_report_pending: !hasPitchReport,
					full_record: item,
				})
			})
		})

		return transformedData
	}, [rawApiData])

	// Update selectedData when jobData changes
	useEffect(() => {
		if (jobData.length > 0) {
			setSelectedData((prev: any) => ({
				...prev,
				name: jobData[0].name,
				phone: jobData[0].phone,
				email: jobData[0].email,
				ad_name: jobData[0].ad_name,
				lead_created_at: jobData[0].lead_created_at,
				call_date: jobData[0].call_date,
				follow_up_date: jobData[0].follow_up_date,
				parent_id: jobData[0].parent_id,
				full_record: jobData[0].full_record,
				platform: jobData[0].full_record?.personalDetails?.platform || prev?.platform || '',
			}))
		} else if (rawApiData.length > 0) {
			// Record exists but has no callHistory yet
			const firstRecord = rawApiData[0]
			const pd = firstRecord.personalDetails || {}
			setSelectedData((prev: any) => ({
				...prev,
				name: pd.client_name || prev?.name || 'N/A',
				phone: pd.mobile || prev?.phone || 'N/A',
				email: pd.email || prev?.email || 'N/A',
				ad_name: pd.ad_name || prev?.ad_name || 'N/A',
				lead_created_at: pd.lead_created_at || prev?.lead_created_at || 'N/A',
				call_date: 'N/A',
				follow_up_date: 'N/A',
				parent_id: firstRecord._id,
				full_record: firstRecord,
				platform: pd.platform || prev?.platform || '',
			}))
		}
	}, [jobData, rawApiData])

	useEffect(() => {
		fetchFollowUpReports()
	}, [pagination.page, pagination.itemsPerPage, searchTerm])

	useEffect(() => {
		if (selectedData?.phone && selectedData.phone !== 'N/A') {
			setLogsPage(1) // Reset only on manual selection
			fetchCallLogs(selectedData.phone)

			const interval = setInterval(() => {
				fetchCallLogs(selectedData.phone, false)
			}, 10000)

			return () => clearInterval(interval)
		}
	}, [selectedData?.phone])

	useEffect(() => {
		fetchIvrMembers()
	}, [])

	// Memoized button visibility logic - avoid recalculating on every render
	const shouldShowAddButton = true

	const manualRecordings =
		selectedData?.full_record?.callHistory
			?.filter((call: any) => call.pitchReport?.call_recording)
			?.reverse() || []

	const sortableFields = [
		{ field: 'telecaller_name', title: 'Telecaller Name' },
		{ field: 'returned_from', title: 'Returned From' },
		{ field: 'call_date', title: 'Call Date' },
		{ field: 'action', title: 'Action' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Follow Up Report</PageTitle>

			<style>{`
				.data-row {
					cursor: pointer;
					border-bottom: 1px solid #EEF2F7;
					transition: background 0.15s ease;
				}
				.data-row:hover {
					background: #F8FAFD;
				}
				.data-row td {
					padding: 14px 14px;
					vertical-align: middle;
				}
				.sr-badge {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 32px;
					height: 32px;
					border-radius: 8px;
					background: #EFF6FF;
					color: #172B4D;
					font-weight: 700;
					font-size: 12px;
				}
				.text-cell {
					font-weight: 500;
					color: #172B4D;
					font-size: 13px;
				}
				.recording-table thead th {
					padding-top: 0.85rem !important;
					padding-bottom: 0.85rem !important;
					letter-spacing: 0.03rem;
					font-size: 12px !important;
					font-weight: 700 !important;
					color: #172B4D !important;
					background: #F8FAFD !important;
					border-bottom: 1px solid #DFE7F0 !important;
				}
				.recording-table tbody td {
					padding-top: 1rem !important;
					padding-bottom: 1rem !important;
					vertical-align: middle;
				}
				.audio-player-custom {
					height: 36px;
					width: 340px;
					border-radius: 20px;
					background: #F1F5F9;
				}
			`}</style>

			{/* Breadcrumb */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<Link to='/rag/follow-up-report-list'>Follow-Up Reports</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>
					{selectedData?.name ? `${selectedData.name} — Timeline` : 'Lead Timeline & Calls'}
				</span>
			</div>

			{/* Header */}
			<div className='gz-mgmt-header mb-6'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>
						{selectedData?.name ? `${selectedData.name} — Call Timeline` : 'Lead History & Call Timeline'}
					</h1>
					<p className='gz-mgmt-subtitle'>
						Track multi-stage interactions, telephone call recordings, IVR logs, and follow-up activities.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<button
						type='button'
						className='gz-mgmt-btn-secondary'
						onClick={() => navigate('/rag/follow-up-report-list')}>
						<FontAwesomeIcon icon={faArrowLeft} />
						<span>Back to Leads</span>
					</button>

					{selectedData?.phone && selectedData.phone !== 'N/A' && (
						<button
							type='button'
							className='btn text-white d-flex align-items-center gap-2'
							style={{
								backgroundColor: '#2563EB',
								borderRadius: '10px',
								height: '40px',
								padding: '0 18px',
								fontWeight: 600,
								fontSize: '13.5px',
								boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
							}}
							onClick={() => setShowCallModal(true)}>
							<FontAwesomeIcon icon={faPhone} />
							<span>Click to Call</span>
						</button>
					)}

					{shouldShowAddButton && (
						<TableButton
							action='add'
							to={
								selectedData?.parent_id
									? `/rag/add-follow-up-report?edit=true&id=${
											selectedData.parent_id
									  }&mobile=${encodeURIComponent(
											selectedData?.phone || searchParams.get('mobile') || ''
									  )}&name=${encodeURIComponent(
											selectedData?.name || searchParams.get('name') || ''
									  )}&ad_name=${encodeURIComponent(
											adNameFromUrl || ''
									  )}&lead_created_at=${encodeURIComponent(
											leadCreatedAtFromUrl || ''
									  )}&platform=${encodeURIComponent(searchParams.get('platform') || '')}`
									: `/rag/add-follow-up-report?mobile=${encodeURIComponent(
											selectedData?.phone || searchParams.get('mobile') || ''
									  )}&email=${encodeURIComponent(
											selectedData?.email || searchParams.get('email') || ''
									  )}&name=${encodeURIComponent(
											selectedData?.name || searchParams.get('name') || ''
									  )}&city=${encodeURIComponent(
											selectedData?.city || searchParams.get('city') || ''
									  )}&ad_name=${encodeURIComponent(
											adNameFromUrl || ''
									  )}&lead_created_at=${encodeURIComponent(
											leadCreatedAtFromUrl || ''
									  )}&platform=${encodeURIComponent(searchParams.get('platform') || '')}`
							}
							text='Add Follow Up'
							showIcon={false}
							backgroundDark={true}
						/>
					)}
				</div>
			</div>

			{/* ================= USER INFORMATION CARD ================= */}
			<div className='gz-mgmt-card mb-6'>
				<div className='p-6'>
					<div className='d-flex align-items-center justify-content-between flex-wrap gap-4 mb-6 pb-5 border-bottom'>
						<div className='d-flex align-items-center gap-4'>
							<div
								style={{
									width: '56px',
									height: '56px',
									borderRadius: '14px',
									backgroundColor: '#EFF6FF',
									color: '#2563EB',
									fontWeight: 700,
									fontSize: '22px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									border: '1.5px solid #DBEAFE',
								}}>
								{selectedData?.name?.charAt(0) || <FontAwesomeIcon icon={faUser} />}
							</div>

							<div>
								<div className='d-flex align-items-center gap-3'>
									<h2 className='m-0 fw-bold fs-4 text-dark'>{selectedData?.name || 'Customer'}</h2>
									{selectedData?.gender && (
										<span className='badge bg-light-success text-success fw-bold px-3 py-1'>
											{selectedData.gender}
										</span>
									)}
								</div>
								<div className='text-muted fs-7 mt-1'>
									ID: <span className='font-monospace text-dark'>{selectedData?.parent_id || 'N/A'}</span>
								</div>
							</div>
						</div>

						{selectedData?.follow_up_date && selectedData.follow_up_date !== 'N/A' && (
							<div
								className='d-flex align-items-center gap-2 px-4 py-2 rounded-3'
								style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
								<FontAwesomeIcon icon={faCalendarAlt} className='text-primary' />
								<span className='fs-7 fw-bold text-dark'>Next Follow-up:</span>
								<span className='fs-7 fw-bolder text-primary'>{selectedData.follow_up_date}</span>
							</div>
						)}
					</div>

					<div className='row g-4'>
						<div className='col-md-3 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Email Address</div>
								<div className='fw-bold fs-6 text-dark text-truncate'>
									{selectedData?.email && selectedData.email !== 'N/A' ? selectedData.email : '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Phone Number</div>
								<div className='fw-bold fs-6 text-dark'>
									{selectedData?.phone && selectedData.phone !== 'N/A' ? selectedData.phone : '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Last Call Date</div>
								<div className='fw-bold fs-6 text-dark'>
									{selectedData?.call_date && selectedData.call_date !== 'N/A'
										? selectedData.call_date
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Campaign / Ad Name</div>
								<div className='fw-bold fs-6 text-dark text-truncate'>
									{selectedData?.ad_name && selectedData.ad_name !== 'N/A'
										? selectedData.ad_name
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-4 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Next Follow-up</div>
								<div className='fw-bold fs-6 text-primary'>
									{selectedData?.follow_up_date && selectedData.follow_up_date !== 'N/A'
										? selectedData.follow_up_date
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-4 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Lead Platform</div>
								<div className='fw-bold fs-6 text-dark'>
									{selectedData?.platform === 'ig'
										? 'Instagram'
										: selectedData?.platform === 'fb'
										? 'Facebook'
										: selectedData?.platform &&
										  selectedData.platform !== '-' &&
										  selectedData.platform !== 'N/A'
										? selectedData.platform.toUpperCase()
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-4 col-sm-6'>
							<div
								className='p-4 rounded-3 h-100'
								style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
								<div className='text-muted fs-8 text-uppercase fw-bolder mb-1'>Lead Created At</div>
								<div className='fw-bold fs-6 text-dark'>
									{selectedData?.lead_created_at && selectedData.lead_created_at !== 'N/A'
										? selectedData.lead_created_at
										: '-'}
								</div>
							</div>
						</div>
					</div>

					{/* IVR INFO SECTION */}
					<div
						className='mt-6 pt-5 border-top d-flex flex-wrap align-items-center justify-content-between gap-6 p-4 rounded-3'
						style={{ backgroundColor: '#F8FAFD', border: '1px solid #EEF2F7' }}>
						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '38px',
									height: '38px',
									borderRadius: '10px',
									backgroundColor: '#FEE2E2',
									color: '#DC2626',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '16px',
								}}>
								<i className='bi bi-telephone-outbound'></i>
							</div>
							<div>
								<div className='text-muted fs-8 fw-bold text-uppercase'>GLS DID Telephony</div>
								<div className='fw-bold fs-6 text-dark font-monospace'>08069220266</div>
							</div>
						</div>

						<div className='d-flex align-items-center gap-3'>
							<div
								style={{
									width: '38px',
									height: '38px',
									borderRadius: '10px',
									backgroundColor: '#EFF6FF',
									color: '#2563EB',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '16px',
								}}>
								<i className='bi bi-people'></i>
							</div>
							<div>
								<div className='text-muted fs-8 fw-bold text-uppercase'>Assigned Members</div>
								<div className='d-flex flex-wrap gap-2 mt-1'>
									<span className='badge bg-light-primary text-primary fw-bold fs-8 px-3 py-2'>
										Siddharth GLS: 08780127993
									</span>
									<span className='badge bg-light-primary text-primary fw-bold fs-8 px-3 py-2'>
										Sahid GLS: 09924291998
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ================= MAIN TABLE CARD ================= */}
			<div className='gz-mgmt-card mb-6'>
				{/* Filters Section */}
				<div className='gz-mgmt-toolbar'>
					<div className='d-flex flex-wrap align-items-center gap-3'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>

						<LengthMenu
							expenseData={jobData}
							handleItemsPerPageChange={(value: number) =>
								setPagination({ ...pagination, itemsPerPage: value })
							}
						/>
					</div>

					{(shouldShowAddButton || (selectedData?.phone && selectedData.phone !== 'N/A')) && (
						<div className='d-flex align-items-center gap-2'>
							{selectedData?.phone && selectedData.phone !== 'N/A' && (
								<button
									type='button'
									className='btn btn-sm btn-info text-white fw-bold px-4'
									style={{ borderRadius: '8px' }}
									onClick={() => setShowCallModal(true)}>
									<i className='bi bi-telephone me-1'></i>
									Click to Call
								</button>
							)}
							{shouldShowAddButton && (
								<TableButton
									action='add'
									to={
										selectedData?.parent_id
											? `/rag/add-follow-up-report?edit=true&id=${
													selectedData.parent_id
											  }&mobile=${encodeURIComponent(
													selectedData?.phone || searchParams.get('mobile') || ''
											  )}&name=${encodeURIComponent(
													selectedData?.name || searchParams.get('name') || ''
											  )}&ad_name=${encodeURIComponent(
													adNameFromUrl || ''
											  )}&lead_created_at=${encodeURIComponent(
													leadCreatedAtFromUrl || ''
											  )}&platform=${encodeURIComponent(searchParams.get('platform') || '')}`
											: `/rag/add-follow-up-report?mobile=${encodeURIComponent(
													selectedData?.phone || searchParams.get('mobile') || ''
											  )}&email=${encodeURIComponent(
													selectedData?.email || searchParams.get('email') || ''
											  )}&name=${encodeURIComponent(
													selectedData?.name || searchParams.get('name') || ''
											  )}&city=${encodeURIComponent(
													selectedData?.city || searchParams.get('city') || ''
											  )}&ad_name=${encodeURIComponent(
													adNameFromUrl || ''
											  )}&lead_created_at=${encodeURIComponent(
													leadCreatedAtFromUrl || ''
											  )}&platform=${encodeURIComponent(searchParams.get('platform') || '')}`
									}
									text='Add Follow Up'
									showIcon={false}
									backgroundDark={true}
								/>
							)}
						</div>
					)}
				</div>

				{/* Table Section */}
				<div className='p-6 pt-0'>
					<div className='table-responsive'>
						<Table
							data={jobData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							visibleDetails={visibleDetails}
							onSortChange={(field: string, order: 'asc' | 'desc') => {
								setSort(field)
								setSortOrder(order)
							}}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => {
											setSelectedData(data)
											handleRowClick(data._id)
										}}
										className='data-row'>
										<td className='ps-6'>
											<span className='sr-badge'>{actualIndex}</span>
										</td>

										<td>
											<span className='text-cell fw-bold'>{data.telecaller_name || 'N/A'}</span>
										</td>

										<td>
											<div className='d-flex flex-column'>
												{Array.isArray(data.returned_from) ? (
													data.returned_from.map((section: any, idx: number) => (
														<span
															key={idx}
															className='text-cell mb-1'>
															• {section.name}
															{section.isSkipped && (
																<span className='text-danger ms-1 fw-bold fs-9'>(Skipped)</span>
															)}
														</span>
													))
												) : (
													<span className='text-cell'>{data.returned_from}</span>
												)}
												{data.is_pitch_report_pending === true && (
													<span className='text-danger fs-9 fw-bold mt-1'>
														Pitch Report Pending
													</span>
												)}
											</div>
										</td>

										<td>
											<span className='text-cell'>{data.call_date}</span>
										</td>

										<td>
											<div className='d-flex align-items-center gap-1'>
												<TableButton
													action='view'
													to={`/rag/view-follow-up-report?id=${data.parent_id}&call_id=${data.call_id}`}
												/>
												{data.is_pitch_report_pending && (
													<TableButton
														action='edit'
														to={`/rag/update-follow-up-report?edit=true&id=${
															data.parent_id
														}&pitchPending=${data.is_pitch_report_pending}&call_id=${
															data.call_id
														}&mobile=${encodeURIComponent(
															searchParams.get('mobile') || ''
														)}&name=${encodeURIComponent(
															searchParams.get('name') || ''
														)}&ad_name=${encodeURIComponent(
															adNameFromUrl || ''
														)}&lead_created_at=${encodeURIComponent(
															leadCreatedAtFromUrl || ''
														)}&platform=${encodeURIComponent(searchParams.get('platform') || '')}`}
													/>
												)}
											</div>
										</td>
									</tr>

									{isVisible && (
										<tr className='bg-light'>
											<td
												colSpan={7}
												className='p-5'>
												<div className='row'>
													<div className='col-md-6'>
														<div className='fw-semibold text-muted mb-1'>Telecaller:</div>
														<div className='fw-bold'>{data.telecaller_name}</div>
													</div>
													<div className='col-md-6'>
														<div className='fw-semibold text-muted mb-1'>
															Call #{data.call_number}
														</div>
														<div className='fw-bold'>{data.call_date}</div>
													</div>
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							removeAction={true}
						/>
					</div>

					{jobData.length === 0 && !loading && (
						<div className='text-center py-10'>
							<span className='text-muted fw-bold'>No records found</span>
						</div>
					)}

					{jobData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={(page: number) => setPagination({ ...pagination, page })}
						/>
					)}
				</div>
			</div>

			{/* ===== CALL MODAL ===== */}
			{showCallModal && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content shadow-lg border-0' style={{ borderRadius: '16px' }}>
							<div className='modal-header py-4 px-6 border-bottom'>
								<h4 className='modal-title fw-bold text-dark m-0'>Select IVR Member</h4>
								<button
									type='button'
									className='btn-close'
									onClick={() => setShowCallModal(false)}></button>
							</div>
							<div className='modal-body px-6 py-5'>
								<p className='text-muted mb-5 fs-6'>
									Choose the agent identity to initiate the call to{' '}
									<strong className='text-dark'>{selectedData?.name}</strong>.
								</p>

								<div className='fv-row'>
									<label className='form-label fw-bold fs-6 mb-3 text-dark'>Calling Member</label>
									<div className='row g-3'>
										{ivrMembers.map((member) => (
											<div
												className='col-12'
												key={member.member_id}>
												<label
													className={`d-flex align-items-center p-4 rounded-3 border cursor-pointer transition-all ${
														selectedIvrMemberId === member.member_id
															? 'border-primary bg-light-primary'
															: 'border-gray-200'
													}`}
													onClick={() => setSelectedIvrMemberId(member.member_id)}>
													<input
														type='radio'
														className='form-check-input me-4'
														name='ivr_member'
														checked={selectedIvrMemberId === member.member_id}
														onChange={() => setSelectedIvrMemberId(member.member_id)}
													/>
													<div className='d-flex flex-column'>
														<span className='fw-bold text-dark fs-6'>{member.member_name}</span>
														<span className='text-muted fs-7 font-monospace'>{member.member_num}</span>
													</div>
												</label>
											</div>
										))}
									</div>
								</div>
							</div>
							<div className='modal-footer border-0 pt-0 pb-6 px-6 justify-content-end gap-2'>
								<button
									type='button'
									className='btn btn-light px-6'
									style={{ borderRadius: '10px' }}
									onClick={() => setShowCallModal(false)}>
									Cancel
								</button>
								<button
									type='button'
									className='btn btn-primary px-8 d-flex align-items-center gap-2'
									style={{ borderRadius: '10px', backgroundColor: '#172B4D', borderColor: '#172B4D' }}
									onClick={handleInitiateCall}>
									<i className='bi bi-telephone fs-5'></i>
									<span>Initiate Call</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== CALL RECORDINGS TABLE CARD ===== */}
			<div className='gz-mgmt-card mb-6'>
				<div className='p-6 border-bottom d-flex align-items-center justify-content-between'>
					<div>
						<h3 className='m-0 fw-bold fs-5 text-dark'>IVR Call Recordings</h3>
						<p className='m-0 text-muted fs-7 mt-1'>Automated recordings logged through telephony provider</p>
					</div>
				</div>
				<div className='p-0'>
					<div className='table-responsive'>
						<table className='table align-middle gs-6 gy-4 mb-0 recording-table'>
							<thead>
								<tr>
									<th className='min-w-50px ps-6'>No.</th>
									<th className='min-w-50px'>Dir.</th>
									<th className='min-w-150px'>Date & Time</th>
									<th className='min-w-125px'>Agent Name</th>
									<th className='min-w-125px'>Status</th>
									<th className='min-w-100px'>Duration</th>
									<th className='min-w-250px text-center pe-6'>Recording Player</th>
								</tr>
							</thead>
							<tbody>
								{logsLoading ? (
									<tr>
										<td
											colSpan={7}
											className='text-center py-15'>
											<div
												className='spinner-border text-primary w-35px h-35px'
												role='status'>
												<span className='visually-hidden'>Loading...</span>
											</div>
										</td>
									</tr>
								) : callLogs.length > 0 ? (
									callLogs
										.slice((logsPage - 1) * logsPerPage, logsPage * logsPerPage)
										.map((log: any, idx: number) => (
											<tr
												key={log._id}
												className='hover-elevate-up border-bottom'>
												<td className='ps-6'>
													<span className='fw-bold text-muted'>
														{(logsPage - 1) * logsPerPage + idx + 1}
													</span>
												</td>
												<td>
													{log.direction === 'WEBOBD' ? (
														<span
															className='badge badge-light-primary btn-icon btn-sm w-30px h-30px rounded-circle'
															title='Outgoing'>
															<i className='bi bi-telephone-outbound fs-6'></i>
														</span>
													) : (
														<span
															className='badge badge-light-success btn-icon btn-sm w-30px h-30px rounded-circle'
															title='Incoming'>
															<i className='bi bi-telephone-inbound fs-6'></i>
														</span>
													)}
												</td>
												<td>
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bold fs-6'>
															{new Date(log.createdAt).toLocaleDateString('en-IN', {
																day: '2-digit',
																month: 'short',
																year: 'numeric',
															})}
														</span>
														<span className='text-muted fw-semibold fs-7 mt-1'>
															<i className='bi bi-clock me-1'></i>
															{new Date(log.createdAt).toLocaleTimeString('en-IN', {
																hour: '2-digit',
																minute: '2-digit',
																hour12: true,
															})}
														</span>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold fs-6'>
														{log.raw_payload?.receiver_name || '-'}
													</span>
												</td>
												<td>
													<span
														className={`badge badge-light-${
															log.status === 'ANSWER' ? 'success' : 'danger'
														} rounded-pill px-3 py-2 fw-bold`}>
														{log.status === 'ANSWER' ? 'Answered' : log.status}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold fs-6 font-monospace'>
														{log.raw_payload?.CallDuration
															? `${log.raw_payload.CallDuration}s`
															: 'N/A'}
													</span>
												</td>
												<td className='text-center pe-6'>
													<div className='d-inline-block p-1 bg-light rounded-pill'>
														<audio
															controls
															className='audio-player-custom'
															onPlay={(e) => {
																const audios = document.getElementsByTagName('audio')
																for (let i = 0; i < audios.length; i++) {
																	if (audios[i] !== e.target) {
																		audios[i].pause()
																	}
																}
															}}>
															<source
																src={log.recording_url}
																type='audio/mpeg'
															/>
															Your browser does not support the audio element.
														</audio>
													</div>
												</td>
											</tr>
										))
								) : (
									<tr>
										<td
											colSpan={7}
											className='text-center py-15'>
											<div className='d-flex flex-column align-items-center'>
												<div
													style={{
														width: '50px',
														height: '50px',
														borderRadius: '50%',
														backgroundColor: '#FEF3C7',
														color: '#D97706',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '22px',
														marginBottom: '12px',
													}}>
													<i className='bi bi-telephone-x'></i>
												</div>
												<span className='text-dark fw-bold fs-6'>No recordings found</span>
												<span className='text-muted fs-7 mt-1'>
													Calls with this number have not been recorded yet
												</span>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{callLogs.length > logsPerPage && (
						<div className='d-flex justify-content-end px-6 py-4 border-top'>
							<UsersListPagination
								totalPages={Math.ceil(callLogs.length / logsPerPage)}
								currentPage={logsPage}
								onPageChange={(page: number) => setLogsPage(page)}
							/>
						</div>
					)}
				</div>
			</div>

			{/* ===== MANUAL CALL RECORDINGS TABLE CARD ===== */}
			<div className='gz-mgmt-card mb-6'>
				<div className='p-6 border-bottom d-flex align-items-center justify-content-between'>
					<div>
						<h3 className='m-0 fw-bold fs-5 text-dark'>Manual Call Recordings</h3>
						<p className='m-0 text-muted fs-7 mt-1'>Audio files manually attached by agents during pitch updates</p>
					</div>
				</div>
				<div className='p-0'>
					<div className='table-responsive'>
						<table className='table align-middle gs-6 gy-4 mb-0 recording-table'>
							<thead>
								<tr>
									<th className='min-w-50px ps-6'>No.</th>
									<th className='min-w-150px'>Date & Time</th>
									<th className='min-w-125px'>Sales Person</th>
									<th className='min-w-250px text-center pe-6'>Recording Player</th>
								</tr>
							</thead>
							<tbody>
								{manualRecordings.length > 0 ? (
									manualRecordings.map((call: any, idx: number) => (
										<tr
											key={idx}
											className='hover-elevate-up border-bottom'>
											<td className='ps-6'>
												<span className='fw-bold text-muted'>{idx + 1}</span>
											</td>
											<td>
												<div className='d-flex flex-column'>
													<span className='text-dark fw-bold fs-6'>
														{new Date(call.callDate).toLocaleDateString('en-IN', {
															day: '2-digit',
															month: 'short',
															year: 'numeric',
														})}
													</span>
													<span className='text-muted fw-semibold fs-7 mt-1'>
														<i className='bi bi-clock me-1'></i>
														{new Date(call.callDate).toLocaleTimeString('en-IN', {
															hour: '2-digit',
															minute: '2-digit',
															hour12: true,
														})}
													</span>
												</div>
											</td>
											<td>
												<span className='text-dark fw-bold fs-6'>
													{call.pitchReport?.telecaller_name || '-'}
												</span>
											</td>
											<td className='text-center pe-6'>
												<div className='d-inline-block p-1 bg-light rounded-pill'>
													<audio
														controls
														className='audio-player-custom'
														onPlay={(e) => {
															const audios = document.getElementsByTagName('audio')
															for (let i = 0; i < audios.length; i++) {
																if (audios[i] !== e.currentTarget) {
																	audios[i].pause()
																}
															}
														}}>
														<source src={call.pitchReport.call_recording} />
													</audio>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={4}
											className='text-center py-15'>
											<div className='d-flex flex-column align-items-center'>
												<i className='bi bi-mic-mute fs-2x text-muted mb-2'></i>
												<span className='text-muted fw-bold fs-6'>No manual recordings found</span>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	)
}

export default FollowUpReportInnerList
