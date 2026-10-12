/**
 * FGIIT Tele-Sales — Caller Desk Page
 * Shows only FGIIT deskphone (08062985216) call logs and dashboard.
 */
import { FC } from 'react'
import CallerDeskCallLogs from '../../master/callerdesk/CallerDeskCallLogs'

const FGIIT_DESKPHONE = '08062985216'

const FgiitCallerDeskPage: FC = () => {
	return (
		<div>
			<CallerDeskCallLogs defaultDeskphone={FGIIT_DESKPHONE} />
		</div>
	)
}

export default FgiitCallerDeskPage
