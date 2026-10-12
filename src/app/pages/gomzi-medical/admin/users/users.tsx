import { faDownload, faLock, faLockOpen, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetUsers, LockUnlockUser } from '../../../../Functions/FGGroup'

const GMUsers: React.FC = () => {
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

	const masterData = localStorage.getItem('admin_type')

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetUsers({
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

	const handleLockUnlock = (userId: string, isLocked?: boolean) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `You are about to ${isLocked ? 'unlock' : 'lock'} the user.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				LockUnlockUser({ user_id: userId, lock: !isLocked })
					.then(() => {
						fetchData()
						Swal.fire(
							'Success!',
							`The user has been ${isLocked ? 'unlocked' : 'locked'}.`,
							'success'
						)
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the user status.', 'error')
					})
			}
		})
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
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

	const downloadExcel = async () => {
		const response: any = await GetUsers()
		const worksheetData = response.data.map((user: any, index: number) => {
			return {
				No: index + 1,
				'User Name': `${user.first_name || '-'} ${user.last_name || ''}`,
				Mobile: user.mobile || 'N/A',
				Email: user.email || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
		XLSX.writeFile(workbook, 'OrderData.xlsx')
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User</PageTitle>
			<KTCard>
				<div className='row align-items-center justify-content-between'>
					<div className='col-sm-6 px-10 col-12 d-flex align-items-center p-2 '>
						<div className='col-md-7'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='d-md-block d-none ms-3'>
							<LengthMenu
								expenseData={userData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
						{masterData == 'MASTER' ? (
							<button
								className='btn btn-primary mx-4'
								onClick={downloadExcel}
								disabled={loading}>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-3'
								/>
							</button>
						) : (
							''
						)}
					</div>
					<div className='col-sm-6 col-12 card-header border-0 d-flex justify-content-md-end '>
						<div className='card-toolbar'>
							<div className='d-md-none d-block'>
								<LengthMenu
									expenseData={userData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
							<TableButton
								action='add'
								to='/fgiit/users/add-user'
								text='Add'
							/>
						</div>
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
										<td className='text-center'>
											<div className='d-flex'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
													{actualIndex}
												</span>
											</div>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-5'>
													<img
														src={
															data.profile_image
																? `https://files.fggroup.in/${data.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
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
												{(data.country_code || '-') + ' ' + (data.mobile || '')}
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
											<div className='d-flex'>
												<TableButton
													action='view'
													to={`/fgiit/users/view-user?user_id=` + data._id}
												/>
												{data.lock ? (
													<button
														className={`btn gap-2 btn-light-danger mx-2 btn-sm me-1`}
														onClick={() => handleLockUnlock(data._id, data.lock)}>
														<FontAwesomeIcon
															icon={faLock}
															className='fs-3'
														/>
													</button>
												) : (
													<button
														className={`btn gap-2 btn-light-success mx-2 btn-sm me-1`}
														onClick={() => handleLockUnlock(data._id, data.lock)}>
														<FontAwesomeIcon
															icon={faLockOpen}
															className='fs-3'
														/>
													</button>
												)}
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<img
														src={
															data.profile_image
																? `https://files.fggroup.in/${data.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px', borderRadius: '7px' }}
													/>
													<br />
													<strong>User Name: </strong> {data.first_name + ' ' + data.last_name}
													<br />
													<strong>{sortableFields[1].title}: </strong>{' '}
													{(data.country_code || '-') + ' ' + (data.mobile || '')}
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

export default GMUsers
