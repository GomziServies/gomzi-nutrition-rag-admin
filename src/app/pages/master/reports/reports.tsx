import { faDollar, faDownload, faFileInvoice, faFileLines } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import CurrencyFormatter from '../../../components/CurrencyFormatter'
import DateFilter from '../../../components/DateRangePicker'
import UsersListPagination from '../../../components/TablePagination'
import {
	GetExpenseInsights,
	getInvoice,
	GetInvoiceInsights,
	GetLecture,
	GetLectureComments,
	GetUserStats,
} from '../../../Functions/FGGroup'
import { getExpense } from '../../../Functions/FGGroup/Expense'
import { GetExpenses, GetExpenseStats, GetInvoice, GetInvoiceStats } from '../../../Functions/FWG'
import * as GCSFunctions from '../../../Functions/GCS'
import { NutritionCharts1 } from './Charts1'
import { NutritionCharts2 } from './Charts2'
import { NutritionCharts3 } from './Charts3'
import { NutritionCharts4 } from './Charts4'
import { DayJS } from '../../../../_metronic/helpers/Utils'

const MasterReports: React.FC = () => {
	const [loading, setLoading] = useState(false)
	const [showDownload, setShowDownload] = useState(false)
	const [branch_name, setBranchName] = useState('Fgiit')
	const [categoryName, setCategoryName] = useState<any>('FG Group')
	const [invoiceTotalData, setInvoiceTotalData] = useState<any>({ total_amount: 0 })
	const [invoiceData, setInvoiceData] = useState<any>([])
	const [invoiceChartData, setInvoiceChartData] = useState<any>([])
	const [expenseTotalData, setExpenseTotalData] = useState<any>({ total_amount: 0 })
	const [expenseData, setExpenseData] = useState<any>([])
	const [userStats, setUserStats] = useState<any>([])
	const [commentData, setCommentData] = useState<any>([])
	const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 5,
	})
	const [pagination2, setPagination2] = useState({
		page: 1,
		itemsPerPage: 5,
	})
	const [pagination3, setPagination3] = useState({
		page: 1,
		itemsPerPage: 5,
	})
	// 'Private' | 'FG Group' | 'Gomzi Nutrition'

	let startDate: Date
	let endDate: Date

	if (selectedDateRange) {
		;[startDate, endDate] = selectedDateRange
	} else {
		startDate = DayJS().startOf('month').toDate()
		endDate = DayJS().endOf('month').toDate()
	}

	const fetchInvoiceTotalData = async () => {
		setLoading(true)
		try {
			let response: any
			if (categoryName === 'Fwg') {
				response = await GetInvoiceStats({
					invoice_from_date: startDate,
					invoice_to_date: endDate,
				})
			} else if (categoryName === 'Gcs') {
				response = await GCSFunctions.GetInvoiceInsight({
					from_date: startDate,
					to_date: endDate,
				})
			} else {
				response = await GetInvoiceInsights({
					invoice_category: categoryName,
					from_date: startDate,
					to_date: endDate,
				})
			}
			let filteredData: any = response.data
			setInvoiceTotalData(filteredData[0])
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchInvoiceData = async () => {
		setLoading(true)
		try {
			let response: any
			if (categoryName === 'Fwg') {
				response = await GetInvoice({
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Vesu') {
				response = await GetInvoice({
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Adajan') {
				response = await GetInvoice({
					createdById: '66a49d83cc78d7c499945d34',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Baroda') {
				response = await GetInvoice({
					createdById: '66a49e08cc78d7c499945d73',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'Gcs') {
				response = await GCSFunctions.GetInvoice({
					from_date: startDate,
					to_date: endDate,
				})
			} else {
				response = await getInvoice({
					invoice_category: categoryName,
					from_date: startDate,
					to_date: endDate,
				})
			}
			let data: any = response.data
			let sortedData: any
			if (categoryName === 'Fwg' || categoryName === 'Gcs') {
				sortedData = data.sort((a: any, b: any) => b.totalPayment - a.totalPayment)
			} else {
				sortedData = data.sort((a: any, b: any) => b.net_amount - a.net_amount)
			}
			setInvoiceData(sortedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchInvoiceChartData = async () => {
		setLoading(true)
		try {
			let response: any
			if (categoryName === 'Fwg') {
				response = await GetInvoice({
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Vesu') {
				response = await GetInvoice({
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Adajan') {
				response = await GetInvoice({
					createdById: '66a49d83cc78d7c499945d34',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Baroda') {
				response = await GetInvoice({
					createdById: '66a49e08cc78d7c499945d73',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'Gcs') {
				response = await GCSFunctions.GetInvoice({
					from_date: startDate,
					to_date: endDate,
				})
			} else {
				response = await getInvoice({
					invoice_category: categoryName,
					from_date: startDate,
					to_date: endDate,
				})
			}
			let data: any = response.data

			let aggregatedData: any = {}

			if (categoryName === 'Fwg') {
				data.forEach((fwgData: any) => {
					const productName = Array.isArray(fwgData.productName)
						? fwgData.productName.map((item: any) => item.item_name).join(', ')
						: typeof fwgData.productName === 'object'
						? fwgData.productName.item_name
						: fwgData.productName

					if (!aggregatedData[productName]) {
						aggregatedData[productName] = 0
					}
					aggregatedData[productName] += parseFloat(fwgData.totalPayment)
				})
			} else if (categoryName === 'Gcs') {
				aggregatedData = data.reduce((acc: any, item: any) => {
					if (Array.isArray(item.productName)) {
						item.productName.forEach((i: any) => {
							if (!acc[i.item_name]) {
								acc[i.item_name] = 0
							}
							acc[i.item_name] += parseFloat(i.amount)
						})
					} else {
						const productName =
							typeof item.productName === 'object' ? item.productName.item_name : item.productName

						if (!acc[productName]) {
							acc[productName] = 0
						}
						acc[productName] += parseFloat(item.totalPayment)
					}
					return acc
				}, {})
			} else {
				aggregatedData = data.reduce((acc: any, item: any) => {
					if (Array.isArray(item.items)) {
						item.items.forEach((i: any) => {
							if (!acc[i.item_name]) {
								acc[i.item_name] = 0
							}
							acc[i.item_name] += parseFloat(i.amount)
						})
					} else {
						const productName =
							typeof item.productName === 'object' ? item.productName.item_name : item.productName

						if (!acc[productName]) {
							acc[productName] = 0
						}
						acc[productName] += parseFloat(item.totalPayment)
					}
					return acc
				}, {})
			}

			// Convert aggregated data to array format
			const rattingData = Object.keys(aggregatedData).map((item_name) => ({
				item_name,
				total_amount: parseInt(aggregatedData[item_name]),
			}))

			// Sort the data
			const sortedData = rattingData.sort((a: any, b: any) => b.total_amount - a.total_amount)
			setInvoiceChartData(sortedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchExpenseTotalData = async () => {
		setLoading(true)
		try {
			let response: any
			if (
				categoryName === 'Fwg' ||
				categoryName === 'FWG-Vesu' ||
				categoryName === 'FWG-Adajan' ||
				categoryName === 'FWG-Baroda'
			) {
				response = await GetExpenseStats()
			} else if (categoryName === 'Gcs') {
				response = await GCSFunctions.GetExpenses({
					from_date: startDate,
					to_date: endDate,
				})
			} else {
				response = await GetExpenseInsights({
					expense_company: categoryName,
					from_date: startDate,
					to_date: endDate,
				})
			}
			let data: any = response.data
			if (categoryName === 'Gcs') {
				const totalExpense = data.reduce((acc: number, el: any) => acc + el.expenseAmount, 0)
				setExpenseTotalData({ total_amount: totalExpense, total_expense: data.length })
			} else {
				setExpenseTotalData(data[0])
			}
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchExpenseData = async () => {
		setLoading(true)
		try {
			let response: any
			if (categoryName === 'Fwg') {
				response = await GetExpenses({
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Vesu') {
				response = await GetExpenses({
					createdById: '602294b161bc8842e44328be',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Adajan') {
				response = await GetExpenses({
					createdById: '623705ee33824c76dc5aba35',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'FWG-Baroda') {
				response = await GetExpenses({
					createdById: '669f7bd21ebfdd2592a5ff89',
					from_date: startDate,
					to_date: endDate,
				})
			} else if (categoryName === 'Gcs') {
				response = await GCSFunctions.GetExpenses({
					from_date: startDate,
					to_date: endDate,
				})
			} else {
				response = await getExpense({
					expense_company: categoryName,
					from_date: startDate,
					to_date: endDate,
				})
			}
			const data: any = response.data
			const aggregatedData = aggregateExpenseData(data)
			setExpenseData(aggregatedData)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	const fetchUserStatsData = async () => {
		try {
			const response: any = await GetUserStats()
			setUserStats(response.data.status_wise)
		} catch (error: any) {
			console.error(error)
		}
	}

	const fetchCommentData = async () => {
		setLoading(true)
		try {
			const commentsResponse = await GetLectureComments()
			const commentsData: any = commentsResponse.data

			const lectureResponse = await GetLecture()
			const lectureData: any = lectureResponse.data

			// Add lecture title to each comment
			const enrichedComments = commentsData.map((comment: any) => {
				const lecture = lectureData.find((lecture: any) => lecture._id === comment.lecture._id)
				return {
					...comment,
					lectureTitle: lecture ? lecture.title : 'No Title',
				}
			})

			// Flatten the comments data
			const flattenedComments = enrichedComments.flatMap((data: any) => 
				data.comments.map((c: any) => ({
					...c,
					lecture_Title: data.lecture.title,
					createdAt: data.createdAt,
					lectureId: data._id,
				}))
			)

			flattenedComments.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)

			setCommentData(flattenedComments)
		} catch (error) {
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		setInvoiceTotalData({ total_amount: 0 })
		setInvoiceData([])
		setInvoiceChartData([])
		setExpenseTotalData({ total_amount: 0 })
		setExpenseData([])

		fetchInvoiceTotalData()
		fetchInvoiceData()
		fetchInvoiceChartData()
		fetchExpenseTotalData()
		fetchExpenseData()
	}, [branch_name, selectedDateRange, categoryName])

	useEffect(() => {
		if (categoryName === 'FG Group') {
			fetchUserStatsData()
			fetchCommentData()
		}
	}, [categoryName])

	const handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const branch = event.target.value
		setBranchName(branch)

		// Update the categoryName based on the selected branch
		if (branch === 'Fgiit') {
			setCategoryName('FG Group')
		} else if (branch === 'FWG-Master') {
			setCategoryName('Fwg')
		} else if (branch === 'FWG-Vesu') {
			setCategoryName('FWG-Vesu')
		} else if (branch === 'FWG-Adajan') {
			setCategoryName('FWG-Adajan')
		} else if (branch === 'FWG-Baroda') {
			setCategoryName('FWG-Baroda')
		} else if (branch === 'Gcs') {
			setCategoryName('Gcs')
		} else if (branch === 'Gomzi Nutrition') {
			setCategoryName('Gomzi Nutrition')
		} else if (branch === 'Master') {
			setCategoryName('Private')
		} else {
			setCategoryName('') // default value
		}
	}

	const handleDateRangeChange = (range: [Date, Date] | null) => {
		setSelectedDateRange(range)
		setPagination((prev) => ({ ...prev, page: 1 }))
	}

	const aggregateExpenseData = (data: any[]) => {
		const aggregatedData = data.reduce((acc, item) => {
			let category: string

			if (categoryName === 'Fwg' || categoryName === 'Gcs') {
				category = item.expenseItemName.toLowerCase()
			} else {
				category = item.expense_category?.toLowerCase() || 'unknown'
			}

			if (!acc[category]) {
				acc[category] = 0
			}

			// Aggregate expenseAmount if it exists and is greater than 2000
			const expenseAmount = parseFloat(item.expenseAmount)
			if (!isNaN(expenseAmount) && expenseAmount > 2000) {
				acc[category] += expenseAmount
			}

			// Aggregate total_amount if it exists and is greater than 2000
			const totalAmount = parseFloat(item.total_amount)
			if (!isNaN(totalAmount) && totalAmount > 2000) {
				acc[category] += totalAmount
			}

			return acc
		}, {} as { [key: string]: number })

		// Filter out categories with total amounts <= 2000
		const filteredData = Object.keys(aggregatedData).reduce((acc, category) => {
			if (aggregatedData[category] > 2000) {
				acc[category] = aggregatedData[category]
			}
			return acc
		}, {} as { [key: string]: number })
		return filteredData
	}

	const formatDataForChart = (data: { [key: string]: number }) => {
		return Object.keys(data).map((category) => ({
			expense_category: category,
			total_amount: data[category],
		}))
	}

	const formattedExpenseData = formatDataForChart(expenseData)

	let filteredInvoiceData: any
	categoryName === 'Fwg' || categoryName === 'Gcs'
		? (filteredInvoiceData = invoiceData.filter((food: any) => food.fullName?.toLowerCase()))
		: (filteredInvoiceData = invoiceData.filter((food: any) => food.name?.toLowerCase()))

	const paginatedInvoiceData = filteredInvoiceData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	const filteredCommentData = commentData.filter((data: any) => data.lecture_Title.toLowerCase())

	const paginatedCommentData = filteredCommentData.slice(
		(pagination2.page - 1) * pagination2.itemsPerPage,
		pagination2.page * pagination2.itemsPerPage
	)

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handlePageChange2 = (page: number) => {
		setPagination2({ ...pagination2, page })
	}

	const handlePageChange3 = (page: number) => {
		setPagination3({ ...pagination3, page })
	}

	const filteredData =
		invoiceChartData?.filter(
			(items: any) => !isNaN(items.total_amount) && items.total_amount > 0
		) || []

	const colors = [
		'#7239ea',
		'#50cd89',
		'#f1416c',
		'#64B5F6',
		'#4DB6AC',
		'#FFD54F',
		'#FF8A65',
		'#A1887F',
		'#90A4AE',
		'#DCE775',
		'#FF7043',
		'#7986CB',
		'#4FC3F7',
		'#64DD17',
		'#F57F17',
	]

	const handleDownload = () => {
		setShowDownload(true)
		try {
			setTimeout(async () => {
				const input: any = document.getElementById('report-content')
				const canvas = await html2canvas(input, {
					scale: 2,
					useCORS: true,
					logging: true,
				})
				const imgData = canvas.toDataURL('image/png')
				const pdf = new jsPDF({
					orientation: 'portrait',
					unit: 'px',
					format: [canvas.width, canvas.height],
				})

				pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
				pdf.save('report.pdf')
				setShowDownload(false)
			}, 1000)
		} catch (error) {
			console.error(error)
		}
	}

	const [expandedDescription, setExpandedDescription] = useState<{ [key: number]: boolean }>({})

	const toggleDescription = (index: number) => {
		setExpandedDescription((prevState) => ({
			...prevState,
			[index]: !prevState[index],
		}))
	}

	const truncateString = (str: any, num: any) => {
		if (!str || typeof str !== 'string') {
			return ''
		}
		if (str.length <= num) {
			return str
		}
		return str.slice(0, num) + '...'
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Report</PageTitle>

			<div id='report-content'>
				{loading && (
					<div className='loader-background'>
						<div
							className='spinner-border spinner-border-1 text-white'
							style={{ width: '50px', height: '50px' }}
							role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				)}
				<KTCard className='bg-chart'>
					{!showDownload ? (
						<div className='row my-8 px-6'>
							<div className='col-md-4 d-flex align-items-center'>
								<h1 className='text-dark'>{categoryName} Report</h1>
							</div>
							<div className='col-md-3 mt-md-0 mt-3'>
								<select
									className='form-select form-select-solid bg-white'
									name='branch'
									id='branch'
									onChange={(e: any) => handleInputChange(e)}
									defaultValue={'Fgiit'}>
									<option>Select Branch</option>
									<option value='Fgiit'>Fgiit</option>
									<option value='FWG-Master'>FWG Master</option>
									<option value='FWG-Vesu'>FWG-Vesu</option>
									<option value='FWG-Adajan'>FWG-Adajan</option>
									<option value='FWG-Baroda'>FWG-Baroda</option>
									<option value='Gomzi Nutrition'>Gomzi Nutrition</option>
									<option value='Gcs'>Gcs</option>
									{/* <option value='Master'>Master</option> */}
								</select>
								{/* <SelectField
									className='col-md-6 fv-row mb-7'
									label='Select Branch'
									name='branch'
									value={branch_name}
									onChange={(e: any) => handleInputChange(e)}
									htmlFor='branch'
									options={['Fgiit', 'Fwg', 'Gomzi Nutrition', 'Gcs', 'Master']}
								/> */}
							</div>
							<div className='col-md-4 mt-md-0 mt-3'>
								<DateFilter
									leftValue='-600px'
									onDateRangeChange={handleDateRangeChange}
								/>
							</div>
							<div className='col-md-1 d-flex justify-content-start mt-1 align-items-center'>
								<button
									className='btn btn-primary d-flex justify-content-center'
									onClick={handleDownload}
									disabled={loading}>
									<FontAwesomeIcon
										icon={faDownload}
										className='fs-3'
									/>
								</button>
							</div>
						</div>
					) : (
						''
					)}

					{showDownload ? <h1 className='text-center my-5 mb-9'>Report</h1> : ''}

					{/* download this page's output */}
					<div>
						<div className='px-5 pb-5'>
							<div className='row justify-content-center g-4'>
								<div className='col-md-3'>
									<div className='card bg-light-primary mb-4'>
										<div className='card-body d-flex align-items-center'>
											<div className='d-flex align-items-center my-3'>
												<div className='symbol symbol-45px w-40px me-4'>
													<span className='symbol-label bg-primary text-light rounded-circle'>
														<FontAwesomeIcon
															icon={faDollar}
															className='fs-3'
														/>
													</span>
												</div>
												<div className='w-100'>
													<p className='fs-5 fw-bold text-gray-800  m-0'>
														Total Invoice
													</p>
													<div className='fw-bold fs-6 text-gray-600'>
														<CurrencyFormatter
															amount={parseInt(
																categoryName === 'Fwg'
																	? invoiceTotalData?.total_net_amount ?? 0
																	: invoiceTotalData?.total_amount ?? 0
															)}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-3'>
									<div className='card bg-light-danger mb-4'>
										<div className='card-body d-flex align-items-center'>
											<div className='d-flex align-items-center my-3'>
												<div className='symbol symbol-45px w-40px me-4'>
													<span className='symbol-label bg-danger text-light rounded-circle'>
														<FontAwesomeIcon
															icon={faDollar}
															className='fs-3'
														/>
													</span>
												</div>
												<div className='w-100'>
													<p className='fs-5 fw-bold text-gray-800 text-hover-danger m-0'>
														Total Cost
													</p>
													<div className='fw-bold fs-6 text-gray-600'>
														<CurrencyFormatter
															amount={parseInt(expenseTotalData?.total_amount ?? 0)}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-3'>
									<div className='card bg-light-info mb-4'>
										<div className='card-body d-flex align-items-center'>
											<div className='d-flex align-items-center my-3'>
												<div className='symbol symbol-45px w-40px me-4'>
													<span className='symbol-label bg-info text-light rounded-circle'>
														<FontAwesomeIcon
															icon={faFileLines}
															className='fs-3'
														/>
													</span>
												</div>
												<div className='w-100'>
													<p className='fs-5 fw-bold text-gray-800 text-hover-info m-0'>
														Invoices Entry
													</p>
													<div className='fw-bold fs-6 text-gray-600'>
														{invoiceTotalData?.total_invoices ?? 0}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className='col-md-3'>
									<div className='card bg-light-success mb-4'>
										<div className='card-body d-flex align-items-center pe-5'>
											<div className='d-flex align-items-center my-3'>
												<div className='symbol symbol-45px w-40px me-4'>
													<span className='symbol-label bg-success text-light rounded-circle'>
														<FontAwesomeIcon
															icon={faFileInvoice}
															className='fs-3'
														/>
													</span>
												</div>
												<div className='w-100'>
													<p className='fs-5 fw-bold text-gray-800 text-hover-success m-0'>
														Expense Entry
													</p>
													<div className='fw-bold fs-6 text-gray-600'>
														{categoryName === 'Fwg'
															? expenseTotalData?.total_records ?? 0
															: expenseTotalData?.total_expense ?? 0}
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className='row g-4'>
								<div className='col-md-6 d-flex justify-content-center'>
									<NutritionCharts1
										invoiceData={invoiceTotalData}
										categoryName={categoryName}
										className='w-100 card mb-4' // Ensure full width and margin
									/>
								</div>
								<div className='col-md-6 d-flex justify-content-center'>
									<NutritionCharts2
										expenseData={formattedExpenseData}
										className='w-100 card mb-4' // Ensure full width and margin
									/>
								</div>
							</div>

							<div className='row mt-2'>
								<div className='col-md-12'>
									<div className='card mb-4'>
										<h1 className='text-center mt-7 mb-4'>Highest purchased Items</h1>
										{invoiceChartData.length === 0 ? (
											<div className='d-flex text-center my-6 w-100 align-content-center justify-content-center mt-5'>
												<b>No records found</b>
											</div>
										) : (
											<div className='row'>
												<div className='col-md-6'>
													<NutritionCharts3
														rattingData={invoiceChartData}
														className='w-100'
													/>
												</div>

												<div className='col-md-6 d-flex flex-column justify-content-center mb-md-15'>
													<div style={{ maxHeight: '380px', overflow: 'auto' }}>
														{filteredData
															.sort((a: any, b: any) => b.total_amount - a.total_amount)
															.map((item: any, index: number) => (
																<div
																	className='d-flex align-items-center fs-4 my-3'
																	key={index}>
																	<div
																		className='rounded-circle me-2'
																		style={{
																			width: '13px',
																			height: '13px',
																			backgroundColor: colors[index % colors.length],
																		}}></div>
																	<p
																		className='m-0 fw-bold'
																		key={item.item_name}>
																		{item.item_name}
																	</p>
																</div>
															))}
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className='row mt-2'>
								<div className='col-md-12'>
									<div className='card mb-4'>
										<h1 className='mt-6 ms-8'>Highest purchased Items Invoice</h1>
										<div className='py-4 card-body'>
											<div className='table-responsive'>
												<table
													id='kt_table_users'
													className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-gray-300'>
													<thead>
														<tr className='fw-bold text-muted bg-light border-bottom-0'>
															<th className='ps-4 rounded-start'>No.</th>
															<th>User</th>
															<th>Paid Amount</th>
															<th>Total Amount</th>
															<th>Purchase Date</th>
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
															paginatedInvoiceData.map((item: any, index: number) => {
																const actualIndex =
																	(pagination.page - 1) * pagination.itemsPerPage + index + 1
																return (
																	<tr key={index}>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{actualIndex}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  fs-6'>
																				{categoryName === 'Fwg' || categoryName === 'Gcs'
																					? item.fullName
																					: item.name}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{categoryName === 'Fwg' || categoryName === 'Gcs'
																					? item.paidPayment
																					: item.paid_amount}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{categoryName === 'Fwg' || categoryName === 'Gcs'
																					? item.totalPayment
																					: item.net_amount}
																			</span>
																		</td>
																		<td>
																			<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																				{DayJS(item.date).format('YYYY-MM-DD')}
																			</span>
																		</td>
																	</tr>
																)
															})
														)}
													</tbody>
												</table>
											</div>
											{paginatedInvoiceData.length === 0 && !loading && (
												<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
													<b>No records found</b>
												</div>
											)}
											{paginatedInvoiceData.length > 0 && (
												<UsersListPagination
													totalPages={Math.ceil(
														filteredInvoiceData.length / pagination.itemsPerPage
													)}
													currentPage={pagination.page}
													onPageChange={handlePageChange}
												/>
											)}
										</div>
									</div>
								</div>
							</div>

							{categoryName === 'FG Group' ? (
								<>
									<div className='row mt-2'>
										<div className='col-md-12'>
											<div className='card mb-4'>
												<h1 className='text-center mt-7 mb-4'>Users</h1>
												{invoiceChartData.length === 0 ? (
													<div className='d-flex text-center my-6 w-100 align-content-center justify-content-center mt-5'>
														<b>No records found</b>
													</div>
												) : (
													<div className='row'>
														<div className='col-md-6'>
															<NutritionCharts4
																rattingData={userStats}
																className='w-100'
															/>
														</div>

														<div className='col-md-6 d-flex flex-column justify-content-center mb-md-15'>
															<div style={{ maxHeight: '380px', overflow: 'auto' }}>
																{userStats
																	.sort((a: any, b: any) => b.count - a.count)
																	.map((item: any, index: number) => (
																		<div
																			className='d-flex align-items-center fs-4 my-3'
																			key={index}>
																			<div
																				className='rounded-circle me-2'
																				style={{
																					width: '13px',
																					height: '13px',
																					backgroundColor: colors[index % colors.length],
																				}}></div>
																			<p
																				className='m-0 fw-bold capitalize-text'
																				key={item.status}>
																				{item.status.toUpperCase()}
																			</p>
																		</div>
																	))}
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>

									<div className='row mt-2'>
										<div className='col-md-7'>
											<div className='card mb-4'>
												<h1 className='mt-6 ms-8'>Latest Comment</h1>
												<div className='py-4 card-body'>
													<div className='table-responsive'>
														<table
															id='kt_table_users'
															className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-gray-300'>
															<thead>
																<tr className='fw-bold text-muted bg-light border-bottom-0'>
																	<th className='ps-4 rounded-start'>No.</th>
																	<th>Lecture Name</th>
																	<th>Comment</th>
																	<th>Reply by Admin</th>
																	<th>Create Date</th>
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
																	paginatedCommentData.map((item: any, index: number) => {
																		const actualIndex =
																			(pagination.page - 1) * pagination.itemsPerPage + index + 1
																		return (
																			<tr key={index}>
																				<td>
																					<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																						{actualIndex}
																					</span>
																				</td>
																				<td>
																					<span
																						className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
																						onClick={() => toggleDescription(index)}
																						title={item.lecture_Title}
																						style={{ cursor: 'pointer' }}>
																						{expandedDescription[index]
																							? item.lecture_Title
																							: truncateString(item.lecture_Title, 30)}
																					</span>
																					<span
																						className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
																						style={{ cursor: 'pointer' }}
																						title={item.lecture_Title}
																						onClick={() => toggleDescription(index)}>
																						{expandedDescription[index]
																							? item.lecture_Title
																							: truncateString(item.lecture_Title, 15)}
																					</span>
																				</td>
																				<td>
																					<span
																						className='text-dark fw-bold  d-md-block d-none mb-1 fs-6'
																						onClick={() => toggleDescription(index)}
																						title={item.comment}
																						style={{ cursor: 'pointer' }}>
																						{expandedDescription[index]
																							? item.comment
																							: truncateString(item.comment, 30)}
																					</span>
																					<span
																						className='text-dark fw-bold  d-md-none d-block mb-1 fs-6'
																						style={{ cursor: 'pointer' }}
																						title={item.comment}
																						onClick={() => toggleDescription(index)}>
																						{expandedDescription[index]
																							? item.comment
																							: truncateString(item.comment, 15)}
																					</span>
																				</td>
																				<td>
																					<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																						{item.is_replied_by_admin ? (
																							<span className='fs-6 btn btn-light-success btn-sm'>
																								Yes
																							</span>
																						) : (
																							<span className='fs-6 btn btn-light-danger btn-sm'>
																								No
																							</span>
																						)}
																					</span>
																				</td>
																				<td>
																					<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																						{DayJS(item.createdAt).format('DD/MM/YYYY hh:mm:ss A')}
																					</span>
																				</td>
																			</tr>
																		)
																	})
																)}
															</tbody>
														</table>
													</div>
													{paginatedCommentData.length === 0 && !loading && (
														<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
															<b>No records found</b>
														</div>
													)}
													{paginatedCommentData.length > 0 && (
														<UsersListPagination
															totalPages={Math.ceil(commentData.length / pagination2.itemsPerPage)}
															currentPage={pagination2.page}
															onPageChange={handlePageChange2}
														/>
													)}
												</div>
											</div>
										</div>
										<div className='col-md-5'>
											<div className='card mb-4'>
												<h1 className='mt-6 ms-8'>Users</h1>
												<div className='py-4 card-body'>
													<div className='table-responsive'>
														<table
															id='kt_table_users'
															className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer table-row-gray-300'>
															<thead>
																<tr className='fw-bold text-muted bg-light border-bottom-0'>
																	<th className='ps-4 rounded-start'>No.</th>
																	<th>Status</th>
																	<th>Count</th>
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
																	userStats.map((item: any, index: number) => {
																		const actualIndex =
																			(pagination.page - 1) * pagination.itemsPerPage + index + 1
																		return (
																			<tr key={index}>
																				<td>
																					<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																						{actualIndex}
																					</span>
																				</td>
																				<td>
																					<span className='text-dark fw-bold  fs-6'>
																						{item.status.toUpperCase()}
																					</span>
																				</td>
																				<td>
																					<span className='text-dark fw-bold  d-block mb-1 fs-6'>
																						{item.count}
																					</span>
																				</td>
																			</tr>
																		)
																	})
																)}
															</tbody>
														</table>
													</div>
													{userStats.length === 0 && !loading && (
														<div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
															<b>No records found</b>
														</div>
													)}
													{userStats.length > 0 && (
														<UsersListPagination
															totalPages={Math.ceil(userStats.length / pagination3.itemsPerPage)}
															currentPage={pagination3.page}
															onPageChange={handlePageChange3}
														/>
													)}
												</div>
											</div>
										</div>
									</div>
								</>
							) : (
								''
							)}
						</div>
					</div>
				</KTCard>
			</div>
		</>
	)
}

export default MasterReports

// startDate = new Date(0)
// endDate = new Date()
