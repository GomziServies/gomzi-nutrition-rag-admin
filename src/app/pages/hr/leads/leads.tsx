import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import SelectField from '../../../components/SelectField'
import SearchFilter from '../../../components/SearchFilter'
import LengthMenu from '../../../components/LengthMenu'
import Table from '../../../components/Table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import TableButton from '../../../components/TableButton'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const HRLead: React.FC = () => {
    const intl = useIntl()
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false);
    const [metaData, setMetaData] = useState<any>();
    const [sort, setSort] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc');
    const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
    const [leadsAddData, setLeadsAddData] = useState({
        employee: '',
        client: '',
    })
    const [leadsData, setleadsData] = useState<any[]>([
        {
            id: 1,
            name: 'abc',
            email: 'Brand Posting',
            mobile: '98765432',
            place: 'N/A',
            date: 'N/A',
            service: '12-05-2023',
            client_type: 'Confirmed By Employee',
            reference: 'N/A',
            note: 'Posting Done',
            file: 'Posting Done',
            status: 'Posting Done',
        },
        {
            id: 2,
            name: 'xyz',
            email: 'Brand Posting',
            mobile: '98765432',
            place: 'N/A',
            date: 'N/A',
            service: '12-05-2023',
            client_type: 'Confirmed By Employee',
            reference: 'N/A',
            note: 'Posting Done',
            file: 'Posting Done',
            status: 'Posting Done',
        },
        {
            id: 3,
            name: 'Weekly',
            email: 'Brand Posting',
            mobile: '98765432',
            place: 'N/A',
            date: 'N/A',
            service: '12-05-2023',
            client_type: 'Confirmed By Employee',
            reference: 'N/A',
            note: 'Posting Done',
            file: 'Posting Done',
            status: 'Posting Done',
        },
    ])

    const [pagination, setPagination] = useState({
        page: 1,
        itemsPerPage: 10,
    })

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, name, value } = event.target

        setLeadsAddData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handlePageChange = (page: number) => {
        setPagination({ ...pagination, page })
    }

    const filteredleadsData = leadsData.filter((sale) =>
        sale.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const paginatedleadsData = filteredleadsData.slice(
        (pagination.page - 1) * pagination.itemsPerPage,
        pagination.page * pagination.itemsPerPage
    )

    const sortableFields = [
        { title: 'Name', field: 'name' },
        { title: 'Mobile', field: 'mobile' },
        { title: 'Email', field: 'email' },
        { title: 'Place', field: 'place' },
        { title: 'date', field: 'date' },
        { title: 'Service', field: 'service' },
        { title: 'Client Type', field: 'client_type' },
        { title: 'Reference', field: 'reference' },
        { title: 'Note', field: 'note' },
        { title: 'File', field: 'file' },
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

    return (
        <>
            <PageTitle breadcrumbs={[]}>Employee Leads</PageTitle>
            <div
                className='accordion card'
                id='kt_accordion_1'>
                <KTCard className='accordion-item'>
                    <h2
                        className='accordion-header'
                        id='kt_accordion_1_header_1'>
                        <button
                            className='accordion-button fs-2 fw-bold collapsed'
                            type='button'
                            data-bs-toggle='collapse'
                            data-bs-target='#kt_accordion_1_body_1'
                            aria-expanded='false'
                            aria-controls='kt_accordion_1_body_1'>
                            Leads
                        </button>
                    </h2>
                    <div
                        id='kt_accordion_1_body_1'
                        className='accordion-collapse collapse show'
                        aria-labelledby='kt_accordion_1_header_1'
                        data-bs-parent='#kt_accordion_1'>
                        <div className='px-5'>
                            <div className='row mt-3'>
                                <div className='col-md-3 fv-row mb-7'>
                                    <SelectField
                                        className='col-12 fv-row'
                                        name='employee'
                                        label='Employee'
                                        htmlFor='employee'
                                        value={leadsAddData.employee}
                                        onChange={handleInputChange}
                                        options={["Yogesh beldar", "Smit Luvani", "FORAM DESAI ", "GAUTAM JANI", "Dt. Vansh shah", "Kama rajwadi", "DT. NITIN PATEL Nitin patel"]}
                                    />
                                </div>
                                <div className='col-md-3 fv-row mb-7'>
                                    <SelectField
                                        className='col-12 fv-row'
                                        name='client'
                                        label='Choose Client Type'
                                        htmlFor='client'
                                        value={leadsAddData.client}
                                        onChange={handleInputChange}
                                        options={["All", "Interested", "Potential", "Not Interested"]}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='row'>
                            <div className='col-12'>
                                <div className='d-flex align-items-center justify-content-between'>
                                    <div className='ms-5 d-flex'>
                                        <SearchFilter
                                            searchTerm={searchTerm}
                                            setSearchTerm={setSearchTerm}
                                        />
                                    </div>
                                    <div className='mt-1 me-4'>
                                        <LengthMenu
                                            expenseData={leadsData}
                                            handleItemsPerPageChange={handlePageChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='py-4 card-body'>
                            <div className='table-responsive'>
                                <Table
                                    data={leadsData}
                                    columns={sortableFields}
                                    sort={sort}
                                    sortOrder={sortOrder}
                                    onSortChange={handleSortChange}
                                    renderRow={(lead: any, index: number, actualIndex: number, isVisible: boolean) => (
                                        <React.Fragment key={lead._id}>
                                            <tr
                                                onClick={() => handleRowClick(lead._id)}
                                                className='data-row'>
                                                <td className='text-center'>
                                                    <div className='d-flex'>
                                                        <FontAwesomeIcon
                                                            icon={faPlusCircle}
                                                            className='mx-2 ms-5 mb-1 plus-icon'
                                                            style={{ color: '#607D8B', fontSize: '18px' }}
                                                        />
                                                        <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                            {actualIndex}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.name}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.mobile}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.email}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.place}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {DayJS(lead.date).format('DD/MM/YYYY hh:mm:ss A')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.service}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.client_type}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.reference}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.note}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.file}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div data-bs-toggle='modal'
                                                        data-bs-target='#kt_modal_2'>
                                                        <TableButton
                                                            action="edit"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            {isVisible && (
                                                <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                                                    <td colSpan={12}>
                                                        <div>
                                                            <strong>{sortableFields[0].title}:</strong> {lead.name}
                                                            <br />
                                                            <strong>{sortableFields[1].title}:</strong> {lead.mobile}
                                                            <br />
                                                            <strong>{sortableFields[2].title}:</strong> {lead.email}
                                                            <br />
                                                            <strong>{sortableFields[3].title}:</strong> {lead.place}
                                                            <br />
                                                            <strong>{sortableFields[4].title}:</strong> {lead.date}
                                                            <br />
                                                            <strong>{sortableFields[5].title}:</strong> {lead.service}
                                                            <br />
                                                            <strong>{sortableFields[6].title}:</strong> {lead.client_type}
                                                            <br />
                                                            <strong>{sortableFields[7].title}:</strong> {lead.reference}
                                                            <br />
                                                            <strong>{sortableFields[8].title}:</strong> {lead.note}
                                                            <br />
                                                            <strong>{sortableFields[9].title}:</strong> {lead.file}
                                                            <br />
                                                            <strong>{sortableFields[10].title}:</strong> {lead.status}
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
                            {leadsData.length === 0 && !loading && (
                                <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
                                    <b>No records found</b>
                                </div>
                            )}
                            {leadsData.length > 0 && (
                                <UsersListPagination
                                    totalPages={Math.ceil(leadsData.length / pagination.itemsPerPage)}
                                    currentPage={pagination.page}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </div>
                    </div>
                </KTCard>
            </div>
        </>
    )
}

export default HRLead
