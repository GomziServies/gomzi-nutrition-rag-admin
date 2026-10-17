import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorToast, successToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { AddSalarySlip } from '../../../Functions/FGGroup/SalarySlip'

const SalarySlipAdd = () => {
	const [staffList, setStaffList] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState<any>({
		company: 'GCS',
		employeeId: '',
		month: '',
		year: '',
		earnings: {
			basic: 0,
			da: 0,
			hra: 0,
			conveyance: 0,
			medical: 0,
			special: 0,
			bonus: 0,
		},
		customEarnings: [],
		deductions: {
			pf: 0,
			esi: 0,
			profTax: 0,
			tds: 0,
			loan: 0,
			other: 0,
		},
		customDeductions: [],
		bank: {
			name: '',
			accountNo: '',
			mode: 'Online',
		},
	})

	useEffect(() => {
		const fetchStaff = async () => {
			try {
				const response: any = await GetEmployees()
				if (response.status === 200) {
					setStaffList(response.data || [])
				}
			} catch (err) {
				console.error('Error fetching staff:', err)
			}
		}
		fetchStaff()
	}, [])

	const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

	useEffect(() => {
		if (formData.employeeId && staffList.length > 0) {
			const selectedStaff = staffList.find((s) => s._id === formData.employeeId)
			if (selectedStaff) {
				// employee data can be nested under .employee or at root level
				const emp = selectedStaff.employee || selectedStaff
				setSelectedEmployee({ ...selectedStaff, emp })

				const bankName = emp?.account_details?.bank_name || ''
				const accountNo = emp?.account_details?.account_number || ''
				const basicSalary = Number(emp?.salary) || 0

				setFormData((prev: any) => ({
					...prev,
					earnings: {
						...prev.earnings,
						basic: basicSalary,
					},
					bank: {
						...prev.bank,
						name: bankName,
						accountNo: accountNo,
						mode: prev.bank.mode === 'Cash' ? 'Cash' : prev.bank.mode || 'NEFT',
					},
				}))
			}
		} else if (!formData.employeeId) {
			setSelectedEmployee(null)
		}
	}, [formData.employeeId, staffList])

	const handleInputChange = (section: string, field: string, value: any) => {
		if (section) {
			setFormData((prev: any) => ({
				...prev,
				[section]: {
					...prev[section],
					[field]: value,
				},
			}))
		} else {
			setFormData((prev: any) => ({ ...prev, [field]: value }))
		}
	}

	const addCustomField = (section: string) => {
		setFormData((prev: any) => ({
			...prev,
			[section]: [...prev[section], { label: '', value: 0, isLocked: false }],
		}))
	}

	const removeCustomField = (section: string, index: number) => {
		setFormData((prev: any) => ({
			...prev,
			[section]: prev[section].filter((_: any, i: number) => i !== index),
		}))
	}

	const toggleFieldLock = (section: string, index: number) => {
		setFormData((prev: any) => {
			const newList = [...prev[section]]
			newList[index] = { ...newList[index], isLocked: !newList[index].isLocked }
			return { ...prev, [section]: newList }
		})
	}

	const handleCustomInputChange = (section: string, index: number, field: string, value: any) => {
		setFormData((prev: any) => {
			const newList = [...prev[section]]
			newList[index] = { ...newList[index], [field]: value }
			return { ...prev, [section]: newList }
		})
	}

	const handleSubmit = async () => {
		setLoading(true)
		try {
			// Basic validation
			if (!formData.employeeId || !formData.month || !formData.year) {
				errorToast('Please select Employee, Month and Year')
				setLoading(false)
				return
			}

			// Clean and prepare custom fields
			const cleanCustomEarnings = formData.customEarnings
				.filter((item: any) => item.label && item.value > 0)
				.map((item: any) => ({ label: item.label, value: Number(item.value) }))

			const cleanCustomDeductions = formData.customDeductions
				.filter((item: any) => item.label && item.value > 0)
				.map((item: any) => ({ label: item.label, value: Number(item.value) }))

			// Prepare final payload according to backend schema
			const payload = {
				company: formData.company,
				employeeId: formData.employeeId,
				month: formData.month,
				year: formData.year,
				earnings: {
					basic: Number(formData.earnings.basic),
					da: Number(formData.earnings.da),
					hra: Number(formData.earnings.hra),
					conveyance: Number(formData.earnings.conveyance),
					medical: Number(formData.earnings.medical),
					special: Number(formData.earnings.special),
					bonus: Number(formData.earnings.bonus),
					other: Number(formData.earnings.other || 0),
					customEarnings: cleanCustomEarnings,
				},
				deductions: {
					pf: Number(formData.deductions.pf),
					esi: Number(formData.deductions.esi),
					profTax: Number(formData.deductions.profTax),
					tds: Number(formData.deductions.tds),
					loan: Number(formData.deductions.loan),
					other: Number(formData.deductions.other || 0),
					customDeductions: cleanCustomDeductions,
				},
				bank: {
					name: formData.bank.mode === 'Cash' ? '' : formData.bank.name,
					accountNo: formData.bank.mode === 'Cash' ? '' : formData.bank.accountNo,
					mode: formData.bank.mode,
				},
			}

			const response: any = await AddSalarySlip(payload)
			if (response.status === 200) {
				successToast('Salary Slip generated successfully!')
				setTimeout(() => {
					window.location.href = '/hr/salary-slip'
				}, 1500)
			} else {
				errorToast(response.message || 'Failed to generate salary slip')
			}
		} catch (err: any) {
			errorToast(err.message || 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Add Salary Slip</PageTitle>

			{/* Top Action Bar with Back Link */}
			<div className='d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3'>
				<Link
					to='/hr/salary-slip'
					className='btn btn-sm d-inline-flex align-items-center gap-2 gz-back-btn'>
					<i className='bi bi-arrow-left fs-6'></i>
					<span className='fw-semibold'>Back to Salary Slips</span>
				</Link>
			</div>

			<div className='card mb-5 mb-xl-10'>
				<div className='card-body p-9'>
					{/* Section 1: Employee & Period Selection */}
					<div className='mb-10'>
						<h3 className='fw-bold mb-7 mt-5'>1. Employee & Period Selection</h3>
						<div className='row'>
							<div className='col-md-6 mb-7 '>
								<label className='form-label fw-bold'>Select Company</label>
								<select
									className='form-select'
									value={formData.company}
									onChange={(e) => handleInputChange('', 'company', e.target.value)}>
									<option value='GCS'>Gomzi Consulting Services (GCS)</option>
									<option value='GLS'>Gomzi Lifesciences (GLS)</option>
								</select>
							</div>
							<div className='col-md-6 mb-7'>
								<label className='form-label fw-bold'>Select Employee</label>
								<select
									className='form-select'
									value={formData.employeeId}
									onChange={(e) => handleInputChange('', 'employeeId', e.target.value)}>
									<option value=''>Choose Employee...</option>
									{staffList.map((staff: any) => (
										<option
											key={staff._id}
											value={staff._id}>
											{staff.full_name} (
											{staff.employee?.employee_code ||
												staff.employee_code ||
												staff.employee_id ||
												'Staff'}
											)
										</option>
									))}
								</select>
							</div>
							<div className='col-md-6 mb-7'>
								<label className='form-label fw-bold'>Month</label>
								<select
									className='form-select'
									value={formData.month}
									onChange={(e) => handleInputChange('', 'month', e.target.value)}>
									<option value=''>Select Month</option>
									<option value='01'>January</option>
									<option value='02'>February</option>
									<option value='03'>March</option>
									<option value='04'>April</option>
									<option value='05'>May</option>
									<option value='06'>June</option>
									<option value='07'>July</option>
									<option value='08'>August</option>
									<option value='09'>September</option>
									<option value='10'>October</option>
									<option value='11'>November</option>
									<option value='12'>December</option>
								</select>
							</div>
							<div className='col-md-6 mb-7'>
								<label className='form-label fw-bold'>Year</label>
								<select
									className='form-select'
									value={formData.year}
									onChange={(e) => handleInputChange('', 'year', e.target.value)}>
									<option value=''>Select Year</option>
									<option value='2024'>2024</option>
									<option value='2025'>2025</option>
									<option value='2026'>2026</option>
									<option value='2026'>2027</option>
									<option value='2026'>2028</option>
									<option value='2026'>2029</option>
									<option value='2026'>2030</option>
								</select>
							</div>
						</div>
					</div>

					<div className='separator separator-dashed my-10'></div>

					{/* Section 2: Earnings */}
					<div className='mb-10'>
						<div className='d-flex justify-content-between align-items-center mb-7'>
							<h3 className='fw-bold m-0'>2. Earnings</h3>
							<TableButton
								action='add'
								text='Add'
								onClick={() => addCustomField('customEarnings')}
							/>
						</div>
						<div className='row mb-1'>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Basic Salary (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.basic}
									onChange={(e) => handleInputChange('earnings', 'basic', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Dearness Allowance (DA) (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.da}
									onChange={(e) => handleInputChange('earnings', 'da', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>HRA (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.hra}
									onChange={(e) => handleInputChange('earnings', 'hra', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Conveyance Allowance (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.conveyance}
									onChange={(e) => handleInputChange('earnings', 'conveyance', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Medical Allowance (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.medical}
									onChange={(e) => handleInputChange('earnings', 'medical', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Special Allowance (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.special}
									onChange={(e) => handleInputChange('earnings', 'special', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Bonus (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.earnings.bonus}
									onChange={(e) => handleInputChange('earnings', 'bonus', e.target.value)}
								/>
							</div>
							{/* Locked Earnings */}
							{formData.customEarnings.map(
								(field: any, index: number, array: any[]) =>
									field.isLocked && (
										<div
											key={index}
											className='col-md-3 mb-7 position-relative'>
											<label className='form-label fw-bold'>
												{field.label || 'Other Earning'} (₹)
											</label>
											<div className='d-flex align-items-center'>
												<input
													type='number'
													className='form-control me-2'
													value={field.value}
													onChange={(e) =>
														handleCustomInputChange(
															'customEarnings',
															index,
															'value',
															e.target.value
														)
													}
												/>
												{index === array.length - 1 && (
													<button
														type='button'
														className='btn btn-light-danger btn-sm p-2 flex-shrink-0'
														onClick={() => removeCustomField('customEarnings', index)}>
														<i className='bi bi-trash fs-4 p-0'></i>
													</button>
												)}
											</div>
										</div>
									)
							)}
						</div>

						{/* Unlocked Earnings Builder */}
						<div className='row'>
							{formData.customEarnings.map(
								(field: any, index: number, array: any[]) =>
									!field.isLocked && (
										<div
											key={index}
											className='row mb-7 align-items-end'>
											<div className='col-md-5'>
												<label className='form-label fw-bold'>Other Earning Name</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. Overtime'
													value={field.label}
													onChange={(e) =>
														handleCustomInputChange(
															'customEarnings',
															index,
															'label',
															e.target.value
														)
													}
												/>
											</div>
											<div className='col-md-5'>
												<label className='form-label fw-bold'>Amount (₹)</label>
												<input
													type='number'
													className='form-control'
													value={field.value}
													onChange={(e) =>
														handleCustomInputChange(
															'customEarnings',
															index,
															'value',
															e.target.value
														)
													}
												/>
											</div>
											<div className='col-md-2 d-flex gap-3 pb-1'>
												<button
													type='button'
													className='btn btn-back-gray d-grid p-0'
													style={{
														color: '#4b5563',
														height: '40px',
														width: '40px',
														placeItems: 'center',
													}}
													onClick={() => toggleFieldLock('customEarnings', index)}>
													<i
														className='bi bi-check-lg fs-3 m-0 p-0'
														style={{ color: '#4b5563', lineHeight: '1' }}></i>
												</button>
												{index === array.length - 1 && (
													<button
														type='button'
														className='btn btn-light-danger d-grid p-0'
														style={{ height: '40px', width: '40px', placeItems: 'center' }}
														onClick={() => removeCustomField('customEarnings', index)}>
														<i
															className='bi bi-trash fs-3 m-0 p-0'
															style={{ lineHeight: '1' }}></i>
													</button>
												)}
											</div>
										</div>
									)
							)}
						</div>
					</div>

					<div className='separator separator-dashed my-10'></div>

					{/* Section 3: Deductions */}
					<div className='mb-10'>
						<div className='d-flex justify-content-between align-items-center mb-7'>
							<h3 className='fw-bold m-0'>3. Deductions</h3>
							<TableButton
								action='add'
								text='Add'
								onClick={() => addCustomField('customDeductions')}
							/>
						</div>
						<div className='row mb-1'>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>PF (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.deductions.pf}
									onChange={(e) => handleInputChange('deductions', 'pf', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>ESI (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.deductions.esi}
									onChange={(e) => handleInputChange('deductions', 'esi', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Professional Tax (PT) (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.deductions.profTax}
									onChange={(e) => handleInputChange('deductions', 'profTax', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>TDS (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.deductions.tds}
									onChange={(e) => handleInputChange('deductions', 'tds', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Loan Deduction (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.deductions.loan}
									onChange={(e) => handleInputChange('deductions', 'loan', e.target.value)}
								/>
							</div>
							<div className='col-md-3 mb-7'>
								<label className='form-label fw-bold'>Other Deductions (₹)</label>
								<input
									type='number'
									className='form-control'
									value={formData.deductions.other}
									onChange={(e) => handleInputChange('deductions', 'other', e.target.value)}
								/>
							</div>
							{/* Locked Deductions */}
							{formData.customDeductions.map(
								(field: any, index: number, array: any[]) =>
									field.isLocked && (
										<div
											key={index}
											className='col-md-3 mb-7 position-relative'>
											<label className='form-label fw-bold'>
												{field.label || 'Other Deduction'} (₹)
											</label>
											<div className='d-flex align-items-center'>
												<input
													type='number'
													className='form-control me-2'
													value={field.value}
													onChange={(e) =>
														handleCustomInputChange(
															'customDeductions',
															index,
															'value',
															e.target.value
														)
													}
												/>
												{index === array.length - 1 && (
													<button
														type='button'
														className='btn btn-light-danger btn-sm p-2 flex-shrink-0'
														onClick={() => removeCustomField('customDeductions', index)}>
														<i className='bi bi-trash fs-4 p-0'></i>
													</button>
												)}
											</div>
										</div>
									)
							)}
						</div>

						{/* Unlocked Deductions Builder */}
						<div className='row'>
							{formData.customDeductions.map(
								(field: any, index: number, array: any[]) =>
									!field.isLocked && (
										<div
											key={index}
											className='row mb-7 align-items-end'>
											<div className='col-md-5'>
												<label className='form-label fw-bold'>Other Deduction Name</label>
												<input
													type='text'
													className='form-control'
													placeholder='e.g. Deposit'
													value={field.label}
													onChange={(e) =>
														handleCustomInputChange(
															'customDeductions',
															index,
															'label',
															e.target.value
														)
													}
												/>
											</div>
											<div className='col-md-5'>
												<label className='form-label fw-bold'>Amount (₹)</label>
												<input
													type='number'
													className='form-control'
													value={field.value}
													onChange={(e) =>
														handleCustomInputChange(
															'customDeductions',
															index,
															'value',
															e.target.value
														)
													}
												/>
											</div>
											<div className='col-md-2 d-flex gap-2 pb-1'>
												<button
													type='button'
													className='btn btn-back-gray d-grid p-0'
													style={{
														color: '#4b5563',
														height: '40px',
														width: '40px',
														placeItems: 'center',
													}}
													onClick={() => toggleFieldLock('customDeductions', index)}>
													<i
														className='bi bi-check-lg fs-3 m-0 p-0'
														style={{ color: '#4b5563', lineHeight: '1' }}></i>
												</button>
												{index === array.length - 1 && (
													<button
														type='button'
														className='btn btn-light-danger d-grid p-0'
														style={{ height: '40px', width: '40px', placeItems: 'center' }}
														onClick={() => removeCustomField('customDeductions', index)}>
														<i
															className='bi bi-trash fs-3 m-0 p-0'
															style={{ lineHeight: '1' }}></i>
													</button>
												)}
											</div>
										</div>
									)
							)}
						</div>
					</div>

					<div className='separator separator-dashed my-10'></div>

					{/* Section 4: Payment Details */}
					<div className='mb-5'>
						<h3 className='fw-bold mb-7'>4. Payment Details</h3>
						<div className='row'>
							<div className='col-md-4 mb-7'>
								<label className='form-label fw-bold'>Payment Method</label>
								<select
									className='form-select'
									value={formData.bank.mode === 'Cash' ? 'Cash' : 'Online'}
									onChange={(e) => {
										const val = e.target.value
										handleInputChange('bank', 'mode', val === 'Cash' ? 'Cash' : 'NEFT')
									}}>
									<option value='Online'>Online</option>
									<option value='Cash'>Cash</option>
								</select>
							</div>

							{formData.bank.mode !== 'Cash' && (
								<>
									<div className='col-md-4 mb-7'>
										<label className='form-label fw-bold'>Bank Name</label>
										<input
											type='text'
											className='form-control bg-light'
											value={formData.bank.name}
											readOnly
											placeholder='Bank Name'
										/>
									</div>
									<div className='col-md-4 mb-7'>
										<label className='form-label fw-bold'>Account Number</label>
										<input
											type='text'
											className='form-control bg-light'
											value={formData.bank.accountNo}
											readOnly
											placeholder='Account Number'
										/>
									</div>
									<div className='col-md-4 mb-7'>
										<label className='form-label fw-bold'>Payment Mode</label>
										<select
											className='form-select'
											value={formData.bank.mode === 'Online' ? 'NEFT' : formData.bank.mode}
											onChange={(e) => handleInputChange('bank', 'mode', e.target.value)}>
											<option value='NEFT'>NEFT</option>
											<option value='IMPS'>IMPS</option>
											<option value='RTGS'>RTGS</option>
											<option value='Transfer'>Transfer</option>
											<option value='UPI'>UPI</option>
										</select>
									</div>
								</>
							)}
						</div>
					</div>
				</div>

				<div className='card-footer d-flex justify-content-end py-6 px-9 border-0'>
					<button
						className='btn btn-back-gray me-3 d-flex align-items-center gap-2'
						disabled={loading}
						onClick={() => (window.location.href = '/hr/salary-slip')}>
						<i className='bi bi-arrow-left fs-4'></i>
						<span className='fw-bold'>Back</span>
					</button>
					<TableButton
						action='add'
						text={loading ? 'Submitting...' : 'Submit'}
						showIcon={false}
						disabled={loading}
						onClick={handleSubmit}
					/>
				</div>
			</div>
		</>
	)
}

export { SalarySlipAdd }
