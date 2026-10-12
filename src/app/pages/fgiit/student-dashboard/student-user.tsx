/* eslint-disable jsx-a11y/anchor-is-valid */
import {
	faCheck,
	faLock,
	faLockOpen,
	faPlusCircle,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetStudents, LockUnlockUser } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const Users: React.FC = () => {
	const urlParams = new URLSearchParams(window.location.search)
	const alumniParam = urlParams.get('alumni')
	const courseCategoryParam: FitnessCourseType | any = urlParams.get('course_category') as
		| FitnessCourseType
		| any
	const [searchTerm, setSearchTerm] = useState('')
	const [userData, setUserData] = useState([])
	const [sort, setSort] = useState('')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
	const [metaData, setMetaData] = useState<any>()
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchData = async (page?: number) => {
		setLoading(true)
		try {
			const response: any = await GetStudents({
				course_category: courseCategoryParam,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			setUserData(response.data)

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)
		} catch (error: any) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchData()
	}, [courseCategoryParam, pagination.itemsPerPage, pagination.page, sort, sortOrder])

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

	const handleLockUnlock = (userId: string, isLocked?: boolean) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `You are about to unlock the user.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				LockUnlockUser({ user_id: userId, lock: true })
					.then(() => {
						fetchData()
						Swal.fire(
							'Success!',
							`The user has been ${!isLocked ? 'unlocked' : 'locked'}.`,
							'success'
						)
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the user status.', 'error')
					})
			}
		})
	}

	const handleUnlock = (userId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: `You are about to lock the user.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes',
			cancelButtonText: 'Cancel',
		}).then((result) => {
			if (result.isConfirmed) {
				LockUnlockUser({ user_id: userId, lock: false })
					.then(() => {
						fetchData()
						Swal.fire('Success!', `The user has been unlocked.`, 'success')
					})
					.catch((error) => {
						Swal.fire('Error!', 'There was an error updating the user status.', 'error')
					})
			}
		})
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredUserData = userData.filter((data: any) => {
		const isAlumni = alumniParam === 'true' || alumniParam === 'false'
		const isCourseCategory = courseCategoryParam !== null

		if (isAlumni && isCourseCategory) {
			return (
				data.alumni === (alumniParam === 'true') &&
				data?.course_category === courseCategoryParam &&
				data?.first_name &&
				data?.first_name.toLowerCase().includes(searchTerm.toLowerCase())
			)
		} else if (isAlumni) {
			return (
				data?.alumni === (alumniParam === 'true') &&
				data?.first_name &&
				data?.first_name.toLowerCase().includes(searchTerm.toLowerCase())
			)
		} else {
			return data?.first_name.toLowerCase().includes(searchTerm.toLowerCase())
		}
	})

	const paginatedUserData = filteredUserData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'User', field: 'first_name' },
		{ title: 'Mobile', field: 'mobile' },
		{ title: 'Email', field: 'email' },
		{ title: 'Registered On', field: 'createdAt' },
	]

	return (
		<>
			<PageTitle breadcrumbs={[]}>Student User</PageTitle>
			<KTCard className='py-5'>
				<div className='d-flex align-items-center justify-content-between'>
					<div className='d-flex justify-content-between '>
						<div className='position-relative m-7 mt-0'>
							<div className='card-title'>
								<div className='card-branch_code'>
									<SearchFilter
										searchTerm={searchTerm}
										setSearchTerm={setSearchTerm}
									/>
								</div>
							</div>
						</div>
						<div className='mt-1'>
							<LengthMenu
								expenseData={paginatedUserData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-header border-0'>
						<div className='card-toolbar'>
							<TableButton
								action='add'
								to='/fgiit/users/add-user'
								text='Add'
							/>
						</div>
					</div>
				</div>
				<div className='card-body py-4'>
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
											<FontAwesomeIcon
												icon={faPlusCircle}
												className='mx-1 mb-1 plus-icon'
												style={{ color: '#607D8B', fontSize: '18px' }}
											/>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{actualIndex}
											</span>
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
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data.first_name + ' ' + data.last_name}
													</span>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{data._id}
													</span>
													<span className='fw-bold mb-1 fs-6'>
														{data.app_data ? (
															<span className='badge badge-light-warning px-3 py-2'>
																{data.app_data.platform} {data.app_data.app_version}{' '}
																{`(${data.app_data.build_number})`}
															</span>
														) : (
															'-'
														)}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.mobile && data.mobileVerified ? (
														<>
															{data.country_code || '-'} {data.mobile}{' '}
															<FontAwesomeIcon
																icon={faCheck}
																size='lg'
																style={{ color: '#00d123' }}
															/>
														</>
													) : !data.mobile &&
													  data.mobileVerified === false &&
													  data.emailVerified === true ? (
														'[EMAIL-REGISTERED]'
													) : (
														<>
															{data.country_code || '-'} {data.mobile}{' '}
															{data.mobileVerified === false && (
																<FontAwesomeIcon
																	icon={faXmark}
																	size='lg'
																	style={{ color: '#ff0000' }}
																/>
															)}
														</>
													)}
												</span>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{data.email || '-'}{' '}
												{data.emailVerified ? (
													<FontAwesomeIcon
														icon={faCheck}
														size='lg'
														style={{ color: '#00d123' }}
													/>
												) : (
													data.email &&
													!data.emailVerified && (
														<FontAwesomeIcon
															icon={faXmark}
															size='lg'
															style={{ color: '#ff0000' }}
														/>
													)
												)}
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
														className={`btn gap-2 btn-light-success mx-2 btn-sm me-1`}
														onClick={() => handleUnlock(data._id)}>
														<FontAwesomeIcon
															icon={data.lock ? faLockOpen : faLock}
															className='fs-5'
														/>
													</button>
												) : (
													<button
														className={`btn gap-2 btn-light-danger mx-2 btn-sm me-1`}
														onClick={() => handleLockUnlock(data._id, data.lock)}>
														<FontAwesomeIcon
															icon={data.lock ? faLockOpen : faLock}
															className='fs-5'
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
													<div className='d-flex'>
														<strong className='me-2'>User Name:</strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.first_name + ' ' + data.last_name}
														</span>
													</div>

													<div className='d-flex'>
														<strong className='me-2'>User Id:</strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data._id}
														</span>
													</div>

													<div className='d-flex'>
														<strong className='me-2'>{sortableFields[1].title}:</strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																{data.mobile && data.mobileVerified ? (
																	<>
																		{data.country_code || '-'} {data.mobile}{' '}
																		<FontAwesomeIcon
																			icon={faCheck}
																			size='lg'
																			style={{ color: '#00d123' }}
																		/>
																	</>
																) : !data.mobile &&
																  data.mobileVerified === false &&
																  data.emailVerified === true ? (
																	'[EMAIL-REGISTERED]'
																) : (
																	<>
																		{data.country_code || '-'} {data.mobile}{' '}
																		{data.mobileVerified === false && (
																			<FontAwesomeIcon
																				icon={faXmark}
																				size='lg'
																				style={{ color: '#ff0000' }}
																			/>
																		)}
																	</>
																)}
															</span>
														</span>
													</div>
													<div className='d-flex'>
														<strong className='me-2'>{sortableFields[2].title}:</strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{data.email || '-'}{' '}
															{data.emailVerified ? (
																<FontAwesomeIcon
																	icon={faCheck}
																	size='lg'
																	style={{ color: '#00d123' }}
																/>
															) : (
																data.email &&
																!data.emailVerified && (
																	<FontAwesomeIcon
																		icon={faXmark}
																		size='lg'
																		style={{ color: '#ff0000' }}
																	/>
																)
															)}
														</span>
													</div>
													<div className='d-flex'>
														<strong className='me-2'>{sortableFields[3].title}:</strong>{' '}
														<span className='text-dark fw-bold  d-block mb-1 fs-6'>
															{DayJS(data.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
														</span>
													</div>
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
			</KTCard>
		</>
	)
}

export default Users
