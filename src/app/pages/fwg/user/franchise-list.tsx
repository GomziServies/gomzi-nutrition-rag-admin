import { faEye, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import { GetFranchiseUser } from '../../../../app/Functions/FWG'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import TableButton from '../../../components/TableButton'

const FranchiseList: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [franchiseData, setFranchiseData] = useState<any>([])
	const [loading, setLoading] = useState(false)

	const fetchData = async () => {
		setLoading(true)
		try {
			const franchiseResponse: any = await GetFranchiseUser()
			setFranchiseData(franchiseResponse.data)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredFranchiseData = franchiseData.filter(
		(data: any) => data.firstName && data.firstName.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedFranchiseData = filteredFranchiseData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>Franchise Details</PageTitle>
			<div className='card mt-10 pt-5'>
				<div className='card-header border-0'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<LengthMenu
							expenseData={franchiseData}
							handleItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action="add"
							to='/fwg/users/franchise-add'
							text="Add"
						/>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th>Name</th>
									<th>Email</th>
									<th>Status</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedFranchiseData
										.slice()
										.reverse()
										.map((feanchiseData: any, index: number) => {
											const actualIndex =
												(pagination.page - 1) * pagination.itemsPerPage + index + 1
											return (
												<tr key={actualIndex}>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{actualIndex}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{feanchiseData.firstName}
														</span>
													</td>
													<td>
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{feanchiseData.email}
														</span>
													</td>
													<td>
														<span className='badge bg-success text-white px-4 py-2 fw-bold mb-1 fs-6'>
															{feanchiseData.status}
														</span>
													</td>
													<td>
														<TableButton
															action="view"
															to={`/fwg/users/franchise-view?franchise_id=${feanchiseData._id}`}
														/>
														<TableButton
															action="assign"
															text="Assign"
															to={`/fwg/users/franchise-user?franchise_id=${feanchiseData._id}`}
														/>
													</td>
												</tr>
											)
										})
								)}
							</tbody>
						</table>
					</div>
					{paginatedFranchiseData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedFranchiseData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(franchiseData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
		</>
	)
}

export default FranchiseList
