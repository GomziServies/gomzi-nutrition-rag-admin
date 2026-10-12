import {
	faBuildingColumns,
	faCircleDollarToSlot,
	faDollarSign,
	faDownload,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../../_metronic/helpers'
import { DayJS } from '../../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../../_metronic/partials/widgets'
import DateFilter from '../../../../components/DateRangePicker'
import LengthMenu from '../../../../components/LengthMenu'
import SearchFilter from '../../../../components/SearchFilter'
import SelectField from '../../../../components/SelectField'
import Table from '../../../../components/Table'
import TableButton from '../../../../components/TableButton'
import UsersListPagination from '../../../../components/TablePagination'
import { getInvoice, GetInvoiceInsights } from '../../../../Functions/FGGroup'

type InvoiceCategory = 'Private' | 'FG Group'

const GMTotalSalesList: React.FC = () => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const amountFilter: string | null = searchParams.get('filter')
	const [searchTerm, setSearchTerm] = useState('')
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [metaData, setMetaData] = useState<any>()
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [loading, setLoading] = useState(false)
	const [dataInsight, setDataInsight] = useState<any>({})
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [selectedBranch, setSelectedBranch] = useState<any>(null)

	const fetchInvoiceData = async (page?: number) => {
		setLoading(true)
		try {
			const category: InvoiceCategory = 'FG Group'
			let startDate: Date
			let endDate: Date

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			} else {
				startDate = new Date(0)
				endDate = new Date()
			}

			const response: any = await getInvoice({
				invoice_category: category,
				page: page || pagination.page,
				limit: pagination.itemsPerPage,
				...(searchTerm && { search: searchTerm }),
				...(selectedBranch && { branch_name: selectedBranch }),
				from_date: startDate,
				to_date: endDate,
				sort,
				sortOrder,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			let filteredData = response.data

			if (selectedFilter === 'Paid Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice.paid_amount > 0)
			} else if (selectedFilter === 'Due Amount') {
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice.net_amount - invoice.paid_amount
					return dueAmount > 0
				})
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice.net_amount - invoice.paid_amount
					return dueAmount !== 0
				})
			} else if (selectedFilter === 'Total Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice.net_amount > 0)
			}

			if (selectedFilter === 'Due Amount') {
				// Remove any invoices with dueAmount equal to 0
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = invoice.net_amount - invoice.paid_amount
					return dueAmount !== 0
				})
			}

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

	useEffect(() => {
		if (amountFilter) {
			setSelectedFilter(amountFilter)
		}
	}, [amountFilter])

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
			const category: InvoiceCategory = 'FG Group'
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
		fetchInvoiceData()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedFilter,
		selectedBranch,
	])

	const isFirstRender = useRef(true)

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchInvoiceData()
		}
	}, [searchTerm])

	useEffect(() => {
		fetchInvoiceInsightData()
	}, [])

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}
	let sortableFields: any

	selectedFilter
		? (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'fullName' },
				...(selectedFilter === 'Paid Amount'
					? [{ title: 'Paid Amount', field: 'paid_amount' }]
					: selectedFilter === 'Due Amount'
					? [{ title: 'Due Amount', field: 'duePayment' }]
					: selectedFilter === 'Total Amount'
					? [{ title: 'Total Amount', field: 'net_amount' }]
					: [{ title: 'Purchase Date', field: 'date' }]),
				{ title: 'Purchase Date', field: 'date' },
		  ])
		: (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'name' },
				{ title: 'Branch Name', field: 'branch_name' },
				{ title: 'Paid Amount', field: 'paid_amount' },
				{ title: 'Total Amount', field: 'net_amount' },
				{ title: 'Purchase Date', field: 'date' },
		  ])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	// const filteredInvoiceData = invoiceData.filter((invoice: any) =>
	// 	invoice?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
	//   );

	//   const paginatedInvoiceData = filteredInvoiceData.slice(
	// 	(pagination.page - 1) * pagination.itemsPerPage,
	// 	pagination.page * pagination.itemsPerPage
	//   );

	// const downloadExcel = () => {
	// 	const worksheetData = invoiceData.map((invoice: any, index: number) => {
	// 		const products = invoice?.items.map((item: any, i: number) => ({
	// 			[`Product ${i + 1} Name`]: item?.item_name || 'N/A',
	// 			[`Product ${i + 1} Quantity`]: item?.quantity || 'N/A',
	// 			[`Product ${i + 1} Amount`]: item?.amount || 'N/A',
	// 			[`Product ${i + 1} Total Amount`]: item?.totalAmount || 'N/A',
	// 		}))
	// 		return {
	// 			'Invoice No.': invoice?.invoice_number || 'N/A',
	// 			'User Name': invoice?.fullName ? invoice?.fullName : invoice.name || 'N/A',
	// 			Mobile: invoice?.phoneNumber ? invoice?.phoneNumber : invoice?.mobile || 'N/A',
	// 			Email: invoice?.email || 'N/A',
	// 			'Total Amount': invoice?.totalPayment
	// 				? invoice?.totalPayment
	// 				: invoice?.totalPayment || 'N/A',
	// 			'Due Amount': invoice?.paidPayment
	// 				? invoice?.totalPayment - invoice?.paidPayment
	// 				: invoice?.totalPayment - invoice?.paidPayment || 'N/A',
	// 			'Paid Amount': invoice?.paidPayment ? invoice?.paidPayment : invoice?.paidPayment || 'N/A',
	// 			'Purchase Date': invoice?.date || 'N/A',
	// 			...Object.assign({}, ...products),
	// 		}
	// 	})

	// 	const worksheet = XLSX.utils.json_to_sheet(worksheetData)
	// 	const workbook = XLSX.utils.book_new()
	// 	XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
	// 	XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	// }

	const downloadExcel = () => {
		const worksheetData = invoiceData?.map((invoice: any, index: number) => {

			const products = invoice?.items.map((item: any, i: number) => ({
				[`Product Name`]: item?.item_name || 'N/A',
				[`Amount`]: item?.amount || 'N/A',
			}))
			
			return {
				'Invoice No.': invoice?.invoice_number || 'N/A',
				'User Name': invoice?.fullName ? invoice?.fullName : invoice.name || 'N/A',
				Mobile: invoice?.phoneNumber ? invoice?.phoneNumber : invoice?.mobile || 'N/A',
				Email: invoice?.email || 'N/A',
				'Branch Name': invoice?.branch_name || 'N/A',
				...Object.assign({}, ...products),
				'Paid Amount': invoice?.paid_amount ? invoice?.paid_amount : invoice?.paid_amount || 'N/A',
				'Purchase Date': invoice?.date || 'N/A',
				Notes: invoice?.note || 'N/A',
			}
		})

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
		XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	}

	const getFilterAmount = (name: string) => {
		if (selectedFilter === name) {
			setSelectedFilter(null)
		} else {
			setSelectedFilter(name)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<div className='row g-5 g-xl-8'>
				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Paid Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faDollarSign}
						color='primary'
						title={dataInsight.total_paid_amount ? dataInsight.total_paid_amount : '0/-'}
						description='Paid Amount'
					/>
				</div>

				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Due Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faCircleDollarToSlot}
						color='primary'
						title={dataInsight.total_unpaid_amount ? dataInsight.total_unpaid_amount : '0/-'}
						description='Due Amount'
					/>
				</div>

				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Total Amount')}>
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
				<div className='row mx-5 border-0 pt-6'>
					<div className='col-md-3'>
						<div className='card-title'>
							<div className='row'>
								<div className='d-md-block d-none col-md-3'>
									<LengthMenu
										expenseData={invoiceData}
										handleItemsPerPageChange={handleItemsPerPageChange}
									/>
								</div>
							</div>
						</div>
					</div>
					<div className='col-md-9'>
						<div className='card-toolbar d-flex justify-content-end'>
							<div className='row justify-content-between'>
								<div className='col-md-12'>
									<TableButton
										action='add'
										to='/fgiit/invoice/create'
										text='Create Invoice'
									/>
								</div>
								<div className='col-md-4 mt-md-1 mt-5 d-md-block d-flex'>
									<div className='d-md-none d-block col-md-6 col-4'>
										<LengthMenu
											expenseData={invoiceData}
											handleItemsPerPageChange={handleItemsPerPageChange}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className='col-12 row align-items-end'>
						<div className='col-md-3'>
							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
							/>
						</div>
						<div className='col-md-1'>
							<button
								className='btn btn-primary'
								onClick={downloadExcel}
								disabled={loading}>
								<FontAwesomeIcon
									icon={faDownload}
									className='fs-3'
								/>
							</button>
						</div>
						<SelectField
							className='col-md-4 fv-row'
							label='Branch Name'
							name='branch_name'
							marginRemove={true}
							value={selectedBranch}
							onChange={(e) => setSelectedBranch(e.target.value)}
							htmlFor='txt_company'
							options={['Adajan', 'Vesu', 'Katargam']}
						/>
						<div className='col-md-4 mt-md-0 mt-2'>
							<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive'>
						<Table
							data={invoiceData}
							columns={sortableFields}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(item: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={item._id}>
									<tr
										className='data-row'
										onClick={() => handleRowClick(item._id)}>
										<td className='text-center'>
											<div
												className='d-flex ms-8'
												role='button'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='mx-2 ms-5 mb-1 plus-icon'
													style={{ color: '#607D8B', fontSize: '18px' }}
												/>
												<span className='text-dark fw-bold  d-block mb-1 fs-6'>{actualIndex}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.invoice_number}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>
														{item?.fullName ? item?.fullName : item.name}
													</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{item?.phoneNumber ? item?.phoneNumber : item?.mobile}
													</span>
												</div>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item.branch_name || '-'}
											</span>
										</td>
										{selectedFilter ? (
											selectedFilter == 'Paid Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.paid_amount ? item?.paid_amount : '-'}
													</span>
												</td>
											) : selectedFilter == 'Due Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount ? item.net_amount - item.paid_amount : '-'}
													</span>
												</td>
											) : selectedFilter == 'Total Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount ? item?.net_amount : '-'}
													</span>
												</td>
											) : (
												''
											)
										) : (
											<>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.paid_amount ? item?.paid_amount : '-'}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount ? item?.net_amount : '-'}
													</span>
												</td>
											</>
										)}

										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item.date).format('YYYY-MM-DD')}
											</span>
										</td>
										<td>
											{item?.fullName ? (
												<TableButton
													action='edit'
													to={`/fgiit/invoice/fwg-update?invoice_id=` + item._id}
												/>
											) : (
												<TableButton
													action='edit'
													to={`/fgiit/invoice/update?invoice_id=` + item._id}
												/>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	item.profile_image
																		? `https://files.fggroup.in/${item.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{item.name}</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{item?.mobile || ''}
															</span>
														</div>
													</div>
													<br />
													<strong>{sortableFields[1].title}:</strong> {item.paid_amount}
													<br />
													<strong>{sortableFields[2].title}:</strong> {item.net_amount}
													<br />
													<strong>{sortableFields[3].title}:</strong>{' '}
													{DayJS(item.date).format('YYYY-MM-DD')}
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
					{invoiceData.length === 0 && !loading && (
						<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
							<b>No records found</b>
						</div>
					)}
					{invoiceData.length > 0 && (
						<UsersListPagination
							totalPages={metaData?.totalPages}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					)}
				</div>
			</KTCard>
		</>
	)
}

export default GMTotalSalesList
