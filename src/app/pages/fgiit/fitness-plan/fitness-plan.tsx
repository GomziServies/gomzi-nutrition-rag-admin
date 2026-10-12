/* eslint-disable jsx-a11y/anchor-is-valid */
import { faEye, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import TableButton from '../../../components/TableButton'

const FitnessPlan: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [userData] = useState<any[]>([
		{
			id: 1,
			planId: '60f40b4f14756a14f8735385',
			planName: 'Basic Plan',
			amount: 10,
			lastUpdated: '2024-05-01',
		},
		{
			id: 2,
			planId: '60f40b4f14756a14f8735385',
			planName: 'Premium Plan',
			amount: 20,
			lastUpdated: '2024-05-02',
		},
		{
			id: 3,
			planId: '60f40b4f14756a14f8735385',
			planName: 'Basic Plan',
			amount: 10,
			lastUpdated: '2024-05-01',
		},
		{
			id: 4,
			planId: '60f40b4f14756a14f8735385',
			planName: 'Premium Plan',
			amount: 20,
			lastUpdated: '2024-05-02',
		},
		{
			id: 5,
			planId: '60f40b4f14756a14f8735385',
			planName: 'Basic Plan',
			amount: 10,
			lastUpdated: '2024-05-01',
		},
		{
			id: 6,
			planId: '60f40b4f14756a14f8735385',
			planName: 'Premium Plan',
			amount: 20,
			lastUpdated: '2024-05-02',
		},
	])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}
	const filteredUserData = userData.filter((user) =>
		user.planName.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedUserData = filteredUserData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)
	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Students User Details</PageTitle>
			<KTCard>
				<div className='d-flex align-items-center justify-content-between p-2 px-md-7 py-md-3'>
					<SearchFilter
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
					/>
					<LengthMenu
						expenseData={userData}
						handleItemsPerPageChange={handleItemsPerPageChange}
					/>
				</div>
				<div className='card-body py-4'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th className='text-center'>Plan Id</th>
									<th>Plan Name</th>
									<th>Price</th>
									<th>Last Update</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{paginatedUserData
								.slice()
								.reverse()
								.map((user, index) => (
									<tr key={user.id}>
										<td className='text-end'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{index + 1}
											</span>
										</td>
										<td className='text-center'>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{user.planId}
											</span>
										</td>

										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{user.planName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												₹ {user.amount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{user.lastUpdated}
											</span>
										</td>
										<td>
											<div data-bs-toggle='modal'
												data-bs-target='#kt_modal_exercise'>
												<TableButton
													action="edit"
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<UsersListPagination
						totalPages={Math.ceil(filteredUserData.length / pagination.itemsPerPage)}
						currentPage={pagination.page}
						onPageChange={handlePageChange}
					/>
				</div>
			</KTCard>
			<div
				className='modal fade'
				id='kt_modal_exercise'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-550px'>
					<div className='modal-content border-0'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>Fitnes Plan</h2>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body p-5'>
							<div className='mb-3'>
								<label
									htmlFor='planId'
									className='form-label'>
									Plan ID
								</label>
								<input
									type='text'
									className='form-control'
									id='planId'
									placeholder='Enter Plan ID'
									value={userData.length > 0 ? userData[0].planId : ''}
									disabled
								/>

								<label
									htmlFor='planName'
									className='form-label mt-3'>
									Plan Name
								</label>
								<input
									type='text'
									className='form-control'
									id='planName'
									placeholder='Enter Plan Name'
									value={userData.length > 0 ? userData[1].planName : ''}
									disabled
								/>
							</div>

							<div className='mb-3'>
								<label
									htmlFor='amount'
									className='form-label'>
									Amount
								</label>
								<input
									type='number'
									className='form-control'
									id='amount'
									placeholder='Enter Amount'
								/>
							</div>
						</div>

						<div className='modal-footer border-0 d-flex justify-content-center'>
							<TableButton
								action="edit"
								// onClick={() => handleUpdateFood()}
								text="Save Changes"
								showIcon={false}
								backgroundDark={true}
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
export default FitnessPlan
