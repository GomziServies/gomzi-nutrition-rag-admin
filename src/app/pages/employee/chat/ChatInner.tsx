/* eslint-disable jsx-a11y/anchor-is-valid */
import { faAngleDown, faAngleUp, faLink, faSmile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import Picker from 'emoji-picker-react'
import React, { FC, useEffect, useRef, useState } from 'react'
import { AudioRecorder } from 'react-audio-voice-recorder'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { FG_GROUP_BASE_URL } from '../../../../app/constants/base_URL'
import { GetEmployeeChatHistory } from '../../../Functions/FGGroup/EmployeeChat'
import SendImg from './send.png'
import { FileUploadToFGGroup, getProfile } from '../../../Functions/FGGroup'
import { DayJS } from '../../../../_metronic/helpers/Utils'

type Props = {
	isDrawer?: boolean
}

type ChatInnerProps = {
	id?: string
}

interface ProfileData {
	_id: string
}

const EmployeeChatInner: FC<Props & ChatInnerProps> = ({
	isDrawer = false,
	id,
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
		try {
			const response = await GetEmployeeChatHistory({ participant: id })
			setMessages(response.data)

			// Scroll to the latest message
			const messagesDiv = document.querySelector('[data-kt-element="messages"]')
			if (messagesDiv) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight
			}
		} catch (error) {
			toast.error('Error Getting User Data')
			console.error(error)
		}
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
			}

			socket.emit('SendEmployeeMessage', messageData)

			setFormData({ ...formData, message: '', selectedFile: null, img: '' })
			setAudioBlob(null)

			const audioShowDiv = document.getElementById('audio-show')
			if (audioShowDiv) {
				audioShowDiv.style.display = 'none'
				while (audioShowDiv.firstChild) {
					audioShowDiv.removeChild(audioShowDiv.firstChild)
				}
			}

			// Wait for a short delay before fetching chat data
			await fetchChatData()
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

	const renderMessageContent = (message: any) => {
		if (message.type === 'text') {
			const containsAlphabetic = (text: any) => {
				return /[a-zA-Z1oO]/.test(text)
			}
			return (
				<>
					<span className={containsAlphabetic(message.message) ? 'fs-4' : 'fs-1'}>
						{message.message}
					</span>
					<br />
					<p className='text-dark fs-7 mb-0 mt-2'>{DayJS(message.createdAt).format('h:mm A')}</p>
				</>
			)
		} else if (message.type === 'image') {
			return (
				<>
					<img
						src={`https://files.fggroup.in/` + message.files[0]}
						alt='img'
						className='img-fluid mt-3'
					/>
					<br />
					<p className='text-dark fs-7 mb-0 mt-2'>{DayJS(message.createdAt).format('h:mm A')}</p>
				</>
			)
		} else if (message.type === 'audio') {
			return (
				<>
					<audio
						controls
						className='mt-3'>
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
					<br />
					<p className='text-dark fs-7 mb-0 mt-2'>{DayJS(message.createdAt).format('h:mm A')}</p>
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
		<>
			<div className='hide-scrollbar whatsaap-background-image'>
				<div
					style={{ height: '100%' }}
					className={clsx('hide-scrollbar-inner px-5', { 'h-100': !isDrawer })}
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
							style={{ position: 'relative', height: 'calc(100vh - 154px)' }}
							className='d-flex justify-content-center align-items-center'>
							<div className='text-muted fs-2 fw-bold'>No chat found.</div>
						</div>
					) : (
						<>
							{messages.map((message: any, index: number) => {
								const isFirstMessage =
									index === 0 ||
									formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)

								const renderDate = isFirstMessage && (
									<div className='text-center'>
										<span
											className='fs-6 d-inline-block text-muted date-taxt'
											id='msg-date'>
											{formatDate(message.createdAt)}
										</span>
									</div>
								)

								const state = message.type === 'in' ? 'info' : 'primary'
								const templateAttr = {}
								if (message.template) {
									Object.defineProperty(templateAttr, 'data-kt-element', {
										value: `template-${message.type}`,
									})
								}
								const contentClass = `${isDrawer ? '' : 'd-flex'} justify-content-${
									message.from === adminID ? 'end' : 'start'
								} mb-0`
								return (
									<React.Fragment key={`message${index}`}>
										{renderDate}
										<div
											className={clsx('d-flex', contentClass, 'mb-5', {
												'd-none': message.template,
											})}
											{...templateAttr}>
											<div
												className={clsx(
													'd-flex flex-column align-items rounded',
													`align-items-${message.from === adminID ? 'end' : 'start'}`,
													`bg-light-${message.from === adminID ? 'warning' : `${state}`}`
												)}>
												<div
													className={clsx(
														'px-6 pt-2 pb-2 rounded',
														'text-dark fw-bold mw-lg-400px mw-200px',
														`text-${message.from === adminID ? 'end' : 'start'}`,
														`bg-light-${message.from === adminID ? 'warning' : `${state}`}`
													)}
													data-kt-element='message-text'>
													{renderMessageContent(message)}
												</div>
											</div>
										</div>
									</React.Fragment>
								)
							})}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>
			</div>
			<div
				style={{
					width: '100%',
					bottom: '-1px',
					left: '0',
					background: '#2d2d43',
					zIndex: 1000,
					position: 'absolute',
					borderRadius: '0px',
					boxShadow: '0px -2px 20px rgba(0, 0, 0, 0.2)',
				}}
				className='card-footer pt-5 pb-4 mt-md-0 mt-3 px-3 position-sticky'
				id={isDrawer ? 'kt_drawer_chat_messenger_footer' : 'kt_chat_messenger_footer'}>
				<div>
					{formData.img && (
						<div className='d-flex align-items-center justify-content-center my-3 m-auto'>
							<div
								className='d-flex flex-column align-items-center'
								style={{ width: '514px', height: '261px', marginBottom: '100px' }}>
								<p className='p-2 text-white'>Preview</p>
								<img
									alt='msg img'
									src={formData.img}
									className='img-fluid text-center m-auto'
									style={{ borderRadius: '10px', maxWidth: '100%', maxHeight: '100%' }}
								/>
								<div className='d-flex justify-content-between mt-2'>
									<button
										className='btn btn-danger'
										type='button'
										onClick={() => setFormData({ ...formData, selectedFile: null, img: '' })}>
										Close
									</button>
								</div>
							</div>
						</div>
					)}
					{showEmojiPicker && (
						<div className='m-3'>
							<Picker
								onEmojiClick={onEmojiClick}
								style={{ width: '100%', height: '350px' }}
							/>
						</div>
					)}
				</div>

				<div className='d-flex align-items'>
					<textarea
						className='form-control mb-3 border'
						value={formData.message}
						name='message'
						onChange={handleMessagesChange}
						onKeyDown={(e: any) => handleEnterMessage(e)}
						placeholder='Type a message'
						style={{ maxHeight: '76px', overflowY: 'auto', height: '20px' }}
						id={isDrawer ? 'kt_drawer_chat_messenger_footer' : 'kt_chat_messenger_footer'}
					/>
					<div
						id='audio-show'
						className='mx-2'></div>

					<div className='feature-icon-container d-md-none d-block'>
						<button
							type='button'
							className='btn btn-light d-flex rounded-circle py-4 px-4'
							onClick={handleFeatureButtonClick}>
							<FontAwesomeIcon
								icon={featureIcon ? faAngleDown : faAngleUp}
								className='fs-3 fw-bold text-dark'
							/>
						</button>

						{featureIcon && (
							<div className='feature-options'>
								<button
									type='button'
									className='btn btn-light rounded-circle py-3 px-3'
									onClick={handleEmojiButtonClick}>
									<FontAwesomeIcon
										icon={faSmile}
										className='fs-3 text-dark'
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
									className='btn btn-light rounded-circle p-3'
									onClick={handleFileButtonClick}>
									<FontAwesomeIcon
										icon={faLink}
										className='fs-3'
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

					<div className='align-items-center d-md-flex d-none me-2'>
						<div className='ms-3'>
							<button
								type='button'
								className='btn btn-light rounded-circle py-3 px-3'
								onClick={handleEmojiButtonClick}>
								<FontAwesomeIcon
									icon={faSmile}
									className='fs-3 text-dark'
								/>
							</button>
						</div>
						<div className='ms-3'>
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
						<div>
							<button
								type='button'
								className='btn btn-light rounded-circle ms-3 p-3'
								onClick={handleFileButtonClick}>
								<FontAwesomeIcon
									icon={faLink}
									className='fs-3'
								/>
							</button>
							<input
								type='file'
								id='fileInput'
								className='d-none'
								onChange={handleInputChange}
							/>
						</div>
					</div>

					<div className='d-flex align-items-center mb-md-0 mb-3 ms-2 ms-md-0'>
						<button
							className='btn btn-primary rounded-circle py-3 px-4 pe-2'
							type='button'
							onClick={handleSendMessage}>
							<img
								src={SendImg}
								alt='send'
								width='20px'
								height='20px'
							/>
						</button>
					</div>
				</div>
			</div>
		</>
	)
}

export { EmployeeChatInner }
