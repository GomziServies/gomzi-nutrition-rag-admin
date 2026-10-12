import React, { useEffect, useState, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../../_metronic/layout/core'
import LengthMenu from '../../../../../components/LengthMenu'
import SearchFilter from '../../../../../components/SearchFilter'
import Table from '../../../../../components/Table'
import TableButton from '../../../../../components/TableButton'
import UsersListPagination from '../../../../../components/TablePagination'
import { GetFwgFollowUpReport } from '../../../../../Functions/FGGroup'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

const FollowUpReportInnerList: React.FC = () => {
    const intl = useIntl()
    const [searchParams] = useSearchParams()

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

    const fetchData = async () => {
        setLoading(true)
        try {
            const mobileParam = searchParams.get('mobile')
            const res = await GetFwgFollowUpReport({
                mobile: mobileParam || undefined,
                page: pagination.page,
                limit: pagination.itemsPerPage,
                search: searchTerm,
            })

            const data = res.data
            const transformedData: any[] = []

            data.data.forEach((item: any) => {
                const personalDetails = item.personalDetails || {}

                item.callHistory?.forEach((call: any, callIndex: number) => {
                    if (!call.returnFrom) return

                    const pitchReport = call.pitchReport || {}
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
                        name: personalDetails?.full_name || 'N/A',
                        email: personalDetails?.email || 'N/A',
                        phone: personalDetails?.mobile || 'N/A',
                        gender: personalDetails?.gender || 'N/A',
                        sales_person: item.createdBy?.name || 'N/A',
                        returned_from: call.returnFrom || 'N/A',
                        telecaller_name: call.pitchReport?.telecaller_name || '',
                        call_date: call.callDate
                            ? new Date(call.callDate).toLocaleString('en-IN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true
                            })
                            : 'N/A',
                        last_conversation: call.callDate ? new Date(call.callDate).toLocaleString() : 'N/A',
                        is_pitch_report_pending: !hasPitchReport,
                        has_pitch_report: hasPitchReport,
                        reason: pitchReport.objections || 'N/A',
                        full_record: item
                    })
                })
            })

            setJobData(transformedData)
            setMetaData(data.pagination)

            if (transformedData.length > 0) {
                setSelectedData(transformedData[transformedData.length - 1])
            } else if (data.data?.length > 0) {
                const firstItem = data.data[0]
                const pd = firstItem.personalDetails || {}
                setSelectedData({
                    parent_id: firstItem._id,
                    call_id: null,
                    name: pd.full_name || pd.client_name || 'N/A',
                    email: pd.email || 'N/A',
                    phone: pd.mobile || 'N/A',
                    gender: pd.gender || 'N/A',
                    sales_person: firstItem.createdBy?.name || 'N/A',
                    last_conversation: 'N/A',
                    is_pitch_report_pending: false,
                    full_record: firstItem
                })
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to fetch follow up reports.')
        } finally {
            setLoading(false)
        }
    }

    const shouldShowAddButton = useMemo(() => {
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

        if (isGoalFilled && isBodyCheckupFilled && isLifestyleFilled && isEnduranceTestFilled && isProgramDetailsFilled) {
            return false
        }
        return true
    }, [selectedData])

    useEffect(() => {
        fetchData()
    }, [pagination.page, pagination.itemsPerPage, searchTerm])

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
                            <span className='badge badge-light-success me-2'>{selectedData?.gender}</span>
                        </div>
                    </div>

                    <div className='row g-6'>
                        <div className='col-md-4'>
                            <div className='bg-light rounded p-4'>
                                <div className='text-muted fs-7'>Email Address</div>
                                <div className='fw-bold fs-6'>{selectedData?.email || 'N/A'}</div>
                            </div>
                        </div>
                        <div className='col-md-4'>
                            <div className='bg-light rounded p-4'>
                                <div className='text-muted fs-7'>Phone Number</div>
                                <div className='fw-bold fs-6'>{selectedData?.phone || 'N/A'}</div>
                            </div>
                        </div>
                        <div className='col-md-4'>
                            <div className='bg-light rounded p-4'>
                                <div className='text-muted fs-7'>Last Conversation</div>
                                <div className='fw-bold fs-6'>{selectedData?.last_conversation}</div>
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
                            handleItemsPerPageChange={(value: number) =>
                                setPagination({ ...pagination, itemsPerPage: value })
                            }
                        />
                        <select
                            className='form-select form-select-sm w-auto'
                            value={salesPerson}
                            onChange={(e) => setSalesPerson(e.target.value)}
                        >
                            {salesPersonList.map((person) => (
                                <option key={person.value} value={person.value}>{person.label}</option>
                            ))}
                        </select>
                    </div>

                    {shouldShowAddButton && (
                        <div>
                            <TableButton
                                action='add'
                                to={selectedData?.parent_id
                                    ? `/automation/fwg/add-follow-up-report?id=${selectedData.parent_id}`
                                    : `/automation/fwg/add-follow-up-report?mobile=${encodeURIComponent(selectedData?.phone || '')}&email=${encodeURIComponent(selectedData?.email || '')}&name=${encodeURIComponent(selectedData?.name || '')}&city=${encodeURIComponent(selectedData?.city || '')}`
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
                                        className='data-row'
                                    >
                                        <td className='ps-6'><span className='sr-badge'>{actualIndex}</span></td>
                                        <td><span className='text-cell'>{data.telecaller_name || ''}</span></td>
                                        <td>
                                            <div className='d-flex flex-column'>
                                                <span className='text-cell'>{data.returned_from}</span>
                                                {data.is_pitch_report_pending === true && (
                                                    <span className='text-danger fs-9 fw-bold mt-1'>Pitch Report Pending</span>
                                                )}
                                            </div>
                                        </td>
                                        <td><span className='text-cell'>{data.last_conversation}</span></td>
                                        <td>
                                            <div className='d-flex align-items-center gap-2'>
                                                <TableButton
                                                    action='view'
                                                    to={`/automation/fwg/view-follow-up-report?id=${data.parent_id}&call_id=${data.call_id}`}
                                                />
                                                {data.is_pitch_report_pending === true && (
                                                    <TableButton
                                                        action='edit'
                                                        to={`/automation/fwg/update-follow-up-report?edit=true&id=${data.parent_id}&pitchPending=true&call_id=${data.call_id}`}
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
                                                        <div className='fw-semibold text-muted mb-1'>Sales Person:</div>
                                                        <div className='fw-bold'>{data.sales_person}</div>
                                                    </div>
                                                    <div className='col-md-6'>
                                                        <div className='fw-semibold text-muted mb-1'>Call #{data.call_number}</div>
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
                        <div className='text-center py-10'><b>No records found</b></div>
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
        </>
    )
}

export default FollowUpReportInnerList
