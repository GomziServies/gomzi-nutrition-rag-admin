import React, { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { GetAdajanBranchAttendance } from '../../../Functions/FGGroup/AdajanBranchAttendance'
import {
	GetAdajanBranchClient,
	RenewAdajanBranchClient,
} from '../../../Functions/FGGroup/AdajanBranchClient'
import { calculateMembershipDays } from '../../../utils/dateUtils'

interface Client {
	_id: string
	name: string
	phone: string
	email: string
	client_address?: {
		address_line_1?: string
		city?: string
		state?: string
		pin_code?: string
		country?: string
	}
	planDuration: string
	joiningDate: string
	expiryDate?: string
	image?: string | null
	clientCode?: string
	bloodGroup?: string
	workoutTime?: string
	remainingDays: number | null
	status: boolean
	planHistory?: Array<{
		joiningDate: string
		expiryDate: string
		updatedAt: string
	}>
}

const AdajanBranchClientView: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const id = searchParams.get('id')
	const [loading, setLoading] = useState(true)
	const [client, setClient] = useState<Client | null>(null)
	const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

	// Renew Modal State
	const [showRenewModal, setShowRenewModal] = useState(false)
	const [isRenewing, setIsRenewing] = useState(false)
	const [renewJoiningDate, setRenewJoiningDate] = useState('')
	const [renewExpiryDate, setRenewExpiryDate] = useState('')

	// Load client data on mount
	useEffect(() => {
		const loadClientData = async () => {
			if (!id) {
				toast.error('Client ID is missing')
				navigate('/adajan-branch/client/list')
				return
			}

			setLoading(true)
			try {
				const response: any = await GetAdajanBranchClient({ id })

				if (response.data && response.data.length > 0) {
					const clientData = response.data[0]
					setClient(clientData)

					// Fetch Attendance Records
					if (clientData.clientCode) {
						try {
							const attResponse: any = await GetAdajanBranchAttendance({
								client_code: clientData.clientCode,
								limit: 10000, // Get all records
							})
							if (attResponse.data) {
								setAttendanceRecords(attResponse.data)
							}
						} catch (err) {
							console.error('Failed to load attendance', err)
						}
					}

					toast.success('Client details loaded')
				} else {
					toast.error('Client not found')
					navigate('/adajan-branch/client/list')
				}
			} catch (error: any) {
				toast.error('Failed to load client details')
				navigate('/adajan-branch/client/list')
			} finally {
				setLoading(false)
			}
		}

		loadClientData()
	}, [id, navigate])

	const handleRenewPlan = async () => {
		if (!id) return
		if (!renewJoiningDate || !renewExpiryDate) {
			toast.error('Both joining date and expiry date are required.')
			return
		}

		const start = new Date(renewJoiningDate)
		const end = new Date(renewExpiryDate)
		if (end <= start) {
			toast.error('Expiry date must be after joining date.')
			return
		}

		setIsRenewing(true)
		try {
			await RenewAdajanBranchClient({
				id,
				joiningDate: renewJoiningDate,
				expiryDate: renewExpiryDate,
			})
			toast.success('Membership renewed successfully.')
			setShowRenewModal(false)
			setRenewJoiningDate('')
			setRenewExpiryDate('')

			// Refresh client data
			const refreshResponse: any = await GetAdajanBranchClient({ id })
			if (refreshResponse.data && refreshResponse.data.length > 0) {
				setClient(refreshResponse.data[0])
			}
		} catch (error: any) {
			toast.error(error.message || 'Failed to renew plan')
		} finally {
			setIsRenewing(false)
		}
	}

	const handleBack = () => {
		navigate('/adajan-branch/client/list')
	}

	const formatAddress = (address: any): string => {
		if (!address) return 'N/A'
		const parts = [
			address.address_line_1,
			address.city,
			address.state,
			address.pin_code,
			address.country,
		].filter(Boolean)
		return parts.join(', ') || 'N/A'
	}

	if (loading) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Client Details</PageTitle>
				<div className='text-center py-10'>
					<div
						className='spinner-border text-primary'
						role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</>
		)
	}

	if (!client) {
		return (
			<>
				<PageTitle breadcrumbs={[]}>Client Details</PageTitle>
				<div className='text-center py-10'>
					<h3>Client not found</h3>
					<button
						className='btn btn-primary mt-4'
						onClick={handleBack}>
						Back to List
					</button>
				</div>
			</>
		)
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Client Details</PageTitle>

			<div className='row'>
				<div className='col-md-12'>
					{/* Main Content */}
					<div className='row'>
						{/* Left Column - Profile & Personal Info */}
						<div className='col-lg-4 d-flex'>
							{/* Profile Card */}
							<div className='card mb-5 w-100'>
								<div className='card-body text-center'>
									<div className='mb-5'>
										<div
											className='mx-auto mb-5'
											style={{
												width: '300px',
												height: '300px',
												borderRadius: '8px',
												overflow: 'hidden',
												border: '2px solid #e4e6ef',
											}}>
											{/* ✅ Image with proper URL prefix */}
											{client.image && client.image.trim() !== '' ? (
												<img
													src={`https://files.fggroup.in/${client.image}`}
													alt={client.name}
													style={{
														width: '100%',
														height: '100%',
														objectFit: 'cover',
													}}
													onError={(e) => {
														e.currentTarget.style.display = 'none'
														if (e.currentTarget.nextElementSibling) {
															;(e.currentTarget.nextElementSibling as HTMLElement).style.display =
																'flex'
														}
													}}
												/>
											) : null}
											<div
												className='d-flex align-items-center justify-content-center h-100 bg-light'
												style={{
													fontSize: '60px',
													color: '#ccc',
													display: client.image && client.image.trim() !== '' ? 'none' : 'flex',
												}}>
												<i className='bi bi-person'></i>
											</div>
										</div>
										<h3 className='fw-bold mb-2'>{client.name}</h3>
										<div className='badge badge-light-primary fw-bold mb-4 fs-7'>
											Client Code:{' '}
											{client.clientCode ? String(client.clientCode).padStart(4, '0') : 'N/A'}
										</div>
										<p className='text-muted mb-2'>{client.email}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Right Column - Detailed Information */}
						<div className='col-lg-8 d-flex flex-column'>
							{/* Contact Information Card */}
							<div className='card mb-5 flex-fill'>
								<div className='card-header'>
									<h3 className='card-title fw-bold'>Contact Information</h3>
								</div>
								<div className='card-body'>
									<div className='row client-view-boxes'>
										<div className='col-lg-6 mb-5 client-view-box'>
											<div className='d-flex align-items-center'>
												<div
													className='d-flex align-items-center justify-content-center bg-light rounded me-4'
													style={{ width: '50px', height: '50px' }}>
													<i className='bi bi-telephone fs-2 text-primary'></i>
												</div>
												<div className='flex-grow-1'>
													<div className='text-muted fw-semibold mb-1'>Phone Number</div>
													<div className='fw-bold'>{client.phone}</div>
												</div>
											</div>
										</div>
										<div className='col-lg-6 mb-5 client-view-box'>
											<div className='d-flex align-items-center'>
												<div
													className='d-flex align-items-center justify-content-center bg-light rounded me-4'
													style={{ width: '50px', height: '50px' }}>
													<i className='bi bi-envelope fs-2 text-primary'></i>
												</div>
												<div className='flex-grow-1'>
													<div className='text-muted fw-semibold mb-1'>Email Address</div>
													<div className='fw-bold'>{client.email}</div>
												</div>
											</div>
										</div>
										<div className='col-lg-12'>
											<div className='d-flex align-items-center'>
												<div
													className='d-flex align-items-center justify-content-center bg-light rounded me-4'
													style={{ width: '50px', height: '50px' }}>
													<i className='bi bi-geo-alt fs-2 text-primary'></i>
												</div>
												<div>
													<div className='text-muted fw-semibold mb-1'>Address</div>
													<div className='fw-bold fs-6'>{formatAddress(client.client_address)}</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Membership Information Card */}
							<div className='card mb-5'>
								<div className='card-header align-items-center'>
									<h3 className='card-title fw-bold'>Membership Information</h3>
									<div className='card-toolbar'>
										{(() => {
											const { remainingDays } = calculateMembershipDays(
												client.joiningDate,
												client.expiryDate
											)
											return remainingDays <= 0 ? (
												<button
													className='btn btn-sm btn-light-primary'
													onClick={() => setShowRenewModal(true)}>
													Renew Membership
												</button>
											) : null
										})()}
									</div>
								</div>
								<div className='card-body'>
									<div className='row client-view-boxes mt-4'>
										<div className='col-md-6 mb-7 client-view-box'>
											<label className='fw-bold text-muted mb-2'>Joining Date</label>
											<div className='fw-semibold'>
												{new Date(client.joiningDate).toLocaleDateString('en-IN', {
													day: '2-digit',
													month: 'short',
													year: 'numeric',
												})}
											</div>
										</div>
										<div className='col-md-6 mb-7 client-view-box'>
											<label className='fw-bold text-muted mb-2'>Expiry Date</label>
											<div className='fw-semibold'>
												{client.expiryDate
													? new Date(client.expiryDate).toLocaleDateString('en-IN', {
															day: '2-digit',
															month: 'short',
															year: 'numeric',
													  })
													: 'N/A'}
											</div>
										</div>
										<div className='col-md-6 mb-7 client-view-box'>
											<label className='fw-bold text-muted mb-2'>Plan Duration</label>
											<div className='fw-semibold'>{client.planDuration}</div>
										</div>
										<div className='col-md-6 mb-7 client-view-box'>
											<label className='fw-bold text-muted mb-2'>Days Remaining</label>
											<div>
												{(() => {
													const { remainingDays, expiredDays } = calculateMembershipDays(
														client.joiningDate,
														client.expiryDate
													)

													return remainingDays <= 0 ? (
														<span className='badge rounded-pill bg-danger text-white py-2 px-3'>
															{expiredDays} Days Expired
														</span>
													) : (
														<span
															className='badge rounded-pill py-2 px-3'
															style={{ backgroundColor: '#e8fff3', color: '#50cd89' }}>
															{remainingDays} Days Remaining
														</span>
													)
												})()}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Full Width Bottom Content */}
				{(() => {
					const combinedHistory = client.planHistory ? [...client.planHistory] : []
					if (client.joiningDate) {
						combinedHistory.push({
							joiningDate: client.joiningDate,
							expiryDate: client.expiryDate || '',
							updatedAt: new Date().toISOString(),
						})
					}

					// Reverse the combined history to show latest entries first
					combinedHistory.reverse()

					if (combinedHistory.length === 0) return null

					return (
						<div className='col-md-12 mt-5'>
							{/* Plan History Card */}
							<div className='card mb-5 flex-fill'>
								<div className='card-header align-items-center'>
									<h3 className='card-title fw-bold'>Membership History</h3>
									<div className='card-toolbar'>
										<span className='badge badge-light-primary fw-bold px-4 py-2'>
											{combinedHistory.length} Total{' '}
											{combinedHistory.length === 1 ? 'Plan' : 'Plans'}
										</span>
									</div>
								</div>
								<div className='card-body p-0'>
									<div className='table-responsive'>
										<table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4 mb-0'>
											<thead>
												<tr className='fw-bold text-muted bg-light'>
													<th className='ps-4 rounded-start min-w-50px'>No</th>
													<th className='min-w-150px'>Joining Date</th>
													<th className='min-w-150px'>Expiry Date</th>
													<th className='min-w-150px'>Duration</th>
													<th className='min-w-150px rounded-end'>Attendance Avg</th>
												</tr>
											</thead>
											<tbody>
												{combinedHistory.map((history, index) => {
													let duration = 'N/A'
													let totalDaysInPlan = 0
													let presentDays = 0
													let attendanceAvgStr = 'N/A'
													if (history.joiningDate && history.expiryDate) {
														const start = new Date(history.joiningDate)
														const end = new Date(history.expiryDate)

														if (end > start) {
															let years = end.getFullYear() - start.getFullYear()
															let months = end.getMonth() - start.getMonth()
															let days = end.getDate() - start.getDate()

															if (days < 0) {
																months--
																const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
																days += prevMonth.getDate()
															}
															if (months < 0) {
																years--
																months += 12
															}
															if (days > 15) {
																months++
																if (months === 12) {
																	years++
																	months = 0
																}
															}

															const parts = []
															if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`)
															if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`)
															duration = parts.length > 0 ? parts.join(' ') : '0 months'

															// Calculate total days for average
															const diffTime = Math.abs(end.getTime() - start.getTime())
															totalDaysInPlan = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
														} else {
															duration = '0 months'
														}

														// Calculate Present Days
														presentDays = attendanceRecords.filter((att) => {
															if (!att.DateString) return false

															// Check if the record actually indicates presence
															const isPresent = att.Status === 'Present' || att.Status === 'P'
															if (!isPresent) return false

															// Get YYYY-MM-DD of the attendance date strings and compare them
															const attDateStr = new Date(att.DateString).toLocaleDateString(
																'en-CA'
															)
															const startCompareStr = new Date(start).toLocaleDateString('en-CA')
															const endCompareStr = new Date(end).toLocaleDateString('en-CA')

															return attDateStr >= startCompareStr && attDateStr <= endCompareStr
														}).length

														if (totalDaysInPlan > 0) {
															const percentage = ((presentDays / totalDaysInPlan) * 100).toFixed(1)
															attendanceAvgStr = `${presentDays}/${totalDaysInPlan} (${percentage}%)`
														} else {
															attendanceAvgStr = `${presentDays}/0 (0%)`
														}
													}

													return (
														<tr key={index}>
															<td className='ps-4'>
																<span className='text-dark fw-bold d-block mb-1 fs-6'>
																	{index + 1}
																</span>
															</td>
															<td>
																<span className='text-gray-800 fw-semibold d-block mb-1'>
																	{history.joiningDate
																		? new Date(history.joiningDate).toLocaleDateString('en-IN', {
																				day: '2-digit',
																				month: 'short',
																				year: 'numeric',
																		  })
																		: 'N/A'}
																</span>
															</td>
															<td>
																<span className='text-gray-800 fw-semibold d-block mb-1'>
																	{history.expiryDate
																		? new Date(history.expiryDate).toLocaleDateString('en-IN', {
																				day: '2-digit',
																				month: 'short',
																				year: 'numeric',
																		  })
																		: 'N/A'}
																</span>
															</td>
															<td>
																<span className='badge badge-light-info fs-7'>{duration}</span>
															</td>
															<td>
																<span className='badge badge-light-primary fs-7'>
																	{attendanceAvgStr}
																</span>
															</td>
														</tr>
													)
												})}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					)
				})()}

				{/* Renew Modal */}
				<Modal
					show={showRenewModal}
					onHide={() => setShowRenewModal(false)}
					centered>
					<Modal.Header closeButton>
						<Modal.Title>Renew Membership</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<div className='mb-5'>
							<label className='form-label fw-bold'>New Joining Date</label>
							<input
								type='date'
								className='form-control form-control-solid'
								value={renewJoiningDate}
								onChange={(e) => setRenewJoiningDate(e.target.value)}
							/>
						</div>
						<div className='mb-5'>
							<label className='form-label fw-bold'>New Expiry Date</label>
							<input
								type='date'
								className='form-control form-control-solid'
								value={renewExpiryDate}
								onChange={(e) => setRenewExpiryDate(e.target.value)}
							/>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							variant='light'
							onClick={() => setShowRenewModal(false)}
							disabled={isRenewing}>
							Cancel
						</Button>
						<Button
							variant='primary'
							onClick={handleRenewPlan}
							disabled={isRenewing}>
							{isRenewing ? 'Renewing...' : 'Renew Plan'}
						</Button>
					</Modal.Footer>
				</Modal>
			</div>
			<style>{`.client-view-box { min-height: 60px; } .client-view-boxes .fw-bold { font-size: 0.95rem; }`}</style>
		</>
	)
}

export default AdajanBranchClientView
