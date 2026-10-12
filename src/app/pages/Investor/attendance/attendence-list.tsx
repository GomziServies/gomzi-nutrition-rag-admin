/* eslint-disable jsx-a11y/anchor-is-valid */
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdajanBranchAttendanceSummary } from '../../../Functions/FGGroup/AdajanBranchAttendance'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const InvestorAttendenceList = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState('Name')
    const [sortOrder, setSortOrder] = useState<any>('asc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

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
            const summaryResponse: any = await GetAdajanBranchAttendanceSummary({
                from_date: startDate,
                to_date: endDate,
            })

            setAttendanceData(summaryResponse?.data || [])
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

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

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, page }))
    }

    const handleItemsPerPageChange = (value: number) => {
        setPagination((prev) => ({ ...prev, page: 1, itemsPerPage: value }))
    }

    const sortableFields = [
        { title: 'All Members', field: 'Name' },
        { title: 'Code', field: 'employee_code' },
        { title: 'Total Present', field: 'total_present' },
        { title: 'Total Absent', field: 'total_absent' },
    ]

    const handleSortChange = (newSort: string, newSortOrder: any) => {
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
        .filter((item: any) => item?.type === 'client')
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

    return (
        <>
            <PageTitle breadcrumbs={[]}>Client Attendance</PageTitle>

            <div className='card'>
                <div className='card-header row border-0 pt-6'>
                    <div className='col-md-12 d-flex justify-content-between pe-md-10'>
                        <div className='d-flex align-items-center gap-3'>
                            <SearchFilter
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                            />
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
                            ) => (
                                <React.Fragment key={attendance?._id}>
                                    <tr
                                        onClick={() => handleRowClick(attendance?._id)}
                                        className='data-row'>
                                        <td className='text-center'>
                                            <div className='d-flex'>
                                                <FontAwesomeIcon
                                                    icon={faPlusCircle}
                                                    className='mx-2 ms-5 mb-1 plus-icon'
                                                    style={{ color: '#607D8B', fontSize: '18px' }}
                                                />
                                                <span className='text-dark fw-bold d-block mb-1 fs-6'>{actualIndex}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className='d-flex align-items-center'>
                                                <div className='symbol symbol-45px me-5'>
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
                                                    <span className='text-muted fw-semibold d-block fs-7'>
                                                        {attendance?.mobile}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold d-block mb-1 fs-6'>
                                                {attendance?.employee_code || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold d-block mb-1 fs-6'>
                                                {attendance?.total_present > 0
                                                    ? attendance?.half_day > 0
                                                        ? `${attendance?.total_present} (${attendance?.half_day} Half Day)`
                                                        : attendance?.total_present
                                                    : '0'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold d-block mb-1 fs-6'>
                                                {attendance?.total_absent ?? '0'}
                                            </span>
                                        </td>
                                        <td>
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
                                                    window.location.href = `/investor/attendance/view?id=${attendance?.employee_code || attendance?.clientCode}&type=${attendance?.type}`
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12}>
                                                <div>
                                                    <div className='d-flex align-items-center mb-3'>
                                                        <div className='symbol symbol-45px me-5'>
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
                                                            <span className='text-muted fw-semibold d-block fs-7'>
                                                                {attendance?.mobile}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <strong>Code:</strong>{' '}
                                                    {attendance?.employee_code || 'N/A'}
                                                    <br />
                                                    <strong>Present:</strong>{' '}
                                                    {attendance?.total_present}
                                                    <br />
                                                    <strong>Absent:</strong>{' '}
                                                    {attendance?.total_absent ?? '0'}
                                                    <br />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )}
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

export { InvestorAttendenceList }
