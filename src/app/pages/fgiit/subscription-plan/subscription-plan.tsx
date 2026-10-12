import { faCopy, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import SelectField from '../../../components/SelectField'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { GetSubscriptionPlan } from '../../../Functions/FGGroup/SubscriptionPlan'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const SubscriptionPlanList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [bookData, setBookData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<any>('')
	const [selectedPlanData, setSelectedPlanData] = useState('')
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const fetchSubscriptionPlanData = async (page?: number) => {
		setLoading(true)
		try {
			let startDate: Date | null = null
			let endDate: Date | null = null

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			}

			if (endDate) {
				endDate = new Date(endDate.setHours(23, 59, 59, 999))
			}

			const response = await GetSubscriptionPlan({
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && { search: searchTerm }),
				// ...(searchTerm
				// 	? { search: searchTerm }
				// 	: { search: selectedPaymentGateway ? selectedPaymentGateway : undefined }),
				sort,
				sortOrder,
				...(selectedPaymentGateway && { gateway: selectedPaymentGateway }),
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			const filteredData: any = response.data.filter((book: any) => {
				const bookDate = new Date(book.createdAt)
				if (startDate && endDate) {
					return bookDate >= startDate && bookDate <= endDate
				}
				return true
			})

			setBookData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchSubscriptionPlanData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedPaymentGateway,
	])

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchSubscriptionPlanData()
		}
	}, [searchTerm])

	const handlePageChange = async (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ page: 1, itemsPerPage: value })
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const sortableFields = [
		{ title: 'Payment Gateway', field: 'payment_gateway' },
		{ title: 'Plan ID', field: 'razorpay_plan_id' },
		{ title: 'Plan Name', field: 'name' },
		{ title: 'Amount', field: 'amount' },
		{ title: 'Period', field: 'period' },
		{ title: 'Course Name', field: 'course_name' },
		// { title: 'Plan ID', field: 'rezorpay_plan_id' },
		{ title: 'Created date', field: 'createdAt' },
	]

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const handleCopy = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				toast.success('ID copied to clipboard!')
			})
			.catch((err) => {
				console.error('Failed to copy ID: ', err)
				toast.success('Failed to copy ID!')
			})
	}

	const handleKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
		if (event.key === 'Enter' || event.key === ' ') {
			handleCopy(id)
		}
	}

	const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = event.target

		if (value == 'Razorpay FGIIT (IwHEpNNtAPrDLR)') {
			setSelectedPaymentGateway('RAZORPAY_FGIIT')
			setSelectedPlanData('Razorpay FGIIT (IwHEpNNtAPrDLR)')
		} else if (value == 'Razorpay FG Meals (OejSEaaVBvxRmf)') {
			setSelectedPaymentGateway('RAZORPAY_FGMEALS')
			setSelectedPlanData('Razorpay FG Meals (OejSEaaVBvxRmf)')
		} else if (value == 'Razorpay Gomzi Consulting (PJ728F7GxhfZkN)') {
			setSelectedPaymentGateway('RAZORPAY GOMZI CONSULTING')
			setSelectedPlanData('Razorpay Gomzi Consulting (PJ728F7GxhfZkN)')
		} else if (value == 'Razorpay (CiS87S7GTMLS25)') {
			setSelectedPaymentGateway('RAZORPAY')
			setSelectedPlanData('Razorpay (CiS87S7GTMLS25)')
		} else {
			setSelectedPaymentGateway(event.target.value)
		}
	}

	return (
		<div>
			<PageTitle breadcrumbs={[]}>Subscription Plan</PageTitle>
			<KTCard>
				<div className='row justify-content-between my-7 mx-5'>
					<div className='col-sm-6 col-12 d-flex'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div>
							<LengthMenu
								expenseData={bookData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='col-sm-6 col-12 mt-sm-0 mt-7 d-flex justify-content-end position-relative'>
						<div className='col-md-6 mt-md-0 mt-2 me-5'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
						<div className='modal-footer justify-content-end'>
							<TableButton
								action='add'
								to='/fgiit/plan/create'
								text='Add Plan'
							/>
						</div>
					</div>
					<div className='col-sm-6 col-12 mt-5 d-flex'>
						<SelectField
							className='col-7 fv-row mb-7 me-5'
							label='Select Payment Gateway'
							name='Filter payment gateway'
							value={selectedPlanData}
							onChange={handleSelectChange}
							htmlFor='Filter payment gateway'
							options={[
								'Razorpay (CiS87S7GTMLS25)',
								'Razorpay FGIIT (IwHEpNNtAPrDLR)',
								'Razorpay FG Meals (OejSEaaVBvxRmf)',
								'Razorpay Gomzi Consulting (PJ728F7GxhfZkN)',
							]}
						/>
					</div>
				</div>

				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={bookData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							disableSortFields={['rezorpay_plan_id']}
							renderRow={(
								planData: any,
								index: number,
								actualIndex: number,
								isVisible: boolean
							) => (
								<React.Fragment key={planData._id}>
									<tr
										onClick={() => handleRowClick(planData._id)}
										className='data-row'>
										<td>
											<span className='text-dark fw-bold  ms-6 mb-1 fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>{planData?.gateway}</span>
										</td>
										<td
											onClick={() => handleCopy(planData?.razorpay_plan_id)}
											onKeyPress={(event) => handleKeyPress(event, planData?.razorpay_plan_id)}
											role='button'
											tabIndex={0}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<div className='d-flex'>
													<FontAwesomeIcon
														icon={faCopy}
														className='fs-3 me-2 text-success'
													/>
													{planData?.razorpay_plan_id}
												</div>
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>{planData?.name}</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>₹{planData?.amount}/-</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>{planData?.period}</span>
										</td>
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{planData?.fitness_course?.course_name}
											</span>
										</td>
										{/* <td
											onClick={() => handleCopy(planData?.razorpay_plan_id)}
											onKeyPress={(event) => handleKeyPress(event, planData?.razorpay_plan_id)}
											role='button'
											tabIndex={0}>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												<div className='d-flex'>
													<FontAwesomeIcon
														icon={faCopy}
														className='fs-3 me-2 text-success'
													/>
													{planData?.razorpay_plan_id}
												</div>
											</span>
										</td> */}
										<td>
											<span className='text-dark fw-bold   mb-1 fs-6'>
												{DayJS(planData?.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
											</span>
										</td>
										<td>
											<TableButton
												action='view'
												to={`/fgiit/plan/view?plan_id=${planData?._id}`}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex'>
														<strong>{sortableFields[0].title}: </strong>{' '}
														<span
															className='text-dark fw-bold  ms-3 d-block fs-6'
															onClick={() => handleCopy(planData?.razorpay_plan_id)}
															onKeyPress={(event) =>
																handleKeyPress(event, planData?.razorpay_plan_id)
															}
															role='button'
															tabIndex={0}>
															<div className='d-flex'>
																<FontAwesomeIcon
																	icon={faCopy}
																	className='fs-3 me-2 text-success'
																/>
																{planData?.razorpay_plan_id}
															</div>
														</span>
													</div>
													<strong>{sortableFields[1].title}: </strong>{' '}
													<span className='text-dark fw-bold  mb-1 fs-6'>{planData?.name}</span>
													<br />
													<strong>{sortableFields[2].title}: </strong>{' '}
													<span className='text-dark fw-bold  mb-1 fs-6'>
														₹{planData?.amount}/-
													</span>
													<br />
													<strong>{sortableFields[3].title}: </strong>{' '}
													<span className='text-dark fw-bold  mb-1 fs-6'>{planData?.period}</span>
													<br />
													<strong>{sortableFields[4].title}: </strong>{' '}
													<span className='text-dark fw-bold  mb-1 fs-6'>
														{planData?.course_id?.course_name}
													</span>
													<br />
													<strong>{sortableFields[5].title}: </strong>{' '}
													<span className='text-dark fw-bold  mb-1 fs-6'>
														{DayJS(planData?.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
													</span>
													<br />
												</div>
											</td>
										</tr>
									)}
								</React.Fragment>
							)}
							visibleDetails={visibleDetails}
							pagination={pagination}
							setPagination={setPagination}
							loading={loading}
						/>
					</div>
					{bookData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{bookData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</div>
	)
}

export default SubscriptionPlanList
