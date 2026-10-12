import React, { useEffect, useState, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetFwgFollowUpReport } from '../../../../Functions/FGGroup'
import { GetGnFollowUpReport } from '../../../../Functions/FGGroup/GnFollowUpReport'
import toast from 'react-hot-toast'
import { useSearchParams, useParams } from 'react-router-dom'

const AutomationFollowUpReportInnerList: React.FC = () => {
	const { brand } = useParams<{ brand: 'fwg' | 'gn' }>()
	const [searchParams] = useSearchParams()

	const [searchTerm, setSearchTerm] = useState('')
	const [rawApiData, setRawApiData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>({ totalPages: 1 })
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [sort, setSort] = useState('call_date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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

	const [selectedData, setSelectedData] = useState<any>(null)

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
				full_record: null,
			})
		}
	}, [searchParams])

	const fetchReports = async () => {
		setLoading(true)
		try {
			const mobileParam = searchParams.get('mobile')
			const query = {
				mobile: mobileParam || undefined,
				search: searchTerm,
				page: pagination.page,
				limit: pagination.itemsPerPage,
			}

			let response: any
			if (brand === 'fwg') {
				response = await GetFwgFollowUpReport(query)
			} else {
				response = await GetGnFollowUpReport(query)
			}

			if (response.status === 200 && response.data) {
				const data = response.data.data || response.data
				setRawApiData(Array.isArray(data) ? data : [data])
				
				const paginationInfo = response.data.pagination || (response as any).metadata?.pagination
				setMetaData({
					totalPages: paginationInfo?.totalPages || 1,
				})
			} else {
				toast.error(response.message || 'Failed to fetch follow-up reports')
			}
		} catch (error: any) {
			console.error('Error fetching follow-up reports:', error)
			toast.error(error.message || 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	const jobData = useMemo(() => {
		const transformedData: any[] = []

		rawApiData.forEach((item: any) => {
			const personalDetails = item.personalDetails || {}

			item.callHistory?.forEach((call: any, callIndex: number) => {
				const pitchReport = call.pitchReport || {}

				if (brand === 'fwg') {
					if (!call.returnFrom) return
					
					const hasPitchReport = Boolean(
						pitchReport.telecaller_name ||
						pitchReport.interest_level ||
						pitchReport.follow_up_date ||
						pitchReport.objections
					)

					transformedData.push({
						_id: `${item._id}_${call._id}`,
						parent_id: item._id,
						call_id: call._id,
						call_number: callIndex + 1,
						name: personalDetails?.full_name || personalDetails?.client_name || 'N/A',
						email: personalDetails?.email || 'N/A',
						phone: personalDetails?.mobile || 'N/A',
						gender: personalDetails?.gender || 'N/A',
						sales_person: item.createdBy?.name || 'N/A',
						telecaller_name: pitchReport?.telecaller_name || 'N/A',
						returned_from: call.returnFrom || 'N/A',
						reason: pitchReport?.objections || 'N/A',
						call_date: call.callDate ? new Date(call.callDate).toLocaleString('en-IN') : 'N/A',
						last_conversation: call.callDate ? new Date(call.callDate).toLocaleString() : 'N/A',
						is_pitch_report_pending: !hasPitchReport,
						full_record: item
					})
				} else {
					const hasPitchReport = Boolean(
						pitchReport.telecaller_name ||
						pitchReport.interest_level ||
						pitchReport.pitch_follow_up_date ||
						pitchReport.objections
					)

					let returnedFrom = 'N/A'
					if (call.sampleUpdate && Object.keys(call.sampleUpdate).length > 0) {
						returnedFrom = 'Sample Update'
					} else if (call.sampleSelection && (call.sampleSelection.sample_interested !== undefined || call.sampleSelection.selected_samples?.length > 0)) {
						returnedFrom = 'Sample Selection'
					} else if (call.productDetails && (call.productDetails.budget || call.productDetails.product_type?.length > 0)) {
						returnedFrom = 'Product Details'
					}

					transformedData.push({
						_id: `${item._id}_${call._id}`,
						parent_id: item._id,
						call_id: call._id,
						call_number: callIndex + 1,
						name: personalDetails?.client_name || personalDetails?.full_name || 'N/A',
						phone: personalDetails?.mobile || 'N/A',
						email: personalDetails?.email || 'N/A',
						gender: personalDetails?.gender || 'N/A',
						sales_person: item.createdBy?.name || 'N/A',
						telecaller_name: pitchReport?.telecaller_name || 'N/A',
						returned_from: returnedFrom,
						reason: pitchReport?.objections || 'N/A',
						call_date: call.callDate ? new Date(call.callDate).toLocaleString('en-IN') : 'N/A',
						last_conversation: call.callDate ? new Date(call.callDate).toLocaleString() : 'N/A',
						is_pitch_report_pending: !hasPitchReport,
						full_record: item
					})
				}
			})
		})

		const filteredBySalesPerson = salesPerson 
			? transformedData.filter(item => item.sales_person?.toLowerCase() === salesPerson.toLowerCase() || item.telecaller_name?.toLowerCase() === salesPerson.toLowerCase())
			: transformedData

		const filteredBySearch = filteredBySalesPerson.filter(item => {
			if (!searchTerm) return true
			const search = searchTerm.toLowerCase()
			return (
				item.name?.toLowerCase().includes(search) ||
				item.email?.toLowerCase().includes(search) ||
				item.phone?.toLowerCase().includes(search) ||
				item.telecaller_name?.toLowerCase().includes(search) ||
				item.returned_from?.toLowerCase().includes(search) ||
				item.reason?.toLowerCase().includes(search)
			)
		})

		return filteredBySearch
	}, [rawApiData, brand, salesPerson, searchTerm])

	useEffect(() => {
		if (jobData.length > 0) {
			const latest = jobData[jobData.length - 1]
			setSelectedData((prev: any) => ({
				...prev,
				...latest
			}))
		} else if (rawApiData.length > 0) {
			const firstRecord = rawApiData[0]
			const pd = firstRecord.personalDetails || {}
			setSelectedData((prev: any) => ({
				...prev,
				name: pd.client_name || pd.full_name || prev?.name || 'N/A',
				phone: pd.mobile || prev?.phone || 'N/A',
				email: pd.email || prev?.email || 'N/A',
				gender: pd.gender || 'N/A',
				sales_person: firstRecord.createdBy?.name || 'N/A',
				parent_id: firstRecord._id,
				full_record: firstRecord,
			}))
		}
	}, [jobData, rawApiData])

	useEffect(() => {
		fetchReports()
	}, [pagination.page, pagination.itemsPerPage, searchTerm, brand])

	const shouldShowAddButton = useMemo(() => {
		if (brand === 'fwg') {
			const fullRecord = selectedData?.full_record
			if (!fullRecord) return true
			const allCalls = fullRecord.callHistory || []
			const isGoalFilled = allCalls.some((c: any) => c.goals && c.goals.length > 0)
			const isBodyCheckupFilled = allCalls.some((c: any) => c.bodyCheckup && (
				(c.bodyCheckup.medical_condition && c.bodyCheckup.medical_condition.length > 0) ||
				(c.bodyCheckup.food_allergy && c.bodyCheckup.food_allergy.length > 0) ||
				(c.bodyCheckup.previous_injury && c.bodyCheckup.previous_injury.length > 0)
			))
			const isLifestyleFilled = allCalls.some((c: any) => !!c.lifestyle)
			const isEnduranceTestFilled = allCalls.some((c: any) => !!c.enduranceTest)
			const isProgramDetailsFilled = allCalls.some((c: any) => !!c.programDetails)
			return !(isGoalFilled && isBodyCheckupFilled && isLifestyleFilled && isEnduranceTestFilled && isProgramDetailsFilled)
		} else {
			const hasPendingPitchReport = jobData.some((data: any) => data.is_pitch_report_pending === true)
			if (hasPendingPitchReport) return false
			const latestCall = selectedData?.full_record?.callHistory?.[selectedData?.full_record?.callHistory.length - 1]
			return !(
				latestCall?.productDetails && (latestCall.productDetails.budget || latestCall.productDetails.product_type?.length) &&
				latestCall?.sampleSelection?.sample_interested !== undefined &&
				latestCall?.sampleUpdate?.sample_taste_feedback &&
				(latestCall?.pitchReport?.telecaller_name || latestCall?.pitchReport?.interest_level || latestCall?.pitchReport?.objections)
			)
		}
	}, [jobData, selectedData, brand])
	
	const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

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
		<>
			<PageTitle breadcrumbs={[]}>{brand?.toUpperCase()} Follow Up Report</PageTitle>

			<style>{`
				.data-row { cursor: pointer; border-bottom: 1px solid #f4f4f8; }
				.data-row td { padding: 14px 12px; vertical-align: middle; }
				.sr-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: #f1f3f9; color: #7e8299; font-weight: 700; font-size: 12px; }
				.text-cell { font-weight: 500; color: #181c32; font-size: 13px; }
			`}</style>

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
							<div className='d-flex gap-2'>
								<span className='badge badge-light-info'>{brand?.toUpperCase()} CLIENT</span>
								{selectedData?.gender && selectedData.gender !== 'N/A' && (
									<span className='badge badge-light-success'>{selectedData.gender}</span>
								)}
							</div>
						</div>
					</div>

					<div className='row g-6'>
						<div className='col-md-4'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Email Address</div>
								<div className='fw-bold fs-6'>{selectedData?.email || 'N/A'}</div>
							</div>
						</div>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Phone Number</div>
								<div className='fw-bold fs-6'>{selectedData?.phone || 'N/A'}</div>
							</div>
						</div>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Sales Person</div>
								<div className='fw-bold fs-6'>{selectedData?.sales_person || 'N/A'}</div>
							</div>
						</div>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Last Conversation</div>
								<div className='fw-bold fs-6'>{selectedData?.call_date || 'N/A'}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='d-flex flex-wrap align-items-center gap-4'>
						<SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
						<LengthMenu
							expenseData={jobData}
							handleItemsPerPageChange={(v: number) => setPagination(p => ({ ...p, itemsPerPage: v }))}
						/>

						<select
							className='form-select form-select-sm w-auto'
							value={salesPerson}
							onChange={(e) => setSalesPerson(e.target.value)}
						>
							{salesPersonList.map((person) => (
								<option key={person.value} value={person.value}>
									{person.label}
								</option>
							))}
						</select>
					</div>

					{shouldShowAddButton && (
						<div>
							<TableButton
								action='add'
								to={`/automation/${brand}/add-follow-up-report?id=${selectedData?.parent_id || ''}&mobile=${encodeURIComponent(selectedData?.phone || '')}&email=${encodeURIComponent(selectedData?.email || '')}&name=${encodeURIComponent(selectedData?.name || '')}&city=${encodeURIComponent(selectedData?.city || '')}`}
								text='Add Follow Up'
								showIcon={false}
								backgroundDark={true}
							/>
						</div>
					)}
				</div>

				<div className='card-body py-4'>
					<div className='table-responsive'>
						<Table
							data={jobData}
							columns={sortableFields}
							loading={loading}
							sort={sort}
							sortOrder={sortOrder}
							visibleDetails={visibleDetails}
							onSortChange={handleSortChange}
							pagination={pagination}
							setPagination={setPagination}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr onClick={() => { setSelectedData(data); handleRowClick(data._id); }} className='data-row'>
										<td className='ps-6'><span className='sr-badge'>{actualIndex}</span></td>
										<td><span className='text-cell'>{data.telecaller_name}</span></td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-cell'>{data.returned_from}</span>
												{data.is_pitch_report_pending && <span className='text-danger fs-9 fw-bold mt-1'>Pitch Report Pending</span>}
											</div>
										</td>
										<td><span className='text-cell'>{data.call_date}</span></td>
										<td>
											<div className='d-flex align-items-center gap-2'>
												<TableButton
													action='view'
													to={`/automation/${brand}/view-follow-up-report?id=${data.parent_id}&call_id=${data.call_id}`}
												/>
												{data.is_pitch_report_pending && (
													<TableButton
														action='edit'
														to={`/automation/${brand}/update-follow-up-report?edit=true&id=${data.parent_id}&pitchPending=true&call_id=${data.call_id}`}
													/>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className='bg-light'>
											<td colSpan={7} className='p-6'>
												<div className='row'>
													<div className='col-md-3'>
														<div className='fw-semibold text-muted mb-1'>{brand === 'fwg' ? 'Sales Person' : 'Telecaller'}:</div>
														<div className='fw-bold'>{brand === 'fwg' ? data.sales_person : data.telecaller_name}</div>
													</div>
													<div className='col-md-3'>
														<div className='fw-semibold text-muted mb-1'>Call Number:</div>
														<div className='fw-bold'>#{data.call_number}</div>
													</div>
													<div className='col-md-3'>
														<div className='fw-semibold text-muted mb-1'>Full Date:</div>
														<div className='fw-bold'>{data.call_date}</div>
													</div>
													{data.reason && data.reason !== 'N/A' && (
														<div className='col-md-3'>
															<div className='fw-semibold text-muted mb-1'>Reason:</div>
															<span className='badge badge-light-warning fw-bold'>
																{data.reason}
															</span>
														</div>
													)}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							removeAction={true}
						/>
					</div>

					{jobData.length > 0 ? (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={(p: number) => setPagination(prev => ({ ...prev, page: p }))}
						/>
					) : !loading && (
						<div className='text-center py-10'><b>No records found</b></div>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default AutomationFollowUpReportInnerList
