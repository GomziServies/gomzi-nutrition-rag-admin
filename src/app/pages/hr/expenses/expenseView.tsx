import React, { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
				return 'badge badge-light-success text-success fw-bold px-3 py-1.5 fs-7'
			case 'Rejected':
				return 'badge badge-light-danger text-danger fw-bold px-3 py-1.5 fs-7'
			case 'Pending':
				return 'badge badge-light-warning text-warning fw-bold px-3 py-1.5 fs-7'
			default:
				return 'badge badge-light-secondary text-dark fw-bold px-3 py-1.5 fs-7'
		}
	}

	if (loading) {
		return (
			<div className='d-flex justify-content-center align-items-center py-20'>
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!expenseReport) {
		return (
			<div className='card shadow-sm border-0 p-10 text-center' style={{borderRadius: '14px'}}>
				<i className='bi bi-exclamation-circle text-muted fs-2x mb-3'></i>
				<h4 className='text-gray-800 fw-bold'>Expense Report Not Found</h4>
				<p className='text-muted fs-6'>The requested expense report could not be loaded or may have been removed.</p>
				<div>
					<Link to='/hr/expenses-list' className='btn btn-primary btn-sm mt-3'>
						<i className='bi bi-arrow-left me-2'></i> Back to Expense Reports
					</Link>
				</div>
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

			{/* Top Action Bar with Back Link */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<Link
					to='/hr/expenses-list'
					className='btn btn-sm d-inline-flex align-items-center gap-2'
					style={{
						background: '#ffffff',
						border: '1px solid #D8DFE7',
						borderRadius: '10px',
						color: '#142447',
						padding: '8px 16px',
						boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
						fontWeight: 600,
						transition: 'all 0.2s ease',
					}}>
					<i className='bi bi-arrow-left fs-6 text-primary'></i>
					<span>Back to Expense Reports</span>
				</Link>

				{expenseReport.status === 'Pending' && (
					<div className='d-flex align-items-center gap-2'>
						<Button
							variant='success'
							size='sm'
							className='d-inline-flex align-items-center gap-2 fw-semibold px-4 py-2'
							style={{borderRadius: '8px'}}
							onClick={handleApprove}>
							<i className='bi bi-check-circle-fill fs-6 text-white'></i>
							Approve Report
						</Button>
						<Button
							variant='danger'
							size='sm'
							className='d-inline-flex align-items-center gap-2 fw-semibold px-4 py-2'
							style={{borderRadius: '8px'}}
							onClick={handleReject}>
							<i className='bi bi-x-circle-fill fs-6 text-white'></i>
							Reject Report
						</Button>
					</div>
				)}
			</div>

			{/* Header Banner Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
					boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
				}}>
				<div className='card-body p-6'>
					<div className='d-flex flex-wrap align-items-center justify-content-between gap-4'>
						<div className='d-flex align-items-center gap-4'>
							<div
								className='d-flex align-items-center justify-content-center flex-shrink-0'
								style={{
									width: '56px',
									height: '56px',
									background: 'linear-gradient(135deg, #142447 0%, #1e3a6d 100%)',
									borderRadius: '12px',
									boxShadow: '0 4px 12px rgba(20, 36, 71, 0.18)',
								}}>
								<i className='bi bi-receipt text-white fs-2'></i>
							</div>
							<div>
								<div className='d-flex align-items-center gap-3 flex-wrap mb-1'>
									<h2 className='text-gray-900 fw-bolder mb-0 fs-3'>
										{expenseReport.purpose || 'Expense Report'}
									</h2>
									<span className={getStatusBadgeClass(expenseReport.status || 'Pending')}>
										{expenseReport.status || 'Pending'}
									</span>
								</div>
								<div className='d-flex align-items-center gap-3 text-muted fs-7 flex-wrap'>
									<span>
										<i className='bi bi-person me-1 text-primary'></i>
										Submitted by <strong className='text-gray-800'>{employeeName || 'Unknown Employee'}</strong>
									</span>
									<span>•</span>
									<span>
										<i className='bi bi-calendar3 me-1 text-primary'></i>
										{DayJS(expenseReport?.createdAt).format('DD MMM YYYY, hh:mm A')}
									</span>
								</div>
							</div>
						</div>
						<div className='text-sm-end'>
							<div className='text-muted fs-8 text-uppercase fw-bolder tracking-wider'>
								Total Reimbursable Amount
							</div>
							<div
								className='fw-bolder fs-2hx'
								style={{color: '#142447', letterSpacing: '-0.5px'}}>
								₹{expenseReport.total_amount?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Rejection Alert (if rejected) */}
			{expenseReport.status === 'Rejected' && expenseReport.rejected_reason && (
				<div
					className='alert d-flex align-items-center p-5 mb-6'
					style={{
						background: '#FEF2F2',
						border: '1px solid #FCA5A5',
						borderRadius: '12px',
					}}>
					<i className='bi bi-exclamation-octagon-fill fs-2hx text-danger me-4'></i>
					<div className='d-flex flex-column'>
						<h5 className='mb-1 text-danger fw-bolder'>Report Rejected</h5>
						<span className='text-gray-700 fs-6'>{expenseReport.rejected_reason}</span>
					</div>
				</div>
			)}

			{/* Key Metrics Summary Cards */}
			<div className='row g-4 mb-6'>
				<div className='col-sm-6 col-xl-3'>
					<div
						className='card h-100 shadow-sm border-0'
						style={{
							borderRadius: '12px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
						}}>
						<div className='card-body p-5'>
							<div className='d-flex align-items-center gap-3'>
								<div
									className='d-flex align-items-center justify-content-center'
									style={{
										width: '44px',
										height: '44px',
										borderRadius: '10px',
										background: '#EFF6FF',
										color: '#1E40AF',
									}}>
									<i className='bi bi-person-badge fs-3'></i>
								</div>
								<div>
									<div className='text-muted fs-8 fw-semibold text-uppercase'>Employee</div>
									<div className='text-gray-900 fw-bold fs-6 text-truncate' style={{maxWidth: '180px'}}>
										{employeeName || 'Unknown Employee'}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div
						className='card h-100 shadow-sm border-0'
						style={{
							borderRadius: '12px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
						}}>
						<div className='card-body p-5'>
							<div className='d-flex align-items-center gap-3'>
								<div
									className='d-flex align-items-center justify-content-center'
									style={{
										width: '44px',
										height: '44px',
										borderRadius: '10px',
										background: '#F0FDF4',
										color: '#166534',
									}}>
									<i className='bi bi-calendar-check fs-3'></i>
								</div>
								<div>
									<div className='text-muted fs-8 fw-semibold text-uppercase'>Submitted Date</div>
									<div className='text-gray-900 fw-bold fs-6'>
										{DayJS(expenseReport?.createdAt).format('DD/MM/YYYY')}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div
						className='card h-100 shadow-sm border-0'
						style={{
							borderRadius: '12px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
						}}>
						<div className='card-body p-5'>
							<div className='d-flex align-items-center gap-3'>
								<div
									className='d-flex align-items-center justify-content-center'
									style={{
										width: '44px',
										height: '44px',
										borderRadius: '10px',
										background: '#FAF5FF',
										color: '#6B21A8',
									}}>
									<i className='bi bi-list-check fs-3'></i>
								</div>
								<div>
									<div className='text-muted fs-8 fw-semibold text-uppercase'>Total Line Items</div>
									<div className='text-gray-900 fw-bold fs-6'>
										{expenseReport.expenses?.length || 0} Items
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className='col-sm-6 col-xl-3'>
					<div
						className='card h-100 shadow-sm border-0'
						style={{
							borderRadius: '12px',
							border: '1px solid #E4EAF2',
							background: '#ffffff',
						}}>
						<div className='card-body p-5'>
							<div className='d-flex align-items-center gap-3'>
								<div
									className='d-flex align-items-center justify-content-center'
									style={{
										width: '44px',
										height: '44px',
										borderRadius: '10px',
										background: '#FFFBEB',
										color: '#B45309',
									}}>
									<i className='bi bi-shield-check fs-3'></i>
								</div>
								<div>
									<div className='text-muted fs-8 fw-semibold text-uppercase'>Current Status</div>
									<div>
										<span className={getStatusBadgeClass(expenseReport.status || 'Pending')}>
											{expenseReport.status || 'Pending'}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Purpose and Remarks Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
				}}>
				<div className='card-header border-0 pt-6 px-6 pb-2 d-flex align-items-center gap-3'>
					<div
						className='d-flex align-items-center justify-content-center'
						style={{
							width: '36px',
							height: '36px',
							borderRadius: '8px',
							background: '#EEF2F6',
							color: '#142447',
						}}>
						<i className='bi bi-info-circle fs-5'></i>
					</div>
					<h3 className='card-title fw-bolder text-gray-800 fs-5 mb-0'>
						Report Purpose & Remarks
					</h3>
				</div>
				<div className='card-body px-6 py-4'>
					<div className='row g-4'>
						<div className='col-md-6'>
							<label className='form-label text-muted fs-7 fw-semibold text-uppercase'>
								Expense Purpose
							</label>
							<div
								className='p-3 rounded-2 fw-medium text-gray-800'
								style={{background: '#F8FAFC', border: '1px solid #E2E8F0'}}>
								{expenseReport.purpose || 'No purpose specified'}
							</div>
						</div>
						<div className='col-md-6'>
							<label className='form-label text-muted fs-7 fw-semibold text-uppercase'>
								Employee Remarks / Notes
							</label>
							<div
								className='p-3 rounded-2 fw-medium text-gray-800'
								style={{
									background: '#F8FAFC',
									border: '1px solid #E2E8F0',
									minHeight: '44px',
								}}>
								{expenseReport?.remarks || (
									<span className='text-muted fst-italic'>No additional remarks provided.</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Itemized Expenses Table Card */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
				}}>
				<div className='card-header border-0 pt-6 px-6 pb-3 d-flex align-items-center justify-content-between flex-wrap gap-2'>
					<div className='d-flex align-items-center gap-3'>
						<div
							className='d-flex align-items-center justify-content-center'
							style={{
								width: '36px',
								height: '36px',
								borderRadius: '8px',
								background: '#EEF2F6',
								color: '#142447',
							}}>
							<i className='bi bi-table fs-5'></i>
						</div>
						<h3 className='card-title fw-bolder text-gray-800 fs-5 mb-0'>
							Itemized Expense Breakdown
						</h3>
					</div>
					<span className='badge badge-light-primary fw-bold px-3 py-1.5 fs-7'>
						{expenseReport.expenses?.length || 0} Line Items
					</span>
				</div>
				<div className='card-body px-6 py-0 pb-6'>
					<div className='table-responsive rounded-3' style={{border: '1px solid #E4EAF2'}}>
						<table className='table align-middle gs-0 gy-4 mb-0'>
							<thead>
								<tr
									style={{
										background: '#F8FAFD',
										color: '#71809A',
										fontSize: '12px',
										fontWeight: 650,
										textTransform: 'uppercase',
										letterSpacing: '0.02em',
										borderBottom: '1px solid #E4EAF2',
									}}>
									<th className='ps-5 py-4 fw-bold' style={{width: '60px', color: '#71809A'}}>#</th>
									<th className='py-4 fw-bold' style={{color: '#71809A'}}>Expense Type</th>
									<th className='py-4 fw-bold' style={{color: '#71809A'}}>Description</th>
									<th className='text-end pe-5 py-4 fw-bold' style={{width: '160px', color: '#71809A'}}>Amount</th>
								</tr>
							</thead>
							<tbody>
								{expenseReport.expenses && expenseReport.expenses.length > 0 ? (
									expenseReport.expenses.map((expense: any, index: number) => (
										<tr
											key={index}
											style={{
												borderBottom: '1px solid #F1F5F9',
												background: index % 2 === 0 ? '#FFFFFF' : '#FAFCFF',
											}}>
											<td className='ps-5 text-muted fw-semibold'>{index + 1}</td>
											<td>
												<span
													className='badge fw-bold px-3 py-1.5'
													style={{
														background: '#EEF2F6',
														color: '#142447',
														fontSize: '0.8rem',
													}}>
													{expense.type}
												</span>
											</td>
											<td className='text-gray-800 fw-medium'>
												{expense.description || (
													<span className='text-muted fst-italic'>No description</span>
												)}
											</td>
											<td className='text-end pe-5 fw-bold text-gray-900 fs-6'>
												₹{expense.amount?.toFixed(2) || '0.00'}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={4} className='text-center py-6 text-muted'>
											No expense line items found.
										</td>
									</tr>
								)}
							</tbody>
							<tfoot>
								<tr style={{background: '#F8FAFC', borderTop: '2px solid #E2E8F0'}}>
									<th colSpan={3} className='text-end pe-4 py-4 fw-bolder text-gray-800 fs-6'>
										Grand Total:
									</th>
									<th
										className='text-end pe-5 py-4 fw-bolder fs-5'
										style={{color: '#142447'}}>
										₹{expenseReport.total_amount?.toFixed(2) || '0.00'}
									</th>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>
			</div>

			{/* Report Attachments Gallery */}
			<div
				className='card shadow-sm border-0 mb-6'
				style={{
					borderRadius: '14px',
					border: '1px solid #E4EAF2',
					background: '#ffffff',
				}}>
				<div className='card-header border-0 pt-6 px-6 pb-2 d-flex align-items-center gap-3'>
					<div
						className='d-flex align-items-center justify-content-center'
						style={{
							width: '36px',
							height: '36px',
							borderRadius: '8px',
							background: '#EEF2F6',
							color: '#142447',
						}}>
						<i className='bi bi-paperclip fs-5'></i>
					</div>
					<h3 className='card-title fw-bolder text-gray-800 fs-5 mb-0'>
						Expense Receipts & Attachments
					</h3>
				</div>
				<div className='card-body px-6 py-4'>
					{expenseReport.expenses && expenseReport.expenses.some((e: any) => e.file_url) ? (
						<div className='row g-4'>
							{expenseReport.expenses.map((expense: any, expenseIndex: number) =>
								expense.file_url ? (
									<div
										key={`expense-${expenseIndex}`}
										className='col-md-6 col-lg-4'>
										<div
											className='h-100 p-4 rounded-3 d-flex flex-column justify-content-between'
											style={{
												border: '1px solid #E4EAF2',
												background: '#FAFCFF',
												transition: 'all 0.2s ease',
											}}>
											<div>
												<div className='d-flex align-items-center justify-content-between mb-3'>
													<span
														className='badge fw-bold px-2.5 py-1'
														style={{background: '#142447', color: '#fff', fontSize: '0.75rem'}}>
														{expense.type}
													</span>
													<span className='fw-bolder text-gray-800'>
														₹{expense.amount?.toFixed(2) || '0.00'}
													</span>
												</div>
												<div
													className='rounded-2 overflow-hidden mb-3 text-center'
													style={{
														background: '#ffffff',
														border: '1px solid #E2E8F0',
														minHeight: '180px',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}>
													{expense.file_url.endsWith('.pdf') ? (
														<div className='p-4 text-center'>
															<i className='bi bi-file-earmark-pdf text-danger fs-2hx mb-2 d-block'></i>
															<div className='fw-semibold text-gray-700 fs-7'>PDF Receipt Document</div>
														</div>
													) : (
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
														/>
													)}
												</div>
											</div>
											<div className='mt-2'>
												<a
													href={expense.file_url}
													target='_blank'
													rel='noopener noreferrer'
													className='btn btn-light-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2 fw-semibold'>
													<i className='bi bi-box-arrow-up-right fs-7'></i>
													{expense.file_url.endsWith('.pdf') ? 'View PDF File' : 'Open Full Image'}
												</a>
											</div>
										</div>
									</div>
								) : null
							)}
						</div>
					) : (
						<div
							className='text-center py-10 px-4 rounded-3'
							style={{background: '#F8FAFC', border: '1px dashed #CBD5E1'}}>
							<i className='bi bi-file-earmark-x text-muted fs-2x mb-2 d-block'></i>
							<div className='text-gray-700 fw-bold fs-6'>No Attachments Provided</div>
							<div className='text-muted fs-7'>
								No receipts or proof documents were attached to this expense report.
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Action Modal */}
			<Modal
				show={showActionModal}
				onHide={() => setShowActionModal(false)}
				backdrop={true}
				centered>
				<Modal.Header
					closeButton
					style={{
						background: '#142447',
						color: '#ffffff',
						borderTopLeftRadius: '12px',
						borderTopRightRadius: '12px',
					}}>
					<Modal.Title className='text-white fs-5 fw-bolder d-flex align-items-center gap-2'>
						<i
							className={`bi ${
								actionType === 'Approved' ? 'bi-check2-circle text-success' : 'bi-x-circle text-danger'
							} fs-4`}></i>
						{actionType} Expense Report
					</Modal.Title>
				</Modal.Header>
				<Modal.Body className='p-6'>
					{actionType === 'Rejected' ? (
						<Form.Group>
							<Form.Label className='fw-bold text-gray-800 mb-2'>
								Rejection Reason <span className='text-danger'>*</span>
							</Form.Label>
							<Form.Control
								as='textarea'
								rows={4}
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								placeholder='Please explain clearly why this expense report is being rejected...'
								style={{borderRadius: '8px', border: '1px solid #D8DFE7'}}
							/>
						</Form.Group>
					) : (
						<div className='text-center py-3'>
							<div
								className='d-inline-flex align-items-center justify-content-center mb-3'
								style={{
									width: '56px',
									height: '56px',
									borderRadius: '50%',
									background: '#ECFDF5',
									color: '#059669',
								}}>
								<i className='bi bi-check-lg fs-1'></i>
							</div>
							<h4 className='fw-bolder text-gray-900 mb-2'>Confirm Approval</h4>
							<p className='text-muted fs-6 mb-0'>
								Are you sure you want to approve this expense report of{' '}
								<strong className='text-gray-900'>
									₹{expenseReport.total_amount?.toFixed(2) || '0.00'}
								</strong>{' '}
								for <strong className='text-gray-900'>{employeeName || 'this employee'}</strong>?
							</p>
						</div>
					)}
				</Modal.Body>
				<Modal.Footer className='border-0 px-6 pb-6 pt-0'>
					<Button
						variant='light'
						onClick={() => setShowActionModal(false)}
						className='fw-semibold px-4'>
						Cancel
					</Button>
					<Button
						variant={actionType === 'Approved' ? 'success' : 'danger'}
						onClick={handleActionSubmit}
						className='fw-semibold px-5'>
						Confirm {actionType}
					</Button>
				</Modal.Footer>
			</Modal>
		</>
	)
}
