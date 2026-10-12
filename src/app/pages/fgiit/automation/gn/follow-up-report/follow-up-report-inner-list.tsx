import React, { useEffect, useState, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../../_metronic/layout/core'
import LengthMenu from '../../../../../components/LengthMenu'
import SearchFilter from '../../../../../components/SearchFilter'
import Table from '../../../../../components/Table'
import TableButton from '../../../../../components/TableButton'
import UsersListPagination from '../../../../../components/TablePagination'
import { GetGnFollowUpReport } from '../../../../../Functions/FGGroup/GnFollowUpReport'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

const FollowUpReportInnerList: React.FC = () => {
	const intl = useIntl()
	const [searchParams] = useSearchParams()

	const [searchTerm, setSearchTerm] = useState('')
	const [rawApiData, setRawApiData] = useState<any[]>([])
	const [metaData, setMetaData] = useState<any>({ totalPages: 1 })
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })
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
	}, [])

	const fetchFollowUpReports = async () => {
		setLoading(true)
		try {
			const mobileParam = searchParams.get('mobile')
			const response = await GetGnFollowUpReport({
				mobile: mobileParam || undefined,
				search: searchTerm,
				page: pagination.page,
				limit: pagination.itemsPerPage,
			} as any)
			if (response.status === 200 && response.data) {
				setRawApiData(response.data)
				setMetaData({ totalPages: (response as any).metadata?.pagination?.totalPages || 1 })
			} else {
				toast.error(response.message || 'Failed to fetch follow-up reports')
			}
		} catch (error: any) {
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
				const hasPitchReport = Boolean(
					pitchReport.telecaller_name || pitchReport.interest_level ||
					pitchReport.pitch_follow_up_date || pitchReport.objections
				)
				const followUpDate = call.pitchReport?.pitch_follow_up_date ||
					call.productDetails?.follow_up_date || call.sampleUpdate?.final_follow_up_date

				let returnedFrom = 'N/A'
				if (call.sampleUpdate && Object.keys(call.sampleUpdate).length > 0) returnedFrom = 'Sample Update'
				else if (call.sampleSelection && (call.sampleSelection.sample_interested !== undefined || call.sampleSelection.selected_samples?.length > 0)) returnedFrom = 'Sample Selection'
				else if (call.productDetails && (call.productDetails.budget || call.productDetails.product_type?.length > 0)) returnedFrom = 'Product Details'

				transformedData.push({
					_id: `${item._id}_${call._id}`,
					parent_id: item._id,
					call_id: call._id,
					call_number: callIndex + 1,
					name: personalDetails?.client_name || 'N/A',
					phone: personalDetails?.mobile || 'N/A',
					email: personalDetails?.email || 'N/A',
					telecaller_name: pitchReport?.telecaller_name || 'N/A',
					returned_from: returnedFrom,
					call_date: call.callDate ? new Date(call.callDate).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
					follow_up_date: followUpDate ? new Date(followUpDate).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
					is_pitch_report_pending: !hasPitchReport,
					full_record: item
				})
			})
		})
		return transformedData
	}, [rawApiData])

	useEffect(() => {
		if (jobData.length > 0) {
			setSelectedData((prev: any) => ({
				...prev,
				name: jobData[0].name, phone: jobData[0].phone, email: jobData[0].email,
				call_date: jobData[0].call_date, follow_up_date: jobData[0].follow_up_date,
				parent_id: jobData[0].parent_id, full_record: jobData[0].full_record,
			}))
		} else if (rawApiData.length > 0) {
			const firstRecord = rawApiData[0]
			const pd = firstRecord.personalDetails || {}
			setSelectedData((prev: any) => ({
				...prev,
				name: pd.client_name || prev?.name || 'N/A', phone: pd.mobile || prev?.phone || 'N/A',
				email: pd.email || prev?.email || 'N/A', call_date: 'N/A', follow_up_date: 'N/A',
				parent_id: firstRecord._id, full_record: firstRecord,
			}))
		}
	}, [jobData, rawApiData])

	useEffect(() => { fetchFollowUpReports() }, [pagination.page, pagination.itemsPerPage, searchTerm])

	const shouldShowAddButton = useMemo(() => {
		const hasPendingPitchReport = jobData.some((data: any) => data.is_pitch_report_pending === true)
		if (hasPendingPitchReport) return false
		const latestCall = selectedData?.full_record?.callHistory?.[selectedData?.full_record?.callHistory.length - 1]
		return !(
			latestCall?.productDetails && (latestCall.productDetails.budget || latestCall.productDetails.product_type?.length) &&
			latestCall?.sampleSelection?.sample_interested !== undefined &&
			latestCall?.sampleUpdate?.sample_taste_feedback &&
			(latestCall?.pitchReport?.telecaller_name || latestCall?.pitchReport?.interest_level || latestCall?.pitchReport?.objections)
		)
	}, [jobData, selectedData])

	const sortableFields = [
		{ field: 'telecaller_name', title: 'Telecaller Name' },
		{ field: 'returned_from', title: 'Returned From' },
		{ field: 'call_date', title: 'Call Date' },
		{ field: 'action', title: 'Action' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) setVisibleDetails(visibleDetails === id ? null : id)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Follow Up Report</PageTitle>

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
							<div className='symbol-label bg-light-primary text-primary fw-bold fs-2'>{selectedData?.name?.charAt(0)}</div>
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
								<div className='fw-bold fs-6'>{selectedData?.email}</div>
							</div>
						</div>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Phone Number</div>
								<div className='fw-bold fs-6'>{selectedData?.phone}</div>
							</div>
						</div>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Call Date</div>
								<div className='fw-bold fs-6'>{selectedData?.call_date}</div>
							</div>
						</div>
						<div className='col-md-3'>
							<div className='bg-light rounded p-4'>
								<div className='text-muted fs-7'>Next Follow-up Date</div>
								<div className='fw-bold fs-6 text-primary'>{selectedData?.follow_up_date}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='d-flex flex-wrap align-items-center gap-4'>
						<SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
						<LengthMenu expenseData={jobData} handleItemsPerPageChange={(value: number) => setPagination({ ...pagination, itemsPerPage: value })} />
						<select className='form-select form-select-sm w-auto' value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)}>
							{salesPersonList.map((person) => <option key={person.value} value={person.value}>{person.label}</option>)}
						</select>
					</div>

					{shouldShowAddButton && (
						<div>
							<TableButton
								action='add'
								to={selectedData?.parent_id
									? `/automation/gn/add-follow-up-report?edit=true&id=${selectedData.parent_id}`
									: `/automation/gn/add-follow-up-report?mobile=${encodeURIComponent(selectedData?.phone || '')}&email=${encodeURIComponent(selectedData?.email || '')}&name=${encodeURIComponent(selectedData?.name || '')}&city=${encodeURIComponent(selectedData?.city || '')}`
								}
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
							sort={sort}
							sortOrder={sortOrder}
							visibleDetails={visibleDetails}
							onSortChange={(field: string, order: 'asc' | 'desc') => { setSort(field); setSortOrder(order) }}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr onClick={() => { setSelectedData(data); handleRowClick(data._id) }} className='data-row'>
										<td className='ps-6'><span className='sr-badge'>{actualIndex}</span></td>
										<td><span className='text-cell'>{data.telecaller_name || 'N/A'}</span></td>
										<td>
											<div className='d-flex flex-column'>
												<span className='text-cell'>{data.returned_from}</span>
												{data.is_pitch_report_pending === true && (
													<span className='text-danger fs-9 fw-bold mt-1'>Pitch Report Pending</span>
												)}
											</div>
										</td>
										<td><span className='text-cell'>{data.call_date}</span></td>
										<td>
											<div className='d-flex align-items-center'>
												<TableButton
													action='view'
													to={`/automation/gn/view-follow-up-report?id=${data.parent_id}&call_id=${data.call_id}`}
												/>
												{data.is_pitch_report_pending && (
													<TableButton
														action='edit'
														to={`/automation/gn/update-follow-up-report?edit=true&id=${data.parent_id}&pitchPending=${data.is_pitch_report_pending}&call_id=${data.call_id}`}
													/>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className='bg-light'>
											<td colSpan={7} className='p-5'>
												<div className='row'>
													<div className='col-md-6'>
														<div className='fw-semibold text-muted mb-1'>Telecaller:</div>
														<div className='fw-bold'>{data.telecaller_name}</div>
													</div>
													<div className='col-md-6'>
														<div className='fw-semibold text-muted mb-1'>Call #{data.call_number}</div>
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
					{jobData.length === 0 && !loading && <div className='text-center py-10'><b>No records found</b></div>}
					{jobData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={(page: number) => setPagination({ ...pagination, page })}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default FollowUpReportInnerList
