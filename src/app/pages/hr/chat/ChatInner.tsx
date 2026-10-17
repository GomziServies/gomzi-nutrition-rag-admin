import {
	faAngleDown,
	faAngleUp,
	faLink,
	faPaperPlane,
	faSmile,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import Picker from 'emoji-picker-react'
import React, { FC, useEffect, useRef, useState } from 'react'
import { AudioRecorder } from 'react-audio-voice-recorder'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { FG_GROUP_BASE_URL } from '../../../../app/constants/base_URL'
import { FileUploadToFGGroup, getProfile } from '../../../Functions/FGGroup'
import { GetEmployeeChatHistory } from '../../../Functions/FGGroup/EmployeeChat'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import './hr-chat.css'

type Props = {
	isDrawer?: boolean
}

type ChatInnerProps = {
	id?: string
	isChatHistory?: boolean
}

interface ProfileData {
	_id: string
}

const HRChatInner: FC<Props & ChatInnerProps> = ({
	isDrawer = false,
	id,
	isChatHistory,
}: Props & ChatInnerProps) => {
	const [showEmojiPicker, setShowEmojiPicker] = useState(false)
	const [featureIcon, setFeatureIcon] = useState(false)
	const [adminID, setAdminID] = useState<string>('')
	const [messages, setMessages] = useState<any>([])
	const [formData, setFormData] = useState({
		message: '',
		selectedFile: null as File | null,
		img: '',
	})
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [socket, setSocket] = useState<any>(null)
	const messagesEndRef = useRef<HTMLDivElement | null>(null)
	const [isChatHistoryFetched, setIsChatHistoryFetched] = useState(false)
	const [loading, setLoading] = useState(false)

	const handleEmojiButtonClick = () => {
		setShowEmojiPicker((prev) => !prev)
	}

	const handleFeatureButtonClick = () => {
		setFeatureIcon((prev) => !prev)
	}

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
		}
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const fetchAdminData = async () => {
		try {
			const response: FGGroupAPIResponse = await getProfile()
			if (response.data) {
				const profileData = response.data as ProfileData
				setAdminID(profileData._id)
			} else {
				console.error('Error fetching admin data: Profile data is undefined')
			}
		} catch (error) {
			console.error('Error fetching admin data:', error)
		}
	}

	const fetchChatData = async () => {
		if (isChatHistory) {
			if (isChatHistoryFetched) return
		}
		setLoading(true)
		try {
			const response = await GetEmployeeChatHistory({ participant: id })
			setMessages(response.data)
			setIsChatHistoryFetched(true)
			const messagesDiv = document.querySelector('[data-kt-element="messages"]')
			if (messagesDiv) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight
			}
		} catch (error) {
			toast.error('Error Getting User Data')
			console.error(error)
		}
		setLoading(false)
	}

	useEffect(() => {
		if (id) {
			const auth = localStorage.getItem('auth_fg_group') || ''
			const base_url = FG_GROUP_BASE_URL
			const newSocket = io(base_url, {
				extraHeaders: {
					authorization: auth,
				},
			})
			setSocket(newSocket)

			newSocket.on('connect', () => {
				// console.log('Socket connected')
			})

			newSocket.on('disconnect', () => {
				// console.log('Socket disconnected')
			})

			newSocket.on('SendEmployeeMessage', (data: any) => {
				// console.log('Received message:', data)
				fetchChatData()
			})

			fetchChatData()
			fetchAdminData()

			return () => {
				newSocket.disconnect()
			}
		}
	}, [id])

	useEffect(() => {
		// Scroll to the latest message after messages are set
		const messagesDiv = document.querySelector('[data-kt-element="messages"]')
		if (messagesDiv) {
			const scrollHeight = messagesDiv.scrollHeight
			const clientHeight = messagesDiv.clientHeight
			const maxScrollTop = scrollHeight - clientHeight
			messagesDiv.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0
		}
	}, [messages])

	const handleSendMessage = async () => {
		try {
			let fileData = ''
			let typeData = ''
			if (audioBlob) {
				fileData = await fileUpload(audioBlob, 'audio/mp3', 'mp3')
				typeData = 'audio'
			} else if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
					directory: 'chat-document',
				})
				toast.success('Image uploaded successfully')
				fileData = imageUrl.data?.fileURLs[0]
				typeData = 'image'
			} else {
				typeData = 'text'
			}

			const messageData = {
				message: formData.message,
				file_url: fileData,
				files: [fileData],
				type: typeData || 'text',
				from: adminID,
				to: id,
				createdAt: new Date().toISOString(),
			}

			socket.emit('SendEmployeeMessage', messageData)

			setMessages((prev: any) => [...prev, messageData])

			setFormData({ ...formData, message: '', selectedFile: null, img: '' })
			setAudioBlob(null)
			const audioShowDiv = document.getElementById('audio-show')
			if (audioShowDiv) {
				audioShowDiv.style.display = 'none'
				while (audioShowDiv.firstChild) {
					audioShowDiv.removeChild(audioShowDiv.firstChild)
				}
			}
		} catch (error) {
			console.error('Error sending message:', error)
			toast.error('Failed to send message')
		}
	}

	const fileUpload = async (
		blob: Blob | null,
		contentType = 'audio/mp3',
		fileExtension = 'mp3'
	) => {
		const file = blob
			? new File([blob], `audio.${fileExtension}`, { type: contentType })
			: formData.selectedFile
		if (file) {
			const fileType = getFileType(file.type)
			if (fileType === 'audio') {
				const audioUrl: any = await FileUploadToFGGroup([file], { directory: 'chat-document' })
				toast.success('Audio uploaded successfully')
				return audioUrl.data?.fileURLs[0]
			} else {
				throw new Error('Unsupported file type')
			}
		} else {
			throw new Error('No file selected')
		}
	}

	const getFileType = (fileType: string, blobType?: string) => {
		if (blobType === 'audio') {
			return 'audio'
		} else if (fileType.startsWith('image/')) {
			return 'image'
		} else if (fileType.startsWith('audio/')) {
			return 'audio'
		} else {
			return 'text'
		}
	}

	const handleFileButtonClick = () => {
		const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
		if (fileInput) {
			fileInput.click()
		}
	}

	const handleMessagesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const { name, value } = event.target
		setFormData({ ...formData, [name]: value })
	}

	const handleEnterMessage = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			handleSendMessage()
		}
	}

	const addAudioElement = (blob: any) => {
		setAudioBlob(blob)

		const url = URL.createObjectURL(blob)
		const audio = document.createElement('audio')
		audio.src = url
		audio.controls = true

		const audioShowDiv = document.getElementById('audio-show')
		if (audioShowDiv) {
			while (audioShowDiv.firstChild) {
				audioShowDiv.removeChild(audioShowDiv.firstChild)
			}
			audioShowDiv.style.display = 'block' // Ensure the div is displayed
			audioShowDiv.appendChild(audio)
		} else {
			console.error('Audio show div not found.')
		}
	}

	const renderMessageContent = (message: any, isMe: boolean) => {
		if (message.type === 'text') {
			const containsAlphabetic = (text: any) => {
				return /[a-zA-Z1oO]/.test(text)
			}
			return (
				<>
					<span className={containsAlphabetic(message.message) ? 'fs-6' : 'fs-2'}>
						{message.message}
					</span>
					<div
						className='fs-8 mt-1 text-end'
						style={{
							color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#8A99AD',
						}}>
						{DayJS(message.createdAt).format('h:mm A')}
					</div>
				</>
			)
		} else if (message.type === 'image') {
			return (
				<>
					<img
						src={`https://files.fggroup.in/` + message.files[0]}
						alt='img'
						className='img-fluid rounded'
						style={{ maxHeight: '280px', objectFit: 'contain' }}
					/>
					<div
						className='fs-8 mt-1 text-end'
						style={{
							color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#8A99AD',
						}}>
						{DayJS(message.createdAt).format('h:mm A')}
					</div>
				</>
			)
		} else if (message.type === 'audio') {
			return (
				<>
					<audio
						controls
						className='mt-2'
						style={{ maxWidth: '100%' }}>
						<track
							kind='captions'
							src={`https://files.fggroup.in/` + message.files[0]}
							label='English'
						/>
						<source
							src={`https://files.fggroup.in/` + message.files[0]}
							type='audio/mp3'
						/>
						Your browser does not support the audio element.
					</audio>
					<div
						className='fs-8 mt-1 text-end'
						style={{
							color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#8A99AD',
						}}>
						{DayJS(message.createdAt).format('h:mm A')}
					</div>
				</>
			)
		}
	}

	const formatDate = (date: string) => {
		return DayJS(date).format('DD-MM-YYYY')
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { id, name, value } = event.target

		if (id === 'fileInput' && event.target instanceof HTMLInputElement && event.target.files) {
			const file = event.target.files[0]
			setFormData((prevData: any) => ({
				...prevData,
				selectedFile: file,
				img: URL.createObjectURL(file),
			}))
		} else {
			setFormData((prevData: any) => ({
				...prevData,
				[name]: value,
			}))
		}
	}

	const onEmojiClick = (emojiObject: any) => {
		setFormData((prevData) => ({
			...prevData,
			message: prevData.message + emojiObject.emoji,
		}))
		setShowEmojiPicker(false)
	}

	return (
		<div className='d-flex flex-column h-100' style={{ height: 'calc(100vh - 188px)' }}>
			<div
				className='gz-chat-messages-area hide-scrollbar flex-grow-1 p-5'
				style={{ overflowY: 'auto' }}>
				{!loading ? (
					<div
						data-kt-element='messages'
						data-kt-scroll='true'
						data-kt-scroll-activate='{default: false, lg: true}'
						data-kt-scroll-dependencies={
							isDrawer
								? '#kt_drawer_chat_messenger_header, #kt_drawer_chat_messenger_footer'
								: '#kt_header, #kt_app_header, #kt_app_toolbar, #kt_toolbar, #kt_footer, #kt_app_footer, #kt_chat_messenger_header, #kt_chat_messenger_footer'
						}
						data-kt-scroll-wrappers={
							isDrawer
								? '#kt_drawer_chat_messenger_body'
								: '#kt_content, #kt_app_content, #kt_chat_messenger_body'
						}
						data-kt-scroll-offset={isDrawer ? '0px' : '-2px'}>
						{messages.length === 0 ? (
							<div
								style={{ height: 'calc(100vh - 300px)' }}
								className='d-flex flex-column justify-content-center align-items-center'>
								<div className='text-muted fs-5 fw-bold mb-1'>No messages yet</div>
								<div className='text-muted fs-7'>Send a message to start the conversation</div>
							</div>
						) : (
							<>
								{messages.map((message: any, index: number) => {
									const isFirstMessage =
										index === 0 ||
										formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)

									const isMe = message.from === adminID

									return (
										<React.Fragment key={`message${index}`}>
											{isFirstMessage && (
												<div className='text-center my-3'>
													<span className='gz-chat-date-pill'>
														{formatDate(message.createdAt)}
													</span>
												</div>
											)}
											<div
												className={`d-flex justify-content-${isMe ? 'end' : 'start'} mb-3`}>
												<div className={isMe ? 'gz-chat-bubble-sender' : 'gz-chat-bubble-receiver'}>
													{renderMessageContent(message, isMe)}
												</div>
											</div>
										</React.Fragment>
									)
								})}
								<div ref={messagesEndRef} />
							</>
						)}
					</div>
				) : (
					<div
						style={{ height: 'calc(100vh - 300px)' }}
						className='d-flex justify-content-center align-items-center'>
						<div
							className='spinner-border text-primary'
							role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				)}
			</div>

			{/* Footer Input Bar */}
			<div
				className='gz-chat-footer-bar'
				id={isDrawer ? 'kt_drawer_chat_messenger_footer' : 'kt_chat_messenger_footer'}>
				<div>
					{formData.img && (
						<div className='d-flex align-items-center justify-content-center mb-3'>
							<div
								className='p-3 rounded border position-relative'
								style={{ background: '#F8FAFD', maxWidth: '360px' }}>
								<div className='d-flex justify-content-between align-items-center mb-2'>
									<span className='fs-7 fw-bold text-gray-700'>Image Preview</span>
									<button
										className='btn btn-xs btn-light-danger py-1 px-2'
										type='button'
										onClick={() => setFormData({ ...formData, selectedFile: null, img: '' })}>
										Cancel
									</button>
								</div>
								<img
									alt='msg img'
									src={formData.img}
									className='img-fluid rounded'
									style={{ maxHeight: '180px', width: '100%', objectFit: 'contain' }}
								/>
							</div>
						</div>
					)}
					{showEmojiPicker && (
						<div className='mb-3'>
							<Picker
								onEmojiClick={onEmojiClick}
								style={{ width: '100%', height: '320px' }}
							/>
						</div>
					)}
				</div>

				<div className='d-flex align-items-center gap-2'>
					<textarea
						className='form-control gz-chat-textarea flex-grow-1'
						value={formData.message}
						name='message'
						onChange={handleMessagesChange}
						onKeyDown={(e: any) => handleEnterMessage(e)}
						placeholder='Type a message...'
						rows={1}
						style={{ height: '42px', minHeight: '42px', maxHeight: '100px' }}
					/>
					<div id='audio-show'></div>

					<div className='feature-icon-container d-md-none d-block'>
						<button
							type='button'
							className='gz-chat-action-btn'
							onClick={handleFeatureButtonClick}>
							<FontAwesomeIcon
								icon={featureIcon ? faAngleDown : faAngleUp}
								className='fs-5'
							/>
						</button>

						{featureIcon && (
							<div className='feature-options' style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
								<button
									type='button'
									className='gz-chat-action-btn'
									onClick={handleEmojiButtonClick}>
									<FontAwesomeIcon
										icon={faSmile}
										className='fs-5'
									/>
								</button>
								<AudioRecorder
									onRecordingComplete={addAudioElement}
									audioTrackConstraints={{
										noiseSuppression: true,
										echoCancellation: true,
									}}
									downloadOnSavePress={false}
									downloadFileExtension='mp3'
								/>
								<button
									type='button'
									className='gz-chat-action-btn'
									onClick={handleFileButtonClick}>
									<FontAwesomeIcon
										icon={faLink}
										className='fs-5'
									/>
								</button>
								<input
									type='file'
									id='fileInput'
									className='d-none'
									onChange={handleInputChange}
								/>
							</div>
						)}
					</div>

					<div className='align-items-center d-md-flex d-none gap-1'>
						<button
							type='button'
							className='gz-chat-action-btn'
							title='Emoji'
							onClick={handleEmojiButtonClick}>
							<FontAwesomeIcon icon={faSmile} className='fs-5' />
						</button>
						<button
							type='button'
							className='gz-chat-action-btn'
							title='Attach file/image'
							onClick={handleFileButtonClick}>
							<FontAwesomeIcon icon={faLink} className='fs-5' />
						</button>
						<input
							type='file'
							id='fileInput'
							className='d-none'
							onChange={handleInputChange}
						/>
						<div className='d-inline-flex'>
							<AudioRecorder
								onRecordingComplete={addAudioElement}
								audioTrackConstraints={{
									noiseSuppression: true,
									echoCancellation: true,
								}}
								downloadOnSavePress={false}
								downloadFileExtension='mp3'
							/>
						</div>
					</div>

					<button
						className='gz-chat-send-btn'
						type='button'
						title='Send Message'
						onClick={handleSendMessage}>
						<FontAwesomeIcon icon={faPaperPlane} className='fs-5' />
					</button>
				</div>
			</div>
		</div>
	)
}

export { HRChatInner }
