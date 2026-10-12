import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetFgiitFollowUpReport } from '../../../Functions/FGGroup/FgiitFollowUpReport'
import {
	GetIVRCallLogs,
	GetIVRMembers,
	InitiateCall,
} from '../../../Functions/FGGroup/IVRFunctions'

const FollowUpReportInnerList: React.FC = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const reportId = queryParams.get('id')
	const adNameFromUrl = decodeURIComponent(queryParams.get('ad_name') || '')
	const leadCreatedAtFromUrl = decodeURIComponent(queryParams.get('lead_created_at') || '')
	const platformFromUrl = decodeURIComponent(queryParams.get('platform') || '')

	const [searchTerm, setSearchTerm] = useState('')
	const [jobData, setJobData] = useState<any[]>([])
	const [selectedData, setSelectedData] = useState<any>(null)
	const [metaData, setMetaData] = useState<any>({ totalPages: 1 })
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('returned_from')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

	const [ivrMembers, setIvrMembers] = useState<any[]>([])
	const [selectedIvrMemberId, setSelectedIvrMemberId] = useState<string>('')
	const [showCallModal, setShowCallModal] = useState(false)
	const [callLogs, setCallLogs] = useState<any[]>([])
	const [logsLoading, setLogsLoading] = useState(false)
	const [logsPage, setLogsPage] = useState(1)
	const logsPerPage = 5

	const fetchIvrMembers = async () => {
		try {
			const response = await GetIVRMembers()
			const members = response?.getmember || []
			if (Array.isArray(members)) {
				const fgiitNumbers = [
					'08347383007', // Azaz
					'08758759658', // Ravi
					'07874601000', // Chirag
				]
				const normalize = (n: any) => n?.toString().replace(/^0+/, '').replace(/^91/, '').trim()
				const fgiitNumbersNormalized = fgiitNumbers.map(normalize)

				const filteredMembers = members.filter((m: any) =>
					fgiitNumbersNormalized.includes(normalize(m.member_num))
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

	const fetchFollowUpReports = async () => {
		setLoading(true)
		try {
			const response = await GetFgiitFollowUpReport({
				id: reportId || undefined,
				search: searchTerm,
				page: pagination.page,
				limit: pagination.itemsPerPage,
			})

			const rawData = response?.data?.data || response?.data || []

			if (response.status === 200 && Array.isArray(rawData) && rawData.length > 0) {
				const transformedData: any[] = []

				rawData.forEach((item: any) => {
					const personalDetails = item.personalDetails || {}
					const callHistory: any[] = item.callHistory || []

					// Always set selectedData from the first raw record so header shows correct info
					if (!selectedData) {
						setSelectedData({
							parent_id: item._id,
							name: personalDetails?.firstName || personalDetails?.client_name || 'N/A',
							phone: personalDetails?.mobile || 'N/A',
							email: personalDetails?.email || 'N/A',
							gender: personalDetails?.gender || 'N/A',
							ad_name:
								personalDetails?.ad_name && personalDetails.ad_name !== 'N/A'
									? personalDetails.ad_name
									: adNameFromUrl || 'N/A',
							lead_created_at:
								personalDetails?.lead_created_at && personalDetails.lead_created_at !== 'N/A'
									? personalDetails.lead_created_at
									: leadCreatedAtFromUrl || 'N/A',
							platform: item.platform || personalDetails?.platform || platformFromUrl || 'N/A',
							full_record: item,
						})
					}

					if (callHistory.length > 0) {
						let currentGroup: any = null

						callHistory.forEach((call: any, callIndex: number) => {
							// Initialize a new group if none exists
							if (!currentGroup) {
								currentGroup = {
									stages: [],
									telecaller_name: 'N/A',
									call_date: call.callDate,
									call_id: call._id,
									is_pitch_report_pending: true,
									is_completed: false,
									returned_from: call.returnFrom || 'Course Details',
									objections: 'None',
								}
							}

							// 1. Extract stages from this call
							const rawReturn = call.returnFrom || ''
							const returnFromNormalized = rawReturn.trim().toLowerCase()

							if (rawReturn) {
								// Helper to add unique stages (robust against casing, spaces, and duplicate suffixes)
								const addStage = (label: string, skipped: boolean) => {
									// Clean the label: trim and remove any existing legacy "(Skipped)" text
									let cleanedLabel = label.trim().replace(/\s*\(Skipped\)\s*$/i, '')

									const existingIndex = currentGroup.stages.findIndex(
										(s: any) => s.label.trim().toLowerCase() === cleanedLabel.toLowerCase()
									)

									if (existingIndex === -1) {
										currentGroup.stages.push({ label: cleanedLabel, skipped })
									} else if (currentGroup.stages[existingIndex].skipped && !skipped) {
										currentGroup.stages[existingIndex].skipped = false
									}
								}

								const isCourse =
									returnFromNormalized === 'course details' ||
									returnFromNormalized === 'course details (skipped)'
								const isAdmission = returnFromNormalized === 'admission form'
								const isBodyCheckup = returnFromNormalized === 'body checkup'

								const courseSkipped =
									call.courseDetails?.is_skipped || (isCourse && call.courseDetails?.is_skipped)
								const admissionSkipped =
									call.admissionForm?.is_skipped || (isAdmission && call.admissionForm?.is_skipped)

								if (courseSkipped) addStage('Course Details', true)
								else if (isCourse) addStage('Course Details', false)

								if (admissionSkipped) addStage('Admission Form', true)
								else if (isAdmission) addStage('Admission Form', false)

								if (isBodyCheckup) addStage('Body checkup', false)

								if (!isCourse && !isAdmission && !isBodyCheckup) {
									addStage(rawReturn, false)
								}
							}

							// 2. Check for completion or pitch report
							const pitchReport = call.pitchReport || {}
							const hasPitchReport = Boolean(
								pitchReport.telecaller_name && pitchReport.telecaller_name.trim() !== ''
							)

							// Update group metadata from this call (latest date, latest ID)
							currentGroup.call_date = call.callDate
							currentGroup.call_id = call._id
							if (pitchReport.objections) currentGroup.objections = pitchReport.objections

							// 3. Finalize group if completed or has pitch, UNLESS next call is same session
							const nextCall = callHistory[callIndex + 1]
							const currentTelecaller = pitchReport.telecaller_name || 'N/A'
							const nextTelecaller = nextCall?.pitchReport?.telecaller_name || 'N/A'
							const timeDiff = nextCall
								? (new Date(nextCall.callDate).getTime() - new Date(call.callDate).getTime()) /
								  1000 /
								  60
								: 0

							const isSameSession =
								nextCall &&
								((currentTelecaller !== 'N/A' && currentTelecaller === nextTelecaller) ||
									(currentTelecaller === 'N/A' && nextTelecaller === 'N/A')) &&
								timeDiff < 10

							if ((hasPitchReport || call.is_completed) && !isSameSession) {
								currentGroup.telecaller_name = pitchReport.telecaller_name || 'N/A'
								currentGroup.is_pitch_report_pending = false
								currentGroup.is_completed = true
								currentGroup.returned_from = call.returnFrom || currentGroup.returned_from

								transformedData.push({
									_id: `${item._id}_group_${transformedData.length}`,
									parent_id: item._id,
									call_id: currentGroup.call_id,
									name: personalDetails?.firstName || personalDetails?.client_name || 'N/A',
									phone: personalDetails?.mobile || 'N/A',
									email: personalDetails?.email || 'N/A',
									gender: personalDetails?.gender || 'N/A',
									ad_name:
										personalDetails?.ad_name && personalDetails.ad_name !== 'N/A'
											? personalDetails.ad_name
											: adNameFromUrl || 'N/A',
									lead_created_at:
										personalDetails?.lead_created_at && personalDetails.lead_created_at !== 'N/A'
											? personalDetails.lead_created_at
											: leadCreatedAtFromUrl || 'N/A',
									platform: item.platform || personalDetails?.platform || platformFromUrl || 'N/A',
									telecaller_name: currentGroup.telecaller_name,
									display_stages:
										currentGroup.stages.length > 0
											? currentGroup.stages
											: [{ label: currentGroup.returned_from, skipped: false }],
									returned_from: currentGroup.returned_from,
									call_date: currentGroup.call_date
										? new Date(currentGroup.call_date).toLocaleString('en-IN', {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
												hour12: true,
										  })
										: 'N/A',
									is_pitch_report_pending: false,
									is_completed: true,
									full_record: item,
									objections: currentGroup.objections,
								})
								currentGroup = null // Reset for next group
							} else if (callIndex === callHistory.length - 1) {
								// Finalize as pending if it's the last call and still incomplete
								transformedData.push({
									_id: `${item._id}_group_pending`,
									parent_id: item._id,
									call_id: currentGroup.call_id,
									name: personalDetails?.firstName || personalDetails?.client_name || 'N/A',
									phone: personalDetails?.mobile || 'N/A',
									email: personalDetails?.email || 'N/A',
									gender: personalDetails?.gender || 'N/A',
									ad_name:
										personalDetails?.ad_name && personalDetails.ad_name !== 'N/A'
											? personalDetails.ad_name
											: adNameFromUrl || 'N/A',
									lead_created_at:
										personalDetails?.lead_created_at && personalDetails.lead_created_at !== 'N/A'
											? personalDetails.lead_created_at
											: leadCreatedAtFromUrl || 'N/A',
									platform: item.platform || personalDetails?.platform || platformFromUrl || 'N/A',
									telecaller_name: 'N/A',
									display_stages:
										currentGroup.stages.length > 0
											? currentGroup.stages
											: [{ label: currentGroup.returned_from, skipped: false }],
									returned_from: currentGroup.returned_from,
									call_date: currentGroup.call_date
										? new Date(currentGroup.call_date).toLocaleString('en-IN', {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
												hour12: true,
										  })
										: 'N/A',
									is_pitch_report_pending: true,
									is_completed: false,
									full_record: item,
									objections: currentGroup.objections,
								})
							}
						})
					}
					// NOTE: we no longer push a blank row for empty callHistory
					// The header card already shows the personal details
				})

				setJobData(transformedData)

				if (transformedData.length > 0) {
					setSelectedData(transformedData[transformedData.length - 1])
				}

				setMetaData({
					totalPages:
						response?.data?.metadata?.pagination?.totalPages ||
						(response as any).metadata?.pagination?.totalPages ||
						1,
					is_completed: rawData[0]?.is_completed || false, // Capture top-level status
				})
			} else {
				setJobData([])
				setSelectedData(null)
			}
		} catch (error: any) {
			console.error('Error fetching FGIIT follow-up reports:', error)
			toast.error('Failed to load reports')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchFollowUpReports()
	}, [pagination.page, pagination.itemsPerPage, searchTerm])

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

	const sortableFields = [
		{ field: 'telecaller_name', title: 'Sales Person' },
		{ field: 'returned_from', title: 'Returned From' },
		{ field: 'call_date', title: 'Last Conversation' },
		{ field: 'action', title: 'Action' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleAddFollowUp = async () => {
		const parentId = selectedData?.parent_id || reportId
		const adName =
			selectedData?.ad_name && selectedData.ad_name !== 'N/A'
				? selectedData.ad_name
				: adNameFromUrl || ''
		const leadCreatedAt =
			selectedData?.lead_created_at && selectedData.lead_created_at !== 'N/A'
				? selectedData.lead_created_at
				: leadCreatedAtFromUrl || ''
		const platform =
			selectedData?.platform && selectedData.platform !== 'N/A'
				? selectedData.platform
				: platformFromUrl || ''

		const queryParams = new URLSearchParams()
		if (parentId) queryParams.append('id', parentId)
		if (adName) queryParams.append('ad_name', adName)
		if (leadCreatedAt) queryParams.append('lead_created_at', leadCreatedAt)
		if (platform) queryParams.append('platform', platform)

		navigate(`/fgiit/add-follow-up-report?${queryParams.toString()}`)
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
				deskphone: '08062985216',
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

	const lastCall = jobData.length > 0 ? jobData[jobData.length - 1] : null
	const isLastCallPending = lastCall ? lastCall.is_pitch_report_pending : false

	const canAddFollowUp = !!(selectedData?.parent_id || reportId) && !isLastCallPending

	const manualRecordings =
		selectedData?.full_record?.callHistory
			?.filter((call: any) => call.pitchReport?.call_recording)
			?.reverse() || []

	return (
		<>
			<PageTitle breadcrumbs={[]}>Follow Up Report</PageTitle>

			<style>{`
				.data-row {
					cursor: pointer;
					border-bottom: 1px solid #f4f4f8;
				}

				.data-row td {
					padding: 14px 12px;
					vertical-align: middle;
				}

				.sr-badge {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 32px;
					height: 32px;
					border-radius: 8px;
					background: #f1f3f9;
					color: #7e8299;
					font-weight: 700;
					font-size: 12px;
				}

				.text-cell {
					font-weight: 500;
					color: #181c32;
					font-size: 13px;
				}
				.recording-table thead th {
					padding-top: 0.75rem !important;
					padding-bottom: 0.75rem !important;
					letter-spacing: 0.03rem;
					font-size: 1.1rem !important;
					font-weight: 600 !important;
					color: #A1A5B7 !important;
				}
				.recording-table thead tr {
					border-radius: 0.625rem;
					overflow: hidden;
				}
				.recording-table thead th:first-child {
					border-top-left-radius: 0.625rem;
					border-bottom-left-radius: 0.625rem;
				}
				.recording-table thead th:last-child {
					border-top-right-radius: 0.625rem;
					border-bottom-right-radius: 0.625rem;
				}
				.recording-table tbody td {
					padding-top: 1.25rem !important;
					padding-bottom: 1.25rem !important;
				}
				.audio-player-custom {
					height: 32px;
					width: 350px;
					border-radius: 30px;
					background: #f1f3f9;
				}
			`}</style>

			{/* ================= USER INFORMATION CARD ================= */}

			<div className='card mb-8 shadow-sm border-0'>
				<div className='card-body p-8'>
					<div className='d-flex align-items-center mb-6'>
						<div className='symbol symbol-75px me-5'>
							<div className='symbol-label bg-light-primary text-primary fw-bold fs-2'>
								{selectedData?.name?.charAt(0)}
							</div>
						</div>

						<div>
							<h3 className='fw-bold text-gray-900 mb-1'>{selectedData?.name}</h3>
							<span className='badge badge-light-success me-2'>{selectedData?.gender}</span>
						</div>
					</div>

					<div className='row g-6'>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Email Address</div>
								<div className='fw-bold fs-6'>
									{selectedData?.email && selectedData.email !== 'N/A' ? selectedData.email : '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Phone Number</div>
								<div className='fw-bold fs-6'>
									{selectedData?.phone && selectedData.phone !== 'N/A' ? selectedData.phone : '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Last Call</div>
								<div className='fw-bold fs-6'>
									{selectedData?.call_date && selectedData.call_date !== 'N/A'
										? selectedData.call_date
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Campaign</div>
								<div className='fw-bold fs-6 text-truncate'>
									{selectedData?.ad_name && selectedData.ad_name !== 'N/A'
										? selectedData.ad_name
										: '-'}
								</div>
							</div>
						</div>
					</div>

					{/* IVR INFO SECTION */}
					<div className='separator separator-dashed my-6'></div>
					<div className='d-flex flex-wrap align-items-center gap-10'>
						<div className='d-flex align-items-center'>
							<div className='symbol symbol-35px me-3'>
								<div className='symbol-label bg-light-danger text-danger'>
									<i className='bi bi-telephone-outbound fs-4'></i>
								</div>
							</div>
							<div className='d-flex flex-column'>
								<span className='text-muted fs-8 fw-bold text-uppercase'>FGIIT DID</span>
								<span className='fw-bold fs-7 text-gray-800'>08062985216</span>
							</div>
						</div>

						<div className='d-flex align-items-center'>
							<div className='symbol symbol-35px me-3'>
								<div className='symbol-label bg-light-primary text-primary'>
									<i className='bi bi-people fs-4'></i>
								</div>
							</div>
							<div className='d-flex flex-column'>
								<span className='text-muted fs-8 fw-bold text-uppercase'>Members Information</span>
								<div className='d-flex flex-wrap gap-2 mt-1'>
									<span className='badge badge-light-primary fw-bold fs-8 px-3 py-2'>
										Azaz: 08347383007
									</span>
									<span className='badge badge-light-primary fw-bold fs-8 px-3 py-2'>
										Ravi: 08758759658
									</span>
									<span className='badge badge-light-primary fw-bold fs-8 px-3 py-2'>
										Chirag: 07874601000
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ===== TABLE CARD ===== */}
			<KTCard>
				{/* Filters Section */}
				<div className='card-header border-0 pt-6'>
					<div className='d-flex flex-wrap align-items-center gap-4'>
						<button
							className='btn btn-sm btn-icon btn-light me-1'
							title='Go Back'
							onClick={() => navigate('/fgiit/follow-up-report-list')}
							style={{ borderRadius: '10px', width: '36px', height: '36px' }}>
							<i className='bi bi-arrow-left fs-4'></i>
						</button>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>

					<div className='d-flex align-items-center gap-3'>
						<LengthMenu
							expenseData={jobData}
							handleItemsPerPageChange={(value: number) =>
								setPagination({ ...pagination, itemsPerPage: value })
							}
						/>
						{selectedData?.phone && selectedData.phone !== 'N/A' && (
							<TableButton
								action='edit'
								text='Click to Call'
								showIcon={false}
								className='btn-sm btn-info'
								onClick={() => setShowCallModal(true)}
							/>
						)}
						{canAddFollowUp && (
							<TableButton
								action='add'
								text='Add Follow Up'
								showIcon={false}
								className='btn btn-primary fw-bolder px-8'
								onClick={handleAddFollowUp}
							/>
						)}
					</div>
				</div>

				<div className='card-body py-4'>
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
										<td className='ps-8'>
											<span className='sr-badge'>{actualIndex}</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-35px symbol-circle me-3'>
													<span className='symbol-label bg-light-danger text-danger fw-bold fs-7'>
														{data.telecaller_name?.charAt(0)}
													</span>
												</div>
												<span className='fw-bold text-gray-800 fs-6'>
													{data.telecaller_name || 'N/A'}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex flex-column gap-1'>
												{data.display_stages.map((stage: any, idx: number) => (
													<div
														key={idx}
														className='fs-7 fw-bold text-gray-800'
														style={{ display: 'flex', alignItems: 'start' }}>
														<span
															style={{
																marginRight: '10px',
																fontSize: '1.1rem',
																marginTop: '-2px',
															}}>
															•
														</span>
														<span>
															{stage.label}
															{stage.skipped && <span className='ms-1 text-danger'>(Skipped)</span>}
														</span>
													</div>
												))}
												{data.is_pitch_report_pending === true && (
													<div
														className='fs-7 fw-bold text-danger mt-1'
														style={{ paddingLeft: '1.4rem' }}>
														Pitch Report Pending
													</div>
												)}
											</div>
										</td>
										<td>
											<div className='d-flex flex-column'>
												<span className='fw-bold text-gray-800 fs-7'>
													{data.call_date?.split(',')[0]}
												</span>
												<span className='text-muted fs-8 fw-bold'>
													{data.call_date?.split(',')[1]}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<TableButton
													action='view'
													to={`/fgiit/view-follow-up-report?id=${data.parent_id}`}
												/>
												{data.is_pitch_report_pending === true && (
													<TableButton
														action='edit'
														to={`/fgiit/add-follow-up-report?edit=true&id=${
															data.parent_id
														}&pitchPending=true&callHistoryId=${
															data.call_id
														}&returnedFrom=${encodeURIComponent(data.returned_from)}`}
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
														<div className='fw-semibold text-muted mb-1'>Last Call:</div>
														<div className='fw-bold'>{data.call_date}</div>
													</div>

													{/* Document Thumbnails */}
													{(() => {
														const history = data.full_record?.callHistory || []
														const admissionCall = [...history]
															.reverse()
															.find(
																(c: any) =>
																	c.admissionForm &&
																	(c.admissionForm.firstName ||
																		c.admissionForm.aadhaarCardFront ||
																		c.admissionForm.aadhaarCardBack ||
																		c.admissionForm.marksheet ||
																		c.admissionForm.photo)
															)
														const admission = admissionCall?.admissionForm

														if (!admission) return null

														return (
															<div className='col-12 mt-4'>
																<div className='fw-semibold text-muted mb-2'>
																	Admission Documents:
																</div>
																<div className='d-flex flex-wrap gap-3'>
																	{[
																		{ label: 'Photo', url: admission.photo },
																		{ label: 'Aadhaar (F)', url: admission.aadhaarCardFront },
																		{ label: 'Aadhaar (B)', url: admission.aadhaarCardBack },
																		{ label: 'Marksheet', url: admission.marksheet },
																	]
																		.filter((doc) => doc.url)
																		.map((doc, idx) => (
																			<div
																				key={idx}
																				className='d-flex flex-column align-items-center'>
																				<a
																					href={doc.url}
																					target='_blank'
																					rel='noreferrer'
																					className='border rounded bg-white d-flex align-items-center justify-content-center shadow-sm'
																					style={{
																						width: '60px',
																						height: '60px',
																						overflow: 'hidden',
																					}}
																					title={doc.label}>
																					{doc.url.toLowerCase().endsWith('.pdf') ? (
																						<i className='bi bi-file-earmark-pdf text-danger fs-2'></i>
																					) : (
																						<img
																							src={doc.url}
																							alt={doc.label}
																							style={{
																								width: '100%',
																								height: '100%',
																								objectFit: 'cover',
																							}}
																						/>
																					)}
																				</a>
																				<span
																					className='text-muted mt-1'
																					style={{ fontSize: '10px' }}>
																					{doc.label}
																				</span>
																			</div>
																		))}
																</div>
															</div>
														)
													})()}
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
							<b>No records found</b>
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
			</KTCard>

			{/* ===== CALL MODAL ===== */}
			{showCallModal && (
				<div
					className='modal fade show d-block'
					tabIndex={-1}
					style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className='modal-dialog modal-dialog-centered'>
						<div className='modal-content shadow-lg border-0'>
							<div className='modal-header py-4'>
								<h4 className='modal-title fw-bold text-gray-900'>Select IVR Member</h4>
								<button
									type='button'
									className='btn-close'
									onClick={() => setShowCallModal(false)}></button>
							</div>
							<div className='modal-body px-8'>
								<p className='text-gray-600 mb-7 fs-6'>
									Choose the agent identity to initiate the call to{' '}
									<strong>{selectedData?.name}</strong>.
								</p>

								<div className='fv-row'>
									<label className='form-label fw-bold fs-6 mb-2'>Calling Member</label>
									<div className='row g-4'>
										{ivrMembers.map((member) => (
											<div
												className='col-12'
												key={member.member_id}>
												<label
													className={`d-flex align-items-center p-4 rounded border border-2 cursor-pointer transition-all ${
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
														<span className='fw-bold text-gray-800 fs-6'>{member.member_name}</span>
														<span className='text-muted fs-7'>{member.member_num}</span>
													</div>
												</label>
											</div>
										))}
									</div>
								</div>
							</div>
							<div className='modal-footer border-0 pt-0 pb-8 px-8 justify-content-center'>
								<button
									type='button'
									className='btn btn-light me-3 px-8'
									onClick={() => setShowCallModal(false)}>
									Cancel
								</button>
								<button
									type='button'
									className='btn btn-primary px-10'
									onClick={handleInitiateCall}>
									<i className='ki-duotone ki-phone fs-2 me-2'>
										<span className='path1'></span>
										<span className='path2'></span>
									</i>
									Initiate Call
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== CALL RECORDINGS TABLE CARD ===== */}
			<div className='card mb-8 shadow-sm border-0 mt-8'>
				<div className='card-header border-0 pt-6'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-gray-900'>Call Recordings</span>
						<span className='text-muted mt-1 fw-semibold fs-7'>Recordings for this lead</span>
					</h3>
				</div>
				<div className='card-body p-0'>
					<div className='table-responsive'>
						<table className='table table-flush align-middle table-row-bordered table-row-gray-200 gs-9 gy-6 mb-0 recording-table'>
							<thead>
								<tr className='bg-light fw-bold text-muted fs-2'>
									<th className='min-w-50px ps-9'>No.</th>
									<th className='min-w-50px'>Dir.</th>
									<th className='min-w-150px'>Date & Time</th>
									<th className='min-w-125px'>Agent Name</th>
									<th className='min-w-125px'>Status</th>
									<th className='min-w-100px'>Duration</th>
									<th className='min-w-250px text-center pe-9'>Recording Player</th>
								</tr>
							</thead>
							<tbody>
								{logsLoading ? (
									<tr>
										<td
											colSpan={5}
											className='text-center py-20'>
											<div
												className='spinner-border text-primary w-40px h-40px'
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
												className='hover-elevate-up'>
												<td className='ps-9'>
													<span className='fw-bold text-gray-600'>
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
														<span className='text-gray-900 fw-bold fs-6'>
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
													<span className='text-gray-700 fw-bold fs-6'>
														{log.raw_payload?.receiver_name || '-'}
													</span>
												</td>
												<td>
													<span
														className={`badge badge-light-${
															log.status === 'ANSWER' ? 'success' : 'danger'
														} rounded-pill px-4 py-3 fw-bold`}>
														{log.status === 'ANSWER' ? 'Answered' : log.status}
													</span>
												</td>
												<td>
													<span className='text-gray-700 fw-bold fs-6'>
														{log.raw_payload?.CallDuration
															? `${log.raw_payload.CallDuration}s`
															: 'N/A'}
													</span>
												</td>
												<td className='text-center pe-9'>
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
															<source src={log.recording_url} />
														</audio>
													</div>
												</td>
											</tr>
										))
								) : (
									<tr>
										<td
											colSpan={7}
											className='text-center py-10'>
											<div className='d-flex flex-column align-items-center'>
												<i className='bi bi-telephone-x fs-2x text-muted mb-3'></i>
												<span className='text-muted fw-bold fs-6'>
													No recordings found for this lead number
												</span>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{callLogs.length > logsPerPage && (
						<div className='px-9 py-5'>
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
			<div className='card mb-8 shadow-sm border-0 mt-8'>
				<div className='card-header border-0 pt-6'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-gray-900'>Manual Call Recordings</span>
						<span className='text-muted mt-1 fw-semibold fs-7'>Manually uploaded recordings</span>
					</h3>
				</div>
				<div className='card-body p-0'>
					<div className='table-responsive'>
						<table className='table table-flush align-middle table-row-bordered table-row-gray-200 gs-9 gy-6 mb-0 recording-table'>
							<thead>
								<tr className='bg-light fw-bold text-muted fs-2'>
									<th className='min-w-50px ps-9'>No.</th>
									<th className='min-w-150px'>Date & Time</th>
									<th className='min-w-125px'>Sales Person</th>
									<th className='min-w-250px text-center pe-9'>Recording Player</th>
								</tr>
							</thead>
							<tbody>
								{manualRecordings.length > 0 ? (
									manualRecordings.map((call: any, idx: number) => (
										<tr
											key={idx}
											className='hover-elevate-up'>
											<td className='ps-9'>
												<span className='fw-bold text-gray-600'>{idx + 1}</span>
											</td>
											<td>
												<div className='d-flex flex-column'>
													<span className='text-gray-900 fw-bold fs-6'>
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
												<span className='text-gray-700 fw-bold fs-6'>
													{call.pitchReport?.telecaller_name || '-'}
												</span>
											</td>
											<td className='text-center pe-9'>
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
											className='text-center py-10'>
											<div className='d-flex flex-column align-items-center'>
												<i className='bi bi-mic-mute fs-2x text-muted mb-3'></i>
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
		</>
	)
}

export default FollowUpReportInnerList
