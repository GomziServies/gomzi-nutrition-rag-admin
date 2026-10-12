import React, { useEffect, useState } from 'react'
import { errorToast, successToast } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import TableButton from '../../../components/TableButton'
import { GetEmployees } from '../../../Functions/FGGroup/Employee'
import { GetSalarySlips, UpdateSalarySlip } from '../../../Functions/FGGroup/SalarySlip'

const SalarySlipEdit = () => {
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

	const [staffList, setStaffList] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [slipId, setSlipId] = useState<string | null>(null)

	useEffect(() => {
		const fetchInitialData = async () => {
			const params = new URLSearchParams(window.location.search)
			const id = params.get('id')
			setSlipId(id)

			try {
				// Fetch staff list for the dropdown
				const staffRes: any = await GetEmployees()
				if (staffRes.status === 200) {
					setStaffList(staffRes.data || [])
				}

				if (id) {
					const response: any = await GetSalarySlips({ id })
					if (response.status === 200 && response.data) {
						const data = response.data
						// Map backend data to frontend state
						setFormData({
							company: data.company || 'GCS',
							employeeId: data.employeeId?._id || data.employeeId || '',
							month: data.month || '',
							year: data.year || '',
							earnings: {
								basic: data.earnings?.basic || 0,
								da: data.earnings?.da || 0,
								hra: data.earnings?.hra || 0,
								conveyance: data.earnings?.conveyance || 0,
								medical: data.earnings?.medical || 0,
								special: data.earnings?.special || 0,
								bonus: data.earnings?.bonus || 0,
								other: data.earnings?.other || 0,
							},
							customEarnings:
								data.earnings?.customEarnings?.map((item: any) => ({
									...item,
									isLocked: true,
								})) || [],
							deductions: {
								pf: data.deductions?.pf || 0,
								esi: data.deductions?.esi || 0,
								profTax: data.deductions?.profTax || 0,
								tds: data.deductions?.tds || 0,
								loan: data.deductions?.loan || 0,
								other: data.deductions?.other || 0,
							},
							customDeductions:
								data.deductions?.customDeductions?.map((item: any) => ({
									...item,
									isLocked: true,
								})) || [],
							bank: {
								name: data.employee_details?.account_details?.bank_name || '',
								accountNo: data.employee_details?.account_details?.account_number || '',
								mode: data.employee_details?.account_details?.mode || 'NEFT',
							},
						})
					}
				}
			} catch (err) {
				console.error('Error fetching edit data:', err)
				errorToast('Failed to load salary slip details')
			}
		}

		fetchInitialData()
	}, [])

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
		if (!slipId) return
		setLoading(true)
		try {
			// Prepare payload
			const payload = {
				earnings: {
					...formData.earnings,
					customEarnings: formData.customEarnings.map((item: any) => ({
						label: item.label,
						value: Number(item.value),
					})),
				},
				deductions: {
					...formData.deductions,
					customDeductions: formData.customDeductions.map((item: any) => ({
						label: item.label,
						value: Number(item.value),
					})),
				},
				bank: {
					name: formData.bank.mode === 'Cash' ? '' : formData.bank.name,
					accountNo: formData.bank.mode === 'Cash' ? '' : formData.bank.accountNo,
					mode: formData.bank.mode,
				},
			}

			const response: any = await UpdateSalarySlip(slipId, payload)
			if (response.status === 200) {
				successToast('Salary slip updated successfully')
				setTimeout(() => {
					window.location.href = '/hr/salary-slip'
				}, 1500)
			} else {
				errorToast(response.message || 'Failed to update salary slip')
			}
		} catch (err: any) {
			errorToast(err.message || 'Error updating salary slip')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Update Salary Slip</PageTitle>

			<div className='card mb-5 mb-xl-10'>
				<div className='card-body p-9'>
					{/* Section 1: Employee & Period Selection */}
					<div className='mb-10'>
						<h3 className='fw-bold mb-7 mt-5'>1. Employee & Period Selection</h3>
						<div className='row'>
							<div className='col-md-6 mb-7'>
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
									disabled>
									<option value=''>Choose Employee...</option>
									{staffList.map((staff: any) => (
										<option
											key={staff._id}
											value={staff._id}>
											{staff.full_name} ({staff.employee?.employee_code || staff.employee_code || staff.employee_id || 'Staff'})
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
											<div className='col-md-2 d-flex gap-2'>
												<button
													type='button'
													className='btn btn-back-gray btn-sm mb-1 px-3'
													style={{ color: '#4b5563' }}
													onClick={() => toggleFieldLock('customEarnings', index)}>
													<i
														className='bi bi-check-lg fs-4'
														style={{ color: '#4b5563' }}></i>
												</button>
												{index === array.length - 1 && (
													<button
														type='button'
														className='btn btn-light-danger btn-sm mb-1'
														onClick={() => removeCustomField('customEarnings', index)}>
														<i className='bi bi-trash fs-4'></i>
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
														<i className='bi bi-trash fs-4'></i>
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
											<div className='col-md-2 d-flex gap-2'>
												<button
													type='button'
													className='btn btn-back-gray btn-sm mb-1 px-3'
													style={{ color: '#4b5563' }}
													onClick={() => toggleFieldLock('customDeductions', index)}>
													<i
														className='bi bi-check-lg fs-4'
														style={{ color: '#4b5563' }}></i>
												</button>
												{index === array.length - 1 && (
													<button
														type='button'
														className='btn btn-light-danger btn-sm mb-1'
														onClick={() => removeCustomField('customDeductions', index)}>
														<i className='bi bi-trash fs-4'></i>
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
										handleInputChange(
											'bank',
											'mode',
											val === 'Cash' ? 'Cash' : 'NEFT'
										)
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
											className='form-control'
											value={formData.bank.name}
											onChange={(e) => handleInputChange('bank', 'name', e.target.value)}
										/>
									</div>
									<div className='col-md-4 mb-7'>
										<label className='form-label fw-bold'>Account Number</label>
										<input
											type='text'
											className='form-control'
											value={formData.bank.accountNo}
											onChange={(e) => handleInputChange('bank', 'accountNo', e.target.value)}
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
						onClick={() => (window.location.href = '/hr/salary-slip')}>
						<i className='bi bi-arrow-left fs-4'></i>
						<span className='fw-bold'>Back</span>
					</button>
					<TableButton
						action='add'
						text={loading ? 'Updating...' : 'Update'}
						showIcon={false}
						disabled={loading}
						onClick={handleSubmit}
					/>
				</div>
			</div>
		</>
	)
}

export { SalarySlipEdit }
