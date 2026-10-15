import { useEffect, useState } from 'react'
import { Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetExpenseReports } from '../../../Functions/FGGroup'

export default function EmployeeExpenseView() {
	const [expenseReport, setExpenseReport] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const reportId = queryParams.get('id')

	const fetchExpenseReportDetails = async () => {
		try {
			if (!reportId) return

			// Get employee ID from localStorage safely
			const fgGroupInfo =
				localStorage.getItem('fg_group_user_info') ||
				localStorage.getItem('fg_group_info') ||
				localStorage.getItem('auth_fg_group')
			let employeeId = null
			if (fgGroupInfo) {
				try {
					const parsedInfo = JSON.parse(fgGroupInfo)
					employeeId = parsedInfo._id || parsedInfo.employee_id
				} catch (e) {
					console.error(e)
				}
			}

			if (!employeeId) {
				console.error('Employee ID not found')
				toast.error('Authentication error: Employee ID not found')
				setLoading(false)
				return
			}

			// Fetch the expense report, filtering by both report ID and employee ID for security
			const response = await GetExpenseReports({
				id: reportId,
				employee_id: employeeId,
			})

			if (response.data && response.data.length > 0) {
				setExpenseReport(response.data[0])
			} else {
				toast.error('Expense report not found or access denied')
				navigate('/employee/expenses-list')
			}
		} catch (error) {
			console.error('Error fetching expense report details:', error)
			toast.error('Error fetching report details')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchExpenseReportDetails()
	}, [reportId])

	const handleEdit = () => {
		if (expenseReport?.status === 'Pending') {
			navigate(`/employee/expense-edit?id=${reportId}`)
		} else {
			toast.error('Only pending reports can be edited')
		}
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'Approved':
				return <span className='badge badge-light-success px-3 py-2 fs-7 fw-semibold'>Approved</span>
			case 'Rejected':
				return <span className='badge badge-light-danger px-3 py-2 fs-7 fw-semibold'>Rejected</span>
			case 'Pending':
				return <span className='badge badge-light-warning px-3 py-2 fs-7 fw-semibold'>Pending Review</span>
			default:
				return <span className='badge badge-light-secondary px-3 py-2 fs-7 fw-semibold'>{status || 'Pending'}</span>
		}
	}

	if (loading) {
		return (
			<div className='d-flex align-items-center justify-content-center py-20'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!expenseReport) {
		return (
			<div className='card shadow-sm border-0 p-10 text-center' style={{ borderRadius: '14px' }}>
				<h4 className='text-gray-800 mb-2'>Report not found</h4>
				<button className='btn btn-sm btn-primary mx-auto mt-3' onClick={() => navigate('/employee/expenses-list')}>
					Back to Expense Reports
				</button>
			</div>
		)
	}

	const ShowDocument = (document: string) => {
		const downloadUrl = `${document}`
		window.open(downloadUrl)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Expense Report Details</PageTitle>

			<div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
				{/* Modern Header */}
				<div className='card-header border-0 pt-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
					<div className='d-flex align-items-center gap-3'>
						<button
							type='button'
							className='btn btn-sm btn-light d-flex align-items-center gap-2'
							style={{ borderRadius: '8px' }}
							onClick={() => navigate('/employee/expenses-list')}>
							<i className='bi bi-arrow-left fs-6'></i>
							<span>Back</span>
						</button>
						<div>
							<div className='d-flex align-items-center gap-2'>
								<h2 className='fw-bolder text-gray-900 mb-0'>{expenseReport.purpose || 'Expense Details'}</h2>
								{getStatusBadge(expenseReport.status)}
							</div>
							<span className='text-muted fs-7'>
								Submitted on {DayJS(expenseReport?.createdAt).format('DD MMMM YYYY, hh:mm A')}
							</span>
						</div>
					</div>

					<div className='d-flex align-items-center gap-2'>
						{expenseReport.status === 'Pending' && (
							<button
								type='button'
								className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-4'
								style={{ height: '38px', borderRadius: '10px' }}
								onClick={handleEdit}>
								<i className='bi bi-pencil fs-6'></i>
								<span>Edit Report</span>
							</button>
						)}
					</div>
				</div>

				<div className='card-body pt-4'>
					{/* Rejection Alert */}
					{expenseReport.status === 'Rejected' && expenseReport.rejected_reason && (
						<div className='alert alert-danger d-flex align-items-start gap-3 p-4 mb-6 rounded-3'>
							<i className='bi bi-exclamation-octagon-fill fs-3 text-danger mt-1'></i>
							<div>
								<h5 className='text-danger fw-bolder mb-1'>Expense Report Rejected</h5>
								<div className='text-danger fs-7'>{expenseReport.rejected_reason}</div>
							</div>
						</div>
					)}

					{/* Top Summary Grid */}
					<div className='row g-4 mb-6'>
						<div className='col-12 col-md-4'>
							<div className='p-4 rounded-3 border bg-light h-100'>
								<span className='text-muted fs-7 fw-semibold d-block mb-1'>Purpose / Title</span>
								<span className='fw-bold text-gray-900 fs-6'>{expenseReport.purpose}</span>
							</div>
						</div>
						<div className='col-12 col-md-4'>
							<div className='p-4 rounded-3 border bg-light h-100'>
								<span className='text-muted fs-7 fw-semibold d-block mb-1'>Total Claim Amount</span>
								<span className='fw-bolder text-primary fs-3'>
									₹{Number(expenseReport.total_amount || 0).toLocaleString('en-IN', {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						</div>
						<div className='col-12 col-md-4'>
							<div className='p-4 rounded-3 border bg-light h-100'>
								<span className='text-muted fs-7 fw-semibold d-block mb-1'>Submission Status</span>
								<div className='mt-1'>{getStatusBadge(expenseReport.status)}</div>
							</div>
						</div>
					</div>

					{/* Remarks Section */}
					{expenseReport.remarks && (
						<div className='mb-6 p-4 rounded-3 border' style={{ background: '#fafafb' }}>
							<label className='form-label fs-7 fw-bold text-gray-700 mb-1'>Employee Remarks / Notes</label>
							<div className='text-gray-800 fs-6'>{expenseReport.remarks}</div>
						</div>
					)}

					{/* Expenses Breakdown Table */}
					<div className='mb-6'>
						<div className='d-flex align-items-center justify-content-between mb-3'>
							<h4 className='fw-bolder text-gray-900 mb-0'>Itemized Expense Breakdown</h4>
							<span className='text-muted fs-7'>
								{expenseReport.expenses?.length || 0} line items
							</span>
						</div>

						<div className='table-responsive border rounded-3'>
							<table className='table table-row-dashed table-row-gray-200 align-middle gs-4 gy-3 mb-0'>
								<thead style={{ background: '#f8fafc' }}>
									<tr className='fw-bolder text-gray-700 fs-7 text-uppercase'>
										<th style={{ width: '60px' }}>#</th>
										<th>Expense Type</th>
										<th>Description / Memo</th>
										<th className='text-end'>Amount (₹)</th>
									</tr>
								</thead>
								<tbody>
									{expenseReport.expenses && expenseReport.expenses.length > 0 ? (
										expenseReport.expenses.map((expense: any, index: number) => (
											<tr key={index}>
												<td className='text-muted fw-bold'>{index + 1}</td>
												<td>
													<span className='badge badge-light-primary fw-bold fs-7'>
														{expense.type}
													</span>
												</td>
												<td>
													<span className='text-gray-800 fw-semibold fs-6'>
														{expense.description || '-'}
													</span>
												</td>
												<td className='text-end fw-bolder text-gray-900 fs-6'>
													₹{Number(expense.amount || 0).toLocaleString('en-IN', {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={4} className='text-center py-4 text-muted'>
												No expense items recorded
											</td>
										</tr>
									)}
								</tbody>
								<tfoot style={{ background: '#f8fafc' }}>
									<tr className='fw-bolder text-gray-900 fs-6'>
										<th colSpan={3} className='text-end'>Total Claimed:</th>
										<th className='text-end text-primary fs-5'>
											₹{Number(expenseReport.total_amount || 0).toLocaleString('en-IN', {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</th>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>

					{/* Expense Attachments / Receipts */}
					<div className='mb-4'>
						<h4 className='fw-bolder text-gray-900 mb-3'>Supporting Receipts & Attachments</h4>
						{expenseReport.expenses && expenseReport.expenses.some((e: any) => e.file_url) ? (
							<div className='row g-4'>
								{expenseReport.expenses.map((expense: any, expenseIndex: number) =>
									expense.file_url ? (
										<div key={`expense-${expenseIndex}`} className='col-12 col-md-6 col-lg-4'>
											<div className='border rounded-3 p-3 h-100 bg-white shadow-xs'>
												<div className='d-flex align-items-center justify-content-between mb-2'>
													<span className='fw-bold text-gray-900 fs-7'>{expense.type} Receipt</span>
													<span className='text-primary fw-bolder fs-7'>
														₹{Number(expense.amount || 0).toLocaleString('en-IN', {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</span>
												</div>
												<div className='rounded overflow-hidden border p-2' style={{ background: '#f8fafc' }}>
													{expense.file_url.endsWith('.pdf') ? (
														<div className='d-flex flex-column align-items-center py-4'>
															<i className='bi bi-file-earmark-pdf fs-1 text-danger mb-2'></i>
															<a
																href={expense.file_url}
																target='_blank'
																rel='noopener noreferrer'
																className='btn btn-sm btn-light-primary d-flex align-items-center gap-1 mt-2'>
																<i className='bi bi-box-arrow-up-right fs-7'></i>
																<span>View PDF Document</span>
															</a>
														</div>
													) : (
														<div className='text-center'>
															<img
																onClick={() => ShowDocument(expense.file_url)}
																src={expense.file_url}
																alt={`Receipt for ${expense.type}`}
																style={{
																	width: '100%',
																	height: '180px',
																	objectFit: 'cover',
																	cursor: 'pointer',
																}}
																className='rounded'
															/>
															<button
																type='button'
																onClick={() => ShowDocument(expense.file_url)}
																className='btn btn-sm btn-light w-100 mt-2 d-flex align-items-center justify-content-center gap-1'>
																<i className='bi bi-zoom-in fs-7'></i>
																<span>Open Receipt</span>
															</button>
														</div>
													)}
												</div>
											</div>
										</div>
									) : null
								)}
							</div>
						) : (
							<div className='p-6 text-center rounded-3 border bg-light text-muted'>
								No receipts or attachments uploaded with this expense claim.
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
