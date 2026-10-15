import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetSalary } from '../../../Functions/FGGroup/Attendance'
import { GetTask } from '../../../Functions/FGGroup/TaskManagement'
import { GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'
import { getProfile } from '../../../Functions/FGGroup'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import NumberTicker from '../../../components/NumberTicker'

type QuerySortOptions = 'asc' | 'desc'
type ReportViewTab = 'payroll' | 'attendance' | 'expenses' | 'tasks' | 'salary' | 'details'

const Report: React.FC = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)

    const getStoredEmployee = () => {
        try {
            const raw = localStorage.getItem('fg_group_user_info') || localStorage.getItem('fg_group_info') || localStorage.getItem('auth_fg_group')
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
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false)
    const optionsDropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(event.target as Node)) {
                setShowOptionsDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Ensure real employee profile is fetched and loaded
    useEffect(() => {
        const loadEmployeeProfile = async () => {
            try {
                if (queryEmployeeId) {
                    const empRes: any = await GetEmployees({ id: queryEmployeeId })
                    if (empRes?.data) {
                        const targetEmp = Array.isArray(empRes.data) ? empRes.data[0] : empRes.data
                        if (targetEmp) {
                            setEmployee(targetEmp)
                            return
                        }
                    }
                }
                const res: any = await getProfile()
                if (res?.data) {
                    localStorage.setItem('fg_group_user_info', JSON.stringify(res.data))
                    setEmployee((prev: any) => ({ ...prev, ...res.data }))
                }
            } catch (err) {
                console.error('Error fetching employee profile:', err)
            }
        }
        loadEmployeeProfile()
    }, [queryEmployeeId])

    const copyToClipboard = (text: string, fieldName: string) => {
        if (!text || text === '—') return
        navigator.clipboard?.writeText(text)
        setCopiedField(fieldName)
        toast.success(`Copied to clipboard`)
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
                employee_id: employee_id,
            })

            const filteredData = response.data
            const data = filteredData?.filter(
                (salary: any) => salary.employee_id == employee_id || salary._id == employee_id
            )

            if (data && data.length > 0) {
                setEmployeeData(data[0])

                const joiningDate = data[0]?.joining_date || employee?.joining_date
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

                setJoiningTime(joiningDuration || null)
                setSalaryData(data[0].attendance || [])
            } else {
                setSalaryData([])
            }
        } catch (error) {
            console.error('Error fetching salary data:', error)
        }
        setLoading(false)
    }

    const handleExportStatement = () => {
        try {
            const attendanceRows = (salaryData || []).map((s: any, idx: number) => ({
                '#': idx + 1,
                Date: DayJS(s.date).format('DD/MM/YYYY'),
                Status: s.status || 'Present',
                Type: s.halfDay ? 'Half Day' : 'Full Day',
                'Work Hours': s.WorkTime || '—',
                'Over Time': s.OverTime || '00:00',
            }))

            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.json_to_sheet(
                attendanceRows.length > 0 ? attendanceRows : [{ Note: 'No attendance records logged for this period' }]
            )
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records')
            XLSX.writeFile(workbook, `Employee_Report_${employeeData?.employee_code || employee?.employee_code || 'Report'}_${DayJS().format('YYYY-MM-DD')}.xlsx`)
            toast.success('Statement downloaded successfully!')
        } catch (err) {
            console.error('Export error:', err)
            toast.error('Failed to export statement')
        }
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
    const baseSalary = Number(employeeData?.total_salary || employee?.total_salary || employee?.salary || 0)
    const oneDaySalary = baseSalary > 0 ? Math.round(baseSalary / 26) : 0
    const finalSalary = Number(employeeData?.final_salary || (baseSalary > 0 ? baseSalary : 0))
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

    const totalAttendanceLogs = salaryData?.length || 0
    const presentCount = salaryData?.filter((s: any) => s.status === 'P' || s.status === 'Present').length || 0
    const attendancePercentage = totalAttendanceLogs > 0 ? (presentCount / totalAttendanceLogs) * 100 : 0
    const circumference = 2 * Math.PI * 46
    const strokeDashoffset = circumference - (attendancePercentage / 100) * circumference

    const fullName = employeeData?.full_name || employee?.full_name || employee?.name || 'Employee'
    const employeeCode = employeeData?.employee_code || employee?.employee_code || 'EMP-—'
    const email = employeeData?.email || employee?.email || '—'
    const mobile = employeeData?.mobile || employee?.phone || employee?.mobile || '—'
    const firstInitial = fullName && fullName !== 'Employee' ? fullName.charAt(0).toUpperCase() : 'E'

    return (
        <>
            <PageTitle breadcrumbs={[]}>Report</PageTitle>

            {/* =========================================================================
                1. TOP EXECUTIVE PROFILE CARD
               ========================================================================= */}
            <div className='gz-report-profile-card'>
                {/* Top Row: Left Avatar & Stats, Right Buttons */}
                <div className='d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-4'>
                    {/* Left Identity: Avatar + Details & Stats */}
                    <div className='d-flex align-items-center gap-3 gap-md-4 flex-wrap'>
                        {/* Circular Avatar */}
                        <div className='gz-avatar-hero'>
                            {employeeData?.photo || employee?.photo ? (
                                <img
                                    src={`https://files.fggroup.in/${employeeData?.photo || employee?.photo}`}
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
                                        <NumberTicker value={totalAttendanceLogs} />
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
                                        <NumberTicker text={joiningTime || '—'} />
                                    </div>
                                    <div className='gz-stat-label'>At GOMZI</div>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className='d-flex align-items-center gap-3 text-muted fs-8 flex-wrap mt-2'>
                                <span className='d-inline-flex align-items-center gap-1 text-gray-700'>
                                    <i className='bi bi-person-badge text-gray-500'></i> Employee
                                </span>
                                <span>|</span>
                                <span className='text-gray-700 font-monospace'>{employeeCode}</span>
                                <span>|</span>
                                <span className='d-inline-flex align-items-center gap-1 text-gray-700'>
                                    Joined {employeeData?.joining_date || employee?.joining_date ? DayJS(employeeData?.joining_date || employee?.joining_date).format('DD-MM-YYYY') : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Buttons with 3-Dots Dropdown */}
                    <div className='d-flex flex-column align-items-lg-end gap-2'>
                        <div className='d-flex align-items-center gap-2 flex-wrap'>
                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='gz-report-btn-payslip'>
                                <i className='bi bi-file-earmark-text fs-7'></i>
                                <span>View Payslip</span>
                            </button>

                            <button
                                type='button'
                                onClick={handleExportStatement}
                                className='gz-report-btn-download'>
                                <i className='bi bi-download fs-7'></i>
                                <span>Download Statement</span>
                            </button>

                            <div className='position-relative' ref={optionsDropdownRef}>
                                <button
                                    type='button'
                                    onClick={() => setShowOptionsDropdown((prev) => !prev)}
                                    className='gz-report-btn-dots'
                                    title='More Options'>
                                    <i className='bi bi-three-dots-vertical fs-6'></i>
                                </button>

                                {showOptionsDropdown && (
                                    <div
                                        className='dropdown-menu show shadow-lg border-0 py-2'
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '6px',
                                            minWidth: '220px',
                                            borderRadius: '12px',
                                            zIndex: 1050,
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                                        }}>
                                        <button
                                            type='button'
                                            className='dropdown-item d-flex align-items-center gap-2 py-2 px-4 fs-7 text-gray-800'
                                            onClick={() => {
                                                setShowOptionsDropdown(false)
                                                fetchSalaryData()
                                                fetchExpenseData()
                                                fetchAssignTaskData()
                                                toast.success('Report data refreshed successfully!')
                                            }}>
                                            <i className='bi bi-arrow-clockwise text-primary fs-6'></i>
                                            <span>Refresh Report Data</span>
                                        </button>

                                        <button
                                            type='button'
                                            className='dropdown-item d-flex align-items-center gap-2 py-2 px-4 fs-7 text-gray-800'
                                            onClick={() => {
                                                setShowOptionsDropdown(false)
                                                copyToClipboard(employeeCode, 'code')
                                            }}>
                                            <i className='bi bi-clipboard text-gray-600 fs-6'></i>
                                            <span>Copy Employee Code</span>
                                        </button>

                                        <button
                                            type='button'
                                            className='dropdown-item d-flex align-items-center gap-2 py-2 px-4 fs-7 text-gray-800'
                                            onClick={() => {
                                                setShowOptionsDropdown(false)
                                                if (typeof window !== 'undefined') {
                                                    navigator.clipboard.writeText(window.location.href)
                                                    toast.success('Report URL copied to clipboard!')
                                                }
                                            }}>
                                            <i className='bi bi-link-45deg text-gray-600 fs-6'></i>
                                            <span>Copy Report Link</span>
                                        </button>

                                        <div className='dropdown-divider my-1'></div>

                                        <button
                                            type='button'
                                            className='dropdown-item d-flex align-items-center gap-2 py-2 px-4 fs-7 text-gray-800'
                                            onClick={() => {
                                                setShowOptionsDropdown(false)
                                                setActiveTab('attendance')
                                            }}>
                                            <i className='bi bi-calendar-check text-success fs-6'></i>
                                            <span>View Attendance Logs</span>
                                        </button>

                                        <button
                                            type='button'
                                            className='dropdown-item d-flex align-items-center gap-2 py-2 px-4 fs-7 text-gray-800'
                                            onClick={() => {
                                                setShowOptionsDropdown(false)
                                                setActiveTab('details')
                                            }}>
                                            <i className='bi bi-person-vcard text-info fs-6'></i>
                                            <span>View Personnel Details</span>
                                        </button>
                                    </div>
                                )}
                            </div>
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
                        <div style={{ width: '240px' }}>
                            <SearchFilter
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                placeholder='Search date or status...'
                            />
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
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Approved Expense Claims</h3>
                            <span className='text-muted fs-8'>Reimbursed out-of-pocket operational claims</span>
                        </div>
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

            {/* My Personnel Details (Modern Executive Redesign) */}
            {activeTab === 'details' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div className='d-flex align-items-center gap-3'>
                            <div
                                className='rounded-3 d-flex align-items-center justify-content-center'
                                style={{ width: '42px', height: '42px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                <i className='bi bi-person-vcard fs-3 text-primary'></i>
                            </div>
                            <div>
                                <h3 className='fw-bold fs-4 text-gray-900 mb-0'>My Personnel Details</h3>
                                <span className='text-muted fs-8'>Registered employment profile, official credentials, and contractual compensation rates</span>
                            </div>
                        </div>
                        <div className='d-flex align-items-center gap-2'>
                            <span className='badge bg-light-success text-success fw-bold px-3 py-2 fs-8' style={{ borderRadius: '6px' }}>
                                <i className='bi bi-patch-check-fill me-1'></i> Active Employment
                            </span>
                        </div>
                    </div>

                    <div className='card-body p-6'>
                        {/* Section 1: Contact & Identification */}
                        <div className='mb-6'>
                            <div className='d-flex align-items-center gap-2 mb-4'>
                                <span className='text-uppercase fs-8 fw-bold text-muted letter-spacing-1'>Contact & Identification</span>
                                <div className='flex-grow-1 border-bottom' style={{ borderColor: '#f1f5f9' }}></div>
                            </div>

                            <div className='row g-4'>
                                {/* Employee Code */}
                                <div className='col-12 col-md-6 col-lg-3'>
                                    <div
                                        className='p-4 rounded-3 h-100 d-flex flex-column justify-content-between'
                                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div className='d-flex align-items-center justify-content-between mb-2'>
                                            <span className='text-muted fs-8 fw-semibold text-uppercase'>Employee Code</span>
                                            <button
                                                type='button'
                                                onClick={() => copyToClipboard(employeeCode, 'code')}
                                                className='btn btn-icon btn-xs btn-light'
                                                style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                                                title='Copy code'>
                                                <i className={`bi ${copiedField === 'code' ? 'bi-check2 text-success' : 'bi-clipboard text-muted'} fs-8`}></i>
                                            </button>
                                        </div>
                                        <div className='fs-5 fw-bold text-gray-900 font-monospace'>{employeeCode}</div>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className='col-12 col-md-6 col-lg-3'>
                                    <div
                                        className='p-4 rounded-3 h-100 d-flex flex-column justify-content-between'
                                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div className='d-flex align-items-center justify-content-between mb-2'>
                                            <span className='text-muted fs-8 fw-semibold text-uppercase'>Full Name</span>
                                            <i className='bi bi-person text-gray-400 fs-7'></i>
                                        </div>
                                        <div className='fs-5 fw-bold text-gray-900'>{fullName}</div>
                                    </div>
                                </div>

                                {/* Email Address */}
                                <div className='col-12 col-md-6 col-lg-3'>
                                    <div
                                        className='p-4 rounded-3 h-100 d-flex flex-column justify-content-between'
                                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div className='d-flex align-items-center justify-content-between mb-2'>
                                            <span className='text-muted fs-8 fw-semibold text-uppercase'>Email Address</span>
                                            <button
                                                type='button'
                                                onClick={() => copyToClipboard(email, 'email')}
                                                className='btn btn-icon btn-xs btn-light'
                                                style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                                                title='Copy email'>
                                                <i className={`bi ${copiedField === 'email' ? 'bi-check2 text-success' : 'bi-clipboard text-muted'} fs-8`}></i>
                                            </button>
                                        </div>
                                        <div className='fs-6 fw-bold text-gray-900 text-truncate' title={email}>
                                            {email}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Phone */}
                                <div className='col-12 col-md-6 col-lg-3'>
                                    <div
                                        className='p-4 rounded-3 h-100 d-flex flex-column justify-content-between'
                                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div className='d-flex align-items-center justify-content-between mb-2'>
                                            <span className='text-muted fs-8 fw-semibold text-uppercase'>Mobile Phone</span>
                                            <button
                                                type='button'
                                                onClick={() => copyToClipboard(mobile, 'mobile')}
                                                className='btn btn-icon btn-xs btn-light'
                                                style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                                                title='Copy mobile'>
                                                <i className={`bi ${copiedField === 'mobile' ? 'bi-check2 text-success' : 'bi-clipboard text-muted'} fs-8`}></i>
                                            </button>
                                        </div>
                                        <div className='fs-5 fw-bold text-gray-900'>{mobile}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Compensation Structure */}
                        <div>
                            <div className='d-flex align-items-center gap-2 mb-4'>
                                <span className='text-uppercase fs-8 fw-bold text-muted letter-spacing-1'>Compensation Structure</span>
                                <div className='flex-grow-1 border-bottom' style={{ borderColor: '#f1f5f9' }}></div>
                            </div>

                            <div className='row g-4'>
                                {/* Monthly Base Salary */}
                                <div className='col-12 col-md-6'>
                                    <div
                                        className='p-5 rounded-3 d-flex align-items-center justify-content-between'
                                        style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
                                        <div>
                                            <span className='text-primary fw-bold fs-8 text-uppercase letter-spacing-1'>Monthly Base Salary</span>
                                            <div className='fs-2hx fw-boldest text-gray-900 mt-1'>
                                                ₹{baseSalary.toLocaleString()} /-
                                            </div>
                                            <span className='text-muted fs-8 mt-1 d-block'>Fixed contractual gross earnings per billing month</span>
                                        </div>
                                        <div
                                            className='rounded-circle d-flex align-items-center justify-content-center'
                                            style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', color: '#2563eb', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)' }}>
                                            <i className='bi bi-cash-stack fs-4'></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Baseline Rate */}
                                <div className='col-12 col-md-6'>
                                    <div
                                        className='p-5 rounded-3 d-flex align-items-center justify-content-between'
                                        style={{ background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                        <div>
                                            <span className='text-success fw-bold fs-8 text-uppercase letter-spacing-1'>Daily Baseline Rate</span>
                                            <div className='fs-2hx fw-boldest text-gray-900 mt-1'>
                                                ₹{oneDaySalary.toLocaleString()} <span className='fs-6 fw-normal text-muted'>/ day</span>
                                            </div>
                                            <span className='text-muted fs-8 mt-1 d-block'>Computed at Base Pay ÷ 26 standard working days</span>
                                        </div>
                                        <div
                                            className='rounded-circle d-flex align-items-center justify-content-center'
                                            style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', color: '#16a34a', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.15)' }}>
                                            <i className='bi bi-calendar-check fs-4'></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 border-bottom'>
                        <div>
                            <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Assigned Tasks & Deliverables</h3>
                            <span className='text-muted fs-8'>Operational deliverables, deadlines, and completion ratings affecting monthly performance bonus</span>
                        </div>
                        <div style={{ width: '260px' }}>
                            <SearchFilter
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                placeholder='Search tasks...'
                            />
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
                <div className='card mb-6 shadow-sm border-0' style={{ borderRadius: '16px', border: '1px solid var(--gz-border)' }}>
                    {/* Header */}
                    <div className='d-flex flex-wrap align-items-center justify-content-between p-5 p-lg-6 border-bottom gap-3'>
                        <div className='d-flex align-items-center gap-3'>
                            <div
                                className='d-flex align-items-center justify-content-center rounded-3'
                                style={{ width: '44px', height: '44px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB' }}>
                                <i className='bi bi-calculator fs-4'></i>
                            </div>
                            <div>
                                <h3 className='fw-bold fs-4 text-gray-900 mb-1'>Detailed Salary Breakdown & Statement</h3>
                                <span className='text-muted fs-8'>Itemized compensation ledger: base rates, daily baseline formula, attendance cutting, retention hold, and net take-home pay</span>
                            </div>
                        </div>

                        <div className='d-flex align-items-center gap-2 flex-wrap'>
                            <button
                                type='button'
                                onClick={() => window.print()}
                                className='gz-report-btn-payslip'>
                                <i className='bi bi-printer fs-7'></i>
                                <span>Print Payslip</span>
                            </button>

                            <button
                                type='button'
                                onClick={handleExportStatement}
                                className='gz-report-btn-download'>
                                <i className='bi bi-download fs-7'></i>
                                <span>Export Excel</span>
                            </button>

                            <button
                                type='button'
                                onClick={() => setActiveTab('payroll')}
                                className='btn btn-sm btn-light border text-gray-700 fw-semibold px-3'
                                style={{ borderRadius: '10px' }}>
                                <i className='bi bi-arrow-left me-1'></i> Overview
                            </button>
                        </div>
                    </div>

                    <div className='card-body p-5 p-lg-6'>
                        {/* 3 Modern Summary Stat Cards */}
                        <div className='row g-4 mb-6'>
                            {/* 1. Baseline Gross */}
                            <div className='col-12 col-md-4'>
                                <div className='gz-salary-stat-card gz-salary-stat-earnings'>
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <div
                                            className='d-flex align-items-center justify-content-center rounded-3'
                                            style={{ width: '38px', height: '38px', background: '#DCFCE7', color: '#16A34A' }}>
                                            <i className='bi bi-wallet2 fs-5'></i>
                                        </div>
                                        <span className='badge bg-light-success text-success fw-bold px-2 py-1 fs-9'>
                                            Credited
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-muted fs-8 fw-bold d-block text-uppercase' style={{ letterSpacing: '0.06em' }}>
                                            Baseline Gross Earnings
                                        </span>
                                        <div className='fs-2x fw-bolder text-gray-900 mt-1' style={{ letterSpacing: '-0.02em' }}>
                                            <NumberTicker value={grossEarnings} prefix='₹' suffix=' /-' />
                                        </div>
                                        <div className='d-flex align-items-center gap-1 text-muted fs-8 mt-2 flex-wrap'>
                                            <span className='badge bg-white text-gray-700 border px-2 py-1 fs-9'>
                                                Base: ₹{baseSalary.toLocaleString('en-IN')}
                                            </span>
                                            {grossEarnings - baseSalary > 0 && (
                                                <span className='badge bg-white text-success border px-2 py-1 fs-9'>
                                                    +₹{(grossEarnings - baseSalary).toLocaleString('en-IN')} Extra
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Total Deductions */}
                            <div className='col-12 col-md-4'>
                                <div className='gz-salary-stat-card gz-salary-stat-deductions'>
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <div
                                            className='d-flex align-items-center justify-content-center rounded-3'
                                            style={{ width: '38px', height: '38px', background: '#FEE2E2', color: '#DC2626' }}>
                                            <i className='bi bi-dash-circle fs-5'></i>
                                        </div>
                                        <span className='badge bg-light-danger text-danger fw-bold px-2 py-1 fs-9'>
                                            Debited
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-muted fs-8 fw-bold d-block text-uppercase' style={{ letterSpacing: '0.06em' }}>
                                            Total Deductions & Retentions
                                        </span>
                                        <div className='fs-2x fw-bolder text-danger mt-1' style={{ letterSpacing: '-0.02em' }}>
                                            <NumberTicker value={totalDeductions} prefix='- ₹' suffix=' /-' />
                                        </div>
                                        <div className='d-flex align-items-center gap-1 text-muted fs-8 mt-2 flex-wrap'>
                                            <span className='badge bg-white text-danger border px-2 py-1 fs-9'>
                                                Absent: {absentDays}d
                                            </span>
                                            <span className='badge bg-white text-warning border px-2 py-1 fs-9'>
                                                Half: {halfDays}d
                                            </span>
                                            <span className='badge bg-white text-gray-700 border px-2 py-1 fs-9'>
                                                10% Security Hold
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Net Payout Hero */}
                            <div className='col-12 col-md-4'>
                                <div className='gz-salary-stat-card gz-salary-stat-net'>
                                    <div className='d-flex align-items-center justify-content-between mb-3'>
                                        <div
                                            className='d-flex align-items-center justify-content-center rounded-3'
                                            style={{ width: '38px', height: '38px', background: 'rgba(255, 255, 255, 0.12)', color: '#10B981' }}>
                                            <i className='bi bi-check2-circle fs-5'></i>
                                        </div>
                                        <span className='badge' style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '11px', fontWeight: 600 }}>
                                            Disbursable
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-white-50 fs-8 fw-bold d-block text-uppercase' style={{ letterSpacing: '0.06em' }}>
                                            Net Payout Amount
                                        </span>
                                        <div className='fs-2x fw-bolder text-white mt-1' style={{ letterSpacing: '-0.02em' }}>
                                            <NumberTicker value={finalSalary} prefix='₹' suffix=' /-' />
                                        </div>
                                        <div className='text-white-50 fs-8 mt-2 d-flex align-items-center gap-2'>
                                            <span className='badge' style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
                                                ₹{oneDaySalary} / day
                                            </span>
                                            <span>26-day baseline</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2 Detailed Breakdown Ledgers (Earnings vs Deductions) */}
                        <div className='row g-4'>
                            {/* Left: Earnings Components */}
                            <div className='col-12 col-lg-6'>
                                <div className='gz-salary-ledger-card'>
                                    <div className='d-flex align-items-center justify-content-between p-4 border-bottom bg-light bg-opacity-50'>
                                        <div className='d-flex align-items-center gap-2'>
                                            <div
                                                className='d-flex align-items-center justify-content-center rounded-2'
                                                style={{ width: '32px', height: '32px', background: '#DCFCE7', color: '#16A34A' }}>
                                                <i className='bi bi-plus-lg fs-6 fw-bold'></i>
                                            </div>
                                            <div>
                                                <h4 className='fw-bold fs-6 text-gray-900 mb-0'>Earnings & Reimbursements</h4>
                                                <span className='text-muted fs-9'>Itemized additions to baseline pay</span>
                                            </div>
                                        </div>
                                        <span className='badge bg-light-success text-success fw-bold px-2 py-1 fs-9'>
                                            Total: ₹{grossEarnings.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    <div className='d-flex flex-column'>
                                        {/* Row 1: Base Pay */}
                                        <div className='gz-ledger-row'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='gz-ledger-icon-wrap' style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                                    <i className='bi bi-building fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fw-bold text-gray-900 fs-7'>Base Monthly Pay</div>
                                                    <div className='text-muted fs-8'>Contractual baseline salary rate</div>
                                                </div>
                                            </div>
                                            <div className='text-end'>
                                                <span className='badge bg-light text-gray-700 border px-2 py-1 fs-9 mb-1 d-inline-block'>
                                                    26 Working Days
                                                </span>
                                                <div className='fw-bold text-gray-900 fs-7'>
                                                    ₹{baseSalary.toLocaleString('en-IN')} /-
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Task Rating Bonus */}
                                        <div className='gz-ledger-row'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='gz-ledger-icon-wrap' style={{ background: '#FFFBEB', color: '#D97706' }}>
                                                    <i className='bi bi-award fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fw-bold text-gray-900 fs-7'>Task Performance Bonus</div>
                                                    <div className='text-muted fs-8'>Score: {employeeData?.task_rating?.rating || 0}% performance rating</div>
                                                </div>
                                            </div>
                                            <div className='text-end'>
                                                <span className='badge bg-light-warning text-warning border border-warning border-opacity-25 px-2 py-1 fs-9 mb-1 d-inline-block'>
                                                    Incentive
                                                </span>
                                                <div className='fw-bold text-gray-900 fs-7'>
                                                    {taskRatingType === 'plus' ? `+ ₹${taskRatingSalary.toLocaleString('en-IN')} /-` : '₹0 /-'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 3: Approved Expenses */}
                                        <div className='gz-ledger-row'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='gz-ledger-icon-wrap' style={{ background: '#ECFDF5', color: '#059669' }}>
                                                    <i className='bi bi-receipt fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fw-bold text-gray-900 fs-7'>Approved Expense Reimbursements</div>
                                                    <div className='text-muted fs-8'>{approvedExpensesCount} out-of-pocket operational claims</div>
                                                </div>
                                            </div>
                                            <div className='text-end'>
                                                <span className='badge bg-light-success text-success border border-success border-opacity-25 px-2 py-1 fs-9 mb-1 d-inline-block'>
                                                    {approvedExpensesCount} Items
                                                </span>
                                                <div className='fw-bold text-success fs-7'>
                                                    + ₹{approvedExpensesTotal.toLocaleString('en-IN')} /-
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Gross Total */}
                                    <div className='mt-auto p-4 bg-light d-flex align-items-center justify-content-between border-top'>
                                        <span className='fw-bold fs-7 text-gray-900'>Total Gross Earnings</span>
                                        <span className='fw-bolder fs-6 text-gray-900'>
                                            ₹{grossEarnings.toLocaleString('en-IN')} /-
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Deductions Components */}
                            <div className='col-12 col-lg-6'>
                                <div className='gz-salary-ledger-card'>
                                    <div className='d-flex align-items-center justify-content-between p-4 border-bottom bg-light bg-opacity-50'>
                                        <div className='d-flex align-items-center gap-2'>
                                            <div
                                                className='d-flex align-items-center justify-content-center rounded-2'
                                                style={{ width: '32px', height: '32px', background: '#FEE2E2', color: '#DC2626' }}>
                                                <i className='bi bi-dash-lg fs-6 fw-bold'></i>
                                            </div>
                                            <div>
                                                <h4 className='fw-bold fs-6 text-gray-900 mb-0'>Deductions & Retentions</h4>
                                                <span className='text-muted fs-9'>Itemized policy deductions</span>
                                            </div>
                                        </div>
                                        <span className='badge bg-light-danger text-danger fw-bold px-2 py-1 fs-9'>
                                            Total: -₹{totalDeductions.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    <div className='d-flex flex-column'>
                                        {/* Row 1: Absent Days */}
                                        <div className='gz-ledger-row'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='gz-ledger-icon-wrap' style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                                    <i className='bi bi-person-x fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fw-bold text-gray-900 fs-7'>Absent Days Cut</div>
                                                    <div className='text-muted fs-8'>{absentDays} days × ₹{oneDaySalary} daily rate</div>
                                                </div>
                                            </div>
                                            <div className='text-end'>
                                                <span className='badge bg-light-danger text-danger border border-danger border-opacity-25 px-2 py-1 fs-9 mb-1 d-inline-block'>
                                                    {absentDays} Days
                                                </span>
                                                <div className='fw-bold text-danger fs-7'>
                                                    - ₹{absentSalary.toLocaleString('en-IN')} /-
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Half-Day */}
                                        <div className='gz-ledger-row'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='gz-ledger-icon-wrap' style={{ background: '#FFFBEB', color: '#D97706' }}>
                                                    <i className='bi bi-hourglass-split fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fw-bold text-gray-900 fs-7'>Half-Day Deductions</div>
                                                    <div className='text-muted fs-8'>{halfDays} occurrences × ₹{Math.round(oneDaySalary / 2)} rate</div>
                                                </div>
                                            </div>
                                            <div className='text-end'>
                                                <span className='badge bg-light-warning text-warning border border-warning border-opacity-25 px-2 py-1 fs-9 mb-1 d-inline-block'>
                                                    {halfDays} Half
                                                </span>
                                                <div className='fw-bold text-danger fs-7'>
                                                    - ₹{halfDaySalary.toLocaleString('en-IN')} /-
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 3: 10% Security Hold */}
                                        <div className='gz-ledger-row'>
                                            <div className='d-flex align-items-center gap-3'>
                                                <div className='gz-ledger-icon-wrap' style={{ background: '#FFF1F2', color: '#E11D48' }}>
                                                    <i className='bi bi-shield-lock fs-6'></i>
                                                </div>
                                                <div>
                                                    <div className='fw-bold text-gray-900 fs-7'>10% Security Retention Hold</div>
                                                    <div className='text-muted fs-8'>Company policy standard security deposit</div>
                                                </div>
                                            </div>
                                            <div className='text-end'>
                                                <span className='badge bg-light text-gray-700 border px-2 py-1 fs-9 mb-1 d-inline-block'>
                                                    Policy Hold
                                                </span>
                                                <div className='fw-bold text-danger fs-7'>
                                                    - ₹{tenPercentHold.toLocaleString('en-IN')} /-
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Deductions Total */}
                                    <div className='mt-auto p-4 bg-light d-flex align-items-center justify-content-between border-top'>
                                        <span className='fw-bold fs-7 text-gray-900'>Total Deductions</span>
                                        <span className='fw-bolder fs-6 text-danger'>
                                            - ₹{totalDeductions.toLocaleString('en-IN')} /-
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Formula Footer Ribbon */}
                        <div
                            className='p-4 rounded-3 mt-5 d-flex flex-wrap align-items-center justify-content-between gap-3'
                            style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
                            <div className='d-flex align-items-center gap-3'>
                                <div
                                    className='d-flex align-items-center justify-content-center rounded-circle flex-shrink-0'
                                    style={{ width: '36px', height: '36px', background: '#E2E8F0', color: '#334155' }}>
                                    <i className='bi bi-info-circle fs-6'></i>
                                </div>
                                <div>
                                    <span className='fw-bold text-gray-900 fs-7 d-block'>Net Salary Calculation Formula</span>
                                    <div className='d-flex align-items-center gap-2 flex-wrap text-muted fs-8 mt-1'>
                                        <span className='badge bg-white text-gray-800 border px-2 py-1'>
                                            Gross: ₹{grossEarnings.toLocaleString('en-IN')}
                                        </span>
                                        <span className='text-gray-500 fw-bold'>-</span>
                                        <span className='badge bg-white text-danger border px-2 py-1'>
                                            Deductions: ₹{totalDeductions.toLocaleString('en-IN')}
                                        </span>
                                        <span className='text-gray-500 fw-bold'>=</span>
                                        <span className='badge bg-dark text-white px-2 py-1 fw-bold'>
                                            Net: ₹{finalSalary.toLocaleString('en-IN')} /-
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type='button'
                                className='btn btn-sm text-white px-4 fw-semibold'
                                style={{ background: '#0F172A', borderRadius: '10px' }}
                                onClick={() => setActiveTab('payroll')}>
                                <i className='bi bi-arrow-left me-1'></i> Return to Overview
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
                                            {selectedDateRange && selectedDateRange[0]
                                                ? DayJS(selectedDateRange[0]).format('MMMM YYYY').toUpperCase()
                                                : DayJS().format('MMMM YYYY').toUpperCase()}
                                        </span>
                                        <span className='badge' style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', borderRadius: '4px', fontSize: '11px' }}>
                                            Active Period
                                        </span>
                                    </div>

                                    {/* Title & Amount */}
                                    <div className='d-flex align-items-start justify-content-between mt-2'>
                                        <div>
                                            <div className='text-white-50 fs-7 mb-1'>Net Take-Home Pay</div>
                                            <div className='fs-2x fw-bolder text-white' style={{ letterSpacing: '-0.02em' }}>
                                                <NumberTicker value={finalSalary} suffix=' /-' />
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
                                            <NumberTicker value={grossEarnings} suffix=' /-' />
                                        </div>
                                    </div>

                                    <div className='col-4 px-2 border-end' style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                        <div className='text-white-50 fs-9'>Total Deductions</div>
                                        <div className='fw-bold fs-7 text-white mt-1'>
                                            <NumberTicker value={totalDeductions} suffix=' /-' />
                                        </div>
                                    </div>

                                    <div className='col-4 ps-2'>
                                        <div className='text-white-50 fs-9'>Approved Expenses</div>
                                        <div className='fw-bold fs-7 text-white mt-1'>
                                            <NumberTicker value={approvedExpensesTotal} suffix=' /-' />
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
                                                <NumberTicker value={presentCount} /> / <NumberTicker value={totalAttendanceLogs} />
                                            </div>
                                            <span className='text-muted fs-9'>Logs Count</span>
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
                                        View Logs &rarr;
                                    </button>
                                </div>

                                {/* Dynamic Real Activity Line Items */}
                                <div className='d-flex flex-column gap-3'>
                                    {/* Item 1: Payroll statement status */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#EFF6FF', color: '#2563EB' }}>
                                                <i className='bi bi-file-earmark-text fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>
                                                    {salaryData && salaryData.length > 0 ? 'Monthly Payslip Synchronized' : 'Payroll Statement Ready'}
                                                </div>
                                                <div className='text-muted fs-9'>
                                                    Net Take-Home: ₹{finalSalary.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </div>
                                        <span className='badge bg-light text-muted fs-9 border'>
                                            {selectedDateRange && selectedDateRange[0] ? DayJS(selectedDateRange[0]).format('MMM YYYY') : DayJS().format('MMM YYYY')}
                                        </span>
                                    </div>

                                    {/* Item 2: Real attendance status */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#ECFDF5', color: '#10B981' }}>
                                                <i className='bi bi-calendar-check fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>Attendance Records Active</div>
                                                <div className='text-muted fs-9'>
                                                    {presentCount} present out of {totalAttendanceLogs} logged days
                                                </div>
                                            </div>
                                        </div>
                                        <span className='badge bg-light-success text-success fs-9'>
                                            {presentCount} Present
                                        </span>
                                    </div>

                                    {/* Item 3: Expense claims */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#FFFBEB', color: '#F59E0B' }}>
                                                <i className='bi bi-receipt fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>Expense Claims Tracked</div>
                                                <div className='text-muted fs-9'>
                                                    {approvedExpensesCount} approved (₹{approvedExpensesTotal.toLocaleString('en-IN')})
                                                </div>
                                            </div>
                                        </div>
                                        <span className='badge bg-light-warning text-warning fs-9'>
                                            {expenseData?.length || 0} Total
                                        </span>
                                    </div>

                                    {/* Item 4: Assigned Tasks or Employee Code */}
                                    <div className='d-flex align-items-center justify-content-between'>
                                        <div className='d-flex align-items-center gap-3'>
                                            <div className='d-flex align-items-center justify-content-center rounded-2' style={{ width: '36px', height: '36px', background: '#F1F5F9', color: '#64748B' }}>
                                                <i className='bi bi-person-badge fs-6'></i>
                                            </div>
                                            <div>
                                                <div className='fs-8 fw-bold text-gray-900'>{fullName || 'Employee Account'}</div>
                                                <div className='text-muted fs-9'>
                                                    Code: {employeeCode || '—'} &bull; {assignTaskData?.length || 0} tasks
                                                </div>
                                            </div>
                                        </div>
                                        <span className='badge bg-light text-primary fs-9 border'>
                                            Active
                                        </span>
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
                                                <NumberTicker value={baseSalary} suffix=' /-' />
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
                                                <NumberTicker value={approvedExpensesTotal} suffix=' /-' />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Total */}
                                <div className='d-flex align-items-center justify-content-between pt-3 mt-3 border-top'>
                                    <span className='fw-bold fs-7 text-gray-900'>Gross Total Earnings</span>
                                    <span className='fw-bold fs-6 text-gray-900'>
                                        <NumberTicker value={grossEarnings} suffix=' /-' />
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
                                                <NumberTicker value={absentSalary} suffix=' /-' />
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
                                                <NumberTicker value={halfDaySalary} suffix=' /-' />
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
                                                <NumberTicker value={tenPercentHold} suffix=' /-' />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Total */}
                                <div className='d-flex align-items-center justify-content-between pt-3 mt-3 border-top'>
                                    <span className='fw-bold fs-7 text-gray-900'>Total Deductions</span>
                                    <span className='fw-bold fs-6 text-danger'>
                                        <NumberTicker value={totalDeductions} suffix=' /-' />
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
                                            onClick={() => setActiveTab('salary')}
                                            className='btn btn-link p-0 text-muted fs-8 text-decoration-none'>
                                            View All &rarr;
                                        </button>
                                    </div>

                                    {/* 4 Periods List dynamically generated */}
                                    <div className='d-flex flex-column gap-3'>
                                        {[0, 1, 2, 3].map((offset) => {
                                            const periodDate = DayJS().subtract(offset, 'month')
                                            const periodName = periodDate.format('MMMM YYYY')
                                            const isCurrent = offset === 0
                                            return (
                                                <div
                                                    key={offset}
                                                    className='d-flex align-items-center justify-content-between p-2 rounded-2 hover-bg-light'
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setActiveTab('salary')}>
                                                    <div className='d-flex align-items-center gap-2'>
                                                        <i className='bi bi-calendar-event text-gray-500 fs-7'></i>
                                                        <span className='fs-8 fw-bold text-gray-900'>{periodName}</span>
                                                    </div>
                                                    <div className='d-flex align-items-center gap-2'>
                                                        <span className='fs-8 fw-bold text-gray-900'>
                                                            <NumberTicker value={finalSalary} suffix=' /-' />
                                                        </span>
                                                        <span
                                                            className={`badge ${
                                                                isCurrent
                                                                    ? 'bg-light-success text-success'
                                                                    : 'bg-light-primary text-primary'
                                                            } px-2 py-0 fs-9 fw-semibold`}>
                                                            {isCurrent ? 'Current' : 'Processed'}
                                                        </span>
                                                        <i className='bi bi-chevron-right fs-9 text-gray-400'></i>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Report
