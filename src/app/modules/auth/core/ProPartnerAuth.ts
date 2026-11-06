import { GetReferralCoupon } from '../../../Functions/FGGroup'
import { getProfile } from '../../../Functions/FGGroup/AccountFunctions'

/**
 * Safely decodes the payload of a JWT string in browser and test/Node environments (synchronous, 0ms).
 */
export const decodeJwtPayload = (token: string): any => {
	try {
		if (!token || typeof token !== 'string') return null
		const parts = token.trim().split('.')
		if (parts.length !== 3) return null

		const base64Url = parts[1]
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

		let jsonPayload = ''
		if (typeof window !== 'undefined' && typeof window.atob === 'function') {
			jsonPayload = decodeURIComponent(
				window
					.atob(base64)
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			)
		} else if (typeof atob === 'function') {
			jsonPayload = decodeURIComponent(
				atob(base64)
					.split('')
					.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
					.join('')
			)
		} else if (typeof Buffer !== 'undefined') {
			jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
		}
		return JSON.parse(jsonPayload)
	} catch {
		return null
	}
}

/**
 * Extracts and decodes the current active auth JWT from localStorage synchronously.
 */
export const getDecodedAuthToken = (): any => {
	try {
		const raw =
			localStorage.getItem('auth_fg_group') ||
			localStorage.getItem('auth_fwg') ||
			localStorage.getItem('@fggroup+auth')
		if (!raw) return null

		let tokenStr = raw
		if (raw.startsWith('{') || raw.startsWith('"')) {
			try {
				const parsed = JSON.parse(raw)
				tokenStr =
					parsed?.authorization ||
					parsed?.token ||
					parsed?.access ||
					(typeof parsed === 'string' ? parsed : raw)
			} catch {}
		}

		return decodeJwtPayload(tokenStr)
	} catch {
		return null
	}
}

/**
 * Synchronous alias for extracting active JWT payload claims.
 */
export const getJwtTokenPayload = (): any => {
	return getDecodedAuthToken()
}

/**
 * Checks if a given token string or auth response object belongs to a Pro Partner.
 */
export const isProPartnerToken = (token: any): boolean => {
	if (!token) return false
	let tokenStr = typeof token === 'string' ? token : token?.authorization || token?.token || ''
	if (typeof tokenStr === 'string' && tokenStr.startsWith('{')) {
		try {
			const parsed = JSON.parse(tokenStr)
			tokenStr = parsed?.authorization || parsed?.token || tokenStr
		} catch {}
	}
	const decoded = decodeJwtPayload(tokenStr)
	const role = (decoded?.type || decoded?.role || '').toLowerCase().trim()
	return role === 'rag_pro_partner'
}

/**
 * Sets Pro Partner session tokens in localStorage cleanly and purges hazardous redirect keys.
 */
export const setProPartnerSessionTokens = () => {
	localStorage.setItem('admin', 'RAG_Pro_Partner')
	localStorage.setItem('admin_type', 'RAG_Pro_Partner')
	localStorage.setItem('is_pro_partner_user', 'true')
	localStorage.removeItem('is_employee_login')
	localStorage.removeItem('is_hr_portal')
	localStorage.removeItem('searchedURL')
}

/**
 * Checks whether the current session is strictly a Pro Partner session.
 * Returns true ONLY when the user's identity/role is explicitly 'rag_pro_partner'.
 * 
 * IMPORTANT: Does NOT check 'has_assigned_coupon' — an admin who happens to have
 * a coupon assigned should NOT be treated as a Pro Partner session. Coupon presence
 * gates panel visibility, not session identity.
 */
export const isProPartnerSession = (userProfile?: any): boolean => {
	// 1. Explicit profile type or role check
	const profileType = (userProfile?.type || '').toLowerCase().trim()
	const profileRole = (userProfile?.role || '').toLowerCase().trim()
	if (profileType === 'rag_pro_partner' || profileRole === 'rag_pro_partner') return true

	// 2. Synchronous JWT claim check (cryptographically derived)
	const decoded = getDecodedAuthToken()
	const tokenType = (decoded?.type || decoded?.role || '').toLowerCase().trim()
	if (tokenType === 'rag_pro_partner') return true

	// 3. Cached profile check
	try {
		const rawProfile =
			localStorage.getItem('fg_group_info') || localStorage.getItem('portal_info')
		if (rawProfile) {
			const parsed = JSON.parse(rawProfile)
			const pType = (parsed?.type || parsed?.role || '').toLowerCase().trim()
			if (pType === 'rag_pro_partner') {
				return true
			}
		}
	} catch {}

	// 4. Session flags check — ONLY identity flags, NOT coupon presence
	const adminVal = (localStorage.getItem('admin') || '').toLowerCase().trim()
	const adminTypeVal = (localStorage.getItem('admin_type') || '').toLowerCase().trim()
	const isPartner = localStorage.getItem('is_pro_partner_user') === 'true'

	return (
		isPartner ||
		adminVal === 'rag_pro_partner' ||
		adminTypeVal === 'rag_pro_partner'
	)
}

/**
 * Checks if the user is an administrative user (Master / SuperAdmin / System Admin).
 * Admin role is determined ONLY by the user's profile type, stored admin role, or JWT claims.
 * Completely independent of Pro Partner session — no circular dependencies.
 */
export const isUserAdmin = (userProfile?: any): boolean => {
	const profileType = (userProfile?.type || '').toLowerCase().trim()
	const profileRole = (userProfile?.role || '').toLowerCase().trim()

	// 1. Explicit Pro Partner type — NEVER admin, regardless of any other flag
	if (profileType === 'rag_pro_partner' || profileRole === 'rag_pro_partner') {
		return false
	}

	// 2. Master & Superadmin always have unrestricted access
	const adminKeywords = ['master', 'superadmin', 'admin', 'gomzi_nutrition']
	if (
		adminKeywords.includes(profileType) ||
		adminKeywords.includes(profileRole)
	) {
		return true
	}

	// 3. Check stored admin type (set during login)
	const storedAdmin = (localStorage.getItem('admin') || '').toLowerCase().trim()
	const storedAdminType = (localStorage.getItem('admin_type') || '').toLowerCase().trim()

	// If stored admin is explicitly pro partner, not admin
	if (storedAdmin === 'rag_pro_partner' || storedAdminType === 'rag_pro_partner') {
		return false
	}

	if (
		adminKeywords.includes(storedAdmin) ||
		adminKeywords.includes(storedAdminType) ||
		userProfile?.is_admin === true ||
		userProfile?.is_superadmin === true
	) {
		return true
	}

	// 4. Check cached profile (for cases where userProfile param is not passed)
	if (!userProfile) {
		try {
			const raw = localStorage.getItem('fg_group_info') || localStorage.getItem('portal_info')
			if (raw) {
				const cached = JSON.parse(raw)
				const cachedType = (cached?.type || cached?.role || '').toLowerCase().trim()
				if (cachedType === 'rag_pro_partner') return false
				if (adminKeywords.includes(cachedType) || cached?.is_admin === true || cached?.is_superadmin === true) {
					return true
				}
			}
		} catch {}
	}

	return false
}

/**
 * Checks if the user is restricted strictly to the RAG Pro Partner portal.
 * Returns true ONLY if:
 * 1. The user is NOT an admin
 * 2. The session is identified as a Pro Partner session
 */
export const isProPartnerOnlyUser = (userProfile?: any): boolean => {
	if (isUserAdmin(userProfile)) return false
	return isProPartnerSession(userProfile)
}

/**
 * Verifies with the API whether this user has an assigned coupon.
 * Matches against partner_email, partner_mobile, partner_inquiry_id, or trainer/user_id.
 * Caches results in localStorage for synchronous checks.
 */
export const checkUserHasAssignedCoupon = async (
	userProfile?: any
): Promise<{ hasCoupon: boolean; coupon?: any }> => {
	try {
		const token = localStorage.getItem('auth_fg_group')
		if (!token) return { hasCoupon: false }

		let profile = userProfile
		if (!profile) {
			const raw = localStorage.getItem('fg_group_info') || localStorage.getItem('portal_info')
			if (raw) {
				try {
					profile = JSON.parse(raw)
				} catch {}
			}
		}

		if (!profile) {
			try {
				const profRes: any = await getProfile()
				if (profRes?.data) {
					profile = profRes.data
					localStorage.setItem('fg_group_info', JSON.stringify(profRes.data))
				}
			} catch (e) {
				console.error('Failed to fetch profile during coupon check', e)
			}
		}

		// Direct coupon in profile
		if (profile?.assigned_coupon || profile?.coupon_code || profile?.partner_coupon) {
			const couponObj = {
				coupon_code: profile.assigned_coupon || profile.coupon_code || profile.partner_coupon,
			}
			localStorage.setItem('has_assigned_coupon', 'true')
			localStorage.setItem('assigned_coupon_code', couponObj.coupon_code)
			return { hasCoupon: true, coupon: couponObj }
		}

		const userEmail = (profile?.email || '').toLowerCase().trim()
		const userMobile = (profile?.mobile || profile?.phone_number || profile?.phone || '').trim()
		const userId = String(profile?._id || profile?.id || '').trim()

		// Query pro_partner coupons from backend
		const res: any = await GetReferralCoupon({ coupon_type: 'pro_partner' })
		const coupons: any[] = Array.isArray(res?.data) ? res.data : []

		const matched = coupons.find((c: any) => {
			const cEmail = (
				c.partner_email ||
				c.partner_inquiry_id?.email ||
				c.partner_inquiry_id?.details?.email ||
				''
			)
				.toLowerCase()
				.trim()
			const cMobile = (
				c.partner_mobile ||
				c.partner_inquiry_id?.mobile ||
				c.partner_inquiry_id?.details?.mobile ||
				''
			).trim()
			const inqId = String(
				c.partner_inquiry_id?._id ||
				c.partner_inquiry_id ||
				c.assign_trainer?.trainer_id ||
				''
			).trim()
			const createdBy = String(c.user_id || c.created_by || '').trim()

			if (userEmail && cEmail && cEmail === userEmail) return true
			if (userMobile && cMobile && cMobile === userMobile) return true
			if (userId && (inqId === userId || createdBy === userId)) return true
			return false
		})

		if (matched) {
			localStorage.setItem('has_assigned_coupon', 'true')
			localStorage.setItem('assigned_coupon_code', matched.coupon_code || '')
			localStorage.setItem('assigned_coupon_data', JSON.stringify(matched))
			return { hasCoupon: true, coupon: matched }
		} else {
			localStorage.setItem('has_assigned_coupon', 'false')
			localStorage.removeItem('assigned_coupon_code')
			localStorage.removeItem('assigned_coupon_data')
			return { hasCoupon: false }
		}
	} catch (err) {
		console.error('Error verifying assigned coupon:', err)
		const cached = localStorage.getItem('has_assigned_coupon') === 'true'
		return { hasCoupon: cached }
	}
}

/**
 * Called right after login or during app initialization to setup session roles
 * and route Pro Partner users to their dedicated panel.
 * 
 * CRITICAL: Admin users are NEVER demoted to Pro Partner, even if they have assigned coupons.
 * Only users whose profile type is explicitly 'rag_pro_partner' get partner session tokens.
 */
export const syncAndRouteProPartnerUser = async (userProfile?: any): Promise<boolean> => {
	try {
		let profile = userProfile
		if (!profile) {
			const raw = localStorage.getItem('fg_group_info') || localStorage.getItem('portal_info')
			if (raw) {
				try { profile = JSON.parse(raw) } catch {}
			}
		}
		if (!profile) {
			try {
				const res: any = await getProfile()
				if (res?.data) {
					profile = res.data
					localStorage.setItem('fg_group_info', JSON.stringify(res.data))
				}
			} catch {}
		}

		// Admin users NEVER get demoted to Pro Partner — check this FIRST
		if (isUserAdmin(profile)) {
			// Still check for coupon (for display purposes in admin panel) but don't set partner session
			checkUserHasAssignedCoupon(profile).catch(() => {})
			return false
		}

		const profileType = (profile?.type || '').toLowerCase().trim()
		const profileRole = (profile?.role || '').toLowerCase().trim()

		// Only set Pro Partner session if identity is explicitly pro_partner
		if (profileType === 'rag_pro_partner' || profileRole === 'rag_pro_partner') {
			setProPartnerSessionTokens()
			checkUserHasAssignedCoupon(profile).catch(() => {})
			return true
		}

		// For non-admin, non-partner users: check if they have a coupon assigned
		// (this would make them a pro partner user by assignment)
		const { hasCoupon } = await checkUserHasAssignedCoupon(profile)
		if (hasCoupon) {
			setProPartnerSessionTokens()
			return true
		}

		// Clean up any stale Pro Partner flags for users who lost their coupon
		if (
			localStorage.getItem('admin') === 'RAG_Pro_Partner' &&
			profileType !== 'rag_pro_partner' &&
			!isProPartnerSession(profile)
		) {
			localStorage.setItem('admin', 'Employee')
			localStorage.setItem('admin_type', 'Employee')
		}
		return false
	} catch (err) {
		console.error('syncAndRouteProPartnerUser error', err)
		return isProPartnerSession(userProfile)
	}
}

