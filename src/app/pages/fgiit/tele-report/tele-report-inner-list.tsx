import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'

const ViewTeleReportInnerList: React.FC = () => {
  const intl = useIntl()

  const [searchTerm, setSearchTerm] = useState('')
  const [jobData, setJobData] = useState<any>([
    {
      _id: '1',
      name: 'John Doe',
      reason: 'Price too high',
      last_conversation: '2023-10-12 02:00 PM',
      conversation_dates: ['2023-10-10 10:00 AM', '2023-10-12 02:00 PM'],
      call_recording: 'recording1.mp3',
      sales_person: 'Rahul Patel',
      returned_from: 'Personal Details'
    },
    {
      _id: '2',
      name: 'Jane Smith',
      reason: 'Not interested in course',
      last_conversation: '2023-10-15 11:30 AM',
      conversation_dates: ['2023-10-13 09:00 AM', '2023-10-15 11:30 AM'],
      call_recording: 'recording2.mp3',
      sales_person: 'Amit Shah',
      returned_from: 'Course Details'
    },
    {
      _id: '3',
      name: 'Bob Johnson',
      reason: 'Already enrolled elsewhere',
      last_conversation: '2023-10-18 04:45 PM',
      conversation_dates: ['2023-10-16 01:00 PM', '2023-10-18 04:45 PM'],
      call_recording: 'recording3.mp3',
      sales_person: 'Neha Mehta',
      returned_from: 'Admission Form'
    }
  ])
  const [metaData, setMetaData] = useState<any>({ pagination: { totalPages: 1 } })
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  })

  const [loading, setLoading] = useState(false)
  const [salesPerson, setSalesPerson] = useState('')

  const salesPersonList = [
    { label: 'Select Sales Person', value: '' },
    { label: 'Rahul Patel', value: 'rahul_patel' },
    { label: 'Amit Shah', value: 'amit_shah' },
    { label: 'Neha Mehta', value: 'neha_mehta' },
  ]

  const [sort, setSort] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [selectedData, setSelectedData] = useState<any>({
    name: 'John Doe',
    reason: 'Price too high',
    last_conversation: '2023-10-12 02:00 PM',
    conversation_dates: ['2023-10-10 10:00 AM', '2023-10-12 02:00 PM'],
    call_recording: 'recording1.mp3',
    sales_person: 'Rahul Patel',
    returned_from: 'Personal Details'
  })

  const sortableFields = [
    { field: 'name', title: 'Name' },
    { field: 'reason', title: 'Reason' },
    { field: 'returned_from', title: 'Returned From' },
    { field: 'last_conversation', title: 'Last Conversation' },
    { field: 'call_recording', title: 'Call Recording' },
  ]

  const handleRowClick = (id: string) => {
    if (window.innerWidth <= 1024) {
      setVisibleDetails(visibleDetails === id ? null : id)
    }
  }

  const handleSortChange = (newSort: string, newSortOrder: 'asc' | 'desc') => {
    setSort(newSort)
    setSortOrder(newSortOrder)
  }

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value })
  }

  return (
		<>
			<PageTitle breadcrumbs={[]}>Tele Report</PageTitle>

			<div className='card py-12  my-10'>
				<div className='card-body'>
					<h1 className='fw-bold text-dark fs-1 mb-6 '>User Information</h1>

					<div className='row'>
						<div className='col-md-6'>
							<p>
								<i className='fas fa-user text-primary'></i> <strong>Name:</strong>{' '}
								{selectedData.name}
							</p>
							<p>
								<i className='fas fa-exclamation-triangle text-warning'></i> <strong>Reason:</strong>{' '}
								{selectedData.reason}
							</p>
							<p>
								<i className='fas fa-arrow-left text-info'></i> <strong>Returned From:</strong>{' '}
								{selectedData.returned_from}
							</p>
							<p>
								<i className='fas fa-calendar-alt text-secondary'></i> <strong>Last Conversation:</strong>{' '}
								{selectedData.last_conversation}
							</p>
						</div>
						<div className='col-md-6'>
							<p>
								<i className='fas fa-user-tie text-danger'></i>{' '}
								<strong>Sales Person:</strong> {selectedData.sales_person}
							</p>
							<p>
								<i className='fas fa-clock text-info'></i>{' '}
								<strong>Conversation Dates:</strong> {selectedData.conversation_dates?.join(', ')}
							</p>
						</div>
					</div>
				</div>
			</div>

			<KTCard>

				<div className='d-flex justify-content-between mx-6 me-9'>
					<div className='d-flex pt-1 mx-2 m-5 gap-3 align-items-center'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>

						{/* ✅ Length menu + clean dropdown */}
						<div className='mt-1 d-flex gap-3 align-items-center'>
							<LengthMenu
								expenseData={jobData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>

							<select
								className='form-select form-select-sm'
								style={{ minWidth: '200px' }}
								value={salesPerson}
								onChange={(e) => setSalesPerson(e.target.value)}>
								{salesPersonList.map((person) => (
									<option
										key={person.value}
										value={person.value}>
										{person.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={jobData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							visibleDetails={visibleDetails}
							onSortChange={handleSortChange}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => {
											setSelectedData(data)
											handleRowClick(data._id)
										}}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{actualIndex}</span>
										</td>

										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{data.name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{data.reason}</span>
										</td>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{data.returned_from}</span>
										</td>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>
												{data.last_conversation}
											</span>
										</td>
										<td>
											<button className='btn btn-sm btn-primary'>Play</button>
										</td>
										<td>
											<div className='d-flex gap-1 align-items-center'>
												<TableButton
													action='view'
													to={`/fgiit/view-tele-report`}
													text='Resume'
												/>
											</div>
										</td>
									</tr>

									{isVisible && (
										<tr className='detail-row is-visible'>
											<td colSpan={7}>
												<strong>Conversation Dates:</strong> {data.conversation_dates.join(', ')} <br />
												<strong>Sales Person:</strong> {data.sales_person} <br />
												<strong>Returned From:</strong> {data.returned_from}
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
						/>
					</div>

					{jobData.length === 0 && !loading && (
						<div className='text-center mt-5'>
							<b>No records found</b>
						</div>
					)}

					{jobData.length > 0 && (
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

export default ViewTeleReportInnerList
