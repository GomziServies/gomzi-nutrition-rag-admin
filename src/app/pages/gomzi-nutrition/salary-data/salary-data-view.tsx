import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import { GetGlsSalaryData } from '../../../Functions/FGGroup/GlsSalary'
import { GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'
import { GetAdminUsers } from '../../../Functions/FGGroup/AdminUsers'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import UsersListPagination from '../../../components/TablePagination'
import Table from '../../../components/Table'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import '../common-management.css'

const SalaryDataView = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const employee_id: string | any = searchParams.get('employee_id')
    const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
    const [salaryData, setSalaryData] = useState<any>(null)
    const [employeeData, setEmployeeData] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState('date')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [expenseData, setExpenseData] = useState<any[]>([])
    const [loadingExpenses, setLoadingExpenses] = useState(false)

    const fetchSalaryData = async (page?: number) => {
        setLoading(true)
        let period: string | null = null
        let query: { employee_id?: string; period?: string } = {}

        if (employee_id) {
            query.employee_id = employee_id
        }

        // Add period only if it's explicitly selected
        const storedDateRange = localStorage.getItem('selectedDateRange')
        if (storedDateRange) {
            const parsedRange = JSON.parse(storedDateRange)
            const startDate = new Date(parsedRange.from)
            period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
        } else if (selectedDateRange) {
            const startDate = new Date(selectedDateRange[0])
            period = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
        }

        if (period) {
            query = { period } 
        }

        try {
            const response: any = await GetGlsSalaryData(query)

            const data = response.data
            
            if (data && data.length > 0) {
                setSalaryData(data[0])
                setEmployeeData(data[0])
            
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (employee_id) {
            fetchSalaryData()
            fetchExpenseData()
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

    // For attendance data, we would need a separate API call
    // For now, we'll show an empty array since the new salary data structure doesn't include attendance details
    const [searchTerm, setSearchTerm] = useState('')
    const filteredSalaryData = (salaryData?.attendance || []).filter((admin: any) =>
        (admin?.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin?.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    const paginatedSalaryData = filteredSalaryData.slice(
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

    return (
        <div className='gz-mgmt-container'>
            <PageTitle breadcrumbs={[]}>Employee Salary Details</PageTitle>

            <nav className='gz-mgmt-breadcrumb'>
                <a href='/rag/dashboard'>Dashboard</a>
                <span>/</span>
                <a href='/rag/employees'>Staff Management</a>
                <span>/</span>
                <a href='/rag/salary-data'>Salary Data</a>
                <span>/</span>
                <span>Compensation Statement</span>
            </nav>

            <div className='gz-mgmt-header mb-6'>
                <div>
                    <h1 className='gz-mgmt-title'>Employee Compensation Statement</h1>
                    <p className='gz-mgmt-subtitle'>
                        Itemized salary details, attendance performance deductions, and expense claims for period
                    </p>
                </div>
                <button
                    type='button'
                    className='gz-mgmt-btn-secondary'
                    onClick={() => window.history.back()}
                >
                    <i className='bi bi-arrow-left me-2'></i>
                    Back to Salary Data
                </button>
            </div>

            {/* Profile & Metric Banner */}
            <div className='gz-mgmt-card mb-6'>
                <div className='p-6'>
                    <div className='d-flex flex-wrap align-items-center gap-6 mb-6'>
                        <img
                            src={
                                (employeeData?.employee_photo || employeeData?.photo)
                                    ? `https://files.fggroup.in/${employeeData?.employee_photo || employeeData?.photo}`
                                    : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                            }
                            alt={employeeData?.employee_name || employeeData?.full_name || 'Employee'}
                            style={{
                                width: '84px',
                                height: '84px',
                                objectFit: 'cover',
                                borderRadius: '14px',
                                border: '2px solid #E2E8F0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                        />
                        <div className='flex-grow-1'>
                            <div className='d-flex align-items-center gap-3 mb-2 flex-wrap'>
                                <h3 className='m-0 fw-bold' style={{ color: '#0F172A', fontSize: '20px' }}>
                                    {employeeData?.employee_name || employeeData?.full_name || 'Employee'}
                                </h3>
                                {employeeData?.employee_code && (
                                    <span className='gz-mgmt-pill info'>
                                        {employeeData.employee_code}
                                    </span>
                                )}
                            </div>
                            <div className='d-flex flex-wrap align-items-center gap-4 text-muted fs-7'>
                                {employeeData?.employee_email && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-envelope text-primary'></i>
                                        {employeeData.employee_email}
                                    </span>
                                )}
                                {employeeData?.mobile && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-telephone text-primary'></i>
                                        {employeeData.mobile}
                                    </span>
                                )}
                                {(employeeData?.month || employeeData?.year) && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-calendar-event text-primary'></i>
                                        Period: {employeeData?.month} {employeeData?.year}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metric Cards Row */}
                    <div className='row g-4'>
                        <div className='col-sm-6 col-md-3'>
                            <div className='p-4 rounded-3' style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div className='fs-8 text-muted fw-semibold text-uppercase mb-1'>Base Salary</div>
                                <div className='fs-4 fw-bold' style={{ color: '#0F172A' }}>
                                    ₹{Number(employeeData?.total_salary || 0).toLocaleString('en-IN')}
                                </div>
                                <div className='fs-8 text-muted mt-1'>
                                    ~₹{Math.round((employeeData?.total_salary || 0) / 30).toLocaleString('en-IN')}/day
                                </div>
                            </div>
                        </div>
                        <div className='col-sm-6 col-md-3'>
                            <div className='p-4 rounded-3' style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div className='fs-8 text-muted fw-semibold text-uppercase mb-1'>Deductions</div>
                                <div className='fs-4 fw-bold text-danger'>
                                    -₹{Number(employeeData?.deducted_salary || 0).toLocaleString('en-IN')}
                                </div>
                                <div className='fs-8 text-muted mt-1'>
                                    Absent & Half-day cuts
                                </div>
                            </div>
                        </div>
                        <div className='col-sm-6 col-md-3'>
                            <div className='p-4 rounded-3' style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div className='fs-8 text-muted fw-semibold text-uppercase mb-1'>Approved Expenses</div>
                                <div className='fs-4 fw-bold text-success'>
                                    +₹{Number(employeeData?.total_approved_expenses || 0).toLocaleString('en-IN')}
                                </div>
                                <div className='fs-8 text-muted mt-1'>
                                    {employeeData?.approved_expenses_count || 0} claims reimbursed
                                </div>
                            </div>
                        </div>
                        <div className='col-sm-6 col-md-3'>
                            <div className='p-4 rounded-3' style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                                <div className='fs-8 text-primary fw-semibold text-uppercase mb-1'>Final Net Payout</div>
                                <div className='fs-3 fw-bold' style={{ color: '#1E40AF' }}>
                                    ₹{Number(employeeData?.final_salary || 0).toLocaleString('en-IN')}
                                </div>
                                <div className='fs-8 text-muted mt-1'>
                                    Net payable for period
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Salary Calculation Breakdown Card */}
            <div className='gz-mgmt-card mb-6'>
                <div className='gz-mgmt-toolbar flex-wrap gap-4'>
                    <div className='gz-mgmt-toolbar-left'>
                        <h4 className='m-0 fw-bold' style={{ color: '#0F172A', fontSize: '16px' }}>
                            Itemized Salary Statement
                        </h4>
                    </div>
                    <div className='gz-mgmt-toolbar-right'>
                        <DateFilter
                            onDateRangeChange={handleDateRangeChange}
                            rightValue='0'
                            lastMonth={true}
                        />
                    </div>
                </div>

                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        <table className='table table-hover align-middle mb-0' style={{ fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th className='py-3 px-6 text-start fw-bold' style={{ color: '#475569' }}>Description</th>
                                    <th className='py-3 px-6 text-end fw-bold' style={{ color: '#475569', width: '220px' }}>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6 fw-bold' style={{ color: '#0F172A' }}>Base Monthly Salary</td>
                                    <td className='py-3 px-6 text-end fw-bold' style={{ color: '#0F172A' }}>
                                        ₹{Number(employeeData?.total_salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6'>
                                        <span className='fw-semibold'>Absenteeism Deduction</span>
                                        <span className='text-muted fs-8 ms-2'>({employeeData?.absent_cutting_salary?.absent || 0} Days)</span>
                                        {employeeData?.absent_cutting_salary?.sandwichLeave && (
                                            <span className='gz-mgmt-pill warning ms-2'>
                                                {employeeData?.absent_cutting_salary?.sandwichLeave} Sandwich Leave
                                            </span>
                                        )}
                                        {employeeData?.absent_cutting_salary?.paidLeave && (
                                            <span className='gz-mgmt-pill success ms-2'>Paid Leave Applied</span>
                                        )}
                                    </td>
                                    <td className='py-3 px-6 text-end fw-bold text-danger'>
                                        - ₹{Number(employeeData?.absent_cutting_salary?.salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6'>
                                        <span className='fw-semibold'>Half-Day Deduction</span>
                                        <span className='text-muted fs-8 ms-2'>({employeeData?.half_day_salary?.halfDay || 0} Half Days)</span>
                                        {employeeData?.half_day_salary?.paidLeave && (
                                            <span className='gz-mgmt-pill success ms-2'>Paid Leave Applied</span>
                                        )}
                                    </td>
                                    <td className='py-3 px-6 text-end fw-bold text-danger'>
                                        - ₹{Number(employeeData?.half_day_salary?.salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6 fw-semibold text-danger'>
                                        Total Deductions Applied
                                    </td>
                                    <td className='py-3 px-6 text-end fw-bold text-danger'>
                                        - ₹{Number(employeeData?.deducted_salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6'>
                                        <span className='fw-semibold'>Task Performance Incentive/Penalty</span>
                                        <span className='text-muted fs-8 ms-2'>
                                            ({employeeData?.task_rating?.rating || 0}% rating · {employeeData?.task_rating?.percentage?.value || 0}%)
                                        </span>
                                    </td>
                                    <td className={`py-3 px-6 text-end fw-bold ${employeeData?.task_rating?.percentage?.type === 'plus' ? 'text-success' : 'text-danger'}`}>
                                        {employeeData?.task_rating?.percentage?.type === 'plus' ? '+' : '-'} ₹{Number(employeeData?.task_rating?.task_rating_salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6'>
                                        <span className='fw-semibold'>Approved Expenses Reimbursement</span>
                                        <span className='text-muted fs-8 ms-2'>({employeeData?.approved_expenses_count || 0} claims)</span>
                                    </td>
                                    <td className='py-3 px-6 text-end fw-bold text-success'>
                                        + ₹{Number(employeeData?.total_approved_expenses || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6 fw-semibold'>10% Security / Withholding</td>
                                    <td className='py-3 px-6 text-end fw-bold text-danger'>
                                        - ₹{Number(employeeData?.ten_percent_salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                                    <td className='py-4 px-6 fw-bolder fs-6' style={{ color: '#0F172A' }}>
                                        Net Payable Salary
                                    </td>
                                    <td className='py-4 px-6 text-end fw-bolder fs-5' style={{ color: '#16A34A' }}>
                                        ₹{Number(employeeData?.final_salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Approved Expense Reports Card */}
            <div className='gz-mgmt-card mb-6'>
                <div className='gz-mgmt-toolbar'>
                    <div className='gz-mgmt-toolbar-left'>
                        <h4 className='m-0 fw-bold' style={{ color: '#0F172A', fontSize: '16px' }}>
                            Approved Expense Claims
                        </h4>
                    </div>
                </div>

                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        {expenseData && expenseData.length > 0 ? (
                            <table className='table table-hover align-middle mb-0' style={{ fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th className='py-3 px-6 text-start fw-bold' style={{ color: '#475569' }}>Date</th>
                                        <th className='py-3 px-6 text-start fw-bold' style={{ color: '#475569' }}>Purpose</th>
                                        <th className='py-3 px-6 text-start fw-bold' style={{ color: '#475569' }}>Line Items</th>
                                        <th className='py-3 px-6 text-end fw-bold' style={{ color: '#475569' }}>Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseData.map((expense: any) => (
                                        <tr key={expense._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td className='py-3 px-6 fw-semibold' style={{ color: '#0F172A' }}>
                                                {DayJS(expense.createdAt).format('DD MMM YYYY')}
                                            </td>
                                            <td className='py-3 px-6 fw-medium text-dark'>{expense.purpose}</td>
                                            <td className='py-3 px-6'>
                                                {expense.expenses?.map((item: any, idx: number) => (
                                                    <div key={idx} className='text-muted fs-8'>
                                                        <strong className='text-dark'>{item.type}:</strong> {item.description} (₹{Number(item.amount || 0).toLocaleString('en-IN')})
                                                    </div>
                                                ))}
                                            </td>
                                            <td className='py-3 px-6 text-end fw-bold' style={{ color: '#0F172A' }}>
                                                ₹{Number(expense.total_amount || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                                        <td colSpan={3} className='py-4 px-6 fw-bolder fs-6' style={{ color: '#0F172A' }}>
                                            Total Reimbursable Claims
                                        </td>
                                        <td className='py-4 px-6 text-end fw-bolder fs-5 text-success'>
                                            + ₹{Number(employeeData?.total_approved_expenses || 0).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
                                <b>No approved expense reports found for this period</b>
                            </div>
                        )}
                    </div>
                    {expenseData?.length > 0 && (
                        <UsersListPagination
                            totalPages={Math.ceil((expenseData?.length || 0) / pagination.itemsPerPage) || 1}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default SalaryDataView