import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { AsyncPaginate } from 'react-select-async-paginate'
import Swal from 'sweetalert2'
import { KTIcon } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { loadUserOptions } from '../../../../components/loadUserOptions'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { AssignUserToAdmin, GetAdminUsers, GetUser } from '../../../../Functions/FWG'

const AdminAssign: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [userIdList, setUserIdList] = useState<string[]>([])
	const [userData, setUserData] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [show, setShow] = useState(false)
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const admin_id: any = searchParams.get('admin_id')
	const [value, onChange] = useState<any>(null)
	const [pagination, setPagination] = useState({ page: 1, itemsPerPage: 10 })

	const fetchUserDataById = async (userId: string) => {
		setLoading(true)
		try {
			const userResponse: any = await GetUser({ id: userId })
			return {
				name: userResponse.data[0].firstName + ' ' + userResponse.data[0].lastName,
				mobile: userResponse.data[0].mobile,
				email: userResponse.data[0].email,
				user_id: userResponse.data[0]._id,
			}
		} catch (error: any) {
			console.error(`Error fetching user data for user ID ${userId}:`, error)
			return null
		} finally {
			setLoading(false)
		}
	}

	const fetchAssignData = async () => {
		setLoading(true)
		try {
			const response: FWG_APIResponse = await GetAdminUsers()
			const data = response.data
			if (Array.isArray(data)) {
				const admin: FWG_APIResponse | any = data.find((admin: any) => admin._id === admin_id)
				if (admin) {
					const assignedUsers = admin.assigned_users
					setUserIdList(assignedUsers)

					// Fetch user data for each assigned user ID
					const userDetails = await Promise.all(assignedUsers.map(fetchUserDataById))
					setUserData(userDetails)
				} else {
					toast.error('Admin not found')
				}
			} else {
				toast.error('Unexpected data format')
			}
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAssignData()
	}, [])

	const handleAddAdminData = async () => {
		const newUserIds = value.map((item: any) => item.value)
		const updatedUserIds = Array.from(new Set([...userIdList, ...newUserIds]))

		const payload = {
			admin_user_id: admin_id,
			assigned_users: updatedUserIds,
		}

		try {
			await AssignUserToAdmin(payload)
			fetchAssignData()
			setShow(false)
			toast.success('Users assigned successfully')
		} catch (error: any) {
			toast.error(error.message)
			console.error('Error assigning Users:', error)
		}
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredUserData = userData.filter((data: any) =>
		data?.name?.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedUserData = filteredUserData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handleDeleteUser = async (userId: string) => {
		Swal.fire({
			title: 'Are you sure?',
			text: 'Once You remove, you will not be able to recover!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, Remove it!',
			cancelButtonText: 'Cancel',
		}).then(async (result) => {
			if (result.isConfirmed) {
				try {
					const updatedUserIdList = userIdList.filter((id) => id !== userId)
					setUserIdList(updatedUserIdList)

					const payload = {
						admin_user_id: admin_id,
						assigned_users: updatedUserIdList,
					}
					await AssignUserToAdmin(payload)

					fetchAssignData()
					toast.success('User removed successfully')
				} catch (error: any) {
					toast.error(error.message)
					console.error(error)
				}
			}
		})
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Assign</PageTitle>
			<div className='card mt-10 pt-5'>
				<div className='card-header border-0'>
					<div className='card-title'>
						<div className='d-flex align-items-center position-relative my-1'>
							<KTIcon
								iconName='magnifier'
								className='fs-1 position-absolute ms-6'
							/>
							<input
								type='text'
								data-kt-user-table-filter='search'
								className='form-control form-control-solid w-250px ps-14'
								placeholder='Search user'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							text='Add User'
							backgroundDark={true}
							onClick={() => setShow(true)}
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
									<th>Mobile</th>
									<th>Email</th>
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
									paginatedUserData.map((data: any, index: any) => (
										<tr key={index}>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{index + 1}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.name || '-'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.mobile || 'N/A'}
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>
													{data.email || 'N/A'}
												</span>
											</td>
											<td>
												<TableButton
													action='remove'
													text='Remove'
													onClick={() => handleDeleteUser(data.user_id)}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
					{paginatedUserData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedUserData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(userData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</div>
			<Modal
				centered
				show={show}
				onHide={() => setShow(false)}
				className='modal'>
				<div className='modal-content'>
					<div className='modal-header pb-0 border-0 justify-content-end'>
						<button
							onClick={() => setShow(false)}
							className='btn btn-sm btn-icon btn-active-color-primary'
							data-bs-dismiss='modal'>
							<FontAwesomeIcon
								className='fs-1 position-absolute ms-3'
								icon={faXmark}
							/>
						</button>
					</div>
					<div className='modal-body mx-3 pt-0 pb-15'>
						<div className='text-center mb-13'>
							<h2 className='mb-3'>Assign Admin</h2>
						</div>
						<div className='mb-7'>
							<label
								htmlFor='select'
								className='form-label'>
								Select User
							</label>
							<AsyncPaginate
								value={value}
								loadOptions={loadUserOptions}
								closeMenuOnSelect={false}
								onChange={onChange}
								isMulti
							/>
						</div>
						<div className='mt-7 text-end'>
							<button
								type='button'
								className='btn btn-success'
								onClick={handleAddAdminData}>
								Add
							</button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default AdminAssign
