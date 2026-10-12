import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const MemoEmployee: React.FC = () => {
    const intl = useIntl()
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false);
    const [sort, setSort] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc');
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [targetData, setTargetData] = useState<any[]>([
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
        sale.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <PageTitle breadcrumbs={[]}>Target</PageTitle>
            <div
                className='accordion card'
                id='kt_accordion_1'>
                <KTCard className='accordion-item mt-5'>
                    <div id='kt_accordion_1_body_1'
                        className='accordion-collapse collapse show'>

                        <div className='row justify-content-between px-5'>
                            <div className='col-12 d-flex justify-content-end mt-10'>
                                <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                            </div>
                        </div>

                        <div className='py-4 card-body'>
                            <div className='table-responsive'>

                                <Table
                                    data={targetData}
                                    columns={sortableFields}
                                    sort={sort}
                                    sortOrder={sortOrder}
                                    onSortChange={handleSortChange}
                                    renderRow={(employee: any, index: number, actualIndex: number, isVisible: boolean) => (
                                        <React.Fragment key={employee._id}>
                                            <tr
                                                onClick={() => handleRowClick(employee._id)}
                                                className='data-row'>
                                                <td className='text-center'>
                                                    <div className='d-flex'>
                                                        <FontAwesomeIcon
                                                            icon={faPlusCircle}
                                                            className='mx-2 ms-5 mb-1 plus-icon'
                                                            style={{ color: '#607D8B', fontSize: '18px' }}
                                                        />
                                                        <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                            {actualIndex}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.employee_name}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {DayJS(employee.memo_received_date).format('DD/MM/YYYY hh:mm:ss A')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className='btn btn-success btn-sm'>
                                                        <FontAwesomeIcon
                                                            icon={faEye}
                                                            className='fs-3 text-white'
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                            {isVisible && (
                                                <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                                    <td colSpan={12}>
                                                        <div>
                                                            <strong>{sortableFields[0].title}:</strong> {employee.employee_name}
                                                            <br />
                                                            <strong>{sortableFields[1].title}:</strong> {employee.memo_received_date}
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
                            {targetData.length === 0 && (
                                <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                                    <b>No records found</b>
                                </div>
                            )}
                            {targetData.length > 0 && (
                                <UsersListPagination
                                    totalPages={Math.ceil(targetData.length / pagination.itemsPerPage)}
                                    currentPage={pagination.page}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </div>
                    </div>

                    {/* target add modal */}
                    <div
                        className='modal fade'
                        id='kt_modal_target_add'
                        aria-hidden='true'>
                        <div className='modal-dialog modal-dialog-centered mw-650px'>
                            <div className='modal-content'>
                                <div className='modal-header justify-content-between'>
                                    <h2 className='fw-bolder'>Add New Target</h2>
                                    <div
                                        className='btn btn-sm btn-icon btn-active-color-primary'
                                        data-bs-dismiss='modal'>
                                        <FontAwesomeIcon
                                            className='fs-1 position-absolute ms-3'
                                            icon={faXmark}
                                        />
                                    </div>
                                </div>
                                <div className='modal-body scroll-y'>
                                    <div className='col-md-12'>
                                        <div className='row'>
                                            <div className='col-md-6 fv-row mb-7'>
                                                <SelectField
                                                    className='col-12 fv-row'
                                                    name='branch'
                                                    label='Branch'
                                                    htmlFor='branch'
                                                    value={targetAddData.branch}
                                                    onChange={handleInputChange}
                                                    options={["Fitness With Gomzi", "FG Meals", "FG IT", "FG Digital"]}
                                                />
                                            </div>
                                            <div className='col-md-6 fv-row mb-7'>
                                                <InputField
                                                    placeholder='Target Title'
                                                    type='text'
                                                    className='col-12 fv-row mb-7'
                                                    name='title'
                                                    label='Target Title'
                                                    htmlFor='title'
                                                    value={targetAddData.title}
                                                    onChange={(e) => handleInputChange(e)}
                                                />
                                            </div>
                                            <div className='col-md-6 fv-row mb-7'>
                                                <InputField
                                                    placeholder='Description'
                                                    type='text'
                                                    className='col-12 fv-row mb-7'
                                                    name='description'
                                                    label='Description'
                                                    htmlFor='description'
                                                    value={targetAddData.description}
                                                    onChange={(e) => handleInputChange(e)}
                                                />
                                            </div>
                                            <div className='col-md-6 fv-row mb-7'>
                                                <InputField
                                                    placeholder='Start Date'
                                                    type='date'
                                                    className='col-12 fv-row mb-7'
                                                    name='start_date'
                                                    label='Start Date'
                                                    htmlFor='start_date'
                                                    value={targetAddData.start_date}
                                                    onChange={(e) => handleInputChange(e)}
                                                />
                                            </div>
                                            <div className='col-md-6 fv-row mb-7'>
                                                <InputField
                                                    placeholder='End Date'
                                                    type='date'
                                                    className='col-12 fv-row mb-7'
                                                    name='end_date'
                                                    label='End Date'
                                                    htmlFor='end_date'
                                                    value={targetAddData.end_date}
                                                    onChange={(e) => handleInputChange(e)}
                                                />
                                            </div>
                                            <div className='col-md-6 fv-row mb-7'>
                                                <SelectField
                                                    className='col-12 fv-row'
                                                    name='target'
                                                    label='Set Target For'
                                                    htmlFor='target'
                                                    value={targetAddData.target}
                                                    onChange={handleInputChange}
                                                    options={["Public Relation [PR]", "Content Writer", "Human Resource [HR]", "General Manager", "Marketing", "Franchise Owner"]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='modal-footer justify-content-end'>
                                    <button
                                        className='btn btn-primary'
                                        data-bs-dismiss='modal'>
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </KTCard>
            </div>
        </>
    )
}

export default MemoEmployee
