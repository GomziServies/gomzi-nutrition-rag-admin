import React, { useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import LengthMenu from '../../../components/LengthMenu'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faXmark } from '@fortawesome/free-solid-svg-icons'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const MemoEmployee: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [loading] = useState(false)
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [targetData] = useState<any[]>([
        {
            id: 1,
            employee_name: 'Divyesh',
            memo_received_date: '2022/2/13',
        },
        {
            id: 2,
            employee_name: 'Yash',
            memo_received_date: '2022/11/5 02:21:15 PM',
        },
    ])

    const [targetAddData, setTargetAddData] = useState({
        branch: '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        target: '',
    })

    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target
        setTargetAddData({ ...targetAddData, [name]: value })
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const filteredtargetData = targetData.filter((sale) =>
        (sale.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    const paginatedtargetData = filteredtargetData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const sortableFields = [
        { title: 'Employee Name', field: 'employee_name' },
        { title: 'Memo Received Date', field: 'memo_received_date' },
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

    return (
        <>
            <PageTitle breadcrumbs={[]}>My Memos</PageTitle>

            <div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
                <div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                    <div className='d-flex align-items-center gap-3 flex-wrap'>
                        <div className='d-flex align-items-center position-relative'>
                            <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                        </div>
                    </div>

                    <div className='d-flex align-items-center gap-3'>
                        <LengthMenu
                            expenseData={targetData}
                            handleItemsPerPageChange={handlePageChange}
                        />
                    </div>
                </div>

                <div className='card-body py-4 px-6'>
                    <div className='table-responsive'>
                        <Table
                            data={paginatedtargetData}
                            columns={sortableFields}
                            sort={sort}
                            sortOrder={sortOrder}
                            onSortChange={handleSortChange}
                            renderRow={(employee: any, index: number, actualIndex: number, isVisible: boolean) => (
                                <React.Fragment key={employee.id || index}>
                                    <tr
                                        onClick={() => handleRowClick(employee.id)}
                                        className='data-row'
                                        style={{ verticalAlign: 'middle', borderBottom: '1px solid #f1f1f4' }}>
                                        <td className='text-center py-3' style={{ width: '60px' }}>
                                            <span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>{actualIndex}</span>
                                        </td>
                                        <td className='py-3'>
                                            <span className='text-gray-900 fw-bold fs-6'>
                                                {employee.employee_name}
                                            </span>
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {DayJS(employee.memo_received_date).format('DD/MM/YYYY, hh:mm A')}
                                        </td>
                                        <td className='py-3 text-end pe-4'>
                                            <button
                                                className='btn btn-icon btn-sm btn-light-primary'
                                                style={{ width: '34px', height: '34px', borderRadius: '8px' }}
                                                title='View Memo'>
                                                <FontAwesomeIcon
                                                    icon={faEye}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12} className='p-4 bg-light-primary rounded-3'>
                                                <div className='fs-7'>
                                                    <div><strong>Employee Name:</strong> {employee.employee_name}</div>
                                                    <div><strong>Memo Received Date:</strong> {employee.memo_received_date}</div>
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

                    {filteredtargetData.length === 0 && !loading && (
                        <div className='d-flex flex-column align-items-center justify-content-center py-12 text-center'>
                            <div className='symbol symbol-60px mb-4'>
                                <span className='symbol-label bg-light-primary text-primary fs-2'>📝</span>
                            </div>
                            <h5 className='fw-bold text-gray-800 mb-1'>No Memos Found</h5>
                            <p className='text-muted fs-7 mb-0'>Company memos or official notices issued will appear here.</p>
                        </div>
                    )}

                    <div className='d-flex flex-wrap align-items-center justify-content-between pt-4 pb-2 border-top border-gray-200 mt-3'>
                        <div className='text-muted fs-7 fw-semibold'>
                            Showing {filteredtargetData.length === 0 ? 0 : (pagination.page - 1) * pagination.itemsPerPage + 1} to{' '}
							{Math.min(pagination.page * pagination.itemsPerPage, filteredtargetData.length)} of {filteredtargetData.length} records
                        </div>
                        {filteredtargetData.length > 0 && (
                            <UsersListPagination
                                totalPages={Math.ceil(filteredtargetData.length / pagination.itemsPerPage) || 1}
                                currentPage={pagination.page}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MemoEmployee
