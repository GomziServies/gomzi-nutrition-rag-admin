/**
 * GN Tele-Sales — Caller Desk Page
 * Shows GLS deskphone (08069220266) call logs — as per user requirement.
 */
import { FC } from 'react'
import CallerDeskCallLogs from '../../master/callerdesk/CallerDeskCallLogs'

const GLS_DESKPHONE = '08069220266'

const GnCallerDeskPage: FC = () => {
	return (
		<div>
			<CallerDeskCallLogs defaultDeskphone={GLS_DESKPHONE} />
		</div>
	)
}

export default GnCallerDeskPage
