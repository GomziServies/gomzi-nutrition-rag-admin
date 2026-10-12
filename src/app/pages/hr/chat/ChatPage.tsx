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
			<div className='d-flex flex-column flex-lg-row p-0'>
				<PageTitle breadcrumbs={[]}>Chat</PageTitle>
				<div
					className={`flex-column flex-lg-row-auto w-100 w-lg-350px w-xl-350px mb-0  ${
						userId ? 'd-md-block d-none' : 'd-md-block d-block'
					} `}>
					<div
						className='card card-flush whatsapp-msg-box'
						id='style-4'
						style={{ zIndex: '10' }}>
						{/* Search */}
						<div
							className='card-header px-2'
							id='kt_chat_contacts_header'
							style={{ backgroundColor: '#2d2d43', borderRadius: '0px' }}>
							<div className='w-100 d-flex align-items-center justify-content-between'>
								<div className='d-flex align-items-center justify-content-between'>
									<div className='me-3'>
										<img
											alt='Logo'
											src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
											className='h-25px h-lg-45px'
										/>
									</div>
									<div className='me-3 mt-2'>
										<h1 className='text-white'>Chats</h1>
									</div>
								</div>
								<div
									className='me-3 mt-1'
									role='button'
									onClick={backPage}>
									<FontAwesomeIcon
										icon={faRightFromBracket}
										className='text-white fs-2'
									/>
								</div>
							</div>
						</div>

						{/* Chat List */}
						<div>
							<div
								className='pt-3 px-4 chat-text-color'
								id='kt_chat_contacts_body'>
								<div
									className='pb-3'
									style={{ borderBottom: '1px solid #ccc' }}>
									<div className='d-flex align-items-center position-relative'>
										<KTIcon
											iconName='magnifier'
											className='fs-1 position-absolute ms-6'
										/>
										<input
											type='text'
											data-kt-user-table-filter='search'
											className='form-control form-control-solid bg-secondary ps-14'
											placeholder='Search...'
											value={localSearchTerm}
											onChange={(e) => setLocalSearchTerm(e.target.value)}
										/>
									</div>
								</div>
								<div
									className='scroll-y me-n5 pe-5 smooth-scroll'
									data-kt-scroll='true'
									id='scrollableDiv'
									data-kt-scroll-activate='{default: false, lg: true}'
									data-kt-scroll-dependencies='#kt_header, #kt_toolbar, #kt_footer, #kt_chat_contacts_header'
									data-kt-scroll-wrappers='#kt_content, #kt_chat_contacts_body'
									data-kt-scroll-offset='0px'
									style={{ height: 'calc(100vh - 153px)', overflow: 'auto' }}>
									{userData.length === 0 ? (
										<div className='text-muted fs-4 fw-bold text-center'>No chat found.</div>
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
													style={{ textAlign: 'center' }}
													className='p-3'>
													<b>Yay! You have seen it all</b>
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

															const adminUser = sender.isAdmin
																? sender
																: receiver.isAdmin
																? receiver
																: null
															const otherUser = sender.isAdmin ? receiver : sender

															if (!adminUser || displayedIds.has(otherUser._id)) {
																return null
															}

															displayedIds.add(otherUser._id)

															const isAdminSender = adminUser.isSender

															return (
																<button
																	key={otherUser._id}
																	className='btn p-0 w-100'
																	style={{ borderBottom: '1px solid #ccc' }}
																	onClick={() =>
																		userHandle(
																			otherUser?.full_name,
																			otherUser._id,
																			`https://files.fggroup.in/` + otherUser?.photo
																		)
																	}>
																	<div className='d-flex flex-stack py-4'>
																		<div className='d-flex align-items-center'>
																			{otherUser?.photo ? (
																				<div className='symbol symbol-45px symbol-circle'>
																					<img
																						alt='Pic'
																						src={`https://files.fggroup.in/` + otherUser?.photo}
																					/>
																				</div>
																			) : (
																				<div className='symbol symbol-45px symbol-circle'>
																					<span
																						className='symbol-label text-white fs-6 fw-bolder'
																						style={{ backgroundColor: '#2d2d43' }}>
																						{otherUser?.full_name?.charAt(0).toUpperCase()}
																					</span>
																				</div>
																			)}
																			<div className='ms-5'>
																				<p className='text-start fs-6 fw-bolder text-gray-900  mb-0'>
																					{otherUser?.full_name ? otherUser?.full_name : 'FG User'}
																				</p>
																				<div
																					className={`fw-bold text-start fs-7 ${
																						isAdminSender ? 'text-muted' : 'text-primary'
																					}`}>
																					<b title={user.lastMessage}>
																						{truncateText(user.lastMessage, 20)}
																					</b>
																				</div>
																			</div>
																		</div>
																		<div className='d-flex flex-column align-items-end ms-2'>
																			<span className='text-muted fs-7 mb-1'>
																				{DayJS().isSame(DayJS(user.lastChat), 'day')
																					? DayJS(user.lastChat).format('h:mm A')
																					: DayJS()
																							.subtract(1, 'day')
																							.isSame(DayJS(user.lastChat), 'day')
																					? 'Yesterday'
																					: DayJS(user.lastChat).format('MMM D, YYYY')}
																			</span>
																		</div>
																	</div>
																	<div className='separator separator-dashed d-none'></div>
																</button>
															)
														})}
												</>
											) : (
												<>
													{userData.map((user) => (
														<button
															key={user._id}
															className='btn p-0 w-100'
															style={{ borderBottom: '1px solid #ccc' }}
															onClick={() =>
																userHandle(
																	user?.full_name,
																	user._id,
																	`https://files.fggroup.in/` + user?.employee?.photo
																)
															}>
															<div className='d-flex flex-stack py-4'>
																<div className='d-flex align-items-center'>
																	{user?.employee?.photo ? (
																		<div className='symbol symbol-45px symbol-circle'>
																			<img
																				alt='Pic'
																				src={`https://files.fggroup.in/` + user?.employee?.photo}
																			/>
																		</div>
																	) : (
																		<div className='symbol symbol-45px symbol-circle'>
																			<span
																				className='symbol-label text-white fs-6 fw-bolder'
																				style={{ backgroundColor: '#2d2d43' }}>
																				{user?.full_name?.charAt(0).toUpperCase()}
																			</span>
																		</div>
																	)}
																	<div className='ms-5'>
																		<p className='text-start fs-6 fw-bolder text-gray-900  mb-0'>
																			{user?.full_name}
																		</p>
																		<div className='fw-bold text-gray-400 fs-7'>
																			{user?.chat_data ? (
																				<b title={user?.chat_data?.lastMessage}>
																					{truncateText(user?.chat_data?.lastMessage, 20)}
																				</b>
																			) : (
																				''
																			)}
																		</div>
																	</div>
																</div>
																<div className='d-flex flex-column align-items-end ms-2'>
																	<span className='text-muted fs-7 mb-1'>
																		{DayJS().isSame(DayJS(user?.createdAt), 'day')
																			? DayJS(user?.createdAt).format('h:mm A')
																			: DayJS()
																					.subtract(1, 'day')
																					.isSame(DayJS(user?.createdAt), 'day')
																			? 'Yesterday'
																			: DayJS(user?.createdAt).format('MMM D, YYYY')}
																	</span>
																</div>
															</div>
															<div className='separator separator-dashed d-none'></div>
														</button>
													))}
												</>
											)}
										</InfiniteScroll>
									)}
								</div>
							</div>
							<div
								className='whatsapp-footer'
								style={{
									backgroundColor: '#2d2d43',
									width: '100%',
									height: '20px',
									borderRadius: '0px',
								}}></div>
						</div>
					</div>
				</div>

				{/* chat section */}
				{userId ? (
					<div
						className={`flex-lg-row-fluid  ${userId ? 'd-md-block d-block' : 'd-md-block d-none'}`}>
						<div
							className='card'
							id='kt_chat_messenger'>
							<div
								className='card-header-1 d-flex flex-nowrap'
								id='kt_chat_messenger_header'
								style={{ backgroundColor: '#2d2d43', borderRadius: '0px' }}>
								<div className='card-title'>
									<div className='symbol-group symbol-hover'></div>
									<div className='d-flex justify-content-center flex-column me-3'>
										<div className='fs-4 fw-bolder d-flex align-items-center text-white  mb-0 me-1'>
											<div
												role='button'
												onClick={() => setUserId('')}>
												<FontAwesomeIcon
													icon={faChevronLeft}
													className='me-5 text-white'
												/>
											</div>
											{currentUser?.profileImg !== 'https://files.fggroup.in/undefined' ? (
												<div className='symbol symbol-45px symbol-circle me-5'>
													<img
														alt='Pic'
														src={toAbsoluteUrl(currentUser.profileImg)}
													/>
												</div>
											) : currentUser.name ? (
												<div className='symbol symbol-45px symbol-circle me-5'>
													<span className='symbol-label bg-light-success text-dark fs-6 fw-bolder'>
														{currentUser.name[0]}
													</span>
												</div>
											) : (
												''
											)}
											{currentUser.name.includes('undefined') ? 'FG User' : currentUser.name}
										</div>
									</div>
								</div>

								<div className='card-toolbar'>
									<div className='me-n3'>
										<div className='dropdown'>
											<button
												className='btn btn-sm btn-icon btn-active-light-primary dropdown-toggle'
												type='button'
												id='dropdownMenuButton'
												data-bs-toggle='dropdown'
												aria-expanded='false'>
												<i className='bi bi-three-dots fs-2'></i>
											</button>
											<ul
												className='dropdown-menu'
												aria-labelledby='dropdownMenuButton'>
												<li>
													<Link
														to={'/fwg/users/user-view-details?user_id=' + userId}
														className='dropdown-item'>
														View User
													</Link>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
							<div>
								<HRChatInner
									id={userId}
									isChatHistory={isChatHistoryFetched}
								/>
							</div>
						</div>
					</div>
				) : (
					<div className='flex-lg-row-fluid d-md-block d-none'>
						<div
							className='card h-100 w-100 d-flex justify-content-center align-items-center'
							id='kt_chat_messenger'>
							<h1 className='my-5'>Select User to see chat</h1>
						</div>
					</div>
				)}
			</div>
		</>
	)
}

export default HRChatPage
