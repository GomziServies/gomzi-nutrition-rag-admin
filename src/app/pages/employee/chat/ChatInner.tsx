import {
	faAngleDown,
	faAngleUp,
	faChevronDown,
	faCopy,
	faInfoCircle,
	faLink,
	faMicrophone,
	faPaperclip,
	faPaperPlane,
	faPause,
	faPlay,
	faReply,
	faSmile,
	faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Picker, { Categories, Emoji, SuggestionMode } from 'emoji-picker-react'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useAudioRecorder } from 'react-audio-voice-recorder'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { FG_GROUP_BASE_URL } from '../../../../app/constants/base_URL'
import { FileUploadToFGGroup, getProfile } from '../../../Functions/FGGroup'
import { GetEmployeeChatHistory } from '../../../Functions/FGGroup/EmployeeChat'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import './employee-chat.css'

type Props = {
	isDrawer?: boolean
}

type ChatInnerProps = {
	id?: string
}

interface ProfileData {
	_id: string
}

// 6 standard emojis using emoji-picker-react unified codes (exact match with picker)
const REACTION_EMOJIS = [
	{ emoji: '👍', unified: '1f44d' },
	{ emoji: '❤️', unified: '2764-fe0f' },
	{ emoji: '😂', unified: '1f602' },
	{ emoji: '😮', unified: '1f62e' },
	{ emoji: '😢', unified: '1f622' },
	{ emoji: '🙏', unified: '1f64f' },
]

const CUSTOM_EMOJI_CATEGORIES = [
	{
		category: Categories.SUGGESTED,
		name: 'Recent Reactions',
	},
	{
		category: Categories.SMILEYS_PEOPLE,
		name: 'Smileys & People',
	},
	{
		category: Categories.ANIMALS_NATURE,
		name: 'Animals & Nature',
	},
	{
		category: Categories.FOOD_DRINK,
		name: 'Food & Drink',
	},
	{
		category: Categories.TRAVEL_PLACES,
		name: 'Travel & Places',
	},
	{
		category: Categories.ACTIVITIES,
		name: 'Activities',
	},
	{
		category: Categories.OBJECTS,
		name: 'Objects',
	},
	{
		category: Categories.SYMBOLS,
		name: 'Symbols',
	},
	{
		category: Categories.FLAGS,
		name: 'Flags',
	},
]

/* ========================================================
   Custom WhatsApp-Style Audio Player
   ======================================================== */
const CustomAudioPlayer: React.FC<{
	audioSrc: string
	isSender: boolean
}> = ({ audioSrc, isSender }) => {
	const [isPlaying, setIsPlaying] = useState(false)
	const [duration, setDuration] = useState(0)
	const [currentTime, setCurrentTime] = useState(0)
	const [playbackRate, setPlaybackRate] = useState(1)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const onLoadedMetadata = () => {
			if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
				setDuration(audio.duration)
			}
		}

		const onTimeUpdate = () => {
			setCurrentTime(audio.currentTime)
		}

		const onEnded = () => {
			setIsPlaying(false)
			setCurrentTime(0)
		}

		audio.addEventListener('loadedmetadata', onLoadedMetadata)
		audio.addEventListener('timeupdate', onTimeUpdate)
		audio.addEventListener('ended', onEnded)

		return () => {
			audio.removeEventListener('loadedmetadata', onLoadedMetadata)
			audio.removeEventListener('timeupdate', onTimeUpdate)
			audio.removeEventListener('ended', onEnded)
		}
	}, [audioSrc])

	const togglePlayPause = () => {
		if (!audioRef.current) return
		if (isPlaying) {
			audioRef.current.pause()
			setIsPlaying(false)
		} else {
			audioRef.current
				.play()
				.then(() => setIsPlaying(true))
				.catch((e) => console.error('Audio playback error:', e))
		}
	}

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!audioRef.current || !duration) return
		const rect = e.currentTarget.getBoundingClientRect()
		const clickX = e.clientX - rect.left
		const fraction = Math.max(0, Math.min(1, clickX / rect.width))
		const newTime = fraction * duration
		audioRef.current.currentTime = newTime
		setCurrentTime(newTime)
	}

	const toggleSpeed = () => {
		if (!audioRef.current) return
		const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
		audioRef.current.playbackRate = nextSpeed
		setPlaybackRate(nextSpeed)
	}

	const formatTime = (secs: number) => {
		if (isNaN(secs) || !isFinite(secs)) return '0:00'
		const m = Math.floor(secs / 60)
		const s = Math.floor(secs % 60)
		return `${m}:${s < 10 ? '0' : ''}${s}`
	}

	const waveformBars = [
		8, 14, 22, 12, 18, 28, 16, 24, 10, 18, 26, 14, 20, 30, 24, 16, 28, 12, 22, 14, 18, 26, 12, 20, 10, 16, 24, 12
	]

	const progressRatio = duration > 0 ? currentTime / duration : 0
	const activeCount = Math.floor(progressRatio * waveformBars.length)

	return (
		<div className='gz-audio-player-wrapper'>
			<audio ref={audioRef} src={audioSrc} preload='metadata' />
			<div className='d-flex align-items-center gap-3'>
				{/* Circular Play / Pause Button */}
				<button
					type='button'
					className={`gz-audio-play-btn ${isSender ? 'is-sender' : 'is-receiver'}`}
					onClick={togglePlayPause}
					title={isPlaying ? 'Pause' : 'Play voice message'}>
					<FontAwesomeIcon icon={isPlaying ? faPause : faPlay} style={{ fontSize: '13px' }} />
				</button>

				{/* Waveform Visualization & Scrubber */}
				<div className='d-flex flex-column flex-grow-1' style={{ minWidth: '170px' }}>
					<div
						className='gz-audio-waveform'
						onClick={handleSeek}
						role='slider'
						aria-valuenow={currentTime}
						aria-valuemin={0}
						aria-valuemax={duration}
						title='Seek audio position'>
						{waveformBars.map((barHeight, idx) => {
							const isPlayed = idx <= activeCount
							return (
								<div
									key={idx}
									className={`gz-audio-bar ${isPlayed ? 'is-played' : ''} ${
										isSender ? 'is-sender' : 'is-receiver'
									}`}
									style={{ height: `${barHeight}px` }}
								/>
							)
						})}
					</div>

					{/* Playback Timer & Speed Toggle */}
					<div className='d-flex align-items-center justify-content-between mt-1'>
						<span
							className='gz-audio-timer'
							style={{ color: isSender ? 'rgba(255, 255, 255, 0.75)' : '#64748B' }}>
							{isPlaying || currentTime > 0 ? formatTime(currentTime) : (duration > 0 ? formatTime(duration) : '0:00')}
						</span>
						<button
							type='button'
							className={`gz-audio-speed-btn ${isSender ? 'is-sender' : 'is-receiver'}`}
							onClick={toggleSpeed}
							title='Playback speed'>
							{playbackRate}x
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

/* ========================================================
   Main EmployeeChatInner Component
   ======================================================== */
const EmployeeChatInner: FC<Props & ChatInnerProps> = ({
	isDrawer = false,
	id,
}: Props & ChatInnerProps) => {
	const [showEmojiPicker, setShowEmojiPicker] = useState(false)
	const [featureIcon, setFeatureIcon] = useState(false)
	const [adminID, setAdminID] = useState<string>('')
	const [messages, setMessages] = useState<any[]>([])
	const [formData, setFormData] = useState({
		message: '',
		selectedFile: null as File | null,
		img: '',
	})
	const [socket, setSocket] = useState<any>(null)
	const messagesEndRef = useRef<HTMLDivElement | null>(null)
	const [loading, setLoading] = useState(false)

	// Context menu & reaction states
	const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null)
	const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null)
	const [isReactionExpanded, setIsReactionExpanded] = useState<boolean>(false)
	const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null)
	const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null)
	const activeAnchorRef = useRef<HTMLElement | null>(null)

	const [messageReactions, setMessageReactions] = useState<{ [msgId: string]: string }>({})
	const [replyMessage, setReplyMessage] = useState<any>(null)

	const calculateReactionPosition = (anchorEl: HTMLElement, isExpanded: boolean) => {
		const rect = anchorEl.getBoundingClientRect()
		const viewportWidth = window.innerWidth
		const viewportHeight = window.innerHeight

		const popupWidth = isExpanded ? 324 : 284
		const popupHeight = isExpanded ? 380 : 46

		// Header & Composer boundaries
		const headerEl = document.querySelector('.gz-emp-workspace-header')
		const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 72
		const composerEl = document.querySelector('.gz-emp-composer-bar')
		const composerTop = composerEl ? composerEl.getBoundingClientRect().top : viewportHeight - 74

		const spaceAbove = rect.top - headerBottom - 8
		const spaceBelow = composerTop - rect.bottom - 8

		let top = 0
		if (isExpanded) {
			if (spaceAbove >= popupHeight) {
				// Sits above bubble, keeping bubble completely visible
				top = rect.top - popupHeight - 8
			} else if (spaceBelow >= popupHeight) {
				// Sits below bubble, keeping bubble completely visible
				top = rect.bottom + 8
			} else {
				// Tight space: place on side with more room, clamping inside boundaries
				if (spaceAbove >= spaceBelow) {
					top = Math.max(headerBottom + 8, rect.top - popupHeight - 8)
				} else {
					top = rect.bottom + 8
				}
			}
			top = Math.max(headerBottom + 8, Math.min(composerTop - 180, top))
		} else {
			// Compact pill (46px height): prefer above, fallback to below
			if (spaceAbove >= 50) {
				top = rect.top - 50
			} else {
				top = rect.bottom + 8
			}
			top = Math.max(headerBottom + 6, Math.min(composerTop - 52, top))
		}

		// Horizontal alignment: anchor to the message bubble
		const isSender = anchorEl.classList.contains('gz-emp-bubble-sender')
		let left = isSender ? rect.right - popupWidth : rect.left

		// Clamp horizontally within viewport
		const minLeft = 16
		const maxLeft = viewportWidth - popupWidth - 16
		left = Math.max(minLeft, Math.min(maxLeft, left))

		return { top, left }
	}

	const closeAllPopups = () => {
		setActiveReactionMenuId(null)
		setIsReactionExpanded(false)
		setActiveActionMenuId(null)
		setShowEmojiPicker(false)
		setPopupPosition(null)
		setActionMenuPosition(null)
		activeAnchorRef.current = null
	}

	// Audio voice recorder hook
	const {
		startRecording,
		stopRecording,
		togglePauseResume,
		recordingBlob,
		isRecording,
		isPaused,
		recordingTime,
	} = useAudioRecorder({ noiseSuppression: true, echoCancellation: true })

	const isCancelledRef = useRef(false)
	const isPendingSendRef = useRef(false)
	const isPausedRef = useRef(isPaused)
	useEffect(() => {
		isPausedRef.current = isPaused
	}, [isPaused])

	// Real-time microphone audio visualizer state & refs
	const [recordingWaveform, setRecordingWaveform] = useState<number[]>([])
	const visualizerAudioCtxRef = useRef<AudioContext | null>(null)
	const visualizerStreamRef = useRef<MediaStream | null>(null)
	const visualizerAnimFrameRef = useRef<number | null>(null)

	// Newly sent message IDs for subtle slide-in animation
	const [newlySentMsgIds, setNewlySentMsgIds] = useState<Set<string>>(new Set())

	// Real-Time Audio Visualizer Loop using Web Audio AnalyserNode
	useEffect(() => {
		if (isRecording) {
			let isMounted = true
			let audioContext: AudioContext | null = null
			let stream: MediaStream | null = null

			const startVisualizer = async () => {
				try {
					if (!navigator.mediaDevices?.getUserMedia) return
					const userStream = await navigator.mediaDevices.getUserMedia({ audio: true })
					if (!isMounted) {
						userStream.getTracks().forEach((track) => track.stop())
						return
					}
					stream = userStream
					visualizerStreamRef.current = userStream

					const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
					if (!AudioContextClass) return

					audioContext = new AudioContextClass()
					visualizerAudioCtxRef.current = audioContext

					const source = audioContext.createMediaStreamSource(userStream)
					const analyser = audioContext.createAnalyser()
					analyser.fftSize = 64
					analyser.smoothingTimeConstant = 0.5
					source.connect(analyser)

					const bufferLength = analyser.frequencyBinCount
					const dataArray = new Uint8Array(bufferLength)

					let lastSample = Date.now()
					const sampleInterval = 90 // sample every 90ms

					const sampleAudio = () => {
						if (!isMounted) return

						// When paused, immediately freeze bar generation!
						if (!isPausedRef.current) {
							const now = Date.now()
							if (now - lastSample >= sampleInterval) {
								lastSample = now
								analyser.getByteFrequencyData(dataArray)

								let sum = 0
								for (let i = 0; i < bufferLength; i++) {
									sum += dataArray[i]
								}
								const average = sum / bufferLength
								// Normalized amplitude between 0.12 and 1.0
								const normalized = Math.max(0.12, Math.min(1.0, average / 100))

								setRecordingWaveform((prev) => {
									const maxBars = 45
									const next = [...prev, normalized]
									if (next.length > maxBars) {
										return next.slice(next.length - maxBars)
									}
									return next
								})
							}
						}

						visualizerAnimFrameRef.current = requestAnimationFrame(sampleAudio)
					}

					visualizerAnimFrameRef.current = requestAnimationFrame(sampleAudio)
				} catch (err) {
					console.warn('Audio visualizer microphone stream unavailable:', err)
				}
			}

			startVisualizer()

			return () => {
				isMounted = false
				if (visualizerAnimFrameRef.current) {
					cancelAnimationFrame(visualizerAnimFrameRef.current)
					visualizerAnimFrameRef.current = null
				}
				if (stream) {
					stream.getTracks().forEach((t) => t.stop())
					visualizerStreamRef.current = null
				}
				if (audioContext && audioContext.state !== 'closed') {
					audioContext.close().catch(() => {})
					visualizerAudioCtxRef.current = null
				}
			}
		} else {
			setRecordingWaveform([])
			if (visualizerAnimFrameRef.current) {
				cancelAnimationFrame(visualizerAnimFrameRef.current)
				visualizerAnimFrameRef.current = null
			}
			if (visualizerStreamRef.current) {
				visualizerStreamRef.current.getTracks().forEach((t) => t.stop())
				visualizerStreamRef.current = null
			}
			if (visualizerAudioCtxRef.current && visualizerAudioCtxRef.current.state !== 'closed') {
				visualizerAudioCtxRef.current.close().catch(() => {})
				visualizerAudioCtxRef.current = null
			}
		}
	}, [isRecording])

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
		}
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	// Recalculate popup positions on window resize or canvas scrolling
	useEffect(() => {
		if (!activeReactionMenuId && !activeActionMenuId) return

		const handleScrollOrResize = () => {
			if (activeReactionMenuId && activeAnchorRef.current) {
				const pos = calculateReactionPosition(activeAnchorRef.current, isReactionExpanded)
				setPopupPosition(pos)
			}
			if (activeActionMenuId && activeAnchorRef.current) {
				const rect = activeAnchorRef.current.getBoundingClientRect()
				const viewportWidth = window.innerWidth
				const viewportHeight = window.innerHeight
				const menuWidth = 145
				const menuHeight = 160

				let top = rect.bottom + 6
				if (top + menuHeight > viewportHeight - 80) {
					top = rect.top - menuHeight - 6
				}
				let left = rect.left - menuWidth + rect.width
				left = Math.max(16, Math.min(viewportWidth - menuWidth - 16, left))
				setActionMenuPosition({ top, left })
			}
		}

		window.addEventListener('resize', handleScrollOrResize)
		const canvas = document.querySelector('.gz-emp-canvas')
		if (canvas) {
			canvas.addEventListener('scroll', handleScrollOrResize)
		}

		return () => {
			window.removeEventListener('resize', handleScrollOrResize)
			if (canvas) {
				canvas.removeEventListener('scroll', handleScrollOrResize)
			}
		}
	}, [activeReactionMenuId, activeActionMenuId, isReactionExpanded])

	// Robust Click Outside & Escape Handler to close popups
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				closeAllPopups()
			}
		}

		const handleMouseDownOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target) return

			// If clicked inside any open popup or trigger button, DO NOT close
			if (
				target.closest('.gz-floating-reaction-container') ||
				target.closest('.gz-floating-action-menu') ||
				target.closest('.gz-composer-emoji-picker') ||
				target.closest('.EmojiPickerReact') ||
				target.closest('.gz-msg-action-trigger') ||
				target.closest('.gz-msg-dropdown-trigger') ||
				target.closest('.gz-emp-composer-action-btn')
			) {
				return
			}

			closeAllPopups()
		}

		document.addEventListener('mousedown', handleMouseDownOutside)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleMouseDownOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	const fetchAdminData = async () => {
		try {
			const response: FGGroupAPIResponse = await getProfile()
			if (response.data) {
				const profileData = response.data as ProfileData
				setAdminID(profileData._id)
			}
		} catch (error) {
			console.error('Error fetching employee profile:', error)
		}
	}

	const fetchChatData = async () => {
		if (!id) return
		setLoading(true)
		try {
			const response = await GetEmployeeChatHistory({ participant: id })
			setMessages(response.data || [])

			const messagesDiv = document.querySelector('[data-kt-element="messages"]')
			if (messagesDiv) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight
			}
		} catch (error) {
			toast.error('Error getting chat messages')
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

			newSocket.on('SendEmployeeMessage', () => {
				fetchChatData()
			})

			fetchChatData()
			fetchAdminData()

			return () => {
				newSocket.disconnect()
			}
		}
	}, [id])

	// Handle sending recording after blob becomes ready
	useEffect(() => {
		if (recordingBlob && isPendingSendRef.current) {
			isPendingSendRef.current = false
			if (!isCancelledRef.current) {
				sendVoiceNote(recordingBlob)
			}
			isCancelledRef.current = false
		}
	}, [recordingBlob])

	const sendVoiceNote = async (blob: Blob) => {
		try {
			const file = new File([blob], 'audio.mp3', { type: 'audio/mp3' })
			const audioUrl: any = await FileUploadToFGGroup([file], { directory: 'chat-document' })
			const fileData = audioUrl.data?.fileURLs[0]

			if (!fileData) {
				toast.error('Failed to upload voice recording')
				return
			}

			const clientMsgId = `voice-${Date.now()}`
			const messageData = {
				_id: clientMsgId,
				message: '',
				file_url: fileData,
				files: [fileData],
				type: 'audio',
				from: adminID,
				to: id,
				createdAt: new Date().toISOString(),
			}

			socket?.emit('SendEmployeeMessage', messageData)
			setNewlySentMsgIds((prev) => new Set(prev).add(clientMsgId))
			setMessages((prev) => [...prev, messageData])
			setTimeout(() => {
				setNewlySentMsgIds((prev) => {
					const next = new Set(prev)
					next.delete(clientMsgId)
					return next
				})
			}, 300)
			toast.success('Voice message sent')
		} catch (error) {
			console.error('Error uploading voice message:', error)
			toast.error('Error sending voice message')
		}
	}

	const handleStartRecording = () => {
		isCancelledRef.current = false
		isPendingSendRef.current = false
		startRecording()
	}

	const handleFinishAndSendRecording = () => {
		isPendingSendRef.current = true
		isCancelledRef.current = false
		stopRecording()
	}

	const handleCancelRecording = () => {
		isCancelledRef.current = true
		isPendingSendRef.current = false
		stopRecording()
		toast('Recording cancelled', { icon: '🗑️' })
	}

	const handleSendMessage = async () => {
		try {
			let fileData = ''
			let typeData = ''
			if (formData.selectedFile) {
				const imageUrl: any = await FileUploadToFGGroup([formData.selectedFile], {
					directory: 'chat-document',
				})
				toast.success('File uploaded successfully')
				fileData = imageUrl.data?.fileURLs[0]
				typeData = 'image'
			} else {
				typeData = 'text'
			}

			if (!formData.message.trim() && !fileData) {
				return
			}

			let finalMessage = formData.message
			if (replyMessage) {
				const quoteSender = replyMessage.from === adminID ? 'You' : 'System'
				const quoteSnippet =
					replyMessage.type === 'audio'
						? '🎤 Voice Message'
						: replyMessage.type === 'image'
						? '📷 Photo'
						: replyMessage.message
				finalMessage = `> ${quoteSender}: ${quoteSnippet}\n${formData.message}`
			}

			const clientMsgId = `temp-${Date.now()}`
			const messageData = {
				_id: clientMsgId,
				message: finalMessage,
				file_url: fileData,
				files: [fileData],
				type: typeData || 'text',
				from: adminID,
				to: id,
				createdAt: new Date().toISOString(),
			}

			socket?.emit('SendEmployeeMessage', messageData)

			// Instant optimistic update with smooth slide-in animation
			setNewlySentMsgIds((prev) => new Set(prev).add(clientMsgId))
			setMessages((prev) => [...prev, messageData])
			setTimeout(() => {
				setNewlySentMsgIds((prev) => {
					const next = new Set(prev)
					next.delete(clientMsgId)
					return next
				})
			}, 300)

			setFormData({ message: '', selectedFile: null, img: '' })
			setReplyMessage(null)
		} catch (error) {
			console.error('Error sending message:', error)
			toast.error('Failed to send message')
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

	const handleToggleReaction = (msgId: string, emoji: string) => {
		setMessageReactions((prev) => {
			if (prev[msgId] === emoji) {
				const copy = { ...prev }
				delete copy[msgId]
				return copy
			}
			return { ...prev, [msgId]: emoji }
		})
		setActiveReactionMenuId(null)
	}

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text)
		toast.success('Message copied to clipboard')
		setActiveActionMenuId(null)
	}

	const handleReply = (message: any) => {
		setReplyMessage(message)
		setActiveActionMenuId(null)
	}

	const handleMessageInfo = (message: any) => {
		toast(
			`Sent: ${DayJS(message.createdAt).format('DD MMM YYYY, h:mm A')}`,
			{ icon: 'ℹ️' }
		)
		setActiveActionMenuId(null)
	}

	const handleDeleteMessage = (msgId: string) => {
		setMessages((prev) => prev.filter((m, i) => (m._id || `msg-${i}`) !== msgId))
		toast.success('Message removed')
		setActiveActionMenuId(null)
	}

	const formatDate = (date: string) => {
		return DayJS(date).format('DD-MM-YYYY')
	}

	const formatRecordingTime = (secs: number) => {
		const m = Math.floor(secs / 60)
		const s = Math.floor(secs % 60)
		return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
	}

	const renderMessageContent = (message: any, isMe: boolean) => {
		// Audio message check
		if (
			message.type === 'audio' ||
			message.file_url?.includes('.mp3') ||
			(message.files && message.files[0] && message.files[0].endsWith('.mp3'))
		) {
			const audioSrc = message.file_url || `https://files.fggroup.in/` + message.files[0]
			return (
				<>
					<CustomAudioPlayer audioSrc={audioSrc} isSender={isMe} />
					<div className={isMe ? 'gz-emp-bubble-time-sender' : 'gz-emp-bubble-time-receiver'}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</div>
				</>
			)
		}

		// Image message check
		if (
			message.type === 'image' ||
			(message.files && message.files[0] && /\.(jpg|jpeg|png|webp|gif)$/i.test(message.files[0]))
		) {
			const imgSrc = message.file_url || `https://files.fggroup.in/` + message.files[0]
			return (
				<>
					<img
						src={imgSrc}
						alt='attachment'
						className='img-fluid rounded'
						style={{ maxHeight: '280px', objectFit: 'contain' }}
					/>
					<div className={isMe ? 'gz-emp-bubble-time-sender' : 'gz-emp-bubble-time-receiver'}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</div>
				</>
			)
		}

		// Text message fallback (works even if type is undefined/empty)
		const text = message.message || (typeof message === 'string' ? message : '')
		if (text) {
			const containsAlphabetic = (t: string) => /[a-zA-Z1oO]/.test(t)
			return (
				<>
					<div
						style={{
							fontSize: containsAlphabetic(text) ? '14.5px' : '22px',
							lineHeight: 1.5,
							whiteSpace: 'pre-wrap',
						}}>
						{text}
					</div>
					<div className={isMe ? 'gz-emp-bubble-time-sender' : 'gz-emp-bubble-time-receiver'}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</div>
				</>
			)
		}

		return null
	}

	const handleOpenReaction = (e: React.MouseEvent, messageId: string) => {
		e.stopPropagation()
		if (activeReactionMenuId === messageId) {
			closeAllPopups()
			return
		}
		closeAllPopups()

		const groupEl = e.currentTarget.closest('.gz-message-bubble-group')
		const bubbleEl = (groupEl?.querySelector('.gz-emp-bubble-sender, .gz-emp-bubble-receiver') || groupEl) as HTMLElement | null
		if (bubbleEl) {
			activeAnchorRef.current = bubbleEl
			const pos = calculateReactionPosition(bubbleEl, false)
			setPopupPosition(pos)
			setIsReactionExpanded(false)
			setActiveReactionMenuId(messageId)
		}
	}

	const handleExpandReaction = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (activeAnchorRef.current) {
			setIsReactionExpanded(true)
			const pos = calculateReactionPosition(activeAnchorRef.current, true)
			setPopupPosition(pos)
		}
	}

	const handleReactionSelect = (emoji: string) => {
		if (activeReactionMenuId) {
			handleToggleReaction(activeReactionMenuId, emoji)
		}
		closeAllPopups()
	}

	const handleOpenActionMenu = (e: React.MouseEvent, messageId: string) => {
		e.stopPropagation()
		if (activeActionMenuId === messageId) {
			closeAllPopups()
			return
		}
		closeAllPopups()

		const triggerEl = e.currentTarget as HTMLElement
		activeAnchorRef.current = triggerEl
		const rect = triggerEl.getBoundingClientRect()
		const viewportWidth = window.innerWidth
		const viewportHeight = window.innerHeight
		const menuWidth = 145
		const menuHeight = 160

		let top = rect.bottom + 6
		if (top + menuHeight > viewportHeight - 80) {
			top = rect.top - menuHeight - 6
		}
		let left = rect.left - menuWidth + rect.width
		left = Math.max(16, Math.min(viewportWidth - menuWidth - 16, left))

		setActionMenuPosition({ top, left })
		setActiveActionMenuId(messageId)
	}

	return (
		<div className='d-flex flex-column h-100' style={{ height: 'calc(100vh - 72px)' }}>
			{/* Chat Canvas with Sweeping Organic Lavender Waves Background */}
			<div className='gz-emp-canvas' data-kt-element='messages'>
				{!loading ? (
					<>
						{messages.length === 0 ? (
							<div
								style={{ height: 'calc(100vh - 260px)' }}
								className='d-flex flex-column justify-content-center align-items-center'>
								<div className='text-muted fs-5 fw-bold mb-1'>No messages yet</div>
								<div className='text-muted fs-7'>Send a message to start the conversation</div>
							</div>
						) : (
							<>
								{messages.map((message: any, index: number) => {
									const isMe = message.from === adminID
									const messageId = message._id || `msg-${index}`
									const messageContent = renderMessageContent(message, isMe)

									// Filter out any messages without renderable content to prevent ghost bubbles
									if (!messageContent) {
										return null
									}

									const isFirstMessage =
										index === 0 ||
										formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)

									const isReactionOpen = activeReactionMenuId === messageId
									const isActionOpen = activeActionMenuId === messageId
									const isNewMessage = newlySentMsgIds.has(messageId)

									return (
										<React.Fragment key={messageId}>
											{isFirstMessage && (
												<div className='text-center my-3'>
													<span className='gz-emp-date-pill'>
														{formatDate(message.createdAt)}
													</span>
												</div>
											)}

											<div className={`gz-message-row ${isMe ? 'is-sender' : 'is-receiver'}`}>
												{/* Hover target strictly wraps bubble + action icons */}
												<div
													className={`gz-message-bubble-group ${
														isMe ? 'is-sender' : 'is-receiver'
													} ${isReactionOpen || isActionOpen ? 'has-active-menu' : ''} ${
														isNewMessage ? 'gz-new-message-anim' : ''
													}`}>
													{/* Hover Action Triggers (for Sender on left: React button only) */}
													{isMe && (
														<div className='gz-msg-hover-actions'>
															<button
																type='button'
																className='gz-msg-action-trigger'
																title='React'
																onClick={(e) => handleOpenReaction(e, messageId)}>
																<FontAwesomeIcon icon={faSmile} />
															</button>
														</div>
													)}

													{/* Message Bubble (Sized strictly to fit content) */}
													<div
														className={
															isMe
																? 'gz-emp-bubble-sender'
																: 'gz-emp-bubble-receiver'
														}>
														{/* Dropdown Options Button positioned at upper corner of bubble */}
														<button
															type='button'
															className={`gz-msg-dropdown-trigger ${
																isMe ? 'is-sender' : 'is-receiver'
															}`}
															title='Options'
															onClick={(e) => handleOpenActionMenu(e, messageId)}>
															<FontAwesomeIcon icon={faChevronDown} />
														</button>

														{messageContent}

														{/* Reaction Badge on bubble if reacted */}
														{messageReactions[messageId] && (
															<div
																className={`gz-message-reaction-pill ${
																	isMe ? 'is-sender' : 'is-receiver'
																}`}
																onClick={() =>
																	handleToggleReaction(
																		messageId,
																		messageReactions[messageId]
																	)
																}
																title='Remove reaction'>
																<span>{messageReactions[messageId]}</span>
															</div>
														)}
													</div>

													{/* Hover Action Triggers (for Receiver on right: React button only) */}
													{!isMe && (
														<div className='gz-msg-hover-actions'>
															<button
																type='button'
																className='gz-msg-action-trigger'
																title='React'
																onClick={(e) => handleOpenReaction(e, messageId)}>
																<FontAwesomeIcon icon={faSmile} />
															</button>
														</div>
													)}
												</div>
											</div>
										</React.Fragment>
									)
								})}
								<div ref={messagesEndRef} />
							</>
						)}
					</>
				) : (
					<div
						style={{ height: 'calc(100vh - 260px)' }}
						className='d-flex justify-content-center align-items-center'>
						<div className='spinner-border text-primary' role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				)}
			</div>

			{/* Floating Connected Reaction Container (WhatsApp / Instagram Style Morph Overlay) */}
			{activeReactionMenuId && popupPosition && (
				<div
					className={`gz-floating-reaction-container ${
						isReactionExpanded ? 'is-expanded' : 'is-compact'
					}`}
					style={{
						position: 'fixed',
						top: `${popupPosition.top}px`,
						left: `${popupPosition.left}px`,
						zIndex: 1050,
					}}
					onClick={(e) => e.stopPropagation()}>
					{!isReactionExpanded ? (
						<div className='gz-reaction-pill-content'>
							{REACTION_EMOJIS.map((item) => (
								<button
									key={item.unified}
									type='button'
									className='gz-reaction-emoji-btn'
									onClick={() => handleReactionSelect(item.emoji)}
									title={item.emoji}>
									<Emoji unified={item.unified} size={22} />
								</button>
							))}
							<button
								type='button'
								className='gz-reaction-emoji-btn is-plus'
								title='More emojis'
								onClick={handleExpandReaction}>
								+
							</button>
						</div>
					) : (
						<div className='gz-reaction-expanded-content'>
							<Picker
								onEmojiClick={(emojiData) => handleReactionSelect(emojiData.emoji)}
								width='100%'
								height='100%'
								previewConfig={{ showPreview: false }}
								searchPlaceholder='Search...'
								categories={CUSTOM_EMOJI_CATEGORIES}
								suggestedEmojisMode={SuggestionMode.RECENT}
								style={{
									'--epr-search-input-padding': '0 16px 0 44px',
									'--epr-search-input-border-radius': '9999px',
									'--epr-search-input-height': '38px',
									'--epr-search-input-bg-color': '#f1f5f9',
									'--epr-search-input-bg-color-active': '#ffffff',
									'--epr-search-border-color': '#e2e8f0',
									'--epr-search-border-color-active': '#cbd5e1',
									'--epr-highlight-color': '#172b4d',
									'--epr-search-input-placeholder-color': '#94a3b8',
									'--epr-search-bar-inner-padding': '14px',
									'--epr-picker-border-radius': '18px',
								} as React.CSSProperties}
							/>
						</div>
					)}
				</div>
			)}

			{/* Floating Viewport-Aware Action Context Menu Overlay */}
			{activeActionMenuId && actionMenuPosition && (
				<div
					className='gz-floating-action-menu'
					style={{
						position: 'fixed',
						top: `${actionMenuPosition.top}px`,
						left: `${actionMenuPosition.left}px`,
						zIndex: 1050,
					}}
					onClick={(e) => e.stopPropagation()}>
					{(() => {
						const targetMsg = messages.find(
							(m: any, i: number) => (m._id || `msg-${i}`) === activeActionMenuId
						)
						if (!targetMsg) return null
						const isTargetMe = targetMsg.from === adminID

						return (
							<>
								<button
									type='button'
									className='gz-ctx-menu-item'
									onClick={() => handleReply(targetMsg)}>
									<FontAwesomeIcon icon={faReply} style={{ fontSize: '13px' }} />
									<span>Reply</span>
								</button>

								{targetMsg.message && (
									<button
										type='button'
										className='gz-ctx-menu-item'
										onClick={() => handleCopy(targetMsg.message)}>
										<FontAwesomeIcon icon={faCopy} style={{ fontSize: '13px' }} />
										<span>Copy</span>
									</button>
								)}

								<button
									type='button'
									className='gz-ctx-menu-item'
									onClick={() => handleMessageInfo(targetMsg)}>
									<FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '13px' }} />
									<span>Message Info</span>
								</button>

								{isTargetMe && (
									<button
										type='button'
										className='gz-ctx-menu-item text-danger'
										onClick={() => handleDeleteMessage(activeActionMenuId)}>
										<FontAwesomeIcon icon={faTrash} style={{ fontSize: '13px' }} />
										<span>Delete</span>
									</button>
								)}
							</>
						)
					})()}
				</div>
			)}

			{/* Quoted Message Reply Preview */}
			{replyMessage && (
				<div className='gz-reply-preview-bar'>
					<div className='gz-reply-preview-content'>
						<div className='fw-bold' style={{ color: '#7C3AED', fontSize: '12px' }}>
							Replying to {replyMessage.from === adminID ? 'yourself' : 'System @ FG Group'}
						</div>
						<div
							className='text-muted text-truncate'
							style={{ maxWidth: '400px', fontSize: '12px' }}>
							{replyMessage.type === 'audio'
								? '🎤 Voice message'
								: replyMessage.type === 'image'
								? '📷 Photo attachment'
								: replyMessage.message}
						</div>
					</div>
					<button
						type='button'
						className='btn btn-xs btn-light-danger py-1 px-2'
						onClick={() => setReplyMessage(null)}>
						✕
					</button>
				</div>
			)}

			{/* Floating Message Composer & Recording Studio */}
			<div
				className='gz-emp-composer-bar'
				id={isDrawer ? 'kt_drawer_chat_messenger_footer' : 'kt_chat_messenger_footer'}>
				{/* Image Preview Overlay if attached */}
				{formData.img && (
					<div
						className='position-absolute'
						style={{ bottom: '74px', left: '20px', zIndex: 100 }}>
						<div
							className='p-3 rounded-3 border shadow-sm'
							style={{ background: '#FFFFFF', maxWidth: '320px' }}>
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
								alt='Preview'
								src={formData.img}
								className='img-fluid rounded'
								style={{ maxHeight: '160px', width: '100%', objectFit: 'contain' }}
							/>
						</div>
					</div>
				)}

				{/* Emoji Picker Modal / Popup */}
				{showEmojiPicker && (
					<div
						className='gz-composer-emoji-picker position-absolute'
						style={{ bottom: '74px', left: '20px', zIndex: 100 }}>
						<Picker
							onEmojiClick={onEmojiClick}
							width={320}
							height={360}
							searchPlaceholder='Search...'
							categories={CUSTOM_EMOJI_CATEGORIES}
							suggestedEmojisMode={SuggestionMode.RECENT}
							style={{
								'--epr-search-input-padding': '0 16px 0 44px',
								'--epr-search-input-border-radius': '9999px',
								'--epr-search-input-height': '38px',
								'--epr-search-input-bg-color': '#f1f5f9',
								'--epr-search-input-bg-color-active': '#ffffff',
								'--epr-search-border-color': '#e2e8f0',
								'--epr-search-border-color-active': '#cbd5e1',
								'--epr-highlight-color': '#172b4d',
								'--epr-search-input-placeholder-color': '#94a3b8',
								'--epr-search-bar-inner-padding': '14px',
								'--epr-picker-border-radius': '18px',
							} as React.CSSProperties}
						/>
					</div>
				)}

				{/* Unified WhatsApp-style Rounded Composer Bar */}
				<div className={`gz-emp-composer-pill ${isRecording ? 'is-recording' : ''}`}>
					{isRecording ? (
						/* WhatsApp-style Active Voice Recording Mode */
						<>
							{/* Recording Pulse Dot & Elapsed Timer */}
							<div className='gz-recording-status'>
								<span className={`gz-recording-pulse-dot ${isPaused ? 'is-paused' : ''}`} />
								<span className='gz-recording-timer'>{formatRecordingTime(recordingTime)}</span>
							</div>

							{/* Real-Time Microphone Waveform */}
							<div className='gz-recording-live-waveform'>
								{recordingWaveform.length > 0 ? (
									recordingWaveform.map((amp, idx) => (
										<span
											key={idx}
											className={`gz-live-wave-bar ${isPaused ? 'is-paused' : ''}`}
											style={{
												height: `${Math.round(amp * 24 + 4)}px`,
											}}
										/>
									))
								) : (
									<>
										<span className='gz-live-wave-bar' style={{ height: '6px' }} />
										<span className='gz-live-wave-bar' style={{ height: '12px' }} />
										<span className='gz-live-wave-bar' style={{ height: '8px' }} />
									</>
								)}
							</div>

							{/* Stable Recording Controls - Borderless */}
							<div
								className='gz-recording-controls'
								style={{
									border: 'none',
									outline: 'none',
									boxShadow: 'none',
									background: 'transparent',
								}}>
								<button
									type='button'
									className={`gz-recording-ctrl-btn ${isPaused ? 'is-paused-play' : ''}`}
									style={{ border: 'none', outline: 'none' }}
									onClick={togglePauseResume}
									title={isPaused ? 'Resume recording' : 'Pause recording'}>
									<FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
								</button>

								<button
									type='button'
									className='gz-recording-ctrl-btn is-cancel'
									style={{ border: 'none', outline: 'none' }}
									onClick={handleCancelRecording}
									title='Cancel recording'>
									<FontAwesomeIcon icon={faTrash} />
								</button>

								<button
									type='button'
									className='gz-emp-send-btn'
									style={{ border: 'none', outline: 'none' }}
									onClick={handleFinishAndSendRecording}
									title='Send voice message'>
									<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '15px' }} />
								</button>
							</div>
						</>
					) : (
						/* Regular WhatsApp Message Input Row */
						<>
							{/* Left Action Controls: Emoji & Attachments */}
							<div className='gz-composer-left-actions'>
								<button
									type='button'
									className='gz-emp-composer-action-btn'
									title='Emoji'
									onClick={() => {
										const willOpen = !showEmojiPicker
										closeAllPopups()
										if (willOpen) setShowEmojiPicker(true)
									}}>
									<FontAwesomeIcon icon={faSmile} style={{ fontSize: '18px' }} />
								</button>

								<button
									type='button'
									className='gz-emp-composer-action-btn'
									title='Attach file'
									onClick={handleFileButtonClick}>
									<FontAwesomeIcon icon={faPaperclip} style={{ fontSize: '16px' }} />
								</button>

								<button
									type='button'
									className='gz-emp-composer-action-btn d-none d-sm-flex'
									title='Attach link or document'
									onClick={handleFileButtonClick}>
									<FontAwesomeIcon icon={faLink} style={{ fontSize: '15px' }} />
								</button>
							</div>

							<input
								type='file'
								id='fileInput'
								className='d-none'
								onChange={handleInputChange}
							/>

							{/* Center: Flexible Message Text Area */}
							<textarea
								className='gz-emp-composer-input'
								value={formData.message}
								name='message'
								onChange={handleMessagesChange}
								onKeyDown={(e: any) => handleEnterMessage(e)}
								placeholder='Type a message...'
								rows={1}
							/>

							{/* Right: Voice Recording & Send Controls */}
							<div className='gz-composer-right-actions'>
								<button
									type='button'
									className='gz-emp-composer-action-btn'
									title='Record voice message'
									onClick={handleStartRecording}>
									<FontAwesomeIcon icon={faMicrophone} style={{ fontSize: '16px' }} />
								</button>

								<button
									className='gz-emp-send-btn'
									type='button'
									title='Send Message'
									onClick={handleSendMessage}>
									<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '16px' }} />
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export { EmployeeChatInner }
