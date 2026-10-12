import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import {
	faAt,
	faCalendarDays,
	faEnvelope,
	faMobileScreenButton,
	faWeightHanging,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Drawer } from '@mui/material'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import { KTIcon } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { ExerciseChartsWidget } from '../../../../_metronic/partials/widgets/charts/exercise-feedback-chart'
import UsersListPagination from '../../../components/TablePagination'

const ExerciseFeedback: React.FC = () => {
	const intl = useIntl()
	const [searchTerm, setSearchTerm] = useState('')
	const [salesData, setSalesData] = useState<any[]>([
		{ id: 1, name: 'Client A', latestUpdatedAt: '06/01/2022' },
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

	const [open, setOpen] = useState(false)

	const toggleDrawer = () => {
		setOpen(!open)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Exercise Details</PageTitle>
			<button
				onClick={() => setSalesData([''])}
				className='d-none'></button>
			<div className='card mt-10 pt-5'>
				<h1 className='fw-bold text-dark fs-1 mb-6  text-center'>
					Exercise-Bundle Details
				</h1>
				<div className='py-4 card-body'>
					<div className='px-0'>
						{/* begin::Body */}
						<div className='d-flex'>
							<div className='col-md-6'>
								<div className='text-center'>
									<ExerciseChartsWidget className='success' />
								</div>
							</div>
							<div className='col-md-6'>
								<div className='d-block mt-15'>
									<div className='d-flex align-items-center mt-5'>
										<div
											style={{
												width: '35px',
												height: '7px',
												backgroundColor: '#008ffb',
												borderRadius: '3px',
												margin: '0px 5px 0px 0px',
											}}></div>
										<h4 className='mb-0'>Non-Updated Clients</h4>
									</div>
								</div>
								<div className='d-block'>
									<div className='d-flex align-items-center mt-5'>
										<div
											style={{
												width: '35px',
												height: '7px',
												backgroundColor: 'rgb(0, 227, 150)',
												borderRadius: '3px',
												margin: '0px 5px 0px 0px',
											}}></div>
										<h4 className='mb-0'>Partially Update Clients</h4>
									</div>
								</div>
								<div className='d-block'>
									<div className='d-flex align-items-center mt-5'>
										<div
											style={{
												width: '35px',
												height: '7px',
												backgroundColor: 'rgb(254, 176, 25)',
												borderRadius: '3px',
												margin: '0px 5px 0px 0px',
											}}></div>
										<h4 className='mb-0'>Updated Clients</h4>
									</div>
								</div>
							</div>
						</div>
						{/* end::Body */}
					</div>
				</div>
			</div>
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
									<th>Latest Updated At</th>
									<th>Date</th>
									<th className='ps-4 rounded-end'>Remind</th>
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
												{sale.latestUpdatedAt}
											</span>
										</td>
										<td>
											<button
												className='btn btn-bg-light btn-active-color-primary mx-2 btn-sm me-1'
												onClick={toggleDrawer}>
												13-08-2023
											</button>
											<button className='btn btn-icon btn-bg-light btn-active-color-success mx-2 btn-sm me-1'>
												<FontAwesomeIcon
													icon={faCalendarDays}
													className='fs-3'
												/>
											</button>
										</td>
										<td>
											<button className='btn gap-2 btn-light-primary mx-2 btn-sm me-1'>
												<FontAwesomeIcon
													icon={faMobileScreenButton}
													className='fs-3'
												/>
											</button>
											<button className='btn gap-2 btn-light-warning mx-2 btn-sm me-1'>
												<FontAwesomeIcon
													icon={faAt}
													className='fs-3'
												/>
											</button>
											<button className='btn gap-2 btn-light-danger mx-2 btn-sm me-1'>
												<FontAwesomeIcon
													icon={faEnvelope}
													className='fs-3'
												/>
											</button>
											<button className='btn gap-2 btn-light-success mx-2 btn-sm me-1'>
												<FontAwesomeIcon
													icon={faWhatsapp}
													className='fs-3'
												/>
											</button>
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
			</div>
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
						<div className='modal-body scroll-y mx-3 pt-0 pb-15'>
							<div className='text-center mb-13'>
								<h2 className='mb-3'>Exercise-Bundle</h2>
							</div>
							<div>
								<div className='mb-5'>
									<label
										htmlFor='dfsf'
										className='required fw-bold fs-6 mb-2'>
										Bundle Name
									</label>
									<input
										placeholder='Bundle Name'
										type='text'
										className='form-control form-control-solid mb-3 mb-lg-0'
										autoComplete='off'
									/>
								</div>
								<div className='mb-5'>
									<label
										htmlFor='dfsf'
										className='required fw-bold fs-6 mb-2'>
										latestUpdatedAt
									</label>
									<textarea
										className='form-control form-control-solid mb-3 mb-lg-0'
										placeholder='Bundle latestUpdatedAt'></textarea>
								</div>
							</div>
							<div className='mt-7 text-center'>
								<button
									type='button'
									className='btn btn-primary w-50'>
									Save
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/*  */}
			<Drawer
				anchor='right'
				open={open}
				onClose={toggleDrawer}>
				<div
					className='card'
					style={{ width: '350px' }}>
					<div className='card-body text-center p-3'>
						{/* begin::Chart */}
						<div>
							<ExerciseChartsWidget className='success' />
						</div>
						{/* end::Chart */}
						<div className='text-center'>
							<div className='d-flex align-items-center mt-5'>
								<div
									style={{
										width: '35px',
										height: '7px',
										backgroundColor: '#008ffb',
										borderRadius: '3px',
										margin: '0px 5px 0px 0px',
									}}></div>
								<h4 className='mb-0'>Non-Updated Clients</h4>
							</div>
							<div className='d-flex align-items-center mt-5'>
								<div
									style={{
										width: '35px',
										height: '7px',
										backgroundColor: 'rgb(0, 227, 150)',
										borderRadius: '3px',
										margin: '0px 5px 0px 0px',
									}}></div>
								<h4 className='mb-0'>Partially Update Clients</h4>
							</div>
							<div className='d-flex align-items-center mt-5'>
								<div
									style={{
										width: '35px',
										height: '7px',
										backgroundColor: 'rgb(254, 176, 25)',
										borderRadius: '3px',
										margin: '0px 5px 0px 0px',
									}}></div>
								<h4 className='mb-0'>Updated Clients</h4>
							</div>
						</div>
					</div>
					<div className='mt-5 p-5'>
						<div className='text-center'>
							<img
								src='/media/avatars/300-1.jpg'
								alt='Gomzi Nutrition Product'
								style={{ width: '80px', height: '80px', borderRadius: '10px' }}
							/>
							<h6 className='fw-bold text-dark fs-1 mt-6  text-center'>
								Client A
							</h6>
						</div>
						<div className='bg-light-success text-center rounded p-4 mb-5 mt-6'>
							{/* begin::Icon */}
							<div className='text-success'>
								<FontAwesomeIcon
									icon={faWeightHanging}
									className='text-success fs-1'
								/>
							</div>
							<div>
								<span className='fw-bold text-gray-800 text-hover-success fs-2'>+1000</span>
							</div>
						</div>
						<div className='pt-7'>
							<h3>Date : 06/01/2022</h3>
							<hr />
							<div className='d-flex mb-4'>
								<div className='col-md-6'>
									<h5>Cycle</h5>
								</div>
								<div className='col-md-6'>
									<h5>2022-01-06T00:57:00.518Z</h5>
								</div>
							</div>
							<div className='d-flex mb-4'>
								<div className='col-md-6'>
									<h5>Cycle</h5>
								</div>
								<div className='col-md-6'>
									<h5>2022-01-06T00:57:00.518Z</h5>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Drawer>
		</>
	)
}

export default ExerciseFeedback

// function getChartOptions(height: number, width: number): ApexOptions {
// 	return {
// 		series: [30, 78, 35],
// 		chart: {
// 			fontFamily: 'inherit',
// 			type: 'donut',
// 			width: width,
// 			height: height,
// 		},
// 		plotOptions: {},
// 		legend: {
// 			show: false,
// 		},
// 		dataLabels: {
// 			enabled: false,
// 		},
// 		stroke: {
// 			show: true,
// 			width: 2,
// 			colors: ['transparent'],
// 		},
// 		fill: {
// 			opacity: 1,
// 		},
// 		states: {
// 			normal: {
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 			hover: {
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 		},
// 	}
// }

// function getChartOptions1(height: number, width: number): ApexOptions {
// 	return {
// 		series: [30, 78, 35, 35, 35],
// 		chart: {
// 			fontFamily: 'inherit',
// 			type: 'donut',
// 			width: width,
// 			height: height,
// 		},
// 		plotOptions: {},
// 		legend: {
// 			show: false,
// 		},
// 		dataLabels: {
// 			enabled: false,
// 		},
// 		stroke: {
// 			show: true,
// 			width: 2,
// 			colors: ['transparent'],
// 		},
// 		fill: {
// 			opacity: 1,
// 		},
// 		states: {
// 			normal: {
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 			hover: {
// 				filter: {
// 					type: 'none',
// 					value: 0,
// 				},
// 			},
// 		},
// 	}
// }
