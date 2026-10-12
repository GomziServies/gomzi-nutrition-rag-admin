import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faPlus, faPlusCircle, faUpload, faXmark } from '@fortawesome/free-solid-svg-icons'
import Swal from 'sweetalert2'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const EmployeeLead: React.FC = () => {
    const intl = useIntl()
    const [searchTerm, setSearchTerm] = useState('')
    const [sort, setSort] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc');
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [loading, setLoading] = useState(false);
    const [targetData, setTargetData] = useState<any[]>([
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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        sale.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const paginatedtargetData = filteredtargetData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const notify = () =>
        Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: 'Once Completed, you will not be able to undone!',
            showCancelButton: true,
            confirmButtonText: 'Ok',
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Saved!', '', 'success')
            }
        })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAddFood = () => {
    };

    const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSearchTerm(event.target.value);
    };

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
            <PageTitle breadcrumbs={[]}>Lead</PageTitle>
            <div
                className='accordion card'
                id='kt_accordion_1'>
                <KTCard className='accordion-item mt-5'>
                    <div id='kt_accordion_1_body_1'
                        className='accordion-collapse collapse show'>

                        <div className='row justify-content-between px-5'>
                            <div className="col-3">
                                <div className="row">
                                    <div className="col-md-12">
                                        <label htmlFor='demo' className='required fw-bold fs-6'>Action</label>
                                    </div>
                                    <div className="col-md-3">
                                        <button
                                            data-bs-toggle='modal'
                                            data-bs-target='#kt_modal_food_time'
                                            className='btn gap-2 btn-bg-light btn-active-color-success  btn-sl m-2 mt-5'
                                        >
                                            <FontAwesomeIcon
                                                icon={faPlus}
                                                className='fs-3 text-primary'
                                            />
                                        </button>
                                    </div>
                                    <div className="col-md-3">
                                        <button
                                            className='btn gap-2 btn-bg-light btn-active-color-success  btn-sl m-2 mt-5'
                                        >
                                            <FontAwesomeIcon
                                                icon={faDownload}
                                                className='fs-3 text-info'
                                            />
                                        </button>
                                    </div>
                                    <div className="col-md-3">
                                        <button
                                            data-bs-toggle='modal'
                                            data-bs-target='#kt_modal_food_time_upload'
                                            className='btn gap-2 btn-bg-light btn-active-color-success  btn-sl m-2 mt-5'
                                        >
                                            <FontAwesomeIcon
                                                icon={faUpload}
                                                className='fs-3 text-success'
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className='col-6 d-flex justify-content-end mt-10'>
                                <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                            </div>
                        </div>

                        <div className='py-4 card-body'>
                            <div className='table-responsive'>

                                <Table
                                    data={paginatedtargetData}
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
                                                        {employee.name}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.mobile}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.email}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.place}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {DayJS(employee.date).format('DD/MM/YYYY hh:mm:ss A')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.service}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.client_type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.reference}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.note}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                                        {employee.file}
                                                    </span>
                                                </td>
                                                <tr key={index}>
                                                    <button
                                                        className='btn btn-success btn-sm'
                                                        data-bs-toggle='modal'
                                                        data-bs-target='#kt_modal_food_time'>
                                                        Edit
                                                    </button>
                                                </tr>
                                            </tr>
                                            {isVisible && (
                                                <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                                    <td colSpan={12}>
                                                        <div>
                                                            <strong>{sortableFields[0].title}:</strong>  {employee.name}
                                                            <br />
                                                            <strong>{sortableFields[1].title}:</strong> {employee.mobile}
                                                            <br />
                                                            <strong>{sortableFields[2].title}:</strong> {employee.email}
                                                            <br />
                                                            <strong>{sortableFields[3].title}:</strong> {employee.place}
                                                            <br />
                                                            <strong>{sortableFields[4].title}:</strong> {DayJS(employee.date).format('DD/MM/YYYY hh:mm:ss A')}
                                                            <br />
                                                            <strong>{sortableFields[5].title}:</strong> {employee.service}
                                                            <br />
                                                            <strong>{sortableFields[6].title}:</strong> {employee.client_type}
                                                            <br />
                                                            <strong>{sortableFields[7].title}:</strong> {employee.reference}
                                                            <br />
                                                            <strong>{sortableFields[8].title}:</strong> {employee.note}
                                                            <br />
                                                            <strong>{sortableFields[9].title}:</strong> {employee.file}
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
                            {targetData.length === 0 && !loading && (
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

                </KTCard>
            </div>

            <div
                className='modal fade'
                id='kt_modal_food_time_upload'
                aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-650px'>
                    <div className='modal-content'>
                        <div className='modal-header justify-content-between'>
                            <h2 className='fw-bolder'>Upload Lead</h2>
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
                            <div className='row'>
                                <div className='col-12 fv-row mb-7'>
                                    <label htmlFor='file_upload' className='form-label'>
                                        Choose File
                                    </label>
                                    <input
                                        type='file'
                                        className='form-control'
                                        id='file_upload'
                                        name='file_upload'
                                        onChange={(e) => handleFileChange(e)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='modal-footer justify-content-end'>
                            <button
                                onClick={handleAddFood}
                                className='btn btn-primary'
                                data-bs-dismiss='modal'>
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className='modal fade'
                id='kt_modal_food_time'
                aria-hidden='true'>
                <div className='modal-dialog modal-dialog-centered mw-650px'>
                    <div className='modal-content'>
                        <div className='modal-header justify-content-between'>
                            <h2 className='fw-bolder'>Add Lead</h2>
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
                            <div className='row'>
                                <InputField
                                    placeholder='Name'
                                    type='text'
                                    className='col-12 fv-row mb-7'
                                    name='name'
                                    label='Name'
                                    htmlFor='name'
                                    onChange={(e) => handleInputChange(e)}
                                />
                                <SelectField
                                    className='fv-row m-0'
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
                                <SelectField
                                    className='fv-row m-0'
                                    label='Client'
                                    name='Filter Subject'
                                    value={searchTerm}
                                    onChange={handleSelectChange}
                                    htmlFor='Filter Subject'
                                    options={[
                                        'All Data',
                                        'Client 1',
                                        'Client 2',
                                        'Client 3',
                                    ]}
                                />
                                <InputField
                                    placeholder='Date'
                                    type='date'
                                    className='col-12 fv-row mb-7'
                                    name='date'
                                    label='Date'
                                    htmlFor='date'
                                    onChange={(e) => handleInputChange(e)}
                                />
                                <InputField
                                    placeholder='Mobile Number'
                                    type='text'
                                    className='col-12 fv-row mb-7'
                                    name='mobile_number'
                                    label='Mobile Number'
                                    htmlFor='mobile_number'
                                    onChange={(e) => handleInputChange(e)}
                                />
                                <InputField
                                    placeholder='Email'
                                    type='email'
                                    className='col-12 fv-row mb-7'
                                    name='email'
                                    label='Email'
                                    htmlFor='email'
                                    onChange={(e) => handleInputChange(e)}
                                />
                                <InputField
                                    placeholder='Place'
                                    type='text'
                                    className='col-12 fv-row mb-7'
                                    name='place'
                                    label='Place'
                                    htmlFor='place'
                                    onChange={(e) => handleInputChange(e)}
                                />
                                <InputField
                                    placeholder='Photo'
                                    type='file'
                                    className='col-12 fv-row mb-7'
                                    name='Photo'
                                    label='Photo'
                                    htmlFor='Photo'
                                    onChange={(e) => handleInputChange(e)}
                                />
                                <SelectField
                                    className='fv-row m-0'
                                    label='Reference'
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
                                <InputField
                                    placeholder='Note'
                                    type='text'
                                    className='col-12 fv-row mb-7'
                                    name='note'
                                    label='Note'
                                    htmlFor='note'
                                    onChange={(e) => handleInputChange(e)}
                                />
                            </div>
                        </div>
                        <div className='modal-footer justify-content-end'>
                            <button
                                className='btn btn-primary'
                                data-bs-dismiss='modal'>
                                Add Lead
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EmployeeLead
