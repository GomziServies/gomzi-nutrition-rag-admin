import React, { useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'

const mockPayouts = [
	{ id: 'PAY-8001', employeeName: 'Rahul Sharma', amount: 5000, date: '26 Apr 2026', method: 'Bank Transfer', status: 'Completed', notes: 'April withdrawal' },
	{ id: 'PAY-8002', employeeName: 'Priya Patel', amount: 2000, date: '23 Apr 2026', method: 'UPI', status: 'Completed', notes: 'Clearance' },
	{ id: 'PAY-8003', employeeName: 'Amit Singh', amount: 8500, date: '15 Apr 2026', method: 'Cash', status: 'Completed', notes: 'Handed over in office' },
	{ id: 'PAY-8004', employeeName: 'Neha Verma', amount: 1500, date: '10 Apr 2026', method: 'Bank Transfer', status: 'Failed', notes: 'Invalid bank details' },
]

export const PayoutHistory: React.FC = () => {
	const [employeeFilter, setEmployeeFilter] = useState('All')

	const filteredPayouts = mockPayouts.filter(p => {
		if (employeeFilter !== 'All' && p.employeeName !== employeeFilter) return false
		return true
	})

	const uniqueEmployees = Array.from(new Set(mockPayouts.map(p => p.employeeName)))

	return (
		<>
			<PageTitle breadcrumbs={[]}>Payout History</PageTitle>

			<KTCard>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold fs-3 mb-1'>Completed Payouts</span>
						<span className='text-muted mt-1 fw-semibold fs-7'>History of all money sent to employees</span>
					</h3>
					<div className='card-toolbar'>
						<div className='d-flex align-items-center gap-2'>
							<select
								className='form-select form-select-solid w-200px'
								value={employeeFilter}
								onChange={(e) => setEmployeeFilter(e.target.value)}
							>
								<option value='All'>All Employees</option>
								{uniqueEmployees.map(emp => (
									<option key={emp} value={emp}>{emp}</option>
								))}
							</select>
							<input
								type='date'
								className='form-control form-control-solid w-150px'
							/>
						</div>
					</div>
				</div>
				<div className='card-body py-3'>
					<div className='table-responsive'>
						<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
							<thead>
								<tr className='fw-bold text-muted'>
									<th className='min-w-100px'>Payout ID</th>
									<th className='min-w-150px'>Employee Name</th>
									<th className='min-w-120px'>Amount Paid</th>
									<th className='min-w-140px'>Payment Date</th>
									<th className='min-w-120px'>Method</th>
									<th className='min-w-100px'>Status</th>
									<th className='min-w-150px'>Notes</th>
								</tr>
							</thead>
							<tbody>
								{filteredPayouts.map(payout => (
									<tr key={payout.id}>
										<td>
											<span className='text-dark fw-bold d-block fs-7'>{payout.id}</span>
										</td>
										<td>
											<span className='text-dark fw-bold text-hover-primary fs-6'>{payout.employeeName}</span>
										</td>
										<td>
											<span className='text-success fw-bold d-block fs-6'>₹ {payout.amount}</span>
										</td>
										<td>
											<span className='text-dark fw-semibold d-block fs-7'>{payout.date}</span>
										</td>
										<td>
											<span className='text-muted fw-semibold d-block fs-7'>{payout.method}</span>
										</td>
										<td>
											<span
												className={`badge badge-light-${
													payout.status === 'Completed' ? 'success' : 'danger'
												}`}
											>
												{payout.status}
											</span>
										</td>
										<td>
											<span className='text-muted fw-semibold d-block fs-7'>{payout.notes}</span>
										</td>
									</tr>
								))}
								{filteredPayouts.length === 0 && (
									<tr>
										<td colSpan={7} className='text-center text-muted fw-semibold py-5'>
											No payouts found for the selected criteria.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</KTCard>
		</>
	)
}

export default PayoutHistory
