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
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsEmployees, GetGlsAttendance } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

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
        <>
            <PageTitle breadcrumbs={[]}>Attendance Details</PageTitle>
            <div className='row mb-6'>
                <div className='col-12 mt-3'>
                    <div className='card py-5'>
                        <h3 className='ms-8'>Employee Detail:</h3>
                        <div className='card-body'>
                            <div className='row'>
                                <div className='col-3 d-md-block d-none text-center'>
                                    <img
                                        src={
                                            employeeData?.photo
                                                ? `https://files.fggroup.in/${employeeData?.photo}`
                                                : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                        }
                                        alt={employeeData?.Name}
                                        style={{ borderRadius: '10px', width: '90%' }}
                                    />
                                </div>
                                <div className='col-12 d-md-none d-block mb-5 text-center'>
                                    <img
                                        src={
                                            employeeData?.photo
                                                ? `https://files.fggroup.in/${employeeData?.photo}`
                                                : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                        }
                                        alt={employeeData?.Name}
                                        style={{ borderRadius: '5px', width: '50%' }}
                                    />
                                </div>
                                <div className='col-md-9'>
                                    <div className='row'>
                                        <div className='col-md-6 fv-row'>
                                            <CopyableInput
                                                placeholder='Employee Code'
                                                type='text'
                                                className='col-12 fv-row'
                                                name='employee_code'
                                                label='Employee Code'
                                                htmlFor='employee_code'
                                                value={employeeData?.employee_code}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-6 fv-row'>
                                            <InputField
                                                placeholder='Name'
                                                type='text'
                                                className='col-12 fv-row'
                                                name='Name'
                                                label='Name'
                                                htmlFor='Name'
                                                value={employeeData?.Name}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-6 fv-row'>
                                            <InputField
                                                placeholder='Mobile'
                                                type='text'
                                                className='col-12 fv-row'
                                                name='mobile'
                                                label='Mobile'
                                                htmlFor='mobile'
                                                value={employeeData?.mobile}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='card'>
                <h3 className='ms-8 mt-5'>Attendance Detail:</h3>
                <div className='card-header row border-0 pt-6'>
                    <div className='col-md-4 d-flex'>
                        <div className='d-md-block d-none'>
                            <LengthMenu
                                expenseData={attendanceData}
                                handleItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </div>
                    </div>
                    <div className='col-md-8 pe-md-6'>
                        <div className='row'>
                            <div className='col-md-2 d-none d-md-flex justify-content-end'>
                                <button
                                    className='btn btn-primary mb-7'
                                    onClick={downloadExcel}
                                    disabled={loading}>
                                    <FontAwesomeIcon
                                        icon={faDownload}
                                        className='fs-3'
                                    />
                                </button>
                            </div>
                            <div className='col-md-5 my-md-0 my-5 pe-0'>
                                <DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
                            </div>

                            <div className='col-md-5 pe-0 d-flex justify-content-end'>
                                <SelectField
                                    className='col-12 mb-md-7'
                                    label='Select Status'
                                    showLabel={false}
                                    name='selectedStatus'
                                    value={selectedStatus}
                                    onChange={handleChangeStatus}
                                    htmlFor='selectedStatus'
                                    options={['Present', 'Absent', 'Leave']}
                                />
                            </div>
                        </div>
                    </div>
                    <div className='col-md-3 d-flex d-md-none justify-content-between p-0'>
                        <LengthMenu
                            expenseData={attendanceData}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                        />
                        <button
                            className='btn btn-primary mb-4'
                            onClick={downloadExcel}
                            disabled={loading}>
                            <FontAwesomeIcon
                                icon={faDownload}
                                className='fs-3'
                            />
                        </button>
                    </div>
                </div>
                <div className='py-4 card-body'>
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
                                        className='data-row'>
                                        <td className='text-center'>
                                            <div className='d-flex justify-content-center'>
                                                <FontAwesomeIcon
                                                    icon={faPlusCircle}
                                                    className='mx-2 ms-5 mb-1 plus-icon'
                                                    style={{ color: '#607D8B', fontSize: '18px' }}
                                                />
                                                <span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.DateString
                                                    ? DayJS(attendance?.DateString).format('DD/MM/YYYY')
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.INTime
                                                    ? attendance?.INTime !== '--:--'
                                                        ? attendance?.INTime
                                                        : '-'
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.OUTTime
                                                    ? attendance?.OUTTime !== '--:--'
                                                        ? attendance?.OUTTime
                                                        : '-'
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.OverTime
                                                    ? attendance?.OverTime !== '00:00'
                                                        ? attendance?.OverTime
                                                        : '-'
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.Late_In
                                                    ? attendance?.Late_In !== '00:00'
                                                        ? attendance?.Late_In
                                                        : '-'
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.halfDay ? (
                                                    attendance?.status === 'Leave' || attendance?.status === 'A' ? (
                                                        <span className='badge badge-light-danger py-3 px-4 fs-7'>
                                                            Half Day
                                                        </span>
                                                    ) : (
                                                        <span className='badge badge-light-success py-3 px-4 fs-7'>
                                                            Half Day
                                                        </span>
                                                    )
                                                ) : (
                                                    '-'
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
                                                    DayJS(attendance.DateString).format('dddd') == 'Sunday' ? (
                                                        <span className='badge badge-light-danger py-3 px-4 fs-7'>
                                                            {DayJS(attendance.DateString).format('dddd')}
                                                        </span>
                                                    ) : (
                                                        <span className='badge badge-light-danger py-3 px-4 fs-7'>
                                                            {attendance?.Status}
                                                        </span>
                                                    )
                                                ) : DayJS(attendance.DateString).format('dddd') == 'Sunday' ? (
                                                    <>
                                                        <span className='badge badge-light-success py-3 px-4 fs-7'>
                                                            {DayJS(attendance.DateString).format('dddd')} - {attendance?.Status}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className='badge badge-light-success py-3 px-4 fs-7'>
                                                        {attendance?.Status}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12}>
                                                <div>
                                                    <strong>{sortableFields[0].title}:</strong>{' '}
                                                    {attendance?.createdAt
                                                        ? DayJS(attendance?.createdAt).format('DD/MM/YYYY hh:mm:ss A')
                                                        : 'N/A'}
                                                    <br />
                                                    <strong>{sortableFields[1].title}:</strong>{' '}
                                                    {attendance?.INTime ? attendance?.INTime : 'N/A'}
                                                    <br />
                                                    <strong>{sortableFields[2].title}:</strong>{' '}
                                                    {attendance?.OUTTime ? attendance?.OUTTime : 'N/A'}
                                                    <br />
                                                    <strong>{sortableFields[3].title}:</strong>{' '}
                                                    {attendance?.OverTime ? attendance?.OverTime : 'N/A'}
                                                    <br />
                                                    <strong>{sortableFields[4].title}:</strong>{' '}
                                                    {attendance?.Late_In ? attendance?.Late_In : 'N/A'}
                                                    <br />
                                                    <div className='d-flex my-1'>
                                                        <strong className='mt-2 me-2'>{sortableFields[5].title}:</strong>{' '}
                                                        <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                            {attendance?.halfDay ? (
                                                                attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
                                                                    <span className='badge badge-light-danger py-3 px-4 fs-7'>
                                                                        Half Day{' / '}
                                                                        {attendance?.Status}
                                                                    </span>
                                                                ) : (
                                                                    <span className='badge badge-light-success py-3 px-4 fs-7'>
                                                                        Half Day{' / '}
                                                                        {attendance?.Status}
                                                                    </span>
                                                                )
                                                            ) : attendance?.Status === 'Leave' || attendance?.Status === 'A' ? (
                                                                <span className='badge badge-light-danger py-3 px-4 fs-7'>
                                                                    {attendance?.Status}
                                                                </span>
                                                            ) : (
                                                                <span className='badge badge-light-success py-3 px-4 fs-7'>
                                                                    {attendance?.Status}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
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
                        <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                            <b>No records found</b>
                        </div>
                    )}
                    {attendanceData.length > 0 && (
                        <UsersListPagination
                            totalPages={metaData?.totalPages}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

export default AttendenceView
