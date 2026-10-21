import React, { FC } from 'react'
import { EmployeeChatInner } from '../../employee/chat/ChatInner'
import '../../employee/chat/employee-chat.css'
import './hr-chat.css'

type Props = {
	isDrawer?: boolean
}

type ChatInnerProps = {
	id?: string
	isChatHistory?: boolean
	userName?: string
}

/**
 * HRChatInner
 * Delegates to the unified EmployeeChatInner component to give HR Chat
 * the exact same rich WhatsApp-style UI (voice notes, real-time waveform,
 * message reactions, lightbox, file staging, emoji picker, doodle canvas).
 */
const HRChatInner: FC<Props & ChatInnerProps> = ({ id, isDrawer = false, userName }) => {
	return <EmployeeChatInner id={id} isDrawer={isDrawer} userName={userName} />
}

export { HRChatInner }
