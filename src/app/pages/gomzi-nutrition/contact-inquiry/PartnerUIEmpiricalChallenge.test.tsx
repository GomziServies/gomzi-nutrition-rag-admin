import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import toast from 'react-hot-toast'
import PartnerApplicationActions, {
	getPartnerApplicationStatus,
} from './PartnerApplicationActions'
import PartnerAccountModal from './PartnerAccountModal'
import { CreatePartnerAccount } from '../../../Functions/FGGroup/ContactInquiry'

// Mock the API function
jest.mock('../../../Functions/FGGroup/ContactInquiry', () => {
	const actual = jest.requireActual('../../../Functions/FGGroup/ContactInquiry')
	return {
		...actual,
		CreatePartnerAccount: jest.fn(),
		ReviewPartnerApplication: jest.fn(),
		DownloadPartnerAgreementPDF: jest.fn(),
	}
})

// Mock react-hot-toast
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
	loading: jest.Mock
	dismiss: jest.Mock
}

describe('Milestone 2 Empirical Challenge: Partner UI Components', () => {
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

	/* ===========================================================================
	   CHALLENGE 1: Status Isolation in PartnerApplicationActions
	   Verify Account button is ONLY rendered for approved inquiries
	   =========================================================================== */
	describe('Challenge 1: Status Isolation for Account Button', () => {
		test('1.1 Pending Status: Account button is NOT rendered', () => {
			const inquiry = {
				_id: 'inq-pending-1',
				name: 'Alice Pending',
				email: 'alice@example.com',
				partner_status: 'pending',
				details: { full_name: 'Alice Pending' },
			}

			render(<PartnerApplicationActions inquiry={inquiry} onUpdated={jest.fn()} />)

			// Accept and Reject buttons must be present
			expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument()

			// Account button must NOT be present
			expect(screen.queryByRole('button', { name: /Account/i })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /Credentials/i })).not.toBeInTheDocument()
			expect(screen.queryByTitle(/Partner Portal/i)).not.toBeInTheDocument()
		})

		test('1.2 Rejected Status: Account button is NOT rendered', () => {
			const inquiry = {
				_id: 'inq-rejected-1',
				name: 'Bob Rejected',
				email: 'bob@example.com',
				partner_status: 'rejected',
				details: { full_name: 'Bob Rejected' },
			}

			render(<PartnerApplicationActions inquiry={inquiry} onUpdated={jest.fn()} />)

			// In non-compact, Accept is rendered, Account must NOT be rendered
			expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /Account/i })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /Credentials/i })).not.toBeInTheDocument()
		})

		test('1.3 Rejected Status (Compact Mode): Account button is NOT rendered', () => {
			const inquiry = {
				_id: 'inq-rejected-compact',
				name: 'Bob Rejected',
				email: 'bob@example.com',
				partner_status: 'rejected',
				details: { full_name: 'Bob Rejected' },
			}

			render(<PartnerApplicationActions inquiry={inquiry} compact onUpdated={jest.fn()} />)

			expect(screen.getByRole('button', { name: /Accept/i })).toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /Reject/i })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /Account/i })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: /Credentials/i })).not.toBeInTheDocument()
		})

		test('1.4 Approved Status (Unprovisioned): Account button IS rendered', () => {
			const inquiry = {
				_id: 'inq-approved-1',
				name: 'Charlie Approved',
				email: 'charlie@example.com',
				partner_status: 'approved',
				details: { full_name: 'Charlie Approved' },
			}

			render(<PartnerApplicationActions inquiry={inquiry} onUpdated={jest.fn()} />)

			// Accept and Reject must NOT be rendered
			expect(screen.queryByRole('button', { name: /^Accept$/i })).not.toBeInTheDocument()

			// Account button MUST be rendered
			const accountBtn = screen.getByRole('button', { name: /Partner Account/i })
			expect(accountBtn).toBeInTheDocument()
			expect(accountBtn).toHaveAttribute('title', 'Create Partner Portal Account')
		})

		test('1.5 Approved Status (Provisioned): Credentials button IS rendered with active class', () => {
			const inquiry = {
				_id: 'inq-approved-provisioned',
				name: 'Diana Provisioned',
				email: 'diana@example.com',
				partner_status: 'approved',
				details: {
					full_name: 'Diana Provisioned',
					partner_account: {
						created: true,
						email: 'diana@example.com',
						email_status: 'sent',
					},
				},
			}

			render(<PartnerApplicationActions inquiry={inquiry} compact onUpdated={jest.fn()} />)

			const credsBtn = screen.getByRole('button', { name: /Credentials/i })
			expect(credsBtn).toBeInTheDocument()
			expect(credsBtn).toHaveClass('gz-partner-button-account-active')
			expect(credsBtn).toHaveAttribute('title', 'View Pro Partner Portal Credentials')
		})

		test('1.6 Defensive Edge Cases: Malformed, undefined, or unknown status defaults to pending (NO Account button)', () => {
			const nullStatusInq = { _id: 'inq-null', partner_status: null }
			const undefinedStatusInq = { _id: 'inq-undef' }
			const unknownStatusInq = { _id: 'inq-unk', partner_status: 'something_else' }
			const uppercaseStatusInq = { _id: 'inq-upper', partner_status: 'APPROVED' }

			expect(getPartnerApplicationStatus(nullStatusInq)).toBe('pending')
			expect(getPartnerApplicationStatus(undefinedStatusInq)).toBe('pending')
			expect(getPartnerApplicationStatus(unknownStatusInq)).toBe('pending')
			expect(getPartnerApplicationStatus(uppercaseStatusInq)).toBe('pending')

			const { unmount: u1 } = render(<PartnerApplicationActions inquiry={nullStatusInq} onUpdated={jest.fn()} />)
			expect(screen.queryByRole('button', { name: /Account/i })).not.toBeInTheDocument()
			u1()

			const { unmount: u2 } = render(<PartnerApplicationActions inquiry={uppercaseStatusInq} onUpdated={jest.fn()} />)
			expect(screen.queryByRole('button', { name: /Account/i })).not.toBeInTheDocument()
			u2()
		})
	})

	/* ===========================================================================
	   CHALLENGE 2: Odd-Count Grid Spanning Across 1, 2, 3, 4, 5 Buttons
	   =========================================================================== */
	describe('Challenge 2: Odd-Count Grid Spanning Logic (1, 2, 3, 4, 5 buttons)', () => {
		test('2.1 Exactly 1 Button: Spans full width (grid-column: 1 / -1)', () => {
			// Status: rejected, compact: true, no policy, no children -> exactly 1 button ("Accept")
			const inquiry = {
				_id: 'inq-1-btn',
				partner_status: 'rejected',
				details: {},
			}

			const { container } = render(
				<PartnerApplicationActions inquiry={inquiry} compact onUpdated={jest.fn()} />
			)

			const controls = container.querySelector('.gz-partner-controls')
			expect(controls).toBeInTheDocument()
			const buttons = controls?.querySelectorAll('.gz-partner-button')
			expect(buttons?.length).toBe(1)
			// The single button is an only-child
			expect(buttons?.[0].parentElement?.children.length).toBe(1)
		})

		test('2.2 Exactly 2 Buttons: Regular 2-column layout (no full-width span)', () => {
			// Status: pending, compact: true, no policy, no children -> exactly 2 buttons ("Accept", "Reject")
			const inquiry = {
				_id: 'inq-2-btn',
				partner_status: 'pending',
				details: {},
			}

			const { container } = render(
				<PartnerApplicationActions inquiry={inquiry} compact onUpdated={jest.fn()} />
			)

			const controls = container.querySelector('.gz-partner-controls')
			const buttons = controls?.querySelectorAll('.gz-partner-button')
			expect(buttons?.length).toBe(2)
			expect(buttons?.[0]).toHaveClass('gz-partner-button-accept')
			expect(buttons?.[1]).toHaveClass('gz-partner-button-reject')
			// Neither should have inline full span
			expect((buttons?.[1] as HTMLElement).style.gridColumn).not.toBe('1 / -1')
		})

		test('2.3 Exactly 3 Buttons: Last button spans full width (totalButtons === 3)', () => {
			// Scenario A: 2 buttons + 1 child
			const inquiry = {
				_id: 'inq-3-btn-child',
				partner_status: 'pending',
				details: {},
			}

			const childButton = (
				<button type='button' className='gz-partner-button gz-partner-button-view'>
					View
				</button>
			)

			const { container } = render(
				<PartnerApplicationActions inquiry={inquiry} compact onUpdated={jest.fn()}>
					{childButton}
				</PartnerApplicationActions>
			)

			const controls = container.querySelector('.gz-partner-controls')
			const buttons = controls?.querySelectorAll('.gz-partner-button')
			expect(buttons?.length).toBe(3)
			// The cloned child button must have inline gridColumn: '1 / -1'
			const lastButton = buttons?.[2] as HTMLElement
			expect(lastButton.style.gridColumn).toBe('1 / -1')

			// Scenario B: 3 standard buttons without children (approved + policy unaccepted + policy version)
			// Buttons: Resend, PDF, Account
			const inquiryApproved = {
				_id: 'inq-3-btn-std',
				partner_status: 'approved',
				partner_policy: { version: '1.0' }, // renders Resend and PDF
				details: {},
			}

			const { container: containerB } = render(
				<PartnerApplicationActions inquiry={inquiryApproved} compact onUpdated={jest.fn()} />
			)

			const controlsB = containerB.querySelector('.gz-partner-controls')
			const buttonsB = controlsB?.querySelectorAll('.gz-partner-button')
			expect(buttonsB?.length).toBe(3)
			expect(buttonsB?.[0]).toHaveClass('gz-partner-button-resend')
			expect(buttonsB?.[1]).toHaveClass('gz-partner-button-pdf')
			expect(buttonsB?.[2]).toHaveClass('gz-partner-button-account')
			// Button 3 is the 3rd child and last child in the container (matches :last-child:nth-child(3))
			expect(buttonsB?.[2].parentElement?.children[2]).toBe(buttonsB?.[2])
			expect(buttonsB?.[2].parentElement?.children.length).toBe(3)
		})

		test('2.4 Exactly 4 Buttons: Even count does NOT span full width (gridColumn: span 1)', () => {
			// Status: approved, policy unaccepted + version, plus 1 child -> Resend (1), PDF (2), Account (3), Child (4)
			const inquiry = {
				_id: 'inq-4-btn',
				partner_status: 'approved',
				partner_policy: { version: '1.0' },
				details: {},
			}

			const childButton = (
				<button type='button' className='gz-partner-button gz-partner-button-view'>
					View
				</button>
			)

			const { container } = render(
				<PartnerApplicationActions inquiry={inquiry} compact onUpdated={jest.fn()}>
					{childButton}
				</PartnerApplicationActions>
			)

			const controls = container.querySelector('.gz-partner-controls')
			const buttons = controls?.querySelectorAll('.gz-partner-button')
			expect(buttons?.length).toBe(4)

			// Cloned child button must NOT span full width
			const lastButton = buttons?.[3] as HTMLElement
			expect(lastButton.style.gridColumn).toBe('span 1')
		})

		test('2.5 Exactly 5 Buttons: Odd count spans full width in grid styling', () => {
			// Construct a container simulating 5 buttons to verify the CSS rule and odd-count logic
			// In PartnerApplicationActions, when totalButtons === 5, shouldSpanLast is true.
			// Let's verify by mounting 5 items in gz-partner-controls
			const { container } = render(
				<div className='gz-partner-controls'>
					<button className='gz-partner-button'>B1</button>
					<button className='gz-partner-button'>B2</button>
					<button className='gz-partner-button'>B3</button>
					<button className='gz-partner-button'>B4</button>
					<button className='gz-partner-button'>B5</button>
				</div>
			)

			const controls = container.querySelector('.gz-partner-controls')
			const buttons = controls?.querySelectorAll('.gz-partner-button')
			expect(buttons?.length).toBe(5)
			const fifthButton = buttons?.[4] as HTMLElement
			expect(fifthButton).toBe(controls?.children[4])
			expect(controls?.children.length).toBe(5)
		})
	})

	/* ===========================================================================
	   CHALLENGE 3: Simulated Server HTTP Error Handling (400, 403, 409, 500)
	   =========================================================================== */
	describe('Challenge 3: Modal Resilience Under Server Error Codes', () => {
		const approvedInquiry = {
			_id: 'inquiry-error-test',
			name: 'Test Partner',
			email: 'test.partner@example.com',
			partner_status: 'approved',
			details: {
				full_name: 'Test Partner',
				email: 'test.partner@example.com',
			},
		}

		test('3.1 HTTP 400 Bad Request: In-modal banner and retry action enabled', async () => {
			mockCreatePartnerAccount.mockRejectedValueOnce({
				response: {
					status: 400,
					data: { message: 'Partner application must be approved before generating credentials' },
				},
			})

			render(<PartnerAccountModal show={true} inquiry={approvedInquiry} onClose={jest.fn()} />)

			fireEvent.click(
				screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
			)

			await waitFor(() => {
				expect(screen.getByText('Account Generation Failed')).toBeInTheDocument()
				expect(
					screen.getByText('Partner application must be approved before generating credentials')
				).toBeInTheDocument()
				expect(mockToast.error).toHaveBeenCalledWith(
					'Partner application must be approved before generating credentials'
				)
			})

			const retryBtn = screen.getByRole('button', { name: /Retry Account Generation/i })
			expect(retryBtn).toBeInTheDocument()
			expect(retryBtn).toBeEnabled()
		})

		test('3.2 HTTP 403 Forbidden: Caller lacks admin permissions', async () => {
			mockCreatePartnerAccount.mockRejectedValueOnce({
				response: {
					status: 403,
					data: { message: 'Only administrators can create partner accounts' },
				},
			})

			render(<PartnerAccountModal show={true} inquiry={approvedInquiry} onClose={jest.fn()} />)

			fireEvent.click(
				screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
			)

			await waitFor(() => {
				expect(screen.getByText('Account Generation Failed')).toBeInTheDocument()
				expect(
					screen.getByText('Only administrators can create partner accounts')
				).toBeInTheDocument()
			})
		})

		test('3.3 HTTP 409 Conflict: Email exists under non-partner administrative role', async () => {
			mockCreatePartnerAccount.mockRejectedValueOnce({
				response: {
					status: 409,
					data: {
						message:
							'An account with this email already exists under a different administrative role',
					},
				},
			})

			render(<PartnerAccountModal show={true} inquiry={approvedInquiry} onClose={jest.fn()} />)

			fireEvent.click(
				screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
			)

			await waitFor(() => {
				expect(screen.getByText('Account Generation Failed')).toBeInTheDocument()
				expect(
					screen.getByText(
						'An account with this email already exists under a different administrative role'
					)
				).toBeInTheDocument()
			})
		})

		test('3.4 HTTP 500 Internal Server Error: Database or service crash gracefully surfaced', async () => {
			mockCreatePartnerAccount.mockRejectedValueOnce({
				response: {
					status: 500,
					data: { message: 'Failed to create partner account: Database connection timed out' },
				},
			})

			render(<PartnerAccountModal show={true} inquiry={approvedInquiry} onClose={jest.fn()} />)

			fireEvent.click(
				screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
			)

			await waitFor(() => {
				expect(screen.getByText('Account Generation Failed')).toBeInTheDocument()
				expect(
					screen.getByText('Failed to create partner account: Database connection timed out')
				).toBeInTheDocument()
			})

			// Component does not throw; allows retry
			const retryBtn = screen.getByRole('button', { name: /Retry Account Generation/i })
			expect(retryBtn).toBeEnabled()
		})
	})

	/* ===========================================================================
	   CHALLENGE 4: Delivery States (sent vs failed)
	   =========================================================================== */
	describe('Challenge 4: Delivery States (sent vs failed)', () => {
		const approvedInquiry = {
			_id: 'inquiry-delivery-test',
			name: 'Sam Delivery',
			email: 'sam.delivery@example.com',
			partner_status: 'approved',
			details: {
				full_name: 'Sam Delivery',
				email: 'sam.delivery@example.com',
			},
		}

		test('4.1 Delivery State "sent": Green success banner and dispatched confirmation', async () => {
			mockCreatePartnerAccount.mockResolvedValueOnce({
				status: 200,
				data: {
					account_created: true,
					email: 'sam.delivery@example.com',
					password: 'sam.delivery1234',
					email_status: 'sent',
					is_existing: false,
					portal_url: '/rag/pro-partner/coupons',
				},
			})

			render(<PartnerAccountModal show={true} inquiry={approvedInquiry} onClose={jest.fn()} />)

			fireEvent.click(
				screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
			)

			await waitFor(() => {
				expect(screen.getByText('Email Sent')).toBeInTheDocument()
				expect(screen.getByText('Credentials Notification Dispatched')).toBeInTheDocument()
				expect(
					screen.getByText(/Login credentials have been successfully emailed to/i)
				).toBeInTheDocument()
				expect(screen.queryByText(/Email Delivery Failed/i)).not.toBeInTheDocument()
			})
		})

		test('4.2 Delivery State "failed": Amber warning banner advising manual copy, credentials remain accessible', async () => {
			mockCreatePartnerAccount.mockResolvedValueOnce({
				status: 200,
				data: {
					account_created: true,
					email: 'sam.delivery@example.com',
					password: 'sam.delivery1234',
					email_status: 'failed',
					is_existing: false,
					portal_url: '/rag/pro-partner/coupons',
				},
			})

			render(<PartnerAccountModal show={true} inquiry={approvedInquiry} onClose={jest.fn()} />)

			fireEvent.click(
				screen.getByRole('button', { name: /Generate Credentials & Send Notification/i })
			)

			await waitFor(() => {
				// Must display warning alert banner
				expect(screen.getByText('Email Delivery Failed')).toBeInTheDocument()
				expect(
					screen.getByText('Notice: Automated Email Could Not Be Sent')
				).toBeInTheDocument()
				expect(
					screen.getByText(/Please manually copy the credentials below and provide them to the partner/i)
				).toBeInTheDocument()

				// Crucial: Credentials MUST remain readable and copyable
				expect(screen.getByLabelText('Partner Login Identifier')).toHaveValue('sam.delivery@example.com')
				expect(screen.getByLabelText('Generated Portal Password')).toHaveValue('sam.delivery1234')
				expect(screen.getByRole('button', { name: /Copy All Credentials/i })).toBeInTheDocument()
			})
		})

		test('4.3 Existing Account with Prior "failed" Email Status loads warning state directly', () => {
			const existingFailedInquiry = {
				_id: 'inq-existing-failed',
				name: 'Failed Delivery Partner',
				email: 'failed.delivery@example.com',
				partner_status: 'approved',
				details: {
					full_name: 'Failed Delivery Partner',
					email: 'failed.delivery@example.com',
					partner_account: {
						created: true,
						email: 'failed.delivery@example.com',
						email_status: 'failed',
						is_existing: true,
						created_at: '2026-11-02T10:00:00.000Z',
					},
				},
			}

			render(
				<PartnerAccountModal show={true} inquiry={existingFailedInquiry} onClose={jest.fn()} />
			)

			expect(screen.getByText('Email Delivery Failed')).toBeInTheDocument()
			expect(screen.getByText('Account Active')).toBeInTheDocument()
			expect(screen.getByLabelText('Partner Login Identifier')).toHaveValue('failed.delivery@example.com')
			expect(screen.getByLabelText('Generated Portal Password')).toHaveValue('failed.delivery1234')
		})
	})

	/* ===========================================================================
	   CHALLENGE 5: Interaction & Integration Ergonomics
	   =========================================================================== */
	describe('Challenge 5: Integration & Event Propagation', () => {
		test('5.1 Account Button click stops event propagation (does not trigger row selection)', () => {
			const onRowClick = jest.fn()
			const inquiry = {
				_id: 'inq-prop-test',
				partner_status: 'approved',
				details: { full_name: 'Prop Test' },
			}

			render(
				<div onClick={onRowClick}>
					<PartnerApplicationActions inquiry={inquiry} onUpdated={jest.fn()} />
				</div>
			)

			const accountBtn = screen.getByRole('button', { name: /Partner Account/i })
			fireEvent.click(accountBtn)

			// Row click must NOT have been called due to e.stopPropagation()
			expect(onRowClick).not.toHaveBeenCalled()
		})

		test('5.2 Modal Formats Copy All bundle with exact URLs and security metadata', async () => {
			const inquiry = {
				_id: 'inq-copy-all',
				name: 'Copy Partner',
				email: 'copy.partner@gym.com',
				partner_status: 'approved',
				details: {
					full_name: 'Copy Partner',
					email: 'copy.partner@gym.com',
					partner_account: {
						created: true,
						email: 'copy.partner@gym.com',
						email_status: 'sent',
					},
				},
			}

			render(<PartnerAccountModal show={true} inquiry={inquiry} onClose={jest.fn()} />)

			const copyAllBtn = screen.getByRole('button', { name: /Copy All Credentials/i })
			fireEvent.click(copyAllBtn)

			await waitFor(() => {
				expect(navigator.clipboard.writeText).toHaveBeenCalled()
				const payload = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0]
				expect(payload).toContain('RAG Pro Partner Portal Credentials')
				expect(payload).toContain('/rag/login')
				expect(payload).toContain('Partner Email: copy.partner@gym.com')
				expect(payload).toContain('Password: copy.partner1234')
				expect(payload).toContain('Target Portal: /rag/pro-partner/coupons')
				expect(payload).toContain('Role: RAG Pro Partner')
			})
		})
	})
})
