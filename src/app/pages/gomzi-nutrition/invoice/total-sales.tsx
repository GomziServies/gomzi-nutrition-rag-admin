import {
	faBuildingColumns,
	faCircleDollarToSlot,
	faDollarSign,
	faDownload,
	faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { KTCard, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { StatisticsWidget2 } from '../../../../_metronic/partials/widgets'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import {
	deleteInvoice,
	getInvoice,
	getInvoiceBranches,
	GetInvoiceInsights,
	GetTrainers,
} from '../../../Functions/FGGroup'

const NutritionTotalSalesList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const masterData = localStorage.getItem('admin_type')
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [branchesData, setBranchesData] = useState<string[]>([])
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
	const [selectedBranch, setSelectedBranch] = useState<string>('default')
	const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('default')
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])

	const adminType = localStorage.getItem('admin')

	const fetchInvoiceData = async (page?: number, store?: any, createdById?: string) => {
		setLoading(true)

		try {
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'

			const [startDate, endDate] = getDateRange()

			const response: any = await getInvoice({
				invoice_category: category,
				page: page || pagination.page,
				branch_name: store,
				limit: pagination.itemsPerPage,
				...(searchTerm && {
					search: searchTerm,
				}),
				from_date: startDate,
				to_date: endDate,
				...(selectedSalesPerson !== 'default' && {
					sales_person: selectedSalesPerson,
				}),
				sort,
				sortOrder,
			})

			const metaData: any = response.metadata
			setMetaData(metaData.pagination)

			let filteredData = response.data

			if (createdById) {
				filteredData = filteredData.filter((item: any) => item.createdById === createdById)
			}

			if (selectedFilter === 'Paid Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice?.paid_amount > 0)
			} else if (selectedFilter === 'Due Amount') {
				filteredData = filteredData.filter((invoice: any) => {
					const dueAmount = (invoice?.net_amount || 0) - (invoice?.paid_amount || 0)

					return dueAmount > 0
				})
			} else if (selectedFilter === 'Total Amount') {
				filteredData = filteredData.filter((invoice: any) => invoice?.net_amount > 0)
			}

			filteredData.sort(
				(a: any, b: any) => new Date(b?.createdAt).getTime() - new Date(a?.createdAt).getTime()
			)

			setInvoiceData(filteredData)
		} catch (error) {
			console.error('Error fetching invoice data:', error)
		} finally {
			setLoading(false)
		}
	}

	const getDateRange = (): [Date, Date] => {
		if (!selectedDateRange) {
			return [new Date(0), new Date()]
		}

		const [selectedStart, selectedEnd] = selectedDateRange

		const startDate = new Date(selectedStart)
		startDate.setHours(0, 0, 0, 0)

		const endDate = new Date(selectedEnd)
		endDate.setHours(23, 59, 59, 999)

		return [startDate, endDate]
	}

	const fetchSalesPersons = async () => {
		try {
			const response: any = await GetTrainers({ limit: 1000 })
			if (response.data) {
				const salesPersons = response.data
				setSalesPersonList(salesPersons)
			}
		} catch (error) {
			console.error('Error fetching sales persons:', error)
		}
	}

	const fetchInvoiceBranches = async () => {
		try {
			const response: any = await getInvoiceBranches()

			const branches = response.data.map((item: any) => item.branch_name)

			setBranchesData(branches)
		} catch (error) {
			console.error('Error fetching branches:', error)
		}
	}

	useEffect(() => {
		if (selectedDateRange) {
			fetchInvoiceInsightData()
		}
	}, [selectedDateRange])

	const fetchInvoiceInsightData = async () => {
		const [startDate, endDate] = getDateRange()

		setLoading(true)

		try {
			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'

			const response: any = await GetInvoiceInsights({
				invoice_category: category,
				from_date: startDate,
				to_date: endDate,
			})

			setDataInsight(response.data[0])
		} catch (error) {
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchInvoiceData()
		fetchSalesPersons()
		fetchInvoiceBranches()
	}, [
		pagination.itemsPerPage,
		pagination.page,
		sort,
		sortOrder,
		selectedDateRange,
		selectedFilter,
		selectedSalesPerson,
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
		setPagination({ ...pagination, page: 1 })
	}

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value })
	}

	const handleSetStoreInvoice = (branchName: string) => {
		setSelectedBranch(branchName)
		setPagination((prev) => ({
			...prev,
			page: 1,
		}))

		if (branchName === 'default') {
			fetchInvoiceData(1, undefined)
		} else {
			fetchInvoiceData(1, branchName)
		}
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
					: []),
				{ title: 'Sales Person', field: 'sales_person' },
				{ title: 'Purchase Date', field: 'date' },
		  ])
		: (sortableFields = [
				{ title: 'Invoice No.', field: 'id' },
				{ title: 'User', field: 'fullName' },
				{ title: 'Total Amount', field: 'net_amount' },
				{ title: 'Paid Amount', field: 'paid_amount' },
				{ title: 'Due Amount', field: 'duePayment' },
				{ title: 'Sales Person', field: 'sales_person' },
				{ title: 'Purchase Date', field: 'date' },
		  ])

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const downloadExcel = async () => {
		try {
			setLoading(true)

			let startDate: Date
			let endDate: Date

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			} else {
				startDate = new Date(0)
				endDate = new Date()
			}

			const category = adminType === 'Store' ? adminType : 'Gomzi Nutrition'

			// Fetch ALL invoices instead of only current pagination page
			const response: any = await getInvoice({
				invoice_category: category,
				page: 1,
				limit: 100000,
				...(selectedBranch !== 'default' && {
					branch_name: selectedBranch,
				}),
				...(searchTerm && {
					search: searchTerm,
				}),
				from_date: startDate,
				to_date: endDate,
				...(selectedSalesPerson !== 'default' && {
					sales_person: selectedSalesPerson,
				}),
				sort,
				sortOrder,
			})

			let exportData = response?.data || []

			// Apply the same amount filter used on the table
			if (selectedFilter === 'Paid Amount') {
				exportData = exportData.filter((invoice: any) => invoice?.paid_amount > 0)
			} else if (selectedFilter === 'Due Amount') {
				exportData = exportData.filter((invoice: any) => {
					const dueAmount = (invoice?.net_amount || 0) - (invoice?.paid_amount || 0)

					return dueAmount > 0
				})
			} else if (selectedFilter === 'Total Amount') {
				exportData = exportData.filter((invoice: any) => invoice?.net_amount > 0)
			}

			if (exportData.length === 0) {
				Swal.fire('No Data', 'There is no invoice data to export.', 'info')
				return
			}

			const worksheetData = exportData.map((invoice: any) => {
				const products = (invoice?.items || []).reduce((acc: any, item: any, i: number) => {
					acc[`Product ${i + 1} Name`] = item?.item_name || 'N/A'

					acc[`Product ${i + 1} Quantity`] = item?.quantity || 'N/A'

					acc[`Product ${i + 1} Amount`] = item?.amount || 'N/A'

					acc[`Product ${i + 1} Total Amount`] = item?.totalAmount || 'N/A'

					return acc
				}, {})

				const dueAmount = (invoice?.net_amount || 0) - (invoice?.paid_amount || 0)

				return {
					'Invoice No.': invoice?.invoice_number || 'N/A',
					'User Name': invoice?.fullName || invoice?.name || 'N/A',
					Mobile: invoice?.phoneNumber || invoice?.mobile || 'N/A',
					Email: invoice?.email || 'N/A',
					'Total Amount': invoice?.net_amount ?? 0,
					'Paid Amount': invoice?.paid_amount ?? 0,
					'Due Amount': dueAmount,
					'Purchase Date': invoice?.date ? DayJS(invoice.date).format('YYYY-MM-DD') : 'N/A',
					'Sales Person':
						invoice?.sales_person === 'N/A'
							? invoice?.other_sales_person || 'N/A'
							: salesPersonList.find((e: any) => e._id === invoice?.sales_person)?.full_name ||
							  invoice?.sales_person ||
							  'N/A',

					...products,
				}
			})

			const worksheet = XLSX.utils.json_to_sheet(worksheetData)

			// Auto-size Excel columns
			const columnWidths = Object.keys(worksheetData[0]).map((key) => {
				const maxLength = Math.max(
					key.length,
					...worksheetData.map((row: any) => String(row[key] ?? '').length)
				)

				return {
					wch: Math.min(maxLength + 2, 40),
				}
			})

			worksheet['!cols'] = columnWidths

			const workbook = XLSX.utils.book_new()

			XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices')

			XLSX.writeFile(workbook, `InvoiceData_${DayJS(new Date()).format('DD-MM-YYYY')}.xlsx`)

			Swal.fire(
				'Export Successful!',
				`${exportData.length} invoices exported successfully.`,
				'success'
			)
		} catch (error: any) {
			console.error('Export error:', error)

			Swal.fire('Export Failed!', 'Unable to export invoice data.', 'error')
		} finally {
			setLoading(false)
		}
	}

	const getFilterAmount = (name: string) => {
		if (selectedFilter === name) {
			setSelectedFilter(null)
		} else {
			setSelectedFilter(name)
		}
	}

	const removeInvoice = async (id: string) => {
		try {
			const { value: confirmText } = await Swal.fire({
				title: `Are you sure?`,
				text: `This action cannot be undone. Invoice will remove.`,
				icon: 'question',
				input: 'text',
				inputPlaceholder: 'Write "confirm" here to remove invoice',
				showCancelButton: true,
				confirmButtonText: 'Remove',
				showCloseButton: true,
				inputValidator: (value) => {
					if (!value || value.trim().toLowerCase() !== 'confirm') {
						return 'Please type "confirm" to remove the invoice.'
					}
				},
			})
			if (confirmText && confirmText.trim().toLowerCase() === 'confirm') {
				await deleteInvoice({ id: id })
				toast.success('Invoice removed successfully')
				fetchInvoiceData()
			}
		} catch (error: any) {
			toast.error(error.message)
			console.error(error)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Total Sales</PageTitle>
			<div className='row g-5 g-xl-8'>
				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Total Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faBuildingColumns}
						color='primary'
						title={dataInsight?.total_amount ? dataInsight?.total_amount : '0/-'}
						description='Total Amount'
					/>
				</div>

				<div
					className='col-lg-3'
					role='button'
					onClick={() => getFilterAmount('Paid Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faDollarSign}
						color='primary'
						title={dataInsight?.total_paid_amount ? dataInsight?.total_paid_amount : '0/-'}
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
						title={dataInsight?.total_unpaid_amount ? dataInsight?.total_unpaid_amount : '0/-'}
						description='Due Amount'
					/>
				</div>
			</div>
			<KTCard>
				{/* Top Toolbar */}
				<div className='card-header border-0 pt-6 px-6'>
					<div className='d-flex flex-column flex-md-row align-items-md-center justify-content-between w-100 gap-4'>
						{/* Items Per Page */}
						<div className='d-flex align-items-center'>
							<div className='d-md-block d-none'>
								<LengthMenu
									expenseData={invoiceData}
									handleItemsPerPageChange={handleItemsPerPageChange}
								/>
							</div>
						</div>

						{/* Action Buttons */}
						<div className='d-flex align-items-center gap-3 w-100 w-md-auto justify-content-md-end'>
							{/* Export - MASTER only */}
							{masterData === 'MASTER' && (
								<button
									type='button'
									className='btn btn-primary d-flex align-items-center justify-content-center gap-2 px-6'
									onClick={downloadExcel}
									disabled={loading}
									style={{
										height: '38px',
										minWidth: '170px',
									}}>
									<FontAwesomeIcon
										icon={faDownload}
										className='fs-4'
									/>
									<span>{loading ? 'Exporting...' : 'Export Excel'}</span>
								</button>
							)}

							{/* Create Invoice */}
							<TableButton
								action='add'
								to='/rag/create-invoice'
								text='Create Invoice'
							/>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className='card-body pt-2 pb-4 px-6'>
					<div className='row g-4 align-items-end'>
						{/* Search */}
						<div className='col-12 col-md-4 col-lg-3'>
							<label className='form-label fw-bold'>Search</label>

							<SearchFilter
								searchTerm={searchTerm}
								setSearchTerm={setSearchTerm}
								style={{ width: '100%' }}
							/>
						</div>

						{/* Store */}
						{adminType !== 'Store' && (
							<div className='col-12 col-md-4 col-lg-3'>
								<label className='form-label fw-bold'>Select Store</label>

								<select
									name='Select Store'
									className='form-select'
									value={selectedBranch}
									onChange={(e) => handleSetStoreInvoice(e.target.value)}
									style={{ height: '48px' }}>
									<option value='default'>Select Store</option>

									{branchesData.map((branch: any) => (
										<option
											key={branch}
											value={branch}>
											{branch}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Sales Person */}
						<div className='col-12 col-md-4 col-lg-3'>
							<label className='form-label fw-bold'>Sales Person</label>

							<select
								name='Select Sales Person'
								className='form-select'
								value={selectedSalesPerson}
								onChange={(e) => setSelectedSalesPerson(e.target.value)}
								style={{ height: '48px' }}>
								<option value='default'>Select Sales Person</option>

								{salesPersonList.map((item: any) => (
									<option
										key={item._id}
										value={item._id}>
										{item.full_name}
									</option>
								))}
							</select>
						</div>

						{/* Date Range */}
						<div className='col-12 col-md-4 col-lg-3'>
							<label className='form-label fw-bold'>Purchase Date</label>

							<div style={{ height: '48px' }}>
								<DateFilter
									onDateRangeChange={handleDateRangeChange}
									rightValue='0'
								/>
							</div>
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
												{item?.invoice_number}
											</span>
										</td>
										<td>
											<div className='d-flex align-items-center'>
												<div className='d-flex justify-content-start flex-column'>
													<span className='text-dark fw-bold  fs-6'>{item?.name}</span>
													<span className='text-muted fw-semibold text-muted d-flex fs-7'>
														{item?.mobile || ''}
													</span>
												</div>
											</div>
										</td>

										{selectedFilter ? (
											selectedFilter == 'Paid Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.paid_amount}
													</span>
												</td>
											) : selectedFilter == 'Due Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount - item?.paid_amount}
													</span>
												</td>
											) : selectedFilter == 'Total Amount' ? (
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount}
													</span>
												</td>
											) : (
												''
											)
										) : (
											<>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.paid_amount}
													</span>
												</td>
												<td>
													<span className='text-dark fw-bold  d-block mb-1 fs-6'>
														{item?.net_amount - item?.paid_amount}
													</span>
												</td>
											</>
										)}
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{item?.sales_person === 'N/A' ? (
													<div className='d-flex flex-column'>
														<span className='text-dark fw-bold fs-6'>
															{item?.other_sales_person}
														</span>
														<span className='text-muted fw-semibold fs-7'>N/A</span>
													</div>
												) : (
													salesPersonList.find((e: any) => e._id === item?.sales_person)
														?.full_name ||
													item?.sales_person ||
													'N/A'
												)}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold  d-block mb-1 fs-6'>
												{DayJS(item?.date).format('YYYY-MM-DD')}
											</span>
										</td>
										<td>
											<TableButton
												action='edit'
												to={`/rag/update-invoice?invoice_id=` + item?._id}
											/>
											<TableButton
												action='remove'
												onClick={() => removeInvoice(item?._id)}
											/>
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={12}>
												<div>
													<strong>Invoice No.:</strong> {item?.invoice_number}
													<br />
													<div className='d-flex align-items-center'>
														<div className='symbol symbol-45px me-3'>
															<img
																src={
																	item?.profile_image
																		? `https://files.fggroup.in/${item?.profile_image}`
																		: toAbsoluteUrl('/media/logos/fgiit-logo.png')
																}
																alt='User'
																style={{ width: '50px', height: '50px' }}
															/>
														</div>
														<div className='d-flex justify-content-start flex-column'>
															<span className='text-dark fw-bold  fs-6'>{item?.name}</span>
															<span className='text-muted fw-semibold text-muted d-flex fs-7'>
																{item?.mobile || ''}
															</span>
														</div>
													</div>
													<br />
													<strong>Total Amount:</strong> {item?.net_amount}
													<br />
													<strong>Paid Amount:</strong> {item?.paid_amount}
													<br />
													<strong>Due Amount:</strong> {item?.net_amount - item?.paid_amount}
													<br />
													<strong>Date:</strong> {DayJS(item?.date).format('YYYY-MM-DD')}
													<br />
													{item?.sales_person === 'N/A' ? (
														<div className='d-inline-flex flex-column align-items-start'>
															<span className='fw-bold'>{item?.other_sales_person}</span>
															<span className='text-muted fs-7'>N/A</span>
														</div>
													) : (
														salesPersonList.find((e: any) => e._id === item?.sales_person)
															?.full_name ||
														item?.sales_person ||
														'N/A'
													)}
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

export default NutritionTotalSalesList
