import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import UsersListPagination from '../../../../components/TablePagination'

const FitnessPlanOrder: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [foodtimeData] = useState([
		{
			no: 1,
			profile_image: '',
			ReceiptID: 'FGIIT-631416076038',
			UserID: '1311581868891',
			UserName: 'FG USER',
			Mobile: '+91 6353626531',
			ItemName: 'Diploma In Personal Training',
			Amount: '1179 INR',
			PurchaseMode: 'ONLINE',
			PlanActivatedOn: '17/07/2022 04:51:29 AM',
		},
	])
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
	const filteredFoodTimeData = foodtimeData.filter((foodtime) =>
		foodtime.ItemName.toLowerCase().includes(searchTerm.toLowerCase())
	)
	const paginatedFoodTimeData = filteredFoodTimeData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)
	return (
		<>
			<PageTitle breadcrumbs={[]}>User Fitness Plan</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between mx-3 m-5'>
					<div className='d-flex pt-1 mx-2'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div className='me-5'>
						<LengthMenu
							expenseData={foodtimeData}
							handleItemsPerPageChange={handleItemsPerPageChange}
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
									<th>User</th>
									<th>Receipt ID</th>
									<th>User ID</th>
									<th>Item Name</th>
									<th>Price</th>
									<th>Purchase Mode</th>
									<th className='ps-4 rounded-end'>Plan Activated On</th>
								</tr>
							</thead>
							<tbody>
								{paginatedFoodTimeData
								.slice()
								.reverse()
								.map((foodtime, index) => (
									<tr key={foodtime.no}>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{index + 1}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='symbol symbol-45px me-3'>
													<img
														src={
															foodtime.profile_image
																? `https://files.fggroup.in/${foodtime.profile_image}`
																: toAbsoluteUrl('/media/logos/fgiit-logo.png')
														}
														alt='User'
														style={{ width: '50px', height: '50px' }}
													/>
												</div>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{foodtime.UserName}
													</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{foodtime.Mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{foodtime.ReceiptID}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{foodtime.UserID}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{foodtime.ItemName}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												₹ {foodtime.Amount}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{foodtime.PurchaseMode}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{foodtime.PlanActivatedOn}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{foodtimeData.length === 0 && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{foodtimeData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredFoodTimeData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default FitnessPlanOrder
