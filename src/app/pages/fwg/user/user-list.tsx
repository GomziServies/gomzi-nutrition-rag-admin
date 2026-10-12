import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import TableSort from '../../../components/TableSort'
import { ActivateUser, DeactivateUser, GetUser } from '../../../Functions/FWG'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const UserListTable: React.FC = () => {
	const [portalAdminType, setPortalAdminType] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [metaData, setMetaData] = useState<any>()
	const [userData, setUserData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')

	const fetchUserData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			}

			// Adjust endDate to the end of the day for inclusive range if set
			if (endDate) {
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const response = await GetUser({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			const filteredData: any = response.data.filter((book: any) => {
				const bookDate = new Date(book.createdAt)
				if (startDate && endDate) {
					return bookDate >= startDate && bookDate <= endDate
				}
				return true
			})

			setUserData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const handlePageChange = (page: number) => {
		setPagination((prev) => ({ ...prev, page }))
	}

	useEffect(() => {
		fetchUserData()
		const storedPortalAdminType = localStorage.getItem('fwg_portal')

		if (storedPortalAdminType === 'fwg_portal') {
			setPortalAdminType(storedPortalAdminType)
		}
	}, [pagination.page, pagination.itemsPerPage, sort, sortOrder, selectedDateRange])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchUserData()
		}
	}, [searchTerm])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const activeUser = async (userID: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to activate this user.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await ActivateUser({ id: userID })
					if (response.status === 200) {
						setUserData(
							userData.map((user: any) =>
								user._id === userID ? { ...user, status: 'ACTIVE' } : user
							)
						)
						toast.success('User activated successfully')
					} else {
						toast.error('Failed to activate user')
					}
				}
			})
		} catch (error: any) {
			toast.error(error.message)
		}
	}
	const deactivate = async (userID: string) => {
		try {
			Swal.fire({
				title: 'Are you sure?',
				text: 'You are about to deactivate this user.',
				icon: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Yes',
			}).then(async (result) => {
				if (result.isConfirmed) {
					const response: any = await DeactivateUser({ id: userID })
					if (response.status === 200) {
						setUserData(
							userData.map((user: any) =>
								user._id === userID ? { ...user, status: 'DEACTIVATED' } : user
							)
						)
						toast.success('User deactivated successfully')
					} else {
						toast.error('Failed to deactivate user')
					}
				}
			})
		} catch (error: any) {
			console.error('Error deactivating user:', error)
			toast.error(error.message)
		}
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const sortableFields = [
		{ title: 'Name', field: 'firstName' },
		{ title: 'Email', field: 'email' },
		{ title: 'Number', field: 'mobile' },
		{ title: 'Registered On', field: 'createdAt' },
		{ title: 'Status', field: 'status' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>All Users</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<KTIcon
								iconName='magnifier'
								className='fs-1 position-absolute ms-6'
							/>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='d-md-block d-none'>
							<LengthMenu
								expenseData={userData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<div className='me-1'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='d-md-none d-block mt-md-0 mt-5'>
							<LengthMenu
								expenseData={userData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
						<div className=' mt-md-0 mt-5'>
							<TableButton
								action='add'
								to='/fwg/users/user-add'
								text='Create'
							/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className=' table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<TableSort
								sortableFields={sortableFields}
								sort={sort}
								sortOrder={sortOrder}
								onSortChange={handleSortChange}
							/>
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
									userData.map((user: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={user._id}>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.firstName + ' ' + user.lastName}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.email || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{user.mobile || 'N/A'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(user.createdAt).format('DD-MM-YYYY hh:mm:ss A')}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold d-block mb-1 fs-6'>
														{user.status === 'ACTIVE' && (
															<button
																className={`btn btn-sm me-1 btn-bg-success`}
																onClick={() => {
																	if (portalAdminType) {
																		toast.error('Only master admin can perform this action.')
																	} else {
																		deactivate(user._id)
																	}
																}}>
																Active
															</button>
														)}
														{user.status === 'DEACTIVATED' && (
															<button
																className={`btn btn-sm me-1 btn-bg-warning`}
																onClick={() => {
																	if (portalAdminType) {
																		toast.error('Only master admin can perform this action.')
																	} else {
																		activeUser(user._id)
																	}
																}}>
																DEACTIVATED
															</button>
														)}
														{user.status === 'DELETED' && (
															<button
																className={`btn btn-sm me-1 btn-bg-danger`}
																onClick={() => {
																	if (portalAdminType) {
																		toast.error('Only master admin can perform this action.')
																	} else {
																		activeUser(user._id)
																	}
																}}>
																Deleted
															</button>
														)}
													</span>
												</td>
												<td>
													<div className='d-flex'>
														<TableButton
															action='view'
															to={'/fwg/users/user-view-details?user_id=' + user._id}
														/>
													</div>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
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

export default UserListTable
