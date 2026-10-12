export const calculateMembershipDays = (
    joiningDate?: string,
    expiryDate?: string
) => {
    if (!joiningDate || !expiryDate) {
        return {
            totalDays: 0,
            remainingDays: 0,
            expiredDays: 0,
        }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const join = new Date(joiningDate)
    join.setHours(0, 0, 0, 0)

    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)

    const totalDays = Math.round(
        (expiry.getTime() - join.getTime()) / (1000 * 60 * 60 * 24)
    )

    // main logic
    const remainingDays = Math.round(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
        totalDays,
        remainingDays,
        expiredDays: remainingDays, // minus value preserve
    }
}