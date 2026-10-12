import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { ActionExpenseReport, GetExpenseReports } from '../../../Functions/FGGroup/ExpenseReport'

export default function ExpenseView() {
	const [expenseReport, setExpenseReport] = useState<any>(null)
	const [employeeName, setEmployeeName] = useState<string>('')
	const [loading, setLoading] = useState(true)
	const [showActionModal, setShowActionModal] = useState(false)
	const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved')
	const [rejectReason, setRejectReason] = useState('')
	const location = useLocation()
	const navigate = useNavigate()
	const queryParams = new URLSearchParams(location.search)
	const reportId = queryParams.get('id')

	const fetchExpenseReportDetails = async () => {
		try {
			if (!reportId) return
			const response = await GetExpenseReports({
				id: reportId,
			})
			if (response.data && response.data.length > 0) {
				setExpenseReport(response.data[0])
				// Fetch employee name
				await fetchEmployeeName(response.data[0].employee_id)
			}
		} catch (error) {
			console.error('Error fetching expense report details:', error)
			toast.error('Error fetching report details')
		} finally {
			setLoading(false)
		}
	}

	const fetchEmployeeName = async (employeeId: string) => {
		try {
			const response = await GetEmployees({ id: employeeId })
			if (response.data && response.data.length > 0) {
				setEmployeeName(response.data[0].full_name)
			}
		} catch (error) {
			console.error('Error fetching employee details:', error)
		}
	}

	useEffect(() => {
		fetchExpenseReportDetails()
	}, [reportId])

	const handleApprove = () => {
		setActionType('Approved')
		setShowActionModal(true)
	}

	const handleReject = () => {
		setActionType('Rejected')
		setShowActionModal(true)
	}

	const handleActionSubmit = async () => {
		if (actionType === 'Rejected' && !rejectReason.trim()) {
			toast.error('Rejection reason is required')
			return
		}

		try {
			const response = await ActionExpenseReport({
				id: reportId!,
				action: actionType,
				rejected_reason: actionType === 'Rejected' ? rejectReason : undefined,
			})

			if (response.status === 200) {
				toast.success(`Expense report ${actionType.toLowerCase()} successfully`)
				setShowActionModal(false)
				setRejectReason('')
				// Refresh the report data
				fetchExpenseReportDetails()
			} else {
				toast.error(response.message || `Failed to ${actionType.toLowerCase()} expense report`)
			}
		} catch (error) {
			console.error(`Error ${actionType.toLowerCase()} expense report:`, error)
			toast.error(`Error ${actionType.toLowerCase()} expense report`)
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
				<div className='card-body'>
					<div className='row mb-4'>
						<div className='col-md-12'>
							<div className='row'>
								<div className='col-md-6'>
									<Form.Group className='mb-3'>
										<Form.Label>Employee Name</Form.Label>
										<Form.Control
											type='text'
											value={employeeName || 'Unknown Employee'}
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

						{/* Report Attachments - Display file URLs at the expense level */}
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
							{/* Action Buttons (only for pending reports) */}
							{expenseReport.status === 'Pending' && (
								<div className='col-md-12 mt-4'>
									<div className='d-flex gap-3'>
										<Button
											variant='success'
											onClick={handleApprove}>
											Approve
										</Button>
										<Button
											variant='danger'
											onClick={handleReject}>
											Reject
										</Button>
									</div>
								</div>
							)}

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
				</div>
			</KTCard>

			{/* Action Modal */}
			<Modal
				show={showActionModal}
				onHide={() => setShowActionModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>{actionType} Expense Report</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{actionType === 'Rejected' ? (
						<Form.Group>
							<Form.Label>Rejection Reason</Form.Label>
							<Form.Control
								as='textarea'
								rows={3}
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								placeholder='Enter reason for rejection'
							/>
						</Form.Group>
					) : (
						<p>Are you sure you want to approve this expense report?</p>
					)}
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant='secondary'
						onClick={() => setShowActionModal(false)}>
						Cancel
					</Button>
					<Button
						variant={actionType === 'Approved' ? 'success' : 'danger'}
						onClick={handleActionSubmit}>
						{actionType}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
