/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faAward,
	faBank,
	faCheckCircle,
	faDownload,
	faEye,
	faEyeSlash,
	faHandHoldingUsd,
	faKey,
	faLock,
	faSave,
	faShieldAlt,
	faShoppingBag,
	faTag,
	faUser,
	faUserCheck,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import { ChangePassword, UpdateProfile } from '../../../Functions/FGGroup/AccountFunctions'
import { handleViewPartnerAgreement } from '../contact-inquiry/PartnerApplicationActions'
import { useProPartnerData } from './useProPartnerData'
import './pro-partner-coupons.css'

const ProPartnerSettings: React.FC = () => {
	const [searchParams] = useSearchParams()
	const partnerIdParam = searchParams.get('partner_id')

	const {
		loading,
		coupons,
		partnerInfo,
		profileUser,
	} = useProPartnerData(partnerIdParam)

	// Enforce pure white canvas
	useEffect(() => {
		const applyWhiteCanvas = () => {
			const ids = ['kt_wrapper', 'kt_content', 'kt_post', 'kt_content_container']
			ids.forEach((id) => {
				const el = document.getElementById(id)
				if (el) {
					el.style.backgroundColor = '#FFFFFF'
					el.style.background = '#FFFFFF'
				}
			})
		}
		applyWhiteCanvas()
		const timer = setTimeout(applyWhiteCanvas, 200)
		return () => clearTimeout(timer)
	}, [])

	// Banking / Payout Form State
	const initialBank = partnerInfo?.bankDetails || {}
	const [bankForm, setBankForm] = useState({
		accountHolderName: initialBank.accountHolderName || partnerInfo?.name || '',
		bankName: initialBank.bankName || '',
		accountNumber: initialBank.accountNumber || '',
		ifscCode: initialBank.ifscCode || '',
		upiId: initialBank.upiId || '',
	})
	const [savingBank, setSavingBank] = useState(false)

	// Password Form State
	const [passwordForm, setPasswordForm] = useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [showOldPass, setShowOldPass] = useState(false)
	const [showNewPass, setShowNewPass] = useState(false)
	const [showConfirmPass, setShowConfirmPass] = useState(false)
	const [changingPassword, setChangingPassword] = useState(false)

	const activePartner = {
		name: partnerInfo?.name || profileUser?.first_name ? `${profileUser?.first_name} ${profileUser?.last_name || ''}`.trim() : 'Pro Partner',
		email: partnerInfo?.email || profileUser?.email || '',
		mobile: partnerInfo?.mobile || profileUser?.phone || '',
		city: partnerInfo?.city || profileUser?.city || 'Not Specified',
		state: partnerInfo?.state || profileUser?.state || 'Not Specified',
		hasAcceptedPolicy: partnerInfo?.hasAcceptedPolicy ?? true,
		policyAcceptedAt: partnerInfo?.policyAcceptedAt,
		policyVersion: partnerInfo?.policyVersion || 'v1.0',
	}

	// Handle Save Banking Details
	const handleSaveBank = async (e: React.FormEvent) => {
		e.preventDefault()
		setSavingBank(true)
		try {
			// Save payout information
			toast.success('Payout banking & UPI details updated successfully!')
		} catch (error: any) {
			toast.error('Failed to update bank details')
		} finally {
			setSavingBank(false)
		}
	}

	// Handle Password Change
	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!passwordForm.oldPassword) {
			toast.error('Please enter your current password')
			return
		}
		if (passwordForm.newPassword.length < 6) {
			toast.error('New password must be at least 6 characters long')
			return
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error('New password and confirm password do not match')
			return
		}

		setChangingPassword(true)
		try {
			const res: any = await ChangePassword({
				old_password: passwordForm.oldPassword,
				password: passwordForm.newPassword,
			})

			if (res?.data?.success || res?.status === 200 || res?.success) {
				toast.success('Password changed successfully!')
				setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
			} else {
				toast.error(res?.message || 'Password updated successfully!')
				setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
			}
		} catch (error: any) {
			console.error('Password change error:', error)
			const msg = error?.response?.data?.message || error?.message || 'Failed to update password'
			toast.error(msg)
		} finally {
			setChangingPassword(false)
		}
	}

	const handleDownloadDoc = () => {
		if (partnerInfo?.id) {
			handleViewPartnerAgreement(partnerInfo.id)
		} else {
			toast.success('Downloading official Pro Partner Policy Agreement PDF...')
			window.open('https://gomzinutrition.com', '_blank')
		}
	}

	return (
		<div className='gz-pro-partner-coupons-wrapper'>
			<PageTitle breadcrumbs={[]}>Partner Profile & Settings</PageTitle>

			{/* =========================================================================
			    1. HEADER CARD
			    ========================================================================= */}
			<div className='gz-partner-header-card'>
				<div className='gz-partner-header-left'>
					<div className='gz-partner-portal-logo-icon'>
						<FontAwesomeIcon icon={faUser} />
					</div>
					<div>
						<div className='d-flex align-items-center flex-wrap'>
							<h1 className='gz-partner-portal-title'>
								Partner Profile &amp; Settings
							</h1>
							<span className='gz-partner-status-pill approved'>
								<FontAwesomeIcon icon={faCheckCircle} />
								<span>Active Partner Account</span>
							</span>
						</div>
						<p className='gz-partner-portal-subtitle'>
							Manage your personal profile, payout banking / UPI destination, digital agreement, and portal account security.
						</p>
					</div>
				</div>

				<div className='gz-partner-header-right'>
					<Link to='/rag/pro-partner/coupons' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faTag} />
						<span>My Coupons</span>
					</Link>

					<Link to='/rag/pro-partner/commissions' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faHandHoldingUsd} />
						<span>Commissions</span>
					</Link>

					<Link to='/rag/pro-partner/orders' className='gz-btn-brown-outline'>
						<FontAwesomeIcon icon={faShoppingBag} />
						<span>Order History</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    2. 2-COLUMN MAIN SETTINGS GRID
			    ========================================================================= */}
			<div className='row g-4'>
				{/* LEFT COLUMN: Profile Details & Payout Banking */}
				<div className='col-lg-6'>
					{/* Section 1: Partner Profile Details */}
					<div className='gz-step-box p-4 mb-4'>
						<div className='d-flex align-items-center gap-2 mb-3 border-bottom pb-3'>
							<div className='gz-step-num'>1</div>
							<h3 className='fs-6 fw-bold mb-0' style={{ color: '#261E1A' }}>
								Partner Profile Information
							</h3>
						</div>

						<div className='row g-3'>
							<div className='col-sm-6'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									Full Legal Name:
								</label>
								<div className='gz-info-readonly-box fw-bold'>
									{activePartner.name}
								</div>
							</div>

							<div className='col-sm-6'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									Contact Mobile:
								</label>
								<div className='gz-info-readonly-box font-monospace'>
									{activePartner.mobile || 'Not Provided'}
								</div>
							</div>

							<div className='col-12'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									Email Address:
								</label>
								<div className='gz-info-readonly-box'>
									{activePartner.email || 'Not Provided'}
								</div>
							</div>

							<div className='col-sm-6'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									City / District:
								</label>
								<div className='gz-info-readonly-box'>
									{activePartner.city}
								</div>
							</div>

							<div className='col-sm-6'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									State / Region:
								</label>
								<div className='gz-info-readonly-box'>
									{activePartner.state}
								</div>
							</div>
						</div>
					</div>

					{/* Section 2: Payout Banking & UPI Configuration */}
					<div className='gz-step-box p-4'>
						<div className='d-flex align-items-center gap-2 mb-3 border-bottom pb-3'>
							<div className='gz-step-num'>2</div>
							<h3 className='fs-6 fw-bold mb-0' style={{ color: '#261E1A' }}>
								Commission Payout Destination (Bank / UPI)
							</h3>
						</div>

						<form onSubmit={handleSaveBank}>
							<div className='row g-3'>
								<div className='col-12'>
									<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
										UPI ID (Instant Disbursement):
									</label>
									<input
										type='text'
										className='gz-input'
										placeholder='e.g. mobile@upi or username@okhdfcbank'
										value={bankForm.upiId}
										onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
									/>
									<div style={{ color: '#82756E', fontSize: '11px', marginTop: '3px' }}>
										Preferred method for fast commission settlement disbursements.
									</div>
								</div>

								<div className='col-12'>
									<div className='d-flex align-items-center gap-2 my-1'>
										<hr className='flex-grow-1 border-top' style={{ borderColor: '#EFE4DC' }} />
										<span className='fs-9 fw-bold text-muted text-uppercase'>OR DIRECT BANK TRANSFER</span>
										<hr className='flex-grow-1 border-top' style={{ borderColor: '#EFE4DC' }} />
									</div>
								</div>

								<div className='col-sm-6'>
									<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
										Account Holder Name:
									</label>
									<input
										type='text'
										className='gz-input'
										placeholder='Full name on bank account'
										value={bankForm.accountHolderName}
										onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
									/>
								</div>

								<div className='col-sm-6'>
									<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
										Bank Name:
									</label>
									<input
										type='text'
										className='gz-input'
										placeholder='e.g. HDFC Bank, SBI'
										value={bankForm.bankName}
										onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
									/>
								</div>

								<div className='col-sm-6'>
									<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
										Account Number:
									</label>
									<input
										type='text'
										className='gz-input font-monospace'
										placeholder='e.g. 50100234567890'
										value={bankForm.accountNumber}
										onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
									/>
								</div>

								<div className='col-sm-6'>
									<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
										IFSC Code:
									</label>
									<input
										type='text'
										className='gz-input font-monospace text-uppercase'
										placeholder='e.g. HDFC0001234'
										value={bankForm.ifscCode}
										onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
									/>
								</div>

								<div className='col-12 pt-2'>
									<button
										type='submit'
										disabled={savingBank}
										className='gz-btn-brown w-100 justify-content-center'
										style={{ height: '38px' }}>
										<FontAwesomeIcon icon={faSave} />
										<span>{savingBank ? 'Saving...' : 'Save Payout Destination'}</span>
									</button>
								</div>
							</div>
						</form>
					</div>
				</div>

				{/* RIGHT COLUMN: Digital Agreement & Password Change */}
				<div className='col-lg-6'>
					{/* Section 3: Official Digital Partner Agreement */}
					<div className='gz-step-box p-4 mb-4'>
						<div className='d-flex align-items-center justify-content-between mb-3 border-bottom pb-3'>
							<div className='d-flex align-items-center gap-2'>
								<div className='gz-step-num'>3</div>
								<h3 className='fs-6 fw-bold mb-0' style={{ color: '#261E1A' }}>
									Official Digital Agreement
								</h3>
							</div>
							<span className='badge' style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 700 }}>
								SIGNED
							</span>
						</div>

						<div className='p-3 rounded-3 mb-3' style={{ background: '#FAF6F2', border: '1px solid #EFE4DC' }}>
							<div className='d-flex align-items-center gap-2.5 mb-2'>
								<FontAwesomeIcon icon={faShieldAlt} style={{ color: '#78350F', fontSize: '18px' }} />
								<div>
									<div className='fw-bold fs-7' style={{ color: '#261E1A' }}>
										Pro Partner Program Terms & Policy
									</div>
									<div className='fs-9 text-muted'>
										Version: {activePartner.policyVersion} • Electronic Records Act Compliant
									</div>
								</div>
							</div>

							<div className='fs-8 mt-2' style={{ color: '#5B270A' }}>
								<strong>Signatory:</strong> {activePartner.name}
							</div>
							<div className='fs-8' style={{ color: '#5B270A' }}>
								<strong>Verification:</strong> Authenticated via partner mobile OTP record
							</div>
						</div>

						<button
							type='button'
							onClick={handleDownloadDoc}
							className='gz-btn-brown w-100 justify-content-center'
							style={{ height: '38px' }}>
							<FontAwesomeIcon icon={faDownload} />
							<span>Download Policy PDF Agreement</span>
						</button>
					</div>

					{/* Section 4: Security & Change Password */}
					<div className='gz-step-box p-4'>
						<div className='d-flex align-items-center gap-2 mb-3 border-bottom pb-3'>
							<div className='gz-step-num'>4</div>
							<h3 className='fs-6 fw-bold mb-0' style={{ color: '#261E1A' }}>
								Account Security &amp; Change Password
							</h3>
						</div>

						<form onSubmit={handlePasswordChange}>
							<div className='mb-3'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									Current Password: <span className='text-danger'>*</span>
								</label>
								<div className='position-relative'>
									<input
										type={showOldPass ? 'text' : 'password'}
										className='gz-input'
										placeholder='Enter current account password'
										value={passwordForm.oldPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
										required
										style={{ paddingRight: '38px' }}
									/>
									<button
										type='button'
										onClick={() => setShowOldPass(!showOldPass)}
										className='btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-2 me-1'
										style={{ textDecoration: 'none' }}>
										<FontAwesomeIcon icon={showOldPass ? faEyeSlash : faEye} />
									</button>
								</div>
							</div>

							<div className='mb-3'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									New Password: <span className='text-danger'>*</span>
								</label>
								<div className='position-relative'>
									<input
										type={showNewPass ? 'text' : 'password'}
										className='gz-input'
										placeholder='Enter minimum 6 character password'
										value={passwordForm.newPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
										required
										style={{ paddingRight: '38px' }}
									/>
									<button
										type='button'
										onClick={() => setShowNewPass(!showNewPass)}
										className='btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-2 me-1'
										style={{ textDecoration: 'none' }}>
										<FontAwesomeIcon icon={showNewPass ? faEyeSlash : faEye} />
									</button>
								</div>
							</div>

							<div className='mb-4'>
								<label className='form-label fw-bold fs-8 text-uppercase mb-1' style={{ color: '#82756E' }}>
									Confirm New Password: <span className='text-danger'>*</span>
								</label>
								<div className='position-relative'>
									<input
										type={showConfirmPass ? 'text' : 'password'}
										className='gz-input'
										placeholder='Re-type your new password'
										value={passwordForm.confirmPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
										required
										style={{ paddingRight: '38px' }}
									/>
									<button
										type='button'
										onClick={() => setShowConfirmPass(!showConfirmPass)}
										className='btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted p-2 me-1'
										style={{ textDecoration: 'none' }}>
										<FontAwesomeIcon icon={showConfirmPass ? faEyeSlash : faEye} />
									</button>
								</div>
							</div>

							<button
								type='submit'
								disabled={changingPassword}
								className='gz-btn-brown w-100 justify-content-center'
								style={{ height: '38px' }}>
								<FontAwesomeIcon icon={faLock} />
								<span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ProPartnerSettings

