export function getOrderContact(order: any) {
	const user = order?.user_info || {}
	const notes = order?.notes || {}
	const email = notes.email || user.email
	const mobile = notes.mobile || notes.phone || user.mobile || order?.shipping_address?.mobile
	return {
		...user,
		first_name: notes.first_name || user.first_name,
		last_name: notes.last_name || user.last_name,
		email, mobile,
		emailVerified: Boolean(user.emailVerified && email === user.email),
		mobileVerified: Boolean(user.mobileVerified && mobile === user.mobile),
	}
}
