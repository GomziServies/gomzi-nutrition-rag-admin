import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'

const DigitalPlanOrder: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [foodAddData, setFoodAddData] = useState({
		CourseID: '',
		CourseName: '',
		Currency: '',
		Amount: '',
	})
	const [foodtimeData] = useState([
		{
			no: 1,
			profile_image: '',
			UserID: '1265435310039',
			UserName: 'Smit Luvani',
			Mobile: '+91 9999999999',
			ItemName: 'Digital Freedom',
			PlanActivatedOn: '27/09/2021 10:26:55 PM',
		},
	])
	const [selectedSubject, setSelectedSubject] = useState('')
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

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target
		setFoodAddData({ ...foodAddData, [name]: value })
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>User Digital Plans</PageTitle>
			<KTCard>
				<div className='d-flex justify-content-between mx-8 m-5'>
					<div className='d-flex pt-1'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
					</div>
					<div>
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
									<th>User ID</th>
									<th>User</th>
									<th>Item Name</th>
									<th>Plan Activated On</th>
									<th className='ps-4 rounded-end'>Action</th>
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
															{foodtime.Mobile || ''}
														</span>
													</div>
												</div>
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
													{foodtime.PlanActivatedOn}
												</span>
											</td>
											<td>
												<div className='d-flex justify-content-center'>
													<div
														data-bs-toggle='modal'
														data-bs-target='#kt_modal_food_time'>
														<TableButton
															action='view'
															text='View'
															showIcon={false}
															backgroundDark={true}
														/>
													</div>
													<TableButton
														action='assign'
														to='/fgiit/book-user-order-view'
														text='Explore'
														showIcon={false}
														backgroundDark={true}
													/>
												</div>
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
			<div
				className='modal fade'
				id='kt_modal_food_time'
				aria-hidden='true'>
				<div className='modal-dialog modal-dialog-centered mw-750px'>
					<div className='modal-content'>
						<div className='modal-header justify-content-between'>
							<h2 className='fw-bolder'>User Digital Plan</h2>
							<div
								className='btn btn-sm btn-icon btn-active-color-primary'
								data-bs-dismiss='modal'>
								<FontAwesomeIcon
									className='fs-1 position-absolute ms-3'
									icon={faXmark}
								/>
							</div>
						</div>
						<div className='modal-body scroll-y'>
							<div className='row'>
								<div className='col-md-4'>
									<h2 className='fw-bolder my-5'>Order info:</h2>
									<div>
										<h3 className='my-5'>Receipt ID:</h3>
										<h3 className='my-3'>Item Name:</h3>
										<p>Digital Freedom</p>
										<h3 className='my-3'>Notes:</h3>
										<p>No Data</p>
										<h3 className='my-3'>Status:</h3>
									</div>
								</div>
								<div className='col-md-4'>
									<h2 className='fw-bolder my-5'>Payment info:</h2>
									<div>
										<h3 className='mt-5 mb-3'>Purchase mode:</h3>
										<p>N/A</p>
										<h3 className='my-3'>Razorpay Order ID:</h3>
										<p>N/A</p>
										<h3 className='my-3'>Razorpay Payment ID:</h3>
										<p>N/A</p>
										<h3 className='my-3'>Payment Time:</h3>
										<p>N/A</p>
									</div>
								</div>
								<div className='col-md-4'>
									<h2 className='fw-bolder my-5'>Current Item info:</h2>
									<div>
										<h3 className='mt-5 mb-3'>Item Name:</h3>
										<p>Digital Freedom</p>
										<h3 className='my-3'>Current Amount:</h3>
										<p>14160</p>
										<h3 className='my-3'>Current Duration:</h3>
										<p>180</p>
									</div>
								</div>
								<div className='col-md-4 mt-5'>
									<h2 className='fw-bolder my-5 mt-5'>Plan Information:</h2>
									<div>
										<h3 className='mt-5 mb-3'>Plan ID:</h3>
										<p>6151f7d7a339e52f42149d94</p>
										<h3 className='my-3'>Started On:</h3>
										<p>27/09/2021 10:26:55 PM</p>
										<h3 className='my-3'>Expected End:</h3>
										<p>26/03/2022 10:26:55 PM</p>
										<h3 className='my-3'>Status:</h3>
										<p>Expired</p>
									</div>
								</div>
							</div>
						</div>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action='edit'
								text='Fetch Payment'
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

export default DigitalPlanOrder
