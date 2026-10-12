import { faEye, faPlusCircle, faQrcode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard, KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import SelectField from '../../../components/SelectField'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdajanBranchEmployees, DeleteAdajanBranchEmployee } from '../../../Functions/FGGroup/AdajanBranchEmployee'

const AdajanBranchEmployeeList: React.FC = () => {
  const intl = useIntl()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const employee_id = searchParams.get('employee_id')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [employeeData, setEmployeeData] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
  const [filterPosition, setFilterPosition] = useState('')
  const [metaData, setMetaData] = useState<any>()
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
  const [employeeViewData, setEmployeeViewData] = useState({
    admin_id: '',
    employee_code: '',
    name: '',
    position: '',
    mobile: '',
    bank_name: '',
    account_details: '',
    IFSC: '',
    email: '',
    salary: '',
    account_detail: '',
    password: '',
    address: '',
    document: {
      isPdf: '',
      fileUrl: '',
    },
  })

  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  })

  const fetchEmployeeData = async (page?: number) => {
    setLoading(true)
    try {
      const response: any = await GetAdajanBranchEmployees({
        page: page || pagination.page,
        limit: pagination.itemsPerPage,
        sort,
        sortOrder,
        search: searchTerm,
        position: filterPosition,
      })

      const employee = response.data

      const filteredData: any = employee.map((item: any) => ({
        _id: item?._id,
        employee_code: item?.employee_code,
        name: item?.name,
        position: item?.position,
        salary: item?.salary,
        email: item?.email,
        address: item?.address,
        photo: item?.photo,
        mobile: item?.mobile,
        bank_name: item?.account_details?.bank_name,
        account_details: item?.account_details?.account_number,
        IFSC: item?.account_details?.IFSC,
        document: item?.document,
      }))
      setEmployeeData(filteredData)


      // const metaData: any = response.metadata
      // setMetaData(metaData.pagination)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployeeData()
  }, [pagination.itemsPerPage, pagination.page, sort, sortOrder, filterPosition])

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (searchTerm.trim() || searchTerm === '') {
      setPagination((prev) => ({ ...prev, page: 1 }))
      if (pagination.page === 1) fetchEmployeeData()
    }
  }, [searchTerm])

  const fetchCourseDataById = async (id: string) => {
    setLoading(true)
    try {
      const response: any = await GetAdajanBranchEmployees({ id: id })
      const employee = response.data[0]

      let isPdf
      let fileUrl

      employee.document.map((member: any) => {
        isPdf = member.link.endsWith('.pdf')
        fileUrl = 'https://files.fggroup.in/' + member.link
      })

      setEmployeeViewData({
        admin_id: employee._id,
        employee_code: employee?.employee_code,
        name: employee.name,
        position: employee?.position,
        mobile: employee.mobile,
        bank_name: employee?.account_details?.bank_name,
        account_details: employee?.account_details?.account_number,
        IFSC: employee?.account_details?.IFSC,
        email: employee.email,
        salary: employee.salary,
        account_detail: employee.account_detail,
        password: '',
        address: employee.address,
        document: {
          isPdf: isPdf || '',
          fileUrl: fileUrl || '',
        },
      })

      setLoading(false)
      setShowModal(true)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const fetchEditEmployeeData = async (employee: any) => {
    setShowModal(true)

    let isPdf
    let fileUrl

    employee?.document.map((member: any) => {
      if (member.document_type == "Google Pay QR Code") {
        isPdf = member.link.endsWith('.pdf')
        fileUrl = 'https://files.fggroup.in/' + member.link
      }
    })

    setEmployeeViewData({
      admin_id: employee?._id,
      employee_code: employee?.employee_code,
      name: employee?.name,
      position: employee?.position,
      mobile: employee?.mobile,
      bank_name: employee?.bank_name,
      account_details: employee?.account_details,
      IFSC: employee?.IFSC,
      email: employee?.email,
      salary: employee?.salary,
      account_detail: employee?.account_detail,
      password: '',
      address: employee?.address,
      document: {
        isPdf: isPdf || '',
        fileUrl: fileUrl || '',
      },
    })
  }

  useEffect(() => {
    if (employee_id) {
      fetchCourseDataById(employee_id)
    }
  }, [employee_id])

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }
  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value })
  }
  // const filteredemployeeData = employeeData.filter((book: any) =>
  //   book.name.toLowerCase().includes(searchTerm.toLowerCase())
  // )
  // const paginatedemployeeData = employeeData
  const paginatedemployeeData = employeeData.slice(
    (pagination.page - 1) * pagination.itemsPerPage,
    pagination.page * pagination.itemsPerPage
  )

  const handleDeleteFeature = async (_id: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Once deleted, you will not be able to recover!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await DeleteAdajanBranchEmployee({ id: _id })
          toast.success('Employee Deleted Successfully')
          fetchEmployeeData()
        } catch (error: any) {
          toast.error(error.message)
          console.error(error)
        }
      }
    })
  }

  const sortableFields = [
    { title: 'Employee Code', field: 'employee_code' },
    { title: 'Name', field: 'name' },
    { title: 'Position', field: 'position' },
    { title: 'Image', field: 'image' },
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
      <PageTitle breadcrumbs={[]}>Team Members</PageTitle>
      <div className='card'>
        <div className='row justify-content-between mt-7 mx-6'>
          <div className='col-md-9'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold fs-3 mb-1'>Adajan Branch Team Members</span>
            </h3>
          </div>
        </div>

        <div className='card-header row border-0 pt-6'>
          <div className='col-md-6 d-flex'>
            <SearchFilter
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            <div className='d-md-block d-none'>
              <LengthMenu
                expenseData={employeeData}
                handleItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>
          <div className='col-md-3 d-flex align-items-center'>
            <select
              className='form-select form-select-solid'
              value={filterPosition}
              onChange={(e) => {
                setFilterPosition(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            >
              <option value=''>All Positions</option>
              <option value='Trainer'>Trainer</option>
              <option value='Yoga'>Yoga</option>
              <option value='Zumba'>Zumba</option>
              <option value='Admin'>Admin</option>
              <option value='Dietitian'>Dietitian</option>
              <option value='Other'>Other</option>
            </select>
          </div>
          <div className='col-md-3 pe-md-6 d-flex justify-content-end align-items-center'>
            <Link to='/adajan-branch/employee/add'>
              <button className='btn btn-sm py-4 btn-primary'>
                <KTIcon
                  iconName='plus'
                  className='fs-2'
                />
                Add Employee
              </button>
            </Link>
          </div>
          <div className='col-md-3 d-flex d-md-none justify-content-between p-0'>
            <LengthMenu
              expenseData={employeeData}
              handleItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>

        <div className='py-4 card-body'>
          <div className='table-responsive'>
            <Table
              data={paginatedemployeeData}
              columns={sortableFields}
              sort={sort}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              renderRow={(
                employee: any,
                index: number,
                actualIndex: number,
                isVisible: boolean
              ) => {
                return (
                  <React.Fragment key={employee._id}>
                    <tr
                      onClick={() => handleRowClick(employee._id)}
                      className='data-row'>
                      <td className='text-center align-middle'>
                        <div className='d-flex align-items-center justify-content-center'>
                          <FontAwesomeIcon
                            icon={faPlusCircle}
                            className='mx-2 mb-1 plus-icon'
                            style={{ color: '#607D8B', fontSize: '18px' }}
                          />
                          <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                            {actualIndex}
                          </span>
                        </div>
                      </td>
                      <td className='text-start align-middle px-3'>
                        <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                          {employee?.employee_code}
                        </span>
                      </td>
                      <td className='text-center align-middle'>
                        <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                          {employee.name}
                        </span>
                      </td>
                      <td className='text-center align-middle'>
                        <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                          {employee?.position}
                        </span>
                      </td>
                      <td className='text-center align-middle'>
                        <div className='d-flex align-items-center justify-content-center'>
                          <div className='symbol symbol-45px'>
                            <img
                              src={
                                employee.photo
                                  ? `https://files.fggroup.in/${employee.photo}`
                                  : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                              }
                              alt={employee.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className='d-flex justify-content-center'>
                          <Link
                            to={`/adajan-branch/employee/view?employee_id=${employee._id}`}
                            className='btn d-flex align-items-center gap-2 mx-2 btn-light-success btn-sm me-1'>
                            <FontAwesomeIcon
                              icon={faEye}
                              className='fs-2'
                            />
                          </Link>
                          <button
                            className='btn gap-2 btn-light-info mx-2 btn-sm me-1'
                            onClick={() => {
                              setShowModal(true)
                              fetchEditEmployeeData(employee)
                            }}>
                            <FontAwesomeIcon
                              icon={faQrcode}
                              className='fs-3'
                            />
                          </button>
                          <TableButton
                            action='remove'
                            onClick={() => handleDeleteFeature(employee._id)}
                          />
                          {/* <Link
                            to={`/hr/reports`}
                            className='btn fw-bold gap-1 btn-light-warning my-sm-0 ms-2 d-flex btn-sm'>
                            <FontAwesomeIcon
                              icon={faStar}
                              className='fs-3'
                            />{' '}
                            Rating
                          </Link> */}
                        </div>
                      </td>
                    </tr>
                    {isVisible && (
                      <tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
                        <td colSpan={12}>
                          <div>
                            <span className='text-dark fw-bold  d-block mb-1 fs-6'>
                              <a
                                href={`https://files.fggroup.in/` + employee.photo}
                                target='_blank'
                                rel='noopener noreferrer'>
                                <img
                                  src={
                                    employee.photo
                                      ? `https://files.fggroup.in/${employee.photo}`
                                      : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                  }
                                  alt={employee.name}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                                />
                              </a>
                            </span>
                            <strong>{sortableFields[0].title}:</strong> {employee.name}
                            <br />
                            <strong>{sortableFields[1].title}:</strong> {employee?.position}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              }}
              visibleDetails={visibleDetails}
              pagination={pagination}
              setPagination={setPagination}
              loading={loading}
            />
          </div>
          {paginatedemployeeData.length === 0 && !loading && (
            <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
              <b>No records found</b>
            </div>
          )}
          {paginatedemployeeData.length > 0 && (
            <UsersListPagination
              totalPages={Math.ceil(employeeData.length / pagination.itemsPerPage)}
              currentPage={pagination.page}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* member view modal */}

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          centered>
          <Modal.Header closeButton>
            <Modal.Title>Employee Bank Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className='row'>
              <div className='col-md-12 fv-row'>
                <CopyableInput
                  placeholder='Bank Name'
                  type='text'
                  className='col-12 fv-row mb-7'
                  name='bank_name'
                  label='Bank Name'
                  htmlFor='bank_name'
                  value={employeeViewData.bank_name}
                />
              </div>
              <div className='col-md-12 fv-row'>
                <CopyableInput
                  placeholder='Account No.'
                  type='text'
                  className='col-12 fv-row mb-7'
                  name='account_details'
                  label='Account No.'
                  htmlFor='account_details'
                  value={employeeViewData.account_details}
                />
              </div>
              <div className='col-md-12 fv-row'>
                <CopyableInput
                  placeholder='IFSC Code'
                  type='text'
                  className='col-12 fv-row mb-7'
                  name='IFSC'
                  label='IFSC Code'
                  htmlFor='IFSC'
                  value={employeeViewData.IFSC}
                />
              </div>
              <div className='col-md-12'>
                <div>
                  <label htmlFor='qr' className=' mb-2'>
                    <b>QR Code</b>
                  </label>
                </div>

                {employeeViewData?.document?.isPdf ? (
                  <a
                    href={employeeViewData?.document?.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'>
                    <embed
                      src={employeeViewData?.document?.fileUrl}
                      className='w-md-50 w-75'
                    />
                  </a>
                ) : (
                  <a
                    href={employeeViewData?.document?.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'>
                    <img
                      src={employeeViewData?.document?.fileUrl}
                      className='w-md-50 w-75'
                      alt='Image preview'
                    />
                  </a>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant='secondary'
              onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  )
}

export default AdajanBranchEmployeeList
