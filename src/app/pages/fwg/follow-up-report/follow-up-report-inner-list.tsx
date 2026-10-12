import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetFwgFollowUpReport } from '../../../Functions/FGGroup'
import {
	GetIVRCallLogs,
	GetIVRMembers,
	InitiateCall,
} from '../../../Functions/FGGroup/IVRFunctions'

const FollowUpReportInnerList: React.FC = () => {
	const intl = useIntl()
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const adNameFromUrl = decodeURIComponent(searchParams.get('ad_name') || '')
	const leadCreatedAtFromUrl = decodeURIComponent(searchParams.get('lead_created_at') || '')
	const platformFromUrl = decodeURIComponent(searchParams.get('platform') || '')
	const additionalNoteFromUrl = decodeURIComponent(searchParams.get('additional_note') || '')

	const [searchTerm, setSearchTerm] = useState('')
	const [jobData, setJobData] = useState<any>([])
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
		{ label: 'Neha Mehta', value: 'neha_mehta' },
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

		if (mobileParam || nameParam) {
			setSelectedData({
				name: nameParam || 'N/A',
				phone: mobileParam || 'N/A',
				email: emailParam || 'N/A',
				city: cityParam || 'N/A',
				ad_name: adNameFromUrl || 'N/A',
				lead_created_at: leadCreatedAtFromUrl || 'N/A',
				platform: platformFromUrl || 'N/A',
				additional_note: additionalNoteFromUrl || 'N/A',
				full_record: null,
			})
		}
	}, [])

	const fetchIvrMembers = async () => {
		try {
			const response = await GetIVRMembers()
			const members = response?.getmember || []
			if (Array.isArray(members)) {
				const fwgNumbers = [
					'09104984354', // Kaushik FWG
					'07874601000', // Chirag
				]
				const normalize = (n: any) => n?.toString().replace(/^0+/, '').replace(/^91/, '').trim()
				const fwgNumbersNormalized = fwgNumbers.map(normalize)

				const filteredMembers = members.filter((m: any) =>
					fwgNumbersNormalized.includes(normalize(m.member_num))
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
				deskphone: '08069247707',
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

	const fetchData = async () => {
		setLoading(true)
		try {
			const mobileParam = searchParams.get('mobile')
			const res = await GetFwgFollowUpReport({
				mobile: mobileParam || undefined,
				page: 1,
				limit: 1000,
				search: searchTerm,
			})

			const data = res.data

			// Flatten callHistory - each call becomes a separate row
			const transformedData: any[] = []

			data.data.forEach((item: any) => {
				const personalDetails = item.personalDetails || {}

				// Loop through each callHistory item
				item.callHistory?.forEach((call: any, callIndex: number) => {
					// Skip entries without returnFrom (personal details only, no follow-up data)
					if (!call.returnFrom) {
						return
					}

					const pitchReport = call.pitchReport || {}

					const hasPitchReport = Boolean(
						pitchReport.telecaller_name && pitchReport.telecaller_name.trim() !== ''
					)

					if (
						(call.returnFrom === 'Personal Details' || call.returnFrom === 'Body Analysis') &&
						!hasPitchReport
					) {
						return
					}

					const getCompletedSections = (c: any) => {
						const sections: string[] = []
						if (
							c.goals &&
							(c.goals.is_skipped || (c.goals.selected_goals && c.goals.selected_goals.length > 0))
						) {
							sections.push(c.goals.is_skipped ? '• Goal (Skipped)' : '• Goal')
						}

						if (
							c.bodyCheckup &&
							(c.bodyCheckup.is_skipped ||
								(c.bodyCheckup.food_allergy && c.bodyCheckup.food_allergy.length > 0) ||
								(c.bodyCheckup.medical_condition && c.bodyCheckup.medical_condition.length > 0) ||
								(c.bodyCheckup.previous_injury && c.bodyCheckup.previous_injury.length > 0))
						) {
							sections.push(
								c.bodyCheckup.is_skipped ? '• Body checkup (Skipped)' : '• Body checkup'
							)
						}

						if (c.lifestyle && Object.keys(c.lifestyle).length > 0) {
							sections.push(c.lifestyle.is_skipped ? '• Life Style (Skipped)' : '• Life Style')
						}

						if (c.enduranceTest && Object.keys(c.enduranceTest).length > 0) {
							if (c.enduranceTest.is_skipped) {
								sections.push('• Endurance Test (Skipped)')
							} else {
								sections.push('• Endurance Test')
							}
						}

						if (c.programDetails && Object.keys(c.programDetails).length > 0) {
							sections.push(
								c.programDetails.is_skipped ? '• Program Details (Skipped)' : '• Program Details'
							)
						}

						return sections
					}

					transformedData.push({
						_id: `${item._id}_${call._id}`,
						parent_id: item._id,
						call_id: call._id,
						call_number: callIndex + 1,
						name: personalDetails?.full_name || 'N/A',
						email: personalDetails?.email || 'N/A',
						phone: personalDetails?.mobile || 'N/A',
						gender: personalDetails?.gender || 'N/A',
						ad_name: personalDetails?.ad_name || 'N/A',
						lead_created_at: personalDetails?.lead_created_at || 'N/A',
						platform: personalDetails?.platform || 'N/A',
						additional_note: personalDetails?.additional_note || 'N/A',
						sales_person: item.createdBy?.name || 'N/A',
						returned_from: call.returnFrom || 'N/A',
						telecaller_name: call.pitchReport?.telecaller_name || '',
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
						last_conversation: call.callDate ? new Date(call.callDate).toLocaleString() : 'N/A',
						is_pitch_report_pending:
							!hasPitchReport &&
							call.returnFrom !== 'Personal Details' &&
							call.returnFrom !== 'Body Analysis',
						has_pitch_report: hasPitchReport,
						reason: pitchReport.objections || 'N/A',
						full_record: item,
						completed_sections: getCompletedSections(call),
					})
				})
			})

			setJobData(transformedData)
			setMetaData(data.pagination)

			// Update selectedData with more complete information from API if available
			if (transformedData.length > 0) {
				// Sync with the LATEST call entry
				setSelectedData(transformedData[transformedData.length - 1])
			} else if (data.data?.length > 0) {
				// No callHistory rows yet, but personal details exist — set selectedData so Add button gets the id
				const firstItem = data.data[0]
				const pd = firstItem.personalDetails || {}
				setSelectedData({
					parent_id: firstItem._id,
					call_id: null,
					name: pd.full_name || pd.client_name || 'N/A',
					email: pd.email || 'N/A',
					phone: pd.mobile || 'N/A',
					gender: pd.gender || 'N/A',
					ad_name: pd.ad_name || 'N/A',
					lead_created_at: pd.lead_created_at || 'N/A',
					platform: pd.platform || 'N/A',
					additional_note: pd.additional_note || 'N/A',
					sales_person: firstItem.createdBy?.name || 'N/A',
					last_conversation: 'N/A',
					is_pitch_report_pending: false,
					full_record: firstItem,
				})
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to fetch follow up reports.')
		} finally {
			setLoading(false)
		}
	}

	const shouldShowAddButton = useMemo(() => {
		const hasPendingPitchReport = jobData.some((data: any) => data.is_pitch_report_pending === true)
		return !hasPendingPitchReport
	}, [jobData])

	const manualRecordings =
		selectedData?.full_record?.callHistory
			?.filter((call: any) => call.pitchReport?.call_recording)
			?.reverse() || []

	useEffect(() => {
		fetchData()
	}, [searchTerm])

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
		{ field: 'telecaller_name', title: 'Telecaller Name' },
		{ field: 'returned_from', title: 'Returned From' },
		{ field: 'last_conversation', title: 'Last Conversation' },
		{ field: 'action', title: 'Action' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

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
				.pagination {
					display: flex;
					flex-wrap: nowrap;
					justify-content: flex-end;
					margin-bottom: 0;
				}
				.page-item {
					margin: 0 2px;
				}
				.page-link {
					border-radius: 0.475rem !important;
					border: none;
					background-color: #f5f8fa;
					color: #5e6278;
					padding: 0.75rem 1rem;
					display: flex;
					align-items: center;
					justify-content: center;
					min-width: 35px;
					height: 35px;
				}
				.page-item.active .page-link {
					background-color: #009ef7;
					color: #fff;
				}
				.page-item.disabled .page-link {
					background-color: #f5f8fa;
					color: #a1a5b7;
					opacity: 0.6;
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
									{selectedData?.last_conversation && selectedData.last_conversation !== 'N/A'
										? selectedData.last_conversation
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Campaign</div>
								<div className='fw-bold fs-6'>
									{selectedData?.ad_name && selectedData.ad_name !== 'N/A'
										? selectedData.ad_name
										: '-'}
								</div>
							</div>
						</div>

						<div className='col-md-4'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Platform</div>
								<div className='fw-bold fs-6'>
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
						<div className='col-md-4'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Lead Created At</div>
								<div className='fw-bold fs-6'>
									{selectedData?.lead_created_at && selectedData.lead_created_at !== 'N/A'
										? selectedData.lead_created_at
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
								<span className='text-muted fs-8 fw-bold text-uppercase'>FWG DID</span>
								<span className='fw-bold fs-7 text-gray-800'>08069247707</span>
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
										Kaushik FWG: 09104984354
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

			{/* ================= MAIN TABLE CARD ================= */}

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='d-flex flex-wrap align-items-center gap-4'>
						<button
							className='btn btn-sm btn-icon btn-light me-1'
							title='Go Back'
							onClick={() => navigate('/fwg/follow-up-report-list')}
							style={{ borderRadius: '10px', width: '36px', height: '36px' }}>
							<i className='bi bi-arrow-left fs-4'></i>
						</button>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>

					<div className='d-flex align-items-center gap-2'>
						{selectedData?.phone && selectedData.phone !== 'N/A' && (
							<TableButton
								action='edit'
								text='Click to Call'
								showIcon={false}
								className='btn-sm btn-info'
								onClick={() => setShowCallModal(true)}
							/>
						)}
						{shouldShowAddButton && (
							<TableButton
								action='add'
								to={`/fwg/add-follow-up-report?${
									selectedData?.parent_id ? `id=${selectedData.parent_id}&` : ''
								}mobile=${encodeURIComponent(selectedData?.phone || '')}&email=${encodeURIComponent(
									selectedData?.email || ''
								)}&name=${encodeURIComponent(selectedData?.name || '')}&city=${encodeURIComponent(
									selectedData?.city || ''
								)}&ad_name=${encodeURIComponent(
									selectedData?.ad_name !== 'N/A' ? selectedData?.ad_name : adNameFromUrl || ''
								)}&lead_created_at=${encodeURIComponent(
									selectedData?.lead_created_at !== 'N/A'
										? selectedData?.lead_created_at
										: leadCreatedAtFromUrl || ''
								)}&platform=${encodeURIComponent(
									selectedData?.platform !== 'N/A' ? selectedData?.platform : platformFromUrl || ''
								)}`}
								text='Add Follow Up'
								showIcon={false}
								backgroundDark={true}
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
										<td className='ps-6'>
											<span className='sr-badge'>{actualIndex}</span>
										</td>

										<td>
											<span className='text-cell'>{data.telecaller_name || ''}</span>
										</td>

										<td>
											<div className='d-flex flex-column'>
												{data.completed_sections?.length > 0 ? (
													data.completed_sections.map((section: string, idx: number) => {
														const isSkipped = section.includes('(Skipped)')
														const label = section.replace(' (Skipped)', '')
														return (
															<span
																key={idx}
																className='text-cell'>
																{label}
																{isSkipped && <span className='text-danger'> (Skipped)</span>}
															</span>
														)
													})
												) : (
													<span className='text-cell'>{data.returned_from || 'N/A'}</span>
												)}
												{data.is_pitch_report_pending === true && (
													<span className='text-danger fs-9 fw-bold mt-1'>
														Pitch Report Pending
													</span>
												)}
											</div>
										</td>

										<td>
											<span className='text-cell'>{data.last_conversation}</span>
										</td>

										<td>
											<div className='d-flex align-items-center gap-2'>
												<TableButton
													action='view'
													to={`/fwg/view-follow-up-report?id=${data.parent_id}&call_id=${data.call_id}`}
												/>
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
														<div className='fw-semibold text-muted mb-1'>Sales Person:</div>
														<div className='fw-bold'>{data.sales_person}</div>
													</div>
													<div className='col-md-6'>
														<div className='fw-semibold text-muted mb-1'>
															Call #{data.call_number}
														</div>
														<div className='fw-bold'>{data.call_date}</div>
													</div>
												</div>
												{data.reason !== 'N/A' && (
													<div className='mt-3'>
														<span className='badge badge-light-warning'>Reason: {data.reason}</span>
													</div>
												)}
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
									<i className='bi bi-telephone fs-2 me-2'></i>
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
											colSpan={7}
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
											className='text-center py-20'>
											<div className='d-flex flex-column align-items-center'>
												<div className='symbol symbol-60px mb-5'>
													<div className='symbol-label bg-light-warning'>
														<i className='bi bi-telephone-x fs-1 text-warning'></i>
													</div>
												</div>
												<span className='text-gray-600 fw-bold fs-5'>No recordings found</span>
												<span className='text-muted fw-semibold fs-7'>
													Calls with this number haven't been recorded yet
												</span>
											</div>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{callLogs.length > logsPerPage && (
						<div className='d-flex justify-content-end px-9 py-6'>
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
