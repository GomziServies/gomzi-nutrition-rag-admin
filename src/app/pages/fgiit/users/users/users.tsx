import { faDownload, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { GetUsers, LockUnlockUser } from '../../../../Functions/FGGroup'
import '../../../gomzi-nutrition/common-management.css'

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
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>User Directory</PageTitle>

			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>/</span>
				<span>Users</span>
				<span className='sep'>/</span>
				<span className='current'>Directory</span>
			</div>

			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>User Directory</h1>
					<p className='gz-mgmt-subtitle'>Manage registered customers, authentication providers, contacts and account profiles</p>
				</div>
				<TableButton
					action='add'
					to='/rag/users/add-user'
					text='Add User'
				/>
			</div>

			<div className='gz-mgmt-card'>
				<div className='gz-mgmt-toolbar'>
					<div className='gz-mgmt-toolbar-left'>
						{/* 1. Searchbar */}
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							className='me-0'
						/>

						{/* 2. Dropdown (show entries per page) */}
						<LengthMenu
							expenseData={userData}
							handleItemsPerPageChange={handleItemsPerPageChange}
							value={pagination.itemsPerPage}
							className='me-0'
						/>

						{/* 3. Datefilter */}
						<div className='d-flex align-items-center flex-shrink-0'>
							<DateFilter
								onDateRangeChange={handleDateRangeChange}
								rightValue='0'
							/>
						</div>
					</div>

					{/* 4. Right side: Excel Download */}
					<div className='gz-mgmt-toolbar-right'>
						<button
							type='button'
							className='gz-mgmt-export-btn'
							onClick={downloadExcel}
							disabled={exporting}
							title='Download Excel'>
							{exporting ? (
								<span
									className='spinner-border spinner-border-sm'
									role='status'
									aria-hidden='true'></span>
							) : (
								<FontAwesomeIcon icon={faDownload} />
							)}
							<span>Export Excel</span>
						</button>
					</div>
				</div>

				<div className='card-body p-0'>
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
											<div className='d-flex align-items-center justify-content-center'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-1 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='fw-bold d-block mb-1 fs-6' style={{ color: '#172B4D' }}>
													{actualIndex}
												</span>
											</div>
										</td>
										<td>
											<div className='gz-mgmt-identity-cell'>
												<img
													src={
														data.profile_image
															? data.provider === 'google'
																? data.profile_image
																: `https://files.fggroup.in/${data.profile_image}`
															: toAbsoluteUrl('/media/logos/fgiit-logo.png')
													}
													alt='User'
													className='gz-mgmt-avatar'
												/>
												<div className='gz-mgmt-identity-info'>
													<span className='name'>
														{`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User'}
													</span>
													<span className='sub'>ID: {data._id}</span>
												</div>
											</div>
										</td>
										<td>
											<span style={{ color: '#172B4D', fontWeight: 500, fontSize: '13.5px' }}>
												{data.provider === 'google'
													? '-'
													: `${data.country_code || ''} ${data.mobile || '-'}`}
											</span>
										</td>
										<td>
											<span style={{ color: '#475569', fontSize: '13px' }}>
												{data.email || '-'}
											</span>
										</td>
										<td>
											<span className={`gz-mgmt-pill ${data.provider === 'google' ? 'info' : ''}`} style={data.provider !== 'google' ? { background: '#F1F5F9', color: '#475569' } : {}}>
												{data.provider || 'local'}
											</span>
										</td>
										<td>
											<span style={{ color: '#64748B', fontSize: '13px' }}>
												{data.createdAt ? DayJS(data.createdAt).format('DD MMM YYYY hh:mm A') : '-'}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<TableButton
													action='view'
													to={`/rag/users/view-user?user_id=` + data._id}
												/>
											</div>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div className='p-3' style={{ background: '#F8FAFC', borderRadius: '8px' }}>
													<img
														src={
															data.profile_image
																? data.provider === 'google'
																	? data.profile_image
																	: `https://files.fggroup.in/${data.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
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
						<div className='d-flex text-center w-100 align-content-center justify-content-center py-10 text-muted'>
							<b>No users found</b>
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
			</div>
		</div>
	)
}

export default Users
