/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { KTIcon, toAbsoluteUrl } from '../../../helpers'
import { EmployeeDropdown } from '../../content/dropdown/EmployeeDropdown'

type Props = {
	className: string
}

const TablesWidget10: React.FC<Props> = ({ className }) => {
	return (
		<div className={`card ${className}`}>
			{/* begin::Header */}
			<div className='card-header border-0 pt-5'>
				<h3 className='card-title align-items-start flex-column'>
					<span className='card-label fw-bold fs-3 mb-1'>Employee Statistics</span>
					<span className='text-muted mt-1 fw-semibold fs-7'>Employee</span>
				</h3>
				<div className='card-toolbar'>
					{/* begin::Menu */}
					<button
						type='button'
						className={`btn border-0 fs-4 px-3 py-1 btn-primary`}
						data-kt-menu-trigger='click'
						data-kt-menu-placement='bottom-end'
						data-kt-menu-flip='top-end'>
						<KTIcon
							iconName='filter'
							className='fs-4'
						/>
						Filter
					</button>
					<EmployeeDropdown />
					{/* end::Menu */}
				</div>
			</div>
			{/* end::Header */}
			{/* begin::Body */}
			<div className='card-body py-3'>
				{/* begin::Table container */}
				<div className='table-responsive'>
					{/* begin::Table */}
					<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
						{/* begin::Table head */}
						<thead>
							<tr className='fw-bold text-muted'>
								<th className='w-25px'>
									<div className='form-check form-check-sm form-check-custom form-check-solid'>
										<input
											className='form-check-input'
											type='checkbox'
											value='1'
											data-kt-check='true'
											data-kt-check-target='.widget-9-check'
										/>
									</div>
								</th>
								<th className='min-w-150px'>Name</th>
								<th className='min-w-140px'>Role</th>
								<th className='min-w-120px'>Work Progress</th>
								<th className='min-w-100px text-end'>Actions</th>
							</tr>
						</thead>
						{/* end::Table head */}
						{/* begin::Table body */}
						<tbody>
							<tr>
								<td>
									<div className='form-check form-check-sm form-check-custom form-check-solid'>
										<input
											className='form-check-input widget-9-check'
											type='checkbox'
											value='1'
										/>
									</div>
								</td>
								<td>
									<div className='d-flex align-items-center'>
										<div className='symbol symbol-45px me-5'>
											<img
												src={toAbsoluteUrl('/media/avatars/300-14.jpg')}
												alt=''
											/>
										</div>
										<div className='d-flex justify-content-start flex-column'>
											<a
												href='#'
												className='text-dark fw-bold text-hover-primary fs-6'>
												Ana Simmons
											</a>
										</div>
									</div>
								</td>
								<td>
									<a
										href='#'
										className='text-dark fw-bold text-hover-primary d-block fs-6'>
										Sales
									</a>
								</td>
								<td className='text-end'>
									<div className='d-flex flex-column w-100 me-2'>
										<div className='d-flex flex-stack mb-2'>
											<span className='text-muted me-2 fs-7 fw-semibold'>50%</span>
										</div>
										<div className='progress h-6px w-100'>
											<div
												className='progress-bar bg-primary'
												role='progressbar'
												style={{ width: '50%' }}></div>
										</div>
									</div>
								</td>
								<td>
									<div className='d-flex justify-content-end flex-shrink-0'>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='pencil'
												className='fs-3'
											/>
										</a>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='notification'
												className='fs-3'
											/>
										</a>
									</div>
								</td>
							</tr>
							<tr>
								<td>
									<div className='form-check form-check-sm form-check-custom form-check-solid'>
										<input
											className='form-check-input widget-9-check'
											type='checkbox'
											value='1'
										/>
									</div>
								</td>
								<td>
									<div className='d-flex align-items-center'>
										<div className='symbol symbol-45px me-5'>
											<img
												src={toAbsoluteUrl('/media/avatars/300-2.jpg')}
												alt=''
											/>
										</div>
										<div className='d-flex justify-content-start flex-column'>
											<a
												href='#'
												className='text-dark fw-bold text-hover-primary fs-6'>
												Jessie Clarcson
											</a>
										</div>
									</div>
								</td>
								<td>
									<a
										href='#'
										className='text-dark fw-bold text-hover-primary d-block fs-6'>
										Web Developer
									</a>
								</td>
								<td className='text-end'>
									<div className='d-flex flex-column w-100 me-2'>
										<div className='d-flex flex-stack mb-2'>
											<span className='text-muted me-2 fs-7 fw-semibold'>70%</span>
										</div>
										<div className='progress h-6px w-100'>
											<div
												className='progress-bar bg-danger'
												role='progressbar'
												style={{ width: '80%' }}></div>
										</div>
									</div>
								</td>
								<td>
									<div className='d-flex justify-content-end flex-shrink-0'>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='pencil'
												className='fs-3'
											/>
										</a>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='notification'
												className='fs-3'
											/>
										</a>
									</div>
								</td>
							</tr>
							<tr>
								<td>
									<div className='form-check form-check-sm form-check-custom form-check-solid'>
										<input
											className='form-check-input widget-9-check'
											type='checkbox'
											value='1'
										/>
									</div>
								</td>
								<td>
									<div className='d-flex align-items-center'>
										<div className='symbol symbol-45px me-5'>
											<img
												src={toAbsoluteUrl('/media/avatars/300-5.jpg')}
												alt=''
											/>
										</div>
										<div className='d-flex justify-content-start flex-column'>
											<a
												href='#'
												className='text-dark fw-bold text-hover-primary fs-6'>
												Lebron Wayde
											</a>
										</div>
									</div>
								</td>
								<td>
									<a
										href='#'
										className='text-dark fw-bold text-hover-primary d-block fs-6'>
										Graphic Designer
									</a>
								</td>
								<td className='text-end'>
									<div className='d-flex flex-column w-100 me-2'>
										<div className='d-flex flex-stack mb-2'>
											<span className='text-muted me-2 fs-7 fw-semibold'>60%</span>
										</div>
										<div className='progress h-6px w-100'>
											<div
												className='progress-bar bg-success'
												role='progressbar'
												style={{ width: '60%' }}></div>
										</div>
									</div>
								</td>
								<td>
									<div className='d-flex justify-content-end flex-shrink-0'>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='pencil'
												className='fs-3'
											/>
										</a>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='notification'
												className='fs-3'
											/>
										</a>
									</div>
								</td>
							</tr>
							<tr>
								<td>
									<div className='form-check form-check-sm form-check-custom form-check-solid'>
										<input
											className='form-check-input widget-9-check'
											type='checkbox'
											value='1'
										/>
									</div>
								</td>
								<td>
									<div className='d-flex align-items-center'>
										<div className='symbol symbol-45px me-5'>
											<img
												src={toAbsoluteUrl('/media/avatars/300-20.jpg')}
												alt=''
											/>
										</div>
										<div className='d-flex justify-content-start flex-column'>
											<a
												href='#'
												className='text-dark fw-bold text-hover-primary fs-6'>
												Natali Goodwin
											</a>
										</div>
									</div>
								</td>
								<td>
									<a
										href='#'
										className='text-dark fw-bold text-hover-primary d-block fs-6'>
										Trainer
									</a>
								</td>
								<td className='text-end'>
									<div className='d-flex flex-column w-100 me-2'>
										<div className='d-flex flex-stack mb-2'>
											<span className='text-muted me-2 fs-7 fw-semibold'>80%</span>
										</div>
										<div className='progress h-6px w-100'>
											<div
												className='progress-bar bg-warning'
												role='progressbar'
												style={{ width: '80%' }}></div>
										</div>
									</div>
								</td>
								<td>
									<div className='d-flex justify-content-end flex-shrink-0'>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='pencil'
												className='fs-3'
											/>
										</a>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='notification'
												className='fs-3'
											/>
										</a>
									</div>
								</td>
							</tr>
							<tr>
								<td>
									<div className='form-check form-check-sm form-check-custom form-check-solid'>
										<input
											className='form-check-input widget-9-check'
											type='checkbox'
											value='1'
										/>
									</div>
								</td>
								<td>
									<div className='d-flex align-items-center'>
										<div className='symbol symbol-45px me-5'>
											<img
												src={toAbsoluteUrl('/media/avatars/300-23.jpg')}
												alt=''
											/>
										</div>
										<div className='d-flex justify-content-start flex-column'>
											<a
												href='#'
												className='text-dark fw-bold text-hover-primary fs-6'>
												Kevin Leonard
											</a>
										</div>
									</div>
								</td>
								<td>
									<a
										href='#'
										className='text-dark fw-bold text-hover-primary d-block fs-6'>
										Coach
									</a>
								</td>
								<td className='text-end'>
									<div className='d-flex flex-column w-100 me-2'>
										<div className='d-flex flex-stack mb-2'>
											<span className='text-muted me-2 fs-7 fw-semibold'>90%</span>
										</div>
										<div className='progress h-6px w-100'>
											<div
												className='progress-bar bg-info'
												role='progressbar'
												style={{ width: '90%' }}></div>
										</div>
									</div>
								</td>
								<td>
									<div className='d-flex justify-content-end flex-shrink-0'>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='pencil'
												className='fs-3'
											/>
										</a>
										<a
											href='#'
											className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
											<KTIcon
												iconName='notification'
												className='fs-3'
											/>
										</a>
									</div>
								</td>
							</tr>
						</tbody>
						{/* end::Table body */}
					</table>
					{/* end::Table */}
				</div>
				{/* end::Table container */}
			</div>
			{/* begin::Body */}
		</div>
	)
}

export { TablesWidget10 }
