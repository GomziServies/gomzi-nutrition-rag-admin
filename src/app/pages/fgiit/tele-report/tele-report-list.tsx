import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetJobPlacement } from '../../../Functions/FGGroup'

const ViewTeleReportList: React.FC = () => {
  const intl = useIntl()

  const [searchTerm, setSearchTerm] = useState('')
  const [jobData, setJobData] = useState<any>([])
  const [metaData, setMetaData] = useState<any>()
  const [sort, setSort] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  })

  const [loading, setLoading] = useState(false)

  // ✅ Demo dropdown state (UI only)
  const [salesPerson, setSalesPerson] = useState('')

  const salesPersonList = [
    { label: 'Select Sales Person', value: '' },
    { label: 'Rahul Patel', value: 'rahul_patel' },
    { label: 'Amit Shah', value: 'amit_shah' },
    { label: 'Neha Mehta', value: 'neha_mehta' },
  ]

  const [rowColors, setRowColors] = useState<Record<string, string>>({})

  const colorOptions = [
    { label: 'Select Color', value: '' },
    { label: 'Red', value: '#ffe5e5' },   
    { label: 'Green', value: '#e5ffe5' }, 
    { label: 'Yellow', value: '#ffffe5' },
    { label: 'Orange', value: '#ffe5cc' },
  ]

  const getDarkBorderColor = (bgColor: string) => {
    switch (bgColor) {
      case '#ffe5e5': 
        return '#cc0000'; 
      case '#e5ffe5': // 
        return '#006600'; 
      case '#ffffe5': 
        return '#cccc00'; 
      case '#ffe5cc': 
        return '#ff8000'; 
      default:
        return '#333333';
    }
  }

  const fetchJobData = async (page?: number) => {
    setLoading(true)
    try {
      const response = await GetJobPlacement({
        page: page || pagination.page,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        sort,
        sortOrder,
      })

      const metaData: any = response.metadata
      setMetaData(metaData.pagination)
      setJobData(response.data)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobData()
  }, [pagination.page, pagination.itemsPerPage, sort, sortOrder])

  const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
    setSort(newSort)
    setSortOrder(newSortOrder)
  }

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (searchTerm.trim() || searchTerm === '') {
      setPagination((prev) => ({ ...prev, page: 1 }))
      if (pagination.page === 1) fetchJobData()
    }
  }, [searchTerm])

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value })
  }

  const sortableFields = [
    { field: 'title', title: 'Full Name' },
    { field: 'contact_email', title: 'Email' },
    { field: 'contact_mobile', title: 'Mobile' },
    { field: 'vacancies', title: 'Lead Name' },
    { field: 'interest', title: 'Interest' },
  ]

  const handleRowClick = (id: string) => {
    if (window.innerWidth <= 1024) {
      setVisibleDetails(visibleDetails === id ? null : id)
    }
  }

  // Function to handle color change for a specific row
  const handleColorChange = (rowId: string, color: string) => {
    setRowColors(prev => ({
      ...prev,
      [rowId]: color
    }))
  }

  // Function to get color for a specific row
  const getRowColor = (rowId: string) => {
    return rowColors[rowId] || ''
  }

  return (
		<>
			<PageTitle breadcrumbs={[]}>Tele Report</PageTitle>

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
										onClick={() => handleRowClick(data._id)}
										className='data-row'
										style={{
											backgroundColor: getRowColor(data._id),
											border: getRowColor(data._id)
												? `2px solid ${getDarkBorderColor(getRowColor(data._id))}`
												: 'none',
										}}>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{actualIndex}</span>
										</td>

										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{data.title}</span>
										</td>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{data.contact_email}</span>
										</td>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>
												{data.contact_mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{data.vacancies}</span>
										</td>
										<td>
											<select
												className='form-select form-select-sm'
												value={getRowColor(data._id)}
												onChange={(e) => handleColorChange(data._id, e.target.value)}>
												<option value=''>Select Color</option>
												{colorOptions.slice(1).map((color) => (
													<option
														key={color.value}
														value={color.value}>
														{color.label}
													</option>
												))}
											</select>
										</td>
										<td>
											<div className='d-flex gap-1 align-items-center'>
												<TableButton
													action='view'
													to={`/fgiit/tele-report-inner-list`}
												/>
											</div>
										</td>
									</tr>

									{isVisible && (
										<tr className='detail-row is-visible'>
											<td colSpan={12}>
												<strong>Company:</strong> {data.company_name} <br />
												<strong>City:</strong> {data.city || '-'} <br />
												<strong>Category:</strong> {data.category || '-'}
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

export default ViewTeleReportList
