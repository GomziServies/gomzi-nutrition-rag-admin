/* eslint-disable react/jsx-no-target-blank */
import { Link } from 'react-router-dom'
import { isProPartnerOnlyUser } from '../../../../../app/modules/auth'
import { BadgePercentIcon, CartIcon, HandCoinsIcon, ShieldCheckIcon } from '../AnimatedAsideIcons'
import { AsideMenuItem } from '../AsideMenuItem'

export function RAGProPartnerAsideMenuItems() {
	const isPartnerOnly = isProPartnerOnlyUser()

	return (
		<>
			{/* Back Link to Main Admin - Visible only to Admins who have access to main store admin */}
			{!isPartnerOnly && (
				<div
					className='px-4 pt-2 pb-3 mb-2'
					style={{ borderBottom: '1px solid #E4EAF2' }}>
					<Link
						to='/rag/dashboard'
						className='btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2'
						style={{
							background: '#F1F5F9',
							border: '1px solid #E2E8F0',
							color: '#334155',
							borderRadius: '8px',
							fontSize: '11.5px',
							fontWeight: 600,
							textDecoration: 'none',
						}}>
						<i className='bi bi-arrow-left fs-7'></i>
						<span>Main RAG Admin</span>
					</Link>
				</div>
			)}

			{/* Section: Partner Dashboard & Metrics */}
			<div className='menu-item'>
				<div className='menu-content pt-2 pb-1'>
					<span
						className='menu-section text-muted text-uppercase fs-8 ls-1 fw-bolder'
						style={{ color: '#059669' }}>
						💎 RAG Pro Partner
					</span>
				</div>
			</div>

			{/* 1. Pro Partner Coupons */}
			<AsideMenuItem
				to='/rag/pro-partner/coupons'
				Icon={BadgePercentIcon}
				title='My Assigned Coupon'
			/>

			{/* 2. Commissions & Earnings */}
			<AsideMenuItem
				to='/rag/pro-partner/commissions'
				Icon={HandCoinsIcon}
				title='Commissions & Payouts'
			/>

			{/* 3. Product Sales & History */}
			<AsideMenuItem
				to='/rag/pro-partner/orders'
				Icon={CartIcon}
				title='Referred Order History'
			/>

			{/* 4. Security / Change Password */}
			<AsideMenuItem
				to='/rag/pro-partner/change-password'
				Icon={ShieldCheckIcon}
				title='Change Password'
			/>
		</>
	)
}
