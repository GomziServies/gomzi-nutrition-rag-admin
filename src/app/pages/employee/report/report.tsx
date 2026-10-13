import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetSalary } from '../../../Functions/FGGroup/Attendance'
import { GetTask } from '../../../Functions/FGGroup/TaskManagement'
import { GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'
import { getProfile } from '../../../Functions/FGGroup'
import NumberTicker from '../../../components/NumberTicker'

type QuerySortOptions = 'asc' | 'desc'
type ReportViewTab = 'payroll' | 'attendance' | 'expenses' | 'tasks' | 'salary' | 'details'

const Report: React.FC = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)

    const getStoredEmployee = () => {
        try {
            const raw = localStorage.getItem('fg_group_info') || localStorage.getItem('fg_group_user_info') || localStorage.getItem('auth_fg_group')
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    }

    const [employee, setEmployee] = useState<any>(getStoredEmployee())
    const queryEmployeeId = searchParams.get('employee_id') || searchParams.get('id')
    const employee_id: any = queryEmployeeId || employee?.employee_id || employee?._id

    const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [salaryData, setSalaryData] = useState<any[]>([])
    const [employeeData, setEmployeeData] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState('date')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [joiningTime, setJoiningTime] = useState<string | null>(null)
    const [assignTaskData, setAssignTaskData] = useState<any[]>([])
    const [expenseData, setExpenseData] = useState<any[]>([])
    const [loadingExpenses, setLoadingExpenses] = useState(false)
    const [activeTab, setActiveTab] = useState<ReportViewTab>('payroll')
    const [copiedField, setCopiedField] = useState<string | null>(null)

    // Ensure employee profile exists even if localStorage was emptied
    useEffect(() => {
        if (!employee) {
            getProfile()
                .then((res: any) => {
                    if (res?.data) {
                        localStorage.setItem('fg_group_info', JSON.stringify(res.data))
                        setEmployee(res.data)
                    }
                })
                .catch((err) => console.error('Error auto-fetching profile:', err))
        }
    }, [employee])

    const copyToClipboard = (text: string, fieldName: string) => {
        if (!text) return
        navigator.clipboard?.writeText(text)
        setCopiedField(fieldName)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const fetchSalaryData = async (page?: number) => {
        if (!employee_id) return
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
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        }
        try {
            const response: any = await GetSalary({
                from_date: startDate,
                to_date: endDate,
            })

            const filteredData = response.data
            const data = filteredData?.filter(
                (salary: any) => salary.employee_id == employee_id || salary._id == employee_id
            )

            if (data && data.length > 0) {
                setEmployeeData(data[0])

                const joiningDate = data[0]?.joining_date
                let joiningDuration = ''
                if (joiningDate) {
                    const start = DayJS(joiningDate)
                    const now = DayJS()
                    const years = now.diff(start, 'year')
                    const months = now.diff(start, 'month') % 12
                    const days = now.diff(start, 'day') % 30

                    if (years > 0) joiningDuration += `${years}+ YR`
                    else if (months > 0) joiningDuration += `${months} MO`
                    else joiningDuration = `${days} D`
                }

                setJoiningTime(joiningDuration)
                setSalaryData(data[0].attendance || [])
            } else {
                setSalaryData([])
            }
        } catch (error) {
            console.error('Error fetching salary data:', error)
        }
        setLoading(false)
    }

    const fetchExpenseData = async () => {
        const targetAdminId = employee?._id || queryEmployeeId || employee_id
        if (!targetAdminId) return
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
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
            }

            const response: any = await GetExpenseReports({
                employee_id: targetAdminId,
                from_date: startDate,
                to_date: endDate,
                status: 'Approved',
            })

            setExpenseData(response.data || [])
        } catch (error) {
            console.error('Error fetching expense data:', error)
        }
        setLoadingExpenses(false)
    }

    const fetchAssignTaskData = async (page?: number) => {
        const targetAdminId = employee?._id || queryEmployeeId || employee_id
        if (!targetAdminId) return
        setLoading(true)
        let startDate: Date | null = null
        let endDate: Date | null = null

        if (selectedDateRange) {
            ;[startDate, endDate] = selectedDateRange
            endDate = new Date(endDate.setHours(23, 59, 59, 999))
        } else {
            const now = new Date()
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        }

        try {
            const response = await GetTask({
                admin_id: targetAdminId,
                page: page || pagination.page,
                limit: pagination.itemsPerPage,
                search: searchTerm,
                sort,
                sortOrder,
            })

            const filteredData: any = response.data?.filter((task: any) => {
                const taskStartDate = new Date(task.start_date)
                const taskEndDate = new Date(task.end_date)
                if (startDate && endDate) {
                    return (
                        (taskStartDate >= startDate && taskStartDate <= endDate) ||
                        (taskEndDate >= startDate && taskEndDate <= endDate) ||
                        (taskStartDate <= startDate && taskEndDate >= endDate)
                    )
                }
                return true
            }) || []

            const pendingTasks = filteredData.filter((task: any) => task.status === 'PENDING')
            const completedTasks = filteredData.filter((task: any) => task.status === 'COMPLETED')

            pendingTasks.sort(
                (a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            )
            completedTasks.sort(
                (a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
            )

            setAssignTaskData([...pendingTasks, ...completedTasks])
        } catch (error) {
            console.error('Error fetching task data:', error)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (employee_id) {
            fetchSalaryData()
            fetchExpenseData()
            fetchAssignTaskData()
        }
    }, [employee_id, selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

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
        setPagination({ ...pagination, itemsPerPage: value })
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

    const filteredSalaryData = salaryData?.filter((item: any) =>
        (item?.date?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item?.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
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

    // Calculations
    const baseSalary = Number(employeeData?.total_salary || 0)
    const oneDaySalary = baseSalary > 0 ? Math.round(baseSalary / 26) : 0
    const finalSalary = Number(employeeData?.final_salary || 0)
    const absentSalary = Number(employeeData?.absent_cutting_salary?.[0]?.salary || 0)
    const absentDays = employeeData?.absent_cutting_salary?.[0]?.absent || 0
    const halfDaySalary = Number(employeeData?.half_day_salary?.[0]?.salary || 0)
    const halfDays = employeeData?.half_day_salary?.[0]?.halfDay || 0
    const deductedSalary = Number(employeeData?.deducted_salary || 0)
    const tenPercentHold = Number(employeeData?.ten_percent_salary || 0)
    const taskRatingSalary = Number(employeeData?.task_rating?.task_rating_salary || 0)
    const taskRatingType = employeeData?.task_rating?.percentage?.type
    const taskRatingVal = employeeData?.task_rating?.percentage?.value || 0
    const approvedExpensesTotal = Number(employeeData?.total_approved_expenses || 0)
    const approvedExpensesCount = employeeData?.approved_expenses_count || expenseData?.length || 0

    const totalDeductions = absentSalary + halfDaySalary + (taskRatingType === 'minus' ? taskRatingSalary : 0) + tenPercentHold
    const grossEarnings = baseSalary + (taskRatingType === 'plus' ? taskRatingSalary : 0) + approvedExpensesTotal

    const totalAttendanceLogs = salaryData?.length || 26
    const presentCount = salaryData?.filter((s: any) => s.status === 'P' || s.status === 'Present').length || 0
    const attendancePercentage = totalAttendanceLogs > 0 ? (presentCount / totalAttendanceLogs) * 100 : 0
    const circumference = 2 * Math.PI * 46
    const strokeDashoffset = circumference - (attendancePercentage / 100) * circumference

    const fullName = employeeData?.full_name || employee?.full_name || 'chiragFWG'
    const employeeCode = employeeData?.employee_code || employee?.employee_code || 'ID: —'
    const firstInitial = fullName ? fullName.charAt(0).toUpperCase() : 'C'

    return (
        <>
            <PageTitle breadcrumbs={[]}>Report</PageTitle>

            {/* =========================================================================
                1. TOP EXECUTIVE PROFILE CARD (EXACT MATCH TO REFERENCE)
               ========================================================================= */}
            <div className='gz-report-profile-card'>
                {/* Top Row: Left Avatar & Stats, Right Buttons & Doodles */}
                <div className='d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-4'>
                    {/* Left Identity: Handwritten Doodle + Circular Avatar + Identity & Stats */}
                    <div className='d-flex align-items-center gap-3 gap-md-4 flex-wrap'>
                        {/* Left Doodle "Good Work! ✨" pointing to avatar */}
                        <div className='gz-doodle-good-work d-none d-md-flex'>
                            <div className='gz-doodle-text'>
                                Good<br />Work! ✨
                            </div>
                            <svg width='34' height='38' viewBox='0 0 34 38' fill='none' style={{ marginTop: '2px', marginLeft: '12px' }}>
                                <path d='M4 2C12 10 24 16 28 28M28 28L21 26M28 28L28 20' stroke='#64748B' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'/>
                            </svg>
                        </div>

                        {/* Circular Avatar */}
                        <div className='gz-avatar-hero'>
                            {employeeData?.photo ? (
                                <img
                                    src={`https://files.fggroup.in/${employeeData.photo}`}
                                    alt={fullName}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span>{firstInitial}</span>
                            )}
                            <span className='gz-avatar-status-dot'></span>
                        </div>

                        {/* Name & Quick 5 Stats */}
                        <div>
                            {/* Name, Verified Badge, Status Pill */}
                            <div className='d-flex align-items-center gap-2 mb-2 flex-wrap'>
                                <h2 className='fs-2 fw-bold text-gray-900 mb-0'>{fullName}</h2>
                                <i className='bi bi-patch-check-fill text-primary fs-5' title='Verified Personnel'></i>
                                <span className='badge bg-light-success text-success px-2 py-1 fs-9 fw-bold' style={{ borderRadius: '4px' }}>
                                    Active
                                </span>
                            </div>

                            {/* 5-Statistic Strip */}
                            <div className='d-flex align-items-center flex-wrap gap-2 gap-sm-0 my-3'>
                                <div className='gz-stat-col ps-0 text-start'>
                                    <div className='gz-stat-number'>
                                        <NumberTicker value={totalAttendanceLogs || 26} />
                                    </div>
                                    <div className='gz-stat-label'>Working Days</div>
                                </div>

                                <div className='gz-stat-col'>
                                    <div className='gz-stat-number'>
                                        <NumberTicker value={absentDays} />
                                    </div>
                                    <div className='gz-stat-label'>Absent</div>
                                </div>

                                <div className='gz-stat-col'>
                                    <div className='gz-stat-number'>
                                        <NumberTicker value={halfDays} />
                                    </div>
                                    <div className='gz-stat-label'>Half-Day</div>
                                </div>

                                <div className='gz-stat-col'>
                                    <div className='gz-stat-number'>
                                        <NumberTicker value={approvedExpensesCount} />
                                    </div>
                                    <div className='gz-stat-label'>Claims</div>
                                </div>

                                <div className='gz-stat-col pe-0'>
                                    <div className='gz-stat-number'>
                                        <NumberTicker text={joiningTime || '1+ YR'} />
                                    </div>
                                    <div className='gz-stat-label'>At GOMZI</div>
                                </div>
                            </div>

                            {/* Meta & Quote */}
                            <div className='d-flex align-items-center gap-3 text-muted fs-8 flex-wrap mt-2'>
                                <span className='d-inline-flex align-items-center gap-1 text-gray-700'>
                                    <i className='bi bi-person-badge text-gray-500'></i> Employee
                                </span>
                                <span>|</span>
                                <span className='text-gray-700'>{employeeCode}</span>
                                <span>|</span>
                                <span className='d-inline-flex align-items-center gap-1 text-gray-700'>
                                    Joined {employeeData?.joining_date ? DayJS(employeeData.joining_date).format('DD-MM-YYYY') : 'dd-mm-yyyy'}
                                </span>
                            </div>

                            <div className='text-muted fs-8 fst-italic mt-2'>
                                “Discipline today, stronger tomorrow.”
                            </div>
                        </div>
                    </div>

                    {/* Right Buttons & Doodle */}
                    <div className='d-flex flex-column align-items-lg-end gap-2'>
                        {/* Action Buttons */}
                        <div className='d-flex align-items-center gap-2 flex-wrap'>
                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='btn btn-sm text-white fw-bold px-3'
                                style={{ background: '#0F172A', borderRadius: '6px' }}>
                                View Payslip
                            </button>

                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='btn btn-sm btn-light border text-gray-800 fw-medium d-inline-flex align-items-center gap-1 px-3'
                                style={{ borderRadius: '6px' }}>
                                <i className='bi bi-download fs-8'></i> Download Statement
                            </button>

                            <button
                                type='button'
                                onClick={() => {
                                    fetchSalaryData()
                                    fetchExpenseData()
                                    fetchAssignTaskData()
                                }}
                                className='btn btn-sm btn-light border text-gray-700 px-2'
                                style={{ borderRadius: '6px' }}
                                title='Options / Refresh'>
                                <i className='bi bi-three-dots-vertical'></i>
                            </button>
                        </div>

                        {/* Right Doodle "All your payroll info in one place." */}
                        <div className='gz-doodle-payroll-info d-none d-xl-flex'>
                            <svg width='32' height='36' viewBox='0 0 32 36' fill='none'>
                                <path d='M6 4C18 8 26 18 20 30M20 30L14 26M20 30L25 25' stroke='#64748B' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                            </svg>
                            <div>All your<br />payroll info<br />in one place.</div>
                        </div>
                    </div>
                </div>

                {/* 5 Circular Hub Icons */}
                <div className='gz-hub-nav-row'>
                    <button
                        type='button'
                        className={`gz-hub-btn ${activeTab === 'payroll' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payroll')}>
                        <div className='gz-hub-circle'>
                            <i className='bi bi-wallet2'></i>
                        </div>
                        <span className='gz-hub-label'>Payroll</span>
                    </button>

                    <button
                        type='button'
                        className={`gz-hub-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}>
                        <div className='gz-hub-circle'>
                            <i className='bi bi-calendar3'></i>
                        </div>
                        <span className='gz-hub-label'>Attendance</span>
                    </button>

                    <button
                        type='button'
                        className={`gz-hub-btn ${activeTab === 'expenses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expenses')}>
                        <div className='gz-hub-circle'>
                            <i className='bi bi-file-earmark-text'></i>
                        </div>
                        <span className='gz-hub-label'>Expenses</span>
                    </button>

                    <button
                        type='button'
                        className={`gz-hub-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tasks')}>
                        <div className='gz-hub-circle'>
                            <i className='bi bi-check2-square'></i>
                        </div>
                        <span className='gz-hub-label'>Tasks</span>
                    </button>

                    <button
                        type='button'
                        className={`gz-hub-btn ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}>
                        <div className='gz-hub-circle'>
                            <i className='bi bi-person'></i>
                        </div>
                        <span className='gz-hub-label'>My Details</span>
                    </button>
                </div>
            </div>

            {/* =========================================================================
                IF TAB IS NOT PAYROLL: SHOW DETAILED FOCUSED TABLES
               ========================================================================= */}
            {activeTab === 'attendance' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '12px', border: '1px solid var(--gz-border)' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Daily Attendance Punch Records</h3>
                            <span className='text-muted fs-8'>Detailed working hours, punch times, and status logs</span>
                        </div>
                        <div className='d-flex align-items-center gap-3'>
                            <input
                                type='text'
                                className='form-control form-control-sm ps-3 bg-light border'
                                placeholder='Search date...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                type='button'
                                className='btn btn-sm btn-light border text-gray-700'
                                onClick={() => setActiveTab('payroll')}>
                                ← Back to Overview
                            </button>
                        </div>
                    </div>
                    <div className='card-body p-5'>
                        <Table
                            data={paginatedSalaryData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            removeAction={true}
                            renderRow={(salary: any, index: number, actualIndex: number) => (
                                <tr key={salary?._id || actualIndex}>
                                    <td className='text-center fw-bold'>{actualIndex}</td>
                                    <td>{salary.OverTime || '00:00'}</td>
                                    <td className='fw-bold'>{salary.WorkTime || '—'}</td>
                                    <td>{DayJS(salary.date).format('DD MMM, YYYY')}</td>
                                    <td>{salary?.halfDay ? 'Half Day' : 'Full Day'}</td>
                                    <td>
                                        <span className={`badge ${salary?.status === 'Leave' || salary?.status === 'A' ? 'bg-light-danger text-danger' : 'bg-light-success text-success'} px-2 py-1`}>
                                            {salary?.status || 'Present'}
                                        </span>
                                    </td>
                                </tr>
                            )}
                            visibleDetails={visibleDetails}
                            pagination={pagination}
                            setPagination={setPagination}
                            loading={loading}
                        />
                        {paginatedSalaryData?.length > 0 && (
                            <div className='mt-3'>
                                <UsersListPagination
                                    totalPages={Math.ceil((filteredSalaryData?.length || 1) / pagination.itemsPerPage)}
                                    currentPage={pagination.page}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'expenses' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '12px', border: '1px solid var(--gz-border)' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Approved Expense Claims</h3>
                            <span className='text-muted fs-8'>Reimbursed out-of-pocket operational claims</span>
                        </div>
                        <button
                            type='button'
                            className='btn btn-sm btn-light border text-gray-700'
                            onClick={() => setActiveTab('payroll')}>
                            ← Back to Overview
                        </button>
                    </div>
                    <div className='card-body p-5'>
                        <table className='table align-middle'>
                            <thead>
                                <tr className='text-muted fs-8 text-uppercase border-bottom'>
                                    <th>Date</th>
                                    <th>Purpose</th>
                                    <th>Line Items</th>
                                    <th className='text-end'>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenseData?.length > 0 ? (
                                    expenseData.map((e: any) => (
                                        <tr key={e._id}>
                                            <td className='fw-bold'>{DayJS(e.createdAt).format('DD MMM, YYYY')}</td>
                                            <td>{e.purpose}</td>
                                            <td>
                                                {e.expenses?.map((i: any, idx: number) => (
                                                    <span key={idx} className='badge bg-light text-gray-700 border me-1'>
                                                        {i.type}: ₹{i.amount}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className='text-end fw-bold'>₹{e.total_amount} /-</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className='text-center py-5 text-muted'>
                                            No expense claims found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'details' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '12px', border: '1px solid var(--gz-border)' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>My Personnel Details</h3>
                            <span className='text-muted fs-8'>Registered employee credentials and contractual rates</span>
                        </div>
                        <button
                            type='button'
                            className='btn btn-sm btn-light border text-gray-700'
                            onClick={() => setActiveTab('payroll')}>
                            ← Back to Overview
                        </button>
                    </div>
                    <div className='card-body p-5'>
                        <div className='row g-4'>
                            <div className='col-md-4'>
                                <div className='p-3 bg-light rounded-2 border'>
                                    <span className='text-muted fs-8 d-block'>Employee Code</span>
                                    <span className='fw-bold fs-6'>{employeeCode}</span>
                                </div>
                            </div>
                            <div className='col-md-4'>
                                <div className='p-3 bg-light rounded-2 border'>
                                    <span className='text-muted fs-8 d-block'>Full Name</span>
                                    <span className='fw-bold fs-6'>{fullName}</span>
                                </div>
                            </div>
                            <div className='col-md-4'>
                                <div className='p-3 bg-light rounded-2 border'>
                                    <span className='text-muted fs-8 d-block'>Email</span>
                                    <span className='fw-bold fs-6'>{employeeData?.email || '—'}</span>
                                </div>
                            </div>
                            <div className='col-md-4'>
                                <div className='p-3 bg-light rounded-2 border'>
                                    <span className='text-muted fs-8 d-block'>Mobile</span>
                                    <span className='fw-bold fs-6'>{employeeData?.mobile || '—'}</span>
                                </div>
                            </div>
                            <div className='col-md-4'>
                                <div className='p-3 bg-light rounded-2 border'>
                                    <span className='text-muted fs-8 d-block'>Monthly Base Salary</span>
                                    <span className='fw-bold fs-6'>₹{baseSalary.toLocaleString()} /-</span>
                                </div>
                            </div>
                            <div className='col-md-4'>
                                <div className='p-3 bg-light rounded-2 border'>
                                    <span className='text-muted fs-8 d-block'>Daily Baseline Rate</span>
                                    <span className='fw-bold fs-6'>₹{oneDaySalary} / day</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '12px', border: '1px solid var(--gz-border)' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Assigned Tasks & Deliverables</h3>
                            <span className='text-muted fs-8'>Operational deliverables, deadlines, and completion ratings affecting monthly performance bonus</span>
                        </div>
                        <div className='d-flex align-items-center gap-3'>
                            <input
                                type='text'
                                className='form-control form-control-sm ps-3 bg-light border'
                                placeholder='Search tasks...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                type='button'
                                className='btn btn-sm btn-light border text-gray-700'
                                onClick={() => setActiveTab('payroll')}>
                                ← Back to Overview
                            </button>
                        </div>
                    </div>
                    <div className='card-body p-5'>
                        <table className='table align-middle table-row-dashed fs-7 gy-3'>
                            <thead>
                                <tr className='text-muted fs-8 text-uppercase border-bottom'>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>Task Title</th>
                                    <th>Remarks</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Employee Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignTaskData?.length > 0 ? (
                                    assignTaskData
                                        .filter((t: any) =>
                                            (t?.task_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                            (t?.remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                            (t?.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                                        )
                                        .map((task: any, idx: number) => (
                                            <tr key={task._id || idx}>
                                                <td className='text-muted fw-semibold'>{idx + 1}</td>
                                                <td>
                                                    <span className='fw-bold text-gray-900 d-block'>{task.task_title || 'Untitled Task'}</span>
                                                </td>
                                                <td className='text-gray-600 fs-8'>{task.remarks || '—'}</td>
                                                <td>
                                                    {task.end_date ? (
                                                        <span className='text-gray-800 fw-medium'>
                                                            <i className='bi bi-calendar-event me-1 text-muted'></i>
                                                            {DayJS(task.end_date).format('DD MMM, YYYY')}
                                                        </span>
                                                    ) : (
                                                        <span className='text-muted'>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge px-2 py-1 fs-9 fw-bold ${
                                                            task.status === 'COMPLETED'
                                                                ? 'bg-light-success text-success'
                                                                : 'bg-light-warning text-warning'
                                                        }`}>
                                                        {task.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className='text-gray-600 fs-8'>{task.employee_remarks || '—'}</td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className='text-center py-5 text-muted'>
                                            No assigned tasks found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'salary' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '12px', border: '1px solid var(--gz-border)' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Detailed Salary Breakdown & Statement</h3>
                            <span className='text-muted fs-8'>Itemized compensation ledger: base rates, daily baseline formula, attendance cutting, retention hold, and net take-home pay</span>
                        </div>
                        <div className='d-flex align-items-center gap-2'>
                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='btn btn-sm text-white fw-bold px-3'
                                style={{ background: '#0F172A', borderRadius: '6px' }}>
                                <i className='bi bi-printer me-1 text-white'></i> Print Payslip
                            </button>
                            <button
                                type='button'
                                className='btn btn-sm btn-light border text-gray-700'
                                onClick={() => setActiveTab('payroll')}>
                                ← Back to Overview
                            </button>
                        </div>
                    </div>

                    <div className='card-body p-6'>
                        {/* 3 Summary Stat Callouts */}
                        <div className='row g-4 mb-6'>
                            <div className='col-12 col-md-4'>
                                <div className='p-4 rounded-3 border bg-light-primary border-primary border-opacity-25'>
                                    <span className='text-muted fs-8 fw-semibold d-block text-uppercase' style={{ letterSpacing: '0.05em' }}>Baseline Gross Earnings</span>
                                    <div className='fs-2x fw-bolder text-gray-900 mt-1'>₹{grossEarnings.toLocaleString()} /-</div>
                                    <span className='text-primary fs-8 mt-1 d-block'>Base: ₹{baseSalary.toLocaleString()} + Additions: ₹{(grossEarnings - baseSalary).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className='col-12 col-md-4'>
                                <div className='p-4 rounded-3 border bg-light-danger border-danger border-opacity-25'>
                                    <span className='text-muted fs-8 fw-semibold d-block text-uppercase' style={{ letterSpacing: '0.05em' }}>Total Deductions & Retentions</span>
                                    <div className='fs-2x fw-bolder text-danger mt-1'>- ₹{totalDeductions.toLocaleString()} /-</div>
                                    <span className='text-danger fs-8 mt-1 d-block'>Absent + Half-day + 10% Security Hold</span>
                                </div>
                            </div>
                            <div className='col-12 col-md-4'>
                                <div className='p-4 rounded-3 border' style={{ background: '#0F172A', color: '#FFFFFF' }}>
                                    <span className='text-white-50 fs-8 fw-semibold d-block text-uppercase' style={{ letterSpacing: '0.05em' }}>Net Payout Amount</span>
                                    <div className='fs-2x fw-bolder text-white mt-1'>₹{finalSalary.toLocaleString()} /-</div>
                                    <span className='text-white-50 fs-8 mt-1 d-block'>Rate: ₹{oneDaySalary} / day (26-day basis)</span>
                                </div>
                            </div>
                        </div>

                        {/* 2 Detailed Breakdown Ledgers */}
                        <div className='row g-5'>
                            {/* Left: Earnings Components */}
                            <div className='col-12 col-lg-6'>
                                <div className='border rounded-3 p-4 h-100 bg-white'>
                                    <div className='d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom'>
                                        <h4 className='fw-bold fs-5 text-gray-900 mb-0'>
                                            <i className='bi bi-plus-circle-fill text-success me-2'></i>
                                            Earnings & Reimbursements
                                        </h4>
                                        <span className='badge bg-light-success text-success fw-bold'>Credited</span>
                                    </div>

                                    <div className='table-responsive'>
                                        <table className='table table-borderless align-middle mb-0 fs-7'>
                                            <tbody>
                                                <tr className='border-bottom'>
                                                    <td className='ps-0 py-3'>
                                                        <div className='fw-bold text-gray-900'>Base Monthly Pay</div>
                                                        <div className='text-muted fs-8'>Contractual baseline salary rate</div>
                                                    </td>
                                                    <td className='text-muted fs-8 text-end'>26 Working Days</td>
                                                    <td className='text-end fw-bold text-gray-900 pe-0'>₹{baseSalary.toLocaleString()} /-</td>
                                                </tr>
                                                <tr className='border-bottom'>
                                                    <td className='ps-0 py-3'>
                                                        <div className='fw-bold text-gray-900'>Task Performance Bonus</div>
                                                        <div className='text-muted fs-8'>Score: {employeeData?.task_rating?.rating || 0}% performance rating</div>
                                                    </td>
                                                    <td className='text-muted fs-8 text-end'>Incentive</td>
                                                    <td className='text-end fw-bold text-gray-900 pe-0'>
                                                        {taskRatingType === 'plus' ? `+ ₹${taskRatingSalary.toLocaleString()} /-` : '₹0 /-'}
                                                    </td>
                                                </tr>
                                                <tr className='border-bottom'>
                                                    <td className='ps-0 py-3'>
                                                        <div className='fw-bold text-gray-900'>Approved Expense Reimbursements</div>
                                                        <div className='text-muted fs-8'>{approvedExpensesCount} out-of-pocket operational claims</div>
                                                    </td>
                                                    <td className='text-muted fs-8 text-end'>{approvedExpensesCount} items</td>
                                                    <td className='text-end fw-bold text-success pe-0'>+ ₹{approvedExpensesTotal.toLocaleString()} /-</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className='ps-0 pt-4 fw-bold fs-6 text-gray-900'>Total Gross Earnings</td>
                                                    <td className='text-end pt-4 pe-0 fw-bolder fs-5 text-gray-900'>₹{grossEarnings.toLocaleString()} /-</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Deductions Components */}
                            <div className='col-12 col-lg-6'>
                                <div className='border rounded-3 p-4 h-100 bg-white'>
                                    <div className='d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom'>
                                        <h4 className='fw-bold fs-5 text-gray-900 mb-0'>
                                            <i className='bi bi-dash-circle-fill text-danger me-2'></i>
                                            Deductions & Retentions
                                        </h4>
                                        <span className='badge bg-light-danger text-danger fw-bold'>Debited</span>
                                    </div>

                                    <div className='table-responsive'>
                                        <table className='table table-borderless align-middle mb-0 fs-7'>
                                            <tbody>
                                                <tr className='border-bottom'>
                                                    <td className='ps-0 py-3'>
                                                        <div className='fw-bold text-gray-900'>Absent Days Cut</div>
                                                        <div className='text-muted fs-8'>{absentDays} days × ₹{oneDaySalary} daily rate</div>
                                                    </td>
                                                    <td className='text-muted fs-8 text-end'>{absentDays} Days</td>
                                                    <td className='text-end fw-bold text-danger pe-0'>- ₹{absentSalary.toLocaleString()} /-</td>
                                                </tr>
                                                <tr className='border-bottom'>
                                                    <td className='ps-0 py-3'>
                                                        <div className='fw-bold text-gray-900'>Half-Day Deductions</div>
                                                        <div className='text-muted fs-8'>{halfDays} half occurrences × ₹{Math.round(oneDaySalary / 2)} rate</div>
                                                    </td>
                                                    <td className='text-muted fs-8 text-end'>{halfDays} Half</td>
                                                    <td className='text-end fw-bold text-danger pe-0'>- ₹{halfDaySalary.toLocaleString()} /-</td>
                                                </tr>
                                                <tr className='border-bottom'>
                                                    <td className='ps-0 py-3'>
                                                        <div className='fw-bold text-gray-900'>10% Security Retention Hold</div>
                                                        <div className='text-muted fs-8'>Company policy standard security deposit</div>
                                                    </td>
                                                    <td className='text-muted fs-8 text-end'>Policy Hold</td>
                                                    <td className='text-end fw-bold text-danger pe-0'>- ₹{tenPercentHold.toLocaleString()} /-</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={2} className='ps-0 pt-4 fw-bold fs-6 text-gray-900'>Total Deductions</td>
                                                    <td className='text-end pt-4 pe-0 fw-bolder fs-5 text-danger'>- ₹{totalDeductions.toLocaleString()} /-</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Formula Footer */}
                        <div className='p-4 rounded-3 border bg-light mt-5 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                            <div>
                                <span className='fw-bold text-gray-900 fs-6 d-block'>Net Salary Calculation Formula</span>
                                <span className='text-muted fs-8'>
                                    Net Take-Home = Gross Earnings (₹{grossEarnings.toLocaleString()}) - Deductions (₹{totalDeductions.toLocaleString()}) = ₹{finalSalary.toLocaleString()} /-
                                </span>
                            </div>
                            <button
                                type='button'
                                className='btn btn-sm btn-dark px-4 fw-semibold'
                                style={{ background: '#0F172A' }}
                                onClick={() => setActiveTab('payroll')}>
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                DEFAULT VIEW: EXACT MATCH 3-COLUMN MAIN GRID (PAYROLL EXECUTIVE OVERVIEW)
               ========================================================================= */}
            {activeTab === 'payroll' && (
                <>
                    {/* 2. MIDDLE ROW (3-COLUMN CARDS) */}
                    <div className='row g-4 mb-4 align-items-stretch'>
                        {/* Left Column: Net Take-Home Pay Hero Card */}
                        <div className='col-12 col-lg-5 d-flex'>
                            <div className='gz-net-hero-card w-100'>
                                <div>
                                    {/* Header line */}
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <span className='fs-8 fw-bold text-uppercase text-white-50' style={{ letterSpacing: '0.06em' }}>
                                            OCTOBER 2026
                                        </span>
                                        <span className='badge' style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', borderRadius: '4px', fontSize: '11px' }}>
                                            Current Period
                                        </span>
                                    </div>

                                    {/* Title & Amount */}
                                    <div className='d-flex align-items-start justify-content-between mt-2'>
                                        <div>
                                            <div className='text-white-50 fs-7 mb-1'>Net Take-Home Pay</div>
                                            <div className='fs-2x fw-bolder text-white' style={{ letterSpacing: '-0.02em' }}>
                                                <NumberTicker value={finalSalary} prefix='₹' suffix=' /-' />
                                            </div>
                                            <div className='text-white-50 fs-8 mt-1'>
                                                (₹{oneDaySalary} per day)
                                            </div>
                                        </div>

                                        <button
                                            type='button'
                                            className='gz-net-corner-btn'
                                            title='Expand details'
                                            onClick={() => setActiveTab('salary')}>
                                            <i className='bi bi-arrow-up-right fs-6'></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Bottom 3-Column Bar */}
                                <div className='row g-0 pt-3 mt-4 border-top' style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}>
                                    <div className='col-4 pe-2 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                        <div className='text-white-50 fs-9'>Gross Earnings</div>
                                        <div className='fw-bold fs-7 text-white mt-1'>
                                            <NumberTicker value={grossEarnings} prefix='₹' suffix=' /-' />
                                        </div>
                                    </div>

                                    <div className='col-4 px-2 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                        <div className='text-white-50 fs-9'>Total Deductions</div>
                                        <div className='fw-bold fs-7 text-white mt-1'>
                                            <NumberTicker value={totalDeductions} prefix='₹' suffix=' /-' />
                                        </div>
                                    </div>

                                    <div className='col-4 ps-2'>
                                        <div className='text-white-50 fs-9'>Approved Expenses</div>
                                        <div className='fw-bold fs-7 text-white mt-1'>
                                            <NumberTicker value={approvedExpensesTotal} prefix='₹' suffix=' /-' />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column: Attendance Donut Ring */}
                        <div className='col-12 col-md-6 col-lg-3 d-flex'>
                            <div className='gz-attendance-card w-100'>
                                <div className='d-flex align-items-center justify-content-between mb-3'>
                                    <h3 className='fw-bold fs-5 text-gray-900 mb-0'>Attendance</h3>
                                    <button
                                        type='button'
                                        onClick={() => setActiveTab('attendance')}
                                        className='btn btn-link p-0 text-muted fs-8 text-decoration-none'>
                                        View Details &rarr;
                                    </button>
                                </div>

                                {/* Radial Donut + Legend */}
                                <div className='d-flex align-items-center justify-content-between gap-3 my-auto py-2'>
                                    {/* Donut Ring */}
                                    <div className='position-relative d-flex align-items-center justify-content-center' style={{ width: '110px', height: '110px' }}>
                                        <svg width='110' height='110' viewBox='0 0 110 110'>
                                            <circle cx='55' cy='55' r='46' fill='none' stroke='#E2E8F0' strokeWidth='10' />
                                            <circle
                                                cx='55'
                                                cy='55'
                                                r='46'
                                                fill='none'
                                                stroke='#10B981'
                                                strokeWidth='10'
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap='round'
                                                transform='rotate(-90 55 55)'
                                                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                            />
                                        </svg>
                                        <div className='position-absolute text-center'>
                                            <div className='fs-5 fw-bolder text-gray-900 lh-1'>
                                                <NumberTicker value={presentCount} /> / <NumberTicker value={totalAttendanceLogs || 26} />
                                            </div>
                                            <span className='text-muted fs-9'>Working Days</span>
                                        </div>
                                    </div>

                                    {/* Legend Dots */}
                                    <div className='d-flex flex-column gap-2 fs-8'>
                                        <div className='d-flex align-items-center gap-2'>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                                            <span className='text-gray-700'>Present</span>
                                            <strong className='ms-auto text-gray-900 ps-2'>
                                                <NumberTicker value={presentCount} /> days
                                            </strong>
                                        </div>

                                        <div className='d-flex align-items-center gap-2'>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }}></span>
                                            <span className='text-gray-700'>Half-day</span>
                                            <strong className='ms-auto text-gray-900 ps-2'>
                                                <NumberTicker value={halfDays} /> days
                                            </strong>
                                        </div>

                                        <div className='d-flex align-items-center gap-2'>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
                                            <span className='text-gray-700'>Absent</span>
                                            <strong className='ms-auto text-gray-900 ps-2'>
                                                <NumberTicker value={absentDays} /> days
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Latest Activity */}
                        <div className='col-12 col-md-6 col-lg-4 d-flex'>
                            <div className='gz-exact-card w-100'>
                                <div className='d-flex align-items-center justify-content-between mb-3'>
                                    <h3 className='fw-bold fs-5 text-gray-900 mb-0'>Latest Activity</h3>
                                    <button
                                        type='button'
                                        onClick={() => setActiveTab('attendance')}
                                        className='btn btn-link p-0 text-muted fs-8 text-decoration-none'>
                                        View All &rarr;
                                    </button>
                                </div>

                                {/* 4 Activity Line Items */}
                                <div className='d-flex flex-column gap-3'>
                                    {/* Item 1 */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#EFF6FF', color: '#2563EB' }}>
                                                <i className='bi bi-file-earmark-text fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>Payslip for October 2026 is ready</div>
                                                <div className='text-muted fs-9'>You can now view your payslip</div>
                                            </div>
                                        </div>
                                        <span className='text-muted fs-9'>2h ago</span>
                                    </div>

                                    {/* Item 2 */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#ECFDF5', color: '#10B981' }}>
                                                <i className='bi bi-calendar-check fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>Attendance updated</div>
                                                <div className='text-muted fs-9'>26 working days this month</div>
                                            </div>
                                        </div>
                                        <span className='text-muted fs-9'>1d ago</span>
                                    </div>

                                    {/* Item 3 */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#FFFBEB', color: '#F59E0B' }}>
                                                <i className='bi bi-receipt fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>Expense claim approved</div>
                                                <div className='text-muted fs-9'>
                                                    <NumberTicker value={approvedExpensesCount} /> claims
                                                </div>
                                            </div>
                                        </div>
                                        <span className='text-muted fs-9'>2d ago</span>
                                    </div>

                                    {/* Item 4 */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#F1F5F9', color: '#64748B' }}>
                                                <i className='bi bi-person fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>Profile details updated</div>
                                                <div className='text-muted fs-9'>Contact information</div>
                                            </div>
                                        </div>
                                        <span className='text-muted fs-9'>1w ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. BOTTOM ROW (3-COLUMN CARDS) */}
                    <div className='row g-4 mb-4 align-items-stretch'>
                        {/* Left: Salary Breakdown */}
                        <div className='col-12 col-lg-4 d-flex'>
                            <div className='gz-exact-card w-100'>
                                <div>
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <h3 className='fw-bold fs-5 text-gray-900 mb-0'>Salary Breakdown</h3>
                                        <button
                                            type='button'
                                            onClick={() => setActiveTab('salary')}
                                            className='btn btn-link p-0 text-muted fs-8 text-decoration-none'>
                                            View Details &rarr;
                                        </button>
                                    </div>

                                    {/* Line Items */}
                                    <div className='d-flex flex-column gap-3'>
                                        {/* Base Pay */}
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '34px', height: '34px', background: '#EFF6FF', color: '#2563EB' }}>
                                                    <i className='bi bi-safe fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fs-8 fw-bold text-gray-900'>Base Monthly Pay</div>
                                                    <div className='text-muted fs-9'>Fixed monthly baseline</div>
                                                </div>
                                            </div>
                                            <span className='fs-8 fw-bold text-gray-900'>
                                                <NumberTicker value={baseSalary} prefix='₹' suffix=' /-' />
                                            </span>
                                        </div>

                                        {/* Task Rating Bonus */}
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '34px', height: '34px', background: '#FFFBEB', color: '#F59E0B' }}>
                                                    <i className='bi bi-star fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fs-8 fw-bold text-gray-900'>Task Rating Bonus</div>
                                                    <div className='text-muted fs-9'>Score: {employeeData?.task_rating?.rating || 0}% rating</div>
                                                </div>
                                            </div>
                                            <span className='fs-8 fw-bold text-gray-900'>
                                                <NumberTicker
                                                    value={taskRatingSalary}
                                                    prefix={taskRatingType === 'plus' ? '+ ₹' : '₹'}
                                                    suffix=' /-'
                                                />
                                            </span>
                                        </div>

                                        {/* Approved Claims */}
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '34px', height: '34px', background: '#ECFDF5', color: '#10B981' }}>
                                                    <i className='bi bi-receipt fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fs-8 fw-bold text-gray-900 d-flex align-items-center gap-1'>
                                                        Approved Expense Claims
                                                        <span className='badge bg-light text-gray-700 border px-1 py-0 fs-9'>
                                                            <NumberTicker value={approvedExpensesCount} /> Items
                                                        </span>
                                                    </div>
                                                    <div className='text-muted fs-9'>Out-of-pocket operational reimbursements</div>
                                                </div>
                                            </div>
                                            <span className='fs-8 fw-bold text-success'>
                                                <NumberTicker value={approvedExpensesTotal} prefix='+ ₹' suffix=' /-' />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Total */}
                                <div className='d-flex align-items-center justify-content-between pt-3 mt-3 border-top'>
                                    <span className='fw-bold fs-7 text-gray-900'>Gross Total Earnings</span>
                                    <span className='fw-bold fs-6 text-gray-900'>
                                        <NumberTicker value={grossEarnings} prefix='₹' suffix=' /-' />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Middle: Deductions & Withholdings */}
                        <div className='col-12 col-lg-4 d-flex'>
                            <div className='gz-exact-card w-100'>
                                <div>
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <h3 className='fw-bold fs-5 text-gray-900 mb-0'>Deductions & Withholdings</h3>
                                        <button
                                            type='button'
                                            onClick={() => setActiveTab('salary')}
                                            className='btn btn-link p-0 text-muted fs-8 text-decoration-none'>
                                            View Details &rarr;
                                        </button>
                                    </div>

                                    {/* Line Items */}
                                    <div className='d-flex flex-column gap-3'>
                                        {/* Absent Days */}
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '34px', height: '34px', background: '#EFF6FF', color: '#2563EB' }}>
                                                    <i className='bi bi-person-x fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fs-8 fw-bold text-gray-900 d-flex align-items-center gap-1'>
                                                        Absent Days Deductions
                                                        <span className='badge bg-light text-gray-700 border px-1 py-0 fs-9'>
                                                            <NumberTicker value={absentDays} /> Days
                                                        </span>
                                                    </div>
                                                    <div className='text-muted fs-9'>Daily rate deductions based on attendance</div>
                                                </div>
                                            </div>
                                            <span className='fs-8 fw-bold text-danger'>
                                                <NumberTicker value={absentSalary} prefix='- ₹' suffix=' /-' />
                                            </span>
                                        </div>

                                        {/* Half Day */}
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '34px', height: '34px', background: '#FFFBEB', color: '#F59E0B' }}>
                                                    <i className='bi bi-hourglass-split fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fs-8 fw-bold text-gray-900 d-flex align-items-center gap-1'>
                                                        Half-Day Deductions
                                                        <span className='badge bg-light text-gray-700 border px-1 py-0 fs-9'>
                                                            <NumberTicker value={halfDays} /> Half
                                                        </span>
                                                    </div>
                                                    <div className='text-muted fs-9'>Half wage deduction per occurrence</div>
                                                </div>
                                            </div>
                                            <span className='fs-8 fw-bold text-danger'>
                                                <NumberTicker value={halfDaySalary} prefix='- ₹' suffix=' /-' />
                                            </span>
                                        </div>

                                        {/* 10% Retention */}
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '34px', height: '34px', background: '#FFF1F2', color: '#F43F5E' }}>
                                                    <i className='bi bi-shield-lock fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fs-8 fw-bold text-gray-900 d-flex align-items-center gap-1'>
                                                        10% Salary Retention
                                                        <span className='badge bg-light text-gray-700 border px-1 py-0 fs-9'>Policy Hold</span>
                                                    </div>
                                                    <div className='text-muted fs-9'>Standard security/retention hold</div>
                                                </div>
                                            </div>
                                            <span className='fs-8 fw-bold text-danger'>
                                                <NumberTicker value={tenPercentHold} prefix='- ₹' suffix=' /-' />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Total */}
                                <div className='d-flex align-items-center justify-content-between pt-3 mt-3 border-top'>
                                    <span className='fw-bold fs-7 text-gray-900'>Total Deductions</span>
                                    <span className='fw-bold fs-6 text-danger'>
                                        <NumberTicker value={totalDeductions} prefix='- ₹' suffix=' /-' />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Recent Payroll Periods */}
                        <div className='col-12 col-lg-4 d-flex'>
                            <div className='gz-exact-card w-100'>
                                <div>
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <h3 className='fw-bold fs-5 text-gray-900 mb-0'>Recent Payroll Periods</h3>
                                        <button
                                            type='button'
                                            onClick={() => setActiveTab('payroll')}
                                            className='btn btn-link p-0 text-muted fs-8 text-decoration-none'>
                                            View All &rarr;
                                        </button>
                                    </div>

                                    {/* 4 Periods List */}
                                    <div className='d-flex flex-column gap-3'>
                                        {/* October 2026 */}
                                        <div className='d-flex align-items-center justify-content-between p-2 rounded-2 hover-bg-light' style={{ cursor: 'pointer' }}>
                                            <div className='d-flex align-items-center gap-2'>
                                                <i className='bi bi-calendar-event text-gray-500 fs-7'></i>
                                                <span className='fs-8 fw-bold text-gray-900'>October 2026</span>
                                            </div>
                                            <div className='d-flex align-items-center gap-2'>
                                                <span className='fs-8 fw-bold text-gray-900'>
                                                    <NumberTicker value={finalSalary} prefix='₹' suffix=' /-' />
                                                </span>
                                                <span className='badge bg-light-success text-success px-2 py-0 fs-9 fw-semibold'>Current</span>
                                                <i className='bi bi-chevron-right fs-9 text-gray-400'></i>
                                            </div>
                                        </div>

                                        {/* September 2026 */}
                                        <div className='d-flex align-items-center justify-content-between p-2 rounded-2 hover-bg-light' style={{ cursor: 'pointer' }}>
                                            <div className='d-flex align-items-center gap-2'>
                                                <i className='bi bi-calendar-event text-gray-500 fs-7'></i>
                                                <span className='fs-8 fw-bold text-gray-900'>September 2026</span>
                                            </div>
                                            <div className='d-flex align-items-center gap-2'>
                                                <span className='fs-8 fw-bold text-gray-900'>
                                                    <NumberTicker value={finalSalary} prefix='₹' suffix=' /-' />
                                                </span>
                                                <span className='badge bg-light-primary text-primary px-2 py-0 fs-9 fw-semibold'>Paid</span>
                                                <i className='bi bi-chevron-right fs-9 text-gray-400'></i>
                                            </div>
                                        </div>

                                        {/* August 2026 */}
                                        <div className='d-flex align-items-center justify-content-between p-2 rounded-2 hover-bg-light' style={{ cursor: 'pointer' }}>
                                            <div className='d-flex align-items-center gap-2'>
                                                <i className='bi bi-calendar-event text-gray-500 fs-7'></i>
                                                <span className='fs-8 fw-bold text-gray-900'>August 2026</span>
                                            </div>
                                            <div className='d-flex align-items-center gap-2'>
                                                <span className='fs-8 fw-bold text-gray-900'>
                                                    <NumberTicker value={finalSalary} prefix='₹' suffix=' /-' />
                                                </span>
                                                <span className='badge bg-light-primary text-primary px-2 py-0 fs-9 fw-semibold'>Paid</span>
                                                <i className='bi bi-chevron-right fs-9 text-gray-400'></i>
                                            </div>
                                        </div>

                                        {/* July 2026 */}
                                        <div className='d-flex align-items-center justify-content-between p-2 rounded-2 hover-bg-light' style={{ cursor: 'pointer' }}>
                                            <div className='d-flex align-items-center gap-2'>
                                                <i className='bi bi-calendar-event text-gray-500 fs-7'></i>
                                                <span className='fs-8 fw-bold text-gray-900'>July 2026</span>
                                            </div>
                                            <div className='d-flex align-items-center gap-2'>
                                                <span className='fs-8 fw-bold text-gray-900'>
                                                    <NumberTicker value={finalSalary} prefix='₹' suffix=' /-' />
                                                </span>
                                                <span className='badge bg-light-primary text-primary px-2 py-0 fs-9 fw-semibold'>Paid</span>
                                                <i className='bi bi-chevron-right fs-9 text-gray-400'></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. BOTTOM MOTIVATIONAL BANNER */}
                    <div className='gz-bottom-quote-card'>
                        <div className='gz-quote-img-box'>
                            <span>Small<br />steps<br />big results.</span>
                        </div>

                        <div className='gz-quote-text-box'>
                            <h4>“Keep showing up. Consistency pays off.”</h4>
                            <p>Your work, attendance and contributions help us grow together.</p>
                        </div>

                        <div className='gz-quote-action-box'>
                            <button
                                type='button'
                                onClick={() => setActiveTab('details')}
                                className='btn btn-sm btn-light border p-2 rounded-circle'
                                title='View Profile'>
                                <i className='bi bi-arrow-up-right fs-6'></i>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Report