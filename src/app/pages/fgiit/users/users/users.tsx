import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetUsers, LockUnlockUser } from '../../../../Functions/FGGroup'

const Users: React.FC = () => {
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
	const [exporting, setExporting] = useState(false)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const queryPayload: any = {
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			}

			if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
				const start = new Date(selectedDateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(selectedDateRange[1])
				end.setHours(23, 59, 59, 999)
				queryPayload.start_date = start.toISOString()
				queryPayload.end_date = end.toISOString()
			}

			const response: any = await GetUsers(queryPayload)
			const metaPagination: any = response?.metadata?.pagination || response?.pagination || {}
			setMetaData(metaPagination)
			setUserData(response?.data || [])
		} catch (error: any) {
			console.error(error)
		} finally {
			setLoading(false)
		}
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

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	useEffect(() => {
		fetchData()
	}, [selectedDateRange, pagination.itemsPerPage, pagination.page, sort, sortOrder])

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
		{ title: 'Provider', field: 'provider' },
		{ title: 'Registered On', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const downloadExcel = async () => {
		try {
			setExporting(true)
			const toastId = toast.loading('Exporting users to Excel...')

			const queryPayload: any = {
				page: 1,
				limit: 10000,
				search: searchTerm,
				sort: 'createdAt',
				sortOrder: 'desc',
			}

			if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
				const start = new Date(selectedDateRange[0])
				start.setHours(0, 0, 0, 0)
				const end = new Date(selectedDateRange[1])
				end.setHours(23, 59, 59, 999)
				queryPayload.start_date = start.toISOString()
				queryPayload.end_date = end.toISOString()
			}

			const response: any = await GetUsers(queryPayload)
			const users = response?.data || []

			if (users.length === 0) {
				toast.dismiss(toastId)
				toast.error('No users found to export')
				return
			}

			const worksheetData = users.map((user: any, index: number) => ({
				No: index + 1,
				'User ID': user._id || '-',
				'First Name': user.first_name || '-',
				'Last Name': user.last_name || '-',
				'User Name': `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-',
				Mobile: user.mobile ? `${user.country_code || ''} ${user.mobile}`.trim() : '-',
				Email: user.email || '-',
				Provider: user.provider || '-',
				'Registered On': user.createdAt
					? DayJS(user.createdAt).format('DD/MM/YYYY hh:mm:ss A')
					: '-',
			}))

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)

			// Auto-size columns
			const columnWidths = Object.keys(worksheetData[0]).map((key) => {
				const maxLength = Math.max(
					key.length,
					...worksheetData.map((row: any) => String(row[key] ?? '').length)
				)

				return {
					wch: Math.min(maxLength + 2, 40),
				}
			})

			worksheet['!cols'] = columnWidths

			const workbook = XLSX.utils.book_new()

			XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

			XLSX.writeFile(workbook, `Users_${DayJS(new Date()).format('DD-MM-YYYY')}.xlsx`)

			toast.dismiss(toastId)
			toast.success(`${users.length} users exported successfully`)
		} catch (error: any) {
			console.error('Export error:', error)
			toast.error('Unable to export user data')
		} finally {
			setExporting(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex align-items-center justify-content-between flex-wrap w-100 gap-3'>
						<div className='d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1'>
							{/* 1. Searchbar */}
							<div>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
									className='me-0'
								/>
							</div>

							{/* 2. Dropdown (show entries per page) */}
							<div>
								<LengthMenu
									expenseData={userData}
									handleItemsPerPageChange={handleItemsPerPageChange}
									value={pagination.itemsPerPage}
									className='me-0'
								/>
							</div>

							{/* 3. Download Excel Button */}
							<div>
								<button
									type='button'
									className='btn btn-icon d-flex align-items-center justify-content-center'
									onClick={downloadExcel}
									disabled={exporting}
									style={{
										width: '38px',
										height: '38px',
										minWidth: '38px',
										padding: 0,
										borderRadius: '8px',
										fontSize: '14px',
										backgroundColor: '#ffffff',
										border: '1px solid #DFE7F0',
										color: '#1E3A5F',
										boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
										transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										cursor: exporting ? 'not-allowed' : 'pointer',
									}}
									onMouseEnter={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#1E3A5F'
											e.currentTarget.style.borderColor = '#1E3A5F'
											e.currentTarget.style.color = '#ffffff'
											e.currentTarget.style.boxShadow = '0 4px 10px rgba(30, 58, 95, 0.25)'
											e.currentTarget.style.transform = 'translateY(-1px)'
										}
									}}
									onMouseLeave={(e) => {
										if (!exporting) {
											e.currentTarget.style.backgroundColor = '#ffffff'
											e.currentTarget.style.borderColor = '#DFE7F0'
											e.currentTarget.style.color = '#1E3A5F'
											e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
											e.currentTarget.style.transform = 'translateY(0)'
										}
									}}
									title='Download Excel'>
									{exporting ? (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
											aria-hidden='true'></span>
									) : (
										<FontAwesomeIcon icon={faDownload} />
									)}
								</button>
							</div>

							{/* 4. Datefilter */}
							<div className='d-flex align-items-center flex-shrink-0'>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
						</div>

						{/* 5. Right side Add Button */}
						<div className='flex-shrink-0 ms-auto'>
							<TableButton
								action='add'
								to='/rag/users/add-user'
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
																? data.provider === 'google'
																	? data.profile_image // Google image URL
																	: `https://files.fggroup.in/${data.profile_image}` // Local uploaded image
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
												{data.provider === 'google'
													? '-'
													: `${data.country_code || '-'} ${data.mobile || ''}`}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.email || '-'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.provider || '-'}
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
													to={`/rag/users/view-user?user_id=` + data._id}
												/>
												{/* {data.lock ? (
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
												)} */}
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
																? data.provider === 'google'
																	? data.profile_image
																	: `https://files.fggroup.in/${data.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px', borderRadius: '7px' }}
													/>
													<br />
													<strong>User Name: </strong> {data.first_name + ' ' + data.last_name}
													<br />
													<strong>{sortableFields[1].title}: </strong>{' '}
													{data.mobile ? `${data.country_code || ''} ${data.mobile}` : '-'}
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
							totalPages={metaData?.totalPages || metaData?.total_pages || 1}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default Users
