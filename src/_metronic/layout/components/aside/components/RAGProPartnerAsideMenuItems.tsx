/* eslint-disable react/jsx-no-target-blank */
import { Link } from 'react-router-dom'
import { isProPartnerOnlyUser } from '../../../../../app/modules/auth'
import { BadgePercentIcon, CartIcon, HandCoinsIcon, ShieldCheckIcon } from '../AnimatedAsideIcons'
import { AsideMenuItem } from '../AsideMenuItem'

export function RAGProPartnerAsideMenuItems() {
	const isPartnerOnly = isProPartnerOnlyUser()

	return (
		<div className='gz-pro-partner-sidebar-menu'>
			{/* Back Link to Main Admin - Visible only to Admins who have access to main store admin */}
			{!isPartnerOnly && (
				<div
					className='px-3 pt-2 pb-3 mb-2'
					style={{ borderBottom: '1px solid #EFE4DC' }}>
					<Link
						to='/rag/dashboard'
						className='btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2 gz-back-to-admin-btn'
						style={{
							background: '#FAF5F0',
							border: '1px solid #EFE4DC',
							color: '#78350F',
							borderRadius: '8px',
							fontSize: '12px',
							fontWeight: 600,
							textDecoration: 'none',
							transition: 'all 0.2s ease',
						}}>
						<i className='bi bi-arrow-left fs-7' style={{ color: '#78350F' }}></i>
						<span>Main RAG Admin</span>
					</Link>
				</div>
			)}

			{/* Section: Partner Dashboard & Metrics */}
			<div className='menu-item gz-pro-partner-section-header'>
				<div className='menu-content pt-2 pb-1 px-3'>
					<span
						className='menu-section fs-8 ls-1 fw-bolder text-uppercase gz-partner-section-title'
						style={{ color: '#78350F' }}>
						RAG Pro Partner
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

			{/* 4. Partner Profile & Settings */}
			<AsideMenuItem
				to='/rag/pro-partner/settings'
				Icon={ShieldCheckIcon}
				title='Partner Profile & Settings'
			/>
		</div>
	)
}
