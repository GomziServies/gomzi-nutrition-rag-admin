import { faEdit, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import TableButton from '../../../components/TableButton'

const PTClientList: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')

	const [salesData, setSalesData] = useState<any[]>([
		{
			id: 1,
			name: 'avadh vanpariay',
			duration: '3 Months',
			planName: 'General Trainer',
			planPrice: '10,000',
			commission: 'NaN',
		},
		{
			id: 2,
			name: 'yash',
			duration: '6 Months',
			planName: 'General Trainer',
			planPrice: '10,000',
			commission: 'NaN',
		},
	])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const filteredSalesData = salesData.filter((sale) =>
		sale.name.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedSalesData = filteredSalesData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>All Trainer List</PageTitle>
			<h1 className='fw-bold text-dark fs-1 mb-6 '>All Trainer List</h1>
			<button
				onClick={() => setSalesData([''])}
				className='d-none'></button>
			<KTCard>
				
				<div className='card-header border-0 pt-6'>
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
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<table
							id='kt_table_users'
							className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-dashed table-row-gray-300 align-middle'>
							<thead>
								<tr className='fw-bold text-muted bg-light border-bottom-0'>
									<th className='ps-4 rounded-start'>No.</th>
									<th className='min-w-150px'>No.</th>
									<th className='min-w-150px'>Name</th>
									<th className='min-w-150px'>Duration</th>
									<th className='min-w-150px'>Plan Name</th>
									<th className='min-w-150px'>Plan Price</th>
									<th className='min-w-150px'>Commission</th>
									<th className='min-w-150px'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{paginatedSalesData.map((sale, index) => (
									<tr key={sale.id}>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{index + 1}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.name}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.duration}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.planName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.planPrice}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.commission}
											</span>
										</td>
										<td>
											<div data-bs-toggle='modal'
												data-bs-target='#kt_modal_invite_friendsssss'>
												<TableButton
													action="edit"
												/>
											</div>

											<TableButton
												action="remove"
											// onClick={() => handleDeleteFeature(data._id)}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{salesData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{salesData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(salesData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
			<div
				className='modal fade'
				id='kt_modal_invite_friendsssss'
				aria-hidden='true'>
				<div className='modal-dialog mw-650px'>
					<div className='modal-content'>
						<div className='modal-header pb-0 border-0 justify-content-end'>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body scroll-y mx-5 mx-xl-18 pt-0 pb-15'>
							<div className='text-center mb-13'>
								<h1 className='mb-3'>Update User</h1>
							</div>
							<div>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Month
								</label>
								<select
									className='form-control form-select form-control-solid mb-8'
									autoComplete='off'>
									<option>Select Month</option>
									<option>1 Month</option>
									<option>3 Months</option>
									<option>6 Months</option>
									<option>12 Months</option>
								</select>
							</div>
							<div>
								<label
									htmlFor='dfsf'
									className='required fw-bold fs-6 mb-2'>
									Plan
								</label>
								<select
									className='form-control form-select form-control-solid mb-8'
									autoComplete='off'>
									<option>Select Plan</option>
									<option>General Client</option>
									<option>PT Client</option>
								</select>
							</div>
							<div className='mb-7'>
								<button
									type='button'
									className='btn btn-primary w-100'>
									Create Trainer
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default PTClientList
