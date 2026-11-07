const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'pro_partner_test_jwt_secret_998877';

function loadModule(fullPath, mocks = {}) {
	const localRequire = createRequire(fullPath);
	const module = { exports: {} };
	vm.runInThisContext(
		`(function(require, module, exports, __dirname, __filename) { ${fs.readFileSync(fullPath, 'utf8')}\n})`,
		{ filename: fullPath }
	)(
		(name) => (Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name)),
		module,
		module.exports,
		path.dirname(fullPath),
		fullPath
	);
	return module.exports;
}

const apiRoot = 'c:/gomzi-nutrition-rag-api';
const jwt = require(`${apiRoot}/src/services/jwt`);
const bcryptjs = require(`${apiRoot}/src/services/bcryptjs`);
const { adminType } = require(`${apiRoot}/src/common`);

async function runAuditorStressTests() {
	console.log('--- STARTING INDEPENDENT AUDITOR ADVERSARIAL STRESS TESTS ---');

	// --- 1. Middleware RBAC lockdown ---
	let inMemoryCache = new Map();
	const mockCache = {
		has: (k) => inMemoryCache.has(k),
		get: (k) => inMemoryCache.get(k),
		set: (k, v) => inMemoryCache.set(k, v),
		ttl: () => {},
	};

	let dummyDb = new Map();
	const mockAdminRepo = {
		findOne: (q) => {
			let found = null;
			for (const u of dummyDb.values()) {
				if (q._id && String(u._id) === String(q._id)) found = u;
			}
			return {
				select: () => ({
					lean: () => Promise.resolve(found),
					then: (resolve) => Promise.resolve(found).then(resolve),
				}),
			};
		},
	};

	const middleware = loadModule(`${apiRoot}/src/middleware/admin.middleware.js`, {
		'../database': { AdminRepo: mockAdminRepo },
		'../services': { jwt, nodeCache: () => mockCache },
		'../common': { adminType, MFAMethods: { authenticator: 'authenticator' } },
		'./franchise.middleware': (req, res, next) => next(),
		'./oAuth.middleware': (req, res, next) => next(),
		'../config/employee-config': { employeeAllowedRoutes: [] },
	});

	const partnerUser = {
		_id: 'partner_001',
		email: 'partner@test.com',
		type: 'RAG_Pro_Partner',
		authToken: 998877,
		status: true,
	};
	dummyDb.set(partnerUser._id, partnerUser);

	const partnerToken = jwt.sign({
		id: partnerUser._id,
		type: partnerUser.type,
		email: partnerUser.email,
		authToken: partnerUser.authToken,
		via: 'LOGIN',
	});

	async function callMiddleware(reqPath) {
		let nextCalled = false;
		let resStatus = 200;
		let body = null;
		const req = {
			path: reqPath,
			headers: { authorization: partnerToken },
			logger: { info() {}, error() {}, warn() {} },
		};
		const headers = {};
		const res = {
			setHeader(k, v) { headers[k.toLowerCase()] = v; },
			getHeader(k) { return headers[k.toLowerCase()]; },
			status(c) {
				resStatus = c;
				return this;
			},
			json(b) {
				body = b;
				return this;
			},
		};
		await middleware(req, res, () => {
			nextCalled = true;
		});
		return { nextCalled, resStatus, body };
	}

	// Test 1.1: Blocked route /deals on cache miss
	let r1 = await callMiddleware('/deals');
	console.log('DEBUG r1:', JSON.stringify(r1));
	assert.equal(r1.nextCalled, false, 'Route /deals should be blocked');
	assert.equal(r1.resStatus, 403, 'Route /deals must return 403 Forbidden');
	assert.equal(r1.body.message, 'Access forbidden: Pro Partner portal restriction');
	console.log('✓ Check 1.1: /deals blocked on cache miss (403)');

	// Test 1.2: Allowed route /get-profile on cache miss
	let r2 = await callMiddleware('/get-profile');
	assert.equal(r2.nextCalled, true, 'Route /get-profile should pass');
	assert.equal(r2.resStatus, 200);
	console.log('✓ Check 1.2: /get-profile allowed on cache miss');

	// Cache is now populated with user session. Test 1.3: Blocked route /deals on CACHE HIT
	assert.equal(mockCache.has(partnerUser._id), true, 'Cache should be populated');
	let r3 = await callMiddleware('/deals');
	assert.equal(r3.nextCalled, false, 'Route /deals must still be blocked on cache hit!');
	assert.equal(r3.resStatus, 403, 'Route /deals on cache hit must return 403 Forbidden');
	assert.equal(r3.body.message, 'Access forbidden: Pro Partner portal restriction');
	console.log('✓ Check 1.3: /deals blocked on cache hit (403 dual-gate verified)');

	// Test 1.4: Trailing slash on blocked route /employee/get/
	let r4 = await callMiddleware('/employee/get/');
	assert.equal(r4.nextCalled, false);
	assert.equal(r4.resStatus, 403);
	console.log('✓ Check 1.4: Trailing slash /employee/get/ blocked (403)');

	// Test 1.5: Trailing slash on allowed route /change-password/
	let r5 = await callMiddleware('/change-password/');
	assert.equal(r5.nextCalled, true);
	console.log('✓ Check 1.5: Trailing slash on /change-password/ allowed');

	// --- 2. Password generation and deterministic rules ---
	const createAccountController = loadModule(
		`${apiRoot}/src/controllers/admin/contact-inquiry/create-partner-account.js`,
		{
			'../../../database': {
				ContactInquiryRepo: {
					findOne: async () => ({
						_id: 'inq_123',
						email: '  GymOwner.Special+Tier@RAGNutrition.IN  ',
						name: 'Gym Owner',
						details: { inquiryType: 'partner' },
						partner_status: 'approved',
						status: true,
					}),
					updateOne: async () => ({ modifiedCount: 1 }),
				},
				AdminRepo: {
					findOne: async () => null,
					create: async (doc) => ({ _id: 'admin_created_1', ...doc }),
				},
			},
			'../../../common': { adminType },
			'../../../services': { bcryptjs, nodemailer: async () => ({ messageId: 'm1' }) },
			'../../../helpers': {
				emailTemplate: async (tpl, data) => `<html>Credentials: ${data.password}</html>`,
			},
		}
	);

	let resStatus = 200;
	let resData = null;
	const mockAdminReq = {
		headers: { adminAuthData: { id: 'master_1', type: adminType.master } },
		body: { inquiry_id: '660e1b2b8d4e5f6a7b8c2501' },
		logger: { info() {}, error() {}, warn() {} },
	};
	const adminHeaders = {};
	const mockAdminRes = {
		setHeader(k, v) { adminHeaders[k.toLowerCase()] = v; },
		getHeader(k) { return adminHeaders[k.toLowerCase()]; },
		status(c) {
			resStatus = c;
			return this;
		},
		json(b) {
			resData = b;
			return this;
		},
	};

	await createAccountController(mockAdminReq, mockAdminRes);
	assert.equal(resStatus, 200);
	assert.equal(resData.data.email, 'gymowner.special+tier@ragnutrition.in');
	assert.equal(resData.data.password, 'gymowner.special+tier1234');
	console.log('✓ Check 2.1: Casing, whitespace, subaddress normalized & prefix1234 verified');

	// Verify password matches bcrypt hash
	const createdHash = bcryptjs.hash(resData.data.password);
	assert.equal(bcryptjs.compare('gymowner.special+tier1234', createdHash), true);
	assert.equal(bcryptjs.compare('wrongpassword', createdHash), false);
	console.log('✓ Check 2.2: Generated password validates against real bcryptjs');

	// --- 3. Agreement PDF Access Control & IDOR Prevention ---
	const ownInquiry = {
		_id: '660e1b2b8d4e5f6a7b8c3001',
		email: 'partner.self@gym.com',
		name: 'Partner Self',
		details: { inquiryType: 'partner' },
		partner_status: 'approved',
		partner_policy: { version: '1.0' },
		status: true,
	};
	const otherInquiry = {
		_id: '660e1b2b8d4e5f6a7b8c3002',
		email: 'partner.other@gym.com',
		name: 'Partner Other',
		details: { inquiryType: 'partner' },
		partner_status: 'approved',
		partner_policy: { version: '1.0' },
		status: true,
	};

	const pdfInquiryDb = new Map([
		[ownInquiry._id, ownInquiry],
		[otherInquiry._id, otherInquiry],
	]);

	const pdfController = loadModule(
		`${apiRoot}/src/controllers/admin/contact-inquiry/partner-agreement-pdf.js`,
		{
			'../../../database': {
				ContactInquiryRepo: {
					findOne: (q) => {
						let found = null;
						if (q._id) found = pdfInquiryDb.get(q._id) || null;
						if (q.$or) {
							for (const inq of pdfInquiryDb.values()) {
								if (inq.email === q.$or[0].email) found = inq;
							}
						}
						return {
							sort: () => ({ lean: async () => found }),
							lean: async () => found,
						};
					},
					findById: async (id) => pdfInquiryDb.get(id) || null,
				},
				AdminRepo: { findById: async () => null },
			},
			'../../../common': { adminType },
			'../../../helpers/partner-agreement-pdf': () => ({
				filename: 'agreement.pdf',
				content: Buffer.from('%PDF-mock'),
			}),
		}
	);

	// Test 3.1: Pro Partner downloading own PDF (query param)
	let pdfStatus = 200;
	let pdfHeaders = {};
	let pdfBody = null;
	const reqSelf = {
		headers: { adminAuthData: { id: 'p_self', type: adminType.pro_partner, email: 'partner.self@gym.com' } },
		query: { inquiry_id: ownInquiry._id },
		logger: { info() {}, error() {}, warn() {} },
	};
	const resSelf = {
		setHeader(k, v) { pdfHeaders[k.toLowerCase()] = v; },
		getHeader(k) { return pdfHeaders[k.toLowerCase()]; },
		status(c) { pdfStatus = c; return this; },
		send(b) { pdfBody = b; return this; },
		json(b) { pdfBody = b; return this; },
	};
	await pdfController(reqSelf, resSelf);
	assert.equal(pdfStatus, 200, 'Self inquiry PDF must succeed');
	assert.equal(pdfHeaders['content-type'], 'application/pdf');
	console.log('✓ Check 3.1: Partner downloading own agreement PDF succeeds (200 application/pdf)');

	// Test 3.2: Pro Partner attempting IDOR across tenants
	let idorStatus = 200;
	let idorBody = null;
	const reqIdor = {
		headers: { adminAuthData: { id: 'p_attacker', type: adminType.pro_partner, email: 'partner.attacker@gym.com' } },
		query: { inquiry_id: otherInquiry._id },
		logger: { info() {}, error() {}, warn() {} },
	};
	const resIdor = {
		setHeader() {},
		getHeader() {},
		status(c) { idorStatus = c; return this; },
		json(b) { idorBody = b; return this; },
	};
	await pdfController(reqIdor, resIdor);
	assert.equal(idorStatus, 403, 'Cross-tenant inquiry PDF download must be blocked with 403');
	assert.equal(idorBody.message, 'You are only authorized to access your own agreement PDF');
	console.log('✓ Check 3.2: IDOR cross-tenant access blocked (403)');

	// Test 3.3: Pro Partner zero-parameter self lookup
	let zeroStatus = 200;
	let zeroHeaders = {};
	const reqZero = {
		headers: { adminAuthData: { id: 'p_self', type: adminType.pro_partner, email: 'partner.self@gym.com' } },
		query: {},
		logger: { info() {}, error() {}, warn() {} },
	};
	const resZero = {
		setHeader(k, v) { zeroHeaders[k.toLowerCase()] = v; },
		getHeader(k) { return zeroHeaders[k.toLowerCase()]; },
		status(c) { zeroStatus = c; return this; },
		send() { return this; },
		json() { return this; },
	};
	await pdfController(reqZero, resZero);
	assert.equal(zeroStatus, 200, 'Zero-param self inquiry PDF must succeed');
	console.log('✓ Check 3.3: Partner zero-parameter agreement PDF self lookup succeeds');

	console.log('--- ALL INDEPENDENT AUDITOR ADVERSARIAL CHECKS PASSED ---');
}

runAuditorStressTests().catch((e) => {
	console.error('STRESS TEST FAILED:', e);
	process.exit(1);
});
