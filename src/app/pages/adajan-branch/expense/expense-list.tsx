import {
    faDownload,
    faHandHoldingDollar,
    faHandshake,
    faPlusCircle,
    faRectangleAd,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { getExpense } from '../../../../app/Functions/FGGroup/Expense'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const AdajanBranchExpenseList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [expenseData, setExpenseData] = useState<any>([])
    const [metaData, setMetaData] = useState<any>()
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })
    const [loading, setLoading] = useState(false)
    const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

    useEffect(() => {
        fetchExpenseData()
    }, [selectedDateRange, pagination.page, pagination.itemsPerPage, sort, sortOrder])

    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (searchTerm.trim() || searchTerm === '') {
            setPagination((prev) => ({ ...prev, page: 1 }))
            if (pagination.page === 1) fetchExpenseData()
        }
    }, [searchTerm])

    const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
        setSelectedDateRange(dateRange)
        setPagination({ ...pagination, page: 1 })
    }

    const fetchExpenseData = async (page?: number) => {
        setLoading(true)
        let startDate: Date
        let endDate: Date

        if (selectedDateRange) {
            ;[startDate, endDate] = selectedDateRange
        } else {
            startDate = new Date(0)
            endDate = new Date()
        }
        try {
            const response: any = await getExpense({
                expense_company: 'Adajan-Branch',
                from_date: startDate,
                to_date: endDate,
                page: page || pagination.page,
                limit: pagination.itemsPerPage,
                ...(searchTerm && { search: searchTerm }),
                sort,
                sortOrder,
            })

            const metaData: any = response.metadata
            setMetaData(metaData.pagination)

            let filteredData = response.data
            filteredData.sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setExpenseData(filteredData)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const handleItemsPerPageChange = (value: number) => {
        setPagination({ ...pagination, itemsPerPage: value })
    }

    const adsExpenses = expenseData.filter((expense: any) => expense.expense_category === 'Ads')
    const counsellingExpenses = expenseData.filter(
        (expense: any) => expense.expense_category === 'Counselling'
    )

    const totalAdsAmount = adsExpenses.reduce(
        (sum: number, expense: any) => sum + parseFloat(expense.total_amount),
        0
    )
    const totalCounsellingAmount = counsellingExpenses.reduce(
        (sum: number, expense: any) => sum + parseFloat(expense.total_amount),
        0
    )
    const totalAmount = expenseData.reduce(
        (sum: number, invoice: any) => sum + parseFloat(invoice.total_amount),
        0
    )

    const downloadExcel = () => {
        const worksheetData = expenseData.map((invoice: any, index: number) => ({
            'No.': index + 1,
            'Expenses Category': invoice.expense_category || 'N/A',
            'Payment Method': invoice.payment_method || 'N/A',
            'Total Amount': invoice.total_amount || 'N/A',
            Date: invoice.date || 'N/A',
            'Expense Notes': invoice.note || 'N/A',
        }))
        const worksheet = XLSX.utils.json_to_sheet(worksheetData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')
        XLSX.writeFile(workbook, 'AdajanBranchExpenseData.xlsx')
    }

    const formattedTotalAdsAmount = totalAdsAmount
    const formattedTotalCounsellingAmount = totalCounsellingAmount
    const formattedTotalAmount = totalAmount

    const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
        setSort(newSort)
        setSortOrder(newSortOrder)
    }

    const sortableFields = [
        { title: 'Expenses Category', field: 'expense_category' },
        { title: 'Payment Method', field: 'payment_method' },
        { title: 'Total Amount', field: 'total_amount' },
        { title: 'Date', field: 'date' },
        { title: 'Notes', field: 'note' },
    ]

    const handleRowClick = (id: string) => {
        if (window.innerWidth <= 1024) {
            setVisibleDetails(visibleDetails === id ? null : id)
        }
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Expenses Details</PageTitle>
            <div className='row g-5 g-xl-8'>
                <div className='col-lg-3'>
                    <StatisticsWidget2
                        className='card-xl-stretch mb-xl-8'
                        Icon={faHandHoldingDollar}
                        color='primary'
                        title={formattedTotalAmount}
                        description='Total Expenses'
                    />
                </div>
                <div className='col-lg-3'>
                    <StatisticsWidget2
                        className='card-xl-stretch mb-xl-8'
                        Icon={faRectangleAd}
                        color='primary'
                        title={formattedTotalAdsAmount}
                        description='Total Ads'
                    />
                </div>
                <div className='col-lg-3'>
                    <StatisticsWidget2
                        className='card-xl-stretch mb-5 mb-xl-8'
                        Icon={faHandshake}
                        color='primary'
                        title={formattedTotalCounsellingAmount}
                        description='Total Consulting'
                    />
                </div>
            </div>
            <KTCard>
                <div className='row mx-5 border-0 pt-6'>
                    <div className='col-md-6'>
                        <div className='card-title'>
                            <div className='row'>
                                <div className='col-md-7'>
                                    <SearchFilter
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                    />
                                </div>
                                <div className='d-md-block d-none col-md-3'>
                                    <LengthMenu
                                        expenseData={expenseData}
                                        handleItemsPerPageChange={handleItemsPerPageChange}
                                    />
                                </div>
                                <div className='col-md-2'>
                                    <button
                                        className='btn btn-success'
                                        onClick={downloadExcel}
                                        disabled={loading}>
                                        <FontAwesomeIcon
                                            icon={faDownload}
                                            className='fs-3'
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-md-6'>
                        <div className='card-toolbar d-flex justify-content-end'>
                            <div className='row'>
                                <div className='col-md-6 mt-md-0 mt-2'>
                                    <DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
                                </div>
                                <div className='col-md-6 mt-md-0 mt-5 d-md-block d-flex'>
                                    <TableButton
                                        action='add'
                                        to='/adajan-branch/expense/add'
                                        text='Add Expense'
                                    />
                                    <div className='d-md-none d-block col-md-6 col-4'>
                                        <LengthMenu
                                            expenseData={expenseData}
                                            handleItemsPerPageChange={handleItemsPerPageChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='py-4 card-body'>
                    <div className='table-responsive'>
                        <Table
                            data={expenseData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            renderRow={(expense: any, index: number, actualIndex: number, isVisible: boolean) => (
                                <React.Fragment key={expense._id}>
                                    <tr
                                        onClick={() => handleRowClick(expense._id)}
                                        className='data-row'>
                                        <td className='text-center align-middle'>
                                            <div className='d-flex align-items-center justify-content-center'>
                                                <FontAwesomeIcon
                                                    icon={faPlusCircle}
                                                    className='mx-2 mb-1 plus-icon'
                                                    style={{ color: '#607D8B', fontSize: '18px' }}
                                                />
                                                <span className='text-dark fw-bold d-block mb-1 fs-6'>
                                                    {actualIndex}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='text-center align-middle'>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {expense.expense_category}
                                            </span>
                                        </td>
                                        <td className='text-center align-middle'>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {expense.payment_method}
                                            </span>
                                        </td>
                                        <td className='text-center align-middle'>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {expense.total_amount}
                                            </span>
                                        </td>
                                        <td className='text-start align-middle px-3'>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {DayJS(expense.date).format('YYYY/MM/DD h:mm A')}
                                            </span>
                                        </td>
                                        <td className='text-start align-middle px-3'>
                                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                {expense.note}
                                            </span>
                                        </td>
                                        <td className='text-center align-middle'>
                                            <TableButton
                                                action='edit'
                                                to={`/adajan-branch/expense/edit?expense_id=` + expense._id}
                                                backgroundDark={true}
                                            />
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12}>
                                                <div>
                                                    <strong>{sortableFields[0].title}:</strong> {expense.expense_number}
                                                    <br />
                                                    <strong>{sortableFields[1].title}:</strong> {expense.expense_category}
                                                    <br />
                                                    <strong>{sortableFields[2].title}:</strong> {expense.payment_method}
                                                    <br />
                                                    <strong>{sortableFields[3].title}:</strong> {expense.total_amount}
                                                    <br />
                                                    <strong>{sortableFields[4].title}:</strong>{' '}
                                                    {DayJS(expense.date).format('YYYY/MM/DD h:mm A')}
                                                    <br />
                                                    <strong>{sortableFields[5].title}:</strong>
                                                    {expense.note}
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
                    {expenseData.length === 0 && !loading && (
                        <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                            <b>No records found</b>
                        </div>
                    )}
                    {expenseData.length > 0 && (
                        <UsersListPagination
                            totalPages={metaData?.totalPages}
                            currentPage={pagination.page}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </KTCard>
        </>
    )
}

export { AdajanBranchExpenseList }
