import { faChevronLeft, faFile, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Link } from 'react-router-dom'
import { KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle, useLayout } from '../../../../_metronic/layout/core'
import { GetEmployees } from '../../../Functions/FGGroup'
import { GetChatEmployees } from '../../../Functions/FGGroup/EmployeeChat'
import { HRChatInner } from './ChatInner'
import './hr-chat.css'

const HRChatPage = () => {
	const { config } = useLayout()
	const { aside } = config
	const [searchTerm, setSearchTerm] = useState('')
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
				let filteredData = data

				if (chat_response?.data.length > 0) {
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

					filteredData = data.map((user: any) => {
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
						chat_response?.metadata?.pagination?.totalPages,
					page,
				}))
			} catch (error) {
				toast.error('Error Getting User Data')
				console.error(error)
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

	const userHandle = (full_name: any, id: any, profile: any) => {
		const profileImg = profile
		const name = `${full_name}`
		setCurrentUser({ name, profileImg })
		setUserId(id)
		setIsChatHistoryFetched(false)
	}
	const displayedIds = new Set()
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

	const backPage = () => {
		window.history.back()
	}

	const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

	useEffect(() => {
		const handler = setTimeout(() => {
			setSearchTerm(localSearchTerm)
		}, 700)

		return () => {
			clearTimeout(handler)
		}
	}, [localSearchTerm, setSearchTerm])

	return (
		<>
			<div className='d-flex flex-column flex-lg-row p-0 gz-chat-container' style={{ minHeight: 'calc(100vh - 130px)' }}>
				<PageTitle breadcrumbs={[]}>Chat</PageTitle>
				<div
					className={`flex-column flex-lg-row-auto w-100 w-lg-350px w-xl-350px mb-0 ${
						userId ? 'd-md-block d-none' : 'd-md-block d-block'
					}`}
					style={{ borderRight: '1px solid #E4EAF2', display: 'flex', flexDirection: 'column' }}>
					<div
						className='card card-flush h-100'
						id='style-4'
						style={{ zIndex: '10', border: 'none', borderRadius: '0' }}>
						{/* Header */}
						<div
							className='gz-chat-sidebar-header'
							id='kt_chat_contacts_header'>
							<div className='w-100 d-flex align-items-center justify-content-between'>
								<div className='d-flex align-items-center'>
									<div className='me-3'>
										<img
											alt='Logo'
											src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
											className='h-25px h-lg-35px'
											style={{ filter: 'brightness(0) invert(1)' }}
										/>
									</div>
									<div>
										<h1 className='gz-chat-sidebar-title'>Chats</h1>
									</div>
								</div>
								<div
									className='text-white'
									role='button'
									title='Back'
									onClick={backPage}
									style={{ cursor: 'pointer', opacity: 0.9 }}>
									<FontAwesomeIcon
										icon={faRightFromBracket}
										className='fs-3'
									/>
								</div>
							</div>
						</div>

						{/* Search */}
						<div className='gz-chat-search-wrap'>
							<div className='gz-chat-search-box'>
								<KTIcon
									iconName='magnifier'
									className='gz-chat-search-icon fs-3'
								/>
								<input
									type='text'
									data-kt-user-table-filter='search'
									className='gz-chat-search-input'
									placeholder='Search chats or employees...'
									value={localSearchTerm}
									onChange={(e) => setLocalSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						{/* Chat List */}
						<div className='flex-grow-1 overflow-hidden' id='kt_chat_contacts_body'>
							<div
								className='scroll-y smooth-scroll'
								data-kt-scroll='true'
								id='scrollableDiv'
								data-kt-scroll-activate='{default: false, lg: true}'
								data-kt-scroll-dependencies='#kt_header, #kt_toolbar, #kt_footer, #kt_chat_contacts_header'
								data-kt-scroll-wrappers='#kt_content, #kt_chat_contacts_body'
								data-kt-scroll-offset='0px'
								style={{ height: 'calc(100vh - 225px)', overflowY: 'auto' }}>
								{userData.length === 0 ? (
									<div className='text-muted fs-6 fw-bold text-center py-10'>No chat found.</div>
								) : (
									<InfiniteScroll
										dataLength={userData.length}
										next={loadMore}
										hasMore={pagination.page < pagination.totalPages}
										loader={
											<div className='d-flex justify-content-center align-items-center mb-4 my-7'>
												<div
													className='spinner-border text-primary'
													role='status'>
													<span className='visually-hidden'>Loading...</span>
												</div>
											</div>
										}
										endMessage={
											<p
												style={{ textAlign: 'center', color: '#8A99AD' }}
												className='p-3 fs-8 mb-0'>
												All conversations loaded
											</p>
										}
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

														return (
															<button
																key={otherUser._id}
																className={`gz-chat-contact-btn ${isSelected ? 'is-active' : ''}`}
																onClick={() =>
																	userHandle(
																		otherUser?.full_name,
																		otherUser._id,
																		`https://files.fggroup.in/` + otherUser?.photo
																	)
																}>
																<div className='d-flex align-items-center justify-content-between'>
																	<div className='d-flex align-items-center' style={{ minWidth: 0 }}>
																		{otherUser?.photo ? (
																			<div className='symbol symbol-45px symbol-circle me-3 flex-shrink-0'>
																				<img
																					alt='Pic'
																					src={`https://files.fggroup.in/` + otherUser?.photo}
																				/>
																			</div>
																		) : (
																			<div className='symbol symbol-45px symbol-circle me-3 flex-shrink-0'>
																				<span
																					className='symbol-label text-white fs-6 fw-bolder'
																					style={{ backgroundColor: '#1E3A5F' }}>
																					{otherUser?.full_name?.charAt(0).toUpperCase()}
																				</span>
																			</div>
																		)}
																		<div className='text-truncate' style={{ minWidth: 0 }}>
																			<p className='text-start fs-6 fw-bold mb-0 text-truncate' style={{ color: '#142447' }}>
																				{otherUser?.full_name ? otherUser?.full_name : 'FG User'}
																			</p>
																			<div
																				className={`text-start fs-7 text-truncate ${
																					isAdminSender ? 'text-muted' : 'fw-semibold'
																				}`}
																				style={{ color: isAdminSender ? '#71809A' : '#1E3A5F' }}>
																				<span title={user.lastMessage}>
																					{truncateText(user.lastMessage, 24)}
																				</span>
																			</div>
																		</div>
																	</div>
																	<div className='d-flex flex-column align-items-end ms-2 flex-shrink-0'>
																		<span className='fs-8 mb-1' style={{ color: '#8A99AD' }}>
																			{DayJS().isSame(DayJS(user.lastChat), 'day')
																				? DayJS(user.lastChat).format('h:mm A')
																				: DayJS()
																						.subtract(1, 'day')
																						.isSame(DayJS(user.lastChat), 'day')
																				? 'Yesterday'
																				: DayJS(user.lastChat).format('MMM D')}
																		</span>
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
													return (
														<button
															key={user._id}
															className={`gz-chat-contact-btn ${isSelected ? 'is-active' : ''}`}
															onClick={() =>
																userHandle(
																	user?.full_name,
																	user._id,
																	`https://files.fggroup.in/` + user?.employee?.photo
																)
															}>
															<div className='d-flex align-items-center justify-content-between'>
																<div className='d-flex align-items-center' style={{ minWidth: 0 }}>
																	{user?.employee?.photo ? (
																		<div className='symbol symbol-45px symbol-circle me-3 flex-shrink-0'>
																			<img
																				alt='Pic'
																				src={`https://files.fggroup.in/` + user?.employee?.photo}
																			/>
																		</div>
																	) : (
																		<div className='symbol symbol-45px symbol-circle me-3 flex-shrink-0'>
																			<span
																				className='symbol-label text-white fs-6 fw-bolder'
																				style={{ backgroundColor: '#1E3A5F' }}>
																				{user?.full_name?.charAt(0).toUpperCase()}
																			</span>
																		</div>
																	)}
																	<div className='text-truncate' style={{ minWidth: 0 }}>
																		<p className='text-start fs-6 fw-bold mb-0 text-truncate' style={{ color: '#142447' }}>
																			{user?.full_name}
																		</p>
																		<div className='fs-7 text-truncate' style={{ color: '#71809A' }}>
																			{user?.chat_data ? (
																				<span title={user?.chat_data?.lastMessage}>
																					{truncateText(user?.chat_data?.lastMessage, 24)}
																				</span>
																			) : (
																				''
																			)}
																		</div>
																	</div>
																</div>
																<div className='d-flex flex-column align-items-end ms-2 flex-shrink-0'>
																	<span className='fs-8 mb-1' style={{ color: '#8A99AD' }}>
																		{DayJS().isSame(DayJS(user?.createdAt), 'day')
																			? DayJS(user?.createdAt).format('h:mm A')
																			: DayJS()
																					.subtract(1, 'day')
																					.isSame(DayJS(user?.createdAt), 'day')
																			? 'Yesterday'
																			: DayJS(user?.createdAt).format('MMM D')}
																	</span>
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
					</div>
				</div>

				{/* chat section */}
				{userId ? (
					<div
						className={`flex-lg-row-fluid ${userId ? 'd-md-block d-block' : 'd-md-block d-none'}`}
						style={{ display: 'flex', flexDirection: 'column' }}>
						<div
							className='card h-100'
							id='kt_chat_messenger'
							style={{ border: 'none', borderRadius: '0', display: 'flex', flexDirection: 'column' }}>
							<div
								className='gz-chat-msg-header'
								id='kt_chat_messenger_header'>
								<div className='d-flex align-items-center'>
									<div
										role='button'
										title='Back to list'
										onClick={() => setUserId('')}
										className='me-3 d-lg-none d-flex align-items-center justify-content-center'
										style={{
											width: '32px',
											height: '32px',
											borderRadius: '6px',
											border: '1px solid #DFE7F0',
											background: '#FFFFFF',
											cursor: 'pointer',
										}}>
										<FontAwesomeIcon
											icon={faChevronLeft}
											style={{ color: '#1E3A5F', fontSize: '13px' }}
										/>
									</div>
									{currentUser?.profileImg !== 'https://files.fggroup.in/undefined' ? (
										<div className='symbol symbol-45px symbol-circle me-3'>
											<img
												alt='Pic'
												src={toAbsoluteUrl(currentUser.profileImg)}
											/>
										</div>
									) : currentUser.name ? (
										<div className='symbol symbol-45px symbol-circle me-3'>
											<span
												className='symbol-label text-white fs-6 fw-bolder'
												style={{ backgroundColor: '#1E3A5F' }}>
												{currentUser.name[0]}
											</span>
										</div>
									) : null}
									<div>
										<div className='fs-5 fw-bold' style={{ color: '#142447' }}>
											{currentUser.name.includes('undefined') ? 'FG User' : currentUser.name}
										</div>
										<div className='fs-8' style={{ color: '#10B981', fontWeight: 600 }}>
											● Active
										</div>
									</div>
								</div>

								<div className='card-toolbar'>
									<div className='dropdown'>
										<button
											className='btn btn-sm btn-icon btn-active-light-primary dropdown-toggle'
											type='button'
											id='dropdownMenuButton'
											data-bs-toggle='dropdown'
											aria-expanded='false'>
											<i className='bi bi-three-dots fs-2' style={{ color: '#1E3A5F' }}></i>
										</button>
										<ul
											className='dropdown-menu dropdown-menu-end'
											aria-labelledby='dropdownMenuButton'>
											<li>
												<Link
													to={'/fwg/users/user-view-details?user_id=' + userId}
													className='dropdown-item'>
													View User Profile
												</Link>
											</li>
										</ul>
									</div>
								</div>
							</div>
							<div className='flex-grow-1' style={{ position: 'relative', overflow: 'hidden' }}>
								<HRChatInner
									id={userId}
									isChatHistory={isChatHistoryFetched}
								/>
							</div>
						</div>
					</div>
				) : (
					<div
						className='flex-lg-row-fluid d-md-flex d-none justify-content-center align-items-center'
						style={{ background: '#F8FAFD' }}>
						<div className='text-center p-8' style={{ maxWidth: '420px' }}>
							<div
								className='d-inline-flex align-items-center justify-content-center mb-4'
								style={{
									width: '72px',
									height: '72px',
									borderRadius: '50%',
									background: '#E8F0F8',
									color: '#1E3A5F',
								}}>
								<KTIcon iconName='message-text-2' className='fs-3x text-primary' />
							</div>
							<h3 className='fw-bold mb-2' style={{ color: '#142447' }}>
								Select a conversation
							</h3>
							<p className='fs-6 mb-0' style={{ color: '#71809A' }}>
								Choose an employee from the left sidebar to view message history, send announcements, and communicate in real-time.
							</p>
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export default HRChatPage
