import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'
import { KTCard } from '../../../../../_metronic/helpers'
import { PageTitle } from '../../../../../_metronic/layout/core'
import TableButton from '../../../../components/TableButton'

const BookUserOrderView = () => {
	const intl = useIntl()
	return (
		<>
			<PageTitle breadcrumbs={[]}>User Order View</PageTitle>

			<KTCard>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>Order Overview</h2>
					<div className='row'>
						<div className='col-md-12 fv-row mb-7'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>Order ID:</th>
											<th>Receipt ID:</th>
											<th>Order Date/Time:</th>
											<th>Gateway:</th>
											<th>Status:</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													660e9d3dd8ff4f8d9f2a523c
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													FGIIT-1558618369393
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													Create: 04/04/2024, 05:59:49 PM
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													RAZORPAY FGIIT
												</span>
											</td>
											<td>
												<span className='text-white fw-bold  btn btn-success p-2 mb-1 fs-6'>
													Success
												</span>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>User Details</h2>
					<div className='row'>
						<div className='col-md-12 fv-row mb-7'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>ID:</th>
											<th>User ID:</th>
											<th>Full Name:</th>
											<th>Email: </th>
											<th>Mobile:</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													62f75661545223e07208fb4e
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													1557181157229
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													DVS Demo
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													khudse1805@gmail.com
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													+917486873619
												</span>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
					<div className='col-md-12 fv-row mt-5 mb-2 d-flex justify-content-end'>
						<TableButton
							action="view"
							to='/fgiit/users/view-user'
							text="View User"
							backgroundDark={true}
							showIcon={false}
							className='me-5'
						/>
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>
						Item Details (Current){' '}
					</h2>
					<div className='row'>
						<div className='col-md-12 fv-row mb-7'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>Item ID:</th>
											<th>Item Name:</th>
											<th>Item Type:</th>
											<th>Amount/Price: </th>
											<th>Duration (in days):</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													61e9e0855043184f0c080396
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													Diploma In Personal Training
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													BOOKS
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													599.00 INR
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													- Days
												</span>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>Subscription Details</h2>
					<div className='col-md-12 fv-row mt-5 mb-2 d-flex justify-content-start'>
						<Link to='/fgiit/book-order-view'>
							<button
								type='button'
								className='btn btn-primary mx-2'>
								Track Order
							</button>
						</Link>
					</div>
				</div>
			</KTCard>

			<KTCard className='mt-5'>
				<div className='card-body mt-4 mb-4'>
					<h2 className='fw-bold text-dark fs-1 mb-6 '>
						Order & Payment Overview
					</h2>
					<div className='row'>
						<div className='col-md-12 fv-row mb-7'>
							<div className='table-responsive'>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>ID:</th>
											<th>Purchase mode:</th>
											<th>Receipt:</th>
											<th>Price:</th>
											<th>Created At:</th>
											<th>Update At:</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													660e9d3dd8ff4f8d9f2a523c
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													ONLINE
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													FGIIT-1558618369393
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													599.00 INR
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													04/04/2024, 05:59:49 PM
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													10/05/2024, 05:13:09 PM
												</span>
											</td>
										</tr>
									</tbody>
								</table>
								<table
									id='kt_table_users'
									className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'>
									<thead>
										<tr className='fw-bold text-muted'>
											<th>Status:</th>
											<th>Gateway:</th>
											<th>Gateway Order ID:</th>
											<th>Gateway Payment ID:</th>
											<th>Notes:</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>
												<span className='text-dark fw-bold  btn btn-success p-2 mb-1 fs-6'>
													Success
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													RAZORPAY_FGIIT
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													order_NuXtGrwiGWm6EW
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													pay_NuXtXuV9pRYDkP
												</span>
											</td>
											<td>
												<span className='text-dark fw-bold   mb-1 fs-6'>
													<ul>
														<li>ADDRESS LINE 1: sdfsd</li>
														<li>ADDRESS LINE 2: sdfsd</li>
														<li>CITY: surat</li>
														<li>PIN CODE: 394107</li>
														<li>QUANTITY: 1</li>
													</ul>
												</span>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</KTCard>
		</>
	)
}
export { BookUserOrderView }
