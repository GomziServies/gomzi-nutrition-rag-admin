import { faBook, faFile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { subDays } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DateRangePicker } from 'rsuite'
import 'rsuite/DateRangePicker/styles/index.css'
import { KTIcon } from '../../../../_metronic/helpers'
import { GetGeneralDashboard, getInvoice, GetStudentsStats } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Props = {
	className: string
}

type DashboardStats = {
	counts: {
		alumni: number
		flexible_learning_student: number
		non_alumni: number
		offline_course_student: number
		online_course_student: number
		student_user: number
	}
}

const MAsterOperation: React.FC<Props> = ({ className }) => {
	const [defaultDateRange, setDefaultDateRange] = useState<[Date, Date] | undefined>(undefined)
	const [selectedFilter, setSelectedFilter] = useState<string>('fgiit')
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
	const [dashboardData, setDashboardData] = useState<any>([])
	const [invoiceData, setInvoiceData] = useState<any>([])

	const fetchData = async () => {
		try {
			const response: any = await GetStudentsStats()
			setDashboardStats(response.data)
		} catch (error: any) {
			console.error(error)
		}
	}
	const fetchUserData = async () => {
		try {
			const response = await GetGeneralDashboard()
			const DashboardResponse: any = response.data
			setDashboardData(DashboardResponse)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchUserData()
		fetchData()
		fetchInvoiceData()
	}, [])

	const fetchInvoiceData = async () => {
		let startDate: Date
		let endDate: Date

		startDate = DayJS().startOf('month').toDate()
		endDate = DayJS().endOf('month').toDate()

		try {
			let response: any
			response = await getInvoice({
				invoice_category: 'FG Group',
				from_date: startDate,
				to_date: endDate,
			})
			let data: any = response.data

			let aggregatedData: any = {}

			aggregatedData = data.reduce((acc: any, item: any) => {
				if (Array.isArray(item.items)) {
					item.items.forEach((i: any) => {
						if (!acc[i.item_name]) {
							acc[i.item_name] = 0
						}
						acc[i.item_name] += 1
					})
				} else {
					const productName =
						typeof item.productName === 'object' ? item.productName.item_name : item.productName

					if (!acc[productName]) {
						acc[productName] = 0
					}
					acc[productName] += 1
				}
				return acc
			}, {})

			// Convert aggregated data to array format with a flag for document count > 1
			const rattingData = Object.keys(aggregatedData).map((item_name) => ({
				item_name,
				document_count: aggregatedData[item_name],
				is_multiple: aggregatedData[item_name] > 1, // Set a flag if the count is more than 1
			}))

			// Sort the data
			const sortedData = rattingData.sort((a: any, b: any) => b.document_count - a.document_count)
			setInvoiceData(sortedData)
		} catch (error) {
			console.error(error)
		}
	}

	const filteredData =
		invoiceData?.filter((items: any) => !isNaN(items.document_count) && items.document_count > 0) ||
		[]

	useEffect(() => {
		const endDate = new Date()
		const startDate = subDays(endDate, 6)
		setDefaultDateRange([startDate, endDate])
	}, [])

	const getColor = (index: number) => {
		const colors = ['success', 'primary', 'danger', 'warning', 'info'] // Define your color classes here
		return colors[index % colors.length] // Cycle through colors based on the index
	}

	const abbreviateName = (name: string) => {
		const maxLength = 15 // Define the maximum length for the name
		if (name.length > maxLength) {
			return name.slice(0, maxLength) + '...' // Abbreviate if the name is too long
		}
		return name
	}

	return (
		<div className={`card ${className}`}>
			<div
				className='card-header border-0 px-5'
				style={{ minHeight: '50px' }}>
				<h3 className='card-title align-items-start flex-column m-0'>
					<span className='card-label fw-bold fs-3 mb-1'>Operation Details</span>
					<span className='text-muted mt-1 fw-semibold fs-7'></span>
				</h3>
			</div>
			<div
				className='card-body'
				style={{ paddingTop: '0px!important' }}>
				<div
					className={`card px-4 py-5 ${selectedFilter === 'fgiit' ? 'd-block' : 'd-none'}`}
					style={{ backgroundColor: '#000' }}
					id='fgiit'>
					<div className='row'>
						<div className='col-12'>
							<h4 className='fs-4 text-white'>Enrolled Student</h4>
						</div>
						<div className='col-md-4 mt-5'>
							<Link
								to='/fgiit/student-user'
								className='fw-bold text-gray-800 fs-4'>
								<div className='d-flex align-items-center bg-light-success rounded p-4 mb-7'>
									<span className=' text-success me-5'>
										<KTIcon
											iconName='abstract-26'
											className='text-success fs-1'
										/>
									</span>
									<div className='flex-grow-1 me-2'>
										{dashboardStats?.counts?.non_alumni || 0}+
										<span className='text-success fw-semibold d-block'>New Students</span>
									</div>
								</div>
							</Link>
						</div>
						<div className='col-md-4 mt-5'>
							<Link
								to='/fgiit/contact-inquiry/contact'
								className='fw-bold text-gray-800 fs-4'>
								<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
									<span className=' text-info me-5'>
										<KTIcon
											iconName='abstract-26'
											className='text-info fs-1'
										/>
									</span>
									<div className='flex-grow-1 me-2'>
										<p className='fw-bold text-gray-800 text-hover-info mb-0 fs-4'>
											{dashboardData?.contact_inquiry || 0}+
										</p>
										<span className='text-info fw-semibold d-block'>New Inquires</span>
									</div>
								</div>
							</Link>
						</div>
						<div className='col-md-4 mt-5'>
							<Link
								to='/fgiit/fitness-courses'
								className='fw-bold text-gray-800 fs-4'>
								<div className='d-flex align-items-center bg-light-primary rounded p-4 mb-7'>
									<span className=' text-primary me-5'>
										<KTIcon
											iconName='abstract-26'
											className='text-primary fs-1'
										/>
									</span>
									<div className='flex-grow-1 me-2'>
										<p className='fw-bold text-gray-800  mb-0 fs-4'>
											{dashboardData?.weekly_fitness_course_orders || 0}+
										</p>
										<span className='text-primary fw-semibold d-block'>Flexible Course</span>
									</div>
								</div>
							</Link>
						</div>
					</div>
					{filteredData > 0 && (
						<div className='row'>
							<div className='col-md-12'>
								<h4 className='fs-4 text-white'>Most Purchase Courses</h4>
							</div>
							{filteredData
								.filter((item: any) => item.document_count > 10)
								.sort((a: any, b: any) => b.document_count - a.document_count)
								.map((item: any, index: number) => (
									<div
										className='col-md-4 mt-3'
										key={index}>
										<Link
											to='/fgiit/invoice/list'
											className={`fw-bold text-gray-800 fs-4 text-${getColor(index)}`}>
											<div
												className={`d-flex align-items-center bg-light-${getColor(
													index
												)} rounded p-4 mb-7`}>
												<span className={`text-${getColor(index)} me-5`}>
													<KTIcon
														iconName='abstract-26'
														className={`text-${getColor(index)} fs-1`}
													/>
												</span>
												<div className='flex-grow-1 me-2'>
													<p className='fw-bold text-gray-800  mb-0 fs-4'>
														{item.document_count || 0}+
													</p>
													<span className={`text-${getColor(index)} fw-semibold d-block`}>
														{abbreviateName(item.item_name)}
													</span>
												</div>
											</div>
										</Link>
									</div>
								))}
						</div>
					)}
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Book Orders</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<Link
								to='/fgiit/book-order'
								className='fw-bold text-gray-800 fs-4'>
								<div className='d-flex align-items-center bg-light-warning rounded p-4 mb-7'>
									<span className=' text-warning me-5'>
										<FontAwesomeIcon
											icon={faBook}
											className='text-warning fs-1'
										/>
									</span>
									<div className='flex-grow-1 me-2'>
										<p className='fw-bold text-gray-800 text-hover-warning mb-0 fs-4'>
											{dashboardData?.weekly_book_orders || 0}+
										</p>
										<span className='text-warning fw-semibold d-block'>FGIIT Book</span>
									</div>
								</div>
							</Link>
						</div>
						<div className='col-md-4 mt-3'>
							<Link
								to='/fgiit/e-book-order'
								className='fw-bold text-gray-800 fs-4'>
								<div className='d-flex align-items-center bg-light-info rounded p-4 mb-7'>
									<span className=' text-info me-5'>
										<FontAwesomeIcon
											icon={faFile}
											className='text-info fs-1'
										/>
									</span>
									<div className='flex-grow-1 me-2'>
										<p className='fw-bold text-gray-800 text-hover-info mb-0 fs-4'>
											{dashboardData?.weekly_ebook_orders || 0}+
										</p>
										<span className='text-info fw-semibold d-block'>FGIIT E-book</span>
									</div>
								</div>
							</Link>
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
							<Link
								to='/fgiit/admin-user'
								className='fw-bold text-gray-800 fs-4'>
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
							</Link>
						</div>
						<div className='col-md-4 mt-5'>
							<Link
								to='/fgiit/admin-user'
								className='fw-bold text-gray-800 fs-4'>
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
							</Link>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-12'>
							<h4 className='fs-4 text-white'>Most Purchase Program</h4>
						</div>
						<div className='col-md-4 mt-3'>
							<Link
								to='/fgiit/admin-user'
								className='fw-bold text-gray-800 fs-4'>
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
							</Link>
						</div>
						<div className='col-md-4 mt-3'>
							<Link
								to='/fgiit/admin-user'
								className='fw-bold text-gray-800 fs-4'>
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
							</Link>
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
									<p className='fw-bold text-gray-800  fs-4'>15+</p>
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
										className='fw-bold text-gray-800  fs-4'>
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

export { MAsterOperation }
