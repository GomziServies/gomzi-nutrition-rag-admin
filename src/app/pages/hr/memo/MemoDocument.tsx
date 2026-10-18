import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React from 'react'

/**
 * Format date as dd/mm/yyyy (e.g. 17/10/2026)
 */
export const formatDateSimple = (dateVal: any): string => {
	if (!dateVal) return ''
	const date = new Date(dateVal)
	if (isNaN(date.getTime())) return String(dateVal)
	const day = String(date.getDate()).padStart(2, '0')
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const year = date.getFullYear()
	return `${day}/${month}/${year}`
}

/**
 * Format date in corporate long form with ordinal suffix (e.g. October 17th, 2026)
 */
export const formatDateLong = (dateVal: any): string => {
	const d = dateVal ? new Date(dateVal) : new Date()
	const date = isNaN(d.getTime()) ? new Date() : d
	const day = date.getDate()
	const nth = (n: number) => {
		if (n > 3 && n < 21) return 'th'
		switch (n % 10) {
			case 1:
				return 'st'
			case 2:
				return 'nd'
			case 3:
				return 'rd'
			default:
				return 'th'
		}
	}
	const month = date.toLocaleString('en-US', { month: 'long' })
	const year = date.getFullYear()
	return `${month} ${day}${nth(day)}, ${year}`
}

export interface MemoDocumentProps {
	employee: any
	memo: any
	adminName?: string
	className?: string
	style?: React.CSSProperties
	scaleToFit?: boolean
}

/**
 * Clean SVG geometric corner decorations matching the corporate letterhead
 */
const CornerTopLeft = () => (
	<svg
		width='110'
		height='120'
		viewBox='0 0 110 120'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
		{/* Secondary Navy Accent Ribbon */}
		<polygon points='64,0 80,0 0,120 0,96' fill='#24446B' />
		{/* Main Dark Navy Corner Wedge */}
		<polygon points='0,0 64,0 0,96' fill='#101F38' />
		{/* Subtle Light Border Line */}
		<line x1='80' y1='0' x2='0' y2='120' stroke='#DCE8F8' strokeWidth='1.5' />
	</svg>
)

const CornerTopRight = () => (
	<svg
		width='110'
		height='120'
		viewBox='0 0 110 120'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		style={{ position: 'absolute', top: 0, right: 0, pointerEvents: 'none', zIndex: 1 }}>
		{/* Secondary Navy Accent Ribbon */}
		<polygon points='46,0 30,0 110,120 110,96' fill='#24446B' />
		{/* Main Dark Navy Corner Wedge */}
		<polygon points='110,0 46,0 110,96' fill='#101F38' />
		{/* Subtle Light Border Line */}
		<line x1='30' y1='0' x2='110' y2='120' stroke='#DCE8F8' strokeWidth='1.5' />
	</svg>
)

const CornerBottomLeft = () => (
	<svg
		width='110'
		height='120'
		viewBox='0 0 110 120'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		style={{ position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
		{/* Secondary Navy Accent Ribbon */}
		<polygon points='64,120 80,120 0,0 0,24' fill='#24446B' />
		{/* Main Dark Navy Corner Wedge */}
		<polygon points='0,120 64,120 0,24' fill='#101F38' />
		{/* Subtle Light Border Line */}
		<line x1='80' y1='120' x2='0' y2='0' stroke='#DCE8F8' strokeWidth='1.5' />
	</svg>
)

const CornerBottomRight = () => (
	<svg
		width='110'
		height='120'
		viewBox='0 0 110 120'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		style={{ position: 'absolute', bottom: 0, right: 0, pointerEvents: 'none', zIndex: 1 }}>
		{/* Secondary Navy Accent Ribbon */}
		<polygon points='46,120 30,120 110,0 110,24' fill='#24446B' />
		{/* Main Dark Navy Corner Wedge */}
		<polygon points='110,120 46,120 110,24' fill='#101F38' />
		{/* Subtle Light Border Line */}
		<line x1='30' y1='120' x2='110' y2='0' stroke='#DCE8F8' strokeWidth='1.5' />
	</svg>
)

/**
 * Reusable Memo Letterhead Document Component
 */
export const MemoDocument = React.forwardRef<HTMLDivElement, MemoDocumentProps>(
	({ employee, memo, adminName, className = '', style = {} }, ref) => {
		const employeeName = employee?.full_name || employee?.name || 'Employee'
		const employeeCode =
			employee?.employee?.employee_code || employee?.employee_code || ''
		const employeePosition =
			employee?.employee?.position || employee?.position || ''
		const employeeAddress =
			employee?.address ||
			employee?.employee?.address ||
			(employeePosition ? `${employeePosition}${employeeCode ? ` • ID: ${employeeCode}` : ''}` : '')

		const memoSubject = String(memo?.subject || 'UNPLANNED / UNAUTHORIZED LEAVE').toUpperCase()
		const formattedDate = formatDateSimple(memo?.date)
		const memoLongDate = formatDateLong(memo?.created_date || memo?.date || new Date())
		const signatoryName = adminName || 'Chirag Bhayal'

		return (
			<div
				ref={ref}
				id='memoContent'
				className={`gz-memo-letterhead-sheet ${className}`}
				style={{
					width: '794px',
					height: '1123px',
					minHeight: '1123px',
					maxHeight: '1123px',
					backgroundColor: '#FFFFFF',
					boxSizing: 'border-box',
					position: 'relative',
					fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
					color: '#334155',
					lineHeight: '1.6',
					overflow: 'hidden',
					margin: '0 auto',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '42px 54px 34px 54px',
					...style,
				}}>
				{/* 4 Corner Geometric Decorations */}
				<CornerTopLeft />
				<CornerTopRight />
				<CornerBottomLeft />
				<CornerBottomRight />

				{/* Document Body Area */}
				<div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
					{/* Header: Logo (Top-Left) & Date (Top-Right) */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: '28px',
						}}>
						{/* Logo: original GOMZI Supplements asset */}
						<div style={{ maxWidth: '210px', paddingTop: '4px' }}>
							<img
								src='/media/logos/rag-logo.webp'
								alt='GOMZI Supplements'
								style={{
									width: '185px',
									height: 'auto',
									maxHeight: '64px',
									objectFit: 'contain',
									display: 'block',
								}}
								onError={(e: any) => {
									e.currentTarget.src = '/media/logos/rag-logo.jpeg'
								}}
							/>
						</div>

						{/* Memo Generation Date */}
						<div
							style={{
								fontSize: '13px',
								fontWeight: 650,
								color: '#172B4D',
								letterSpacing: '0.2px',
								textAlign: 'right',
								paddingTop: '16px',
							}}>
							{memoLongDate}
						</div>
					</div>

					{/* Employee Information Section */}
					<div style={{ marginBottom: '22px' }}>
						<div
							style={{
								fontSize: '12px',
								fontWeight: 800,
								color: '#172B4D',
								letterSpacing: '1px',
								marginBottom: '4px',
							}}>
							TO :
						</div>
						<div
							style={{
								fontSize: '15px',
								fontWeight: 700,
								color: '#172B4D',
								marginBottom: '2px',
							}}>
							{employeeName}
						</div>
						{employeeAddress && (
							<div
								style={{
									fontSize: '12.5px',
									color: '#64748B',
									lineHeight: '1.4',
								}}>
								{employeeAddress}
							</div>
						)}
					</div>

					{/* Salutation */}
					<div
						style={{
							fontSize: '13.5px',
							color: '#172B4D',
							marginBottom: '16px',
						}}>
						Dear <strong>{employeeName}</strong>,
					</div>

					{/* Subject */}
					<div
						style={{
							fontSize: '14px',
							fontWeight: 800,
							color: '#172B4D',
							letterSpacing: '0.4px',
							textTransform: 'uppercase',
							marginBottom: '16px',
						}}>
						SUBJECT: {memoSubject}
					</div>

					{/* Main Body Paragraphs */}
					<div
						style={{
							fontSize: '13px',
							color: '#334155',
							lineHeight: '1.65',
						}}>
						<p style={{ margin: '0 0 13px 0' }}>
							At <strong>FG Group</strong>, we value discipline, accountability and teamwork across
							every department.
						</p>

						<p style={{ margin: '0 0 13px 0' }}>
							This is to formally notify you regarding your{' '}
							<strong>unplanned / unauthorized leave</strong> taken on{' '}
							<strong>{formattedDate || 'the specified date'}</strong>, during which no prior
							approval or timely communication was provided to your Reporting Manager or the HR
							Department. Your absence has disrupted workflow and impacted team operations. As
							per company policy, prior approval is required for any leave except in genuine
							emergencies.
						</p>

						<p style={{ margin: '0 0 10px 0' }}>
							You are hereby instructed to submit a written explanation within{' '}
							<strong>24/48 hours</strong> of receiving this notice. Failure to provide a
							satisfactory explanation may result in disciplinary action as per company rules,
							which may include:
						</p>

						{/* Disciplinary Action Bullet List */}
						<ul
							style={{
								margin: '0 0 13px 0',
								paddingLeft: '18px',
								listStyleType: 'none',
							}}>
							<li
								style={{
									display: 'flex',
									alignItems: 'baseline',
									marginBottom: '7px',
									fontSize: '13px',
								}}>
								<span
									style={{
										width: '6px',
										height: '6px',
										borderRadius: '50%',
										backgroundColor: '#172B4D',
										display: 'inline-block',
										marginRight: '12px',
										flexShrink: 0,
									}}></span>
								<span>Deduction of salary for the unauthorized period of absence,</span>
							</li>
							<li
								style={{
									display: 'flex',
									alignItems: 'baseline',
									marginBottom: '7px',
									fontSize: '13px',
								}}>
								<span
									style={{
										width: '6px',
										height: '6px',
										borderRadius: '50%',
										backgroundColor: '#172B4D',
										display: 'inline-block',
										marginRight: '12px',
										flexShrink: 0,
									}}></span>
								<span>Issuance of a warning or show-cause notice,</span>
							</li>
							<li
								style={{
									display: 'flex',
									alignItems: 'baseline',
									marginBottom: '7px',
									fontSize: '13px',
								}}>
								<span
									style={{
										width: '6px',
										height: '6px',
										borderRadius: '50%',
										backgroundColor: '#172B4D',
										display: 'inline-block',
										marginRight: '12px',
										flexShrink: 0,
									}}></span>
								<span>Recording of misconduct in your employee file, and</span>
							</li>
							<li
								style={{
									display: 'flex',
									alignItems: 'baseline',
									marginBottom: '7px',
									fontSize: '13px',
								}}>
								<span
									style={{
										width: '6px',
										height: '6px',
										borderRadius: '50%',
										backgroundColor: '#172B4D',
										display: 'inline-block',
										marginRight: '12px',
										flexShrink: 0,
									}}></span>
								<span>Any further action as deemed appropriate under company policy.</span>
							</li>
						</ul>

						<p style={{ margin: '0 0 16px 0' }}>
							You are advised to ensure strict adherence to the leave policy henceforth to
							avoid further consequences.
						</p>
					</div>

					{/* Signature Section */}
					<div style={{ marginTop: 'auto', paddingTop: '10px' }}>
						<div style={{ fontSize: '13.5px', color: '#172B4D', marginBottom: '4px' }}>
							Sincerely,
						</div>
						{/* Navy Signature Underline */}
						<div
							style={{
								width: '140px',
								height: '1.5px',
								backgroundColor: '#172B4D',
								margin: '28px 0 10px 0',
							}}></div>
						<div
							style={{
								fontSize: '14px',
								fontWeight: 700,
								color: '#172B4D',
								margin: '0 0 2px 0',
							}}>
							{signatoryName}
						</div>
						<div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, margin: '0' }}>
							HR Manager
						</div>
						<div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, margin: '0' }}>
							FG Group
						</div>
					</div>
				</div>

				{/* Footer Section */}
				<div style={{ position: 'relative', zIndex: 2, marginTop: '20px' }}>
					{/* Horizontal Thin Navy Rule */}
					<div
						style={{
							width: '100%',
							height: '1.5px',
							backgroundColor: '#172B4D',
							marginBottom: '12px',
						}}></div>

					{/* 3 Evenly Spaced Columns with Circular Navy Icons */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							fontSize: '12px',
							fontWeight: 600,
							color: '#172B4D',
							padding: '0 8px',
						}}>
						{/* Phone */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
								<circle cx='12' cy='12' r='11' fill='#172B4D' />
								<path
									d='M7.5 9.5c0 3.5 3 6.5 6.5 6.5l1.5-1.5c.3-.3.8-.4 1.2-.2l2.3.9c.5.2.8.7.8 1.3v2c0 .8-.7 1.5-1.5 1.5C11.5 20 4 12.5 4 5.5 4 4.7 4.7 4 5.5 4h2c.6 0 1.1.3 1.3.8l.9 2.3c.2.4.1.9-.2 1.2L7.5 9.5z'
									fill='#FFFFFF'
									transform='scale(0.8) translate(3, 3)'
								/>
							</svg>
							<span>725-320-2997</span>
						</div>

						{/* Divider */}
						<div style={{ height: '16px', width: '1px', backgroundColor: '#DCE8F8' }}></div>

						{/* Email */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
								<circle cx='12' cy='12' r='11' fill='#172B4D' />
								<path
									d='M4 6h16c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1zm1 2v.5l7 4.5 7-4.5V8H5zm14 8V9.5l-7 4.5-7-4.5V16h14z'
									fill='#FFFFFF'
									transform='scale(0.8) translate(3, 3)'
								/>
							</svg>
							<span>info@fggroup.in</span>
						</div>

						{/* Divider */}
						<div style={{ height: '16px', width: '1px', backgroundColor: '#DCE8F8' }}></div>

						{/* Website */}
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
								<circle cx='12' cy='12' r='11' fill='#172B4D' />
								<path
									d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'
									fill='#FFFFFF'
									transform='scale(0.8) translate(3, 3)'
								/>
							</svg>
							<span>www.fggroup.in</span>
						</div>
					</div>
				</div>
			</div>
		)
	}
)

/**
 * Return self-contained HTML markup string for html2canvas rendering
 */
export const getMemoHtmlString = (
	employee: any,
	memo: any,
	adminName?: string
): string => {
	const employeeName = employee?.full_name || employee?.name || 'Employee'
	const employeeCode =
		employee?.employee?.employee_code || employee?.employee_code || ''
	const employeePosition =
		employee?.employee?.position || employee?.position || ''
	const employeeAddress =
		employee?.address ||
		employee?.employee?.address ||
		(employeePosition ? `${employeePosition}${employeeCode ? ` • ID: ${employeeCode}` : ''}` : '')

	const memoSubject = String(memo?.subject || 'UNPLANNED / UNAUTHORIZED LEAVE').toUpperCase()
	const formattedDate = formatDateSimple(memo?.date)
	const memoLongDate = formatDateLong(memo?.created_date || memo?.date || new Date())
	const signatoryName = adminName || 'Chirag Bhayal'

	return `
    <div style="width: 794px; height: 1123px; min-height: 1123px; max-height: 1123px; background-color: #FFFFFF; box-sizing: border-box; position: relative; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #334155; line-height: 1.6; overflow: hidden; margin: 0 auto; display: flex; flex-direction: column; justify-content: space-between; padding: 42px 54px 34px 54px;">
      <!-- Corner Top Left -->
      <svg width="110" height="120" viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 1;">
        <polygon points="64,0 80,0 0,120 0,96" fill="#24446B" />
        <polygon points="0,0 64,0 0,96" fill="#101F38" />
        <line x1="80" y1="0" x2="0" y2="120" stroke="#DCE8F8" stroke-width="1.5" />
      </svg>

      <!-- Corner Top Right -->
      <svg width="110" height="120" viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; right: 0; pointer-events: none; z-index: 1;">
        <polygon points="46,0 30,0 110,120 110,96" fill="#24446B" />
        <polygon points="110,0 46,0 110,96" fill="#101F38" />
        <line x1="30" y1="0" x2="110" y2="120" stroke="#DCE8F8" stroke-width="1.5" />
      </svg>

      <!-- Corner Bottom Left -->
      <svg width="110" height="120" viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; bottom: 0; left: 0; pointer-events: none; z-index: 1;">
        <polygon points="64,120 80,120 0,0 0,24" fill="#24446B" />
        <polygon points="0,120 64,120 0,24" fill="#101F38" />
        <line x1="80" y1="120" x2="0" y2="0" stroke="#DCE8F8" stroke-width="1.5" />
      </svg>

      <!-- Corner Bottom Right -->
      <svg width="110" height="120" viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; bottom: 0; right: 0; pointer-events: none; z-index: 1;">
        <polygon points="46,120 30,120 110,0 110,24" fill="#24446B" />
        <polygon points="110,120 46,120 110,24" fill="#101F38" />
        <line x1="30" y1="120" x2="110" y2="0" stroke="#DCE8F8" stroke-width="1.5" />
      </svg>

      <!-- Body Content Area -->
      <div style="position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
          <div style="max-width: 210px; padding-top: 4px;">
            <img src="/media/logos/rag-logo.webp" alt="GOMZI Supplements" style="width: 185px; height: auto; max-height: 64px; object-fit: contain; display: block;" onerror="this.src='/media/logos/rag-logo.jpeg'" />
          </div>
          <div style="font-size: 13px; font-weight: 650; color: #172B4D; letter-spacing: 0.2px; text-align: right; padding-top: 16px;">
            ${memoLongDate}
          </div>
        </div>

        <!-- Employee Info -->
        <div style="margin-bottom: 22px;">
          <div style="font-size: 12px; font-weight: 800; color: #172B4D; letter-spacing: 1px; margin-bottom: 4px;">TO :</div>
          <div style="font-size: 15px; font-weight: 700; color: #172B4D; margin-bottom: 2px;">${employeeName}</div>
          ${
						employeeAddress
							? `<div style="font-size: 12.5px; color: #64748B; line-height: 1.4;">${employeeAddress}</div>`
							: ''
					}
        </div>

        <!-- Greeting -->
        <div style="font-size: 13.5px; color: #172B4D; margin-bottom: 16px;">
          Dear <strong>${employeeName}</strong>,
        </div>

        <!-- Subject -->
        <div style="font-size: 14px; font-weight: 800; color: #172B4D; letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 16px;">
          SUBJECT: ${memoSubject}
        </div>

        <!-- Body Text -->
        <div style="font-size: 13px; color: #334155; line-height: 1.65;">
          <p style="margin: 0 0 13px 0;">
            At <strong>FG Group</strong>, we value discipline, accountability and teamwork across every department.
          </p>

          <p style="margin: 0 0 13px 0;">
            This is to formally notify you regarding your <strong>unplanned / unauthorized leave</strong> taken on <strong>${
							formattedDate || 'the specified date'
						}</strong>, during which no prior approval or timely communication was provided to your Reporting Manager or the HR Department. Your absence has disrupted workflow and impacted team operations. As per company policy, prior approval is required for any leave except in genuine emergencies.
          </p>

          <p style="margin: 0 0 10px 0;">
            You are hereby instructed to submit a written explanation within <strong>24/48 hours</strong> of receiving this notice. Failure to provide a satisfactory explanation may result in disciplinary action as per company rules, which may include:
          </p>

          <ul style="margin: 0 0 13px 0; padding-left: 18px; list-style-type: none;">
            <li style="display: flex; align-items: baseline; margin-bottom: 7px; font-size: 13px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #172B4D; display: inline-block; margin-right: 12px; flex-shrink: 0;"></span>
              <span>Deduction of salary for the unauthorized period of absence,</span>
            </li>
            <li style="display: flex; align-items: baseline; margin-bottom: 7px; font-size: 13px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #172B4D; display: inline-block; margin-right: 12px; flex-shrink: 0;"></span>
              <span>Issuance of a warning or show-cause notice,</span>
            </li>
            <li style="display: flex; align-items: baseline; margin-bottom: 7px; font-size: 13px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #172B4D; display: inline-block; margin-right: 12px; flex-shrink: 0;"></span>
              <span>Recording of misconduct in your employee file, and</span>
            </li>
            <li style="display: flex; align-items: baseline; margin-bottom: 7px; font-size: 13px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #172B4D; display: inline-block; margin-right: 12px; flex-shrink: 0;"></span>
              <span>Any further action as deemed appropriate under company policy.</span>
            </li>
          </ul>

          <p style="margin: 0 0 16px 0;">
            You are advised to ensure strict adherence to the leave policy henceforth to avoid further consequences.
          </p>
        </div>

        <!-- Signature -->
        <div style="margin-top: auto; padding-top: 10px;">
          <div style="font-size: 13.5px; color: #172B4D; margin-bottom: 4px;">Sincerely,</div>
          <div style="width: 140px; height: 1.5px; background-color: #172B4D; margin: 28px 0 10px 0;"></div>
          <div style="font-size: 14px; font-weight: 700; color: #172B4D; margin: 0 0 2px 0;">${signatoryName}</div>
          <div style="font-size: 12.5px; color: #64748B; font-weight: 500; margin: 0;">HR Manager</div>
          <div style="font-size: 12.5px; color: #64748B; font-weight: 500; margin: 0;">FG Group</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="position: relative; z-index: 2; margin-top: 20px;">
        <div style="width: 100%; height: 1.5px; background-color: #172B4D; margin-bottom: 12px;"></div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: #172B4D; padding: 0 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#172B4D" />
              <path d="M7.5 9.5c0 3.5 3 6.5 6.5 6.5l1.5-1.5c.3-.3.8-.4 1.2-.2l2.3.9c.5.2.8.7.8 1.3v2c0 .8-.7 1.5-1.5 1.5C11.5 20 4 12.5 4 5.5 4 4.7 4.7 4 5.5 4h2c.6 0 1.1.3 1.3.8l.9 2.3c.2.4.1.9-.2 1.2L7.5 9.5z" fill="#FFFFFF" transform="scale(0.8) translate(3, 3)" />
            </svg>
            <span>725-320-2997</span>
          </div>
          <div style="height: 16px; width: 1px; background-color: #DCE8F8;"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#172B4D" />
              <path d="M4 6h16c.6 0 1 .4 1 1v10c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1zm1 2v.5l7 4.5 7-4.5V8H5zm14 8V9.5l-7 4.5-7-4.5V16h14z" fill="#FFFFFF" transform="scale(0.8) translate(3, 3)" />
            </svg>
            <span>info@fggroup.in</span>
          </div>
          <div style="height: 16px; width: 1px; background-color: #DCE8F8;"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="#172B4D" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#FFFFFF" transform="scale(0.8) translate(3, 3)" />
            </svg>
            <span>www.fggroup.in</span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Robust, production-grade PDF generation with html2canvas and jsPDF
 */
export const generateMemoPdf = async (
	employee: any,
	memo: any,
	adminName?: string
): Promise<void> => {
	// Create temporary offscreen container
	const container = document.createElement('div')
	container.style.width = '794px'
	container.style.height = '1123px'
	container.style.position = 'fixed'
	container.style.left = '-9999px'
	container.style.top = '0'
	container.style.background = '#FFFFFF'
	container.style.zIndex = '-9999'
	container.style.boxSizing = 'border-box'
	container.style.margin = '0'
	container.style.padding = '0'
	container.style.overflow = 'hidden'

	container.innerHTML = getMemoHtmlString(employee, memo, adminName)
	document.body.appendChild(container)

	try {
		// Wait for logo image to load completely
		const img = container.querySelector('img')
		if (img && !img.complete) {
			await new Promise((resolve) => {
				img.onload = () => resolve(true)
				img.onerror = () => resolve(true)
				setTimeout(() => resolve(true), 1200)
			})
		}

		// Brief delay for web fonts and layout engine to paint
		await new Promise((resolve) => setTimeout(resolve, 80))

		const canvas = await html2canvas(container, {
			scale: 2, // High resolution (300 DPI equivalent)
			useCORS: true,
			logging: false,
			backgroundColor: '#FFFFFF',
			allowTaint: true,
			width: 794,
			height: 1123,
			windowWidth: 794,
			windowHeight: 1123,
			scrollX: 0,
			scrollY: 0,
		})

		const imgData = canvas.toDataURL('image/png')
		const pdf = new jsPDF('p', 'mm', 'a4')
		const pdfWidth = pdf.internal.pageSize.getWidth() // 210mm
		const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm

		pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

		const safeEmployeeName = (employee?.full_name || 'Employee').replace(/[\\/:*?"<>|]/g, '_')
		const safeDate = formatDateSimple(memo?.date).replace(/[\\/:*?"<>|]/g, '-')
		pdf.save(`Unplanned_Leave_Memo_${safeEmployeeName}_${safeDate || 'Notice'}.pdf`)
	} finally {
		if (container.parentNode) {
			container.parentNode.removeChild(container)
		}
	}
}
