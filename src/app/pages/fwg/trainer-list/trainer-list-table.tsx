import { faEdit, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import { KTCard, KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { useListView } from '../../../modules/apps/user-management/users-list/core/ListViewProvider'
import TableButton from '../../../components/TableButton'

// Define the interface for pagination props
type PaginationProps = {
	totalPages: number
	currentPage: number
	onPageChange: (page: number) => void
}

// Define the UsersListPagination component
const UsersListPagination: React.FC<PaginationProps> = ({
	totalPages,
	currentPage,
	onPageChange,
}) => {
	const getPageNumbers = () => {
		const pageNumbers = []
		for (let i = 1; i <= totalPages; i++) {
			pageNumbers.push(i)
		}
		return pageNumbers
	}

	return (
		<div className='row mt-4'>
			<div className='col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start'></div>
			<div className='col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end'>
				<div id='kt_table_users_paginate'>
					<ul className='pagination'>
						<li className={currentPage === 1 ? 'page-item disabled' : 'page-item'}>
							<button
								className='page-link'
								onClick={() => onPageChange(currentPage - 1)}
								aria-label='Previous'>
								<span aria-hidden='true'>&laquo;</span>
							</button>
						</li>
						{getPageNumbers().map((number) => (
							<li
								key={number}
								className={currentPage === number ? 'page-item active' : 'page-item'}>
								<button
									className='page-link'
									onClick={() => onPageChange(number)}>
									{number}
								</button>
							</li>
						))}
						<li className={currentPage === totalPages ? 'page-item disabled' : 'page-item'}>
							<button
								className='page-link'
								onClick={() => onPageChange(currentPage + 1)}
								aria-label='Next'>
								<span aria-hidden='true'>&raquo;</span>
							</button>
						</li>
					</ul>
				</div>
			</div>
		</div>
	)
}

const TrainerListTable: React.FC = () => {
	const intl = useIntl()
	const { selected } = useListView()
	const [searchTerm, setSearchTerm] = useState('')

	const [salesData, setSalesData] = useState<any[]>([
		{
			id: 1,
			userName: 'avadh vanpariay',
			mobile: '+91 98924049460',
			designation: 'General Trainer',
			client: 1,
			commission: '15%',
		},
		{
			id: 2,
			userName: 'yash',
			mobile: '+91 98924049460',
			designation: 'General Trainer',
			client: 1,
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
		sale.userName.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedSalesData = filteredSalesData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	return (
		<>
			<PageTitle breadcrumbs={[]}>All Trainer List</PageTitle>
			<h1 className='fw-bold text-dark fs-1 mb-6 '>All Trainer List</h1>
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
					<div className='card-toolbar'>
						<TableButton
							action="add"
							to='/fwg/add-trainer'
							text="Add Trainer"
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
									<th className='min-w-150px'>No.</th>
									<th className='min-w-150px'>Name</th>
									<th className='min-w-150px'>Mobile</th>
									<th className='min-w-150px'>Designation</th>
									<th className='min-w-150px'>Client</th>
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
												{sale.userName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.mobile}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.designation}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{sale.client}
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
											/>

											<TableButton
												action="remove"
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
		</>
	)
}

export default TrainerListTable
