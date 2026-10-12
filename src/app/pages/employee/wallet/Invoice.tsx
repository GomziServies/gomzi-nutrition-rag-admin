import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { GetEmployees, getInvoice, getProfile } from '../../../Functions/FGGroup'
import { GetInvoice } from '../../../Functions/FWG/Invoice'

const InvoicePage: React.FC = () => {
	const [invoiceData, setInvoiceData] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [totalEarnings, setTotalEarnings] = useState(0)
	const [monthlyEarnings, setMonthlyEarnings] = useState(0)
	const [totalPaidAmount, setTotalPaidAmount] = useState(0)
	const [totalDueAmount, setTotalDueAmount] = useState(0)
	const [totalCommission, setTotalCommission] = useState(0)
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})
	const [metaData, setMetaData] = useState<any>()
	const [branchName, setBranchName] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
	const [visibleDetails, setVisibleDetails] = useState<string | null>(null)
	const [sort, setSort] = useState('date')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')
	const [selectedBranch, setSelectedBranch] = useState<any>(null)
	const [salesPersonList, setSalesPersonList] = useState<any[]>([])
	const [allInvoiceData, setAllInvoiceData] = useState<any[]>([])
	const [employeeId, setEmployeeId] = useState<string | null>(null)
	const [employeeFullName, setEmployeeFullName] = useState<string>('')
	const [employeeIdentifiers, setEmployeeIdentifiers] = useState<string[]>([])

	const isFirstRender = useRef(true)

	useEffect(() => {
		const fetchEmployee = async () => {
			try {
				const employeeData = localStorage.getItem('fg_group_info')
				if (!employeeData) {
					setBranchName('')
					return
				}

				const employee = JSON.parse(employeeData)
				const res = await GetEmployees({ id: employee._id })

				if (res.status === 200 && res.data?.[0]?.employee?.branch_name) {
					setBranchName(res.data[0].employee.branch_name)
				} else {
					setBranchName('')
				}

				const profileResponse: any = await getProfile()
				const profileData = Array.isArray(profileResponse?.data)
					? profileResponse.data[0]
					: profileResponse?.data
				const profileEmployee = profileData?.employee || profileData
				const profileEmployeeId =
					profileEmployee?.employee_id || profileData?.employee_id || profileData?._id || ''
				const profileFullName =
					profileEmployee?.full_name ||
					profileData?.full_name ||
					profileEmployee?.name ||
					profileData?.name ||
					''
				const identifiers = [
					employee._id,
					profileEmployeeId,
					profileEmployee?.employee_id,
					profileData?.employee_id,
					profileData?._id,
				]
					.filter(Boolean)
					.map((value) => String(value))

				setEmployeeId(profileEmployeeId || null)
				setEmployeeFullName(profileFullName)
				setEmployeeIdentifiers(Array.from(new Set(identifiers)))
			} catch (error) {
				console.error('Error fetching employee branch:', error)
				setBranchName('')
				setEmployeeId(null)
				setEmployeeFullName('')
				setEmployeeIdentifiers([])
			}
		}

		fetchEmployee()
	}, [])

	useEffect(() => {
		fetchSalesPersons()
	}, [])

	const fetchSalesPersons = async () => {
		try {
			const response: any = await GetEmployees({ limit: 1000 })
			if (response.data) {
				setSalesPersonList(response.data)
			}
		} catch (error) {
			console.error('Error fetching sales persons:', error)
		}
	}

	const getInvoiceCategory = () => {
		if (!branchName) return undefined

		if (branchName.toUpperCase().includes('GOMZI NUTRITION')) {
			return 'Gomzi Nutrition'
		}

		return branchName
	}

	const getInvoiceSalesPersonValue = (invoice: any) =>
		invoice?.sales_person ?? invoice?.salesPerson ?? ''

	const matchesEmployee = (salesPersonValue: any) => {
		const candidateValues = [
			salesPersonValue,
			salesPersonValue?._id,
			salesPersonValue?.employee_id,
			salesPersonValue?.full_name,
			salesPersonValue?.name,
			salesPersonValue?.id,
		]
			.filter(Boolean)
			.map((value) => String(value).trim())

		if (candidateValues.length === 0) return false

		const candidates = [employeeId, ...employeeIdentifiers]
			.filter(Boolean)
			.map((value) => String(value).trim())

		const employeeName = employeeFullName.trim()
		const normalizedEmployeeName = employeeName ? employeeName.toLowerCase() : ''

		return candidateValues.some((value) => {
			const lowerValue = value.toLowerCase()
			return (
				candidates.includes(value) ||
				(normalizedEmployeeName && lowerValue === normalizedEmployeeName)
			)
		})
	}

	const fetchAllInvoicePages = async (isFWG: boolean, basePayload: any) => {
		let currentPage = 1
		let totalPages = 1
		const pageLimit = 100
		const mergedData: any[] = []

		do {
			const payload = {
				...basePayload,
				page: currentPage,
				limit: pageLimit,
			}

			const response: any = isFWG ? await GetInvoice(payload) : await getInvoice(payload)

			if (response?.status !== 200) {
				break
			}

			const pageData = response?.data || []
			mergedData.push(...pageData)

			totalPages = response?.metadata?.pagination?.totalPages || totalPages

			if (pageData.length === 0) {
				break
			}

			currentPage += 1

			// Prevent infinite loop on bad metadata.
			if (currentPage > 200) {
				break
			}
		} while (currentPage <= totalPages)

		return mergedData
	}

	const getSalesPersonDisplayName = (invoice: any) => {
		const salesPersonValue = getInvoiceSalesPersonValue(invoice)

		if (employeeId && String(salesPersonValue) === String(employeeId) && employeeFullName) {
			return employeeFullName
		}

		const matchedSalesPerson = salesPersonList.find((person: any) => {
			const personId = person?._id ?? person?.employee_id ?? person?.id
			return String(personId) === String(salesPersonValue)
		})

		return matchedSalesPerson?.full_name || matchedSalesPerson?.name || salesPersonValue || '-'
	}

	const getLocalPaginatedData = (data: any[]) => {
		const startIndex = (pagination.page - 1) * pagination.itemsPerPage
		return data.slice(startIndex, startIndex + pagination.itemsPerPage)
	}

	const fetchData = async () => {
		if (branchName === null || employeeId === null) return

		setLoading(true)
		try {
			let startDate: Date | undefined
			let endDate: Date | undefined

			if (selectedDateRange) {
				;[startDate, endDate] = selectedDateRange
			}

			const requestPayload = {
				page: 1,
				limit: 100,
				...(startDate && { from_date: startDate }),
				...(endDate && { to_date: endDate }),
				invoice_category: getInvoiceCategory(),
				...(searchTerm && { search: searchTerm }),
				...(selectedBranch && { branch_name: selectedBranch }),
			}

			let invoiceResponse: any
			let rawInvoices: any[] = []
			if (branchName === 'FWG') {
				rawInvoices = await fetchAllInvoicePages(true, requestPayload)
				invoiceResponse = {
					status: 200,
					data: rawInvoices,
					metadata: {
						pagination: {
							totalPages: Math.max(1, Math.ceil(rawInvoices.length / pagination.itemsPerPage)),
						},
					},
				}
			} else {
				rawInvoices = await fetchAllInvoicePages(false, requestPayload)
				invoiceResponse = {
					status: 200,
					data: rawInvoices,
					metadata: {
						pagination: {
							totalPages: Math.max(1, Math.ceil(rawInvoices.length / pagination.itemsPerPage)),
						},
					},
				}
			}

			if (invoiceResponse.status === 200 && invoiceResponse.data) {
				rawInvoices = invoiceResponse.data

				const normalizedInvoices = rawInvoices.map((inv: any) => {
					const name =
						inv.name ??
						inv.fullName ??
						(inv.user ? `${inv.user.firstName ?? ''} ${inv.user.lastName ?? ''}`.trim() : '')

					const mobile = inv.mobile ?? inv.phoneNumber ?? inv.user?.mobile ?? ''
					const net_amount = inv.net_amount ?? inv.totalPayment ?? inv.amount ?? 0
					const paid_amount = inv.paid_amount ?? inv.paidPayment ?? inv.paidPayment ?? 0
					const date = inv.date ?? inv.createdAt

					return {
						...inv,
						name,
						mobile,
						net_amount,
						paid_amount,
						date,
					}
				})

				normalizedInvoices.sort((a: any, b: any) => DayJS(b.date).unix() - DayJS(a.date).unix())

				let filteredData = normalizedInvoices.filter((invoice: any) => {
					const invoiceSalesPerson = getInvoiceSalesPersonValue(invoice)
					return matchesEmployee(invoiceSalesPerson)
				})

				if (selectedFilter === 'Paid Amount') {
					filteredData = filteredData.filter((invoice: any) => (invoice.paid_amount ?? 0) > 0)
				} else if (selectedFilter === 'Due Amount') {
					filteredData = filteredData.filter((invoice: any) => {
						const dueAmount = (invoice.net_amount ?? 0) - (invoice.paid_amount ?? 0)
						return dueAmount > 0
					})
				} else if (selectedFilter === 'Total Amount') {
					filteredData = filteredData.filter((invoice: any) => (invoice.net_amount ?? 0) > 0)
				}

				const paginatedData = getLocalPaginatedData(filteredData)
				const totalPages = Math.max(1, Math.ceil(filteredData.length / pagination.itemsPerPage))

				setAllInvoiceData(filteredData)
				setInvoiceData(paginatedData)
				setMetaData({
					...(invoiceResponse.metadata?.pagination || {}),
					totalPages,
					totalRecords: filteredData.length,
				})

				let total = 0
				let monthly = 0
				let totalPaid = 0
				let totalDue = 0
				const currentMonth = DayJS().month()
				const currentYear = DayJS().year()

				filteredData.forEach((inv: any) => {
					const amount = inv.net_amount || 0
					const paid = inv.paid_amount || 0
					total += amount
					totalPaid += paid
					totalDue += amount - paid

					const invDate = DayJS(inv.date)
					if (invDate.month() === currentMonth && invDate.year() === currentYear) {
						monthly += amount
					}
				})

				setTotalEarnings(total)
				setMonthlyEarnings(monthly)
				setTotalPaidAmount(totalPaid)
				setTotalDueAmount(totalDue)
				setTotalCommission(totalPaid * 0.1)
			}
		} catch (error) {
			console.error('Error fetching wallet data:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [
		pagination.page,
		pagination.itemsPerPage,
		selectedDateRange,
		branchName,
		selectedBranch,
		selectedFilter,
		employeeId,
	])

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return
		}

		if (searchTerm.trim() || searchTerm === '') {
			setPagination((prev) => ({ ...prev, page: 1 }))
			if (pagination.page === 1) fetchData()
		}
	}, [searchTerm])

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

	const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
		setSort(newSort)
		setSortOrder(newSortOrder)
	}

	const handleRowClick = (id: string) => {
		if (window.innerWidth <= 1024) {
			setVisibleDetails(visibleDetails === id ? null : id)
		}
	}

	const getFilterAmount = (name: string) => {
		if (selectedFilter === name) {
			setSelectedFilter(null)
		} else {
			setSelectedFilter(name)
		}
	}

	const downloadExcel = () => {
		const worksheetData = allInvoiceData?.map((invoice: any) => ({
			'Invoice No.': invoice?.invoice_number || 'N/A',
			'User Name': invoice?.name || 'N/A',
			Mobile: invoice?.mobile || 'N/A',
			'Product Name': (invoice?.productName ?? invoice?.product_name) || 'N/A',
			'Brand Name': invoice?.branch_name || 'N/A',
			'Sales Person': getSalesPersonDisplayName(invoice),
			'Total Amount': invoice?.net_amount || 'N/A',
			'Paid Amount': invoice?.paid_amount || 'N/A',
			'Due Amount': (invoice?.net_amount ?? 0) - (invoice?.paid_amount ?? 0) || 'N/A',
			'Purchase Date': invoice?.date || 'N/A',
		}))

		const worksheet = XLSX.utils.json_to_sheet(worksheetData)
		const workbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices')
		XLSX.writeFile(workbook, 'InvoiceData.xlsx')
	}

	return null
	/*
	return (
		<>
			<style>{`
				.invoice-table thead th {
					white-space: nowrap !important;
					vertical-align: middle !important;
				}
				.invoice-table thead th svg {
					vertical-align: middle !important;
					margin-left: 5px !important;
				}
			`}</style>
			<PageTitle breadcrumbs={[]}>Invoice</PageTitle>

			<div className='row g-5 g-12'>
				<div className='col-lg-4' role='button' onClick={() => getFilterAmount('Total Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faWallet}
						color='primary'
						title={totalEarnings ? totalEarnings : '₹ 0/-'}
						description='Total Invoice Amount'
					/>
				</div>
				<div className='col-lg-4' role='button' onClick={() => getFilterAmount('Paid Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-xl-8'
						Icon={faChartLine}
						color='primary'
						title={totalPaidAmount ? totalPaidAmount : '₹ 0/-'}
						description='Total Paid Amount'
					/>
				</div>
				<div className='col-lg-4' role='button' onClick={() => getFilterAmount('Due Amount')}>
					<StatisticsWidget2
						className='card-xl-stretch mb-5 mb-xl-8'
						Icon={faHistory}
						color='primary'
						title={totalDueAmount ? totalDueAmount : '₹ 0/-'}
						description='Total Due Amount'
					/>
				</div>
			</div>

			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='w-100'>
						<div className='d-flex align-items-center justify-content-start gap-4 flex-wrap'>
							<div className='d-flex align-items-center position-relative me-2'>
								<SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
							</div>
							<div className='me-2'>
								<button className='btn btn-primary btn-icon' onClick={downloadExcel} disabled={loading}>
									<FontAwesomeIcon icon={faDownload} className='fs-3' />
								</button>
							</div>
							<div className='me-2'>
								<button className='btn btn-light-danger btn-icon' onClick={() => {
									setSelectedDateRange(null)
									setSelectedBranch(null)
									setSearchTerm('')
									setSelectedFilter(null)
									setPagination((prev) => ({ ...prev, page: 1 }))
								}} title='Reset Filters'>
									<i className='bi bi-arrow-clockwise fs-4'></i>
								</button>
							</div>
							<div className='me-2'>
								<LengthMenu expenseData={invoiceData} handleItemsPerPageChange={handleItemsPerPageChange} />
							</div>
							<div className='w-200px'>
								<select
									className='form-select inputfield-bg'
									value={selectedBranch || 'default'}
									onChange={(e) => setSelectedBranch(e.target.value === 'default' ? null : e.target.value)}>
									<option value='default'>Select Brand</option>
									{['Adajan', 'Vesu', 'Katargam'].map((item: any) => (
										<option key={item} value={item}>
											{item}
										</option>
									))}
								</select>
							</div>
							<div className='w-250px'>
								<DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0' />
							</div>
						</div>
					</div>
				</div>
				<div className='py-4 card-body'>
					<div className='table-responsive invoice-table'>
						<Table
								data={invoiceData}
							columns={[
								{ title: 'Invoice No.', field: 'id' },
								{ title: 'User', field: 'name' },
								{ title: 'Services / Product', field: 'productName' },
								{ title: 'Brand Name', field: 'branch_name' },
								{ title: 'Sales Person', field: 'sales_person' },
								{ title: 'Paid Amount', field: 'paid_amount' },
								{ title: 'Total Amount', field: 'net_amount' },
								{ title: 'Purchase Date', field: 'date' },
							]}
							sort={sort}
							sortOrder={sortOrder}
							onSortChange={handleSortChange}
							renderRow={(invoice: any, index: number, actualIndex: number, isVisible: boolean) => (
								<React.Fragment key={invoice._id}>
									<tr onClick={() => handleRowClick(invoice._id)} className='data-row'>
										<td className='ps-4'>
											<span className='text-dark fw-bold d-block fs-6'>
												<FontAwesomeIcon
													icon={faPlusCircle}
													className='me-2 plus-icon'
													style={{ color: '#607D8B', fontSize: '16px' }}
												/>
												{actualIndex}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>{invoice.invoice_number}</span>
										</td>
										<td>
											<div className='d-flex justify-content-start flex-column'>
												<span className='text-dark fw-bold fs-6'>{invoice.name}</span>
												<span className='text-muted fw-semibold d-block fs-7'>{invoice.mobile}</span>
											</div>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>
												{invoice.productName ?? invoice.product_name ?? 'Other'}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>{invoice.branch_name || '-'}</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>{getSalesPersonDisplayName(invoice)}</span>
										</td>
										<td className='text-center'>
											<span className='text-dark fw-bold d-block fs-6'>
												{Number(invoice.paid_amount || invoice.paidPayment || 0).toLocaleString()}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>
												₹ {Number(invoice.net_amount || 0).toLocaleString()}
											</span>
										</td>
										<td>
											<span className='text-dark fw-bold d-block fs-6'>{DayJS(invoice.date).format('YYYY-MM-DD')}</span>
										</td>
										<td>
											{invoice.invoice_category === 'Gomzi Nutrition' || invoice.invoice_category === 'Store' ? (
												<TableButton
													action='view'
													to={`/employee/wallet/gls-invoice?invoice_id=${invoice._id}`}
													showIcon={true}
													backgroundDark={true}
												/>
											) : (
												<TableButton
													action='view'
													to={`/employee/wallet/fgiit-invoice?invoice_id=${invoice._id}`}
													showIcon={true}
													backgroundDark={true}
												/>
											)}
										</td>
									</tr>
									{isVisible && (
										<tr className={`detail-row ${isVisible ? 'is-visible' : ''}`}>
											<td colSpan={10}>
												<div>
													<strong>Invoice No.: </strong> {invoice.invoice_number}
													<br />
													<strong>User: </strong>
													<div className='d-flex justify-content-start flex-column'>
														<span className='text-dark fw-bold fs-6'>{invoice.name}</span>
														<span className='text-muted fw-semibold d-block fs-7'>{invoice.mobile}</span>
													</div>
													<br />
													<strong>Services / Product: </strong> {invoice.productName ?? invoice.product_name ?? 'Other'}
													<br />
													<strong>Brand Name: </strong> {invoice.branch_name || '-'}
													<br />
													<strong>Sales Person: </strong> {getSalesPersonDisplayName(invoice)}
													<br />
													<strong>Paid Amount: </strong> {Number(invoice.paid_amount || invoice.paidPayment || 0).toLocaleString()}
													<br />
													<strong>Total Amount: </strong> ₹ {Number(invoice.net_amount || 0).toLocaleString()}
													<br />
													<strong>Purchase Date: </strong> {DayJS(invoice.date).format('YYYY-MM-DD')}
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
	*/
}

export default InvoicePage
