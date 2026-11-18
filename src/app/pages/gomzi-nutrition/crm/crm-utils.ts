/**
 * Utility functions for RAG CRM & Leads modules
 */

/**
 * Clean and format a phone number into an international E.164-compatible string
 * suitable for WhatsApp Web / Mobile deep links (https://wa.me/<number>).
 * Strips non-digits, leading zeros, handles Indian 10-digit mobile numbers,
 * and ensures no invalid punctuation or empty strings are passed.
 */
export const cleanWhatsAppNumber = (rawPhoneInput: any): string => {
	if (!rawPhoneInput) return ''
	let digits = String(rawPhoneInput).replace(/\D/g, '')
	if (!digits) return ''

	// Strip leading zeros (e.g. "09876543210" -> "9876543210")
	while (digits.startsWith('0')) {
		digits = digits.substring(1)
	}

	// If 10 digits (standard Indian mobile number without country code), prepend "91"
	if (digits.length === 10) {
		return `91${digits}`
	}

	// If 12 digits starting with 91 (e.g. "919876543210"):
	if (digits.length === 12 && digits.startsWith('91')) {
		return digits
	}

	// Valid international length (10 to 15 digits):
	if (digits.length >= 10 && digits.length <= 15) {
		return digits
	}

	return digits
}
