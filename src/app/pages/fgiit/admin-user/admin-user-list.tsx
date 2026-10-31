/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCheckCircle,
	faCrown,
	faEdit,
	faEnvelope,
	faExclamationTriangle,
	faPhoneAlt,
	faPlus,
	faShieldAlt,
	faUser,
	faUsers,
	faUserShield,
} from '@fortawesome/free-solid-svg-icons'
import { PageTitle } from '../../../../_metronic/layout/core'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import UsersListPagination from '../../../components/TablePagination'
import { GetAdminUsers } from '../../../Functions/FGGroup'
import '../../gomzi-nutrition/common-management.css'
import '../../gomzi-nutrition/products-theme.css'
import '../../gomzi-nutrition/orders-theme.css'

const AdminUserList: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [adminData, setAdminData] = useState<any>([])
	const [loading, setLoading] = useState(false)
	const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'MASTER' | 'ADMIN'>('ALL')

	const fetchBookData = async () => {
		setLoading(true)
		try {
			const response: FGGroupAPIResponse = await GetAdminUsers()
			const list = Array.isArray(response?.data) ? response.data : []
			// Only show persons belonging to Admin roles: MASTER and Admin
			const filterData = list.filter((admin: any) => {
				const role = (admin.type || '').toUpperCase()
				return role === 'ADMIN' || role === 'MASTER'
			})
			setAdminData(filterData)
		} catch (error) {
			console.error('Error fetching admin users:', error)
			setAdminData([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchBookData()
	}, [])

	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 10,
	})

	const handlePageChange = (page: number) => {
		setPagination({ ...pagination, page })
	}

	const handleItemsPerPageChange = (value: number) => {
		setPagination({ ...pagination, itemsPerPage: value, page: 1 })
	}

	const filteredAdminData = adminData.filter((admin: any) => {
		const role = (admin.type || '').toUpperCase()
		if (selectedRoleFilter === 'MASTER' && role !== 'MASTER') return false
		if (selectedRoleFilter === 'ADMIN' && role !== 'ADMIN') return false

		return (
			(admin.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(admin.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
			(admin.mobile || '').toString().includes(searchTerm) ||
			(admin.type || '').toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	const paginatedAdminData = filteredAdminData.slice(
		(pagination.page - 1) * pagination.itemsPerPage,
		pagination.page * pagination.itemsPerPage
	)

	// Summary KPI calculations
	const totalAdmins = adminData.length
	const masterAdmins = adminData.filter((a: any) => (a.type || '').toUpperCase() === 'MASTER').length
	const mfaConfigured = adminData.filter((a: any) => a.MFA_enabled && a.MFA_enabled.length > 0).length
	const standardAdmins = adminData.filter((a: any) => (a.type || '').toUpperCase() === 'ADMIN').length

	const renderRoleBadge = (type: string) => {
		const upper = (type || '').toUpperCase()
		if (upper === 'MASTER') {
			return (
				<span className='gz-mgmt-pill purple' title='Highest privilege master account'>
					<FontAwesomeIcon icon={faCrown} style={{ fontSize: '10px' }} />
					<span>MASTER</span>
				</span>
			)
		}
		if (upper === 'ADMIN') {
			return (
				<span className='gz-mgmt-pill info' title='System Administrator'>
					<FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '10px' }} />
					<span>ADMIN</span>
				</span>
			)
		}
		if (upper === 'DISPATCH') {
			return (
				<span className='gz-mgmt-pill warning' title='Dispatch Coordinator'>
					<span>DISPATCH</span>
				</span>
			)
		}
		if (upper === 'ACCOUNTS') {
			return (
				<span className='gz-mgmt-pill success' title='Accounts Manager'>
					<span>ACCOUNTS</span>
				</span>
			)
		}
		return (
			<span className='gz-mgmt-pill slate'>
				<span>{type || 'ADMIN'}</span>
			</span>
		)
	}

	return (
		<div className='gz-mgmt-container'>
			<PageTitle breadcrumbs={[]}>Admin Users</PageTitle>

			{/* =========================================================================
			    BREADCRUMBS
			    ========================================================================= */}
			<div className='gz-mgmt-breadcrumb'>
				<Link to='/rag/dashboard'>Dashboard</Link>
				<span className='sep'>&gt;</span>
				<span className='current'>Admin Users</span>
			</div>

			{/* =========================================================================
			    PAGE HEADER
			    ========================================================================= */}
			<div className='gz-mgmt-header'>
				<div className='gz-mgmt-title-wrap'>
					<h1 className='gz-mgmt-title'>Admin Users Management</h1>
					<p className='gz-mgmt-subtitle'>
						Review provisioned administrators, privilege hierarchies, and multi-factor authentication security.
					</p>
				</div>
				<div className='d-flex align-items-center gap-3 flex-wrap'>
					<Link to='/rag/admin-user-add' className='gz-mgmt-btn-primary'>
						<FontAwesomeIcon icon={faPlus} />
						<span>Add Admin</span>
					</Link>
				</div>
			</div>

			{/* =========================================================================
			    SUMMARY METRICS STRIP
			    ========================================================================= */}
			<div className='gz-mgmt-stats-grid'>
				<div className='gz-mgmt-stat-card' onClick={() => { setSelectedRoleFilter('ALL'); setPagination(p => ({ ...p, page: 1 })) }} style={{ cursor: 'pointer', outline: selectedRoleFilter === 'ALL' ? '2px solid #2563EB' : 'none' }} title='Filter to all admin accounts'>
					<div className='gz-mgmt-stat-icon blue'>
						<FontAwesomeIcon icon={faUserShield} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>Total Admin Accounts</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '38px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-mgmt-stat-value'>{totalAdmins}</span>
						)}
					</div>
				</div>

				<div className='gz-mgmt-stat-card' onClick={() => { setSelectedRoleFilter('MASTER'); setPagination(p => ({ ...p, page: 1 })) }} style={{ cursor: 'pointer', outline: selectedRoleFilter === 'MASTER' ? '2px solid #9333EA' : 'none' }} title='Filter to Master role only'>
					<div className='gz-mgmt-stat-icon purple'>
						<FontAwesomeIcon icon={faCrown} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>Master Operators</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '38px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-mgmt-stat-value' style={{ color: '#9333EA' }}>
								{masterAdmins}
							</span>
						)}
					</div>
				</div>

				<div className='gz-mgmt-stat-card'>
					<div className='gz-mgmt-stat-icon green'>
						<FontAwesomeIcon icon={faShieldAlt} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>MFA Protected</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '38px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-mgmt-stat-value' style={{ color: '#16A34A' }}>
								{mfaConfigured}
							</span>
						)}
					</div>
				</div>

				<div className='gz-mgmt-stat-card' onClick={() => { setSelectedRoleFilter('ADMIN'); setPagination(p => ({ ...p, page: 1 })) }} style={{ cursor: 'pointer', outline: selectedRoleFilter === 'ADMIN' ? '2px solid #D97706' : 'none' }} title='Filter to Admin role only'>
					<div className='gz-mgmt-stat-icon amber'>
						<FontAwesomeIcon icon={faUser} />
					</div>
					<div className='gz-mgmt-stat-info'>
						<span className='gz-mgmt-stat-label'>Standard Admins</span>
						{loading ? (
							<div className='gz-skeleton mt-1' style={{ width: '38px', height: '22px', borderRadius: '4px' }} />
						) : (
							<span className='gz-mgmt-stat-value' style={{ color: '#D97706' }}>
								{standardAdmins}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* =========================================================================
			    MAIN TABLE CARD
			    ========================================================================= */}
			<div className='gz-mgmt-card'>
				{/* Toolbar */}
				<div className='gz-mgmt-toolbar'>
					<div className='gz-mgmt-toolbar-left flex-wrap gap-2'>
						<SearchFilter
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
						/>
						<div className='d-inline-flex align-items-center gap-1 p-1 bg-light rounded-pill'>
							<button
								type='button'
								onClick={() => { setSelectedRoleFilter('ALL'); setPagination(p => ({ ...p, page: 1 })) }}
								className={`btn btn-sm py-1.5 px-3 rounded-pill fw-bold ${selectedRoleFilter === 'ALL' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
								style={{ fontSize: '12px' }}>
								All Admins ({totalAdmins})
							</button>
							<button
								type='button'
								onClick={() => { setSelectedRoleFilter('MASTER'); setPagination(p => ({ ...p, page: 1 })) }}
								className={`btn btn-sm py-1.5 px-3 rounded-pill fw-bold ${selectedRoleFilter === 'MASTER' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
								style={{ fontSize: '12px' }}>
								Master ({masterAdmins})
							</button>
							<button
								type='button'
								onClick={() => { setSelectedRoleFilter('ADMIN'); setPagination(p => ({ ...p, page: 1 })) }}
								className={`btn btn-sm py-1.5 px-3 rounded-pill fw-bold ${selectedRoleFilter === 'ADMIN' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
								style={{ fontSize: '12px' }}>
								Admin ({standardAdmins})
							</button>
						</div>
						<div className='d-inline-block'>
							<LengthMenu
								expenseData={paginatedAdminData}
								handleItemsPerPageChange={handleItemsPerPageChange}
							/>
						</div>
					</div>
					<div className='gz-mgmt-toolbar-right'>
						<span className='fs-8 fw-semibold text-muted'>
							Showing {paginatedAdminData.length} of {filteredAdminData.length} administrators
						</span>
					</div>
				</div>

				{/* Table */}
				<div className='gz-mgmt-table-wrap'>
					<table className='table mb-0'>
						<thead>
							<tr>
								<th style={{ width: '56px', textAlign: 'center' }}>No.</th>
								<th style={{ minWidth: '220px' }}>Administrator</th>
								<th style={{ minWidth: '200px' }}>Email Address</th>
								<th style={{ minWidth: '150px' }}>Mobile Number</th>
								<th style={{ minWidth: '130px' }}>Account Role</th>
								<th style={{ minWidth: '150px' }}>MFA Security</th>
								<th style={{ minWidth: '90px', textAlign: 'center' }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								[...Array(5)].map((_, idx) => (
									<tr key={`admin-skel-${idx}`} className='gz-skeleton-tr'>
										<td style={{ textAlign: 'center' }}>
											<div className='gz-skeleton rounded mx-auto' style={{ width: '22px', height: '16px' }} />
										</td>
										<td>
											<div className='gz-mgmt-identity-cell'>
												<div className='gz-skeleton rounded-circle' style={{ width: '38px', height: '38px', flexShrink: 0 }} />
												<div className='d-flex flex-column gap-1.5'>
													<div className='gz-skeleton rounded' style={{ width: '130px', height: '14px' }} />
													<div className='gz-skeleton rounded' style={{ width: '85px', height: '11px' }} />
												</div>
											</div>
										</td>
										<td>
											<div className='gz-skeleton rounded' style={{ width: '160px', height: '14px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded' style={{ width: '110px', height: '14px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded-pill' style={{ width: '90px', height: '22px' }} />
										</td>
										<td>
											<div className='gz-skeleton rounded-pill' style={{ width: '110px', height: '22px' }} />
										</td>
										<td style={{ textAlign: 'center' }}>
											<div className='gz-skeleton rounded-circle mx-auto' style={{ width: '32px', height: '32px' }} />
										</td>
									</tr>
								))
							) : paginatedAdminData.length > 0 ? (
								paginatedAdminData.map((admin: any, index: number) => {
									const actualIndex =
										(pagination.page - 1) * pagination.itemsPerPage + index + 1
									const isMfaEnabled = admin.MFA_enabled && admin.MFA_enabled.length > 0
									const initials = (admin.full_name || 'Admin')
										.split(' ')
										.map((part: string) => part[0])
										.slice(0, 2)
										.join('')
										.toUpperCase()

									return (
										<tr key={admin._id || admin.id || actualIndex}>
											<td style={{ textAlign: 'center', fontWeight: 700, color: '#71809A' }}>
												{actualIndex}
											</td>
											<td>
												<div className='gz-mgmt-identity-cell'>
													<div className='gz-mgmt-avatar'>{initials}</div>
													<div className='gz-mgmt-identity-info'>
														<span className='gz-mgmt-identity-name'>
															{admin.full_name || 'Unnamed Admin'}
														</span>
														<span className='gz-mgmt-identity-sub'>
															{admin.type || 'Staff Account'}
														</span>
													</div>
												</div>
											</td>
											<td>
												{admin.email ? (
													<a
														href={`mailto:${admin.email}`}
														style={{
															color: '#172B4D',
															textDecoration: 'none',
															fontSize: '13px',
															display: 'inline-flex',
															alignItems: 'center',
															gap: '6px',
														}}>
														<FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '11px', color: '#71809A' }} />
														<span>{admin.email}</span>
													</a>
												) : (
													<span style={{ color: '#A0ABC0' }}>—</span>
												)}
											</td>
											<td>
												{admin.mobile ? (
													<a
														href={`tel:${admin.mobile}`}
														style={{
															color: '#172B4D',
															textDecoration: 'none',
															fontSize: '13px',
															fontWeight: 500,
															display: 'inline-flex',
															alignItems: 'center',
															gap: '6px',
														}}>
														<FontAwesomeIcon icon={faPhoneAlt} style={{ fontSize: '11px', color: '#71809A' }} />
														<span>{admin.mobile}</span>
													</a>
												) : (
													<span style={{ color: '#A0ABC0' }}>—</span>
												)}
											</td>
											<td>{renderRoleBadge(admin.type)}</td>
											<td>
												{isMfaEnabled ? (
													<span
														className='gz-mgmt-pill success'
														title='Account is secured by Multi-Factor Authentication.'>
														<FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '10px' }} />
														<span>MFA Active</span>
													</span>
												) : (
													<span
														className='gz-mgmt-pill warning'
														title='This account has not set up Multi-Factor Authentication.'>
														<FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '10px' }} />
														<span>Not Setup</span>
													</span>
												)}
											</td>
											<td style={{ textAlign: 'center' }}>
												<Link
													to={`/rag/admin-user-edit?admin_id=${admin._id || admin.id}`}
													className='gz-mgmt-action-btn'
													title='Edit Admin'>
													<FontAwesomeIcon icon={faEdit} />
												</Link>
											</td>
										</tr>
									)
								})
							) : (
								<tr>
									<td colSpan={7} className='text-center py-10'>
										<div className='d-flex flex-column align-items-center justify-content-center my-6'>
											<div
												className='d-inline-flex align-items-center justify-content-center mb-3'
												style={{
													width: '48px',
													height: '48px',
													borderRadius: '50%',
													background: '#F5F7FB',
													color: '#71809A',
												}}>
												<FontAwesomeIcon icon={faUsers} style={{ fontSize: '20px' }} />
											</div>
											<h4 className='fw-bold mb-1' style={{ color: '#172B4D' }}>
												No Administrators Found
											</h4>
											<p className='text-muted fs-7 mb-0'>
												{searchTerm
													? 'No administrator accounts matched your search keyword.'
													: 'No administrator accounts are registered.'}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredAdminData.length > 0 && (
					<div
						className='px-6 py-4'
						style={{ borderTop: '1px solid #EEF2F7', background: '#FFFFFF' }}>
						<UsersListPagination
							totalPages={Math.ceil(filteredAdminData.length / pagination.itemsPerPage)}
							currentPage={pagination.page}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default AdminUserList
