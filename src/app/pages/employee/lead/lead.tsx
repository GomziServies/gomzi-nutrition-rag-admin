import React, { useState } from 'react'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import LengthMenu from '../../../components/LengthMenu'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faEdit, faPlus, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployeeLead: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [sort, setSort] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [loading] = useState(false)
    const [targetData] = useState<any[]>([
        {
            id: 1,
            name: 'xys',
            mobile: '7486873619',
            email: '-',
            place: 'surat',
            date: '2022/09/30',
            service: 'RTP Program',
            client_type: '-',
            reference: 'divyesh',
            note: 'new',
            file: '102021115.jpg',
        },
        {
            id: 2,
            name: 'abc',
            mobile: '8737873619',
            email: '-',
            place: 'surat',
            date: '2022/09/30',
            service: 'RTP Program',
            client_type: '-',
            reference: 'divyesh',
            note: 'new',
            file: '102021115.jpg',
        },
        {
            id: 3,
            name: 'xys',
            mobile: '7486873619',
            email: '-',
            place: 'surat',
            date: '2022/09/30',
            service: 'RTP Program',
            client_type: '-',
            reference: 'divyesh',
            note: 'new',
            file: '102021115.jpg',
        },
    ])

    const [, setSelectedFile] = useState<File | null>(null)
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

    const filteredtargetData = targetData.filter((sale: any) =>
        (sale.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.service || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const paginatedtargetData = filteredtargetData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleAddFood = () => {
        Swal.fire({
            icon: 'success',
            title: 'File Uploaded Successfully',
            timer: 1500,
            showConfirmButton: false,
        })
    }

    const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSearchTerm(event.target.value)
    }

    const sortableFields = [
        { title: 'Name', field: 'name' },
        { title: 'Mobile', field: 'mobile' },
        { title: 'Email', field: 'email' },
        { title: 'Place', field: 'place' },
        { title: 'Date', field: 'date' },
        { title: 'Service', field: 'service' },
        { title: 'Client Type', field: 'client_type' },
        { title: 'Reference', field: 'reference' },
        { title: 'Note', field: 'note' },
        { title: 'File', field: 'file' },
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
            <PageTitle breadcrumbs={[]}>Lead Management</PageTitle>

            <div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
                <div className='card-header border-0 pt-6 pb-4 px-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                    <div className='d-flex align-items-center gap-3 flex-wrap'>
                        <div className='d-flex align-items-center position-relative'>
                            <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                        </div>
                    </div>

                    <div className='d-flex align-items-center gap-3 flex-wrap'>
                        <button
                            data-bs-toggle='modal'
                            data-bs-target='#kt_modal_food_time'
                            className='btn btn-primary rounded-pill px-5 fw-bold d-inline-flex align-items-center gap-2'>
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Add Lead</span>
                        </button>

                        <button
                            className='btn btn-light-info rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2'
                            onClick={() => Swal.fire('Downloaded', 'Exporting leads CSV...', 'success')}>
                            <FontAwesomeIcon icon={faDownload} />
                            <span>Export</span>
                        </button>

                        <button
                            data-bs-toggle='modal'
                            data-bs-target='#kt_modal_food_time_upload'
                            className='btn btn-light-success rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-2'>
                            <FontAwesomeIcon icon={faUpload} />
                            <span>Bulk Upload</span>
                        </button>

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
                                            <span className='badge badge-light-secondary fw-bolder px-2 py-1' style={{ borderRadius: '6px' }}>
                                                {actualIndex}
                                            </span>
                                        </td>
                                        <td className='py-3'>
                                            <span className='text-gray-900 fw-bold fs-6'>
                                                {employee.name}
                                            </span>
                                        </td>
                                        <td className='py-3 text-gray-700 fs-7'>
                                            {employee.mobile}
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {employee.email}
                                        </td>
                                        <td className='py-3 text-gray-700 fs-7'>
                                            {employee.place}
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {DayJS(employee.date).format('DD/MM/YYYY')}
                                        </td>
                                        <td className='py-3'>
                                            <span className='badge badge-light-primary fw-semibold px-2 py-1' style={{ borderRadius: '6px' }}>
                                                {employee.service}
                                            </span>
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {employee.client_type}
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {employee.reference}
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {employee.note}
                                        </td>
                                        <td className='py-3 text-muted fs-7'>
                                            {employee.file}
                                        </td>
                                        <td className='py-3 text-end pe-4'>
                                            <button
                                                className='btn btn-icon btn-sm btn-light-success'
                                                style={{ width: '34px', height: '34px', borderRadius: '8px' }}
                                                data-bs-toggle='modal'
                                                data-bs-target='#kt_modal_food_time'
                                                title='Edit Lead'>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                        </td>
                                    </tr>
                                    {isVisible && (
                                        <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                            <td colSpan={12} className='p-4 bg-light-primary rounded-3'>
                                                <div className='fs-7'>
                                                    <div><strong>Name:</strong> {employee.name}</div>
                                                    <div><strong>Mobile:</strong> {employee.mobile}</div>
                                                    <div><strong>Email:</strong> {employee.email}</div>
                                                    <div><strong>Place:</strong> {employee.place}</div>
                                                    <div><strong>Date:</strong> {DayJS(employee.date).format('DD/MM/YYYY hh:mm:ss A')}</div>
                                                    <div><strong>Service:</strong> {employee.service}</div>
                                                    <div><strong>Client Type:</strong> {employee.client_type}</div>
                                                    <div><strong>Reference:</strong> {employee.reference}</div>
                                                    <div><strong>Note:</strong> {employee.note}</div>
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
                                <span className='symbol-label bg-light-primary text-primary fs-2'>👥</span>
                            </div>
                            <h5 className='fw-bold text-gray-800 mb-1'>No Leads Found</h5>
                            <p className='text-muted fs-7 mb-0'>No leads matching your search criteria.</p>
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

            {/* Upload Lead Modal */}
            <div
                className='modal fade'
                id='kt_modal_food_time_upload'
                aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-600px'>
                    <div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
                            <h3 className='fw-bolder text-gray-900 m-0'>Bulk Upload Leads</h3>
                            <button
                                type='button'
                                className='btn btn-sm btn-icon btn-light-danger rounded-circle'
                                data-bs-dismiss='modal'>
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>
                        <div className='modal-body p-6'>
                            <div className='row g-4'>
                                <div className='col-12'>
                                    <label htmlFor='file_upload' className='form-label fw-bold text-gray-800 mb-2'>
                                        Choose Spreadsheet (CSV / Excel)
                                    </label>
                                    <input
                                        type='file'
                                        className='form-control rounded-3'
                                        id='file_upload'
                                        name='file_upload'
                                        onChange={(e) => handleFileChange(e)}
                                    />
                                    <span className='text-muted fs-8 mt-1 d-block'>
                                        Supported formats: .csv, .xlsx. Max file size: 10MB.
                                    </span>
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
                                onClick={handleAddFood}
                                className='btn btn-primary rounded-pill px-6 fw-bold'
                                data-bs-dismiss='modal'>
                                Upload File
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add / Edit Lead Modal */}
            <div
                className='modal fade'
                id='kt_modal_food_time'
                aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-650px'>
                    <div className='modal-content border-0 shadow' style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <div className='modal-header border-bottom border-gray-200 px-6 py-4 d-flex align-items-center justify-content-between'>
                            <h3 className='fw-bolder text-gray-900 m-0'>Lead Details</h3>
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
                                        placeholder='Lead Name'
                                        type='text'
                                        name='name'
                                        label='Full Name'
                                        htmlFor='name'
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Mobile Number'
                                        type='text'
                                        name='mobile_number'
                                        label='Mobile Number'
                                        htmlFor='mobile_number'
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Email Address'
                                        type='email'
                                        name='email'
                                        label='Email'
                                        htmlFor='email'
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <InputField
                                        placeholder='Place / City'
                                        type='text'
                                        name='place'
                                        label='Place'
                                        htmlFor='place'
                                        onChange={(e) => handleInputChange(e)}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <SelectField
                                        className=''
                                        label='Service'
                                        name='Filter Subject'
                                        value={searchTerm}
                                        onChange={handleSelectChange}
                                        htmlFor='Filter Subject'
                                        options={[
                                            'All plan',
                                            'Marketing Guru',
                                            'Portfolio management service',
                                            'Management Consultation',
                                            'Business management course',
                                            'Digital marketing course',
                                            'Stock market course',
                                            'Content shoot & Edit',
                                            'Graphics designing',
                                            'Social Media marketing',
                                            'Website designing and development',
                                            'Paid Advertisement',
                                            'Content writing',
                                            'SEO- Search engine optimization',
                                            'SEM- Search engine management',
                                            'GMB- Google my business profile maintain',
                                            'ERP setup and service',
                                            'Business solution',
                                            'Logo design',
                                        ]}
                                    />
                                </div>
                                <div className='col-md-6'>
                                    <SelectField
                                        className=''
                                        label='Reference Source'
                                        name='Filter Subject'
                                        value={searchTerm}
                                        onChange={handleSelectChange}
                                        htmlFor='Filter Subject'
                                        options={[
                                            'Google',
                                            'Social Media',
                                            'Facebook Ads',
                                            'Instagram',
                                        ]}
                                    />
                                </div>
                                <div className='col-12'>
                                    <InputField
                                        placeholder='Note or discussion remarks'
                                        type='text'
                                        name='note'
                                        label='Remarks / Notes'
                                        htmlFor='note'
                                        onChange={(e) => handleInputChange(e)}
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
                                data-bs-dismiss='modal'>
                                Save Lead
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EmployeeLead
