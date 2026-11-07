import React, { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faUserShield,
	faKey,
	faCopy,
	faEye,
	faEyeSlash,
	faCheckCircle,
	faExclamationTriangle,
	faInfoCircle,
	faSpinner,
	faPaperPlane,
	faArrowRight,
	faShieldAlt,
	faEnvelope,
	faCheck,
	faRedo,
} from '@fortawesome/free-solid-svg-icons'
import {
	CreatePartnerAccount,
	PartnerAccountResponseData,
} from '../../../Functions/FGGroup/ContactInquiry'

export interface PartnerAccountModalProps {
	show: boolean
	inquiry: any
	onClose: () => void
	onUpdated?: (updatedInquiry: any) => void
	onAccountCreated?: (data: any) => void
}

/**
 * Fallback clipboard copy that works across all browser security contexts
 * and headless test environments (Jest / JSDOM)
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
	if (!text) return false
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(text)
			return true
		}
	} catch (_) {
		// Fall through to DOM fallback
	}

	try {
		const textArea = document.createElement('textarea')
		textArea.value = text
		textArea.style.position = 'fixed'
		textArea.style.opacity = '0'
		textArea.style.left = '-9999px'
		document.body.appendChild(textArea)
		textArea.focus()
		textArea.select()
		const successful = document.execCommand('copy')
		document.body.removeChild(textArea)
		return successful
	} catch (err) {
		console.error('Fallback clipboard copy failed:', err)
		return false
	}
}

// Deterministic password derivation helper: <email_prefix>1234
export const derivePartnerPassword = (email: string): string => {
	const prefix = (email || '').split('@')[0] || 'partner'
	return `${prefix}1234`
}

export const PartnerAccountModal: React.FC<PartnerAccountModalProps> = ({
	show,
	inquiry,
	onClose,
	onUpdated,
	onAccountCreated,
}) => {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [copiedField, setCopiedField] = useState<string | null>(null)
	const [credentials, setCredentials] = useState<PartnerAccountResponseData | null>(null)

	const applicantName = (
		inquiry?.details?.full_name ||
		inquiry?.name ||
		'Partner Applicant'
	).trim()
	const rawEmail = (inquiry?.email || inquiry?.details?.email || '').trim().toLowerCase()
	const applicantMobile = (
		inquiry?.mobile ||
		inquiry?.details?.mobile ||
		'N/A'
	).trim()
	const existingAccount = inquiry?.details?.partner_account

	// Initialize credentials if inquiry already has an account provisioned
	useEffect(() => {
		if (show) {
			setError(null)
			setShowPassword(false)
			setCopiedField(null)
			if (existingAccount?.created && rawEmail) {
				const activeEmail = (existingAccount.email || rawEmail).trim().toLowerCase()
				setCredentials({
					account_created: true,
					email: activeEmail,
					password: derivePartnerPassword(activeEmail),
					email_status: existingAccount.email_status || 'sent',
					is_existing: existingAccount.is_existing ?? true,
					portal_url: '/rag/pro-partner/coupons',
				})
			} else {
				setCredentials(null)
			}
		}
	}, [show, inquiry, rawEmail, existingAccount])

	const handleCopy = async (text: string, label: string) => {
		const success = await copyToClipboardSafe(text)
		if (success) {
			setCopiedField(label)
			if (label === 'All Credentials') {
				toast.success('All credentials copied to clipboard!')
			} else {
				toast.success(`${label} copied to clipboard`)
			}
			setTimeout(() => setCopiedField(null), 1800)
		} else {
			toast.error(`Could not copy ${label}`)
		}
	}

	const handleCopyAll = async () => {
		if (!credentials) return
		const origin = typeof window !== 'undefined' && window.location?.origin
			? window.location.origin
			: 'http://localhost:3000'
		const loginUrl = `${origin}/rag/login`

		const payload = [
			'RAG Pro Partner Portal Credentials',
			'==================================',
			`Portal Login: ${loginUrl}`,
			`Partner Email: ${credentials.email}`,
			`Password: ${credentials.password}`,
			'Target Portal: /rag/pro-partner/coupons',
			'Role: RAG Pro Partner',
			'==================================',
			'Note: Log in at the portal login URL above with these credentials to access your partner coupons and dashboard.',
		].join('\n')

		await handleCopy(payload, 'All Credentials')
	}

	const handleGenerate = async () => {
		if (!inquiry?._id || loading) return
		if (!rawEmail) {
			toast.error('Applicant email is required to generate credentials.')
			return
		}

		setLoading(true)
		setError(null)
		try {
			const res: any = await CreatePartnerAccount({ inquiry_id: inquiry._id })
			const data: PartnerAccountResponseData = res?.data
			if (!data) throw new Error(res?.message || 'Failed to provision partner account')

			setCredentials(data)

			const updatedInquiry = {
				...inquiry,
				details: {
					...(inquiry?.details || {}),
					partner_account: {
						created: true,
						created_at: new Date().toISOString(),
						email: data.email,
						email_status: data.email_status,
						is_existing: data.is_existing,
					},
				},
			}

			if (onUpdated) {
				onUpdated(updatedInquiry)
			}
			if (onAccountCreated) {
				onAccountCreated(data)
			}

			if (data.email_status === 'failed') {
				toast.error(
					'Credentials generated, but email delivery failed. Please copy credentials below to share manually.',
					{ duration: 5500 }
				)
			} else {
				toast.success(
					data.is_existing
						? 'Partner account verified and credentials email dispatched!'
						: 'Partner account generated and credentials email sent!'
				)
			}
		} catch (err: any) {
			console.error('Error creating partner account:', err)
			const errMsg =
				err?.response?.data?.message ||
				err?.message ||
				'Could not create partner account. Please try again.'
			setError(errMsg)
			toast.error(errMsg)
		} finally {
			setLoading(false)
		}
	}

	const originUrl = typeof window !== 'undefined' && window.location?.origin
		? window.location.origin
		: 'http://localhost:3000'
	const portalUrlPreview = `${originUrl}/rag/login`

	return (
		<Modal
			show={show}
			onHide={() => {
				if (!loading) onClose()
			}}
			size='lg'
			centered
			backdrop={loading ? 'static' : true}
			keyboard={!loading}
			aria-labelledby='partner-account-modal-title'
			onClick={(event: React.MouseEvent) => event.stopPropagation()}>
			<Modal.Header closeButton={!loading}>
				<Modal.Title id='partner-account-modal-title' className='d-flex align-items-center gap-2'>
					<FontAwesomeIcon
						icon={faUserShield}
						className={credentials ? 'text-success fs-3' : 'text-primary fs-3'}
					/>
					<div>
						<div className='fs-5 fw-bold text-dark'>
							{credentials ? 'Pro Partner Portal Credentials' : 'Pro Partner Portal Account'}
						</div>
						<div className='fs-8 text-muted fw-normal'>
							{credentials
								? 'Active authentication credentials for partner portal access'
								: 'Provision dedicated credentials with strict RBAC portal redirection'}
						</div>
					</div>
				</Modal.Title>
			</Modal.Header>

			<Modal.Body className='py-4'>
				{/* In-Modal Error Alert Banner with Retry Support */}
				{error && (
					<div className='alert alert-danger d-flex align-items-center mb-4' role='alert'>
						<FontAwesomeIcon icon={faExclamationTriangle} className='fs-4 text-danger me-3 flex-shrink-0' />
						<div>
							<div className='fw-bold'>Account Generation Failed</div>
							<div className='fs-7'>{error}</div>
						</div>
					</div>
				)}

				{!credentials ? (
					/* =========================================================
					   INITIAL STATE: Account Not Yet Generated
					   ========================================================= */
					<div className='partner-account-initial-state'>
						{/* Context Overview Banner */}
						<div
							className='d-flex align-items-start gap-3 p-4 mb-4 rounded-3'
							style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
							<FontAwesomeIcon icon={faShieldAlt} className='text-primary fs-2 mt-1 flex-shrink-0' />
							<div>
								<div className='fw-bold text-primary fs-6 mb-1'>
									Pro Partner Authentication Account
								</div>
								<div className='fs-7 text-dark' style={{ lineHeight: 1.5 }}>
									Provisioning an account enables the partner to access their dedicated coupon
									management portal. Upon login, the RBAC security layer strictly isolates them
									to authorized partner endpoints.
								</div>
							</div>
						</div>

						{/* Applicant Profile Information Card */}
						<div
							className='p-4 mb-4 rounded-3'
							style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
							<div className='d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-gray-200'>
								<span className='fw-bold text-dark fs-6'>Applicant Credentials Target</span>
								<span
									className='badge'
									style={{
										background: '#ECFDF5',
										color: '#047857',
										border: '1px solid #A7F3D0',
										fontSize: '11px',
										fontWeight: 700,
										padding: '4px 8px',
										borderRadius: '6px',
									}}>
									Application Approved
								</span>
							</div>

							<div className='row g-3'>
								<div className='col-md-6'>
									<span className='text-muted fs-8 text-uppercase fw-bold d-block mb-1'>
										Applicant Legal Name
									</span>
									<span className='fw-bold text-dark fs-6'>{applicantName}</span>
								</div>

								<div className='col-md-6'>
									<span className='text-muted fs-8 text-uppercase fw-bold d-block mb-1'>
										Login Identifier (Email)
									</span>
									<span className='fw-bold text-primary fs-6 font-monospace'>
										{rawEmail || 'No email specified'}
									</span>
								</div>

								<div className='col-md-6'>
									<span className='text-muted fs-8 text-uppercase fw-bold d-block mb-1'>
										Registered Mobile
									</span>
									<span className='text-dark fs-7 font-monospace'>{applicantMobile}</span>
								</div>

								<div className='col-md-6'>
									<span className='text-muted fs-8 text-uppercase fw-bold d-block mb-1'>
										Assigned Security Role
									</span>
									<span className='badge badge-light-primary font-monospace fw-bold'>
										RAG_Pro_Partner
									</span>
								</div>
							</div>
						</div>

						{/* Portal Destination & Redirection Lockdown Notice */}
						<div
							className='p-4 mb-4 rounded-3'
							style={{ background: '#FFFFFF', border: '1px solid #DFE7F0' }}>
							<div className='d-flex align-items-start gap-3'>
								<div
									className='d-inline-flex align-items-center justify-content-center flex-shrink-0 mt-1 rounded-circle'
									style={{
										width: '32px',
										height: '32px',
										background: '#EEF2FF',
										color: '#4F46E5',
									}}>
									<FontAwesomeIcon icon={faArrowRight} />
								</div>
								<div className='flex-grow-1'>
									<div className='fw-bold text-dark fs-6 mb-1'>
										Strict Portal Redirection Route
									</div>
									<div className='fs-7 text-muted mb-2'>
										Upon successful authentication, partner sessions are strictly locked to:
									</div>
									<div className='d-inline-flex align-items-center gap-2 px-3 py-2 bg-light rounded border font-monospace text-primary fw-bold fs-7 mb-2'>
										<span>/rag/pro-partner/coupons</span>
									</div>
									<div className='fs-8 text-muted'>
										Administrative routes (Dashboard, Deals, Inventory, HR) are completely
										inaccessible to this role and will immediately redirect to the coupon portal.
									</div>
								</div>
							</div>
						</div>

						{/* Deterministic Rule Informational Banner */}
						<div
							className='p-3 rounded-2 d-flex align-items-center gap-2 fs-7'
							style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
							<FontAwesomeIcon icon={faKey} className='text-warning' />
							<span>
								Auto-generated password follows deterministic rule:{' '}
								<strong className='font-monospace'>
									{rawEmail ? derivePartnerPassword(rawEmail) : '<email_prefix>1234'}
								</strong>
							</span>
						</div>
					</div>
				) : (
					/* =========================================================
					   RESULT STATE: Credentials Generated / Existing Account
					   ========================================================= */
					<div className='partner-account-result-state'>
						{/* Delivery Status Banner */}
						{credentials.email_status === 'failed' ? (
							<div className='alert alert-warning d-flex align-items-start gap-3 p-4 mb-4 rounded-3 border-warning shadow-sm' role='alert'>
								<FontAwesomeIcon
									icon={faExclamationTriangle}
									className='text-warning fs-2 mt-1 flex-shrink-0'
								/>
								<div>
									<div className='d-flex align-items-center gap-2 mb-1'>
										<span className='badge bg-warning text-dark fw-bold text-uppercase' style={{ fontSize: '10px' }}>
											Email Delivery Failed
										</span>
										<strong className='text-warning-emphasis fs-6'>
											Notice: Automated Email Could Not Be Sent
										</strong>
									</div>
									<div className='fs-7 text-dark' style={{ lineHeight: 1.5 }}>
										The credentials were created successfully, but the email notification service
										could not deliver to the applicant (SMTP unavailable).{' '}
										<strong>Please manually copy the credentials below and provide them to the partner</strong> via WhatsApp, SMS, or direct contact.
									</div>
								</div>
							</div>
						) : (
							<div className='alert alert-success d-flex align-items-start gap-3 p-4 mb-4 rounded-3 border-success shadow-sm' role='alert'>
								<FontAwesomeIcon
									icon={faCheckCircle}
									className='text-success fs-2 mt-1 flex-shrink-0'
								/>
								<div>
									<div className='d-flex align-items-center gap-2 mb-1'>
										<span className='badge bg-success text-white fw-bold text-uppercase' style={{ fontSize: '10px' }}>
											Email Sent
										</span>
										<strong className='text-success fs-6'>
											Credentials Notification Dispatched
										</strong>
									</div>
									<div className='fs-7 text-dark' style={{ lineHeight: 1.5 }}>
										Login credentials have been successfully emailed to{' '}
										<strong>{credentials.email}</strong> (chiragpandey600@gmail.com in CC).
									</div>
								</div>
							</div>
						)}

						{/* Existing Account Context Notice */}
						{credentials.is_existing && (
							<div className='alert alert-primary d-flex align-items-center gap-3 py-2 px-3 mb-4 rounded fs-7'>
								<FontAwesomeIcon icon={faInfoCircle} className='text-primary' />
								<div>
									<span className='badge bg-light-primary text-primary fw-bold text-uppercase me-2' style={{ fontSize: '10px' }}>
										Account Active
									</span>
									<span>Pro Partner portal account is active in the system.</span>
								</div>
							</div>
						)}

						{/* Credentials Fields Box */}
						<div
							className='p-4 mb-4 rounded-3'
							style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
							{/* Login Identifier */}
							<div className='mb-3'>
								<label className='form-label text-dark fw-bold fs-7 mb-1'>
									Partner Login Identifier (Email)
								</label>
								<div className='input-group'>
									<span className='input-group-text bg-white border-end-0 text-muted'>
										<FontAwesomeIcon icon={faEnvelope} />
									</span>
									<input
										type='text'
										readOnly
										className='form-control form-control-solid font-monospace fw-bold bg-white text-dark'
										value={credentials.email}
										aria-label='Partner Login Identifier'
									/>
									<button
										type='button'
										className={`btn ${copiedField === 'Email' ? 'btn-success' : 'btn-light-primary'} d-inline-flex align-items-center gap-1`}
										onClick={() => handleCopy(credentials.email, 'Email')}
										title='Copy Login Email'>
										<FontAwesomeIcon icon={copiedField === 'Email' ? faCheck : faCopy} />
										<span>{copiedField === 'Email' ? 'Copied' : 'Copy'}</span>
									</button>
								</div>
							</div>

							{/* Generated Password with Visibility Toggle */}
							<div className='mb-3'>
								<div className='d-flex justify-content-between align-items-center mb-1'>
									<label className='form-label text-dark fw-bold fs-7 mb-0'>
										Generated Portal Password
									</label>
									<span className='fs-8 text-muted font-monospace'>Rule: &lt;email_prefix&gt;1234</span>
								</div>
								<div className='input-group'>
									<span className='input-group-text bg-white border-end-0 text-muted'>
										<FontAwesomeIcon icon={faKey} />
									</span>
									<input
										type={showPassword ? 'text' : 'password'}
										readOnly
										className='form-control form-control-solid font-monospace fw-bold bg-white text-dark'
										value={credentials.password}
										aria-label='Generated Portal Password'
									/>
									<button
										type='button'
										className='btn btn-light-secondary d-inline-flex align-items-center'
										onClick={() => setShowPassword(!showPassword)}
										title={showPassword ? 'Hide Password' : 'Show Password'}>
										<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
									</button>
									<button
										type='button'
										className={`btn ${copiedField === 'Password' ? 'btn-success' : 'btn-light-primary'} d-inline-flex align-items-center gap-1`}
										onClick={() => handleCopy(credentials.password, 'Password')}
										title='Copy Password'>
										<FontAwesomeIcon icon={copiedField === 'Password' ? faCheck : faCopy} />
										<span>{copiedField === 'Password' ? 'Copied' : 'Copy'}</span>
									</button>
								</div>
							</div>

							{/* Portal Destination Route */}
							<div className='mb-0'>
								<label className='form-label text-dark fw-bold fs-7 mb-1'>
									Portal Destination URL
								</label>
								<div className='input-group'>
									<span className='input-group-text bg-white border-end-0 text-muted'>
										<FontAwesomeIcon icon={faArrowRight} />
									</span>
									<input
										type='text'
										readOnly
										className='form-control form-control-solid font-monospace bg-white text-dark fs-8'
										value={`${portalUrlPreview} (→ ${credentials.portal_url || '/rag/pro-partner/coupons'})`}
										aria-label='Portal Destination URL'
									/>
									<button
										type='button'
										className={`btn ${copiedField === 'Portal URL' ? 'btn-success' : 'btn-light-primary'} d-inline-flex align-items-center gap-1`}
										onClick={() => handleCopy(portalUrlPreview, 'Portal URL')}
										title='Copy Portal Login URL'>
										<FontAwesomeIcon icon={copiedField === 'Portal URL' ? faCheck : faCopy} />
										<span>{copiedField === 'Portal URL' ? 'Copied' : 'Copy'}</span>
									</button>
								</div>
							</div>
						</div>

						{/* Primary Action: Copy All Credentials */}
						<button
							type='button'
							className={`btn ${copiedField === 'All Credentials' ? 'btn-success' : 'btn-primary'} fw-bold py-3 w-100 d-inline-flex align-items-center justify-content-center gap-2 mb-2 shadow-sm`}
							onClick={handleCopyAll}
							style={{ fontSize: '14px' }}>
							<FontAwesomeIcon icon={copiedField === 'All Credentials' ? faCheck : faCopy} />
							<span>
								{copiedField === 'All Credentials'
									? 'Copied!'
									: 'Copy All Credentials'}
							</span>
						</button>
					</div>
				)}
			</Modal.Body>

			<Modal.Footer className='d-flex justify-content-between align-items-center'>
				<button
					type='button'
					className='btn btn-light'
					onClick={onClose}
					disabled={loading}>
					Close
				</button>

				{!credentials ? (
					<button
						type='button'
						className='btn btn-primary fw-bold d-inline-flex align-items-center gap-2'
						onClick={handleGenerate}
						disabled={loading || !rawEmail}>
						{loading ? (
							<>
								<span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true' />
								<span>Generating Credentials...</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faPaperPlane} />
								<span>{error ? 'Retry Account Generation' : 'Generate Credentials & Send Notification'}</span>
							</>
						)}
					</button>
				) : (
					<button
						type='button'
						className='btn btn-light-primary d-inline-flex align-items-center gap-2'
						onClick={handleGenerate}
						disabled={loading}>
						{loading ? (
							<>
								<span className='spinner-border spinner-border-sm me-1' role='status' aria-hidden='true' />
								<span>Updating…</span>
							</>
						) : (
							<>
								<FontAwesomeIcon icon={faRedo} />
								<span>Re-send / Refresh Credentials</span>
							</>
						)}
					</button>
				)}
			</Modal.Footer>
		</Modal>
	)
}

export default PartnerAccountModal
