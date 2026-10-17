import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import UsersListPagination from '../../../../components/TablePagination'
import { GetGlsSalary } from '../../../../Functions/FGGroup/GlsSalary'
import { GetExpenseReports } from '../../../../Functions/FGGroup/ExpenseReport'
import { GetAdminUsers } from '../../../../Functions/FGGroup/AdminUsers'
import '../../salary/employee-salary-view.css'

const GlsEmployeeSalaryView = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const employee_id: string | any = searchParams.get('employee_id')
    const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [salaryData, setSalaryData] = useState<any>([])
    const [employeeData, setEmployeeData] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState('date')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [joiningTime, setJoiningTime] = useState<any>(null)
    const [expenseData, setExpenseData] = useState<any[]>([])
    const [loadingExpenses, setLoadingExpenses] = useState(false)

    const fetchSalaryData = async (page?: number) => {
        setLoading(true)
        let startDate: any
        let endDate: any

        const storedDateRange = localStorage.getItem('selectedDateRange')
        if (storedDateRange) {
            const parsedRange = JSON.parse(storedDateRange)
            startDate = new Date(parsedRange.from)
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date(parsedRange.to)
            endDate.setHours(23, 59, 59, 999)
        } else if (selectedDateRange) {
            startDate = new Date(selectedDateRange[0])
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date(selectedDateRange[1])
            endDate.setHours(23, 59, 59, 999)
        } else {
            const now = new Date()
            // Get of last month
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        }
        try {
            const response: any = await GetGlsSalary({
                from_date: startDate,
                to_date: endDate,
                employee_id: employee_id,
            })

            const data = response.data

            setEmployeeData(data[0] || {})

            const joiningDate = data[0]?.joining_date

            let joiningDuration = ''
            if (joiningDate) {
                const start = DayJS(joiningDate)
                const now = DayJS()
                const years = now.diff(start, 'year')
                const months = now.diff(start, 'month') % 12
                const days = now.diff(start, 'day') % 30

                if (years > 0) joiningDuration += `${years} Years`
                if (months > 0) joiningDuration += `${joiningDuration ? ', ' : ''}${months} Months`
                if (years === 0 && months === 0) joiningDuration = `${days} Days`
            }

            setJoiningTime(joiningDuration)
            setSalaryData(data[0]?.attendance || [])
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSalaryData()
        fetchExpenseData()
    }, [selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

    const storedDateRange = localStorage.getItem('selectedDateRange')
    useEffect(() => {
        if (storedDateRange) {
            setSelectedDateRange(JSON.parse(storedDateRange))
            localStorage.removeItem('selectedDateRange')
        }
    }, [storedDateRange])

    const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
        setSelectedDateRange(dateRange)
        setPagination({ ...pagination, page: 1 })
    }

    const handleItemsPerPageChange = (value: number) => {
        setPagination({ ...pagination, itemsPerPage: value, page: 1 })
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target
        setEmployeeData((prevData: any) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const filteredSalaryData = (salaryData || []).filter((admin: any) => {
        if (!searchTerm) return true
        const term = searchTerm.toLowerCase()
        const dateStr = admin?.date ? DayJS(admin.date).format('DD/MM/YYYY YYYY-MM-DD dddd').toLowerCase() : ''
        const statusStr = (admin?.status || '').toLowerCase()
        return dateStr.includes(term) || statusStr.includes(term)
    })

    const paginatedSalaryData = filteredSalaryData?.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const sortableFields = [
        { title: 'Over Time', field: 'OverTime' },
        { title: 'Work Time', field: 'WorkTime' },
        { title: 'Date', field: 'date' },
        { title: 'Half Day', field: 'halfDay' },
        { title: 'Status', field: 'status' },
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

    // Fetch expense reports for the employee
    const fetchExpenseData = async () => {
        setLoadingExpenses(true)
        try {
            let startDate: Date | null = null
            let endDate: Date | null = null

            if (selectedDateRange) {
                startDate = new Date(selectedDateRange[0])
                startDate.setHours(0, 0, 0, 0)
                endDate = new Date(selectedDateRange[1])
                endDate.setHours(23, 59, 59, 999)
            } else {
                const now = new Date()
                // Get of last month by default
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
            }
            
            const adminUsersResponse: any = await GetAdminUsers()
            
            // Find the admin user that has the employee_id field matching our employee_id
            const adminUser = adminUsersResponse.data.find((admin: any) => admin.employee_id === employee_id)
            
            if (!adminUser) {
                setExpenseData([])
                setLoadingExpenses(false)
                return
            }
            
            const adminId = adminUser._id

            const response: any = await GetExpenseReports({
                employee_id: adminId,
                from_date: startDate,
                to_date: endDate,
                status: 'Approved'
            })

            setExpenseData(response.data || [])
        } catch (error) {
            console.error('Error fetching expense data:', error)
        }
        setLoadingExpenses(false)
    }

    // Helper for safe number formatting in Indian Rupees
    const formatCurrency = (val: any) => {
        const num = Number(val)
        if (isNaN(num)) return '0'
        return num.toLocaleString('en-IN')
    }

    const baseSalary = Number(employeeData?.total_salary) || 0
    const oneDaySalary = Math.round(baseSalary / 30)
    const deductedSalary = Number(employeeData?.deducted_salary) || 0
    const finalSalary = Number(employeeData?.final_salary) || 0

    return (
        <>
            <PageTitle breadcrumbs={[]}>GLS Employee Salary Details</PageTitle>

            {/* 1. Top Navigation Bar with Back Link & Badges */}
            <div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-5'>
                <Link
                    to='/hr/gls-employee-salary'
                    className='btn btn-sm d-inline-flex align-items-center gap-2 gz-sal-back-btn'>
                    <i className='bi bi-arrow-left fs-6'></i>
                    <span className='fw-semibold'>Back to GLS Salary List</span>
                </Link>

                <div className='d-flex align-items-center flex-wrap gap-2'>
                    {employeeData?.employee_code && (
                        <span
                            className='badge badge-light-secondary text-dark fw-bold px-3 py-2 fs-7'
                            style={{ letterSpacing: '0.5px' }}>
                            <i className='bi bi-person-badge text-muted me-1.5'></i>
                            {employeeData.employee_code}
                        </span>
                    )}
                    {joiningTime && (
                        <span className='badge badge-light-success fw-bold px-3 py-2 fs-7'>
                            <i className='bi bi-clock-history me-1'></i>
                            Tenure: {joiningTime}
                        </span>
                    )}
                </div>
            </div>

            {/* 2. Employee Profile Header Card */}
            <div
                className='card shadow-sm border-0 mb-6'
                style={{
                    borderRadius: '14px',
                    border: '1px solid #E4EAF2',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}>
                <div className='card-body p-6'>
                    <div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
                        {/* Employee Avatar & Quick Info */}
                        <div className='d-flex align-items-center gap-4'>
                            <div
                                className='symbol symbol-circle overflow-hidden flex-shrink-0'
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    minWidth: '64px',
                                    minHeight: '64px',
                                    borderRadius: '50%',
                                    border: '1px solid #E4EAF2',
                                    background: '#F5F7FB',
                                }}>
                                <img
                                    src={
                                        (employeeData?.employee_photo || employeeData?.photo)
                                            ? `https://files.fggroup.in/${employeeData?.employee_photo || employeeData?.photo}`
                                            : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                    }
                                    alt={employeeData?.employee_name || employeeData?.full_name || 'GLS Staff'}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className='fw-bold fs-3 mb-1' style={{ color: '#142447' }}>
                                    {employeeData?.employee_name || employeeData?.full_name || 'GLS Employee Salary Details'}
                                </h3>
                                <div className='d-flex flex-wrap align-items-center gap-3 fs-7' style={{ color: '#71809A' }}>
                                    {employeeData?.employee_code && (
                                        <span>
                                            <i className='bi bi-person-badge text-primary me-1'></i>
                                            {employeeData.employee_code}
                                        </span>
                                    )}
                                    {employeeData?.mobile && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                <i className='bi bi-telephone text-primary me-1'></i>
                                                <a
                                                    href={`tel:${employeeData.mobile}`}
                                                    className='text-muted text-hover-primary text-decoration-none'>
                                                    {employeeData.mobile}
                                                </a>
                                            </span>
                                        </>
                                    )}
                                    {employeeData?.email && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                <i className='bi bi-envelope text-primary me-1'></i>
                                                <a
                                                    href={`mailto:${employeeData.email}`}
                                                    className='text-muted text-hover-primary text-decoration-none'>
                                                    {employeeData.email}
                                                </a>
                                            </span>
                                        </>
                                    )}
                                    {employeeData?.joining_date && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                <i className='bi bi-calendar-check text-primary me-1'></i>
                                                Joined: {DayJS(employeeData.joining_date).format('DD MMM YYYY')}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4 Clean Metric Summary Stat Pills */}
                        <div
                            className='d-flex align-items-center flex-wrap ms-auto'
                            style={{ gap: '14px' }}>
                            <div className='gz-salary-stat-pill'>
                                <span className='stat-label'>Monthly Base</span>
                                <span className='stat-value'>₹{formatCurrency(baseSalary)}</span>
                            </div>

                            <div className='gz-salary-stat-pill'>
                                <span className='stat-label'>Daily Rate</span>
                                <span className='stat-value'>₹{formatCurrency(oneDaySalary)}</span>
                            </div>

                            <div className='gz-salary-stat-pill is-danger'>
                                <span className='stat-label'>Deductions</span>
                                <span className='stat-value'>- ₹{formatCurrency(deductedSalary)}</span>
                            </div>

                            <div className='gz-salary-stat-pill is-success'>
                                <span className='stat-label'>Net Payable</span>
                                <span className='stat-value'>₹{formatCurrency(finalSalary)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Salary Calculation Breakdown Card */}
            <div
                className='card shadow-sm border-0 mb-6'
                style={{
                    borderRadius: '14px',
                    border: '1px solid #E4EAF2',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}>
                <div className='card-header border-0 pt-6 px-6 pb-2 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                    <div>
                        <h3 className='fw-bold fs-3 mb-1' style={{ color: '#142447' }}>
                            Salary Calculation Breakdown
                        </h3>
                        <div className='text-muted fs-7'>
                            Detailed calculation of base pay, leave deductions, ratings & reimbursements
                        </div>
                    </div>

                    <div>
                        <DateFilter
                            onDateRangeChange={handleDateRangeChange}
                            rightValue='0'
                            lastMonth={true}
                        />
                    </div>
                </div>

                <div className='card-body p-6 pt-3'>
                    <div className='table-responsive'>
                        <table className='gz-calc-table'>
                            <thead>
                                <tr>
                                    <th style={{ width: '68%' }}>Description / Adjustment Reason</th>
                                    <th className='text-end' style={{ width: '32%' }}>
                                        Amount (INR)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* 1. Base Salary */}
                                <tr>
                                    <td>
                                        <div className='d-flex align-items-center gap-2'>
                                            <i className='bi bi-wallet2 text-primary fs-5'></i>
                                            <span className='fw-semibold' style={{ color: '#142447' }}>
                                                Base Monthly Salary
                                            </span>
                                        </div>
                                    </td>
                                    <td className='text-end fs-6 fw-bold' style={{ color: '#142447' }}>
                                        ₹{formatCurrency(employeeData?.total_salary || 0)}
                                    </td>
                                </tr>

                                {/* 2. Absent Cutting */}
                                <tr>
                                    <td>
                                        <div className='d-flex align-items-center flex-wrap gap-2'>
                                            <i className='bi bi-calendar-x text-danger fs-5'></i>
                                            <span className='fw-semibold' style={{ color: '#142447' }}>
                                                Absent Deductions ({employeeData?.absent_cutting_salary?.[0]?.absent || 0} Days)
                                            </span>
                                            {employeeData?.absent_cutting_salary?.[0]?.sandwichLeave && (
                                                <span className='badge badge-light-warning fw-semibold fs-8 px-2.5 py-1'>
                                                    <i className='bi bi-exclamation-triangle me-1'></i>
                                                    {employeeData?.absent_cutting_salary?.[0]?.sandwichLeave} Sandwich Leave Apply
                                                </span>
                                            )}
                                            {employeeData?.absent_cutting_salary?.[0]?.paidLeave && (
                                                <span className='badge badge-light-success fw-semibold fs-8 px-2.5 py-1'>
                                                    <i className='bi bi-check-circle me-1'></i>Paid Leave Apply
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='text-end fs-6 fw-bold text-danger'>
                                        - ₹{formatCurrency(employeeData?.absent_cutting_salary?.[0]?.salary || 0)}
                                    </td>
                                </tr>

                                {/* 3. Half-Day Cutting */}
                                <tr>
                                    <td>
                                        <div className='d-flex align-items-center flex-wrap gap-2'>
                                            <i className='bi bi-clock-history text-danger fs-5'></i>
                                            <span className='fw-semibold' style={{ color: '#142447' }}>
                                                Half-Day Deductions ({employeeData?.half_day_salary?.[0]?.halfDay || 0} Half)
                                            </span>
                                            {employeeData?.half_day_salary?.[0]?.paidLeave && (
                                                <span className='badge badge-light-success fw-semibold fs-8 px-2.5 py-1'>
                                                    <i className='bi bi-check-circle me-1'></i>Paid Leave Apply
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='text-end fs-6 fw-bold text-danger'>
                                        - ₹{formatCurrency(employeeData?.half_day_salary?.[0]?.salary || 0)}
                                    </td>
                                </tr>

                                {/* 4. Deducted Salary Total */}
                                <tr>
                                    <td>
                                        <div className='d-flex align-items-center gap-2'>
                                            <i className='bi bi-graph-down-arrow text-danger fs-5'></i>
                                            <span className='fw-semibold' style={{ color: '#142447' }}>
                                                Accumulated Deducted Salary
                                            </span>
                                        </div>
                                    </td>
                                    <td className='text-end fs-6 fw-bold text-danger'>
                                        - ₹{formatCurrency(employeeData?.deducted_salary || 0)}
                                    </td>
                                </tr>

                                {/* 5. Task Rating Adjustment */}
                                <tr>
                                    <td>
                                        <div className='d-flex align-items-center flex-wrap gap-2'>
                                            <i className='bi bi-star-fill text-warning fs-5'></i>
                                            <span className='fw-semibold' style={{ color: '#142447' }}>
                                                Task Performance Rating ({employeeData?.task_rating?.rating || 0}% Score,{' '}
                                                {employeeData?.task_rating?.percentage?.value || 0}% Adjustment)
                                            </span>
                                        </div>
                                    </td>
                                    {employeeData?.task_rating?.percentage?.type === 'plus' ? (
                                        <td className='text-end fs-6 fw-bold text-success'>
                                            + ₹{formatCurrency(employeeData?.task_rating?.task_rating_salary || 0)}
                                        </td>
                                    ) : (
                                        <td className='text-end fs-6 fw-bold text-danger'>
                                            - ₹{formatCurrency(employeeData?.task_rating?.task_rating_salary || 0)}
                                        </td>
                                    )}
                                </tr>

                                {/* 6. Approved Expenses */}
                                <tr>
                                    <td>
                                        <div className='d-flex align-items-center flex-wrap gap-2'>
                                            <i className='bi bi-receipt text-success fs-5'></i>
                                            <span className='fw-semibold' style={{ color: '#142447' }}>
                                                Approved Reimbursements ({employeeData?.approved_expenses_count || 0} Items)
                                            </span>
                                        </div>
                                    </td>
                                    <td className='text-end fs-6 fw-bold text-success'>
                                        + ₹{formatCurrency(employeeData?.total_approved_expenses || 0)}
                                    </td>
                                </tr>

                                {/* 7. 10% Salary Retention (if applicable) */}
                                {employeeData?.ten_percent_salary ? (
                                    <tr>
                                        <td>
                                            <div className='d-flex align-items-center gap-2'>
                                                <i className='bi bi-shield-lock text-danger fs-5'></i>
                                                <span className='fw-semibold' style={{ color: '#142447' }}>
                                                    10% Salary Retention
                                                </span>
                                            </div>
                                        </td>
                                        <td className='text-end fs-6 fw-bold text-danger'>
                                            - ₹{formatCurrency(employeeData?.ten_percent_salary || 0)}
                                        </td>
                                    </tr>
                                ) : null}

                                {/* 8. Final Net Salary Highlight Row */}
                                <tr className='gz-calc-total-row'>
                                    <td>
                                        <div className='d-flex align-items-center gap-2 py-1'>
                                            <i className='bi bi-check2-circle text-success fs-4'></i>
                                            <div>
                                                <span className='fs-5 fw-bolder d-block' style={{ color: '#142447' }}>
                                                    Final Net Payable Salary
                                                </span>
                                                <span className='fs-8 text-muted fw-normal'>
                                                    Gross earnings minus deductions plus approved expenses
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='text-end fs-4 fw-bolder text-success py-1'>
                                        ₹{formatCurrency(employeeData?.final_salary || 0)} /-
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4. Filter Toolbar for Attendance Log */}
            <div className='gz-filter-card mb-4'>
                <div className='d-flex align-items-center flex-wrap gap-3 w-100'>
                    {/* Search Bar */}
                    <div style={{ minWidth: '240px', maxWidth: '360px', flex: '1 1 240px' }}>
                        <SearchFilter
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            placeholder='Search date, status...'
                            className='me-0'
                        />
                    </div>

                    {/* Length / Page Size Menu */}
                    <div>
                        <LengthMenu
                            expenseData={salaryData}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                            className='me-0'
                        />
                    </div>

                    {/* Spacer */}
                    <div className='d-none d-md-block ms-auto'></div>

                    {/* Total Count Badge */}
                    <div>
                        <span className='badge badge-light-secondary text-dark fw-bold fs-7 px-3 py-2'>
                            <i className='bi bi-calendar3 text-muted me-1.5'></i>
                            {filteredSalaryData?.length || 0} Attendance Records
                        </span>
                    </div>
                </div>
            </div>

            {/* 5. Attendance & Working Hours Table Card */}
            <div className='gz-inv-table-card mb-6'>
                <div className='card-header border-0 pt-5 px-6 pb-2 d-flex align-items-center justify-content-between'>
                    <h3 className='card-title align-items-start flex-column m-0'>
                        <span className='card-label fw-bold fs-4' style={{ color: '#142447' }}>
                            Absent, Present, OverTime, Half-Day Data
                        </span>
                        <span className='text-muted fs-7 fw-semibold mt-1'>
                            Detailed daily log of clock-in duration, overtime hours and attendance status
                        </span>
                    </h3>
                </div>

                <div className='py-4 card-body px-6'>
                    <div className='table-responsive'>
                        <Table
                            data={paginatedSalaryData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            removeAction={true}
                            renderRow={(
                                salary: any,
                                index: number,
                                actualIndex: number,
                                isVisible: boolean
                            ) => (
                                <React.Fragment key={salary?._id || index}>
                                    <tr
                                        onClick={() => handleRowClick(salary?._id)}
                                        className='data-row'
                                        style={{ transition: 'background-color 0.15s ease', cursor: 'pointer' }}>
                                        <td className='text-center ps-4'>
                                            <div className='d-flex align-items-center justify-content-center'>
                                                <FontAwesomeIcon
                                                    icon={faPlusCircle}
                                                    className='me-2 plus-icon'
                                                    style={{ color: '#1E3A5F', fontSize: '15px' }}
                                                />
                                                <span className='fw-bold fs-7' style={{ color: '#142447' }}>{actualIndex}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className='text-gray-800 fw-semibold fs-7'>
                                                {salary.OverTime && salary.OverTime !== '00:00' ? (
                                                    <span className='badge badge-light-info fw-bold fs-8 px-2.5 py-1'>
                                                        {salary.OverTime}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-gray-800 fw-semibold fs-7'>
                                                {salary.WorkTime && salary.WorkTime !== '00:00' ? (
                                                    <span className='badge badge-light-secondary text-dark fw-bold fs-8 px-2.5 py-1'>
                                                        {salary.WorkTime}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-bold fs-7' style={{ color: '#142447' }}>
                                                {salary.date ? DayJS(salary.date).format('DD/MM/YYYY (ddd)') : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            {salary?.halfDay ? (
                                                salary?.status === 'Leave' || salary?.status === 'A' ? (
                                                    <span className='badge badge-light-danger fw-bold fs-8 px-2.5 py-1'>
                                                        Half Day
                                                    </span>
                                                ) : (
                                                    <span className='badge badge-light-warning fw-bold fs-8 px-2.5 py-1'>
                                                        Half Day
                                                    </span>
                                                )
                                            ) : (
                                                <span className='text-muted fs-7'>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {salary?.status === 'Leave' || salary?.status === 'A' ? (
                                                DayJS(salary.date).format('dddd') === 'Sunday' ? (
                                                    <span className='badge badge-light-danger fw-bold fs-8 px-2.5 py-1'>
                                                        Sunday
                                                    </span>
                                                ) : (
                                                    <span className='badge badge-light-danger fw-bold fs-8 px-2.5 py-1'>
                                                        {salary?.status}
                                                    </span>
                                                )
                                            ) : DayJS(salary.date).format('dddd') === 'Sunday' ? (
                                                <span className='badge badge-light-primary fw-bold fs-8 px-2.5 py-1'>
                                                    Sunday - {salary?.status}
                                                </span>
                                            ) : (
                                                <span className='badge badge-light-success fw-bold fs-8 px-2.5 py-1'>
                                                    {salary?.status || 'Present'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12} className='bg-light-subtle p-4'>
                                                <div className='d-flex align-items-center gap-4'>
                                                    <div
                                                        style={{
                                                            width: '52px',
                                                            height: '52px',
                                                            borderRadius: '10px',
                                                            overflow: 'hidden',
                                                            border: '1px solid #E4EAF2',
                                                            background: '#ffffff',
                                                        }}>
                                                        <img
                                                            src={
                                                                salary?.photo
                                                                    ? `https://files.fggroup.in/${salary?.photo}`
                                                                    : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                                            }
                                                            alt={salary?.full_name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className='fw-bold fs-6' style={{ color: '#142447' }}>
                                                            {salary?.full_name || employeeData?.employee_name || employeeData?.full_name}
                                                        </div>
                                                        <div className='text-muted fs-7'>
                                                            {salary?.mobile || employeeData?.mobile}
                                                        </div>
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

                    {paginatedSalaryData?.length === 0 && !loading && (
                        <div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-12'>
                            <i className='bi bi-calendar-check text-muted fs-2x mb-2'></i>
                            <span className='fw-bold fs-6' style={{ color: '#142447' }}>No attendance records found</span>
                            <span className='text-muted fs-7'>Try selecting a different date range or clearing search</span>
                        </div>
                    )}

                    {filteredSalaryData?.length > 0 && (
                        <UsersListPagination
                            totalPages={Math.ceil(filteredSalaryData?.length / pagination.itemsPerPage)}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                            totalRecords={filteredSalaryData?.length}
                            itemsPerPage={pagination.itemsPerPage}
                        />
                    )}
                </div>
            </div>

            {/* 6. Approved Expense Reports Section */}
            <div
                className='card shadow-sm border-0 mb-6'
                style={{
                    borderRadius: '14px',
                    border: '1px solid #E4EAF2',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    marginTop: '28px',
                }}>
                <div className='card-header border-0 pt-6 px-6 pb-2 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                    <div>
                        <h3 className='fw-bold fs-3 mb-1' style={{ color: '#142447' }}>
                            Approved Expense Reimbursements
                        </h3>
                        <span className='text-muted fs-7'>
                            Reimbursements verified and credited to employee salary payout
                        </span>
                    </div>

                    {expenseData && expenseData.length > 0 && (
                        <span className='badge badge-light-success fw-bold fs-7 px-3 py-2'>
                            <i className='bi bi-receipt-cutoff me-1.5'></i>
                            {expenseData.length} Approved Report{expenseData.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className='card-body p-6 pt-3'>
                    <div className='table-responsive'>
                        {expenseData && expenseData.length > 0 ? (
                            <table className='gz-expense-table'>
                                <thead>
                                    <tr>
                                        <th style={{ width: '15%' }}>Date</th>
                                        <th style={{ width: '25%' }}>Purpose</th>
                                        <th style={{ width: '40%' }}>Expense Items Breakdown</th>
                                        <th className='text-end' style={{ width: '20%' }}>
                                            Amount (INR)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseData.map((expense: any) => (
                                        <tr key={expense._id}>
                                            <td>
                                                <span className='fw-bold fs-7' style={{ color: '#142447' }}>
                                                    {DayJS(expense.createdAt).format('DD/MM/YYYY')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className='fw-semibold fs-7' style={{ color: '#142447' }}>
                                                    {expense.purpose || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className='d-flex flex-wrap gap-1.5'>
                                                    {expense.expenses?.map((item: any, index: number) => (
                                                        <span
                                                            key={index}
                                                            className='badge badge-light-secondary text-dark fw-semibold fs-8 px-2 py-1'>
                                                            <strong>{item.type}:</strong> {item.description} (₹{item.amount})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className='text-end fs-6 fw-bold' style={{ color: '#142447' }}>
                                                ₹{formatCurrency(expense.total_amount || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className='gz-calc-total-row'>
                                        <td colSpan={3} className='fw-bolder fs-6' style={{ color: '#142447' }}>
                                            Total Approved Expenses Reimbursed
                                        </td>
                                        <td className='text-end fs-5 fw-bolder text-success'>
                                            + ₹{formatCurrency(employeeData?.total_approved_expenses || 0)} /-
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <div className='d-flex flex-column text-center w-100 align-items-center justify-content-center py-10'>
                                <i className='bi bi-receipt text-muted fs-2x mb-2'></i>
                                <span className='fw-bold fs-6' style={{ color: '#142447' }}>
                                    No Approved Expense Reports Found
                                </span>
                                <span className='text-muted fs-7'>
                                    There are no approved expense claims for this employee in this period
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default GlsEmployeeSalaryView
