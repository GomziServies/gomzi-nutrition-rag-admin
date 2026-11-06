import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'
import { CreatePartnerAccount } from '../../../Functions/FGGroup/ContactInquiry'
import PartnerAccountModal, {
	copyToClipboardSafe,
	derivePartnerPassword,
} from './PartnerAccountModal'

jest.mock('../../../Functions/FGGroup/ContactInquiry', () => ({
	CreatePartnerAccount: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
	__esModule: true,
	default: {
		success: jest.fn(),
		error: jest.fn(),
		loading: jest.fn(),
		dismiss: jest.fn(),
	},
}))

const mockCreatePartnerAccount = CreatePartnerAccount as jest.Mock
const mockToast = toast as unknown as {
	success: jest.Mock
	error: jest.Mock
}

const unprovisionedInquiry = {
	_id: 'inquiry-101',
	name: 'Jane Specialist',
	email: 'jane.specialist@gmail.com',
	mobile: '9876543210',
	partner_status: 'approved',
	details: {
		full_name: 'Jane Specialist',
		email: 'jane.specialist@gmail.com',
		mobile: '9876543210',
	},
}

const existingInquiry = {
	_id: 'inquiry-202',
	name: 'John Pro',
	email: 'john.pro@example.com',
	mobile: '9123456789',
	partner_status: 'approved',
	details: {
		full_name: 'John Pro',
		email: 'john.pro@example.com',
		mobile: '9123456789',
		partner_account: {
			created: true,
			email: 'john.pro@example.com',
			email_status: 'sent',
			is_existing: true,
			created_at: '2026-11-01T10:00:00.000Z',
		},
	},
}

describe('PartnerAccountModal Component', () => {
	let originalClipboard: any

	beforeEach(() => {
		jest.clearAllMocks()
		originalClipboard = navigator.clipboard
		Object.assign(navigator, {
			clipboard: {
				writeText: jest.fn().mockResolvedValue(undefined),
			},
		})
	})

	afterEach(() => {
		Object.assign(navigator, { clipboard: originalClipboard })
	})

	test('Test 1: Initial Render for Unprovisioned Application', () => {
		const onClose = jest.fn()
		render(
			<PartnerAccountModal
				show={true}
				inquiry={unprovisionedInquiry}
				onClose={onClose}
			/>
		)

		// Modal title
		expect(screen.getByText('Pro Partner Portal Account')).toBeInTheDocument()

		// Applicant details
		expect(screen.getByText('Jane Specialist')).toBeInTheDocument()
		expect(screen.getByText('jane.specialist@gmail.com')).toBeInTheDocument()
		expect(screen.getByText('9876543210')).toBeInTheDocument()
		expect(screen.getByText('RAG_Pro_Partner')).toBeInTheDocument()

		// Redirection route preview
		expect(screen.getByText('/rag/pro-partner/coupons')).toBeInTheDocument()

		// Deterministic password rule notice
		expect(screen.getByText(/jane.specialist1234/)).toBeInTheDocument()

		// Generate button present; credentials fields not rendered yet
		const generateBtn = screen.getByRole('button', {
			name: /Generate Credentials & Send Notification/i,
		})
		expect(generateBtn).toBeInTheDocument()
		expect(screen.queryByLabelText('Generated Portal Password')).not.toBeInTheDocument()
	})

	test('Test 2: In-Flight Loading State When Triggering Account Creation', async () => {
		let resolveApi: (value: any) => void
		const pendingPromise = new Promise((resolve) => {
			resolveApi = resolve
		})
		mockCreatePartnerAccount.mockReturnValue(pendingPromise)

		render(
			<PartnerAccountModal
				show={true}
				inquiry={unprovisionedInquiry}
				onClose={jest.fn()}
			/>
		)

		const generateBtn = screen.getByRole('button', {
			name: /Generate Credentials & Send Notification/i,
		})
		fireEvent.click(generateBtn)

		// Button should be disabled and show loading text
		expect(generateBtn).toBeDisabled()
		expect(screen.getByText(/Generating Credentials.../i)).toBeInTheDocument()

		// Close button should be disabled
		const closeBtn = screen.getByRole('button', { name: /Close/i })
		expect(closeBtn).toBeDisabled()

		// Resolve API to clean up state
		resolveApi!({
			data: {
				account_created: true,
				email: 'jane.specialist@gmail.com',
				password: 'jane.specialist1234',
				email_status: 'sent',
				is_existing: false,
				portal_url: '/rag/pro-partner/coupons',
			},
		})

		await waitFor(() => {
			expect(screen.getByText(/Credentials Notification Dispatched/i)).toBeInTheDocument()
		})
	})

	test('Test 3: Successful Account Provisioning with Email Sent (email_status === "sent")', async () => {
		mockCreatePartnerAccount.mockResolvedValueOnce({
			status: 200,
			data: {
				account_created: true,
				email: 'jane.specialist@gmail.com',
				password: 'jane.specialist1234',
				email_status: 'sent',
				is_existing: false,
				portal_url: '/rag/pro-partner/coupons',
			},
		})

		render(
			<PartnerAccountModal
				show={true}
				inquiry={unprovisionedInquiry}
				onClose={jest.fn()}
			/>
		)

		fireEvent.click(
			screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
		)

		await waitFor(() => {
			expect(screen.getByText('Email Sent')).toBeInTheDocument()
			expect(screen.getByText('Credentials Notification Dispatched')).toBeInTheDocument()
		})

		// Inputs displayed
		expect(screen.getByLabelText('Partner Login Identifier')).toHaveValue('jane.specialist@gmail.com')
		expect(screen.getByLabelText('Generated Portal Password')).toHaveValue('jane.specialist1234')
		expect(screen.getByRole('button', { name: /Copy All Credentials/i })).toBeInTheDocument()
		expect(mockToast.success).toHaveBeenCalledWith('Partner account generated and credentials email sent!')
	})

	test('Test 4: Resilient Account Provisioning When Email Delivery Fails (email_status === "failed")', async () => {
		mockCreatePartnerAccount.mockResolvedValueOnce({
			status: 200,
			data: {
				account_created: true,
				email: 'jane.specialist@gmail.com',
				password: 'jane.specialist1234',
				email_status: 'failed',
				is_existing: false,
				portal_url: '/rag/pro-partner/coupons',
			},
		})

		render(
			<PartnerAccountModal
				show={true}
				inquiry={unprovisionedInquiry}
				onClose={jest.fn()}
			/>
		)

		fireEvent.click(
			screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
		)

		await waitFor(() => {
			expect(screen.getByText('Email Delivery Failed')).toBeInTheDocument()
			expect(screen.getByText(/Notice: Automated Email Could Not Be Sent/i)).toBeInTheDocument()
			expect(screen.getByText(/Please manually copy the credentials below and provide them to the partner/i)).toBeInTheDocument()
		})

		// Credentials are fully visible and accessible
		expect(screen.getByLabelText('Partner Login Identifier')).toHaveValue('jane.specialist@gmail.com')
		expect(screen.getByLabelText('Generated Portal Password')).toHaveValue('jane.specialist1234')
		expect(mockToast.error).toHaveBeenCalledWith(
			expect.stringContaining('Credentials generated, but email delivery failed'),
			expect.any(Object)
		)
	})

	test('Test 5: Existing Account View (pre-provisioned inquiry)', () => {
		render(
			<PartnerAccountModal
				show={true}
				inquiry={existingInquiry}
				onClose={jest.fn()}
			/>
		)

		// Should immediately render credentials state
		expect(screen.getByText('Pro Partner Portal Credentials')).toBeInTheDocument()
		expect(screen.getByText('Account Active')).toBeInTheDocument()
		expect(screen.getByLabelText('Partner Login Identifier')).toHaveValue('john.pro@example.com')
		expect(screen.getByLabelText('Generated Portal Password')).toHaveValue('john.pro1234')
		expect(screen.getByRole('button', { name: /Copy All Credentials/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Re-send \/ Refresh Credentials/i })).toBeInTheDocument()
	})

	test('Test 6: Network / API Failure Handling and Retry Mechanism', async () => {
		mockCreatePartnerAccount.mockRejectedValueOnce(new Error('Network Error: Failed to reach backend'))

		render(
			<PartnerAccountModal
				show={true}
				inquiry={unprovisionedInquiry}
				onClose={jest.fn()}
			/>
		)

		fireEvent.click(
			screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
		)

		await waitFor(() => {
			expect(screen.getByText('Account Generation Failed')).toBeInTheDocument()
			expect(screen.getByText('Network Error: Failed to reach backend')).toBeInTheDocument()
			expect(mockToast.error).toHaveBeenCalledWith('Network Error: Failed to reach backend')
		})

		// Button label changed to Retry and is enabled
		const retryBtn = screen.getByRole('button', { name: /Retry Account Generation/i })
		expect(retryBtn).toBeInTheDocument()
		expect(retryBtn).toBeEnabled()

		// Clicking Retry triggers CreatePartnerAccount again
		mockCreatePartnerAccount.mockResolvedValueOnce({
			data: {
				account_created: true,
				email: 'jane.specialist@gmail.com',
				password: 'jane.specialist1234',
				email_status: 'sent',
				is_existing: false,
				portal_url: '/rag/pro-partner/coupons',
			},
		})
		fireEvent.click(retryBtn)

		await waitFor(() => {
			expect(screen.getByText('Credentials Notification Dispatched')).toBeInTheDocument()
		})
		expect(mockCreatePartnerAccount).toHaveBeenCalledTimes(2)
	})

	test('Test 7: Single Item Clipboard Copy — Email', async () => {
		render(
			<PartnerAccountModal
				show={true}
				inquiry={existingInquiry}
				onClose={jest.fn()}
			/>
		)

		const copyEmailBtn = screen.getByTitle('Copy Login Email')
		fireEvent.click(copyEmailBtn)

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('john.pro@example.com')
			expect(mockToast.success).toHaveBeenCalledWith('Email copied to clipboard')
		})
	})

	test('Test 8: Single Item Clipboard Copy — Password & Show/Hide Password Toggle', async () => {
		render(
			<PartnerAccountModal
				show={true}
				inquiry={existingInquiry}
				onClose={jest.fn()}
			/>
		)

		const passwordInput = screen.getByLabelText('Generated Portal Password')
		expect(passwordInput).toHaveAttribute('type', 'password')

		// Toggle password visibility
		const toggleBtn = screen.getByTitle('Show Password')
		fireEvent.click(toggleBtn)
		expect(passwordInput).toHaveAttribute('type', 'text')

		// Copy password
		const copyPasswordBtn = screen.getByTitle('Copy Password')
		fireEvent.click(copyPasswordBtn)

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalledWith('john.pro1234')
			expect(mockToast.success).toHaveBeenCalledWith('Password copied to clipboard')
		})
	})

	test('Test 9: "Copy All" Formatted Multi-Line String Copy', async () => {
		render(
			<PartnerAccountModal
				show={true}
				inquiry={existingInquiry}
				onClose={jest.fn()}
			/>
		)

		const copyAllBtn = screen.getByRole('button', { name: /Copy All Credentials/i })
		fireEvent.click(copyAllBtn)

		await waitFor(() => {
			expect(navigator.clipboard.writeText).toHaveBeenCalled()
			const copiedPayload = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0]
			expect(copiedPayload).toContain('RAG Pro Partner Portal Credentials')
			expect(copiedPayload).toContain('Partner Email: john.pro@example.com')
			expect(copiedPayload).toContain('Password: john.pro1234')
			expect(copiedPayload).toContain('Target Portal: /rag/pro-partner/coupons')
			expect(copiedPayload).toContain('Role: RAG Pro Partner')
			expect(mockToast.success).toHaveBeenCalledWith('All credentials copied to clipboard!')
			expect(screen.getByText('Copied!')).toBeInTheDocument()
		})
	})

	test('Test 10: Parent State Callback Synchronization', async () => {
		const onUpdated = jest.fn()
		const onAccountCreated = jest.fn()

		mockCreatePartnerAccount.mockResolvedValueOnce({
			data: {
				account_created: true,
				email: 'jane.specialist@gmail.com',
				password: 'jane.specialist1234',
				email_status: 'sent',
				is_existing: false,
				portal_url: '/rag/pro-partner/coupons',
			},
		})

		render(
			<PartnerAccountModal
				show={true}
				inquiry={unprovisionedInquiry}
				onClose={jest.fn()}
				onUpdated={onUpdated}
				onAccountCreated={onAccountCreated}
			/>
		)

		fireEvent.click(
			screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
		)

		await waitFor(() => {
			expect(onUpdated).toHaveBeenCalledTimes(1)
			expect(onAccountCreated).toHaveBeenCalledTimes(1)
		})

		const updatedArg = onUpdated.mock.calls[0][0]
		expect(updatedArg.details.partner_account.created).toBe(true)
		expect(updatedArg.details.partner_account.email).toBe('jane.specialist@gmail.com')
		expect(updatedArg.details.partner_account.email_status).toBe('sent')
	})

	test('Test 11: Clipboard Fallback using document.execCommand when navigator.clipboard is unavailable', async () => {
		// Simulate environment without navigator.clipboard
		Object.assign(navigator, { clipboard: undefined })
		const originalExecCommand = document.execCommand
		document.execCommand = jest.fn().mockReturnValue(true)

		const result = await copyToClipboardSafe('fallback-test-token')
		expect(result).toBe(true)
		expect(document.execCommand).toHaveBeenCalledWith('copy')

		document.execCommand = originalExecCommand
	})

	test('Test 12: derivePartnerPassword utility correctness', () => {
		expect(derivePartnerPassword('john.doe@gmail.com')).toBe('john.doe1234')
		expect(derivePartnerPassword('Partner-Coach@pro.com')).toBe('Partner-Coach1234')
		expect(derivePartnerPassword('')).toBe('partner1234')
	})
})
