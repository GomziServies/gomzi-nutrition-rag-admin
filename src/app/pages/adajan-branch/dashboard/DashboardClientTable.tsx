import React, { useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import LengthMenu from '../../../components/LengthMenu'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'

interface ClientRow {
	_id: string
	name: string
	phone: string
	email: string
	planDuration: string
	joiningDate: string
	daysRemaining: number
	image?: string
}

const DUMMY_CLIENTS: ClientRow[] = [
	{
		_id: '1',
		name: 'Rajesh Kumar',
		phone: '9876543210',
		email: 'rajesh.kumar@example.com',
		planDuration: '1 Month',
		joiningDate: '2025-01-07',
		daysRemaining: 3,
		image:
			'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=300&auto=format&fit=crop',
	},
	{
		_id: '2',
		name: 'Priya Patel',
		phone: '9123456789',
		email: 'priya.patel@example.com',
		planDuration: '1 Month',
		joiningDate: '2024-12-28',
		daysRemaining: 7,
		image:
			'https://images.unsplash.com/photo-1571731956622-39fa5f336331?q=80&w=300&auto=format&fit=crop',
	},
	{
		_id: '3',
		name: 'Amit Shah',
		phone: '9988776655',
		email: 'amit.shah@example.com',
		planDuration: '1 Month',
		joiningDate: '2025-01-05',
		daysRemaining: 5,
		image:
			'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=300&auto=format&fit=crop',
	},
	{
		_id: '4',
		name: 'Neha Sharma',
		phone: '9654321789',
		email: 'neha.sharma@example.com',
		planDuration: '3 Months',
		joiningDate: '2024-11-10',
		daysRemaining: -10,
		image:
			'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=300&auto=format&fit=crop',
	},
	{
		_id: '5',
		name: 'Vikram Desai',
		phone: '9876512340',
		email: 'vikram.desai@example.com',
		planDuration: '1 Month',
		joiningDate: '2024-12-20',
		daysRemaining: 15,
		image:
			'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=300&auto=format&fit=crop',
	},
	{
		_id: '6',
		name: 'Kiran Modi',
		phone: '9876512341',
		email: 'kiran.modi@example.com',
		planDuration: '1 Month',
		joiningDate: '2024-12-19',
		daysRemaining: 16,
		image:
			'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300&auto=format&fit=crop',
	},
	{
		_id: '7',
		name: 'Rahul Joshi',
		phone: '9876512342',
		email: 'rahul.joshi@example.com',
		planDuration: '1 Month',
		joiningDate: '2024-12-15',
		daysRemaining: 20,
		image:
			'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300&auto=format&fit=crop',
	},
]

const DashboardClientTable: React.FC = () => {
	const [clients] = useState<ClientRow[]>(DUMMY_CLIENTS)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 5,
	})

	// Filter clients with 30 or fewer days remaining and sort them
	const sortedClients = [...clients]
		.filter((c) => c.daysRemaining <= 30)
		.sort((a, b) => a.daysRemaining - b.daysRemaining)

	// Pagination logic
	const totalPages = Math.ceil(sortedClients.length / pagination.itemsPerPage)
	const paginatedClients = sortedClients.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	return (
		<KTCard>
			<div className='card-header border-0 pt-6'>
				<div className='d-flex flex-wrap align-items-center justify-content-between w-100'>
					<h3 className='card-title fw-bold'>Adajan-Branch Clients (Expiring within 1 Month)</h3>
					<LengthMenu
						expenseData={clients}
						handleItemsPerPageChange={handleItemsPerPageChange}
					/>
				</div>
			</div>
			<div className='py-4 card-body'>
				<div className='table-responsive'>
					<table className='table align-middle table-row-dashed gy-5'>
						<thead>
							<tr className='text-start text-muted fw-bold text-uppercase gs-0'>
								<th className='min-w-100px text-center'>No.</th>
								<th className='min-w-150px text-center'>Name</th>
								<th className='min-w-125px text-center'>Phone</th>
								<th className='min-w-200px text-center'>Email</th>
								<th className='min-w-100px text-center'>Remaining Days</th>
								<th className='min-w-100px text-center'>Plan Duration</th>
								<th className='min-w-125px text-center'>Joining Date</th>
								<th className='min-w-100px text-center'>Action</th>
							</tr>
						</thead>
						<tbody className='fw-semibold'>
							{paginatedClients.map((client, index) => (
								<tr key={client._id}>
									<td className='text-center'>
										<span className='text-dark fw-bold fs-6'>
											{(pagination.page - 1) * pagination.itemsPerPage + index + 1}
										</span>
									</td>
									<td>
										<span className='text-dark fw-bold fs-6'>{client.name}</span>
									</td>
									<td>
										<span className='text-dark fs-6'>{client.phone}</span>
									</td>
									<td>
										<span className='text-dark fs-6'>{client.email}</span>
									</td>
									<td className='text-center align-middle'>
										{client.daysRemaining <= 0 ? (
											<span
												className='badge rounded-pill py-2 px-3'
												style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
												{Math.abs(client.daysRemaining)} Days Expired
											</span>
										) : client.daysRemaining <= 30 ? (
											<span
												className='badge rounded-pill py-2 px-3'
												style={{ backgroundColor: '#fff5f8', color: '#f1416c' }}>
												{client.daysRemaining} Days Remaining
											</span>
										) : (
											<span
												className='badge rounded-pill py-2 px-3'
												style={{ backgroundColor: '#e8fff3', color: '#50cd89' }}>
												{client.daysRemaining} Days Remaining
											</span>
										)}
									</td>
									<td>
										<span className='badge badge-light-primary'>{client.planDuration}</span>
									</td>
									<td className='text-center align-middle'>
										<span className='text-dark fs-6'>
											{new Date(client.joiningDate).toLocaleDateString('en-IN', {
												day: '2-digit',
												month: 'short',
												year: 'numeric',
											})}
										</span>
									</td>
									<td className='text-center align-middle'>
										<TableButton
											action='view'
											to={`/adajan-branch/client/view?id=${client._id}`}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{clients.length > 0 && (
					<div className='mt-5'>
						<UsersListPagination
							totalPages={totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>
		</KTCard>
	)
}

export { DashboardClientTable }
