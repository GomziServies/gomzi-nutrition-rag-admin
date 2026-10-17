import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetSalarySlips } from '../../../Functions/FGGroup/SalarySlip'
import './salary-slip.css'

const SalarySlipView = () => {
	const [data, setData] = useState<any>(null)
	const [loading, setLoading] = useState(true)

	const printSlip = () => {
		window.print()
	}

	const companyDetails: any = {
		GCS: {
			name: 'Gomzi Consulting Services Pvt Ltd',
			address: ' Gomzi 2, Abhushan Bunglows, Near Alkapuri Char Rasta, Katargam, Surat - 395004',
			contact: ' gomziconsultingservices@gmail.com',
			logo: '/media/logos/gcs-logo.png',
		},
		GLS: {
			name: 'Gomzi Life Sciences LLP',
			address:
				'443,444,445, 1St Floor, RJD Textile Park, At.Ichchhapor, Hazira Road, SURAT. Gujarat 394510',
			contact: 'Sales@Gomzilifesciences.In | 83200 77993',
			logo: '/media/logos/rag-logo.webp',
		},
	}

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	]

	useEffect(() => {
		const fetchSlip = async () => {
			const id = new URLSearchParams(window.location.search).get('id')
			if (!id) return

			try {
				const response: any = await GetSalarySlips({ id })
				if (response.status === 200 && response.data) {
					const slip = response.data
					const activeCompany =
						companyDetails[slip.company as keyof typeof companyDetails] || companyDetails.GCS

					const earningsList = [
						{ label: 'Basic Salary', amount: slip.earnings.basic },
						{ label: 'Dearness Allowance (DA)', amount: slip.earnings.da },
						{ label: 'HRA', amount: slip.earnings.hra },
						{ label: 'Conveyance Allowance', amount: slip.earnings.conveyance },
						{ label: 'Medical Allowance', amount: slip.earnings.medical },
						{ label: 'Special Allowance', amount: slip.earnings.special },
						{ label: 'Bonus', amount: slip.earnings.bonus },
						...(slip.earnings.customEarnings || []).map((e: any) => ({
							label: e.label,
							amount: e.value,
						})),
					]

					const deductionsList = [
						{ label: 'Provident Fund', amount: slip.deductions.pf },
						{ label: 'ESI', amount: slip.deductions.esi },
						{ label: 'Professional Tax (PT)', amount: slip.deductions.profTax },
						{ label: 'TDS', amount: slip.deductions.tds },
						{ label: 'Loan Deduction', amount: slip.deductions.loan },
						{ label: 'Others Deduction', amount: slip.deductions.other },
						...(slip.deductions.customDeductions || []).map((d: any) => ({
							label: d.label,
							amount: d.value,
						})),
					]

					setData({
						company: activeCompany,
						employee: {
							name: slip.employee_details?.full_name || 'N/A',
							id: slip.employee_details?.employee_code || 'N/A',
							email: slip.employee_details?.email || 'N/A',
							contact: slip.employee_details?.mobile || 'N/A',
							designation: slip.employee_details?.position || 'N/A',
							bankName: slip.employee_details?.account_details?.bank_name || 'N/A',
							bankAcc: slip.employee_details?.account_details?.account_number || 'N/A',
							paymentMode: slip.employee_details?.account_details?.mode || 'Online',
							payPeriod: `${monthNames[parseInt(slip.month) - 1]} ${slip.year}`,
						},
						earnings: earningsList,
						deductions: deductionsList,
						totals: {
							grossSalary: slip.total_earnings,
							totalDeductions: slip.total_deductions,
							netPay: slip.net_salary,
						},
					})
				}
			} catch (err) {
				console.error('Error fetching slip:', err)
			} finally {
				setLoading(false)
			}
		}
		fetchSlip()
	}, [])

	if (loading) return <div className='p-10'>Loading Salary Slip...</div>
	if (!data) return <div className='p-10 text-danger'>Salary Slip not found.</div>

	return (
		<>
			<PageTitle breadcrumbs={[]}>Salary Slip View</PageTitle>

			{/* Top Action Bar with Back Link */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3 d-print-none'>
				<Link
					to='/hr/salary-slip'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Salary Slips</span>
				</Link>
				<button
					type='button'
					onClick={printSlip}
					className='btn btn-sm btn-primary d-inline-flex align-items-center gap-2 px-4'
					style={{ height: '38px', borderRadius: '8px' }}>
					<i className='bi bi-printer fs-6'></i>
					<span>Print Slip</span>
				</button>
			</div>

			<div className='salary-slip-container'>
				{/* Kesar Group Header */}
				<div className='kesar-header'>
					<div className='d-flex align-items-center'>
						<div className='kesar-logo-section'>
							<img
								src={toAbsoluteUrl(data.company.logo)}
								alt='Logo'
								style={{ maxWidth: '120px' }}
							/>
						</div>
						<div className='kesar-company-section'>
							<h2 className='m-0 fw-bolder'>{data.company.name}</h2>
							<p className='m-0 fs-7 text-muted italic'>Masterminding the future</p>
							<p className='m-0 fs-8 mt-2 fw-bold'>{data.company.address}</p>
							<p className='m-0 fs-8 text-muted'>{data.company.contact}</p>
						</div>
					</div>
				</div>

				{/* Banner bar */}
				<div className='kesar-title-section mb-3 fs-2 mx-auto'>SALARY SLIP</div>
				<div className='kesar-banner'>
					<span>Employee Details</span>
					<span className='net-pay-text'>
						Net Pay{' '}
						<span className='ms-10'>
							₹{data.totals.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
						</span>
					</span>
				</div>

				{/* Info Grid */}
				<table className='kesar-info-grid'>
					<tbody>
						<tr>
							<td>
								<div className='row'>
									<div className='col-5'>Employee Name :</div>
									<div className='col-7 val-bold'>{data.employee.name}</div>
								</div>
							</td>
							<td>
								<div className='row'>
									<div className='col-5'>Designation :</div>
									<div className='col-7 val-bold'>{data.employee.designation}</div>
								</div>
							</td>
						</tr>
						<tr>
							<td>
								<div className='row'>
									<div className='col-5'>Employee ID :</div>
									<div className='col-7 val-bold'>{data.employee.id}</div>
								</div>
							</td>
							<td>
								<div className='row'>
									{data.employee.paymentMode === 'Cash' ? (
										<>
											<div className='col-5'>Payment Method :</div>
											<div className='col-7 val-bold text-primary'>CASH</div>
										</>
									) : (
										<>
											<div className='col-5'>Payment Mode :</div>
											<div className='col-7 val-bold text-primary'>{data.employee.paymentMode}</div>
										</>
									)}
								</div>
							</td>
						</tr>
						<tr>
							<td>
								<div className='row'>
									<div className='col-5'>E-mail ID :</div>
									<div className='col-7 val-bold'>{data.employee.email}</div>
								</div>
							</td>
							<td>
								<div className='row'>
									{data.employee.paymentMode !== 'Cash' ? (
										<>
											<div className='col-5'>Bank Account No. :</div>
											<div className='col-7 val-bold'>{data.employee.bankAcc}</div>
										</>
									) : (
										<div className='col-12'></div>
									)}
								</div>
							</td>
						</tr>
						<tr>
							<td>
								<div className='row'>
									<div className='col-5'>Contact No :</div>
									<div className='col-7 val-bold'>{data.employee.contact}</div>
								</div>
							</td>
							<td>
								<div className='row'>
									{data.employee.paymentMode !== 'Cash' ? (
										<>
											<div className='col-5'>Bank Name :</div>
											<div className='col-7 val-bold'>{data.employee.bankName}</div>
										</>
									) : (
										<div className='col-12'></div>
									)}
								</div>
							</td>
						</tr>
						<tr>
							<td>
								<div className='row'>
									<div className='col-5'>Pay Period :</div>
									<div className='col-7 val-bold'>{data.employee.payPeriod}</div>
								</div>
							</td>
							<td></td>
						</tr>
					</tbody>
				</table>

				{/* Calculations Table */}
				<table className='kesar-table'>
					<thead>
						<tr>
							<th
								style={{ width: '35%' }}
								className='text-center'>
								Earnings
							</th>
							<th
								style={{ width: '15%' }}
								className='text-center'>
								Amount
							</th>
							<th
								style={{ width: '35%' }}
								className='text-center border-divider'>
								Deductions
							</th>
							<th
								style={{ width: '15%' }}
								className='text-center'>
								Amount
							</th>
						</tr>
					</thead>
					<tbody>
						{Array.from({ length: Math.max(data.earnings.length, data.deductions.length, 7) }).map(
							(_, idx) => (
								<tr key={idx}>
									<td>{data.earnings[idx]?.label || ''}</td>
									<td className='text-right'>
										{data.earnings[idx]
											? '₹' +
											  data.earnings[idx].amount.toLocaleString(undefined, {
													minimumFractionDigits: 2,
											  })
											: ''}
									</td>
									<td className='border-divider'>{data.deductions[idx]?.label || ''}</td>
									<td className='text-right'>
										{data.deductions[idx]
											? '₹' +
											  data.deductions[idx].amount.toLocaleString(undefined, {
													minimumFractionDigits: 2,
											  })
											: ''}
									</td>
								</tr>
							)
						)}
					</tbody>
				</table>

				{/* Summary Bars */}
				<div className='kesar-summary-bar'>
					<span
						style={{ width: '35%' }}
						className='ps-4'>
						Gross Salary
					</span>
					<span
						style={{ width: '15%' }}
						className='text-right pe-4'>
						₹{data.totals.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
					</span>
					<span
						style={{ width: '35%' }}
						className='border-divider ps-4'>
						Total Deductions
					</span>
					<span
						style={{ width: '15%' }}
						className='text-right pe-4'>
						₹{data.totals.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
					</span>
				</div>
				<div
					className='kesar-summary-bar kesar-net-bar'
					style={{ justifyContent: 'space-between', padding: '10px 15px' }}>
					<span className='text-bold'>NET Salary</span>
					<span className='text-bold'>
						₹{data.totals.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
					</span>
				</div>

				{/* Signatures */}
				<div className='kesar-signature-row'>
					<div className='kesar-sig-label'>Employee Signature :</div>
					<div className='kesar-sig-label'>Employer Signature :</div>
				</div>
			</div>

			{/* Actions Bar (Removed Card/White Background) */}
			<div className='d-flex justify-content-end py-10 no-print px-5'>
				<button
					className='btn btn-primary btn-sm d-flex align-items-center gap-2'
					onClick={printSlip}>
					<i className='bi bi-printer-fill fs-3'></i>{' '}
					<span className='fw-bolder fs-5'>Print Salary Slip</span>
				</button>
				<button
					className='btn btn-back-gray ms-3 d-flex align-items-center gap-2'
					onClick={() => (window.location.href = '/hr/salary-slip')}>
					<i className='bi bi-arrow-left fs-4'></i>
					<span className='fw-bold'>Back</span>
				</button>
			</div>
		</>
	)
}

// Simple helper to convert number to words
function numberToWords(num: number) {
	const a = [
		'',
		'One',
		'Two',
		'Three',
		'Four',
		'Five',
		'Six',
		'Seven',
		'Eight',
		'Nine',
		'Ten',
		'Eleven',
		'Twelve',
		'Thirteen',
		'Fourteen',
		'Fifteen',
		'Sixteen',
		'Seventeen',
		'Eighteen',
		'Nineteen',
	]
	const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

	if (num === 0) return 'Zero'

	function makeWords(n: number): string {
		if (n < 20) return a[n]
		if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '')
		if (n < 1000)
			return (
				a[Math.floor(n / 100)] +
				' Hundred' +
				(n % 100 !== 0 ? (n % 100 < 20 ? ' ' : ' ') + makeWords(n % 100) : '')
			)
		if (n < 100000)
			return (
				makeWords(Math.floor(n / 1000)) +
				' Thousand' +
				(n % 1000 !== 0 ? ' ' + makeWords(n % 1000) : '')
			)
		return n.toString()
	}

	return makeWords(num) + ' Rupees Only'
}

export { SalarySlipView }
