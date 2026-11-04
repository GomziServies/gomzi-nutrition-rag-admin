import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faFileAlt } from '@fortawesome/free-solid-svg-icons'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import {
	PartnerApplicationStatus,
	ReviewPartnerApplication,
	DownloadPartnerAgreementPDF,
} from '../../../Functions/FGGroup/ContactInquiry'
import './PartnerApplicationActions.css'

export const getPartnerApplicationStatus = (inquiry: any): PartnerApplicationStatus =>
	inquiry?.partner_status === 'approved' || inquiry?.partner_status === 'rejected'
		? inquiry.partner_status
		: 'pending'

export async function handleViewPartnerAgreement(inquiryId: string) {
	try {
		const toastId = toast.loading('Loading agreement PDF...')
		const { blob, filename } = await DownloadPartnerAgreementPDF(inquiryId)
		toast.dismiss(toastId)
		const url = window.URL.createObjectURL(blob)
		const win = window.open(url, '_blank')
		if (!win) {
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
		}
		toast.success('Agreement PDF loaded')
	} catch (error: any) {
		console.error('Failed to open agreement PDF:', error)
		toast.error(error?.response?.data?.message || error?.message || 'Could not load agreement PDF')
	}
}

export function PartnerStatusBadge({ inquiry }: { inquiry: any }) {
	const status = getPartnerApplicationStatus(inquiry)
	return (
		<span
			className={`badge badge-light-${
				status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'
			}`}>
			{status === 'approved' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Pending'}
		</span>
	)
}

export default function PartnerApplicationActions({
	inquiry,
	onUpdated,
	compact = false,
	children,
}: {
	inquiry: any
	onUpdated: (updated: any) => void
	compact?: boolean
	children?: React.ReactNode
}) {
	const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
	const [reason, setReason] = useState('')
	const [saving, setSaving] = useState(false)
	const [resending, setResending] = useState(false)
	const status = getPartnerApplicationStatus(inquiry)
	const name = inquiry?.details?.full_name || inquiry?.name || 'this applicant'

	const saveDecision = async (event: React.FormEvent) => {
		event.preventDefault()
		if (!decision || saving) return
		setSaving(true)
		try {
			const result = await ReviewPartnerApplication({
				inquiry_id: inquiry._id,
				partner_status: decision,
				expected_status: status,
				reason,
			})
			onUpdated(result.data)
			if (decision === 'approved' && result.data?.partner_policy?.email_status === 'failed') {
				toast.error(
					'Application accepted, but the approval email failed. Use Resend policy email to retry.'
				)
			} else {
				toast.success(
					decision === 'approved'
						? 'Application accepted and policy email sent'
						: 'Application rejected and notification email sent'
				)
			}
			setDecision(null)
			setReason('')
		} catch (error: any) {
			toast.error(error?.message || 'Could not save the decision. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	const resendPolicy = async (event: React.MouseEvent) => {
		event.stopPropagation()
		if (resending || saving) return
		setResending(true)
		try {
			const result = await ReviewPartnerApplication({
				inquiry_id: inquiry._id,
				partner_status: 'approved',
				expected_status: 'approved',
				reason: inquiry.partner_review_reason || '',
			})
			onUpdated(result.data)
			if (result.data?.partner_policy?.email_status === 'failed')
				toast.error('Email failed. Check the API mail settings and try again.')
			else toast.success('Policy email sent to the applicant with chiragpandey600@gmail.com in CC')
		} catch (error: any) {
			toast.error(error?.message || 'Could not resend the policy email')
		} finally {
			setResending(false)
		}
	}

	return (
		<>
			<div className={compact ? 'gz-partner-controls' : 'd-flex flex-wrap gap-2'}>
				{status !== 'approved' && (
					<button
						type='button'
						className={compact ? 'gz-partner-button gz-partner-button-accept' : 'btn btn-sm btn-light-success'}
						title='Accept application and issue demo policy'
						disabled={saving || resending}
						onClick={(event) => {
							event.stopPropagation()
							setReason('')
							setDecision('approved')
						}}>
						Accept
					</button>
				)}
				{status !== 'rejected' && (
					<button
						type='button'
						className={compact ? 'gz-partner-button gz-partner-button-reject' : 'btn btn-sm btn-light-danger'}
						title='Reject application'
						disabled={saving || resending}
						onClick={(event) => {
							event.stopPropagation()
							setReason('')
							setDecision('rejected')
						}}>
						Reject
					</button>
				)}
				{status === 'approved' && !inquiry.partner_policy?.accepted_at && (
					<button
						type='button'
						className={compact ? 'gz-partner-button gz-partner-button-resend' : 'btn btn-sm btn-light-primary'}
						title='Resend policy email'
						disabled={saving || resending}
						onClick={resendPolicy}>
						{resending ? 'Sending…' : compact ? 'Resend' : 'Resend policy email'}
					</button>
				)}
				{inquiry.partner_policy?.version && (
					<button
						type='button'
						className={
							compact
								? `gz-partner-button ${inquiry.partner_policy?.accepted_at ? 'gz-partner-button-accepted-pdf' : 'gz-partner-button-pdf'}`
								: `btn btn-sm ${inquiry.partner_policy?.accepted_at ? 'btn-light-success' : 'btn-light-secondary'}`
						}
						title={inquiry.partner_policy?.accepted_at ? 'View Accepted Agreement PDF' : 'View Draft Agreement PDF'}
						onClick={(event) => {
							event.stopPropagation()
							handleViewPartnerAgreement(inquiry._id)
						}}>
						<FontAwesomeIcon icon={inquiry.partner_policy?.accepted_at ? faDownload : faFileAlt} />
						{compact ? (inquiry.partner_policy?.accepted_at ? 'PDF' : 'Draft') : (inquiry.partner_policy?.accepted_at ? 'Accepted PDF' : 'Draft PDF')}
					</button>
				)}
				{children}
			</div>
			<Modal
				onClick={(event: React.MouseEvent) => event.stopPropagation()}
				show={decision !== null}
				onHide={() => {
					if (!saving) setDecision(null)
				}}
				centered
				backdrop={saving ? 'static' : true}
				keyboard={!saving}
				aria-labelledby='partner-review-title'>
				<form onSubmit={saveDecision}>
					<Modal.Header closeButton={!saving}>
						<Modal.Title id='partner-review-title'>
							{decision === 'approved' ? 'Accept Application' : 'Reject Application'}
						</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<p>
							{decision === 'approved'
								? `Accept ${name}'s Pro Partner application? An approval email and demo policy link will be sent to the applicant, with chiragpandey600@gmail.com in CC.`
								: `Reject ${name}'s Pro Partner application? A rejection notification email will be sent to the applicant, with chiragpandey600@gmail.com in CC.`}
						</p>
						<label
							htmlFor='partner-review-reason'
							className='form-label'>
							{decision === 'rejected' ? 'Rejection reason (optional)' : 'Review note (optional)'}
						</label>
						<textarea
							id='partner-review-reason'
							className='form-control'
							rows={3}
							maxLength={2000}
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							disabled={saving}
						/>
					</Modal.Body>
					<Modal.Footer>
						<button
							type='button'
							className='btn btn-light'
							onClick={() => setDecision(null)}
							disabled={saving}>
							Cancel
						</button>
						<button
							type='submit'
							className={`btn btn-${decision === 'approved' ? 'success' : 'danger'}`}
							disabled={saving}>
							{saving ? 'Saving…' : decision === 'approved' ? 'Accept Application' : 'Reject Application'}
						</button>
					</Modal.Footer>
				</form>
			</Modal>
		</>
	)
}

export function PartnerReviewDetails({ inquiry }: { inquiry: any }) {
	const status = getPartnerApplicationStatus(inquiry)
	if (status === 'pending') return null
	const reviewer = inquiry.partner_reviewed_by
	const reviewerName = reviewer ? `${reviewer.name || ''} (${reviewer.email || ''})`.trim() : ''
	return (
		<div className='fs-8 text-muted mt-1'>
			{inquiry.partner_reviewed_at && (
				<div>
					{status === 'approved' ? 'Approved' : 'Rejected'}{' '}
					{DayJS(inquiry.partner_reviewed_at).format('DD/MM/YYYY hh:mm A')}
					{reviewerName ? ` by ${reviewerName}` : ''}
				</div>
			)}
			{inquiry.partner_review_reason && (
				<div className='text-danger'>
					<strong>Reason:</strong> {inquiry.partner_review_reason}
				</div>
			)}
			{status === 'approved' && (
				<div
					className={
						inquiry.partner_policy?.accepted_at ? 'text-success fw-bold' : 'text-warning'
					}>
					{inquiry.partner_policy?.accepted_at
						? `Demo policy accepted ${DayJS(inquiry.partner_policy.accepted_at).format(
								'DD/MM/YYYY hh:mm A'
						  )}`
						: inquiry.partner_policy?.email_status === 'failed'
						? 'Policy email delivery failed'
						: 'Policy sent, awaiting acceptance'}
				</div>
			)}
		</div>
	)
}

export function PartnerPolicyRecord({
	inquiry,
	onRefresh,
}: {
	inquiry: any
	onRefresh?: () => void
}) {
	const policy = inquiry.partner_policy
	if (!policy?.version) return null
	const isAccepted = Boolean(policy.accepted_at)
	return (
		<div className='gz-mgmt-card p-5 mb-6'>
			<div className='d-flex align-items-center justify-content-between gap-3 flex-wrap mb-2'>
				<h3 className='fs-4 mb-0'>Partner Policy Agreement</h3>
				<div className='d-flex gap-2 flex-wrap'>
					<button
						type='button'
						className={`btn btn-sm ${isAccepted ? 'btn-success' : 'btn-light-primary'} d-inline-flex align-items-center gap-2`}
						onClick={() => handleViewPartnerAgreement(inquiry._id)}>
						<FontAwesomeIcon icon={isAccepted ? faDownload : faFileAlt} />
						{isAccepted ? 'View Accepted Agreement (PDF)' : 'Preview Agreement (PDF)'}
					</button>
					{onRefresh && (
						<button
							type='button'
							className='btn btn-sm btn-light-primary'
							onClick={onRefresh}>
							Refresh policy status
						</button>
					)}
				</div>
			</div>
			<p className='text-warning mb-3'>
				Demo policy for workflow testing. The final policy will need separate acceptance.
			</p>
			<div className='d-flex flex-wrap gap-3 mb-3'>
				<span className={`badge badge-light-${isAccepted ? 'success' : 'warning'}`}>
					{isAccepted ? 'Policy Accepted' : 'Awaiting Acceptance'}
				</span>
				<span>
					Version: <strong>{policy.version}</strong>
				</span>
				<span>
					Email:{' '}
					<strong>
						{policy.email_status === 'sent'
							? 'Sent'
							: policy.email_status === 'failed'
							? 'Failed'
							: 'Sending'}
					</strong>
				</span>
			</div>
			{isAccepted && (
				<div className='alert alert-success d-flex align-items-center justify-content-between flex-wrap gap-2 py-3 px-4 mb-4 rounded'>
					<div>
						<div className='fw-bold text-success'>Agreement Accepted &amp; Verified</div>
						<div className='fs-7 text-dark'>
							Accepted by <strong>{policy.accepted_name}</strong> ({policy.accepted_email}) on{' '}
							{DayJS(policy.accepted_at).format('DD/MM/YYYY hh:mm:ss A')}.
						</div>
						<div className='fs-8 text-muted mt-1'>
							Verification Method: One-Time Password (OTP) Verified via Email
						</div>
					</div>
					<button
						type='button'
						className='btn btn-sm btn-success fw-bold d-inline-flex align-items-center gap-2'
						onClick={() => handleViewPartnerAgreement(inquiry._id)}>
						<FontAwesomeIcon icon={faDownload} /> Open Accepted PDF
					</button>
				</div>
			)}
			<details>
				<summary
					className='fw-bold'
					style={{ cursor: 'pointer' }}>
					{isAccepted ? 'View Accepted Policy' : 'View Sent Policy'}
				</summary>
				<h4 className='mt-4'>{policy.title}</h4>
				<div
					style={{
						whiteSpace: 'pre-wrap',
						overflowWrap: 'anywhere',
						maxHeight: 500,
						overflowY: 'auto',
					}}
					className='p-4 bg-light rounded mt-3'>
					{policy.text}
				</div>
			</details>
		</div>
	)
}
