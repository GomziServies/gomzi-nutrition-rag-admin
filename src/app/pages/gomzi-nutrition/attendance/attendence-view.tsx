import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsEmployees, GetGlsAttendance } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import '../common-management.css'

const AttendenceView = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const employee_code: string | any = searchParams.get('employee_code')
    const [employeeData, setEmployeeData] = useState<any>({})
    const [attendanceData, setAttendanceData] = useState<any>([])
    const [loading, setLoading] = useState(false)
    const [metaData, setMetaData] = useState<any>()
    const [selectedDateRange, setSelectedDateRange] = useState<any>(null)
    const [sort, setSort] = useState('DateString')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })

    const fetchAttendanceViewData = async (page?: number) => {
        setLoading(true)

        let startDate: Date
        let endDate: Date

        const storedDateRange = localStorage.getItem('selectedDateRange')
        if (storedDateRange) {
            const parsedRange = JSON.parse(storedDateRange)
            startDate = new Date(parsedRange.from)
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date(parsedRange.to)
            endDate.setHours(23, 59, 59, 999)
        } else if (selectedDateRange) {
            selectedDateRange[0] ? (
                startDate = new Date(selectedDateRange[0])
            ) : (
                startDate = new Date(selectedDateRange.from)
            )
            startDate.setHours(0, 0, 0, 0)
            
            selectedDateRange[1] ? (
                endDate = new Date(selectedDateRange[1])
            ) : (
                endDate = new Date(selectedDateRange.to)
            )
            endDate.setHours(23, 59, 59, 999)
        } else {
            const now = new Date()
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date()
        }

        try {
            // Fetch employee details independently to ensure they show even if no attendance exists
            if (employee_code) {
                const employeeResponse: any = await GetGlsEmployees({ search: employee_code })
                const employeeInfo = employeeResponse.data?.find((emp: any) => emp.employee_code === employee_code)
                
                if (employeeInfo) {
                    setEmployeeData({
                        ...employeeInfo,
                        Name: employeeInfo.full_name, // Map full_name to Name for UI
                    })
                }
            }

            const response: any = await GetGlsAttendance({
                page: page || pagination.page,
                limit: pagination.itemsPerPage,
                search: employee_code,
                sort,
                sortOrder,
                from_date: DayJS(startDate).format('YYYY-MM-DD'),
                to_date: DayJS(endDate).format('YYYY-MM-DD'),
                status: selectedSubject || undefined,
            })

            let filteredData = response.data

            // Filter out Sundays if searching for absences
            if (selectedSubject === 'A') {
                filteredData = filteredData.filter((attendance: any) => (
                    DayJS(attendance.DateString).format('dddd') !== 'Sunday'
                ))
            }

            setAttendanceData(filteredData)

            const metaData: any = response.metadata
            setMetaData(metaData.pagination)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchAttendanceViewData()
    }, [
        pagination.itemsPerPage,
        pagination.page,
        sort,
        sortOrder,
        selectedDateRange,
        selectedSubject,
    ])

    const storedDateRange = localStorage.getItem('selectedDateRange')
    useEffect(() => {
        if (storedDateRange) {
            setStoredDateRange(storedDateRange)
        }
    }, [storedDateRange])
    
    const setStoredDateRange = (storedDateRange: any) => {
        setSelectedDateRange(JSON.parse(storedDateRange))
        localStorage.removeItem('selectedDateRange')
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target
        setAttendanceData((prevData: any) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
        setSort(newSort)
        setSortOrder(newSortOrder)
    }

    const sortableFields = [
        { title: 'Date', field: 'createdAt' },
        { title: 'In Time', field: 'INTime' },
        { title: 'Out Time', field: 'OUTTime' },
        { title: 'Over Time', field: 'OverTime' },
        { title: 'Late Time', field: 'Late_In' },
        { title: 'Half Day', field: 'halfDay' },
        { title: 'Status', field: 'Status' },
    ]

    const handleRowClick = (id: string) => {
        if (window.innerWidth <= 1024) {
            setVisibleDetails(visibleDetails === id ? null : id)
        }
    }

    const handleItemsPerPageChange = (value: number) => {
        setPagination({ ...pagination, page: 1, itemsPerPage: value })
    }

    const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
        setSelectedDateRange(dateRange)
        setPagination({ ...pagination, page: 1 })
    }

    const handleChangeStatus = (event: any) => {
        setPagination({ ...pagination, page: 1 })
        let value = event.target.value
        setSelectedStatus(value)
        if (value == 'Absent') {
            value = 'A'
        } else if (value == 'Present') {
            value = 'P'
        } else if (value == 'Leave') {
            value = 'Leave'
        }
        setSelectedSubject(value)
    }

    const downloadExcel = () => {
        const worksheetData = attendanceData.map((attendance: any, index: number) => {
            return {
                Date: attendance?.DateString ? DayJS(attendance?.DateString).format('DD/MM/YYYY') : 'N/A',
                'In Time': attendance?.INTime
                    ? attendance?.INTime !== '--:--'
                        ? attendance?.INTime
                        : '-'
                    : 'N/A',
                'Out Time': attendance?.OUTTime
                    ? attendance?.OUTTime !== '--:--'
                        ? attendance?.OUTTime
                        : '-'
                    : 'N/A',
                'Over Time': attendance?.OverTime
                    ? attendance?.OverTime !== '00:00'
                        ? attendance?.OverTime
                        : '-'
                    : 'N/A',
                'Late Time': attendance?.Late_In
                    ? attendance?.Late_In !== '00:00'
                        ? attendance?.Late_In
                        : '-'
                    : 'N/A',
                Status: attendance?.halfDay
                    ? attendance?.Status === 'Leave' || attendance?.Status === 'A'
                        ? DayJS(attendance.DateString).format('dddd') == 'Sunday'
                            ? DayJS(attendance.DateString).format('dddd') + ' - Half Day / ' + attendance?.Status
                            : 'Half Day / ' + attendance?.Status
                        : DayJS(attendance.DateString).format('dddd') == 'Sunday'
                        ? DayJS(attendance.DateString).format('dddd') + ' - Half Day / ' + attendance?.Status
                        : ' Half Day / ' + attendance?.Status
                    : attendance?.Status === 'Leave' || attendance?.Status === 'A'
                    ? DayJS(attendance.DateString).format('dddd') == 'Sunday'
                        ? DayJS(attendance.DateString).format('dddd')
                        : attendance?.Status
                    : DayJS(attendance.DateString).format('dddd') == 'Sunday'
                    ? DayJS(attendance.DateString).format('dddd') + ' - ' + attendance?.status
                    : attendance?.Status,
            }
        })

        const worksheet = XLSX.utils.json_to_sheet(worksheetData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
        XLSX.writeFile(workbook, 'AttendanceData.xlsx')
    }

    return (
        <div className='gz-mgmt-container'>
            <PageTitle breadcrumbs={[]}>Attendance Details</PageTitle>

            <nav className='gz-mgmt-breadcrumb'>
                <a href='/rag/dashboard'>Dashboard</a>
                <span>/</span>
                <a href='/rag/attendance'>Attendance</a>
                <span>/</span>
                <span>Employee Log</span>
            </nav>

            <div className='gz-mgmt-header mb-6'>
                <div>
                    <h1 className='gz-mgmt-title'>Employee Attendance History</h1>
                    <p className='gz-mgmt-subtitle'>
                        Detailed daily punch logs, in/out timestamps, overtime, and work status
                    </p>
                </div>
                <button
                    type='button'
                    className='gz-mgmt-btn-secondary'
                    onClick={() => window.history.back()}
                >
                    <i className='bi bi-arrow-left me-2'></i>
                    Back to Attendance List
                </button>
            </div>

            {/* Employee Quick Info Card */}
            <div className='gz-mgmt-card mb-6'>
                <div className='p-6'>
                    <div className='d-flex flex-wrap align-items-center gap-6'>
                        <img
                            src={
                                employeeData?.photo
                                    ? `https://files.fggroup.in/${employeeData?.photo}`
                                    : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                            }
                            alt={employeeData?.Name || 'Employee'}
                            style={{
                                width: '76px',
                                height: '76px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                border: '2px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                        />
                        <div className='flex-grow-1'>
                            <div className='d-flex align-items-center gap-3 mb-2 flex-wrap'>
                                <h3 className='m-0 fw-bold' style={{ color: '#0F172A', fontSize: '18px' }}>
                                    {employeeData?.Name || 'Employee Details'}
                                </h3>
                                {employeeData?.employee_code && (
                                    <span className='gz-mgmt-pill info'>
                                        {employeeData.employee_code}
                                    </span>
                                )}
                            </div>
                            <div className='d-flex flex-wrap align-items-center gap-4 text-muted fs-7'>
                                {employeeData?.mobile && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-telephone text-primary'></i>
                                        {employeeData.mobile}
                                    </span>
                                )}
                                {employeeData?.email && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-envelope text-primary'></i>
                                        {employeeData.email}
                                    </span>
                                )}
                                {employeeData?.role && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-person-badge text-primary'></i>
                                        {employeeData.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Table Card */}
            <div className='gz-mgmt-card'>
                <div className='gz-mgmt-toolbar flex-wrap gap-4'>
                    <div className='gz-mgmt-toolbar-left flex-wrap gap-3'>
                        <LengthMenu
                            expenseData={attendanceData}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                        />
                        <div>
                            <DownloadExcelButton
                                onClick={downloadExcel}
                                disabled={loading}
                                title='Export Excel'
                            />
                        </div>
                        <div style={{ minWidth: '160px' }}>
                            <SelectField
                                className='col-12 mb-0'
                                label='Select Status'
                                showLabel={false}
                                name='selectedStatus'
                                value={selectedStatus}
                                onChange={handleChangeStatus}
                                htmlFor='selectedStatus'
                                options={['Present', 'Absent', 'Leave']}
                            />
                        </div>
                        <div style={{ minWidth: '220px' }}>
                            <DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0' />
                        </div>
                    </div>
                </div>

                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        <Table
                            data={attendanceData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            removeAction={true}
                            renderRow={(
                                attendance: any,
                                index: number,
                                actualIndex: number,
                                isVisible: boolean
                            ) => (
                                <React.Fragment key={attendance?._id}>
                                    <tr
                                        onClick={() => handleRowClick(attendance?._id)}
                                        className='data-row'
                                    >
                                        <td className='text-center'>
                                            <div className='d-flex justify-content-center align-items-center'>
                                                <FontAwesomeIcon
                                                    icon={faPlusCircle}
                                                    className='me-2 d-md-none'
                                                    style={{ color: '#607D8B', fontSize: '14px' }}
                                                />
                                                <span className='fw-bold text-muted fs-7'>{actualIndex}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className='fw-bold' style={{ color: '#0F172A' }}>
                                                {attendance?.DateString
                                                    ? DayJS(attendance?.DateString).format('DD MMM YYYY')
                                                    : 'N/A'}
                                            </span>
                                            <span className='d-block fs-8 text-muted'>
                                                {attendance?.DateString ? DayJS(attendance?.DateString).format('dddd') : ''}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-semibold text-dark fs-7'>
                                                {attendance?.INTime && attendance?.INTime !== '--:--'
                                                    ? attendance?.INTime
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-semibold text-dark fs-7'>
                                                {attendance?.OUTTime && attendance?.OUTTime !== '--:--'
                                                    ? attendance?.OUTTime
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-semibold fs-7' style={{ color: attendance?.OverTime && attendance?.OverTime !== '00:00' ? '#16A34A' : '#64748B' }}>
                                                {attendance?.OverTime && attendance?.OverTime !== '00:00'
                                                    ? attendance?.OverTime
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-semibold fs-7' style={{ color: attendance?.Late_In && attendance?.Late_In !== '00:00' ? '#DC2626' : '#64748B' }}>
                                                {attendance?.Late_In && attendance?.Late_In !== '00:00'
                                                    ? attendance?.Late_In
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            {attendance?.halfDay ? (
                                                <span className='gz-mgmt-pill warning'>Half Day</span>
                                            ) : (
                                                <span className='text-muted'>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
                                                <span className='gz-mgmt-pill danger'>
                                                    {DayJS(attendance?.DateString).format('dddd') === 'Sunday'
                                                        ? 'Sunday'
                                                        : attendance?.Status === 'A'
                                                        ? 'Absent'
                                                        : attendance?.Status}
                                                </span>
                                            ) : DayJS(attendance?.DateString).format('dddd') === 'Sunday' ? (
                                                <span className='gz-mgmt-pill info'>
                                                    Sunday - {attendance?.Status}
                                                </span>
                                            ) : (
                                                <span className='gz-mgmt-pill success'>
                                                    {attendance?.Status === 'P' ? 'Present' : attendance?.Status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12}>
                                                <div className='p-4' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
                                                    <strong>Date:</strong> {attendance?.DateString ? DayJS(attendance.DateString).format('DD/MM/YYYY') : 'N/A'}<br />
                                                    <strong>In Time:</strong> {attendance?.INTime || '-'}<br />
                                                    <strong>Out Time:</strong> {attendance?.OUTTime || '-'}<br />
                                                    <strong>Over Time:</strong> {attendance?.OverTime || '-'}<br />
                                                    <strong>Late Time:</strong> {attendance?.Late_In || '-'}<br />
                                                    <strong>Status:</strong> {attendance?.Status || '-'}
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
                    {attendanceData.length === 0 && !loading && (
                        <div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
                            <b>No records found</b>
                        </div>
                    )}
                    {attendanceData.length > 0 && (
                        <UsersListPagination
                            totalPages={metaData?.totalPages || 1}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default AttendenceView
