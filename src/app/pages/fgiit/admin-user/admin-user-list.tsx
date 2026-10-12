import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdminUsers } from '../../../Functions/FGGroup'

const AdminUserList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [adminData, setAdminData] = useState<any>([])
	const [loading, setLoading] = useState(false)

	const fetchBookData = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetAdminUsers()
			const filterData = response.data.filter(
				(admin: any) => admin.type !== 'Employee' && admin.type !== 'Trainer'
			)

			setAdminData(filterData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchBookData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}
	const filteredAdminData = adminData.filter((admin: any) =>
		admin.full_name.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedAdminData = filteredAdminData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)
	return (
		<>
			<PageTitle breadcrumbs={[]}>Admin Users</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='mt-1'>
							<LengthMenu
								expenseData={paginatedAdminData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='card-toolbar'>
						<TableButton
							action='add'
							to='/rag/admin-user-add'
							text='Add Admin'
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
									<th className='ps-4 rounded-start text-center'>No.</th>
									<th>Name</th>
									<th>Email</th>
									<th>Mobile Number</th>
									<th>Type</th>
									<th>MFA Status</th>
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
									paginatedAdminData.map((admin: any, index: number) => {
										const MFAStatusHTML =
											admin.MFA_enabled?.length > 0 ? (
												<span
													className='badge badge-success'
													title='Account is secured by Multi-Factor Authentication.'>
													Enabled
												</span>
											) : (
												<span
													className='badge badge-danger'
													title='This is account did not setup Multi-Factor Authentication. We highly recommended it for data security.'>
													Not Configured
												</span>
											)
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={admin.id}>
												<td className='text-center'>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{admin.full_name}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{admin.email}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{admin.mobile}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>{admin.type}</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{MFAStatusHTML}
													</span>
												</td>
												<td>
													<TableButton
														action='edit'
														to={'/rag/admin-user-edit?admin_id=' + admin._id}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{paginatedAdminData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{paginatedAdminData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(adminData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default AdminUserList
