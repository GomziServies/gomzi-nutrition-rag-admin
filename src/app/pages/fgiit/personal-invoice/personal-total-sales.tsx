import {
	faBuildingColumns,
	faCircleDollarToSlot,
	faDollarSign,
} from '@fortawesome/free-solid-svg-icons'
import React, { useEffect, useState } from 'react'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import { getInvoice, GetInvoiceInsights } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type InvoiceCategory = 'Private' | 'FG Group'

const TotalSalesListPersonal: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [dataInsight, setDataInsight] = useState<any>({})
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [loading, setLoading] = useState(false)

	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)

	useEffect(() => {
		fetchInvoiceData()
	}, [selectedDateRange, pagination.page, pagination.itemsPerPage])

	const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
		setSelectedDateRange(dateRange)
		setPagination({ ...pagination, page: 1 })
	}

	const fetchInvoiceData = async () => {
		setLoading(true)
		try {
			const category: InvoiceCategory = 'Private'
			const response: any = await getInvoice({ invoice_category: category })
			let filteredData = response.data

			if (selectedDateRange && Array.isArray(selectedDateRange)) {
				const [startDate, endDate] = selectedDateRange
				filteredData = filteredData.filter((invoice: any) => {
					const createdAtDate = new Date(invoice.createdAt)
					return createdAtDate >= startDate && createdAtDate <= endDate
				})
			}

			// Sort the filteredData array by createdAt date in descending order
			filteredData.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setInvoiceData(filteredData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}
	
	useEffect(() => {
		if (selectedDateRange) {
			fetchInvoiceInsightData()
		}
	}, [selectedDateRange])

	const fetchInvoiceInsightData = async () => {
		setLoading(true)
		let startDate: Date
		let endDate: Date

		if (selectedDateRange) {
			;[startDate, endDate] = selectedDateRange
		} else {
			startDate = new Date(0)
			endDate = new Date()
		}
		try {
			const category: InvoiceCategory = 'Private'
			const response: any = await GetInvoiceInsights({
				invoice_category: category,
				from_date: startDate,
				to_date: endDate,
			})
			setDataInsight(response.data[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		fetchInvoiceInsightData()
	}, [])

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const filteredInvoiceData = invoiceData.filter(
		(invoice: any) => invoice.name && invoice.name.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const paginatedSalesData = filteredInvoiceData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	// Calculate sums
	const totalPaidAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.paid_amount),
		0
	)

	const totalAmount = invoiceData.reduce(
		(sum: any, invoice: any) => sum + parseFloat(invoice.net_amount),
		0
	)

	// Calculate due amount
	const totalDueAmount = totalAmount - totalPaidAmount

	// Format the total amounts with commas
	const formattedTotalPaidAmount = totalPaidAmount.toLocaleString()
	const formattedTotalAmount = totalAmount.toLocaleString()
	const formattedTotalDueAmount = totalDueAmount.toLocaleString()

	return (
		<>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<div className='row g-5 g-xl-8'>
				<div className='col-lg-3'>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faDollarSign}
						color='primary'
						title={dataInsight.total_paid_amount ? dataInsight.total_paid_amount : '0/-'}
						description='Paid Amount'
					/>
				</div>

				<div className='col-lg-3'>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faCircleDollarToSlot}
						color='primary'
						title={dataInsight.total_unpaid_amount ? dataInsight.total_unpaid_amount : '0/-'}
						description='Due Amount'
					/>
				</div>

				<div className='col-lg-3'>
					<StatisticsWidget2
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faBuildingColumns}
						color='primary'
						title={dataInsight.total_amount ? dataInsight.total_amount : '0/-'}
						description='Total Amount'
					/>
				</div>
			</div>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<div>
							<div className='d-flex'>
								<SearchFilter
									searchTerm={searchTerm}
									setSearchTerm={setSearchTerm}
								/>
								<LengthMenu
									expenseData={invoiceData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>
					</div>
					<div className='card-toolbar'>
						<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						<TableButton
							action='add'
							to='/fgiit/personal-invoice/create'
							text='Create Invoice'
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
									<th>Paid Amount</th>
									<th>Total Amount</th>
									<th>Purchase Date</th>
									<th className='ps-4 rounded-end'>Action</th>
								</tr>
							</thead>
							<tbody className='text-gray-600 fw-bold'>
								{loading ? (
									<tr>
										<td
											colSpan={12}
											className='text-center'>
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										</td>
									</tr>
								) : (
									paginatedSalesData.map((invoiceData: any, index: number) => {
										const actualIndex = (pagination.page - 1) * pagination.itemsPerPage + index + 1
										return (
											<tr key={actualIndex}>
												<td>
													<span className='text-dark ms-6 fw-bold  d-block mb-1 fs-6'>
														{actualIndex}
													</span>
												</td>
												<td>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	invoiceData.profile_image
																		? `https://files.fggroup.in/${invoiceData.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>
																{invoiceData.name}
															</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{invoiceData.mobile}
															</span>
														</div>
													</div>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoiceData.paid_amount}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{invoiceData.net_amount}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{DayJS(invoiceData.date).format('YYYY-MM-DD')}
													</span>
												</td>
												<td>
													<TableButton
														action='edit'
														to={`/fgiit/invoice/update?invoice_id=` + invoiceData._id}
													/>
												</td>
											</tr>
										)
									})
								)}
							</tbody>
						</table>
					</div>
					{invoiceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{invoiceData.length > 0 && (
						<UsersListPagination
							totalPages={Math.ceil(filteredInvoiceData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default TotalSalesListPersonal
