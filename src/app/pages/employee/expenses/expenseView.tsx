import { useEffect, useState } from 'react'
import { Form } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
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

			// Get employee ID from localStorage to ensure employee can only view their own reports
			const fgGroupInfo = localStorage.getItem('fg_group_info')
			let employeeId = null
			if (fgGroupInfo) {
				const parsedInfo = JSON.parse(fgGroupInfo)
				employeeId = parsedInfo._id
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
		// Only allow editing if status is Pending
		if (expenseReport.status === 'Pending') {
			navigate(`/employee/expense-edit?id=${reportId}`)
		} else {
			toast.error('Only pending reports can be edited')
		}
	}

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'Approved':
				return 'inputfield-bg text-success'
			case 'Rejected':
				return 'inputfield-bg text-danger'
			case 'Pending':
				return 'inputfield-bg text-warning'
			default:
				return 'inputfield-bg text-secondary'
		}
	}

	if (loading) {
		return <div>Loading...</div>
	}

	if (!expenseReport) {
		return <div>Report not found</div>
	}

	const ShowDocument = (document: string) => {
		const downloadUrl = `${document}`
		window.open(downloadUrl)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Expense Report Details</PageTitle>
			<KTCard>
				<div className='card-header border-0 pt-6'>
					<div className='card-title'>
						<h2>Expense Report Details</h2>
					</div>
					<div className='card-toolbar'>
						{expenseReport.status === 'Pending' && (
							<button
								type='button'
								className='btn btn-primary'
								onClick={handleEdit}>
								<i className='fas fa-edit me-2'></i>
								Edit Report
							</button>
						)}
					</div>
				</div>
				<div className='card-body'>
					<div className='row mb-4'>
						<div className='col-md-12'>
							<div className='row'>
								<div className='col-md-12'>
									<Form.Group className='mb-3'>
										<Form.Label>Purpose</Form.Label>
										<Form.Control
											type='text'
											value={expenseReport.purpose}
											className='inputfield-bg'
											readOnly
										/>
									</Form.Group>
								</div>
								<div className='col-md-6'>
									<Form.Group className='mb-3'>
										<Form.Label>Created Date</Form.Label>
										<Form.Control
											type='text'
											value={DayJS(expenseReport?.createdAt).format('DD/MM/YYYY')}
											className='inputfield-bg'
											readOnly
										/>
									</Form.Group>
								</div>
								<div className='col-md-6'>
									<Form.Group className='mb-3'>
										<Form.Label>Status</Form.Label>
										<Form.Control
											type='text'
											value={expenseReport.status || 'Pending'}
											className={getStatusBadgeClass(expenseReport.status || 'Pending')}
											readOnly
										/>
									</Form.Group>
								</div>
								<div className='col-md-6'>
									<Form.Group className='mb-3'>
										<Form.Label>Total Amount</Form.Label>
										<Form.Control
											type='text'
											value={`₹${expenseReport.total_amount?.toFixed(2) || '0.00'}`}
											className='inputfield-bg'
											readOnly
										/>
									</Form.Group>
								</div>
							</div>
						</div>

						<div className='col-md-12'>
							<Form.Group className='mb-3'>
								<Form.Label>Remarks</Form.Label>
								<Form.Control
									as='textarea'
									rows={3}
									value={expenseReport?.remarks || 'No remarks provided'}
									readOnly
								/>
							</Form.Group>
						</div>

						{/* Expenses List */}
						<div className='col-md-12'>
							<h4 className='mb-3'>Expenses</h4>
							<div className='table-responsive'>
								<table className='table table-bordered'>
									<thead>
										<tr>
											<th>Type</th>
											<th>Description</th>
											<th>Amount</th>
										</tr>
									</thead>
									<tbody>
										{expenseReport.expenses &&
											expenseReport.expenses.map((expense: any, index: number) => (
												<tr key={index}>
													<td>{expense.type}</td>
													<td>{expense.description || '-'}</td>
													<td>₹{expense.amount?.toFixed(2) || '0.00'}</td>
												</tr>
											))}
									</tbody>
									<tfoot>
										<tr>
											<th
												colSpan={2}
												className='text-end'>
												Total Amount:
											</th>
											<th>₹{expenseReport.total_amount?.toFixed(2) || '0.00'}</th>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					</div>

					{/* Expense Attachments - Display file URLs at the expense level */}
					<div className='row mb-4'>
						<div className='col-md-12'>
							<h4 className='mb-3'>Expense Attachments</h4>
							{expenseReport.expenses && expenseReport.expenses.length > 0 ? (
								<div className='row'>
									{expenseReport.expenses.map((expense: any, expenseIndex: number) =>
										expense.file_url ? (
											<div
												key={`expense-${expenseIndex}`}
												className='col-md-4 mb-4'>
												<div className='border rounded-2 p-3 h-100'>
													<h5 className='mb-3'>
														Expense: {expense.type} - ₹{expense.amount?.toFixed(2) || '0.00'}
													</h5>
													<div className='d-flex flex-wrap gap-3 justify-content-start'>
														<div className='file-preview border rounded p-2'>
															{expense.file_url.endsWith('.pdf') ? (
																<div className='d-flex flex-column align-items-center'>
																	<embed
																		src={expense.file_url}
																		width={'100%'}
																		height={'200px'}
																	/>
																	<a
																		href={expense.file_url}
																		target='_blank'
																		rel='noopener noreferrer'
																		className='mt-2 px-3 py-1 btn btn-light-warning'>
																		View PDF
																	</a>
																</div>
															) : (
																<div className='text-center'>
																	<img
																		onClick={() => ShowDocument(expense.file_url)}
																		src={expense.file_url}
																		alt={`File for ${expense.type}`}
																		style={{
																			width: '100%',
																			height: '200px',
																			objectFit: 'cover',
																			cursor: 'pointer',
																		}}
																		className='mb-2 rounded'
																	/>
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
										) : null
									)}
								</div>
							) : (
								<p className='text-muted'>No attachments available for this expense report.</p>
							)}
						</div>
					</div>
					<div>
						{/* Rejection Reason (if rejected) */}
						{expenseReport.status === 'Rejected' && expenseReport.rejected_reason && (
							<div className='col-md-12 mt-4'>
								<Form.Group className='mb-3'>
									<Form.Label>Rejection Reason</Form.Label>
									<Form.Control
										as='textarea'
										rows={3}
										value={expenseReport.rejected_reason}
										readOnly
										className='bg-light-danger'
									/>
								</Form.Group>
							</div>
						)}
					</div>
				</div>
			</KTCard>
		</>
	)
}
