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
import toast from 'react-hot-toast'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Link, useNavigate } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle, useLayout } from '../../../../_metronic/layout/core'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetChatEmployees } from '../../../Functions/FGGroup/EmployeeChat'
import { HRChatInner } from './ChatInner'
import '../../employee/chat/employee-chat.css'
import './hr-chat.css'

const HRChatPage = () => {
	const navigate = useNavigate()
	const { config } = useLayout()
	const { aside } = config
	const [searchTerm, setSearchTerm] = useState('')
	const [localSearchTerm, setLocalSearchTerm] = useState('')
	const [currentUser, setCurrentUser] = useState({ name: '', profileImg: '' })
	const [userId, setUserId] = useState('')
	const [userData, setUserData] = useState<any[]>([])
	const [section, setSection] = useState(true)
	const [pagination, setPagination] = useState({
		page: 1,
		itemsPerPage: 50,
		totalPages: 0,
	})
	const [loading, setLoading] = useState(false)
	const [isChatHistoryFetched, setIsChatHistoryFetched] = useState(false)

	// Fetch users/employees
	const fetchUserData = useCallback(
		async (page = 1, reset = false) => {
			setLoading(true)
			try {
				let response: any
				let chat_response: any

				if (searchTerm) {
					response = await GetEmployees({
						page,
						limit: pagination.itemsPerPage,
						search: searchTerm,
					})
					chat_response = await GetChatEmployees({
						page,
						limit: pagination.itemsPerPage,
					})
					setSection(false)
				} else {
					response = await GetChatEmployees({
						page,
						limit: pagination.itemsPerPage,
					})

					setSection(true)
					if (!response.data || response.data.length === 0) {
						response = await GetEmployees({
							page,
							limit: pagination.itemsPerPage,
						})
						setSection(false)
					}
				}

				let { data } = response
				let filteredData = data || []

				if (chat_response?.data?.length > 0) {
					const chatDataById = chat_response.data.reduce((acc: any, chat: any) => {
						const chatFrom = chat.from
						const chatTo = chat.to

						// Update chat data for "from" user
						if (!acc[chatFrom] || new Date(chat.lastChat) > new Date(acc[chatFrom].lastChat)) {
							acc[chatFrom] = chat
						}

						// Update chat data for "to" user
						if (!acc[chatTo] || new Date(chat.lastChat) > new Date(acc[chatTo].lastChat)) {
							acc[chatTo] = chat
						}

						return acc
					}, {})

					filteredData = (data || []).map((user: any) => {
						if (chatDataById[user._id]) {
							return { ...user, chat_data: chatDataById[user._id] }
						}
						return user
					})
				}

				if (reset) {
					setUserData(filteredData)
				} else {
					setUserData((prevUserData) => [...prevUserData, ...filteredData])
				}

				setPagination((prev) => ({
					...prev,
					totalPages:
						response?.metadata?.pagination?.totalPages ||
						chat_response?.metadata?.pagination?.totalPages ||
						1,
					page,
				}))
			} catch (error) {
				toast.error('Error Getting User Data')
				console.error('Error fetching HR chat user data:', error)
			}
			setLoading(false)
		},
		[pagination.itemsPerPage, searchTerm]
	)

	const loadMore = () => {
		if (pagination.page < pagination.totalPages) {
			fetchUserData(pagination.page + 1)
		}
	}

	useEffect(() => {
		aside.minimize
		fetchUserData(1, true)
	}, [fetchUserData])

	// Debounce search input
	useEffect(() => {
		const handler = setTimeout(() => {
			setSearchTerm(localSearchTerm)
		}, 350)

		return () => {
			clearTimeout(handler)
		}
	}, [localSearchTerm])

	const userHandle = (full_name: any, id: any, profile: any) => {
		const profileImg = profile || ''
		const name = full_name ? `${full_name}` : 'FG User'
		setCurrentUser({ name, profileImg })
		setUserId(id)
		setIsChatHistoryFetched(false)
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

	const displayedIds = new Set()

	return (
		<>
			<PageTitle breadcrumbs={[]}>Chat</PageTitle>

			<div className='gz-emp-chat-container'>
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
							to='/hr/dashboard'
							className='gz-emp-exit-icon-btn'
							title='Exit to Dashboard'>
							<FontAwesomeIcon icon={faRightFromBracket} />
						</Link>
					</div>

					{/* Messages Heading with Lavender Badge */}
					<div className='gz-emp-heading-row'>
						<h1 className='gz-emp-heading-title'>Messages</h1>
						<span className='gz-emp-badge-pill'>{userData.length}</span>
					</div>

					{/* WhatsApp-Style Rounded Search Bar */}
					<div className='gz-emp-search-wrap'>
						<div
							className='gz-emp-search-box'
							style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
							<FontAwesomeIcon
								icon={faMagnifyingGlass}
								className='gz-emp-search-icon'
								style={{
									position: 'absolute',
									left: '16px',
									top: '50%',
									transform: 'translateY(-50%)',
									color: '#94a3b8',
									fontSize: '14px',
									pointerEvents: 'none',
									zIndex: 3,
								}}
							/>
							<input
								type='text'
								className='gz-emp-search-input'
								style={{
									paddingLeft: '48px',
									paddingRight: '16px',
									borderRadius: '24px',
									height: '42px',
									width: '100%',
									backgroundColor: '#f8fafd',
									border: '1px solid #e2e8f0',
									fontSize: '13.5px',
									outline: 'none',
									boxSizing: 'border-box',
								}}
								placeholder='Search chats or employees...'
								value={localSearchTerm}
								onChange={(e) => setLocalSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					{/* Conversation List */}
					<div className='gz-emp-contacts-scroll' id='scrollableDiv'>
						{loading && (!userData || userData.length === 0) ? (
							<div className='p-3 d-flex flex-column gap-3'>
								{[...Array(6)].map((_, idx) => (
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
						) : userData.length === 0 ? (
							<div className='text-muted fs-6 fw-bold text-center py-10'>No chat found.</div>
						) : (
							<InfiniteScroll
								dataLength={userData.length}
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
								{section ? (
									<>
										{userData
											.filter((user) =>
												user?.chat_employees?.some((chatUser: any) => chatUser.isAdmin)
											)
											.map((user) => {
												const sender = user.chat_employees.find(
													(chatUser: any) => chatUser.isSender
												)
												const receiver = user.chat_employees.find(
													(chatUser: any) => chatUser.isReceiver
												)

												const adminUser = sender?.isAdmin
													? sender
													: receiver?.isAdmin
													? receiver
													: null
												const otherUser = sender?.isAdmin ? receiver : sender

												if (!adminUser || !otherUser || displayedIds.has(otherUser._id)) {
													return null
												}

												displayedIds.add(otherUser._id)

												const isAdminSender = adminUser.isSender
												const isSelected = otherUser._id === userId
												const photoRaw = otherUser?.photo
												const photoUrl = photoRaw
													? photoRaw.startsWith('http')
														? photoRaw
														: `https://files.fggroup.in/` + photoRaw
													: ''
												const fullName = otherUser?.full_name || 'FG User'
												const lastTimeStr = user?.lastChat
													? DayJS().isSame(DayJS(user.lastChat), 'day')
														? DayJS(user.lastChat).format('h:mm A')
														: DayJS().subtract(1, 'day').isSame(DayJS(user.lastChat), 'day')
														? 'Yesterday'
														: DayJS(user.lastChat).format('MMM D, YYYY')
													: ''
												const lastMessageText = user?.lastMessage || ''

												return (
													<button
														key={otherUser._id}
														className={`gz-emp-contact-card ${isSelected ? 'is-active' : ''}`}
														onClick={() =>
															userHandle(
																otherUser?.full_name,
																otherUser._id,
																photoUrl
															)
														}>
														<div className='d-flex align-items-center justify-content-between'>
															<div className='d-flex align-items-center' style={{ minWidth: 0 }}>
																<div className='gz-emp-avatar me-3'>
																	{photoUrl ? (
																		<img alt='Avatar' src={photoUrl} />
																	) : (
																		<span>{fullName.charAt(0).toUpperCase()}</span>
																	)}
																</div>
																<div className='text-truncate' style={{ minWidth: 0 }}>
																	<p
																		className='text-start fw-bold mb-0 text-truncate'
																		style={{ color: '#0F172A', fontSize: '15px' }}>
																		{fullName}
																	</p>
																	<div
																		className='text-start text-truncate'
																		style={{ fontSize: '13px', color: '#64748B' }}>
																		{otherUser?.designation || otherUser?.department || 'Employee'}
																	</div>
																	<div
																		className='text-start text-truncate'
																		style={{
																			fontSize: '12.5px',
																			color: '#64748B',
																			marginTop: '1px',
																		}}>
																		<span title={lastMessageText}>
																			{lastMessageText
																				? (isAdminSender ? 'You: ' : '') + truncateText(lastMessageText, 22)
																				: 'No messages yet'}
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
																		title='Selected'>
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
									</>
								) : (
									<>
										{userData.map((user) => {
											const isSelected = user._id === userId
											const photoRaw = user?.employee?.photo || user?.photo
											const photoUrl = photoRaw
												? photoRaw.startsWith('http')
													? photoRaw
													: `https://files.fggroup.in/` + photoRaw
												: ''
											const fullName = user?.full_name || 'FG User'
											const lastTimeStr = (user?.chat_data?.lastChat || user?.createdAt)
												? DayJS().isSame(DayJS(user?.chat_data?.lastChat || user?.createdAt), 'day')
													? DayJS(user?.chat_data?.lastChat || user?.createdAt).format('h:mm A')
													: DayJS().subtract(1, 'day').isSame(DayJS(user?.chat_data?.lastChat || user?.createdAt), 'day')
													? 'Yesterday'
													: DayJS(user?.chat_data?.lastChat || user?.createdAt).format('MMM D, YYYY')
												: ''
											const lastMessageText = user?.chat_data?.lastMessage || ''

											return (
												<button
													key={user._id}
													className={`gz-emp-contact-card ${isSelected ? 'is-active' : ''}`}
													onClick={() =>
														userHandle(
															user?.full_name,
															user._id,
															photoUrl
														)
													}>
													<div className='d-flex align-items-center justify-content-between'>
														<div className='d-flex align-items-center' style={{ minWidth: 0 }}>
															<div className='gz-emp-avatar me-3'>
																{photoUrl ? (
																	<img alt='Avatar' src={photoUrl} />
																) : (
																	<span>{fullName.charAt(0).toUpperCase()}</span>
																)}
															</div>
															<div className='text-truncate' style={{ minWidth: 0 }}>
																<p
																	className='text-start fw-bold mb-0 text-truncate'
																	style={{ color: '#0F172A', fontSize: '15px' }}>
																	{fullName}
																</p>
																<div
																	className='text-start text-truncate'
																	style={{ fontSize: '13px', color: '#64748B' }}>
																	{user?.designation || user?.department || user?.type || 'Employee'}
																</div>
																<div
																	className='text-start text-truncate'
																	style={{
																		fontSize: '12.5px',
																		color: '#64748B',
																		marginTop: '1px',
																	}}>
																	<span title={lastMessageText}>
																		{lastMessageText
																			? truncateText(lastMessageText, 24)
																			: 'Click to start chatting'}
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
																	title='Selected'>
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
									</>
								)}
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
										<img
											alt='Avatar'
											src={
												currentUser.profileImg.startsWith('http')
													? currentUser.profileImg
													: toAbsoluteUrl(currentUser.profileImg)
											}
										/>
									) : (
										<span>{currentUser.name ? currentUser.name[0]?.toUpperCase() : 'E'}</span>
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
											: 'Employee'}
									</div>
									<div style={{ fontSize: '12.5px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
										● Active
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
									title='Call Employee'>
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
												View Employee Profile
											</Link>
										</li>
										<li>
											<Link to='/hr/dashboard' className='dropdown-item text-danger'>
												Exit to Dashboard
											</Link>
										</li>
									</ul>
								</div>
							</div>
						</div>

						{/* Messages and Input Bar */}
						<div className='flex-grow-1' style={{ position: 'relative', overflow: 'hidden' }}>
							<HRChatInner id={userId} userName={currentUser.name} />
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
								Choose an employee from the left inbox to view message history, send documents, and communicate in real-time.
							</p>
							<Link
								to='/hr/dashboard'
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

export default HRChatPage
