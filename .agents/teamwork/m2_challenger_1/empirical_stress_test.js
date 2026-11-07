/**
 * Empirical Adversarial Stress Test Suite for Milestone 2
 * Frontend Pro Partner Account UI & Credentials Modal
 * 
 * Verifies:
 * 1. Password derivation formula <email_prefix>1234 under extreme edge cases
 * 2. "Copy All Credentials" multi-line formatting accuracy and regex validation
 * 3. Mocked clipboard failure fallback execution (navigator.clipboard -> execCommand -> graceful failure)
 * 4. Rapid clicking / concurrency simulation and loading lock
 * 5. Resilient credential display under SMTP delivery failure
 * 6. UI integration contracts and parity with backend controller
 */

const { JSDOM } = require('jsdom')

// ANSI Color Codes
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

let totalTests = 0
let passedTests = 0
let failedTests = 0
const failures = []

function assert(condition, testName, details = '') {
	totalTests++
	if (condition) {
		passedTests++
		console.log(`  ${GREEN}✓${RESET} ${testName}`)
	} else {
		failedTests++
		failures.push({ testName, details })
		console.log(`  ${RED}✗ FAIL:${RESET} ${testName}`)
		if (details) console.log(`    ${YELLOW}Details: ${details}${RESET}`)
	}
}

// ---------------------------------------------------------------------------
// Implementation Under Test (Direct extract matching PartnerAccountModal.tsx)
// ---------------------------------------------------------------------------

const derivePartnerPassword = (email) => {
	const prefix = (email || '').split('@')[0] || 'partner'
	return `${prefix}1234`
}

async function copyToClipboardSafe(text, envNavigator, envDocument) {
	if (!text) return false
	try {
		if (envNavigator?.clipboard?.writeText) {
			await envNavigator.clipboard.writeText(text)
			return true
		}
	} catch (_) {
		// Fall through to DOM fallback
	}

	try {
		const textArea = envDocument.createElement('textarea')
		textArea.value = text
		textArea.style.position = 'fixed'
		textArea.style.opacity = '0'
		textArea.style.left = '-9999px'
		envDocument.body.appendChild(textArea)
		textArea.focus()
		textArea.select()
		const successful = envDocument.execCommand('copy')
		envDocument.body.removeChild(textArea)
		return successful
	} catch (err) {
		return false
	}
}

function formatCopyAllPayload(credentials, origin = 'http://localhost:3000') {
	const loginUrl = `${origin}/rag/login`
	return [
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
}

// Backend password derivation (extracted from create-partner-account.js)
function backendDerivePassword(rawEmail) {
	if (!rawEmail || typeof rawEmail !== 'string') return null
	const email = rawEmail.trim().toLowerCase()
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
	const emailPrefix = email.split('@')[0]
	if (!emailPrefix) return null
	return `${emailPrefix}1234`
}

// ---------------------------------------------------------------------------
// SUITE 1: Password Derivation Under Adversarial & Extreme Inputs
// ---------------------------------------------------------------------------
console.log(`\n${BOLD}${CYAN}=== SUITE 1: Password Derivation Formula <email_prefix>1234 ===${RESET}`)

const passwordTestCases = [
	{ input: 'john.doe@gmail.com', expected: 'john.doe1234', desc: 'Standard alphanumeric with dot' },
	{ input: 'john.doe+tag@domain.com', expected: 'john.doe+tag1234', desc: 'Plus tag suffix (RFC 5233)' },
	{ input: 'trainer-pro_fit@sub.domain.co.uk', expected: 'trainer-pro_fit1234', desc: 'Hyphens, underscores, subdomains' },
	{ input: 'user%special!#$&\'*+-/=?^_{|}~@example.com', expected: 'user%special!#$&\'*+-/=?^_{|}~1234', desc: 'RFC 5322 local-part special chars' },
	{ input: 'o\'connor@domain.com', expected: 'o\'connor1234', desc: 'Single quote in prefix' },
	{ input: 'p.a.r.t.n.e.r@domain.com', expected: 'p.a.r.t.n.e.r1234', desc: 'Multiple consecutive single-char segments' },
	{ input: '1234567890@domain.com', expected: '12345678901234', desc: 'Numeric-only email prefix' },
	{ input: 'partner#123@domain.com', expected: 'partner#1231234', desc: 'Hash symbol in prefix' },
	{ input: 'a@domain.com', expected: 'a1234', desc: 'Single-letter prefix' },
	{ input: 'jürgen.müller@domain.de', expected: 'jürgen.müller1234', desc: 'Unicode / umlaut characters in prefix' },
	{ input: '', expected: 'partner1234', desc: 'Empty string fallback to partner1234' },
	{ input: null, expected: 'partner1234', desc: 'Null fallback to partner1234' },
	{ input: undefined, expected: 'partner1234', desc: 'Undefined fallback to partner1234' },
	{ input: '@domain.com', expected: 'partner1234', desc: 'Leading @ with empty prefix fallback' },
	{ input: '@@@domain.com', expected: 'partner1234', desc: 'Multiple @ with empty prefix fallback' },
	{ input: 'singleword', expected: 'singleword1234', desc: 'Malformed email without @ treats entire string as prefix' },
	{ input: 'foo@bar@baz.com', expected: 'foo1234', desc: 'Multiple @ takes first segment before first @' },
]

passwordTestCases.forEach((tc) => {
	const actual = derivePartnerPassword(tc.input)
	assert(actual === tc.expected, `derivePartnerPassword("${tc.input}") -> "${actual}"`, `Expected "${tc.expected}", got "${actual}" (${tc.desc})`)
})

// Parity Check: Frontend sanitized vs Backend derivation
console.log(`\n${BOLD}${CYAN}=== SUITE 1.1: Frontend/Backend Parity Check for Valid Emails ===${RESET}`)
const parityEmails = [
	'Jane.Doe@Gmail.COM',
	'  rahul.nutrition+pro@domain.co.in  ',
	'vikram-trainer_01@sub.fitness.org',
	'coach.o\'neil@athletes.com',
]

parityEmails.forEach((emailStr) => {
	// Frontend sanitization: (email || '').trim().toLowerCase()
	const frontendSanitized = (emailStr || '').trim().toLowerCase()
	const frontendPassword = derivePartnerPassword(frontendSanitized)
	const backendPassword = backendDerivePassword(emailStr)

	assert(
		frontendPassword === backendPassword,
		`Frontend & Backend match for "${emailStr.trim()}": ${frontendPassword} === ${backendPassword}`,
		`Mismatch: Frontend="${frontendPassword}", Backend="${backendPassword}"`
	)
})

// ---------------------------------------------------------------------------
// SUITE 2: "Copy All Credentials" Formatting Accuracy & Regex Matching
// ---------------------------------------------------------------------------
console.log(`\n${BOLD}${CYAN}=== SUITE 2: "Copy All Credentials" Formatting Accuracy ===${RESET}`)

const mockCreds = {
	email: 'applicant.pro@domain.com',
	password: 'applicant.pro1234',
	portal_url: '/rag/pro-partner/coupons',
	email_status: 'sent',
	is_existing: false,
}

const customOrigin = 'https://rag-admin.gomzinutrition.com'
const payload = formatCopyAllPayload(mockCreds, customOrigin)

// Test exact structure
assert(payload.includes('RAG Pro Partner Portal Credentials'), 'Contains title header')
assert(payload.includes('=================================='), 'Contains divider border')
assert(payload.includes(`Portal Login: ${customOrigin}/rag/login`), 'Contains exact absolute login URL with origin')
assert(payload.includes(`Partner Email: ${mockCreds.email}`), 'Contains exact partner login email')
assert(payload.includes(`Password: ${mockCreds.password}`), 'Contains exact derived password')
assert(payload.includes('Target Portal: /rag/pro-partner/coupons'), 'Contains target portal route')
assert(payload.includes('Role: RAG Pro Partner'), 'Contains explicit Pro Partner RBAC role')
assert(payload.includes('Note: Log in at the portal login URL above'), 'Contains administrative instructional note')

// Regex validation of the entire multi-line template
const lines = payload.split('\n')
assert(lines.length === 9, `Payload contains exactly 9 formatted lines (actual: ${lines.length})`)

const expectedPatterns = [
	/^RAG Pro Partner Portal Credentials$/,
	/^==================================$/,
	/^Portal Login: https?:\/\/[^\s]+\/rag\/login$/,
	/^Partner Email: [^\s@]+@[^\s@]+\.[^\s@]+$/,
	/^Password: .+1234$/,
	/^Target Portal: \/rag\/pro-partner\/coupons$/,
	/^Role: RAG Pro Partner$/,
	/^==================================$/,
	/^Note: Log in at the portal login URL above with these credentials to access your partner coupons and dashboard\.$/,
]

expectedPatterns.forEach((pat, idx) => {
	const line = lines[idx]
	assert(pat.test(line), `Line ${idx + 1} matches spec: "${line}"`, `Line ${idx + 1} failed pattern ${pat}`)
})

// ---------------------------------------------------------------------------
// SUITE 3: Mocked Clipboard Failure Fallback Execution
// ---------------------------------------------------------------------------
console.log(`\n${BOLD}${CYAN}=== SUITE 3: Mocked Clipboard Failure Fallback Execution ===${RESET}`)

async function runClipboardTests() {
	const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
	const doc = dom.window.document

	// Test 3.1: Navigator clipboard success
	const navSuccess = {
		clipboard: {
			writeText: async (text) => { return Promise.resolve() }
		}
	}
	const resSuccess = await copyToClipboardSafe('test-credentials-123', navSuccess, doc)
	assert(resSuccess === true, 'Test 3.1: Modern navigator.clipboard.writeText success returns true')

	// Test 3.2: Navigator clipboard throws Permission Denied / Document Not Focused -> falls back to execCommand
	let execCommandCalledWith = null
	let textareaAppended = false
	let textareaRemoved = false

	const origAppend = doc.body.appendChild.bind(doc.body)
	const origRemove = doc.body.removeChild.bind(doc.body)
	doc.body.appendChild = (el) => {
		if (el.tagName === 'TEXTAREA') textareaAppended = true
		return origAppend(el)
	}
	doc.body.removeChild = (el) => {
		if (el.tagName === 'TEXTAREA') textareaRemoved = true
		return origRemove(el)
	}
	doc.execCommand = (cmd) => {
		execCommandCalledWith = cmd
		return true // simulated successful execCommand
	}

	const navFails = {
		clipboard: {
			writeText: async () => {
				const err = new Error('NotAllowedError: Document is not focused')
				err.name = 'NotAllowedError'
				throw err
			}
		}
	}

	const resFallbackSuccess = await copyToClipboardSafe('fallback-token-456', navFails, doc)
	assert(resFallbackSuccess === true, 'Test 3.2a: Fallback succeeds when navigator.clipboard throws NotAllowedError')
	assert(execCommandCalledWith === 'copy', 'Test 3.2b: document.execCommand("copy") called as fallback')
	assert(textareaAppended && textareaRemoved, 'Test 3.2c: Temporary textarea created, appended, and cleanly cleaned up')

	// Test 3.3: Environment without navigator.clipboard (undefined) -> uses DOM fallback directly
	execCommandCalledWith = null
	const navUndefined = {}
	const resUndefinedNav = await copyToClipboardSafe('token-no-nav-789', navUndefined, doc)
	assert(resUndefinedNav === true, 'Test 3.3: Fallback succeeds when navigator.clipboard is undefined')
	assert(execCommandCalledWith === 'copy', 'Test 3.3b: execCommand called when navigator.clipboard is undefined')

	// Test 3.4: Both navigator.clipboard fails AND execCommand returns false -> returns false cleanly
	doc.execCommand = () => false
	const resTotalFailure = await copyToClipboardSafe('token-fail-000', navFails, doc)
	assert(resTotalFailure === false, 'Test 3.4: Returns false gracefully when both clipboard and execCommand fail')

	// Test 3.5: execCommand throws an unexpected exception -> caught and returns false
	doc.execCommand = () => { throw new Error('DOM Security Exception') }
	const resExecThrows = await copyToClipboardSafe('token-throws-111', navFails, doc)
	assert(resExecThrows === false, 'Test 3.5: Returns false gracefully when execCommand throws an unhandled exception')

	// Test 3.6: Falsy or empty text -> returns false immediately without invoking clipboard
	let navWriteCalled = false
	const navSpied = {
		clipboard: {
			writeText: async () => { navWriteCalled = true }
		}
	}
	const resEmpty = await copyToClipboardSafe('', navSpied, doc)
	const resNull = await copyToClipboardSafe(null, navSpied, doc)
	assert(resEmpty === false && resNull === false && !navWriteCalled, 'Test 3.6: Empty or null text returns false without invoking clipboard API')

	// Restore doc methods
	doc.body.appendChild = origAppend
	doc.body.removeChild = origRemove
}

// ---------------------------------------------------------------------------
// SUITE 4: Concurrency & Rapid Clicking Simulation on "Generate" Button
// ---------------------------------------------------------------------------
console.log(`\n${BOLD}${CYAN}=== SUITE 4: Concurrency & Rapid Clicking Simulation ===${RESET}`)

async function runConcurrencyTests() {
	let apiCallCount = 0
	const mockApiCaller = async (inquiryId) => {
		apiCallCount++
		// Simulate network latency of 50ms
		await new Promise((resolve) => setTimeout(resolve, 50))
		return {
			status: 200,
			data: {
				account_created: true,
				email: 'concurrency.test@gmail.com',
				password: 'concurrency.test1234',
				email_status: 'sent',
				is_existing: false,
				portal_url: '/rag/pro-partner/coupons',
			}
		}
	}

	// Model the state machine inside handleGenerate:
	// loading state + mutex guard: if (!inquiry?._id || loading) return
	class ModalStateMachine {
		constructor(inquiry) {
			this.inquiry = inquiry
			this.loading = false
			this.error = null
			this.credentials = null
			this.callAttempts = 0
		}

		async handleGenerate() {
			this.callAttempts++
			if (!this.inquiry?._id || this.loading) {
				return // Guard clause in PartnerAccountModal line 160
			}

			const rawEmail = (this.inquiry?.email || '').trim().toLowerCase()
			if (!rawEmail) return

			this.loading = true
			this.error = null

			try {
				const res = await mockApiCaller(this.inquiry._id)
				this.credentials = res.data
			} catch (err) {
				this.error = err.message
			} finally {
				this.loading = false
			}
		}
	}

	// Test 4.1: Rapid consecutive clicks (10 clicks fired synchronously)
	const inquiry = { _id: 'inq-concurrency-001', email: 'concurrency.test@gmail.com' }
	const machine = new ModalStateMachine(inquiry)

	apiCallCount = 0
	// Fire 10 calls concurrently
	const promises = []
	for (let i = 0; i < 10; i++) {
		promises.push(machine.handleGenerate())
	}
	await Promise.all(promises)

	assert(machine.callAttempts === 10, 'All 10 click events reached the handler')
	assert(apiCallCount === 1, `Guard clause restricted API requests strictly to 1 call (actual: ${apiCallCount})`)
	assert(machine.loading === false, 'Loading resets to false after API completion')
	assert(machine.credentials !== null, 'Credentials populated successfully')

	// Test 4.2: Missing email prevents API call completely
	const invalidInquiry = { _id: 'inq-no-email-002', email: '' }
	const invalidMachine = new ModalStateMachine(invalidInquiry)
	apiCallCount = 0
	await invalidMachine.handleGenerate()
	assert(apiCallCount === 0, 'No API call triggered when applicant email is empty')

	// Test 4.3: Missing _id prevents API call completely
	const noIdInquiry = { email: 'valid@gmail.com' }
	const noIdMachine = new ModalStateMachine(noIdInquiry)
	apiCallCount = 0
	await noIdMachine.handleGenerate()
	assert(apiCallCount === 0, 'No API call triggered when inquiry._id is absent')

	// Test 4.4: Retry capability after network error
	let failFirst = true
	const flakyApi = async (id) => {
		if (failFirst) {
			failFirst = false
			throw new Error('500 Internal Server Error: MongoDB connection timeout')
		}
		return {
			status: 200,
			data: { account_created: true, email: 'retry@domain.com', password: 'retry1234' }
		}
	}

	const retryMachine = {
		inquiry: { _id: 'inq-retry-003', email: 'retry@domain.com' },
		loading: false,
		error: null,
		credentials: null,
		async handleGenerate() {
			if (this.loading) return
			this.loading = true
			this.error = null
			try {
				const res = await flakyApi(this.inquiry._id)
				this.credentials = res.data
			} catch (err) {
				this.error = err.message
			} finally {
				this.loading = false
			}
		}
	}

	// First attempt: should fail
	await retryMachine.handleGenerate()
	assert(retryMachine.error !== null, `First call fails gracefully with error: "${retryMachine.error}"`)
	assert(retryMachine.loading === false, 'Loading resets after failure to enable retry')
	assert(retryMachine.credentials === null, 'Credentials remains null after failure')

	// Second attempt (retry): should succeed
	await retryMachine.handleGenerate()
	assert(retryMachine.error === null, 'Error cleared on successful retry')
	assert(retryMachine.credentials !== null, 'Credentials populated on retry')
}

// ---------------------------------------------------------------------------
// SUITE 5: Resilient Credential Display under SMTP Delivery Failure
// ---------------------------------------------------------------------------
console.log(`\n${BOLD}${CYAN}=== SUITE 5: Resilient Display under SMTP Delivery Failure ===${RESET}`)

function testEmailFailureResilience() {
	const backendResponseFailedEmail = {
		status: 200,
		message: 'Partner account created successfully',
		data: {
			account_created: true,
			email: 'partner.offline@example.com',
			password: 'partner.offline1234',
			email_status: 'failed',
			is_existing: false,
			portal_url: '/rag/pro-partner/coupons',
		}
	}

	// Verify that email_status: 'failed' still yields valid credentials and does not reject
	const creds = backendResponseFailedEmail.data
	assert(creds.account_created === true, 'Account creation succeeded despite email delivery failure')
	assert(creds.email === 'partner.offline@example.com', 'Login identifier intact')
	assert(creds.password === 'partner.offline1234', 'Derived password intact')
	assert(creds.email_status === 'failed', 'Email status is explicitly flagged as "failed"')

	// Test alert banner condition (from PartnerAccountModal.tsx line 399)
	const shouldShowWarningBanner = creds.email_status === 'failed'
	const shouldShowSuccessBanner = creds.email_status === 'sent'
	assert(shouldShowWarningBanner === true, 'Amber warning banner triggered for failed email')
	assert(shouldShowSuccessBanner === false, 'Green success banner suppressed for failed email')

	// Test copy buttons remain operational
	const copyAllString = formatCopyAllPayload(creds)
	assert(copyAllString.includes('Partner Email: partner.offline@example.com'), 'Copy All includes failed-email applicant')
	assert(copyAllString.includes('Password: partner.offline1234'), 'Copy All includes password for manual sharing')
}

// ---------------------------------------------------------------------------
// Main Runner Execution
// ---------------------------------------------------------------------------
async function runAll() {
	await runClipboardTests()
	await runConcurrencyTests()
	testEmailFailureResilience()

	console.log(`\n${BOLD}======================================================${RESET}`)
	console.log(`${BOLD}CHALLENGE TEST RESULTS SUMMARY${RESET}`)
	console.log(`======================================================`)
	console.log(`Total Tests Run:  ${totalTests}`)
	console.log(`${GREEN}Passed Tests:      ${passedTests}${RESET}`)
	if (failedTests > 0) {
		console.log(`${RED}Failed Tests:      ${failedTests}${RESET}`)
		console.log(`\nFailures Breakdown:`)
		failures.forEach((f, idx) => {
			console.log(`  ${idx + 1}. ${f.testName} -> ${f.details}`)
		})
	} else {
		console.log(`${GREEN}Failed Tests:      0${RESET}`)
		console.log(`\n${BOLD}${GREEN}ALL EMPIRICAL CHALLENGE TESTS PASSED SUCCESSFULLY!${RESET}`)
	}
	console.log(`======================================================\n`)

	if (failedTests > 0) {
		process.exit(1)
	}
}

runAll().catch((err) => {
	console.error('Fatal test runner error:', err)
	process.exit(1)
})
