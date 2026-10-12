/* eslint-disable jsx-a11y/anchor-is-valid */
import { faPlusCircle, faSync } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdajanBranchAttendanceSummary, SyncAdajanBranchAttendance } from '../../../Functions/FGGroup/AdajanBranchAttendance'
import { GetAdajanBranchClient } from '../../../Functions/FGGroup/AdajanBranchClient'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AdajanBranchAttendenceList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [attendanceData, setAttendanceData] = useState<any>([])
    const [isRotating, setIsRotating] = useState(false)
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState('Name')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
    const [searchParams] = useSearchParams()
    const urlType = searchParams.get('type') // 'client' | 'member' | null
    const [typeFilter, setTypeFilter] = useState<'all' | 'trainer' | 'client' | 'yoga' | 'zumba' | 'member' | 'Dietician' | 'Admin' | 'Others'>(
        urlType === 'client' ? 'client' : urlType === 'member' ? 'member' : 'all'
    )

    const fetchAttendanceData = async () => {
        setLoading(true)
        let startDate: any
        let endDate: any

        if (selectedDateRange) {
            startDate = new Date(selectedDateRange[0])
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date(selectedDateRange[1])
            endDate.setHours(23, 59, 59, 999)
        } else {
            const now = new Date()
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date()
        }

        try {
            // Fetch Month Summary, Overall Summary, and Clients in parallel
            const [filteredResponse, overallResponse, clientsResponse]: [any, any, any] = await Promise.all([
                GetAdajanBranchAttendanceSummary({
                    from_date: startDate,
                    to_date: endDate,
                }),
                GetAdajanBranchAttendanceSummary({}), // Overall history
                GetAdajanBranchClient({ limit: 1000 })
            ])

            const filteredList = filteredResponse?.data || []
            const overallList = overallResponse?.data || []
            const clientList = clientsResponse?.data || []

            // Map overall counts by employee_code
            const overallMap: Record<string, number> = {}
            overallList.forEach((item: any) => {
                if (item.employee_code) {
                    overallMap[item.employee_code] = Number(item.total_present) || 0
                }
            })

            // Map client details for joining/expiry dates
            const clientMap: Record<string, any> = {}
            clientList.forEach((c: any) => {
                if (c.clientCode) {
                    clientMap[c.clientCode] = c
                }
            })

            // Merge everything into the attendance list
            const mergedData = filteredList.map((item: any) => {
                const clientInfo = clientMap[item.employee_code]
                return {
                    ...item,
                    overall_total_present: overallMap[item.employee_code] || 0,
                    // Inject client membership info if available
                    joiningDate: clientInfo?.joiningDate,
                    expiryDate: clientInfo?.expiryDate,
                    photo: item.photo || clientInfo?.image, // Fallback to client image
                }
            })

            setAttendanceData(mergedData)
        } catch (error) {
            console.error('Failed to fetch attendance data:', error)
        }
        setLoading(false)
    }

    const fetchSyncAttendance = async () => {
        setIsRotating(true)
        try {
            await SyncAdajanBranchAttendance()
            fetchAttendanceData()
        } catch (error) {
            console.error(error)
        }
        setIsRotating(false)
    }

    // Sync filter if user navigates between Client / Member menu items
    useEffect(() => {
        setTypeFilter(urlType === 'client' ? 'client' : urlType === 'member' ? 'member' : 'all')
        setPagination((prev) => ({ ...prev, page: 1 }))
    }, [urlType])

    useEffect(() => {
        fetchAttendanceData()
    }, [selectedDateRange])

    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (searchTerm.trim() || searchTerm === '') {
            setPagination((prev) => ({ ...prev, page: 1 }))
        }
    }, [searchTerm])

    const handleSyncButton = () => {
        fetchSyncAttendance()
    }

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, page }))
    }

    const handleItemsPerPageChange = (value: number) => {
        setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: value }))
    }

    const sortableFields = [
        { title: 'All Members', field: 'Name' },
        { title: 'Code', field: 'employee_code' },
        { title: 'Type', field: 'position' },
        { title: 'Total Present', field: 'total_present' },
        { title: 'Total Absent', field: 'total_absent' },
        ...(urlType === 'client' ? [
            { title: 'Month Avg %', field: 'month_percentage' },
            { title: 'Plan Avg %', field: 'membership_percentage' },
        ] : []),
    ]

    const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
        setSort(newSort)
        setSortOrder(newSortOrder)
    }

    const handleRowClick = (id: string) => {
        if (window.innerWidth <= 1024) {
            setVisibleDetails(visibleDetails === id ? null : id)
        }
    }

    // Client-side filter + sort
    const filteredData = attendanceData
        .filter((item: any) => item?.Name?.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((item: any) => {
            if (typeFilter === 'all') return true
            const lowerTypeFilter = typeFilter.toLowerCase()
            const itemType = item?.type?.toLowerCase() || ''
            const itemPosition = item?.position?.toLowerCase() || ''

            if (lowerTypeFilter === 'client') return itemType === 'client'

            // 'member' = all non-client (trainer, yoga, zumba)
            if (lowerTypeFilter === 'member') return itemType !== 'client'

            if (itemType === 'client') return false

            // If we're looking for Yoga or Zumba specifically
            if (['yoga', 'zumba'].includes(lowerTypeFilter)) {
                return itemPosition === lowerTypeFilter || itemType === lowerTypeFilter
            }

            // If we're looking for Trainer, exclude members who are specifically Yoga or Zumba
            if (lowerTypeFilter === 'trainer') {
                const isSpecificRole = ['yoga', 'zumba'].includes(itemPosition) || ['yoga', 'zumba'].includes(itemType)
                if (isSpecificRole) return false
                return itemPosition === 'trainer' || itemType === 'trainer' || !itemPosition
            }

            return itemType === lowerTypeFilter || itemPosition === lowerTypeFilter
        })
        .sort((a: any, b: any) => {
            const aVal = a[sort] ?? ''
            const bVal = b[sort] ?? ''
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
            }
            return sortOrder === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal))
        })

    const paginatedData = filteredData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
        setSelectedDateRange(dateRange)
        setPagination((prev) => ({ ...prev, page: 1 }))
    }

    // const totalPresent = filteredData.reduce((sum: number, item: any) => sum + (item.total_present || 0), 0)
    // const totalAbsent = filteredData.reduce((sum: number, item: any) => sum + (item.total_absent || 0), 0)

    return (
        <>
            <PageTitle breadcrumbs={[]}>
                {urlType === 'client' ? 'Client Attendance' : urlType === 'member' ? 'Member Attendance' : 'All Member Attendance'}
            </PageTitle>

            <div className='card'>
                <div className='row justify-content-between mt-7 mx-6'>
                    <div className='col-md-9'>
                        <h3 className='card-title align-items-center flex-column'>
                            <span className='card-label fw-bold fs-3 mb-1'>
                                {urlType === 'client' ? 'Client Attendance' : urlType === 'member' ? 'Member Attendance' : 'All Attendance'}
                            </span>
                        </h3>
                    </div>
                </div>

                <div className='card-header row border-0 pt-6'>
                    <div className='col-md-12 d-flex justify-content-between pe-md-10'>
                        <div className='d-flex align-items-center gap-3'>
                            <SearchFilter
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                            />
                            {/* Show sub-filter for member page; hide entirely for client page */}
                            {urlType !== 'client' && (
                                <select
                                    className='form-select form-select-sm w-auto'
                                    value={typeFilter}
                                    onChange={(e) => {
                                        setTypeFilter(e.target.value as any)
                                        setPagination((prev) => ({ ...prev, page: 1 }))
                                    }}>
                                    {urlType === 'member' ? (
                                        <>
                                            <option value='member'>All</option>
                                            <option value='trainer'>Trainer</option>
                                            <option value='yoga'>Yoga</option>
                                            <option value='zumba'>Zumba</option>
                                            <option value='Dietician'>Dietician</option>
                                            <option value='Admin'>Admin</option>
                                            <option value='Others'>Others</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value='all'>All</option>
                                            <option value='trainer'>Trainer</option>
                                            <option value='client'>Client</option>
                                            <option value='yoga'>Yoga</option>
                                            <option value='zumba'>Zumba</option>
                                        </>
                                    )}
                                </select>
                            )}
                            <div className='d-md-block d-none'>
                                <LengthMenu
                                    expenseData={attendanceData}
                                    handleItemsPerPageChange={handleItemsPerPageChange}
                                />
                            </div>
                        </div>
                        <div className='d-flex align-items-center gap-3'>
                            <div style={{ minWidth: '200px' }}>
                                <DateFilter
                                    onDateRangeChange={handleDateRangeChange}
                                    leftValue='-600px'
                                />
                            </div>
                            <button
                                className='btn btn-sm btn-primary d-flex py-3'
                                onClick={handleSyncButton}
                                disabled={isRotating}>
                                <FontAwesomeIcon
                                    icon={faSync}
                                    className={`fs-3 text-white my-1 ${isRotating ? 'rotate' : ''}`}
                                />
                                <span className='text-white ms-2 my-1'>Sync</span>
                            </button>
                        </div>
                    </div>
                    <div className='col-md-3 d-flex d-md-none justify-content-between p-0 mt-3'>
                        <LengthMenu
                            expenseData={attendanceData}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </div>
                </div>

                <div className='card-body py-3'>
                    <div className='table-responsive'>
                        <Table
                            data={paginatedData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            disableSortFields={['position']}
                            renderRow={(
                                attendance: any,
                                index: number,
                                actualIndex: number,
                                isVisible: boolean
                            ) => {
                                const presentCount = Number(attendance?.total_present) || 0
                                const overallPresentCount = Number(attendance?.overall_total_present) || 0

                                // Calculate denominators
                                const baseDate = selectedDateRange ? DayJS(selectedDateRange[0]) : DayJS().startOf('month')
                                const daysInMonth = baseDate.daysInMonth()

                                let monthTotalDays = daysInMonth
                                if (selectedDateRange) {
                                    const start = DayJS(selectedDateRange[0]).startOf('day')
                                    const end = DayJS(selectedDateRange[1]).endOf('day')
                                    monthTotalDays = end.diff(start, 'day') + 1
                                }

                                let membershipTotalDays = monthTotalDays
                                if (attendance?.joiningDate && attendance?.expiryDate) {
                                    const join = DayJS(attendance.joiningDate).startOf('day')
                                    const expiry = DayJS(attendance.expiryDate).endOf('day')
                                    membershipTotalDays = expiry.diff(join, 'day') + 1
                                }

                                const monthPresentPct = monthTotalDays > 0 ? (presentCount / monthTotalDays) * 100 : 0
                                const membershipPresentPct = membershipTotalDays > 0 ? (overallPresentCount / membershipTotalDays) * 100 : 0

                                return (
                                    <React.Fragment key={attendance?._id}>
                                        <tr
                                            onClick={() => handleRowClick(attendance?._id)}
                                            className='data-row'>
                                            <td className='text-center align-middle'>
                                                <div className='d-flex align-items-center justify-content-center'>
                                                    <FontAwesomeIcon
                                                        icon={faPlusCircle}
                                                        className='mx-2 mb-1 plus-icon'
                                                        style={{ color: '#607D8B', fontSize: '18px' }}
                                                    />
                                                    <span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
                                                </div>
                                            </td>
                                            <td className='text-start align-middle px-3'>
                                                <div className='d-flex align-items-center'>
                                                    <div className='symbol symbol-45px'>
                                                        <img
                                                            src={
                                                                attendance?.photo
                                                                    ? `https://files.fggroup.in/${attendance?.photo}`
                                                                    : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                                            }
                                                            alt={attendance?.Name}
                                                            style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                                                        />
                                                    </div>
                                                    <div className='d-flex justify-content-start flex-column ms-4'>
                                                        <span className='text-dark fw-bold fs-6'>{attendance?.Name}</span>
                                                        <span className='text-muted fw-semibold d-block fs-8 text-start'>
                                                            {attendance?.mobile}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center align-middle'>
                                                <span className='text-dark fw-bold d-block mb-1 fs-7'>
                                                    {attendance?.employee_code || 'N/A'}
                                                </span>
                                            </td>
                                            <td className='text-center align-middle'>
                                                <span className={`badge ${attendance?.type === 'client' ? 'badge-light-info' : 'badge-light-warning'} py-2 px-3 fs-8`}>
                                                    {attendance?.type === 'client' ? 'Client' : (attendance?.position || 'Trainer')}
                                                </span>
                                            </td>
                                            <td className='text-center align-middle'>
                                                <span className='text-dark fw-bold d-block mb-1 fs-7'>
                                                    {attendance?.total_present ?? '0'}
                                                </span>
                                            </td>
                                            <td className='text-center align-middle'>
                                                <span className='text-dark fw-bold d-block mb-1 fs-7'>
                                                    {attendance?.total_absent ?? '0'}
                                                </span>
                                            </td>
                                            {urlType === 'client' && (
                                                <>
                                                    <td className='text-center align-middle'>
                                                        <span className='badge  fs-7 fw-bold p-2'>
                                                            {presentCount}/{monthTotalDays} ({monthPresentPct.toFixed(1)}%)
                                                        </span>
                                                    </td>
                                                    <td className='text-center align-middle'>
                                                        <span className='badge fs-7 fw-bold p-2'>
                                                            {overallPresentCount}/{membershipTotalDays} ({membershipPresentPct.toFixed(1)}%)
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                            <td className='text-center align-middle'>
                                                <TableButton
                                                    action='view'
                                                    onClick={() => {
                                                        if (selectedDateRange) {
                                                            localStorage.setItem(
                                                                'selectedDateRange',
                                                                JSON.stringify({
                                                                    from: DayJS(selectedDateRange[0]).format('YYYY-MM-DD'),
                                                                    to: DayJS(selectedDateRange[1]).format('YYYY-MM-DD'),
                                                                })
                                                            )
                                                        } else {
                                                            localStorage.removeItem('selectedDateRange')
                                                        }
                                                        window.location.href = `/adajan-branch/attendance/view?id=${attendance?.employee_code}&type=${attendance?.type}`
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                        {isVisible && (
                                            <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                                <td colSpan={12}>
                                                    <div className='p-4'>
                                                        <div className='d-flex align-items-center mb-4'>
                                                            <div className='symbol symbol-45px me-4'>
                                                                <img
                                                                    src={
                                                                        attendance?.photo
                                                                            ? `https://files.fggroup.in/${attendance?.photo}`
                                                                            : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                                                    }
                                                                    alt={attendance?.Name}
                                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                                                                />
                                                            </div>
                                                            <div className='d-flex justify-content-start flex-column'>
                                                                <span className='text-dark fw-bold fs-6'>{attendance?.Name}</span>
                                                                <span className='text-muted fw-semibold d-block fs-8'>
                                                                    {attendance?.mobile}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className='fs-7'>
                                                            <span className='fw-bold '>{sortableFields[1].title}:</span>{' '}
                                                            {attendance?.employee_code || 'N/A'}
                                                            <br />
                                                            <span className='fw-bold'>{sortableFields[2].title}:</span>{' '}
                                                            <span className={`badge ${attendance?.type === 'client' ? 'badge-light-info' : 'badge-light-warning'} py-1 px-2 fs-9`}>
                                                                {attendance?.type === 'client' ? 'Client' : (attendance?.position || 'Trainer')}
                                                            </span>
                                                            <br />
                                                            <span className='fw-bold '>{sortableFields[3].title}:</span>{' '}
                                                            {attendance?.total_present ?? '0'}
                                                            <br />
                                                            <span className='fw-bold'>{sortableFields[4].title}:</span>{' '}
                                                            {attendance?.total_absent ?? '0'}
                                                            <br />
                                                            <span className='fw-bold'>{sortableFields[5].title}:</span>{' '}
                                                            <span className='badge badge-light-primary fs-8 fw-bold ms-2 p-1'>
                                                                {presentCount}/{monthTotalDays} ({monthPresentPct.toFixed(1)}%)
                                                            </span>
                                                            <br />
                                                            <span className='fw-bold'>{sortableFields[6].title}:</span>{' '}
                                                            <span className='badge badge-light-success fs-8 fw-bold ms-2 p-1'>
                                                                {overallPresentCount}/{membershipTotalDays} ({membershipPresentPct.toFixed(1)}%)
                                                            </span>
                                                            <br />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            }}
                            visibleDetails={visibleDetails}
                            pagination={pagination}
                            setPagination={setPagination}
                            loading={loading}
                        />
                    </div>
                    {paginatedData.length === 0 && !loading && (
                        <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                            <b>No records found</b>
                        </div>
                    )}
                    {paginatedData.length > 0 && (
                        <UsersListPagination
                            totalPages={Math.ceil(filteredData.length / pagination.itemsPerPage)}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

export { AdajanBranchAttendenceList }