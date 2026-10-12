import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetJobPlacement } from '../../../Functions/FGGroup'
import Table from '../../../components/Table'

const JobPlacement: React.FC = () => {
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
			const filteredData: any = response.data
			setJobData(filteredData)
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

	const isFirstRender = useRef(true);

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
		{ field: 'title', title: 'Title' },
		{ field: 'contact_email', title: 'Email' },
		{ field: 'contact_mobile', title: 'Mobile' },
		{ field: 'vacancies', title: 'Vacancies' },
		{ field: 'clicks', title: 'Clicks' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Job & Placement</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between mx-6 me-9'>
					<div className='d-flex pt-1 mx-2 m-5'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='mt-1'>
							<LengthMenu
								expenseData={jobData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>

					<div className='d-flex align-items-center position-relative my-2'>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action='add'
								to='/fgiit/job-placement-add'
								text='Add Job'
							/>
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
										className='data-row'>
										<td>
											<span className='text-dark fw-bold ms-6 mb-1 fs-6'>{actualIndex}</span>
										</td>

										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>{data.title}</span>
										</td>

										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{data.contact_email}
											</span>
										</td>

										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{data.contact_mobile}
											</span>
										</td>

										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>{data.vacancies}</span>
										</td>

										<td>
											<span className='text-dark fw-bold d-block mb-1 fs-6'>
												{data?.cv_submissions?.length || 0}
											</span>
										</td>

										<td>
											<TableButton
												action='view'
												to={`/fgiit/job-placement-view?post_id=${data._id}`}
											/>
										</td>
									</tr>

									{/* Expandable Detail Row */}
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>Company:</strong> {data.company_name}
													<br />
													<strong>City:</strong> {data.city || '-'}
													<br />
													<strong>Category:</strong> {data.category || '-'}
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
						/>
					</div>

					{jobData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
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

export default JobPlacement
