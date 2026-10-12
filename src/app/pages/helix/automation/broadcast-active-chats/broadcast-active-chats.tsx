import React, { useEffect, useRef, useState } from 'react'
import { PageTitle } from '../../../../../_metronic/layout/core'
import {
	getWhatsAppChatHistory,
	getWhatsAppContactList,
	markWhatsAppMessagesAsRead,
	sendWhatsAppTextMessage,
	uploadFile,
} from '../../../../Functions/FGGroup/WhatsApp'
import './broadcast-active-chats.css'

// ==================== TYPES ====================
interface Contact {
	id: string
	name: string
	phone: string
	lastMessage: string
	lastMessageTime: string
	unreadCount: number
	isOnline: boolean
	avatar: string
	lastMessageType: 'sent' | 'received'
	profilePic?: string
	lastMessageStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

interface MediaAttachment {
	type: 'image' | 'video' | 'document' | 'audio'
	url: string
	fileName?: string
	fileSize?: number
	mimeType?: string
}

interface TemplateButton {
	type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY'
	text: string
	url?: string
	phoneNumber?: string
}

interface TemplateData {
	name: string
	headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
	headerText?: string
	headerMediaUrl?: string
	bodyText: string
	footerText?: string
	buttons?: TemplateButton[]
}

interface Message {
	id: string
	text: string
	timestamp: string
	fullTimestamp: string
	direction: 'incoming' | 'outgoing'
	messageType: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio' | 'button'
	status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
	mediaAttachment?: MediaAttachment
	templateData?: TemplateData
	isFirstInGroup?: boolean
	isLastInGroup?: boolean
	wamid?: string // WhatsApp Message ID for status tracking
	errorMessage?: string // Error message for failed messages
}

// ==================== EMOJI DATA ====================
const EMOJI_CATEGORIES = {
	Smileys: {
		icon: '😀',
		emojis: [
			'😀',
			'😃',
			'😄',
			'😁',
			'😅',
			'😂',
			'🤣',
			'😊',
			'😇',
			'🙂',
			'🙃',
			'😉',
			'😌',
			'😍',
			'🥰',
			'😘',
			'😗',
			'😙',
			'😚',
			'😋',
			'😛',
			'😜',
			'🤪',
			'😝',
			'🤑',
			'🤗',
			'🤭',
			'🤫',
			'🤔',
			'🤐',
			'🤨',
			'😐',
			'😑',
			'😶',
			'😏',
			'😒',
			'🙄',
			'😬',
			'🤥',
			'😔',
			'😪',
			'🤤',
			'😴',
			'😷',
			'🤒',
			'🤕',
			'🤢',
			'🤮',
			'🤧',
			'🥵',
			'🥶',
			'🥴',
			'😵',
			'🤯',
			'🤠',
			'🥳',
			'🥸',
			'😎',
			'🤓',
			'🧐',
			'😕',
			'😟',
			'🙁',
			'☹️',
			'😮',
			'😯',
			'😲',
			'😳',
			'🥺',
			'😦',
			'😧',
			'😨',
			'😰',
			'😥',
			'😢',
			'😭',
			'😱',
			'😖',
			'😣',
			'😞',
			'😓',
			'😩',
			'😫',
			'🥱',
			'😤',
			'😡',
			'😠',
			'🤬',
			'😈',
			'👿',
			'💀',
			'☠️',
			'💩',
			'🤡',
			'👹',
			'👺',
			'👻',
			'👽',
			'👾',
			'🤖',
			'😺',
			'😸',
			'😹',
			'😻',
			'😼',
			'😽',
			'🙀',
			'😿',
			'😾',
		],
	},
	Gestures: {
		icon: '👋',
		emojis: [
			'👋',
			'🤚',
			'🖐️',
			'✋',
			'🖖',
			'👌',
			'🤌',
			'🤏',
			'✌️',
			'🤞',
			'🤟',
			'🤘',
			'🤙',
			'👈',
			'👉',
			'👆',
			'🖕',
			'👇',
			'☝️',
			'👍',
			'👎',
			'✊',
			'👊',
			'🤛',
			'🤜',
			'👏',
			'🙌',
			'👐',
			'🤲',
			'🤝',
			'🙏',
			'✍️',
			'💅',
			'🤳',
			'💪',
			'🦾',
			'🦿',
			'🦵',
			'🦶',
			'👂',
			'🦻',
			'👃',
			'🧠',
			'🫀',
			'🫁',
			'🦷',
			'🦴',
			'👀',
			'👁️',
			'👅',
			'👄',
			'💋',
			'🩸',
		],
	},
	Hearts: {
		icon: '❤️',
		emojis: [
			'❤️',
			'🧡',
			'💛',
			'💚',
			'💙',
			'💜',
			'🖤',
			'🤍',
			'🤎',
			'💔',
			'❣️',
			'💕',
			'💞',
			'💓',
			'💗',
			'💖',
			'💘',
			'💝',
			'💟',
			'♥️',
			'💌',
			'💐',
			'🌹',
			'🥀',
			'🌷',
			'🌸',
			'💮',
			'🏵️',
			'🌻',
			'🌼',
		],
	},
	Celebrations: {
		icon: '🎉',
		emojis: [
			'🎉',
			'🎊',
			'🎈',
			'🎁',
			'🎀',
			'🎄',
			'🎃',
			'🎗️',
			'🎟️',
			'🎫',
			'🎖️',
			'🏆',
			'🏅',
			'🥇',
			'🥈',
			'🥉',
			'⚽',
			'🏀',
			'🏈',
			'⚾',
			'🥎',
			'🎾',
			'🏐',
			'🏉',
			'🥏',
			'🎱',
			'🪀',
			'🏓',
			'🏸',
			'🏒',
			'🏑',
			'🥍',
			'🏏',
			'🪃',
			'🥅',
			'⛳',
			'🪁',
			'🏹',
			'🎣',
			'🤿',
			'🥊',
			'🥋',
			'🎽',
			'🛹',
			'🛼',
			'🛷',
			'⛸️',
			'🥌',
			'🎿',
		],
	},
	Food: {
		icon: '🍕',
		emojis: [
			'🍕',
			'🍔',
			'🍟',
			'🌭',
			'🍿',
			'🧂',
			'🥓',
			'🥚',
			'🍳',
			'🧇',
			'🥞',
			'🧈',
			'🍞',
			'🥐',
			'🥖',
			'🥨',
			'🧀',
			'🥗',
			'🥙',
			'🥪',
			'🌮',
			'🌯',
			'🫔',
			'🥫',
			'🍝',
			'🍜',
			'🍲',
			'🍛',
			'🍣',
			'🍱',
			'🥟',
			'🦪',
			'🍤',
			'🍙',
			'🍚',
			'🍘',
			'🍥',
			'🥠',
			'🥮',
			'🍢',
			'🍡',
			'🍧',
			'🍨',
			'🍦',
			'🥧',
			'🧁',
			'🍰',
			'🎂',
			'🍮',
			'🍭',
			'🍬',
			'🍫',
			'🍩',
			'🍪',
			'🌰',
			'🥜',
			'🍯',
			'🥛',
			'🍼',
			'☕',
			'🫖',
			'🍵',
			'🧃',
			'🥤',
			'🧋',
			'🍶',
			'🍺',
			'🍻',
			'🥂',
			'🍷',
			'🥃',
			'🍸',
			'🍹',
			'🧉',
			'🍾',
			'🧊',
		],
	},
	Animals: {
		icon: '🐶',
		emojis: [
			'🐶',
			'🐱',
			'🐭',
			'🐹',
			'🐰',
			'🦊',
			'🐻',
			'🐼',
			'🐻‍❄️',
			'🐨',
			'🐯',
			'🦁',
			'🐮',
			'🐷',
			'🐽',
			'🐸',
			'🐵',
			'🙈',
			'🙉',
			'🙊',
			'🐒',
			'🐔',
			'🐧',
			'🐦',
			'🐤',
			'🐣',
			'🐥',
			'🦆',
			'🦅',
			'🦉',
			'🦇',
			'🐺',
			'🐗',
			'🐴',
			'🦄',
			'🐝',
			'🪱',
			'🐛',
			'🦋',
			'🐌',
			'🐞',
			'🐜',
			'🪰',
			'🪲',
			'🪳',
			'🦟',
			'🦗',
			'🕷️',
			'🕸️',
			'🦂',
			'🐢',
			'🐍',
			'🦎',
			'🦖',
			'🦕',
			'🐙',
			'🦑',
			'🦐',
			'🦞',
			'🦀',
			'🐡',
			'🐠',
			'🐟',
			'🐬',
			'🐳',
			'🐋',
			'🦈',
			'🐊',
			'🐅',
			'🐆',
			'🦓',
			'🦍',
			'🦧',
			'🦣',
			'🐘',
			'🦛',
			'🦏',
			'🐪',
			'🐫',
			'🦒',
		],
	},
	Travel: {
		icon: '✈️',
		emojis: [
			'✈️',
			'🛫',
			'🛬',
			'💺',
			'🚀',
			'🛸',
			'🚁',
			'🛶',
			'⛵',
			'🚤',
			'🛥️',
			'🛳️',
			'⛴️',
			'🚢',
			'🚗',
			'🚕',
			'🚙',
			'🚌',
			'🚎',
			'🏎️',
			'🚓',
			'🚑',
			'🚒',
			'🚐',
			'🛻',
			'🚚',
			'🚛',
			'🚜',
			'🏍️',
			'🛵',
			'🚲',
			'🛴',
			'🚏',
			'🛣️',
			'🛤️',
			'🛢️',
			'⛽',
			'🚨',
			'🚥',
			'🚦',
			'🚧',
			'⚓',
			'🗺️',
			'🗿',
			'🗽',
			'🗼',
			'🏰',
			'🏯',
			'🏟️',
			'🎡',
			'🎢',
			'🎠',
			'⛲',
			'⛱️',
			'🏖️',
			'🏝️',
			'🏜️',
			'🌋',
			'⛰️',
			'🏔️',
			'🗻',
			'🏕️',
			'⛺',
			'🛖',
		],
	},
	Objects: {
		icon: '💡',
		emojis: [
			'💡',
			'🔦',
			'🏮',
			'🪔',
			'📱',
			'📲',
			'💻',
			'🖥️',
			'🖨️',
			'⌨️',
			'🖱️',
			'🖲️',
			'💽',
			'💾',
			'💿',
			'📀',
			'🧮',
			'🎥',
			'🎞️',
			'📽️',
			'📺',
			'📷',
			'📸',
			'📹',
			'📼',
			'🔍',
			'🔎',
			'🕯️',
			'💰',
			'💴',
			'💵',
			'💶',
			'💷',
			'💸',
			'💳',
			'🧾',
			'💎',
			'⚖️',
			'🪜',
			'🧰',
			'🪛',
			'🔧',
			'🔨',
			'⚒️',
			'🛠️',
			'⛏️',
			'🪚',
			'🔩',
			'⚙️',
			'🪤',
			'🧱',
			'⛓️',
			'🧲',
			'🔫',
			'💣',
			'🧨',
			'🪓',
			'🔪',
			'🗡️',
			'⚔️',
			'🛡️',
			'🚬',
			'⚰️',
			'🪦',
		],
	},
	Symbols: {
		icon: '⚡',
		emojis: [
			'⚡',
			'🔥',
			'💥',
			'✨',
			'🌟',
			'⭐',
			'🌈',
			'☀️',
			'🌤️',
			'⛅',
			'🌥️',
			'☁️',
			'🌦️',
			'🌧️',
			'⛈️',
			'🌩️',
			'🌨️',
			'❄️',
			'☃️',
			'⛄',
			'🌬️',
			'💨',
			'🌪️',
			'🌫️',
			'🌊',
			'💧',
			'💦',
			'☔',
			'☂️',
			'🌀',
			'🌡️',
			'🔴',
			'🟠',
			'🟡',
			'🟢',
			'🔵',
			'🟣',
			'🟤',
			'⚫',
			'⚪',
			'🟥',
			'🟧',
			'🟨',
			'🟩',
			'🟦',
			'🟪',
			'🟫',
			'⬛',
			'⬜',
			'◼️',
			'◻️',
			'◾',
			'◽',
			'▪️',
			'▫️',
			'🔶',
			'🔷',
			'🔸',
			'🔹',
			'🔺',
			'🔻',
			'💠',
			'🔘',
			'🔳',
			'🔲',
			'🏁',
			'🚩',
			'🎌',
			'🏴',
			'🏳️',
			'✅',
			'❌',
			'❓',
			'❔',
			'❕',
			'❗',
			'⭕',
			'🛑',
			'⛔',
			'📛',
		],
	},
}

// ==================== NOTIFICATION SOUND ====================
const createNotificationSound = () => {
	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
		const oscillator = audioContext.createOscillator()
		const gainNode = audioContext.createGain()

		oscillator.connect(gainNode)
		gainNode.connect(audioContext.destination)

		oscillator.frequency.value = 800
		oscillator.type = 'sine'
		gainNode.gain.value = 0.3

		oscillator.start()
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
		oscillator.stop(audioContext.currentTime + 0.3)
	} catch (e) {
		console.log('Audio not supported')
	}
}

// ==================== ICONS ====================
const Icons = {
	search: (
		<svg viewBox='0 0 24 24'>
			<path d='M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z'></path>
		</svg>
	),
	menu: (
		<svg viewBox='0 0 24 24'>
			<path d='M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z'></path>
		</svg>
	),
	attachment: (
		<svg viewBox='0 0 24 24'>
			<path d='M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z'></path>
		</svg>
	),
	emoji: (
		<svg viewBox='0 0 24 24'>
			<path d='M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z'></path>
		</svg>
	),
	mic: (
		<svg viewBox='0 0 24 24'>
			<path d='M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z'></path>
		</svg>
	),
	send: (
		<svg viewBox='0 0 24 24'>
			<path d='M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z'></path>
		</svg>
	),
	singleCheck: (
		<svg viewBox='0 0 16 15'>
			<path d='M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z'></path>
		</svg>
	),
	doubleCheck: (
		<svg viewBox='0 0 16 15'>
			<path d='M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z'></path>
		</svg>
	),
	close: (
		<svg viewBox='0 0 24 24'>
			<path d='M19.1 4.9C15.2 1 8.8 1 4.9 4.9S1 15.2 4.9 19.1s10.2 3.9 14.1 0 4-10.3.1-14.2zm-4.3 11.3L12 13.4l-2.8 2.8-1.4-1.4 2.8-2.8-2.8-2.8 1.4-1.4 2.8 2.8 2.8-2.8 1.4 1.4-2.8 2.8 2.8 2.8-1.4 1.4z'></path>
		</svg>
	),
	document: (
		<svg viewBox='0 0 24 24'>
			<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'></path>
		</svg>
	),
	link: (
		<svg viewBox='0 0 24 24'>
			<path d='M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.43l-.47.47a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24.973.973 0 0 1 0-1.42z'></path>
		</svg>
	),
	phone: (
		<svg viewBox='0 0 24 24'>
			<path d='M19.44 13c-.22 0-.45-.07-.67-.12a9.44 9.44 0 0 1-1.31-.39 2 2 0 0 0-2.48 1l-.22.45a12.18 12.18 0 0 1-2.66-2 12.18 12.18 0 0 1-2-2.66l.42-.28a2 2 0 0 0 1-2.48 10.33 10.33 0 0 1-.39-1.31c-.05-.22-.09-.45-.12-.68a3 3 0 0 0-3-2.49h-3a3 3 0 0 0-3 3.41 19 19 0 0 0 16.52 16.46h.38a3 3 0 0 0 2-.76 3 3 0 0 0 1-2.25v-3a3 3 0 0 0-2.47-2.9z'></path>
		</svg>
	),
	reply: (
		<svg viewBox='0 0 24 24'>
			<path d='M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z'></path>
		</svg>
	),
	video: (
		<svg viewBox='0 0 24 24'>
			<path d='M15 8v8H5V8h10m1-2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4V7a1 1 0 0 0-1-1z'></path>
		</svg>
	),
	refresh: (
		<svg viewBox='0 0 24 24'>
			<path d='M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'></path>
		</svg>
	),
	image: (
		<svg viewBox='0 0 24 24'>
			<path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'></path>
		</svg>
	),
}

// ==================== EMOJI PICKER COMPONENT ====================
const EmojiPicker: React.FC<{
	onSelect: (emoji: string) => void
	onClose: () => void
}> = ({ onSelect, onClose }) => {
	const [searchQuery, setSearchQuery] = useState('')
	const [activeCategory, setActiveCategory] = useState<string>(Object.keys(EMOJI_CATEGORIES)[0])
	const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
		try {
			const saved = localStorage.getItem('recentEmojis')
			return saved ? JSON.parse(saved) : ['😀', '❤️', '👍', '😂', '🎉', '🔥', '💯', '✨']
		} catch {
			return ['😀', '❤️', '👍', '😂', '🎉', '🔥', '💯', '✨']
		}
	})
	const pickerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				onClose()
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [onClose])

	const handleEmojiSelect = (emoji: string) => {
		onSelect(emoji)
		const newRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 8)
		setRecentEmojis(newRecent)
		try {
			localStorage.setItem('recentEmojis', JSON.stringify(newRecent))
		} catch (e) {
			// ignore
		}
	}

	const filteredEmojis = searchQuery
		? Object.values(EMOJI_CATEGORIES)
				.flatMap((cat) => cat.emojis)
				.filter((emoji) => emoji.includes(searchQuery))
		: null

	return (
		<div
			className='wa-emoji-picker'
			ref={pickerRef}>
			<div className='wa-emoji-header'>
				<input
					type='text'
					className='wa-emoji-search'
					placeholder='Search emoji'
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					autoFocus
				/>
			</div>

			{!searchQuery && (
				<div className='wa-emoji-categories'>
					{Object.entries(EMOJI_CATEGORIES).map(([category, data]) => (
						<button
							key={category}
							className={`wa-emoji-category-btn ${activeCategory === category ? 'active' : ''}`}
							onClick={() => setActiveCategory(category)}
							title={category}>
							{data.icon}
						</button>
					))}
				</div>
			)}

			<div className='wa-emoji-content'>
				{filteredEmojis ? (
					<>
						<div className='wa-emoji-category-title'>Search Results ({filteredEmojis.length})</div>
						<div className='wa-emoji-grid'>
							{filteredEmojis.map((emoji, index) => (
								<button
									key={index}
									className='wa-emoji-btn'
									onClick={() => handleEmojiSelect(emoji)}>
									{emoji}
								</button>
							))}
						</div>
						{filteredEmojis.length === 0 && (
							<div style={{ textAlign: 'center', color: '#8696a0', padding: 20 }}>
								No emoji found
							</div>
						)}
					</>
				) : (
					Object.entries(EMOJI_CATEGORIES).map(([category, data]) => (
						<div
							key={category}
							style={{ display: activeCategory === category ? 'block' : 'none' }}>
							<div className='wa-emoji-category-title'>{category}</div>
							<div className='wa-emoji-grid'>
								{data.emojis.map((emoji, index) => (
									<button
										key={index}
										className='wa-emoji-btn'
										onClick={() => handleEmojiSelect(emoji)}>
										{emoji}
									</button>
								))}
							</div>
						</div>
					))
				)}
			</div>

			{recentEmojis.length > 0 && (
				<div className='wa-recent-emojis'>
					{recentEmojis.map((emoji, index) => (
						<button
							key={index}
							className='wa-recent-emoji'
							onClick={() => handleEmojiSelect(emoji)}
							title='Recently used'>
							{emoji}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

// ==================== MAIN COMPONENT ====================
const BroadcastActiveChats: React.FC = () => {
	const [loading, setLoading] = useState(true)
	const [messagesLoading, setMessagesLoading] = useState(false)
	const [sendingMessage, setSendingMessage] = useState(false)
	const [contacts, setContacts] = useState<Contact[]>([])
	const [activeContact, setActiveContact] = useState<Contact | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [messageInput, setMessageInput] = useState('')
	const [searchQuery, setSearchQuery] = useState('')
	const [activeFilter, setActiveFilter] = useState<'All' | 'Unread'>('All')
	const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
	const [showEmojiPicker, setShowEmojiPicker] = useState(false)
	const [newMessageToast, setNewMessageToast] = useState<{
		contactId: string
		name: string
	} | null>(null)

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
	const messagePollingRef = useRef<NodeJS.Timeout | null>(null)
	const activeContactRef = useRef<Contact | null>(null)
	const messagesRef = useRef<Message[]>([])
	const shouldAutoScrollRef = useRef<boolean>(true)

	// Keep refs in sync
	useEffect(() => {
		activeContactRef.current = activeContact
	}, [activeContact])

	useEffect(() => {
		messagesRef.current = messages
	}, [messages])

	// ========== EFFECTS ==========
	useEffect(() => {
		fetchContacts()
		startContactPolling()

		if ('Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission()
		}

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current)
			}
			if (messagePollingRef.current) {
				clearInterval(messagePollingRef.current)
			}
		}
	}, [])

	useEffect(() => {
		if (activeContact) {
			fetchMessages(activeContact.id)
			markAsRead(activeContact.id)

			// Start message status polling for active chat
			startMessageStatusPolling(activeContact.id)

			// Reset auto-scroll behavior when switching to a new contact
			// This ensures we scroll to bottom when opening a new chat
			shouldAutoScrollRef.current = true
		}

		// Update previous contact's last message status in contact list when switching
		return () => {
			if (messagePollingRef.current) {
				clearInterval(messagePollingRef.current)
			}

			// When leaving a chat, update the contact list with latest message status
			if (activeContact && messagesRef.current.length > 0) {
				const lastOutgoingMsg = [...messagesRef.current]
					.reverse()
					.find((m) => m.direction === 'outgoing')

				if (lastOutgoingMsg) {
					setContacts((prev) =>
						prev.map((c) =>
							c.id === activeContact.id && c.lastMessageType === 'sent'
								? {
										...c,
										lastMessage: getLastMessageText(lastOutgoingMsg),
										// @ts-ignore - adding custom field
										lastMessageStatus: lastOutgoingMsg.status,
								  }
								: c
						)
					)
				}
			}
		}
	}, [activeContact?.id])

	useEffect(() => {
		// Only auto-scroll if the user was already near the bottom or if it's a new message
		if (messagesContainerRef.current) {
			const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
			const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100 // 100px threshold

			if (isNearBottom) {
				// User was near bottom, so auto-scroll to keep them there
				shouldAutoScrollRef.current = true
				// Use setTimeout to ensure DOM has updated before scrolling
				setTimeout(() => scrollToBottom(), 0)
			} else {
				// User was scrolled up, maintain their position
				shouldAutoScrollRef.current = false
			}
		} else {
			// If container isn't ready, default to auto-scroll
			shouldAutoScrollRef.current = true
			setTimeout(() => scrollToBottom(), 0)
		}
	}, [messages])

	// ========== CONTACT POLLING ==========
	const startContactPolling = () => {
		pollingIntervalRef.current = setInterval(async () => {
			await checkForNewMessages()
		}, 3000)
	}

	// ========== NEW: MESSAGE STATUS POLLING ==========
	const startMessageStatusPolling = (waId: string) => {
		// Clear existing polling
		if (messagePollingRef.current) {
			clearInterval(messagePollingRef.current)
		}

		// Poll every 2 seconds for status updates
		messagePollingRef.current = setInterval(async () => {
			await checkMessageStatusUpdates(waId)
		}, 2000)
	}

	// ========== NEW: Check Message Status Updates ==========
	const checkMessageStatusUpdates = async (waId: string) => {
		try {
			const response = await getWhatsAppChatHistory(waId, { limit: 20 })

			if (response?.status === 200 && response?.data?.messages) {
				const serverMessages = response.data.messages

				setMessages((prevMessages) => {
					let hasUpdates = false

					const updatedMessages = prevMessages.map((msg, index) => {
						// Find corresponding message from server by timestamp (since API doesn't return message_id)
						const serverMsg = serverMessages.find((sm: any) => {
							// Match by timestamp and text/content
							const timeMatch =
								new Date(sm.timestamp).getTime() === new Date(msg.fullTimestamp).getTime()
							const textMatch = sm.text === msg.text
							const directionMatch = sm.direction === msg.direction
							return timeMatch && textMatch && directionMatch
						})

						if (serverMsg) {
							// For incoming messages, prefer admin_status if it's 'read'
							let newStatus = serverMsg.status
							if (serverMsg.direction === 'incoming' && serverMsg.admin_status === 'read') {
								newStatus = 'read'
							}

							if (newStatus !== msg.status) {
								hasUpdates = true
								return {
									...msg,
									status: newStatus,
								}
							}
						}
						return msg
					})

					// Also check for new incoming messages
					const lastMsgTime =
						prevMessages.length > 0
							? new Date(prevMessages[prevMessages.length - 1].fullTimestamp).getTime()
							: 0

					serverMessages.forEach((sm: any) => {
						const msgTime = new Date(sm.timestamp).getTime()
						// Check if message already exists by comparing timestamp and text
						const exists = prevMessages.some((m) => {
							const timeMatch = new Date(m.fullTimestamp).getTime() === msgTime
							const textMatch = m.text === sm.text
							return timeMatch && textMatch
						})

						if (!exists && sm.direction === 'incoming' && msgTime > lastMsgTime) {
							hasUpdates = true

							// Parse template if message_type is template
							let templateData: TemplateData | undefined
							if (sm.message_type === 'template') {
								templateData = parseTemplate(sm)
							}

							// Handle media messages - check for media URL
							let mediaAttachment: MediaAttachment | undefined
							let messageText = sm.text || ''

							if (['image', 'video', 'document', 'audio'].includes(sm.message_type)) {
								let mediaUrl = sm.text

								// If text is null, check for media field
								if (!mediaUrl) {
									if (sm.message_type === 'image' && sm.image?.link) {
										mediaUrl = sm.image.link
									} else if (sm.message_type === 'video' && sm.video?.link) {
										mediaUrl = sm.video.link
									} else if (sm.message_type === 'document' && sm.document?.link) {
										mediaUrl = sm.document.link
									} else if (sm.message_type === 'audio' && sm.audio?.link) {
										mediaUrl = sm.audio.link
									}
								}

								if (mediaUrl) {
									const fileName = mediaUrl.split('/').pop() || `${sm.message_type} file`
									mediaAttachment = {
										type: sm.message_type as any,
										url: mediaUrl,
										fileName,
									}
									messageText = ''
								}
							}

							// Since we're polling in active chat, immediately mark as 'read' for incoming messages
							// This ensures blue tick appears immediately when message arrives in active chat
							updatedMessages.push({
								id: `msg-${Date.now()}-${Math.random()}`,
								text: messageText,
								timestamp: formatTime(sm.timestamp),
								fullTimestamp: sm.timestamp,
								direction: 'incoming',
								messageType: sm.message_type,
								status: 'read', // Always mark as read since we're in active chat
								mediaAttachment,
								templateData,
								isFirstInGroup: true,
								isLastInGroup: true,
							})

							// Scroll to bottom when new incoming message arrives
							if (hasUpdates) {
								setTimeout(() => scrollToBottom(true), 0)
							}
						}
					})

					return hasUpdates ? updatedMessages : prevMessages
				})
			}
		} catch (error) {
			console.error('Error checking message status:', error)
		}
	}

	const checkForNewMessages = async () => {
		try {
			const response = await getWhatsAppContactList()

			if (response?.status === 200 && Array.isArray(response.data)) {
				const newContacts = response.data

				setContacts((prevContacts) => {
					let hasNewMessage = false
					let newMessageContact: Contact | null = null

					const updatedContacts = newContacts.map((c: any) => {
						const existingContact = prevContacts.find((pc) => pc.id === c.wa_id)
						const newUnreadCount = c.unread_count || 0
						const oldUnreadCount = existingContact?.unreadCount || 0

						if (newUnreadCount > oldUnreadCount) {
							hasNewMessage = true
							newMessageContact = {
								id: c.wa_id,
								name: c.user_name || c.wa_id,
								phone: c.wa_id,
								lastMessage: 'New message',
								lastMessageTime: c.last_message_at || c.conversation_start,
								unreadCount: newUnreadCount,
								isOnline: Boolean(c.is_active),
								avatar: getInitials(c.user_name || c.wa_id),
								lastMessageType: 'received',
							}
						}

						return {
							id: c.wa_id,
							name: c.user_name || c.wa_id,
							phone: c.wa_id,
							lastMessage: existingContact?.lastMessage || 'Click to view messages',
							lastMessageTime: c.last_message_at || c.conversation_start,
							unreadCount: newUnreadCount,
							isOnline: Boolean(c.is_active),
							avatar: getInitials(c.user_name || c.wa_id),
							lastMessageType: existingContact?.lastMessageType || 'received',
						}
					})

					updatedContacts.sort(
						(a: Contact, b: Contact) =>
							new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
					)

					if (hasNewMessage && newMessageContact) {
						const contact = newMessageContact as Contact
						const currentActiveContact = activeContactRef.current

						if (currentActiveContact && contact.id === currentActiveContact.id) {
							// Refresh messages for active chat and mark as read immediately
							fetchMessages(contact.id)
							markAsRead(contact.id)
						} else {
							playNotificationSound()
							showDesktopNotification(contact.name, 'New message received')
							setNewMessageToast({ contactId: contact.id, name: contact.name })
							setTimeout(() => setNewMessageToast(null), 4000)
						}
					}

					return updatedContacts
				})
			}
		} catch (error) {
			console.error('Error checking for new messages:', error)
		}
	}

	const playNotificationSound = () => {
		createNotificationSound()
	}

	const showDesktopNotification = (title: string, body: string) => {
		if ('Notification' in window && Notification.permission === 'granted') {
			new Notification(title, {
				body,
				icon: '/media/logos/whatsapp-icon.png',
			})
		}
	}

	// ========== HELPERS ==========
	const scrollToBottom = (force = false) => {
		if (messagesContainerRef.current && (force || shouldAutoScrollRef.current)) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
		}
	}

	const getInitials = (name: string): string => {
		if (!name) return '?'
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	}

	const formatTime = (timestamp: string): string => {
		if (!timestamp) return ''
		const date = new Date(timestamp)
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		})
	}

	const formatContactTime = (timestamp: string): string => {
		if (!timestamp) return ''

		const date = new Date(timestamp)
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		if (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		) {
			return date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			})
		}

		if (
			date.getDate() === yesterday.getDate() &&
			date.getMonth() === yesterday.getMonth() &&
			date.getFullYear() === yesterday.getFullYear()
		) {
			return 'Yesterday'
		}

		const diffTime = Math.abs(today.getTime() - date.getTime())
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays <= 7) {
			return date.toLocaleDateString('en-US', { weekday: 'short' })
		}

		if (date.getFullYear() === today.getFullYear()) {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
		}

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		})
	}

	const formatDate = (timestamp: string): string => {
		const date = new Date(timestamp)
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		if (date.toDateString() === today.toDateString()) return 'TODAY'
		if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY'

		return date
			.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
			})
			.toUpperCase()
	}

	const formatWhatsAppText = (text: string): string => {
		if (!text) return ''
		let formatted = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
		formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>')
		formatted = formatted.replace(/~([^~]+)~/g, '<del>$1</del>')
		return formatted
	}

	const getLastMessageText = (msg: Message): string => {
		if (msg.text) {
			return msg.text.length > 35 ? msg.text.substring(0, 35) + '...' : msg.text
		}

		if (msg.messageType === 'template') return 'Template message'
		if (msg.messageType === 'image') return 'Photo'
		if (msg.messageType === 'video') return 'Video'
		if (msg.messageType === 'audio') return 'Audio'
		if (msg.messageType === 'document') return 'Document'
		if (msg.messageType === 'button') return 'Button clicked'

		return 'Message'
	}

	// ========== TEMPLATE PARSING ==========
	const parseTemplate = (msg: any): TemplateData | undefined => {
		if (!msg.template?.raw_template?.components) return undefined

		const rawComponents = msg.template.raw_template.components
		const sentComponents = msg.template.components || []

		let headerType: TemplateData['headerType']
		let headerText: string | undefined
		let headerMediaUrl: string | undefined
		let bodyText = ''
		let footerText: string | undefined
		let buttons: TemplateButton[] = []

		rawComponents.forEach((comp: any) => {
			const type = comp.type?.toUpperCase()

			if (type === 'HEADER') {
				headerType = comp.format?.toUpperCase() as any
				if (comp.format === 'TEXT') headerText = comp.text
			} else if (type === 'BODY') {
				bodyText = comp.text || ''
			} else if (type === 'FOOTER') {
				footerText = comp.text
			} else if (type === 'BUTTONS') {
				buttons = (comp.buttons || []).map((btn: any) => ({
					type: btn.type,
					text: btn.text,
					url: btn.url,
					phoneNumber: btn.phone_number,
				}))
			}
		})

		sentComponents.forEach((comp: any) => {
			const compType = comp.type?.toLowerCase()

			if (compType === 'header') {
				comp.parameters?.forEach((param: any) => {
					if (param.type === 'text') {
						headerText = headerText?.replace(/\{\{1\}\}/, param.text) || param.text
					} else if (param.type === 'image') {
						headerMediaUrl = param.image?.link
						headerType = 'IMAGE'
					} else if (param.type === 'video') {
						headerMediaUrl = param.video?.link
						headerType = 'VIDEO'
					} else if (param.type === 'document') {
						headerMediaUrl = param.document?.link
						headerType = 'DOCUMENT'
					}
				})
			} else if (compType === 'body') {
				comp.parameters?.forEach((param: any, index: number) => {
					if (param.text) {
						bodyText = bodyText.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), param.text)
					}
				})
			}
		})

		return {
			name: msg.template.name,
			headerType,
			headerText,
			headerMediaUrl,
			bodyText,
			footerText,
			buttons,
		}
	}

	// ========== API CALLS ==========
	const fetchContacts = async () => {
		try {
			setLoading(true)
			const response = await getWhatsAppContactList()

			if (response?.status === 200 && Array.isArray(response.data)) {
				const contactList: Contact[] = response.data.map((c: any) => ({
					id: c.wa_id,
					name: c.user_name || c.wa_id,
					phone: c.wa_id,
					lastMessage: 'Click to view messages',
					lastMessageTime: c.last_message_at || c.conversation_start,
					unreadCount: c.unread_count || 0,
					isOnline: Boolean(c.is_active),
					avatar: getInitials(c.user_name || c.wa_id),
					lastMessageType: 'received',
				}))

				contactList.sort(
					(a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
				)
				setContacts(contactList)

				if (contactList.length && !activeContact) {
					setActiveContact(contactList[0])
				}
			}
		} catch (error) {
			console.error('Error fetching contacts:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchMessages = async (waId: string) => {
		try {
			setMessagesLoading(true)
			const response = await getWhatsAppChatHistory(waId, { limit: 50 })

			if (response?.status === 200 && response?.data?.messages) {
				const messageList: Message[] = response.data.messages.map((msg: any, index: number) => {
					let text = msg.text || ''
					let mediaAttachment: MediaAttachment | undefined
					let templateData: TemplateData | undefined
					let errorMessage: string | undefined

					if (msg.message_type === 'template') {
						templateData = parseTemplate(msg)
					}

					// Handle media messages - check for URL in text field OR media field
					if (['image', 'video', 'document', 'audio'].includes(msg.message_type)) {
						// Try to get media URL from text or media field
						let mediaUrl = msg.text

						// If text is null, check for media field (for incoming messages)
						if (!mediaUrl) {
							console.log('📸 Incoming media message detected:', msg.message_type)
							console.log('📸 Available fields:', Object.keys(msg))

							// Try different possible field names
							if (msg.message_type === 'image' && msg.image?.link) {
								mediaUrl = msg.image.link
							} else if (msg.message_type === 'video' && msg.video?.link) {
								mediaUrl = msg.video.link
							} else if (msg.message_type === 'document' && msg.document?.link) {
								mediaUrl = msg.document.link
							} else if (msg.message_type === 'audio' && msg.audio?.link) {
								mediaUrl = msg.audio.link
							} else if (msg.media_url) {
								mediaUrl = msg.media_url
							} else if (msg.attachment?.url) {
								mediaUrl = msg.attachment.url
							} else if (msg.url) {
								mediaUrl = msg.url
							}

							console.log('📸 Found media URL:', mediaUrl)
							console.log(
								'⚠️ If still null, incoming media might need separate API call or webhook!'
							)
						}

						if (mediaUrl) {
							const fileName = mediaUrl.split('/').pop() || `${msg.message_type} file`
							mediaAttachment = {
								type: msg.message_type as any,
								url: mediaUrl,
								fileName,
							}
							text = '' // Clear text when we have media
						} else {
							// No media URL found - show placeholder
							text = `📷 ${
								msg.message_type.charAt(0).toUpperCase() + msg.message_type.slice(1)
							} (Media URL not available)`
						}
					}

					// Handle error message for failed outgoing messages
					if (msg.direction === 'outgoing' && msg.status === 'failed') {
						errorMessage =
							msg.error?.title ||
							msg.error?.message ||
							msg.error?.description ||
							(typeof msg.error === 'string' ? msg.error : 'Failed to send message')
					}

					// For incoming messages, use admin_status if available, otherwise use status
					// This ensures that when admin has already read the message, it shows as 'read' immediately
					let messageStatus = msg.status
					if (msg.direction === 'incoming' && msg.admin_status === 'read') {
						messageStatus = 'read'
					}

					return {
						id: msg.message_id || `msg-${index}`,
						text,
						timestamp: formatTime(msg.timestamp),
						fullTimestamp: msg.timestamp || '',
						direction: msg.direction === 'incoming' ? 'incoming' : 'outgoing',
						messageType: msg.message_type,
						status: messageStatus,
						mediaAttachment,
						templateData,
						wamid: msg.wamid, // Store WhatsApp Message ID
						errorMessage, // Store error message if any
					}
				})

				// Mark first/last in group
				messageList.forEach((msg, i) => {
					const prev = messageList[i - 1]
					const next = messageList[i + 1]
					const sameDate = prev && formatDate(prev.fullTimestamp) === formatDate(msg.fullTimestamp)
					const sameDirPrev = prev && prev.direction === msg.direction && sameDate
					const sameDirNext =
						next &&
						next.direction === msg.direction &&
						formatDate(next.fullTimestamp) === formatDate(msg.fullTimestamp)

					msg.isFirstInGroup = !sameDirPrev
					msg.isLastInGroup = !sameDirNext
				})

				setMessages(messageList)

				// Update contact last message
				if (messageList.length > 0) {
					const lastMsg = messageList[messageList.length - 1]
					setContacts((prev) =>
						prev.map((c) =>
							c.id === waId
								? {
										...c,
										lastMessage: getLastMessageText(lastMsg),
										lastMessageType: lastMsg.direction === 'outgoing' ? 'sent' : 'received',
								  }
								: c
						)
					)
				}

				// Scroll to bottom after loading messages for a contact
				setTimeout(() => scrollToBottom(true), 0)
			}
		} catch (error) {
			console.error('Error fetching messages:', error)
		} finally {
			setMessagesLoading(false)
		}
	}

	const markAsRead = async (waId: string) => {
		try {
			await markWhatsAppMessagesAsRead({ wa_id: waId })

			// Update contacts unread count
			setContacts((prev) => prev.map((c) => (c.id === waId ? { ...c, unreadCount: 0 } : c)))

			// Immediately update all incoming messages to 'read' status in UI
			setMessages((prev) =>
				prev.map((msg) =>
					msg.direction === 'incoming' && msg.status !== 'read' ? { ...msg, status: 'read' } : msg
				)
			)
		} catch (error) {
			console.error('Error marking as read:', error)
		}
	}

	const handleSendMessage = async () => {
		if ((!messageInput.trim() && !selectedMedia) || !activeContact || sendingMessage) return

		const tempId = `temp-${Date.now()}`
		const now = new Date()

		// Optimistic update - add message immediately with 'sending' status
		const optimisticMessage: Message = {
			id: tempId,
			text:
				selectedMedia && ['image', 'video'].includes(selectedMedia.type.split('/')[0])
					? ''
					: messageInput || '',
			timestamp: formatTime(now.toISOString()),
			fullTimestamp: now.toISOString(),
			direction: 'outgoing',
			messageType: selectedMedia
				? selectedMedia.type.startsWith('image')
					? 'image'
					: selectedMedia.type.startsWith('video')
					? 'video'
					: selectedMedia.type.startsWith('audio')
					? 'audio'
					: 'document'
				: 'text',
			status: 'sending', // Start with sending status
			isFirstInGroup: true,
			isLastInGroup: true,
			...(selectedMedia && {
				mediaAttachment: {
					type: selectedMedia.type.startsWith('image')
						? 'image'
						: selectedMedia.type.startsWith('video')
						? 'video'
						: selectedMedia.type.startsWith('audio')
						? 'audio'
						: 'document',
					url: URL.createObjectURL(selectedMedia),
					fileName: selectedMedia.name,
					fileSize: selectedMedia.size,
				},
			}),
			errorMessage: undefined, // No error initially
		}

		// Add to messages immediately
		setMessages((prev) => [...prev, optimisticMessage])

		// Force scroll to bottom when sending a new message
		setTimeout(() => scrollToBottom(true), 0)

		const savedInput = messageInput
		const savedMedia = selectedMedia
		setMessageInput('')
		setSelectedMedia(null)
		setShowEmojiPicker(false)

		try {
			setSendingMessage(true)
			let response: FGGroupAPIResponse

			if (savedMedia) {
				const mediaUrl = await uploadFile(savedMedia)
				const mediaType = savedMedia.type.startsWith('image')
					? 'image'
					: savedMedia.type.startsWith('video')
					? 'video'
					: savedMedia.type.startsWith('audio')
					? 'audio'
					: 'document'

				response = await sendWhatsAppTextMessage({
					message: savedInput || savedMedia.name,
					phoneNumber: activeContact.id,
					mediaType,
					mediaLink: mediaUrl,
				})
			} else {
				response = await sendWhatsAppTextMessage({
					message: savedInput,
					phoneNumber: activeContact.id,
				})
			}

			if (response?.status === 200) {
				// Update message status to 'sent'
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === tempId
							? {
									...msg,
									id: response.data?.message_id || tempId,
									status: 'sent',
									wamid: response.data?.wamid,
							  }
							: msg
					)
				)

				// Update contact last message
				setContacts((prev) =>
					prev.map((c) =>
						c.id === activeContact.id
							? {
									...c,
									lastMessage: getLastMessageText(optimisticMessage),
									lastMessageTime: now.toISOString(),
									lastMessageType: 'sent',
							  }
							: c
					)
				)
			} else {
				// Mark as failed with error message
				const errorMessage =
					response?.data?.error?.title ||
					response?.data?.error?.message ||
					response?.message ||
					'Failed to send message'
				setMessages((prev) =>
					prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed', errorMessage } : msg))
				)
			}
		} catch (error: any) {
			console.error('Error sending message:', error)
			// Mark as failed with error message
			const errorMessage =
				error.response?.data?.error?.title ||
				error.response?.data?.error?.message ||
				error.message ||
				'Network error or server unavailable'
			setMessages((prev) =>
				prev.map((msg) => (msg.id === tempId ? { ...msg, status: 'failed', errorMessage } : msg))
			)
		} finally {
			setSendingMessage(false)
		}
	}

	const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			setSelectedMedia(file)
		}
	}

	const handleEmojiSelect = (emoji: string) => {
		setMessageInput((prev) => prev + emoji)
		inputRef.current?.focus()
	}

	const handleToastClick = () => {
		if (newMessageToast) {
			const contact = contacts.find((c) => c.id === newMessageToast.contactId)
			if (contact) {
				setActiveContact(contact)
			}
			setNewMessageToast(null)
		}
	}

	// ========== RENDER FUNCTIONS ==========
	const renderMessageStatus = (status?: string) => {
		if (!status) return null

		const statusClass =
			status === 'sending'
				? 'sending'
				: status === 'sent'
				? 'sent'
				: status === 'delivered' || status === 'accepted'
				? 'delivered'
				: status === 'read'
				? 'read'
				: 'sent'

		switch (status) {
			case 'sending':
				return <div className={`wa-message-status ${statusClass}`}>{Icons.singleCheck}</div>
			case 'sent':
				return <div className={`wa-message-status ${statusClass}`}>{Icons.singleCheck}</div>
			case 'delivered':
			case 'accepted':
				return <div className={`wa-message-status ${statusClass}`}>{Icons.doubleCheck}</div>
			case 'read':
				return <div className={`wa-message-status ${statusClass}`}>{Icons.doubleCheck}</div>
			case 'failed':
				return (
					<div
						className='wa-message-status'
						style={{ color: '#f44336' }}>
						<svg
							viewBox='0 0 24 24'
							width='16'
							height='16'
							fill='#f44336'>
							<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
						</svg>
					</div>
				)
			default:
				return <div className='wa-message-status sent'>{Icons.singleCheck}</div>
		}
	}

	// FIXED: Render status icon for chat list
	const renderChatListStatus = (status?: string) => {
		if (!status) return null

		if (status === 'failed') {
			return (
				<div
					className='wa-chat-status-icon'
					style={{ color: '#f44336' }}>
					<svg
						viewBox='0 0 24 24'
						width='14'
						height='14'
						fill='#f44336'>
						<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
					</svg>
				</div>
			)
		}

		const statusClass =
			status === 'sent'
				? 'sent'
				: status === 'delivered' || status === 'accepted'
				? 'delivered'
				: status === 'read'
				? 'read'
				: 'sent'

		return (
			<div className={`wa-chat-status-icon ${statusClass}`}>
				{status === 'sent' ? Icons.singleCheck : Icons.doubleCheck}
			</div>
		)
	}

	const renderTemplate = (template: TemplateData) => (
		<div className='wa-template-container'>
			{template.headerType === 'IMAGE' && template.headerMediaUrl && (
				<img
					src={template.headerMediaUrl}
					alt='Template'
					className='wa-template-header-image'
					onError={(e) => {
						;(e.target as HTMLImageElement).style.display = 'none'
					}}
				/>
			)}
			{template.headerType === 'VIDEO' && template.headerMediaUrl && (
				<video
					className='wa-template-header-image'
					controls
					preload='metadata'>
					<source src={template.headerMediaUrl} />
				</video>
			)}
			{template.headerType === 'DOCUMENT' && template.headerMediaUrl && (
				<a
					href={template.headerMediaUrl}
					target='_blank'
					rel='noopener noreferrer'
					className='wa-media-document'
					style={{ margin: 8 }}>
					<div className='wa-media-document-icon'>{Icons.document}</div>
					<div className='wa-media-document-info'>
						<div className='wa-media-document-name'>Document</div>
						<div className='wa-media-document-meta'>PDF • Click to download</div>
					</div>
				</a>
			)}
			{template.headerType === 'TEXT' && template.headerText && (
				<div className='wa-template-header-text'>{template.headerText}</div>
			)}

			<div
				className='wa-template-body'
				dangerouslySetInnerHTML={{ __html: formatWhatsAppText(template.bodyText) }}
			/>

			{template.footerText && <div className='wa-template-footer'>{template.footerText}</div>}

			{template.buttons && template.buttons.length > 0 && (
				<div className='wa-template-buttons'>
					{template.buttons.map((btn, index) => {
						if (btn.type === 'URL') {
							return (
								<a
									key={index}
									href={btn.url}
									target='_blank'
									rel='noopener noreferrer'
									className='wa-template-button'>
									{Icons.link}
									{btn.text}
								</a>
							)
						}
						if (btn.type === 'PHONE_NUMBER') {
							return (
								<a
									key={index}
									href={`tel:${btn.phoneNumber}`}
									className='wa-template-button'>
									{Icons.phone}
									{btn.text}
								</a>
							)
						}
						return (
							<div
								key={index}
								className='wa-template-button'>
								{Icons.reply}
								{btn.text}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)

	const renderMedia = (attachment: MediaAttachment) => {
		switch (attachment.type) {
			case 'image':
				return (
					<div className='wa-media-container'>
						<img
							src={attachment.url}
							alt='Image'
							className='wa-media-image'
							onError={(e) => {
								;(e.target as HTMLImageElement).src =
									'https://via.placeholder.com/300x200?text=Image+Not+Found'
							}}
						/>
					</div>
				)
			case 'video':
				return (
					<div className='wa-media-container'>
						<video
							className='wa-media-video'
							controls
							preload='metadata'>
							<source src={attachment.url} />
						</video>
					</div>
				)
			case 'audio':
				return (
					<div className='wa-media-container'>
						<audio
							className='wa-media-audio'
							controls>
							<source src={attachment.url} />
						</audio>
					</div>
				)
			case 'document':
				return (
					<a
						href={attachment.url}
						target='_blank'
						rel='noopener noreferrer'
						className='wa-media-document'>
						<div className='wa-media-document-icon'>{Icons.document}</div>
						<div className='wa-media-document-info'>
							<div className='wa-media-document-name'>{attachment.fileName}</div>
							<div className='wa-media-document-meta'>
								{attachment.fileSize
									? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`
									: 'Document'}
							</div>
						</div>
					</a>
				)
			default:
				return null
		}
	}

	const renderMessages = () => {
		if (messages.length === 0) {
			return (
				<div className='wa-loading'>
					<p className='wa-loading-text'>No messages yet</p>
				</div>
			)
		}

		let lastDate = ''

		return messages.map((message, index) => {
			const messageDate = formatDate(message.fullTimestamp)
			const showDateDivider = messageDate !== lastDate
			lastDate = messageDate

			const isNewMessage = index === messages.length - 1

			return (
				<React.Fragment key={message.id}>
					{showDateDivider && (
						<div className='wa-date-divider'>
							<span>{messageDate}</span>
						</div>
					)}

					<div className={`wa-message-row ${message.direction}`}>
						<div
							className={`wa-message-bubble ${message.direction} ${
								message.isFirstInGroup ? 'first-in-group' : ''
							} ${isNewMessage ? 'new-message' : ''}`}>
							{message.isFirstInGroup && (
								<div className={`wa-message-tail ${message.direction}`}>
									<svg
										viewBox='0 0 8 13'
										width='8'
										height='13'>
										{message.direction === 'outgoing' ? (
											<path
												opacity='.13'
												d='M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z'></path>
										) : (
											<path
												opacity='.13'
												d='M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z'></path>
										)}
										{message.direction === 'outgoing' ? (
											<path
												fill='currentColor'
												d='M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z'></path>
										) : (
											<path
												fill='currentColor'
												d='M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z'></path>
										)}
									</svg>
								</div>
							)}

							{message.messageType === 'template' && message.templateData && (
								<div style={{ marginBottom: 4 }}>{renderTemplate(message.templateData)}</div>
							)}

							{message.mediaAttachment && (
								<div style={{ marginBottom: 4 }}>{renderMedia(message.mediaAttachment)}</div>
							)}

							{message.messageType === 'button' && (
								<div className='wa-button-response'>
									{Icons.reply}
									<span>Button clicked</span>
								</div>
							)}

							<div className='wa-message-content'>
								{message.text && (
									<span
										className='wa-message-text'
										dangerouslySetInnerHTML={{ __html: formatWhatsAppText(message.text) }}
									/>
								)}

								<span className='wa-message-meta'>
									<span className='wa-message-time'>{message.timestamp}</span>
									{message.direction === 'outgoing' && renderMessageStatus(message.status)}
								</span>
							</div>

							{message.errorMessage && (
								<div className='wa-message-error'>
									<div className='wa-message-error-icon'>
										<svg viewBox='0 0 24 24'>
											<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
										</svg>
									</div>
									<div className='wa-message-error-text'>{message.errorMessage}</div>
								</div>
							)}
						</div>
					</div>
				</React.Fragment>
			)
		})
	}

	const filteredContacts = contacts.filter((contact) => {
		if (activeFilter === 'Unread' && contact.unreadCount === 0) return false
		if (searchQuery) {
			return (
				contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				contact.phone.includes(searchQuery)
			)
		}
		return true
	})

	const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0)

	// Get last message status for contact
	const getContactLastMessageStatus = (contactId: string): string | undefined => {
		const contact = contacts.find((c) => c.id === contactId)
		if (contact?.lastMessageType === 'sent') {
			// If this is the active contact, get status from current messages
			if (activeContact?.id === contactId && messages.length > 0) {
				const lastOutgoing = [...messages].reverse().find((m) => m.direction === 'outgoing')
				return lastOutgoing?.status
			}
			// For non-active contacts, use stored status from contact object
			// @ts-ignore - adding custom field to contact
			return contact.lastMessageStatus || 'sent'
		}
		return undefined
	}

	// ========== MAIN RENDER ==========
	return (
		<>
			{/* <style>{whatsappStyles}</style> */}
			<PageTitle breadcrumbs={[]}>WhatsApp Chat</PageTitle>

			<div className='wa-container'>
				{newMessageToast && (
					<div
						className='wa-new-message-toast'
						onClick={handleToastClick}>
						New message from {newMessageToast.name}
					</div>
				)}

				{/* ===== SIDEBAR ===== */}
				<div className='wa-sidebar'>
					<div className='wa-sidebar-header'>
						<div className='wa-sidebar-header-left'>
							<div
								className='wa-avatar'
								style={{ width: 40, height: 40, fontSize: 16 }}>
								WA
							</div>
							<div>
								<span style={{ color: '#e9edef', fontSize: 16, fontWeight: 500 }}>Chats</span>
								{totalUnread > 0 && (
									<span
										style={{
											marginLeft: 8,
											background: '#00a884',
											color: '#111b21',
											padding: '2px 8px',
											borderRadius: 12,
											fontSize: 12,
											fontWeight: 600,
										}}>
										{totalUnread}
									</span>
								)}
							</div>
						</div>
						<div className='wa-sidebar-header-right'>
							<button
								className='wa-icon-btn'
								onClick={fetchContacts}
								title='Refresh'>
								{Icons.refresh}
							</button>
							<button className='wa-icon-btn'>{Icons.menu}</button>
						</div>
					</div>

					<div className='wa-search-container'>
						<div className='wa-search-box'>
							{Icons.search}
							<input
								type='text'
								className='wa-search-input'
								placeholder='Search or start new chat'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					<div className='wa-filter-tabs'>
						<button
							className={`wa-filter-tab ${activeFilter === 'All' ? 'active' : ''}`}
							onClick={() => setActiveFilter('All')}>
							All
						</button>
						<button
							className={`wa-filter-tab ${activeFilter === 'Unread' ? 'active' : ''}`}
							onClick={() => setActiveFilter('Unread')}>
							Unread {totalUnread > 0 && `(${totalUnread})`}
						</button>
					</div>

					{/* FIXED: Chat List with proper alignment */}
					<div className='wa-chat-list'>
						{loading ? (
							<div className='wa-loading'>
								<div className='wa-spinner'></div>
								<p className='wa-loading-text'>Loading chats...</p>
							</div>
						) : filteredContacts.length === 0 ? (
							<div className='wa-loading'>
								<p className='wa-loading-text'>No chats found</p>
							</div>
						) : (
							filteredContacts.map((contact) => (
								<div
									key={contact.id}
									className={`wa-chat-item ${activeContact?.id === contact.id ? 'active' : ''} ${
										contact.unreadCount > 0 ? 'has-unread' : ''
									}`}
									onClick={() => setActiveContact(contact)}>
									{contact.unreadCount > 0 && <div className='wa-new-message-indicator' />}
									<div className='wa-avatar'>
										{contact.avatar}
										{contact.isOnline && <div className='wa-online-indicator' />}
									</div>
									<div className='wa-chat-info'>
										<div className='wa-chat-info-top'>
											<span className='wa-chat-name'>{contact.name}</span>
											<span className={`wa-chat-time ${contact.unreadCount > 0 ? 'unread' : ''}`}>
												{formatContactTime(contact.lastMessageTime)}
											</span>
										</div>
										<div className='wa-chat-info-bottom'>
											<span
												className={`wa-chat-last-msg ${contact.unreadCount > 0 ? 'unread' : ''}`}>
												{contact.lastMessageType === 'sent' &&
													renderChatListStatus(getContactLastMessageStatus(contact.id))}
												<span className='wa-chat-last-msg-text'>
													{contact.phone || 'Click to view messages'}
												</span>
											</span>
											{contact.unreadCount > 0 && (
												<span className='wa-unread-badge'>{contact.unreadCount}</span>
											)}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* ===== MAIN CHAT AREA ===== */}
				<div className='wa-main'>
					<div className='wa-main-bg'></div>

					{activeContact ? (
						<>
							<div className='wa-chat-header'>
								<div className='wa-chat-header-left'>
									<div className='wa-chat-header-avatar'>{activeContact.avatar}</div>
									<div className='wa-chat-header-info'>
										<h3>{activeContact.name}</h3>
										<span>{activeContact.phone}</span>
									</div>
								</div>
								<div className='wa-chat-header-right'>
									<button className='wa-icon-btn'>{Icons.video}</button>
									<button className='wa-icon-btn'>{Icons.search}</button>
									<button className='wa-icon-btn'>{Icons.menu}</button>
								</div>
							</div>

							<div
								className='wa-messages-container'
								ref={messagesContainerRef}
								onScroll={(e) => {
									const target = e.target as HTMLDivElement
									const { scrollTop, scrollHeight, clientHeight } = target
									const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100 // 100px threshold

									// Update the auto-scroll flag based on scroll position
									shouldAutoScrollRef.current = isNearBottom
								}}>
								{messagesLoading ? (
									<div className='wa-loading'>
										<div className='wa-spinner'></div>
										<p className='wa-loading-text'>Loading messages...</p>
									</div>
								) : (
									<>
										{renderMessages()}
										<div ref={messagesEndRef} />
									</>
								)}
							</div>

							{showEmojiPicker && (
								<EmojiPicker
									onSelect={handleEmojiSelect}
									onClose={() => setShowEmojiPicker(false)}
								/>
							)}

							<div className='wa-input-container'>
								<div className='wa-input-left'>
									<button
										className={`wa-icon-btn ${showEmojiPicker ? 'active' : ''}`}
										onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
										{Icons.emoji}
									</button>
									<button
										className='wa-icon-btn'
										onClick={() => fileInputRef.current?.click()}>
										{Icons.attachment}
									</button>
									<input
										type='file'
										ref={fileInputRef}
										style={{ display: 'none' }}
										accept='image/*,video/*,audio/*,.pdf,.doc,.docx'
										onChange={handleMediaSelect}
									/>
								</div>

								<div className='wa-input-box-wrapper'>
									{selectedMedia && (
										<div className='wa-media-preview'>
											{selectedMedia.type.startsWith('image') ? (
												<img
													src={URL.createObjectURL(selectedMedia)}
													alt='Preview'
													className='wa-media-preview-thumb'
												/>
											) : (
												<div className='wa-media-preview-icon'>
													{selectedMedia.type.startsWith('video')
														? Icons.video
														: selectedMedia.type.startsWith('audio')
														? Icons.mic
														: Icons.document}
												</div>
											)}
											<div className='wa-media-preview-info'>
												<div className='wa-media-preview-name'>{selectedMedia.name}</div>
												<div className='wa-media-preview-size'>
													{(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
												</div>
											</div>
											<button
												className='wa-media-preview-remove'
												onClick={() => setSelectedMedia(null)}>
												{Icons.close}
											</button>
										</div>
									)}

									<div className='wa-input-box'>
										<input
											ref={inputRef}
											type='text'
											className='wa-input-field'
											placeholder='Type a message'
											value={messageInput}
											onChange={(e) => setMessageInput(e.target.value)}
											onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
											onFocus={() => setShowEmojiPicker(false)}
										/>
									</div>
								</div>

								<button
									className='wa-send-btn'
									onClick={handleSendMessage}
									disabled={(!messageInput.trim() && !selectedMedia) || sendingMessage}>
									{sendingMessage ? (
										<div
											className='wa-spinner'
											style={{ width: 20, height: 20, borderWidth: 2 }}></div>
									) : (
										Icons.send
									)}
								</button>
							</div>
						</>
					) : (
						<div className='wa-empty-state'>
							<svg
								className='wa-empty-state-icon'
								viewBox='0 0 303 172'
								fill='none'>
								<path
									fillRule='evenodd'
									clipRule='evenodd'
									d='M229.565 160.229c32.647-10.984 57.366-41.988 53.825-86.81-5.381-68.1-71.025-84.503-111.479-64.477-32.665 16.175-86.566-6.148-116.755 21.934-33.304 30.987-31.263 80.244-12.65 109.652 26.81 42.349 117.667 45.157 187.059 19.701z'
									fill='#DAE5D8'></path>
								<rect
									x='69.52'
									y='48.52'
									width='145.96'
									height='94.96'
									rx='7.48'
									fill='#fff'
									stroke='#0DA884'
									strokeWidth='1.04'></rect>
								<rect
									x='81'
									y='64'
									width='30'
									height='4'
									rx='2'
									fill='#E9EFF3'></rect>
								<rect
									x='81'
									y='74'
									width='59'
									height='3'
									rx='1.5'
									fill='#E9EFF3'></rect>
								<rect
									x='81'
									y='82'
									width='50'
									height='3'
									rx='1.5'
									fill='#E9EFF3'></rect>
								<rect
									x='81'
									y='101'
									width='30'
									height='4'
									rx='2'
									fill='#E9EFF3'></rect>
								<rect
									x='81'
									y='111'
									width='59'
									height='3'
									rx='1.5'
									fill='#E9EFF3'></rect>
								<rect
									x='81'
									y='119'
									width='50'
									height='3'
									rx='1.5'
									fill='#E9EFF3'></rect>
								<path
									d='M170.5 92.5l15-10.5v21l-15-10.5z'
									fill='#0DA884'></path>
								<circle
									cx='195'
									cy='92'
									r='20'
									stroke='#0DA884'
									strokeWidth='2'
									fill='none'></circle>
							</svg>
							<h2>WhatsApp Web</h2>
							<p>
								Send and receive messages without keeping your phone online.
								<br />
								Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
							</p>
						</div>
					)}
				</div>
			</div>
		</>
	)
}

export default BroadcastActiveChats
