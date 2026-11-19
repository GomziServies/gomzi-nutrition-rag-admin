import {
	faArrowRight,
	faCheck,
	faCheckCircle,
	faCopy,
	faEnvelope,
	faExclamationTriangle,
	faEye,
	faEyeSlash,
	faKey,
	faPaperPlane,
	faRedo,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import {
	CreatePartnerAccount,
	PartnerAccountResponseData,
} from '../../../Functions/FGGroup/ContactInquiry'
import './PartnerAccountModal.css'

const PARTNER_PORTAL_LOGIN_URL = 'https://admin.ragnutrition.in/rag/login'

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

	const applicantName = (inquiry?.details?.full_name || inquiry?.name || 'Partner Applicant').trim()
	const rawEmail = (inquiry?.email || inquiry?.details?.email || '').trim().toLowerCase()
	const applicantMobile = (inquiry?.mobile || inquiry?.details?.mobile || 'N/A').trim()
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

		const payload = [
			'RAG Pro Partner Portal Credentials',
			'==================================',
			`Portal Login: ${PARTNER_PORTAL_LOGIN_URL}`,
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

	const initials = applicantName
		.split(/\s+/)
		.slice(0, 2)
		.map((part: string) => part[0])
		.join('')
		.toUpperCase()

	return (
		<Modal
			show={show}
			onHide={() => {
				if (!loading) onClose()
			}}
			centered
			scrollable
			className='partner-account-modal'
			backdropClassName='partner-account-backdrop'
			backdrop={loading ? 'static' : true}
			keyboard={!loading}
			aria-labelledby='partner-account-modal-title'
			aria-describedby='partner-account-modal-description'
			onClick={(event: React.MouseEvent) => event.stopPropagation()}>
			<Modal.Header closeButton={!loading}>
				<div className='partner-account-heading'>
					<span
						className='partner-account-heading-icon'
						aria-hidden='true'>
						<FontAwesomeIcon icon={faUserShield} />
					</span>
					<div>
						<Modal.Title id='partner-account-modal-title'>
							{credentials ? 'Partner login details' : 'Create partner account'}
						</Modal.Title>
						<p id='partner-account-modal-description'>
							{credentials
								? 'Manage this partner’s access and share their login details.'
								: 'Give your approved partner access to their own portal.'}
						</p>
					</div>
				</div>
			</Modal.Header>

			<Modal.Body aria-busy={loading}>
				{error && (
					<div
						className='partner-account-notice is-error'
						role='alert'>
						<FontAwesomeIcon icon={faExclamationTriangle} />
						<div>
							<strong>Could not update partner access</strong>
							<p>{error}</p>
						</div>
					</div>
				)}

				<section
					className='partner-account-applicant'
					aria-label='Applicant details'>
					<div className='partner-account-applicant-header'>
						<div className='partner-account-identity'>
							<span
								className='partner-account-avatar'
								aria-hidden='true'>
								{initials}
							</span>
							<div>
								<span className='partner-account-label'>Partner applicant</span>
								<h3>{applicantName}</h3>
							</div>
						</div>
						<span className='partner-account-status'>
							<FontAwesomeIcon icon={faCheckCircle} /> Approved
						</span>
					</div>
					<dl className='partner-account-details'>
						<div>
							<dt>Email address</dt>
							<dd>{rawEmail || 'No email provided'}</dd>
						</div>
						<div>
							<dt>Contact mobile</dt>
							<dd>{applicantMobile === 'N/A' ? 'Not provided' : applicantMobile}</dd>
						</div>
						<div>
							<dt>Account type</dt>
							<dd>RAG Pro Partner</dd>
						</div>
						<div>
							<dt>Portal access</dt>
							<dd>{credentials ? 'Account created' : 'Ready to create'}</dd>
						</div>
					</dl>
				</section>

				{!credentials ? (
					<>
						<section
							className='partner-account-destination'
							aria-label='Partner portal'>
							<div className='partner-account-section-heading'>
								<span className='partner-account-destination-icon'>
									<FontAwesomeIcon icon={faArrowRight} />
								</span>
								<div>
									<h3>Their dedicated partner portal</h3>
									<p>Access to their assigned coupons, referred orders and commissions.</p>
								</div>
							</div>
							<div className='partner-account-url'>{PARTNER_PORTAL_LOGIN_URL}</div>
						</section>
						<div
							className='partner-account-notice'
							role='note'>
							<FontAwesomeIcon icon={faEnvelope} />
							<div>
								<strong>Login details delivered by email</strong>
								<p>We’ll create the account and email the partner their sign-in details.</p>
							</div>
						</div>
					</>
				) : (
					<>
						<div
							className={`partner-account-notice ${
								credentials.email_status === 'failed' ? 'is-warning' : 'is-success'
							}`}
							role={credentials.email_status === 'failed' ? 'alert' : 'status'}>
							<FontAwesomeIcon
								icon={credentials.email_status === 'failed' ? faExclamationTriangle : faCheckCircle}
							/>
							<div>
								<strong>
									{credentials.email_status === 'failed'
										? 'Account ready. Email was not delivered.'
										: 'Login details sent'}
								</strong>
								<p>
									{credentials.email_status === 'failed' ? (
										'Copy the details below to share with the partner, or retry sending the email.'
									) : (
										<>
											Login details have been emailed to{' '}
											<span className='partner-account-recipient'>{credentials.email}</span>.
										</>
									)}
								</p>
							</div>
						</div>
						<div className='partner-account-credentials'>
							{[
								{ key: 'Email', label: 'Login email', value: credentials.email, icon: faEnvelope },
								{
									key: 'Password',
									label: 'Portal password',
									value: credentials.password,
									icon: faKey,
								},
								{
									key: 'Portal URL',
									label: 'Portal login URL',
									value: PARTNER_PORTAL_LOGIN_URL,
									icon: faArrowRight,
								},
							].map((field, index) => (
								<div
									className='partner-account-field'
									key={field.key}>
									<label htmlFor={`partner-account-field-${index}`}>{field.label}</label>
									<div className='partner-account-input-group'>
										<FontAwesomeIcon
											icon={field.icon}
											className='partner-account-field-icon'
										/>
										<input
											id={`partner-account-field-${index}`}
											type={field.key === 'Password' && !showPassword ? 'password' : 'text'}
											readOnly
											value={field.value}
										/>
										{field.key === 'Password' && (
											<button
												type='button'
												className='partner-account-icon-button'
												onClick={() => setShowPassword(!showPassword)}
												aria-label={showPassword ? 'Hide password' : 'Show password'}
												aria-pressed={showPassword}>
												<FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
											</button>
										)}
										<button
											type='button'
											className='partner-account-copy-button'
											onClick={() => handleCopy(field.value, field.key)}
											aria-label={`Copy ${field.label.toLowerCase()}`}>
											<FontAwesomeIcon icon={copiedField === field.key ? faCheck : faCopy} />
											<span>{copiedField === field.key ? 'Copied' : 'Copy'}</span>
										</button>
									</div>
								</div>
							))}
						</div>
						<button
							type='button'
							className='partner-account-button is-secondary partner-account-copy-all'
							onClick={handleCopyAll}>
							<FontAwesomeIcon icon={copiedField === 'All Credentials' ? faCheck : faCopy} />
							{copiedField === 'All Credentials'
								? 'Login details copied'
								: 'Copy all login details'}
						</button>
					</>
				)}
			</Modal.Body>

			<Modal.Footer>
				<button
					type='button'
					className='partner-account-button is-secondary'
					onClick={onClose}
					disabled={loading}>
					{credentials ? 'Done' : 'Cancel'}
				</button>
				<button
					type='button'
					className='partner-account-button is-primary'
					onClick={handleGenerate}
					disabled={loading || !rawEmail}>
					{loading ? (
						<>
							<span
								className='spinner-border spinner-border-sm'
								role='status'
								aria-label='Updating partner account'
							/>
							<span>{credentials ? 'Sending email…' : 'Creating account…'}</span>
						</>
					) : (
						<>
							<FontAwesomeIcon icon={credentials ? faRedo : faPaperPlane} />
							<span>
								{credentials
									? 'Refresh & resend email'
									: error
									? 'Try again'
									: 'Create account & send email'}
							</span>
						</>
					)}
				</button>
			</Modal.Footer>
		</Modal>
	)
}

export default PartnerAccountModal
