import {
	faChevronLeft,
	faEllipsisVertical,
	faFile,
	faMagnifyingGlass,
	faPhone,
	faRightFromBracket,
	faThumbtack,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Link, useNavigate } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle, useLayout } from '../../../../_metronic/layout/core'
import { GetAdminUsers } from '../../../Functions/FGGroup'
import { GetEmployeeChatHistory } from '../../../Functions/FGGroup/EmployeeChat'
import { EmployeeChatInner } from './ChatInner'
import './employee-chat.css'

const EmployeeChatPage = () => {
	const navigate = useNavigate()
	const { config } = useLayout()
	const { aside } = config
	const [searchTerm, setSearchTerm] = useState('')
	const [currentUser, setCurrentUser] = useState({ name: '', profileImg: '' })
	const [userId, setUserId] = useState('')
	const [userData, setUserData] = useState<any[]>([])
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 50,
		totalPages: 0,
	})
	const [loading, setLoading] = useState(false)
	const [messages, setMessages] = useState<any>({})

	const fetchUserData = useCallback(
		async (page = 1, reset = false) => {
			setLoading(true)
			try {
				const response: any = await GetAdminUsers()
				const { data } = response
				let filteredData = data

				let masterUser: any = null
				if (Array.isArray(filteredData)) {
					masterUser = filteredData.find((employee: any) => employee.type === 'MASTER') || filteredData[0]
					setUserData(masterUser ? [masterUser] : filteredData)
				} else if (filteredData) {
					masterUser = filteredData
					setUserData([filteredData])
				}

				if (masterUser?._id) {
					fetchChatData(masterUser._id)
					if (!userId) {
						userHandle(
							masterUser?.full_name || 'System @ FG Group',
							masterUser._id,
							masterUser?.photo ? `https://files.fggroup.in/` + masterUser.photo : ''
						)
					}
				}

				setPagination((prev) => ({
					...prev,
					totalPages: response?.metadata?.pagination?.totalPages || 1,
					page,
				}))
			} catch (error) {
				console.error('Error fetching admin users for employee chat:', error)
			}
			setLoading(false)
		},
		[pagination.itemsPerPage, userId]
	)

	const fetchChatData = async (id?: any) => {
		if (!id) return
		try {
			const response = await GetEmployeeChatHistory({ participant: id })
			if (response?.data && response.data.length > 0) {
				const filteredResponse = response.data[response.data.length - 1]
				const messageFromAdmin = filteredResponse?.from === id
				setMessages({ ...filteredResponse, messageFromAdmin })
			}

			// Scroll to latest message
			const messagesDiv = document.querySelector('[data-kt-element="messages"]')
			if (messagesDiv) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight
			}
		} catch (error) {
			console.error('Error fetching employee chat history:', error)
		}
	}

	const loadMore = () => {
		if (pagination.page < pagination.totalPages) {
			fetchUserData(pagination.page + 1)
		}
	}

	useEffect(() => {
		aside.minimize
		fetchUserData(1, true)
	}, [fetchUserData])

	const userHandle = (full_name: any, id: any, profile: any) => {
		const profileImg = profile || ''
		const name = full_name ? `${full_name}` : 'System @ FG Group'
		setCurrentUser({ name, profileImg })
		setUserId(id)
	}

	const truncateText = (text: string | null | undefined, length: number) => {
		if (!text) {
			return (
				<>
					<FontAwesomeIcon icon={faFile} /> Files
				</>
			)
		}
		if (text.length <= length) {
			return text
		}
		return text.substring(0, length) + '...'
	}

	const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

	useEffect(() => {
		const handler = setTimeout(() => {
			setSearchTerm(localSearchTerm)
		}, 300)

		return () => {
			clearTimeout(handler)
		}
	}, [localSearchTerm])

	const displayedUsers = userData.filter((user: any) => {
		if (!searchTerm.trim()) return true
		return user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
	})

	return (
		<>
			<PageTitle breadcrumbs={[]}>Chat</PageTitle>

			<div
				className='gz-emp-chat-container'>
				{/* --------------------------------------------------------
				   Left Panel: Conversations Inbox
				   -------------------------------------------------------- */}
				<div
					className={`gz-emp-sidebar ${userId ? 'd-none d-lg-flex' : 'd-flex'}`}
					id='kt_chat_contacts_sidebar'>
					{/* Top Header: GOMZI Logo & Exit Action */}
					<div className='gz-emp-sidebar-header' id='kt_chat_contacts_header'>
						<div className='gz-emp-logo-lockup'>
							<img
								alt='GOMZI'
								src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
								className='gz-emp-logo-mark'
							/>
							<span className='gz-emp-logo-text'>GOMZI</span>
						</div>
						<Link
							to='/employee/dashboard'
							className='gz-emp-exit-icon-btn'
							title='Exit to Dashboard'>
							<FontAwesomeIcon icon={faRightFromBracket} />
						</Link>
					</div>

					{/* Messages Heading with Lavender Badge */}
					<div className='gz-emp-heading-row'>
						<h1 className='gz-emp-heading-title'>Messages</h1>
						<span className='gz-emp-badge-pill'>{displayedUsers.length || 1}</span>
					</div>

					{/* WhatsApp-Style Rounded Search Bar */}
					<div className='gz-emp-search-wrap'>
						<div className='gz-emp-search-box'>
							<FontAwesomeIcon icon={faMagnifyingGlass} className='gz-emp-search-icon' />
							<input
								type='text'
								data-kt-user-table-filter='search'
								className='gz-emp-search-input'
								placeholder='Search conversations...'
								value={localSearchTerm}
								onChange={(e) => setLocalSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					{/* Conversation List */}
					<div className='gz-emp-contacts-scroll' id='scrollableDiv'>
						{loading && (!userData || userData.length === 0) ? (
							<div className='p-3 d-flex flex-column gap-3'>
								{[...Array(5)].map((_, idx) => (
									<div key={idx} className='d-flex align-items-center gap-3 py-2'>
										<div
											className='gz-skeleton rounded-circle'
											style={{ width: '46px', height: '46px', flexShrink: 0 }}
										/>
										<div className='d-flex flex-column gap-2 flex-grow-1'>
											<div
												className='gz-skeleton rounded'
												style={{ width: '60%', height: '14px' }}
											/>
											<div
												className='gz-skeleton rounded'
												style={{ width: '40%', height: '11px' }}
											/>
										</div>
									</div>
								))}
							</div>
						) : displayedUsers.length === 0 ? (
							<div className='text-muted fs-6 fw-bold text-center py-10'>No chat found.</div>
						) : (
							<InfiniteScroll
								dataLength={displayedUsers.length}
								next={loadMore}
								hasMore={pagination.page < pagination.totalPages}
								loader={
									<div className='d-flex justify-content-center align-items-center my-4'>
										<div className='spinner-border text-primary' role='status'>
											<span className='visually-hidden'>Loading...</span>
										</div>
									</div>
								}
								endMessage={null}
								scrollableTarget='scrollableDiv'
								pullDownToRefresh
								pullDownToRefreshThreshold={50}
								pullDownToRefreshContent={
									<h3 style={{ textAlign: 'center' }}>&#8595; Pull down to refresh</h3>
								}
								releaseToRefreshContent={
									<h3 style={{ textAlign: 'center' }}>&#8593; Release to refresh</h3>
								}
								refreshFunction={() => fetchUserData(1, true)}>
								{displayedUsers.map((user: any) => {
									const isSelected = user._id === userId
									const photoUrl = user?.employee?.photo || user?.photo
									const lastTimeStr = messages?.createdAt
										? DayJS().isSame(DayJS(messages?.createdAt), 'day')
											? DayJS(messages?.createdAt).format('h:mm A')
											: DayJS().subtract(1, 'day').isSame(DayJS(messages?.createdAt), 'day')
											? 'Yesterday'
											: DayJS(messages?.createdAt).format('MMM D, YYYY')
										: 'Sep 21, 2026'

									return (
										<button
											key={user._id}
											className={`gz-emp-contact-card ${isSelected ? 'is-active' : ''}`}
											onClick={() =>
												userHandle(
													user?.full_name,
													user._id,
													photoUrl ? `https://files.fggroup.in/` + photoUrl : ''
												)
											}>
											<div className='d-flex align-items-center justify-content-between'>
												<div className='d-flex align-items-center' style={{ minWidth: 0 }}>
													<div className='gz-emp-avatar me-3'>
														{photoUrl ? (
															<img
																alt='Avatar'
																src={`https://files.fggroup.in/` + photoUrl}
															/>
														) : (
															<span>{user?.full_name?.charAt(0).toUpperCase() || 'S'}</span>
														)}
													</div>
													<div className='text-truncate' style={{ minWidth: 0 }}>
														<p
															className='text-start fw-bold mb-0 text-truncate'
															style={{ color: '#0F172A', fontSize: '15px' }}>
															{user?.full_name || 'System @ FG Group'}
														</p>
														<div
															className='text-start text-truncate'
															style={{ fontSize: '13px', color: '#64748B' }}>
															{user?.type ? user.type.toLowerCase() : 'demo'}
														</div>
														<div
															className='text-start text-truncate'
															style={{
																fontSize: '12.5px',
																color: '#64748B',
																marginTop: '1px',
															}}>
															<span title={messages?.message}>
																{messages?.message
																	? truncateText(messages.message, 24)
																	: 'Yay! You have seen it all'}
															</span>
														</div>
													</div>
												</div>
												<div
													className='d-flex flex-column align-items-end justify-content-between flex-shrink-0 ms-2'
													style={{ height: '52px' }}>
													<span style={{ fontSize: '11px', color: '#94A3B8' }}>
														{lastTimeStr}
													</span>
													{isSelected ? (
														<span
															style={{
																color: '#172b4d',
																fontSize: '13px',
																marginBottom: '2px',
															}}
															title='Pinned'>
															<FontAwesomeIcon icon={faThumbtack} />
														</span>
													) : (
														<span style={{ height: '14px' }}></span>
													)}
												</div>
											</div>
										</button>
									)
								})}
							</InfiniteScroll>
						)}
					</div>
				</div>

				{/* --------------------------------------------------------
				   Right Panel: Chat Workspace
				   -------------------------------------------------------- */}
				{userId ? (
					<div
						className={`gz-emp-workspace ${userId ? 'd-flex' : 'd-none d-lg-flex'}`}
						id='kt_chat_messenger'>
						{/* Clean Workspace Header matching Mockup */}
						<div className='gz-emp-workspace-header' id='kt_chat_messenger_header'>
							<div className='d-flex align-items-center gap-3'>
								<button
									type='button'
									title='Back to list'
									onClick={() => setUserId('')}
									className='gz-emp-header-action-btn d-lg-none d-flex'>
									<FontAwesomeIcon icon={faChevronLeft} />
								</button>
								<div className='gz-emp-avatar' style={{ width: '42px', height: '42px', fontSize: '16px' }}>
									{currentUser?.profileImg &&
									currentUser.profileImg !== 'https://files.fggroup.in/undefined' ? (
										<img alt='Avatar' src={toAbsoluteUrl(currentUser.profileImg)} />
									) : (
										<span>{currentUser.name ? currentUser.name[0] : 'S'}</span>
									)}
								</div>
								<div>
									<div
										style={{
											fontSize: '16px',
											fontWeight: 700,
											color: '#0F172A',
											lineHeight: 1.2,
										}}>
										{currentUser.name && !currentUser.name.includes('undefined')
											? currentUser.name
											: 'System @ FG Group'}
									</div>
									<div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
										demo
									</div>
								</div>
							</div>

							<div className='d-flex align-items-center gap-2'>
								<button
									type='button'
									className='gz-emp-header-action-btn'
									title='Search conversation'>
									<FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: '13px' }} />
								</button>
								<button
									type='button'
									className='gz-emp-header-action-btn'
									title='Call Support'>
									<FontAwesomeIcon icon={faPhone} style={{ fontSize: '13px' }} />
								</button>
								<div
									style={{
										width: '1px',
										height: '20px',
										background: '#E2E8F0',
										margin: '0 4px',
									}}
								/>
								<div className='dropdown'>
									<button
										className='gz-emp-header-action-btn'
										type='button'
										id='chatMoreMenu'
										data-bs-toggle='dropdown'
										aria-expanded='false'
										title='More options'>
										<FontAwesomeIcon icon={faEllipsisVertical} style={{ fontSize: '14px' }} />
									</button>
									<ul
										className='dropdown-menu dropdown-menu-end shadow-sm'
										aria-labelledby='chatMoreMenu'>
										<li>
											<Link
												to={'/fwg/users/user-view-details?user_id=' + userId}
												className='dropdown-item'>
												View Profile
											</Link>
										</li>
										<li>
											<Link to='/employee/dashboard' className='dropdown-item text-danger'>
												Exit to Dashboard
											</Link>
										</li>
									</ul>
								</div>
							</div>
						</div>

						{/* Messages and Input Bar */}
						<div className='flex-grow-1' style={{ position: 'relative', overflow: 'hidden' }}>
							<EmployeeChatInner id={userId} userName={currentUser.name} />
						</div>
					</div>
				) : (
					<div
						className='gz-emp-workspace d-none d-lg-flex justify-content-center align-items-center'
						style={{ background: '#F8FAFD' }}>
						<div className='text-center p-8' style={{ maxWidth: '420px' }}>
							<div
								className='d-inline-flex align-items-center justify-content-center mb-4'
								style={{
									width: '72px',
									height: '72px',
									borderRadius: '50%',
									background: '#EDE9FE',
									color: '#7C3AED',
								}}>
								<i className='bi bi-chat-dots-fill fs-2x' style={{ color: '#7C3AED' }}></i>
							</div>
							<h3 className='fw-bold mb-2' style={{ color: '#0F172A' }}>
								Select a conversation
							</h3>
							<p className='fs-6 mb-4' style={{ color: '#64748B' }}>
								Choose a conversation from the left inbox to view message history, send documents, and communicate with support.
							</p>
							<Link
								to='/employee/dashboard'
								className='btn btn-sm px-4 py-2 d-inline-flex align-items-center gap-2'
								style={{ background: '#172B4D', color: '#FFFFFF', borderRadius: '12px' }}>
								<FontAwesomeIcon icon={faChevronLeft} />
								<span>Back to Dashboard</span>
							</Link>
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export default EmployeeChatPage
