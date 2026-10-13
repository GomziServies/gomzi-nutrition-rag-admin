import { faChevronLeft, faFile, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Link, useNavigate } from 'react-router-dom'
import { KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle, useLayout } from '../../../../_metronic/layout/core'
import { GetAdminUsers } from '../../../Functions/FGGroup'
import { GetEmployeeChatHistory } from '../../../Functions/FGGroup/EmployeeChat'
import { EmployeeChatInner } from './ChatInner'

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
				let response: any

				response = await GetAdminUsers()

				let { data } = response
				let filteredData = data

				filteredData = filteredData.find((employee: any) => employee.type == 'MASTER')

				setUserData([filteredData])

				fetchChatData(filteredData._id)

				setPagination((prev) => ({
					...prev,
					totalPages: response?.metadata?.pagination?.totalPages,
					// || chat_response?.metadata?.pagination?.totalPages,
					page,
				}))
			} catch (error) {
				console.error(error)
			}
			setLoading(false)
		},
		[pagination.itemsPerPage, searchTerm]
	)

	const fetchChatData = async (id?: any) => {
		try {
			const response = await GetEmployeeChatHistory({ participant: id })
			const filteredResponse = response?.data[response?.data?.length - 1]

			let messageFromAdmin = false
			if (filteredResponse.from == id) {
				messageFromAdmin = true
			}

			setMessages({ ...filteredResponse, messageFromAdmin })

			// Scroll to the latest message
			const messagesDiv = document.querySelector('[data-kt-element="messages"]')
			if (messagesDiv) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight
			}
		} catch (error) {
			console.error(error)
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
		const profileImg = profile
		const name = `${full_name}`
		setCurrentUser({ name, profileImg })
		setUserId(id)
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
		navigate('/employee/dashboard')
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
						{/* Header */}
						<div
							className='card-header px-4 py-3'
							id='kt_chat_contacts_header'
							style={{ backgroundColor: '#0F172A', borderRadius: '0px' }}>
							<div className='w-100 d-flex align-items-center justify-content-between'>
								<div className='d-flex align-items-center'>
									<div className='me-3'>
										<img
											alt='Logo'
											src={toAbsoluteUrl('/media/logos/rag-favicon-logo.png')}
											className='h-30px'
										/>
									</div>
									<div>
										<h2 className='text-white mb-0 fs-3 fw-bolder'>Chats</h2>
									</div>
								</div>
								<Link
									to='/employee/dashboard'
									className='btn btn-sm btn-white d-flex align-items-center gap-2 px-3 py-1 shadow-sm'
									style={{ backgroundColor: '#ffffff', borderRadius: '6px' }}
									title='Exit to Dashboard'>
									<FontAwesomeIcon
										icon={faRightFromBracket}
										className='fs-6'
										style={{ color: '#0F172A' }}
									/>
									<span className='fs-7 fw-bold' style={{ color: '#0F172A' }}>
										Exit
									</span>
								</Link>
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
									{userData?.length === 0 ? (
										<div className='text-muted fs-4 fw-bold text-center'>No chat found.</div>
									) : (
										<InfiniteScroll
											dataLength={userData?.length}
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
											{userData?.map((user) => (
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
																<p className='text-start fs-6 fw-bolder text-gray-900 text-hover-primary mb-0'>
																	{user?.full_name}
																</p>
																<div
																	className={`fw-bold ${
																		messages.messageFromAdmin ? 'text-primary' : 'text-gray-400'
																	}  fs-7`}>
																	{messages?.message ? (
																		<b title={messages?.message}>
																			{truncateText(messages?.message, 20)}
																		</b>
																	) : (
																		''
																	)}
																</div>
															</div>
														</div>
														<div className='d-flex flex-column align-items-end ms-2'>
															<span className='text-muted fs-7 mb-1'>
																{DayJS().isSame(DayJS(messages?.createdAt), 'day')
																	? DayJS(messages?.createdAt).format('h:mm A')
																	: DayJS()
																			.subtract(1, 'day')
																			.isSame(DayJS(messages?.createdAt), 'day')
																	? 'Yesterday'
																	: DayJS(messages?.createdAt).format('MMM D, YYYY')}
															</span>
														</div>
													</div>
													<div className='separator separator-dashed d-none'></div>
												</button>
											))}
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
								className='card-header-1 d-flex flex-nowrap align-items-center justify-content-between px-4 py-3'
								id='kt_chat_messenger_header'
								style={{ backgroundColor: '#0F172A', borderRadius: '0px' }}>
								<div className='card-title mb-0'>
									<div className='symbol-group symbol-hover'></div>
									<div className='d-flex justify-content-center flex-column me-3'>
										<div className='fs-4 fw-bolder d-flex align-items-center text-white mb-0 me-1'>
											<div
												role='button'
												onClick={() => setUserId('')}
												title='Back to contacts'>
												<FontAwesomeIcon
													icon={faChevronLeft}
													className='me-4 text-white fs-4'
												/>
											</div>
											{currentUser?.profileImg !== 'https://files.fggroup.in/undefined' ? (
												<div className='symbol symbol-40px symbol-circle me-3'>
													<img
														alt='Pic'
														src={toAbsoluteUrl(currentUser.profileImg)}
													/>
												</div>
											) : currentUser.name ? (
												<div className='symbol symbol-40px symbol-circle me-3'>
													<span className='symbol-label bg-white text-dark fs-6 fw-bolder'>
														{currentUser.name[0]}
													</span>
												</div>
											) : (
												''
											)}
											<span>{currentUser.name.includes('undefined') ? 'FG User' : currentUser.name}</span>
										</div>
									</div>
								</div>

								<div className='card-toolbar d-flex align-items-center gap-2'>
									<Link
										to='/employee/dashboard'
										className='btn btn-sm btn-white d-flex align-items-center gap-2 px-3 py-1 shadow-sm me-2'
										style={{ backgroundColor: '#ffffff', borderRadius: '6px' }}
										title='Exit to Dashboard'>
										<FontAwesomeIcon
											icon={faRightFromBracket}
											className='fs-6'
											style={{ color: '#0F172A' }}
										/>
										<span className='fs-7 fw-bold' style={{ color: '#0F172A' }}>
											Exit
										</span>
									</Link>

									<div className='dropdown'>
										<button
											className='btn btn-sm btn-icon btn-color-white btn-active-white'
											style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
											type='button'
											id='dropdownMenuButton'
											data-bs-toggle='dropdown'
											aria-expanded='false'>
											<i className='bi bi-three-dots fs-2 text-white'></i>
										</button>
										<ul
											className='dropdown-menu dropdown-menu-end'
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
							<div>
								<EmployeeChatInner id={userId} />
							</div>
						</div>
					</div>
				) : (
					<div className='flex-lg-row-fluid d-md-block d-none'>
						<div
							className='card h-100 w-100 d-flex flex-column justify-content-center align-items-center p-8'
							id='kt_chat_messenger'
							style={{ minHeight: 'calc(100vh - 80px)' }}>
							<div
								className='rounded-circle d-flex align-items-center justify-content-center mb-4'
								style={{
									width: '80px',
									height: '80px',
									background: 'var(--gz-brand-soft)',
									color: 'var(--gz-brand)',
								}}>
								<i className='bi bi-chat-dots-fill fs-2tx' style={{ color: 'var(--gz-brand)' }}></i>
							</div>
							<h2 className='fw-bold text-gray-800 mb-2'>Select User to see chat</h2>
							<p className='text-muted fs-6 mb-5' style={{ maxWidth: '340px', textAlign: 'center' }}>
								Pick a conversation from the left to start messaging, or return to your employee workspace.
							</p>
							<Link
								to='/employee/dashboard'
								className='btn btn-sm btn-primary px-4 py-2 d-flex align-items-center gap-2'>
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
