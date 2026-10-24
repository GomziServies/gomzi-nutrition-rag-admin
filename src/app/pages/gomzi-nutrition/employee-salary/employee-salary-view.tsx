import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import DownloadExcelButton from '../../../components/DownloadExcelButton'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetGlsSalary } from '../../../Functions/FGGroup/GlsSalary'
import { GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'
import { GetAdminUsers } from '../../../Functions/FGGroup/AdminUsers'
import SearchFilter from '../../../components/SearchFilter'
import '../common-management.css'

const EmployeeSalaryView = () => {
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
            // Get of This month
            // startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            // endDate = new Date()

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

            setEmployeeData(data[0])

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
            setSalaryData(data[0].attendance)
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

    const filteredSalaryData = (salaryData || []).filter((admin: any) =>
        (admin?.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin?.status || '').toLowerCase().includes(searchTerm.toLowerCase())
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

    // -- salary slip --
    // const generatePDF = (name: any) => {
    // 	const invoiceContent = document.getElementById('invoiceContent')

    // 	if (invoiceContent) {
    // 		invoiceContent.classList.add('pdf-font-black')

    // 		const doc = new jsPDF({
    // 			orientation: 'portrait',
    // 			unit: 'mm',
    // 			format: 'a4',
    // 		})

    // 		// Add margins
    // 		const margin = 10
    // 		const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
    // 		const contentHeight = doc.internal.pageSize.getHeight() - 2 * margin

    // 		html2canvas(invoiceContent, { scale: 2, useCORS: true }).then((canvas) => {
    // 			const imgData = canvas.toDataURL('image/jpeg', 1)

    // 			invoiceContent.classList.remove('pdf-font-black')

    // 			doc.addImage(imgData, 'jpeg', margin, margin, contentWidth, contentHeight)

    // 			const pdfName = `${name || 'demoName'}.pdf`
    // 			doc.save(pdfName)
    // 		})
    // 	} else {
    // 		console.error('Invoice content not found.')
    // 	}
    // }

    return (
        <div className='gz-mgmt-container'>
            <PageTitle breadcrumbs={[]}>Employee Salary Details</PageTitle>

            <nav className='gz-mgmt-breadcrumb'>
                <a href='/rag/dashboard'>Dashboard</a>
                <span>/</span>
                <a href='/rag/employee-salary'>Staff Management</a>
                <span>/</span>
                <a href='/rag/employee-salary'>Employee Salary</a>
                <span>/</span>
                <span>Salary Breakdown</span>
            </nav>

            <div className='gz-mgmt-header mb-6'>
                <div>
                    <h1 className='gz-mgmt-title'>Employee Salary Breakdown</h1>
                    <p className='gz-mgmt-subtitle'>
                        Comprehensive salary calculation, attendance metrics, task incentives, and approved expense reimbursements
                    </p>
                </div>
                <button
                    type='button'
                    className='gz-mgmt-btn-secondary'
                    onClick={() => window.history.back()}
                >
                    <i className='bi bi-arrow-left me-2'></i>
                    Back to Salaries
                </button>
            </div>

            {/* Profile & Key Metrics Banner */}
            <div className='gz-mgmt-card mb-6'>
                <div className='p-6'>
                    <div className='d-flex flex-wrap align-items-center gap-6 mb-6'>
                        <img
                            src={
                                employeeData?.employee_photo || employeeData?.photo
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
                                {employeeData?.email && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-envelope text-primary'></i>
                                        {employeeData.email}
                                    </span>
                                )}
                                {employeeData?.mobile && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-telephone text-primary'></i>
                                        {employeeData.mobile}
                                    </span>
                                )}
                                {employeeData?.joining_date && (
                                    <span className='d-flex align-items-center gap-1'>
                                        <i className='bi bi-calendar-check text-primary'></i>
                                        Joined: {DayJS(employeeData.joining_date).format('DD MMM YYYY')} {joiningTime ? `(${joiningTime})` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Metric Cards */}
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
                                    Calculated for selected period
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Salary Calculation Table */}
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
                                        <span className='text-muted fs-8 ms-2'>({employeeData?.absent_cutting_salary?.[0]?.absent || 0} Days)</span>
                                        {employeeData?.absent_cutting_salary?.[0]?.sandwichLeave && (
                                            <span className='gz-mgmt-pill warning ms-2'>
                                                {employeeData?.absent_cutting_salary?.[0]?.sandwichLeave} Sandwich Leave
                                            </span>
                                        )}
                                        {employeeData?.absent_cutting_salary?.[0]?.paidLeave && (
                                            <span className='gz-mgmt-pill success ms-2'>Paid Leave Applied</span>
                                        )}
                                    </td>
                                    <td className='py-3 px-6 text-end fw-bold text-danger'>
                                        - ₹{Number(employeeData?.absent_cutting_salary?.[0]?.salary || 0).toLocaleString('en-IN')}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td className='py-3 px-6'>
                                        <span className='fw-semibold'>Half-Day Deduction</span>
                                        <span className='text-muted fs-8 ms-2'>({employeeData?.half_day_salary?.[0]?.halfDay || 0} Half Days)</span>
                                        {employeeData?.half_day_salary?.[0]?.paidLeave && (
                                            <span className='gz-mgmt-pill success ms-2'>Paid Leave Applied</span>
                                        )}
                                    </td>
                                    <td className='py-3 px-6 text-end fw-bold text-danger'>
                                        - ₹{Number(employeeData?.half_day_salary?.[0]?.salary || 0).toLocaleString('en-IN')}
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

            {/* Attendance Punch Logs Card */}
            <div className='gz-mgmt-card mb-6'>
                <div className='gz-mgmt-toolbar flex-wrap gap-4'>
                    <div className='gz-mgmt-toolbar-left flex-wrap gap-3'>
                        <SearchFilter
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                        />
                        <LengthMenu
                            expenseData={salaryData}
                            handleItemsPerPageChange={handleItemsPerPageChange}
                        />
                        <div>
                            <DownloadExcelButton
                                data={salaryData}
                                columns={sortableFields}
                                filename='Attendance_Punch_Logs'
                            />
                        </div>
                        <DateFilter
                            onDateRangeChange={handleDateRangeChange}
                            rightValue='0'
                            lastMonth={true}
                        />
                    </div>
                </div>

                <div className='card-body p-0'>
                    <div className='table-responsive'>
                        <Table
                            data={paginatedSalaryData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            removeAction={true}
                            renderRow={(salary: any, index: number, actualIndex: number, isVisible: boolean) => (
                                <React.Fragment key={salary?._id}>
                                    <tr
                                        onClick={() => handleRowClick(salary?._id)}
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
                                            <span className='fw-semibold fs-7' style={{ color: salary?.OverTime && salary?.OverTime !== '00:00' ? '#16A34A' : '#64748B' }}>
                                                {salary?.OverTime || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-semibold text-dark fs-7'>
                                                {salary?.WorkTime || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='fw-bold' style={{ color: '#0F172A' }}>
                                                {salary?.date ? DayJS(salary.date).format('DD MMM YYYY') : 'N/A'}
                                            </span>
                                            <span className='d-block fs-8 text-muted'>
                                                {salary?.date ? DayJS(salary.date).format('dddd') : ''}
                                            </span>
                                        </td>
                                        <td>
                                            {salary?.halfDay ? (
                                                <span className='gz-mgmt-pill warning'>Half Day</span>
                                            ) : (
                                                <span className='text-muted'>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {salary?.status === 'Leave' || salary?.status === 'A' ? (
                                                <span className='gz-mgmt-pill danger'>
                                                    {DayJS(salary?.date).format('dddd') === 'Sunday'
                                                        ? 'Sunday'
                                                        : salary?.status === 'A'
                                                        ? 'Absent'
                                                        : salary?.status}
                                                </span>
                                            ) : DayJS(salary?.date).format('dddd') === 'Sunday' ? (
                                                <span className='gz-mgmt-pill info'>
                                                    Sunday - {salary?.status}
                                                </span>
                                            ) : (
                                                <span className='gz-mgmt-pill success'>
                                                    {salary?.status === 'P' ? 'Present' : salary?.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12}>
                                                <div className='p-4' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
                                                    <strong>Date:</strong> {DayJS(salary?.date).format('DD/MM/YYYY')}<br />
                                                    <strong>Work Time:</strong> {salary?.WorkTime || '-'}<br />
                                                    <strong>Over Time:</strong> {salary?.OverTime || '-'}<br />
                                                    <strong>Status:</strong> {salary?.status || '-'}
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
                        <div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
                            <b>No punch records found</b>
                        </div>
                    )}
                    {paginatedSalaryData?.length > 0 && (
                        <UsersListPagination
                            totalPages={Math.ceil((filteredSalaryData?.length || 0) / pagination.itemsPerPage) || 1}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
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
                </div>
            </div>
        </div>
    )
}

export default EmployeeSalaryView