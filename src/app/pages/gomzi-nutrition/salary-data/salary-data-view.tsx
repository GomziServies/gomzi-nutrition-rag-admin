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
        <>
            <PageTitle breadcrumbs={[]}>Employee Salary Details</PageTitle>

            <div className='row mb-6'>
                <div className='col-12 mt-3'>
                    <div className='card py-10'>
                        <div className='card-body'>
                            <div className='row'>
                                <div className='col-2 d-md-block d-none text-center'>
                                    <img
                                        src={
                                            (employeeData?.employee_photo || employeeData?.photo)
                                                ? `https://files.fggroup.in/${employeeData?.employee_photo || employeeData?.photo}`
                                                : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                        }
                                        alt={employeeData?.employee_name || employeeData?.full_name}
                                        style={{ borderRadius: '10px', width: '90%' }}
                                    />
                                </div>
                                <div className='col-12 d-md-none d-block mb-5 text-center'>
                                    <img
                                        src={
                                            (employeeData?.employee_photo || employeeData?.photo)
                                                ? `https://files.fggroup.in/${employeeData?.employee_photo || employeeData?.photo}`
                                                : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                        }
                                        alt={employeeData?.employee_name || employeeData?.full_name}
                                        style={{ borderRadius: '5px', width: '50%' }}
                                    />
                                </div>
                                <div className='col-md-10'>
                                    <div className='row'>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Name'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='employee_name'
                                                label='Name'
                                                htmlFor='employee_name'
                                                value={employeeData?.employee_name || ''}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Email'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='employee_email'
                                                label='Email'
                                                htmlFor='employee_email'
                                                value={employeeData?.employee_email || ''}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Total Salary'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='total_salary'
                                                label='Total Salary'
                                                htmlFor='total_salary'
                                                value={employeeData?.total_salary || ''}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='Final Salary'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='final_salary'
                                                label='Final Salary'
                                                htmlFor='final_salary'
                                                value={employeeData?.final_salary || ''}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                placeholder='One Day Salary'
                                                type='text'
                                                className='col-12 fv-row mb-7'
                                                name='one_day_salary'
                                                label='One Day Salary'
                                                htmlFor='one_day_salary'
                                                value={employeeData?.total_salary ? Math.round(employeeData?.total_salary / 30).toString() : ''}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-4 fv-row mb-7'>
                                            <InputField
                                                className='col-12 fv-row'
                                                placeholder='Period'
                                                type='text'
                                                name='period'
                                                label='Period'
                                                htmlFor='period'
                                                value={employeeData?.month && employeeData?.year ? `${employeeData?.month} ${employeeData?.year}` : ''}
                                                onChange={handleInputChange}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='container mt-7 mx-6'>
                                <div className='row align-items-center mb-5'>
                                    <div className='col-md-4 px-0'>
                                        <h3 className='fw-bold fs-3'>Salary Calculation</h3>
                                    </div>
                                    <div className='col-md-4 d-flex align-items-center'>
                                        <SearchFilter
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                        />
                                        <LengthMenu
                                            expenseData={salaryData?.attendance || []}
                                            handleItemsPerPageChange={handleItemsPerPageChange}
                                        />
                                    </div>
                                    <div className='col-md-4 px-0 mb-5'>
                                        <DateFilter
                                            onDateRangeChange={handleDateRangeChange}
                                            leftValue='-450px'
                                            lastMonth={true}
                                        />
                                    </div>
                                </div>

                                <div className='row'>
                                    <div className='col-md-10 p-0'>
                                        <table className='table table-bordered shadow-sm mb-0'>
                                            <thead className='bg-light border-bottom border-black'>
                                                <tr className=' border-top-0'>
                                                    <th
                                                        scope='col'
                                                        className='text-center border-0'>
                                                        Description
                                                    </th>
                                                    <th
                                                        scope='col'
                                                        className='text-center border-end '>
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className=''>
                                                <tr>
                                                    <td className='text-center fw-bold border-start-0 border-black'>
                                                        Salary
                                                    </td>
                                                    <td className='text-center fs-5 fw-bold'>
                                                        ₹{employeeData?.total_salary || 0} /-
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className='text-center fw-bold border-start-0 border-black'>
                                                        Absent ({employeeData?.absent_cutting_salary?.absent || 0} Days)
                                                        {employeeData?.absent_cutting_salary?.paidLeave ? (
                                                            <span className='ms-2 badge bg-success text-light-success'>
                                                                Paid Leave Apply
                                                            </span>
                                                        ) : (
                                                            ''
                                                        )}
                                                        {employeeData?.absent_cutting_salary?.sandwichLeave ? (
                                                            <span className='ms-2 badge bg-success text-light-success'>
                                                                {employeeData?.absent_cutting_salary?.sandwichLeave} Sandwich
                                                                Leave Apply
                                                            </span>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </td>
                                                    <td className='text-center text-danger fs-5 fw-bold'>
                                                        - ₹{employeeData?.absent_cutting_salary?.salary || 0} /-
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className='text-center fw-bold border-start-0 border-black'>
                                                        Half-Day ({employeeData?.half_day_salary?.halfDay || 0} Half)
                                                        {employeeData?.half_day_salary?.paidLeave ? (
                                                            <span className='ms-2 badge bg-success text-light-success'>
                                                                Paid Leave Apply
                                                            </span>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </td>
                                                    <td className='text-center text-danger fs-5 fw-bold'>
                                                        - ₹{employeeData?.half_day_salary?.salary || 0} /-
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className='text-center fw-bold border-start-0 border-black'>
                                                        Deducted Salary
                                                    </td>
                                                    <td className='text-center text-danger fs-5 fw-bold'>
                                                        - ₹{employeeData?.deducted_salary || 0} /-
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className='text-center fw-bold border-start-0 border-black'>
                                                        Task {employeeData?.task_rating?.rating || 0}% Rating Salary (
                                                        {employeeData?.task_rating?.percentage?.value || 0}%)
                                                    </td>
                                                    {employeeData?.task_rating?.percentage?.type === 'plus' ? (
                                                        <td className='text-center text-success fs-5 fw-bold'>
                                                            + ₹{employeeData?.task_rating?.task_rating_salary || 0} /-
                                                        </td>
                                                    ) : (
                                                        <td className='text-center text-danger fs-5 fw-bold'>
                                                            - ₹{employeeData?.task_rating?.task_rating_salary || 0} /-
                                                        </td>
                                                    )}
                                                </tr>
                                                {/* Expense Information Section */}
                                                <tr>
                                                    <td className='text-center fw-bold border-start-0 border-black'>
                                                        Approved Expenses ({employeeData?.approved_expenses_count || 0} Items)
                                                    </td>
                                                    <td className='text-center text-success fs-5 fw-bold'>
                                                        + ₹{employeeData?.total_approved_expenses || 0} /-
                                                    </td>
                                                </tr>
                                                <tr className='border-top border-black'>
                                                    <td className='text-center border-start-0 border-black fw-bold'>
                                                        10% Salary
                                                    </td>
                                                    <td className='text-center border-0 fs-5 text-danger fw-bold'>
                                                        - ₹{employeeData?.ten_percent_salary || 0} /-
                                                    </td>
                                                </tr>
                                                <tr className=''>
                                                    <td className='text-center fw-bolder border-start-0 border-black fw-bold'>
                                                        Final Salary
                                                    </td>
                                                    <td className='text-center fs-4 fw-bold'>
                                                        ₹{employeeData?.final_salary || 0} /-
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Information Section */}
            <div className='card mt-8'>
                <div className='row justify-content-between mt-7 mx-6'>
                    <div className='col-md-9'>
                        <h3 className='card-title align-items-start flex-column'>
                            <span className='card-label fw-bold fs-3 mb-1'>
                                Approved Expense Reports
                            </span>
                        </h3>
                    </div>
                </div>

                <div className='py-4 card-body'>
                    <div className='table-responsive'>
                        {expenseData && expenseData.length > 0 ? (
                            <table className='table table-bordered shadow-sm mb-0'>
                                <thead className='bg-light border-bottom border-black'>
                                    <tr className='border-black'>
                                        <th scope='col' className='text-center border-black'>Date</th>
                                        <th scope='col' className='text-center border-black'>Purpose</th>
                                        <th scope='col' className='text-center border-black'>Items</th>
                                        <th scope='col' className='text-center border-black'>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenseData.map((expense: any) => (
                                        <tr key={expense._id} className='border-black'>
                                            <td className='text-center  border-black'>
                                                {new Date(expense.createdAt).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className='text-center  border-black'>{expense.purpose}</td>
                                            <td className='text-center  border-black'>
                                                {expense.expenses?.map((item: any, index: number) => (
                                                    <div key={index}>
                                                        {item.type}: {item.description} (₹{item.amount})
                                                    </div>
                                                ))}
                                            </td>
                                            <td className='text-center fs-5 fw-bold'>
                                                ₹{expense.total_amount || 0} /-
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className='border-top border-black'>
                                        <td colSpan={3} className='text-center fw-bold'>
                                            Total Approved Expenses
                                        </td>
                                        <td className='text-center fs-5 fw-bold text-success'>
                                            + ₹{employeeData?.total_approved_expenses || 0} /-
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <div className='d-flex justify-content-center align-items-center'>
                                <div className='text-center'>
                                    <h3 className='fw-bolder text-gray-600'>No Approved Expense Reports Found</h3>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {expenseData?.length === 0 && !loadingExpenses && (
                        <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                            <b>No expense reports found</b>
                        </div>
                    )}
                    {expenseData?.length > 0 && (
                        <UsersListPagination
                            totalPages={Math.ceil(expenseData?.length / pagination.itemsPerPage)}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

export default SalaryDataView