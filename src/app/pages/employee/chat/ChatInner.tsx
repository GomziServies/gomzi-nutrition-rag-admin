import {
	faAngleDown,
	faAngleUp,
	faChevronDown,
	faChevronLeft,
	faChevronRight,
	faCloudUploadAlt,
	faCopy,
	faCrop,
	faDownload,
	faFileAlt,
	faFilePdf,
	faInfoCircle,
	faLink,
	faMagic,
	faMicrophone,
	faPaperclip,
	faPaperPlane,
	faPause,
	faPen,
	faPlay,
	faPlus,
	faReply,
	faSmile,
	faSquare,
	faTimes,
	faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Picker, { Categories, Emoji, EmojiStyle, SuggestionMode, Theme } from 'emoji-picker-react'
import rawEmojiData from 'emoji-picker-react/dist/data/emojis-en.json'
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
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
	userName?: string
}

interface ProfileData {
	_id: string
}

interface WaveformSample {
	id: number
	amp: number
}

interface StagedItem {
	id: string
	file: File
	previewUrl: string
	isImage: boolean
	isPdf: boolean
	fileName: string
	fileSizeStr: string
	caption: string
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

// Convert emoji char to unified hex for apple emoji component
const toUnifiedHex = (emoji: string) => {
	return Array.from(emoji)
		.map((char) => char.codePointAt(0)?.toString(16))
		.filter(Boolean)
		.join('-')
		.replace(/-fe0f$/, '')
}

// Enriched emoji data mapping: ensures category keywords (e.g. 'food', 'drink') match all food items
const ENRICHED_EMOJI_DATA: any = (() => {
	try {
		const data = JSON.parse(JSON.stringify(rawEmojiData))
		if (data?.emojis?.food_drink && Array.isArray(data.emojis.food_drink)) {
			data.emojis.food_drink.forEach((item: any) => {
				if (Array.isArray(item.n) && !item.n.includes('food')) {
					item.n.push('food')
				}
			})
		}
		return data
	} catch (e) {
		return undefined
	}
})()

// Helper to format file sizes
const formatFileSize = (bytes: number) => {
	if (!bytes || bytes === 0) return '0 B'
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

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
				<div className='d-flex flex-column flex-grow-1' style={{ minWidth: 0 }}>
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
	userName,
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

	// Drag & Drop and Staged Media state
	const [isDragging, setIsDragging] = useState(false)
	const dragCounterRef = useRef(0)
	// Staged Media state (WhatsApp Web Batch Staging)
	const [stagedFiles, setStagedFiles] = useState<StagedItem[]>([])
	const [activeStagedIndex, setActiveStagedIndex] = useState<number>(0)
	const [isUploadingStagedFile, setIsUploadingStagedFile] = useState(false)
	const [showStagedEmojiPicker, setShowStagedEmojiPicker] = useState(false)
	const stagedFileInputRef = useRef<HTMLInputElement | null>(null)

	// Context menu & reaction states
	const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null)
	const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null)
	const [isReactionExpanded, setIsReactionExpanded] = useState<boolean>(false)
	const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; maxHeight?: number } | null>(null)
	const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null)
	const activeAnchorRef = useRef<HTMLElement | null>(null)

	// In-app Lightbox image viewer modal (WhatsApp Web Style)
	const [activeLightbox, setActiveLightbox] = useState<{
		urls: string[]
		index: number
		time?: string
	} | null>(null)

	const [messageReactions, setMessageReactions] = useState<{ [msgId: string]: string }>({})
	const [replyMessage, setReplyMessage] = useState<any>(null)

	const calculateReactionPosition = (anchorEl: HTMLElement, isExpanded: boolean) => {
		const rect = anchorEl.getBoundingClientRect()
		const viewportWidth = window.innerWidth
		const viewportHeight = window.innerHeight

		const popupWidth = isExpanded ? 320 : 284
		const popupHeight = isExpanded ? 340 : 46

		// Header & Composer boundaries
		const headerEl = document.querySelector('.gz-emp-workspace-header')
		const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 72
		const composerEl = document.querySelector('.gz-emp-composer-bar')
		const composerTop = composerEl ? composerEl.getBoundingClientRect().top : viewportHeight - 74
		const safeBottom = Math.min(viewportHeight - 16, composerTop - 8)

		let top = 0

		if (isExpanded) {
			const spaceAbove = rect.top - headerBottom - 8
			const spaceBelow = safeBottom - rect.bottom - 8

			if (spaceAbove >= popupHeight) {
				// Sits cleanly above message bubble
				top = rect.top - popupHeight - 8
			} else if (spaceBelow >= popupHeight) {
				// Sits cleanly below message bubble
				top = rect.bottom + 8
			} else {
				// Fallback: anchor within safe canvas zone without stretching
				top = Math.max(headerBottom + 8, Math.min(rect.top - 60, safeBottom - popupHeight))
			}

			// Strict Viewport Safety Clamp: Ensure top + popupHeight never exceeds safeBottom or taskbar
			if (top + popupHeight > safeBottom) {
				top = safeBottom - popupHeight
			}
			top = Math.max(headerBottom + 8, top)
		} else {
			// Compact pill (46px height): prefer above, fallback to below
			const spaceAbove = rect.top - headerBottom - 8
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

		return { top, left, maxHeight: popupHeight }
	}

	const closeAllPopups = () => {
		setActiveReactionMenuId(null)
		setIsReactionExpanded(false)
		setActiveActionMenuId(null)
		setShowEmojiPicker(false)
		setShowStagedEmojiPicker(false)
		setPopupPosition(null)
		setActionMenuPosition(null)
		activeAnchorRef.current = null
		setActiveLightbox(null)
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
	const [recordingWaveform, setRecordingWaveform] = useState<WaveformSample[]>([])
	const sampleCounterRef = useRef(0)
	const visualizerAudioCtxRef = useRef<AudioContext | null>(null)
	const visualizerStreamRef = useRef<MediaStream | null>(null)
	const visualizerAnimFrameRef = useRef<number | null>(null)
	const waveformContainerRef = useRef<HTMLDivElement | null>(null)

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
					const sampleInterval = 75 // sample every 75ms for responsive rolling waveform

					const sampleAudio = () => {
						if (!isMounted) return

						// When paused, immediately freeze bar generation!
						if (!isPausedRef.current) {
							if (audioContext && audioContext.state === 'suspended') {
								audioContext.resume().catch(() => {})
							}

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
								const normalized = Math.max(0.12, Math.min(1.0, average / 90))

								const container = waveformContainerRef.current
								let contentWidth = 320
								if (container) {
									const rect = container.getBoundingClientRect()
									if (rect.width > 20) {
										contentWidth = rect.width - 20
									}
								}
								// Each bar is 3px width + 3px gap = 6px
								const maxBars = Math.max(15, Math.floor((contentWidth + 3) / 6))

								const newSample: WaveformSample = {
									id: sampleCounterRef.current++,
									amp: normalized,
								}

								setRecordingWaveform((prev) => {
									const next = [...prev, newSample]
									if (next.length > maxBars) {
										// Smooth left-to-right rolling: remove oldest from left, append new on right
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
			sampleCounterRef.current = 0
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
				const menuWidth = 236
				const menuHeight = 220

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

	// Robust Click Outside & Keyboard Navigation Handler (WhatsApp Web Style)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (activeLightbox) {
					setActiveLightbox(null)
				} else {
					closeAllPopups()
				}
			} else if (e.key === 'ArrowLeft' && activeLightbox && activeLightbox.urls.length > 1) {
				setActiveLightbox((prev) =>
					prev
						? {
								...prev,
								index: (prev.index - 1 + prev.urls.length) % prev.urls.length,
						  }
						: null
				)
			} else if (e.key === 'ArrowRight' && activeLightbox && activeLightbox.urls.length > 1) {
				setActiveLightbox((prev) =>
					prev
						? {
								...prev,
								index: (prev.index + 1) % prev.urls.length,
						  }
						: null
				)
			}
		}

		const handleMouseDownOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target) return

			// If clicked outside staged emoji picker and its toggle button, close staged emoji picker
			if (
				!target.closest('.gz-staged-emoji-picker-container') &&
				!target.closest('.gz-staged-emoji-toggle')
			) {
				setShowStagedEmojiPicker(false)
			}

			// If clicked inside any open popup, trigger button, or lightbox, DO NOT close
			if (
				target.closest('.gz-floating-reaction-container') ||
				target.closest('.gz-floating-action-menu') ||
				target.closest('.gz-composer-emoji-picker') ||
				target.closest('.gz-staged-emoji-picker-container') ||
				target.closest('.EmojiPickerReact') ||
				target.closest('.gz-msg-action-trigger') ||
				target.closest('.gz-msg-dropdown-trigger') ||
				target.closest('.gz-emp-composer-action-btn') ||
				target.closest('.gz-staged-emoji-toggle') ||
				target.closest('.gz-lightbox-header') ||
				target.closest('.gz-lightbox-body') ||
				target.closest('.gz-lightbox-filmstrip')
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
	}, [activeLightbox])

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

	const stageMultipleFiles = (files: FileList | File[]) => {
		const newItems: StagedItem[] = []
		Array.from(files).forEach((file) => {
			const isImage = file.type.startsWith('image/')
			const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
			const previewUrl = isImage ? URL.createObjectURL(file) : ''
			const fileSizeStr = formatFileSize(file.size)
			newItems.push({
				id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
				file,
				previewUrl,
				isImage,
				isPdf,
				fileName: file.name,
				fileSizeStr,
				caption: '',
			})
		})

		if (newItems.length > 0) {
			setStagedFiles((prev) => {
				const next = [...prev, ...newItems]
				setActiveStagedIndex(next.length - 1)
				return next
			})
			closeAllPopups()
		}
	}

	const cancelAllStagedFiles = () => {
		stagedFiles.forEach((item) => {
			if (item.previewUrl) {
				URL.revokeObjectURL(item.previewUrl)
			}
		})
		setStagedFiles([])
		setActiveStagedIndex(0)
		setIsUploadingStagedFile(false)
		setShowStagedEmojiPicker(false)
	}

	const removeStagedItem = (indexToRemove: number, e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation()
		}
		const itemToRemove = stagedFiles[indexToRemove]
		if (itemToRemove?.previewUrl) {
			URL.revokeObjectURL(itemToRemove.previewUrl)
		}

		setStagedFiles((prev) => {
			const next = prev.filter((_, idx) => idx !== indexToRemove)
			if (next.length === 0) {
				setActiveStagedIndex(0)
				setShowStagedEmojiPicker(false)
			} else if (activeStagedIndex >= next.length) {
				setActiveStagedIndex(next.length - 1)
			}
			return next
		})
	}

	const handleSendStagedFiles = async () => {
		if (stagedFiles.length === 0 || isUploadingStagedFile) return
		setIsUploadingStagedFile(true)
		try {
			const uploadedUrls: string[] = []
			for (const item of stagedFiles) {
				const uploadRes: any = await FileUploadToFGGroup([item.file], {
					directory: 'chat-document',
				})
				const uploadedUrl = uploadRes.data?.fileURLs?.[0]
				if (uploadedUrl) {
					uploadedUrls.push(uploadedUrl)
				}
			}

			if (uploadedUrls.length === 0) {
				toast.error('Failed to upload file(s)')
				setIsUploadingStagedFile(false)
				return
			}

			const allImages = stagedFiles.every((item) => item.isImage)
			const typeData = allImages ? 'image' : 'file'
			const captions = stagedFiles
				.map((item) => item.caption.trim())
				.filter(Boolean)
			const combinedCaption = captions.join('\n')

			const clientMsgId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
			const messageData = {
				_id: clientMsgId,
				message: combinedCaption,
				file_url: uploadedUrls[0],
				files: uploadedUrls,
				type: typeData,
				from: adminID,
				to: id,
				createdAt: new Date().toISOString(),
			}

			socket?.emit('SendEmployeeMessage', messageData)
			setMessages((prev) => [...prev, messageData])
			setNewlySentMsgIds((prev) => new Set(prev).add(clientMsgId))

			toast.success(
				`${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'file' : 'photos'} sent!`
			)
			cancelAllStagedFiles()
			scrollToBottom()
		} catch (error) {
			console.error('Error sending staged files:', error)
			toast.error('Failed to send files')
		} finally {
			setIsUploadingStagedFile(false)
		}
	}

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounterRef.current += 1
		if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
			setIsDragging(true)
		}
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		e.dataTransfer.dropEffect = 'copy'
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounterRef.current -= 1
		if (dragCounterRef.current <= 0) {
			dragCounterRef.current = 0
			setIsDragging(false)
		}
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounterRef.current = 0
		setIsDragging(false)
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			stageMultipleFiles(e.dataTransfer.files)
		}
	}

	const handlePaste = (e: React.ClipboardEvent) => {
		if (e.clipboardData.files && e.clipboardData.files.length > 0) {
			stageMultipleFiles(e.clipboardData.files)
		}
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
			if (event.target.files.length > 0) {
				stageMultipleFiles(event.target.files)
				event.target.value = ''
			}
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
		const idsToDelete = new Set(msgId.split('-'))
		setMessages((prev) => prev.filter((m, i) => !idsToDelete.has(m._id || `msg-${i}`)))
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

	// Helper to group consecutive images or multi-file image messages into albums
	const groupMessagesWithAlbums = (rawMessages: any[]) => {
		const result: any[] = []
		let i = 0

		while (i < rawMessages.length) {
			const msg = rawMessages[i]
			const isImageMsg =
				msg.type === 'image' ||
				(msg.files && msg.files[0] && /\.(jpg|jpeg|png|webp|gif)$/i.test(msg.files[0]))

			// Case 1: Message itself contains multiple images in files array
			if (isImageMsg && msg.files && msg.files.length > 1) {
				result.push({
					...msg,
					isAlbum: true,
					albumUrls: msg.files,
				})
				i++
				continue
			}

			// Case 2: Consecutive single-image messages from same sender within 2 minutes
			if (isImageMsg) {
				const albumGroup = [msg]
				let j = i + 1
				while (j < rawMessages.length) {
					const nextMsg = rawMessages[j]
					const isNextImage =
						nextMsg.type === 'image' ||
						(nextMsg.files && nextMsg.files[0] && /\.(jpg|jpeg|png|webp|gif)$/i.test(nextMsg.files[0]))

					if (
						isNextImage &&
						nextMsg.from === msg.from &&
						Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) <= 120000
					) {
						albumGroup.push(nextMsg)
						j++
					} else {
						break
					}
				}

				if (albumGroup.length > 1) {
					const allUrls: string[] = []
					const captions: string[] = []
					albumGroup.forEach((m) => {
						if (m.files && m.files.length > 0) {
							allUrls.push(...m.files)
						} else if (m.file_url) {
							allUrls.push(m.file_url)
						}
						if (m.message && m.message.trim()) {
							captions.push(m.message.trim())
						}
					})

					result.push({
						...albumGroup[0],
						isAlbum: true,
						albumUrls: allUrls,
						message: captions.join('\n'),
						createdAt: albumGroup[albumGroup.length - 1].createdAt,
						_id: albumGroup.map((m) => m._id || `temp-${Math.random()}`).join('-'),
					})
					i = j
					continue
				}
			}

			result.push(msg)
			i++
		}

		return result
	}

	const groupedMessages = useMemo(() => groupMessagesWithAlbums(messages), [messages])

	const renderMessageContent = (message: any, isMe: boolean) => {
		const EMOJI_MATCH_REGEX = /([\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}]+)/gu

		const renderTextWithAppleEmojis = (content: string, isOnlyEmojis = false) => {
			const parts = content.split(EMOJI_MATCH_REGEX)
			return parts.map((part, index) => {
				if (part && EMOJI_MATCH_REGEX.test(part)) {
					const unified = toUnifiedHex(part)
					return (
						<span key={index} className='gz-inline-emoji-wrapper'>
							<Emoji unified={unified} size={isOnlyEmojis ? 26 : 20} emojiStyle={EmojiStyle.APPLE} />
						</span>
					)
				}
				return part
			})
		}

		// Multi-Image Album Grid check (WhatsApp style)
		const albumImages = message.isAlbum
			? message.albumUrls
			: message.files && message.files.length > 1
			? message.files
			: null

		if (albumImages && albumImages.length > 1) {
			const count = albumImages.length
			const gridClass =
				count === 2
					? 'is-count-2'
					: count === 3
					? 'is-count-3'
					: count === 4
					? 'is-count-4'
					: 'is-count-more'
			const displayedImgs = albumImages.slice(0, 4)
			const extraCount = count - 4
			const caption =
				message.message && typeof message.message === 'string'
					? message.message
					: ''

			const allFullUrls = albumImages.map((u: string) =>
				u.startsWith('http') ? u : `https://files.fggroup.in/${u}`
			)

			return (
				<div className='d-flex flex-column w-100'>
					<div className={`gz-media-album-grid ${gridClass}`}>
						{displayedImgs.map((img: string, idx: number) => {
							const isLastOverlay = idx === 3 && extraCount > 0
							const imgSrc = img.startsWith('http')
								? img
								: `https://files.fggroup.in/${img}`
							return (
								<div
									key={idx}
									className='gz-album-img-wrap'
									onClick={() =>
										setActiveLightbox({
											urls: allFullUrls,
											index: idx,
											time: DayJS(message.createdAt).format('h:mm A'),
										})
									}
									title='Click to view full image'>
									<img src={imgSrc} alt={`Album media ${idx + 1}`} />
									{isLastOverlay && (
										<div className='gz-album-more-overlay'>
											+{extraCount + 1}
										</div>
									)}
								</div>
							)
						})}
					</div>
					{caption && (
						<div className='gz-media-bubble-caption' style={{ marginTop: '4px' }}>
							{renderTextWithAppleEmojis(caption)}
						</div>
					)}
					<div
						className={
							isMe
								? 'gz-emp-bubble-time-sender'
								: 'gz-emp-bubble-time-receiver'
						}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</div>
				</div>
			)
		}

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
			const caption = message.message && typeof message.message === 'string' ? message.message : ''
			return (
				<div className='d-flex flex-column w-100'>
					<img
						src={imgSrc}
						alt='attachment'
						className='img-fluid rounded'
						style={{ maxHeight: '280px', width: '100%', objectFit: 'contain', cursor: 'pointer' }}
						onClick={() =>
							setActiveLightbox({
								urls: [imgSrc],
								index: 0,
								time: DayJS(message.createdAt).format('h:mm A'),
							})
						}
					/>
					{caption && (
						<div className='gz-media-bubble-caption'>
							{renderTextWithAppleEmojis(caption)}
						</div>
					)}
					<div className={isMe ? 'gz-emp-bubble-time-sender' : 'gz-emp-bubble-time-receiver'}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</div>
				</div>
			)
		}

		// File/Document message check
		if (
			message.type === 'file' ||
			(message.files && message.files[0] && !message.files[0].endsWith('.mp3')) ||
			message.file_url
		) {
			const fileSrc = message.file_url || `https://files.fggroup.in/` + message.files[0]
			const fileName = fileSrc.split('/').pop() || 'Document'
			const isPdf = /\.pdf$/i.test(fileName)
			const caption = message.message && typeof message.message === 'string' ? message.message : ''

			return (
				<div className='d-flex flex-column w-100'>
					<a
						href={fileSrc}
						target='_blank'
						rel='noopener noreferrer'
						className='gz-doc-bubble-card'>
						<div className={`gz-doc-bubble-icon ${isPdf ? 'is-pdf' : 'is-other'}`}>
							<FontAwesomeIcon icon={isPdf ? faFilePdf : faFileAlt} />
						</div>
						<div className='gz-doc-bubble-details'>
							<span className='gz-doc-bubble-name' title={fileName}>{fileName}</span>
							<span className='gz-doc-bubble-sub'>{isPdf ? 'PDF Document' : 'Attachment'}</span>
						</div>
						<div className='gz-doc-bubble-dl'>
							<FontAwesomeIcon icon={faDownload} />
						</div>
					</a>
					{caption && (
						<div className='gz-media-bubble-caption'>
							{renderTextWithAppleEmojis(caption)}
						</div>
					)}
					<div className={isMe ? 'gz-emp-bubble-time-sender' : 'gz-emp-bubble-time-receiver'}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</div>
				</div>
			)
		}

		// Text message fallback (works even if type is undefined/empty)
		const text = message.message || (typeof message === 'string' ? message : '')
		if (text) {
			const containsAlphabetic = (t: string) => /[a-zA-Z0-9]/.test(t)
			const isOnlyEmojis = !containsAlphabetic(text)

			return (
				<div className='gz-emp-msg-bubble-content'>
					<span
						className='gz-emp-msg-text'
						style={{
							fontSize: isOnlyEmojis ? '20px' : '14px',
							lineHeight: 1.45,
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}>
						{renderTextWithAppleEmojis(text, isOnlyEmojis)}
					</span>
					<span className={isMe ? 'gz-emp-bubble-time-sender' : 'gz-emp-bubble-time-receiver'}>
						<span>{DayJS(message.createdAt).format('h:mm A')}</span>
						{isMe && <span className='gz-emp-check-receipt'>✓✓</span>}
					</span>
				</div>
			)
		}

		return null
	}

	const handleOpenReaction = (e: React.MouseEvent, messageId: string) => {
		e.preventDefault()
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
		e.preventDefault()
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
		e.preventDefault()
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
		const menuWidth = 236
		const menuHeight = 220

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
		<div
			className='d-flex flex-column h-100 position-relative'
			style={{ height: 'calc(100vh - 72px)' }}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onPaste={handlePaste}>
			{/* Fullscreen Drag & Drop Overlay (WhatsApp Web Style) */}
			{isDragging && (
				<div className='gz-drag-drop-overlay'>
					<div className='gz-drag-drop-card'>
						<div className='gz-drag-drop-icon'>
							<FontAwesomeIcon icon={faCloudUploadAlt} />
						</div>
						<div className='gz-drag-drop-title'>Drop file here</div>
						<div className='gz-drag-drop-subtitle'>
							Send to {userName || 'contact'}
						</div>
					</div>
				</div>
			)}

			{/* WhatsApp Web Staged Media & Document Preview Modal */}
			{stagedFiles.length > 0 && (() => {
				const currentStaged = stagedFiles[activeStagedIndex] || stagedFiles[0]
				return (
					<div
						className='gz-staged-media-overlay'
						onDragOver={(e) => {
							e.preventDefault()
							e.stopPropagation()
							e.dataTransfer.dropEffect = 'copy'
						}}
						onDrop={(e) => {
							e.preventDefault()
							e.stopPropagation()
							if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
								stageMultipleFiles(e.dataTransfer.files)
							}
						}}>
						{/* Top Header Toolbar */}
						<div className='gz-staged-media-header'>
							<button
								type='button'
								className='gz-staged-header-btn'
								title='Close and discard (Esc)'
								onClick={cancelAllStagedFiles}>
								<FontAwesomeIcon icon={faTimes} />
							</button>

							{/* Center WhatsApp Media Editing Tools */}
							<div className='gz-staged-tools-center'>
								<button type='button' className='gz-staged-tool-btn' title='Crop and rotate'>
									<FontAwesomeIcon icon={faCrop} />
								</button>
								<button type='button' className='gz-staged-tool-btn' title='Filter'>
									<FontAwesomeIcon icon={faMagic} />
								</button>
								<button type='button' className='gz-staged-tool-btn' title='Draw'>
									<FontAwesomeIcon icon={faPen} />
								</button>
								<button
									type='button'
									className='gz-staged-tool-btn'
									title='Text'
									style={{ fontWeight: 700, fontSize: '15px' }}>
									Aa
								</button>
								<button type='button' className='gz-staged-tool-btn' title='Stickers'>
									<FontAwesomeIcon icon={faSquare} />
								</button>
								<button
									type='button'
									className='gz-staged-tool-btn'
									title='Emoji'
									onClick={() => setShowStagedEmojiPicker((prev) => !prev)}>
									<FontAwesomeIcon icon={faSmile} />
								</button>
								<button type='button' className='gz-staged-tool-btn' title='Quality'>
									<span className='gz-staged-tool-hd'>HD</span>
								</button>
							</div>

							{/* Right: Download Action */}
							{currentStaged && (
								<a
									href={currentStaged.previewUrl}
									download={currentStaged.fileName}
									className='gz-staged-header-btn'
									title='Download'>
									<FontAwesomeIcon icon={faDownload} />
								</a>
							)}
						</div>

						{/* Center Media / Document Body */}
						<div className='gz-staged-media-body'>
							{currentStaged?.isImage ? (
								<img
									src={currentStaged.previewUrl}
									alt={currentStaged.fileName}
									className='gz-staged-image-preview'
								/>
							) : (
								<div className='gz-staged-doc-card'>
									<div className={`gz-staged-doc-icon ${currentStaged?.isPdf ? 'is-pdf' : 'is-other'}`}>
										<FontAwesomeIcon icon={currentStaged?.isPdf ? faFilePdf : faFileAlt} />
									</div>
									<div className='gz-staged-file-name mb-1' style={{ fontSize: '16px', color: '#0f172a' }}>
										{currentStaged?.fileName}
									</div>
									<span className='badge bg-light-primary text-primary px-3 py-1 fs-7 fw-bold'>
										{currentStaged?.isPdf ? 'PDF Document' : 'Attachment'} · {currentStaged?.fileSizeStr}
									</span>
								</div>
							)}
						</div>

						{/* Bottom Wrapper: Emoji Picker + Capsule Input + Thumbnails + Floating Send Button */}
						<div className='gz-staged-bottom-wrapper'>
							{/* Clean Light Emoji Picker (Matching Chat Section) */}
							{showStagedEmojiPicker && (
								<div className='gz-staged-emoji-picker-container'>
									<Picker
										emojiStyle={EmojiStyle.APPLE}
										emojiData={ENRICHED_EMOJI_DATA}
										suggestedEmojisMode={SuggestionMode.RECENT}
										lazyLoadEmojis={true}
										searchDisabled={false}
										previewConfig={{ showPreview: false }}
										onEmojiClick={(emojiData) => {
											setStagedFiles((prev) =>
												prev.map((item, idx) =>
													idx === activeStagedIndex
														? { ...item, caption: (item.caption || '') + emojiData.emoji }
														: item
												)
											)
										}}
										width={340}
										height={380}
										style={{
											'--epr-bg-color': '#ffffff',
											'--epr-category-label-bg-color': '#ffffff',
											'--epr-picker-border-radius': '18px',
										} as React.CSSProperties}
									/>
								</div>
							)}

							{/* Caption Input Capsule ("Type a message") */}
							<div className='gz-staged-caption-capsule'>
								<input
									type='text'
									className='gz-staged-caption-input'
									placeholder='Add a caption...'
									value={currentStaged?.caption || ''}
									onChange={(e) => {
										const val = e.target.value
										setStagedFiles((prev) =>
											prev.map((item, idx) =>
												idx === activeStagedIndex ? { ...item, caption: val } : item
											)
										)
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault()
											handleSendStagedFiles()
										} else if (e.key === 'Escape') {
											cancelAllStagedFiles()
										}
									}}
									autoFocus
									style={{
										all: 'unset',
										flex: '1 1 auto',
										flexGrow: 1,
										display: 'block',
										background: 'transparent',
										border: '0px none transparent',
										outline: 'none',
										outlineOffset: '0px',
										boxShadow: 'none',
										WebkitBoxShadow: 'none',
										color: '#0f172a',
										fontSize: '15px',
										fontWeight: 500,
										padding: '0 8px',
										height: '100%',
										minHeight: 'unset',
										borderRadius: '0px',
										lineHeight: '44px',
										cursor: 'text',
										boxSizing: 'border-box',
									}}
								/>
								<button
									type='button'
									className='gz-staged-emoji-toggle'
									title='Add emoji'
									onClick={() => setShowStagedEmojiPicker((prev) => !prev)}>
									<FontAwesomeIcon icon={faSmile} />
								</button>
							</div>

							{/* Thumbnail Strip (WhatsApp Web Multi-Media Strip) */}
							<div className='gz-staged-thumbnails-row'>
								{stagedFiles.map((item, idx) => {
									const isActive = idx === activeStagedIndex
									return (
										<div
											key={item.id}
											className={`gz-staged-thumb-item ${isActive ? 'is-active' : ''}`}
											onClick={() => setActiveStagedIndex(idx)}
											title={item.fileName}>
											{item.isImage ? (
												<img src={item.previewUrl} alt={item.fileName} />
											) : (
												<div className='gz-staged-thumb-doc'>
													<FontAwesomeIcon icon={item.isPdf ? faFilePdf : faFileAlt} />
												</div>
											)}
											{stagedFiles.length > 1 && (
												<button
													type='button'
													className='gz-staged-thumb-remove-btn'
													title='Remove this file'
													onClick={(e) => removeStagedItem(idx, e)}>
													<FontAwesomeIcon icon={faTimes} />
												</button>
											)}
										</div>
									)
								})}
								<button
									type='button'
									className='gz-staged-thumb-add-btn'
									title='Add photos or documents'
									onClick={() => stagedFileInputRef.current?.click()}>
									<FontAwesomeIcon icon={faPlus} />
								</button>
								<input
									type='file'
									multiple
									ref={stagedFileInputRef}
									style={{ display: 'none' }}
									onChange={(e) => {
										if (e.target.files && e.target.files.length > 0) {
											stageMultipleFiles(e.target.files)
										}
										e.target.value = ''
									}}
								/>
							</div>

							{/* Floating Signature Green Send Button with Counter Badge */}
							<button
								type='button'
								className='gz-staged-whatsapp-send-btn'
								title={`Send ${stagedFiles.length} ${stagedFiles.length === 1 ? 'file' : 'files'} (Enter)`}
								disabled={isUploadingStagedFile}
								onClick={handleSendStagedFiles}>
								{isUploadingStagedFile ? (
									<div className='spinner-border spinner-border-sm text-dark' role='status' />
								) : (
									<>
										<FontAwesomeIcon icon={faPaperPlane} />
										{stagedFiles.length > 1 && (
											<span className='gz-staged-send-badge'>{stagedFiles.length}</span>
										)}
									</>
								)}
							</button>
						</div>
					</div>
				)
			})()}

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
								{groupedMessages.map((message: any, index: number, arr: any[]) => {
									const isMe = message.from === adminID
									const messageId = message._id || `msg-${index}`
									const messageContent = renderMessageContent(message, isMe)

									// Filter out any messages without renderable content to prevent ghost bubbles
									if (!messageContent) {
										return null
									}

									const isMedia = Boolean(
										message.isAlbum ||
										(message.files && message.files.length > 1) ||
										message.type === 'image' ||
										(message.files && message.files[0] && /\.(jpg|jpeg|png|webp|gif)$/i.test(message.files[0]))
									)

									const isFirstMessage =
										index === 0 ||
										formatDate(arr[index - 1].createdAt) !== formatDate(message.createdAt)

									const isReactionOpen = activeReactionMenuId === messageId
									const isActionOpen = activeActionMenuId === messageId
									const isNewMessage = newlySentMsgIds.has(messageId)

									return (
										<React.Fragment key={messageId}>
											{isFirstMessage && (
												<div className='text-center my-2'>
													<span className='gz-emp-date-pill'>
														{formatDate(message.createdAt)}
													</span>
												</div>
											)}

											<div
												className={`gz-message-row ${isMe ? 'is-sender' : 'is-receiver'} ${
													messageReactions[messageId] ? 'has-reaction' : ''
												}`}>
												{/* Hover target strictly wraps bubble content */}
												<div
													className={`gz-message-bubble-group ${
														isMe ? 'is-sender' : 'is-receiver'
													} ${isReactionOpen || isActionOpen ? 'has-active-menu' : ''}`}>
													{/* Hover Action Trigger (Reaction icon button beside bubble) */}
													<div className='gz-msg-hover-actions'>
														<button
															type='button'
															className='gz-msg-action-trigger'
															tabIndex={-1}
															title='React'
															onMouseDown={(e) => {
																e.preventDefault()
																e.stopPropagation()
															}}
															onClick={(e) => handleOpenReaction(e, messageId)}>
															<FontAwesomeIcon icon={faSmile} />
														</button>
													</div>

													{/* Message Bubble (Sized strictly to fit content) */}
													<div
														className={`${
															isMe
																? 'gz-emp-bubble-sender'
																: 'gz-emp-bubble-receiver'
														} ${isMedia ? 'is-media-bubble' : ''}`}>
														{/* Dropdown Options Button positioned at upper corner of bubble */}
														<button
															type='button'
															className={`gz-msg-dropdown-trigger ${
																isMe ? 'is-sender' : 'is-receiver'
															}`}
															tabIndex={-1}
															title='Options'
															onMouseDown={(e) => {
																e.preventDefault()
																e.stopPropagation()
															}}
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
																<Emoji
																	unified={toUnifiedHex(messageReactions[messageId])}
																	size={15}
																	emojiStyle={EmojiStyle.APPLE}
																/>
															</div>
														)}
													</div>
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
						width: isReactionExpanded ? '320px' : undefined,
						height: isReactionExpanded ? '340px' : undefined,
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
									onClick={() => handleReactionSelect(item.emoji)}>
									<Emoji unified={item.unified} size={22} emojiStyle={EmojiStyle.APPLE} />
								</button>
							))}
							<button
								type='button'
								className='gz-reaction-emoji-btn is-plus'
								onClick={handleExpandReaction}>
								+
							</button>
						</div>
					) : (
						<div className='gz-reaction-expanded-content'>
							<Picker
								onEmojiClick={(emojiData) => handleReactionSelect(emojiData.emoji)}
								width={320}
								height={340}
								previewConfig={{ showPreview: false }}
								searchPlaceholder='Search...'
								skinTonesDisabled={true}
								categories={CUSTOM_EMOJI_CATEGORIES}
								suggestedEmojisMode={SuggestionMode.RECENT}
								emojiStyle={EmojiStyle.APPLE}
								emojiData={ENRICHED_EMOJI_DATA}
								style={{
									'--epr-search-input-padding': '0 16px 0 44px',
									'--epr-search-input-border-radius': '9999px',
									'--epr-search-input-height': '40px',
									'--epr-search-input-bg-color': '#f1f5f9',
									'--epr-search-input-bg-color-active': '#ffffff',
									'--epr-search-border-color': '#e2e8f0',
									'--epr-search-border-color-active': '#cbd5e1',
									'--epr-highlight-color': '#172b4d',
									'--epr-search-input-placeholder-color': '#94a3b8',
									'--epr-search-bar-inner-padding': '15px',
									'--epr-header-padding': '12px 14px 8px 14px',
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
						const targetMsg =
							groupedMessages.find(
								(m: any, i: number) => (m._id || `msg-${i}`) === activeActionMenuId
							) ||
							messages.find(
								(m: any, i: number) => (m._id || `msg-${i}`) === activeActionMenuId
							)
						if (!targetMsg) return null
						const isTargetMe = targetMsg.from === adminID

						return (
							<>
								{/* Quick Reaction Strip at Top of Context Menu (WhatsApp Web Style) */}
								<div className='gz-ctx-reaction-strip'>
									{REACTION_EMOJIS.map((item) => (
										<button
											key={item.unified}
											type='button'
											className='gz-ctx-reaction-btn'
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()
												handleToggleReaction(activeActionMenuId, item.emoji)
												closeAllPopups()
											}}>
											<Emoji unified={item.unified} size={18} emojiStyle={EmojiStyle.APPLE} />
										</button>
									))}
									<button
										type='button'
										className='gz-ctx-reaction-btn is-plus'
										title='More reactions'
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											const groupEl = activeAnchorRef.current?.closest('.gz-message-bubble-group')
											const targetBubble = (groupEl?.querySelector('.gz-emp-bubble-sender, .gz-emp-bubble-receiver') || groupEl) as HTMLElement | null
											if (targetBubble) {
												activeAnchorRef.current = targetBubble
												const pos = calculateReactionPosition(targetBubble, true)
												setPopupPosition(pos)
												setIsReactionExpanded(true)
												setActiveReactionMenuId(activeActionMenuId)
												setActiveActionMenuId(null)
												setActionMenuPosition(null)
											}
										}}>
										+
									</button>
								</div>

								<div className='gz-ctx-divider' />

								<button
									type='button'
									className='gz-ctx-menu-item'
									onClick={() => handleReply(targetMsg)}>
									<FontAwesomeIcon icon={faReply} style={{ fontSize: '13px' }} />
									<span>Reply</span>
								</button>

								{(targetMsg.message || targetMsg.albumUrls) && (
									<button
										type='button'
										className='gz-ctx-menu-item'
										onClick={() =>
											handleCopy(
												targetMsg.message || targetMsg.albumUrls?.join('\n') || ''
											)
										}>
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
							skinTonesDisabled={true}
							categories={CUSTOM_EMOJI_CATEGORIES}
							suggestedEmojisMode={SuggestionMode.RECENT}
							emojiStyle={EmojiStyle.APPLE}
							emojiData={ENRICHED_EMOJI_DATA}
							style={{
								'--epr-search-input-padding': '0 16px 0 44px',
								'--epr-search-input-border-radius': '9999px',
								'--epr-search-input-height': '40px',
								'--epr-search-input-bg-color': '#f1f5f9',
								'--epr-search-input-bg-color-active': '#ffffff',
								'--epr-search-border-color': '#e2e8f0',
								'--epr-search-border-color-active': '#cbd5e1',
								'--epr-highlight-color': '#172b4d',
								'--epr-search-input-placeholder-color': '#94a3b8',
								'--epr-search-bar-inner-padding': '15px',
								'--epr-header-padding': '12px 14px 8px 14px',
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
							<div className='gz-recording-live-waveform' ref={waveformContainerRef}>
								{recordingWaveform.length > 0 ? (
									recordingWaveform.map((sample) => (
										<span
											key={sample.id}
											className={`gz-live-wave-bar ${isPaused ? 'is-paused' : ''}`}
											style={{
												height: `${Math.round(sample.amp * 24 + 4)}px`,
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
							<div className='gz-recording-controls'>
								<button
									type='button'
									className={`gz-recording-ctrl-btn ${isPaused ? 'is-paused-play' : ''}`}
									onClick={togglePauseResume}
									title={isPaused ? 'Resume recording' : 'Pause recording'}>
									<FontAwesomeIcon icon={isPaused ? faPlay : faPause} />
								</button>

								<button
									type='button'
									className='gz-recording-ctrl-btn is-cancel'
									onClick={handleCancelRecording}
									title='Cancel recording'>
									<FontAwesomeIcon icon={faTrash} />
								</button>

								<button
									type='button'
									className='gz-emp-send-btn'
									onClick={handleFinishAndSendRecording}
									title='Send voice message'>
									<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '15px' }} />
								</button>
							</div>
						</>
					) : (
						/* Regular WhatsApp Message Input Row (Strictly Matching WhatsApp Web Reference) */
						<>
							{/* Left Action Controls: Attachments (📎) & Emoji (😊) in WhatsApp Order */}
							<div className='gz-composer-left-actions'>
								<button
									type='button'
									className='gz-emp-composer-action-btn'
									title='Attach photos or documents'
									onClick={handleFileButtonClick}>
									<FontAwesomeIcon icon={faPaperclip} style={{ fontSize: '17px' }} />
								</button>

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
							</div>

							<input
								type='file'
								id='fileInput'
								multiple
								className='d-none'
								onChange={handleInputChange}
							/>

							{/* Center: Message Text Area */}
							<textarea
								className='gz-emp-composer-input'
								value={formData.message}
								name='message'
								onChange={handleMessagesChange}
								onKeyDown={(e: any) => handleEnterMessage(e)}
								placeholder='Type a message'
								rows={1}
							/>

							{/* Right: Dynamic WhatsApp Action - Microphone when empty, Send button when text is typed */}
							<div className='gz-composer-right-actions'>
								{formData.message.trim().length > 0 ? (
									<button
										className='gz-emp-send-btn'
										type='button'
										title='Send Message (Enter)'
										onClick={handleSendMessage}>
										<FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '15px' }} />
									</button>
								) : (
									<button
										type='button'
										className='gz-emp-composer-action-btn gz-mic-action-btn'
										title='Record voice message'
										onClick={handleStartRecording}>
										<FontAwesomeIcon icon={faMicrophone} style={{ fontSize: '17px' }} />
									</button>
								)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* WhatsApp-Style Fullscreen Lightbox Modal */}
			{activeLightbox && (
				<div
					className='gz-lightbox-backdrop'
					onClick={() => setActiveLightbox(null)}>
					<div className='gz-lightbox-header' onClick={(e) => e.stopPropagation()}>
						<div className='gz-lightbox-info'>
							<span className='gz-lightbox-title'>{userName || 'Photo'}</span>
							{activeLightbox.time && (
								<span className='gz-lightbox-sub'>{activeLightbox.time}</span>
							)}
						</div>
						<div className='gz-lightbox-counter'>
							{activeLightbox.urls.length > 1 &&
								`${activeLightbox.index + 1} of ${activeLightbox.urls.length}`}
						</div>
						<div className='gz-lightbox-actions'>
							<a
								href={activeLightbox.urls[activeLightbox.index]}
								download
								target='_blank'
								rel='noopener noreferrer'
								className='gz-lightbox-btn'
								title='Download photo'>
								<FontAwesomeIcon icon={faDownload} />
							</a>
							<button
								type='button'
								className='gz-lightbox-btn is-close'
								title='Close (Esc)'
								onClick={() => setActiveLightbox(null)}>
								<FontAwesomeIcon icon={faTimes} />
							</button>
						</div>
					</div>

					<div className='gz-lightbox-body' onClick={(e) => e.stopPropagation()}>
						{activeLightbox.urls.length > 1 && (
							<button
								type='button'
								className='gz-lightbox-nav-btn is-prev'
								title='Previous photo (Left arrow)'
								onClick={() =>
									setActiveLightbox((prev) =>
										prev
											? {
													...prev,
													index:
														(prev.index - 1 + prev.urls.length) %
														prev.urls.length,
											  }
											: null
									)
								}>
								<FontAwesomeIcon icon={faChevronLeft} />
							</button>
						)}

						<div className='gz-lightbox-image-wrap'>
							<img
								src={activeLightbox.urls[activeLightbox.index]}
								alt={`Photo ${activeLightbox.index + 1}`}
								className='gz-lightbox-img'
							/>
						</div>

						{activeLightbox.urls.length > 1 && (
							<button
								type='button'
								className='gz-lightbox-nav-btn is-next'
								title='Next photo (Right arrow)'
								onClick={() =>
									setActiveLightbox((prev) =>
										prev
											? {
													...prev,
													index: (prev.index + 1) % prev.urls.length,
											  }
											: null
									)
								}>
								<FontAwesomeIcon icon={faChevronRight} />
							</button>
						)}
					</div>

					{activeLightbox.urls.length > 1 && (
						<div
							className='gz-lightbox-filmstrip'
							onClick={(e) => e.stopPropagation()}>
							{activeLightbox.urls.map((url, i) => (
								<div
									key={i}
									className={`gz-lightbox-thumb ${
										i === activeLightbox.index ? 'is-active' : ''
									}`}
									onClick={() =>
										setActiveLightbox((prev) =>
											prev ? { ...prev, index: i } : null
										)
									}>
									<img src={url} alt={`Thumb ${i + 1}`} />
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export { EmployeeChatInner }
