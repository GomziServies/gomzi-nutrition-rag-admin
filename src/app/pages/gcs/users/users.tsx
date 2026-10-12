import { faEye, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import { GetUser } from '../../../Functions/GCS'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const GCSUsers: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [userData, setUserData] = useState([])
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetUser({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
			setUserData(response.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	useEffect(() => {
		fetchData()
	}, [pagination.itemsPerPage, pagination.page, sort, sortOrder])

	const isFirstRender = useRef(true);

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

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const sortableFields = [
		{ title: 'User', field: 'first_name' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'Email', field: 'email' },
		{ title: 'Registered On', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User</PageTitle>
			<KTCard>
				<div className='row align-items-center justify-content-between pt-3'>
					<div className='col-sm-6 px-10 col-12 d-flex align-items-center p-2 '>
						<div>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<LengthMenu
							expenseData={userData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={userData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(data: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={data._id}>
									<tr
										onClick={() => handleRowClick(data._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{data.first_name + ' ' + data.last_name}
													</span>
													<span className='text-muted fw-semibold text-muted d-block fs-7'>
														{data._id}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.mobile || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.email || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<Link to={`/gcs/users/view-user?user_id=` + data._id}>
												<button className='btn gap-2 btn-light-primary mx-2 btn-sm me-1'>
													<FontAwesomeIcon
														icon={faEye}
														className='fs-3'
													/>
												</button>
											</Link>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>User ID: </strong> {data._id}
													<br />
													<strong>User Name: </strong> {data.first_name + ' ' + data.last_name}
													<br />
													<strong>{sortableFields[1].title}: </strong> {data.mobile || '-'}
													<br />
													<strong>{sortableFields[2].title}: </strong> {data.email || '-'}
													<br />
													<strong>{sortableFields[3].title}: </strong>{' '}
													{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
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
					{userData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{userData.length > 0 && (
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

export default GCSUsers
