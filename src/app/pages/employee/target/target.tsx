import { faPlusCircle, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PageTitle } from '../../../../_metronic/layout/core'
import InputField from '../../../components/InputField'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { CreateTarget, GetTarget, UpdateTarget } from '../../../Functions/FGGroup/Target'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployeeTarget: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [targetData, setTargetData] = useState<any[]>([])
    const [targetAddData, setTargetAddData] = useState({
        target_title: '',
        from_date: '',
        to_date: '',
        target_description: '',
        position: '',
    })
    const [targetUpdateData, setTargetUpdateData] = useState({
        target_id: '',
        target_title: '',
        from_date: '',
        to_date: '',
        target_description: '',
        position: '',
    })
    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })

    const getStoredEmployee = () => {
        try {
            const raw =
                localStorage.getItem('fg_group_user_info') ||
                localStorage.getItem('fg_group_info') ||
                localStorage.getItem('auth_fg_group')
            return raw ? JSON.parse(raw) : {}
        } catch {
            return {}
        }
    }

    const fetchAssignTaskData = async () => {
        setLoading(true)
        try {
            const employee = getStoredEmployee()
            const empId = employee?._id || employee?.id
            let empPosition = employee?.position

            if (empId) {
                try {
                    const positionData: any = await GetEmployees({ id: empId })
                    if (positionData?.data?.[0]?.employee?.position) {
                        empPosition = positionData.data[0].employee.position
                    }
                } catch (posErr) {
                    console.warn('Could not fetch employee profile position:', posErr)
                }
            }

            const response: any = await GetTarget()
            let filteredData: any[] = response?.data || []

            if (empPosition) {
                const targetMatches = filteredData.filter(
                    (el: any) => !el.position || el.position.toLowerCase() === empPosition.toLowerCase()
                )
                // If filtered data has items, use it; otherwise show all targets
                if (targetMatches.length > 0) {
                    filteredData = targetMatches
                }
            }
            setTargetData(filteredData)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchAssignTaskData()
    }, [searchTerm])

    const handleSubmit = async () => {
        try {
            const { target_title, from_date, to_date, target_description, position } = targetAddData

            const payload: any = {
                target_title,
                from_date,
                to_date,
                target_description,
                position,
            }

            await CreateTarget(payload)
            toast.success('Target Created Successfully')

            fetchAssignTaskData()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create target')
            console.error(error)
        }
    }

    const handleUpdate = async () => {
        try {
            const { target_id, target_title, from_date, to_date, target_description, position } =
                targetUpdateData

            const payload: any = {
                target_id: target_id,
                target_title,
                from_date,
                to_date,
                target_description,
                position,
            }

            await UpdateTarget(payload)
            toast.success('Target Updated Successfully')

            fetchAssignTaskData()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update target')
            console.error(error)
        }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target
        setTargetAddData({ ...targetAddData, [name]: value })
    }

    const handleUpdateInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target
        setTargetUpdateData({ ...targetUpdateData, [name]: value })
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const filteredtargetData = targetData.filter((sale) =>
        (sale.target_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.target_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.position || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    const paginatedtargetData = filteredtargetData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const sortableFields = [
        { title: 'Target Title', field: 'target_title' },
        { title: 'Description', field: 'target_description' },
        { title: 'Position', field: 'position' },
        { title: 'Start Date', field: 'createdAt' },
        { title: 'End Date', field: 'updatedAt' },
        { title: 'Target Days', field: 'days' },
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
            <PageTitle breadcrumbs={[]}>My Targets</PageTitle>

            <div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
                <div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                    <div className='d-flex align-items-center gap-3 flex-wrap'>
                        <div className='d-flex align-items-center position-relative'>
                            <SearchFilter
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                            />
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
                            removeAction={true}
                            onSortChange={handleSortChange}
                            renderRow={(target: any, index: number, actualIndex: number, isVisible: boolean) => (
                                <React.Fragment key={target._id || index}>
                                    <tr
                                        onClick={() => handleRowClick(target._id)}
                                        className='data-row'
                                        style={{ verticalAlign: 'middle', borderBottom: '1px solid #f1f1f4' }}>
                                        <td className='text-center py-3'>
                                            <div className='d-flex align-items-center justify-content-center'>
                                                <span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>
                                                    {actualIndex}
                                                </span>
                                            </div>
                                        </td>
                                        <td className='py-3'>
                                            <span className='text-gray-900 fw-bold fs-6'>
                                                {target.target_title || 'N/A'}
                                            </span>
                                        </td>
                                        <td className='py-3'>
                                            <span className='text-gray-700 fs-7'>
                                                {target.target_description || 'N/A'}
                                            </span>
                                        </td>
                                        <td className='py-3'>
                                            <span className='badge badge-light-primary fw-semibold px-3 py-1' style={{ borderRadius: '6px' }}>
                                                {target.position || 'All Roles'}
                                            </span>
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {target.createdAt ? DayJS(target.createdAt).format('DD/MM/YYYY, hh:mm A') : 'N/A'}
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {target.updatedAt ? DayJS(target.updatedAt).format('DD/MM/YYYY, hh:mm A') : 'N/A'}
                                        </td>
                                        <td className='py-3'>
                                            <span className='badge badge-light-info fw-bold px-3 py-1' style={{ borderRadius: '6px' }}>
                                                {target.createdAt && target.updatedAt ? DayJS(target.updatedAt).diff(DayJS(target.createdAt), 'day') : '0'} Days
                                            </span>
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12} className='p-4 bg-light-primary rounded-3'>
                                                <div className='fs-7'>
                                                    <div><strong>Target Title:</strong> {target.target_title || 'N/A'}</div>
                                                    <div><strong>Description:</strong> {target.target_description || 'N/A'}</div>
                                                    <div><strong>Position:</strong> {target.position || 'N/A'}</div>
                                                    <div><strong>Start Date:</strong> {target.createdAt ? DayJS(target.createdAt).format('DD/MM/YYYY, hh:mm:ss A') : 'N/A'}</div>
                                                    <div><strong>End Date:</strong> {target.updatedAt ? DayJS(target.updatedAt).format('DD/MM/YYYY, hh:mm:ss A') : 'N/A'}</div>
                                                    <div><strong>Target Days:</strong> {target.createdAt && target.updatedAt ? DayJS(target.updatedAt).diff(DayJS(target.createdAt), 'day') : 'N/A'} Days</div>
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
                                <span className='symbol-label bg-light-primary text-primary fs-2'>🎯</span>
                            </div>
                            <h5 className='fw-bold text-gray-800 mb-1'>No Targets Assigned</h5>
                            <p className='text-muted fs-7 mb-0'>Targets assigned to your role or position will appear here.</p>
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

            {/* target add modal */}
            <div
                className='modal fade'
                id='kt_modal_target_add'
                aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-650px'>
                    <div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
                            <h3 className='fw-bolder text-gray-900 m-0'>Add New Target</h3>
                            <button
                                type='button'
                                className='btn btn-sm btn-icon btn-light-danger rounded-circle'
                                data-bs-dismiss='modal'>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className='modal-body p-6'>
                            <div className='row g-4'>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Target Title'
                                        type='text'
                                        name='target_title'
                                        label='Target Title'
                                        htmlFor='target_title'
                                        value={targetAddData.target_title}
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Target Description'
                                        type='text'
                                        name='target_description'
                                        label='Target Description'
                                        htmlFor='target_description'
                                        value={targetAddData.target_description}
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='From Date'
                                        type='date'
                                        name='from_date'
                                        label='From Date'
                                        htmlFor='from_date'
                                        value={targetAddData.from_date}
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='To Date'
                                        type='date'
                                        name='to_date'
                                        label='To Date'
                                        htmlFor='to_date'
                                        value={targetAddData.to_date}
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-12'>
                                    <SelectField
                                        className=''
                                        name='position'
                                        label='Set position For'
                                        htmlFor='position'
                                        value={targetAddData.position}
                                        onChange={handleInputChange}
                                        options={[
                                            'Developer',
                                            'Marketing',
                                            'Franchise Owner',
                                            'Graphic Designer',
                                            'Telecalling',
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='modal-footer border-top border-gray-200 px-6 py-4'>
                            <button
                                type='button'
                                className='btn btn-light rounded-pill px-5 fw-semibold'
                                data-bs-dismiss='modal'>
                                Cancel
                            </button>
                            <button
                                className='btn btn-primary rounded-pill px-6 fw-bold'
                                data-bs-dismiss='modal'
                                onClick={() => handleSubmit()}>
                                Save Target
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* target Update modal */}
            <div
                className='modal fade'
                id='kt_modal_target_update'
                aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-650px'>
                    <div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
                            <h3 className='fw-bolder text-gray-900 m-0'>Update Target</h3>
                            <button
                                type='button'
                                className='btn btn-sm btn-icon btn-light-danger rounded-circle'
                                data-bs-dismiss='modal'>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className='modal-body p-6'>
                            <div className='row g-4'>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Target Title'
                                        type='text'
                                        name='target_title'
                                        label='Target Title'
                                        htmlFor='target_title'
                                        value={targetUpdateData.target_title}
                                        onChange={(e) => handleUpdateInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Target Description'
                                        type='text'
                                        name='target_description'
                                        label='Target Description'
                                        htmlFor='target_description'
                                        value={targetUpdateData.target_description}
                                        onChange={(e) => handleUpdateInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='From Date'
                                        type='date'
                                        name='from_date'
                                        label='From Date'
                                        htmlFor='from_date'
                                        value={targetUpdateData.from_date ? DayJS(targetUpdateData.from_date).format('YYYY-MM-DD') : ''}
                                        onChange={(e) => handleUpdateInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='To Date'
                                        type='date'
                                        name='to_date'
                                        label='To Date'
                                        htmlFor='to_date'
                                        value={targetUpdateData.to_date ? DayJS(targetUpdateData.to_date).format('YYYY-MM-DD') : ''}
                                        onChange={(e) => handleUpdateInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-12'>
                                    <SelectField
                                        className=''
                                        name='position'
                                        label='Set position For'
                                        htmlFor='position'
                                        value={targetUpdateData.position}
                                        onChange={(e) => handleUpdateInputChange(e)}
                                        options={[
                                            'Developer',
                                            'Marketing',
                                            'Franchise Owner',
                                            'Graphic Designer',
                                            'Telecalling',
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='modal-footer border-top border-gray-200 px-6 py-4'>
                            <button
                                type='button'
                                className='btn btn-light rounded-pill px-5 fw-semibold'
                                data-bs-dismiss='modal'>
                                Cancel
                            </button>
                            <button
                                className='btn btn-primary rounded-pill px-6 fw-bold'
                                data-bs-dismiss='modal'
                                onClick={() => handleUpdate()}>
                                Update Target
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EmployeeTarget
