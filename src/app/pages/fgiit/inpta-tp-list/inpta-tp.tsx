import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetTPListingForInptaAdmin } from '../../../Functions/FGGroup/InptaListing'

const InptaTPListing: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [businessData, setBusinessData] = useState([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetTPListingForInptaAdmin({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setBusinessData(response.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredBusinessData = businessData.filter(
		(businessData: any) =>
			businessData.owner.first_name &&
			businessData.owner.first_name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedBusinessData = filteredBusinessData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Owner Name', field: 'first_name' },
		{ title: 'Email', field: 'email' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'Approval Status', field: 'approval_status' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Training Partner List</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-branch_code'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={businessData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr
										onClick={() => handleRowClick(item._id)}
										className='data-row'>
										<td
											className='text-center'
											role='button'>
											<span className='text-dark ms-6 d-flex fw-bold  d-block mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.owner.first_name + ' ' + item.owner.last_name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.owner.email}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.owner.mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.approval_status.status === 'APPROVED' ? (
													<span className='badge badge-light-success py-3 px-4 fs-7'>Approved</span>
												) : item.approval_status.status === 'REJECTED' ? (
													<span className='badge badge-light-danger py-3 px-4 fs-7'>Rejected</span>
												) : (
													<span className='badge badge-light-warning py-3 px-4 fs-7'>Pending</span>
												)}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												to={`/fgiit/inpta/tp-view-listing?inpta_owner_id=` + item._id}
											/>
											{/* <TableButton
												action='edit'
												to={`/fgiit/inpta/tp-edit-listing?list_id=${item._id}`}
											/> */}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>{sortableFields[0].title}: </strong>{' '}
													{item.owner.first_name + ' ' + item.owner.last_name}
													<br />
													<strong>{sortableFields[1].title}: </strong> {item.business_name}
													<br />
													<strong>{sortableFields[2].title}: </strong> {item.business_type}
													<br />
													<strong>{sortableFields[3].title}: </strong>{' '}
													{item.approval_status.status === 'APPROVED' ? (
														<span className='badge badge-light-success py-3 px-4 fs-7'>
															Approved
														</span>
													) : item.approval_status.status === 'REJECTED' ? (
														<span className='badge badge-light-danger py-3 px-4 fs-7'>
															Rejected
														</span>
													) : (
														<span className='badge badge-light-warning py-3 px-4 fs-7'>
															Pending
														</span>
													)}
													<br />
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
					{businessData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{businessData.length > 0 && (
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
export default InptaTPListing
