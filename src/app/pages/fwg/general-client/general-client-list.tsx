import React, { useState } from 'react'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import UsersListPagination from '../../../components/TablePagination'
import TableButton from '../../../components/TableButton'

const GeneralClientList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [salesData, setSalesData] = useState<any[]>([
		{
			id: 1,
			name: 'avadh vanpariay',
			duration: '3 Months',
			planName: 'General Trainer',
			planPrice: '10,000',
			commission: '15%',
		},
		{
			id: 2,
			name: 'yash',
			duration: '6 Months',
			planName: 'General Trainer',
			planPrice: '10,000',
			commission: '15%',
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
											<TableButton
												action="edit"
												// onClick={() => handleSetData(data)}
											/>

											<TableButton
												action="remove"
												// onClick={() => handleDeleteFeature(data._id)}
											/>
											{/* <button className='btn btn-icon btn-bg-light btn-active-color-primary mx-2 btn-sm me-1'>
												<KTIcon
													iconName='pencil'
													className='fs-3'
												/>
											</button>
											<button className='btn btn-icon btn-bg-light btn-active-color-danger mx-2 btn-sm me-1'>
												<KTIcon
													iconName='remove'
													className='fs-3'
												/>
											</button> */}
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
		</>
	)
}

export default GeneralClientList
