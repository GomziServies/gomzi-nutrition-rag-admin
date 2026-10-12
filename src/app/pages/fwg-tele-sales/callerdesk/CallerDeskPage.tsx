/**
 * FWG Tele-Sales — Caller Desk Page
 * Shows only FWG deskphone (08069247707) call logs.
 */
import { FC } from 'react'
import CallerDeskCallLogs from '../../master/callerdesk/CallerDeskCallLogs'

const FWG_DESKPHONE = '08069247707'

const FwgCallerDeskPage: FC = () => {
	return (
		<div>
			<CallerDeskCallLogs defaultDeskphone={FWG_DESKPHONE} />
		</div>
	)
}

export default FwgCallerDeskPage
