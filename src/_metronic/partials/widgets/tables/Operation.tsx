import { faBook, faFile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { subDays } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DateRangePicker } from 'rsuite'
import 'rsuite/DateRangePicker/styles/index.css'
import { KTIcon } from '../../../helpers'

type Props = {
	className: string
}

const Operation: React.FC<Props> = ({ className }) => {
	// const [searchQuery, setSearchQuery] = useState('')
	const [defaultDateRange, setDefaultDateRange] = useState<[Date, Date] | undefined>(undefined)
	const [selectedFilter, setSelectedFilter] = useState<string>('fgiit')

	useEffect(() => {
		const endDate = new Date()
		const startDate = subDays(endDate, 6)
		setDefaultDateRange([startDate, endDate])
	}, [])

	return (
		<div className={`card ${className}`}>
			<div
				className='card-header border-0 px-5'
				style={{ minHeight: '50px' }}>
				<h3 className='card-title align-items-start flex-column m-0'>
					<span className='card-label fw-bold fs-3 mb-1'>Operation Details</span>
					<span className='text-muted mt-1 fw-semibold fs-7'></span>
				</h3>
				<div className='card-toolbar'>
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
					<div
						className='menu menu-sub menu-sub-dropdown w-250px w-md-300px'
						data-kt-menu='true'>
						<div className='px-7 py-5'>
							<div className='fs-5 text-dark fw-bolder'>Filter Options</div>
						</div>

						<div className='separator border-gray-200'></div>

						<div className='px-7 py-5'>
							<div className='mb-10'>
								<label
									htmlFor='dfsf'
									className='form-label fw-bold'>
									Filter by Company:
								</label>
								<div>
									<select
										className='form-select form-select-solid'
										data-kt-select2='true'
										data-placeholder='Select option'
										data-allow-clear='true'
										defaultValue={'fgiit'}
										onChange={(e) => setSelectedFilter(e.target.value)}>
										<option>Select Brand</option>
										<option value='fgiit'>FGIIT</option>
										<option value='fwg'>FWG</option>
										<option value='gcs'>GCS</option>
									</select>
								</div>
							</div>
							<div className='d-flex justify-content-end'>
								<button
									type='reset'
									className='btn btn-sm btn-light btn-active-light-primary me-2'
									data-kt-menu-dismiss='true'>
									Reset
								</button>

								<button
									type='submit'
									className='btn btn-sm btn-primary'
									data-kt-menu-dismiss='true'>
									Apply
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				className='card-body'
				style={{ paddingTop: '0px!important' }}>
				<div
					className={`card px-4 py-5 ${selectedFilter === 'fgiit' ? 'd-block' : 'd-none'}`}
					style={{ backgroundColor: '#000' }}
					id='fgiit'>
					<div className='row'>
						<div className='col-md-6'>
							<h4 className='fs-4 text-white'>Enrolled Student</h4>
						</div>
						<div className='col-md-6'>
							<DateRangePicker
								format='MM/dd/yyyy'
								character=' – '
								size='sm'
								style={{ color: '#000' }}
								placeholder='Select Date Range'
								defaultValue={defaultDateRange}
							/>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-success fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<Link
										to='/fgiit/admin-user'
										className='fw-bold text-gray-800 text-hover-success fs-4'>
										25+
									</Link>
									<span className='text-success fw-semibold d-block'>New Students</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>151+</p>
									<span className='text-info fw-semibold d-block'>New Inquires</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-primary rounded p-4 mb-7'>
								<span className=' text-primary me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-primary fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-primary fs-4'>15+</p>
									<span className='text-primary fw-semibold d-block'>Flexible Course</span>
								</div>
							</div>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Most Purchase Courses</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-success fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<Link
										to='/fgiit/admin-user'
										className='fw-bold text-gray-800 text-hover-success fs-4'>
										25+
									</Link>
									<span className='text-success fw-semibold d-block'>DPT Course</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
								<span className=' text-warning me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-warning fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-warning fs-4'>75+</p>
									<span className='text-warning fw-semibold d-block'>AAS Course</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>75+</p>
									<span className='text-info fw-semibold d-block'>DNC Course</span>
								</div>
							</div>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Book Orders</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
								<span className=' text-warning me-5'>
									<FontAwesomeIcon
										icon={faBook}
										className='text-warning fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-warning fs-4'>110+</p>
									<span className='text-warning fw-semibold d-block'>FGIIT Book</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<FontAwesomeIcon
										icon={faFile}
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>112+</p>
									<span className='text-info fw-semibold d-block'>FGIIT E-book</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div
					className={`card px-4 py-5 ${selectedFilter === 'fwg' ? 'd-block' : 'd-none'}`}
					style={{ backgroundColor: '#000' }}
					id='fwg'>
					<div className='row'>
						<div className='col-md-6'>
							<h4 className='fs-4 text-white'>Clients Details</h4>
						</div>
						<div className='col-md-6'>
							<DateRangePicker
								format='MM/dd/yyyy'
								character=' – '
								size='sm'
								style={{ color: '#000' }}
								placeholder='Select Date Range'
								defaultValue={defaultDateRange}
							/>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-success fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<Link
										to='/fgiit/admin-user'
										className='fw-bold text-gray-800 text-hover-success fs-4'>
										25+
									</Link>
									<span className='text-success fw-semibold d-block'>Assign Clients</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>151+</p>
									<span className='text-info fw-semibold d-block'>New App User</span>
								</div>
							</div>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Most Purchase Program</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-success fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<Link
										to='/fgiit/admin-user'
										className='fw-bold text-gray-800 text-hover-success fs-4'>
										25+
									</Link>
									<span className='text-success fw-semibold d-block'>Weight Loss</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
								<span className=' text-warning me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-warning fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-warning fs-4'>75+</p>
									<span className='text-warning fw-semibold d-block'>Bodybuilding</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>175+</p>
									<span className='text-info fw-semibold d-block'>Weight Gain</span>
								</div>
							</div>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Book Orders</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
								<span className=' text-warning me-5'>
									<FontAwesomeIcon
										icon={faBook}
										className='text-warning fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-warning fs-4'>110+</p>
									<span className='text-warning fw-semibold d-block'>RTP Book</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<FontAwesomeIcon
										icon={faFile}
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>112+</p>
									<span className='text-info fw-semibold d-block'>RTP E-book</span>
								</div>
							</div>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Invoices</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<FontAwesomeIcon
										icon={faBook}
										className='text-success fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-success fs-4'>10</p>
									<span className='text-success fw-semibold d-block'>FGIIT Invoices</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-primary rounded p-4 mb-7'>
								<span className=' text-primary me-5'>
									<FontAwesomeIcon
										icon={faFile}
										className='text-primary fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-primary fs-4'>15+</p>
									<span className='text-primary fw-semibold d-block'>FWG Invoices</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div
					className={`card px-4 py-5 ${selectedFilter === 'gcs' ? 'd-block' : 'd-none'}`}
					style={{ backgroundColor: '#000' }}
					id='gcs'>
					<div className='row'>
						<div className='col-md-6'>
							<h4 className='fs-4 text-white'>GCS Inquires Details</h4>
						</div>
						<div className='col-md-6'>
							<DateRangePicker
								format='MM/dd/yyyy'
								character=' – '
								size='sm'
								style={{ color: '#000' }}
								placeholder='Select Date Range'
								defaultValue={defaultDateRange}
							/>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
								<span className=' text-success me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-success fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<Link
										to='/fgiit/admin-user'
										className='fw-bold text-gray-800 text-hover-success fs-4'>
										25+
									</Link>
									<span className='text-success fw-semibold d-block'>Marketing Inquiry</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
								<span className=' text-info me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-info fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-info fs-4'>151+</p>
									<span className='text-info fw-semibold d-block'>Finance Inquiry</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-5'>
							<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
								<span className=' text-warning me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-warning fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-warning fs-4'>200+</p>
									<span className='text-warning fw-semibold d-block'>Consultant Inquiry</span>
								</div>
							</div>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Invoice Details</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-primary rounded p-4 mb-7'>
								<span className=' text-primary me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-primary fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<Link
										to='/fgiit/admin-user'
										className='fw-bold text-gray-800 text-hover-primary fs-4'>
										25+
									</Link>
									<span className='text-primary fw-semibold d-block'>Digital Marketing</span>
								</div>
							</div>
						</div>
						<div className='col-md-4 mt-3'>
							<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
								<span className=' text-warning me-5'>
									<KTIcon
										iconName='abstract-26'
										className='text-warning fs-1'
									/>
								</span>
								<div className='flex-grow-1 me-2'>
									<p className='fw-bold text-gray-800 text-hover-warning fs-4'>75+</p>
									<span className='text-warning fw-semibold d-block'>Development</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export { Operation }
