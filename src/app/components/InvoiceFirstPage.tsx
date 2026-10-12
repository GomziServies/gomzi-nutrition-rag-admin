import React from 'react'

interface InvoiceFirstPageProps {
	invoiceData: any
	dueAmount: string
	hasDiscount: boolean
	calculateTotalProductAmount: () => number
}

const InvoiceFirstPage: React.FC<InvoiceFirstPageProps> = ({
	invoiceData,
	dueAmount,
	hasDiscount,
	calculateTotalProductAmount,
}) => {
	const SummaryRow = ({ label, value }: { label: string; value: string }) => (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				marginBottom: '10px',
				fontSize: '13px',
			}}>
			<span>{label}</span>

			<strong>{value}</strong>
		</div>
	)

	const SummaryRowWhite = ({ label, value }: { label: string; value: string }) => (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				fontSize: '14px',
				fontWeight: 700,
			}}>
			<span>{label}</span>

			<span>{value}</span>
		</div>
	)

	const thStyle: React.CSSProperties = {
		padding: '12px',
		textAlign: 'center',
		fontWeight: 700,
		fontSize: '12px',
		borderBottom: '1px solid #ddd',
	}

	const tdStyle: React.CSSProperties = {
		padding: '12px',
		textAlign: 'center',
		borderBottom: '1px solid #eee',
		fontSize: '12px',
	}
	return (
		<div
			id='invoiceContent'
			style={{
				fontFamily: 'Arial, sans-serif',
				background: '#fff',
				color: '#222',
				padding: '0',
			}}>
			{/* ================= HEADER ================= */}

			{/* ================= COMPANY DETAILS ================= */}

			<div
				style={{
					border: '1px solid #d8d8d8',
					padding: '20px',
					background: '#fff',
				}}>
				<div className='row align-items-center'>
					<div className='col-8'>
						<h3
							style={{
								color: '#5b3127',
								fontSize: '22px',
								fontWeight: 700,
								marginBottom: '10px',
							}}>
							RAG STRENGTH & NUTRITION
						</h3>

						<div
							style={{
								fontSize: '13px',
								lineHeight: '24px',
								color: '#555',
							}}>
							<div>
								<strong>Address :</strong> G-23 Time Square, Gaurav Path Road, Nr. Galaxy Circle,
								Pal, Surat, Gujarat - 394510
							</div>

							<div>
								<strong>Phone :</strong> +91 98752 70200
							</div>

							<div>
								<strong>Email :</strong> info@ragnutrition.in
							</div>

							<div>
								<strong>GSTIN :</strong> 24ABOFR2172H1Z2
							</div>
						</div>
					</div>

					<div className='col-4 text-end'>
						<img
							src='/media/logos/rag-logo.webp'
							alt='Company Logo'
							style={{
								width: '170px',
								maxWidth: '100%',
							}}
						/>
					</div>
				</div>
			</div>

			{/* ================= CUSTOMER & INVOICE DETAILS ================= */}

			<div
				className='row'
				style={{
					margin: 0,
					marginTop: '10px',
					gap: '16px',
				}}>
				{/* Bill To */}

				<div
					className='col'
					style={{
						border: '1px solid #ddd',
						borderRadius: '8px',
						padding: 0,
						overflow: 'hidden',
						background: '#fff',
					}}>
					<div
						style={{
							background: '#5b3127',
							color: '#fff',
							padding: '5px 15px',
							fontWeight: 700,
							fontSize: '13px',
						}}>
						Bill To
					</div>

					<div
						style={{
							padding: '8px',
							fontSize: '13px',
							lineHeight: '24px',
						}}>
						<div>
							<strong>Name :</strong> {invoiceData.name || '-'}
						</div>

						<div>
							<strong>Email :</strong> {invoiceData.email || '-'}
						</div>

						<div>
							<strong>Phone :</strong> {invoiceData.mobile || '-'}
						</div>

						{invoiceData.gst_number && (
							<div>
								<strong>GST No :</strong> {invoiceData.gst_number}
							</div>
						)}

						{invoiceData.pan_number && (
							<div>
								<strong>PAN :</strong> {invoiceData.pan_number}
							</div>
						)}
					</div>
				</div>

				{/* Invoice Details */}

				<div
					className='col'
					style={{
						border: '1px solid #ddd',
						borderRadius: '8px',
						padding: 0,
						overflow: 'hidden',
						background: '#fff',
					}}>
					<div
						style={{
							background: '#5b3127',
							color: '#fff',
							padding: '5px 15px',
							fontWeight: 700,
							fontSize: '13px',
						}}>
						Invoice Details
					</div>

					<div
						style={{
							padding: '8px',
							fontSize: '13px',
							lineHeight: '24px',
						}}>
						<div>
							<strong>Invoice No :</strong> {invoiceData.invoice_number || '-'}
						</div>

						<div>
							<strong>Date :</strong> {invoiceData.date || '-'}
						</div>

						<div>
							<strong>Address :</strong>
							<br />

							{`${invoiceData.billing_address_line_1 || ''}${
								invoiceData.billing_address_line_1 &&
								(invoiceData.billing_city || invoiceData.billing_state)
									? ', '
									: ''
							}
							${invoiceData.billing_city || ''}
							${invoiceData.billing_city && invoiceData.billing_state ? ', ' : ''}
							${invoiceData.billing_state || ''}
							${invoiceData.billing_pin_code ? ` - ${invoiceData.billing_pin_code}` : ''}
							${invoiceData.billing_country ? `, ${invoiceData.billing_country}` : ''}`}
						</div>
					</div>
				</div>
			</div>
			{/* ================= PRODUCT TABLE ================= */}
			<div
				style={{
					marginTop: '10px',
					border: '1px solid #ddd',
					borderRadius: '8px',
					overflow: 'hidden',
					background: '#fff',
				}}>
				<div
					style={{
						background: '#5b3127',
						color: '#fff',
						padding: '12px 16px',
						fontSize: '13px',
						fontWeight: 700,
					}}>
					Product Details
				</div>

				<table
					style={{
						width: '100%',
						borderCollapse: 'collapse',
						fontSize: '12px',
					}}>
					<thead>
						<tr
							style={{
								background: '#f5f5f5',
								borderBottom: '2px solid #5b3127',
							}}>
							<th style={thStyle}>#</th>

							<th style={{ ...thStyle, textAlign: 'left' }}>Product</th>

							<th style={thStyle}>Weight</th>

							<th style={thStyle}>Rate</th>

							<th style={thStyle}>Qty</th>

							<th style={thStyle}>Amount</th>

							{invoiceData.gst !== '0' && <th style={thStyle}>GST</th>}

							{hasDiscount && <th style={thStyle}>Discount</th>}

							<th style={thStyle}>Total</th>
						</tr>
					</thead>

					<tbody>
						{invoiceData.items.length === 0 ? (
							<tr>
								<td
									colSpan={hasDiscount ? 9 : 8}
									style={{
										padding: '18px',
										textAlign: 'center',
										color: '#888',
									}}>
									No Products Found
								</td>
							</tr>
						) : (
							invoiceData.items.map((item: any, index: number) => (
								<tr
									key={index}
									style={{
										background: index % 2 === 0 ? '#ffffff' : '#fafafa',
									}}>
									<td style={tdStyle}>{index + 1}</td>

									<td
										style={{
											...tdStyle,
											textAlign: 'left',
											fontWeight: 600,
										}}>
										{item.item_name}
									</td>

									<td style={tdStyle}>
										{item.item_weight ? `${item.item_weight} ${item.item_weight_type || ''}` : '-'}
									</td>

									<td style={tdStyle}>₹ {item.amount}</td>

									<td style={tdStyle}>{item.quantity}</td>

									<td style={tdStyle}>
										₹ {(Number(item.amount) * Number(item.quantity)).toFixed(2)}
									</td>

									{invoiceData.gst !== '0' && (
										<td style={tdStyle}>{item.gst ? `${item.gst}%` : '-'}</td>
									)}

									{hasDiscount && (
										<td style={tdStyle}>{Number(item.discount) > 0 ? `${item.discount}%` : '-'}</td>
									)}

									<td
										style={{
											...tdStyle,
											fontWeight: 700,
											color: '#5b3127',
										}}>
										₹ {item.totalAmount}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{/* ================= BOTTOM SECTION ================= */}

			<div
				className='row'
				style={{
					marginTop: '10px',
					gap: '16px',
				}}>
				{/* ================= NOTES ================= */}

				<div
					className='col'
					style={{
						border: '1px solid #ddd',
						borderRadius: '8px',
						padding: 0,
						overflow: 'hidden',
						background: '#fff',
					}}>
					<div
						style={{
							background: '#5b3127',
							color: '#fff',
							padding: '10px 15px',
							fontWeight: 700,
							fontSize: '15px',
						}}>
						Notes
					</div>

					<div
						style={{
							padding: '15px',
							minHeight: '180px',
							fontSize: '13px',
							lineHeight: '24px',
							color: '#555',
						}}>
						{invoiceData.note || 'No additional notes.'}
					</div>
				</div>

				{/* ================= SUMMARY ================= */}

				<div
					className='col'
					style={{
						border: '1px solid #ddd',
						borderRadius: '8px',
						padding: 0,
						overflow: 'hidden',
						background: '#fff',
					}}>
					<div
						style={{
							background: '#5b3127',
							color: '#fff',
							padding: '10px 15px',
							fontWeight: 700,
							fontSize: '15px',
						}}>
						Invoice Summary
					</div>

					<div
						style={{
							padding: '15px',
							fontSize: '13px',
						}}>
						<SummaryRow
							label='Product Amount'
							value={`₹ ${calculateTotalProductAmount().toFixed(2)}`}
						/>

						<SummaryRow
							label='GST'
							value={`₹ ${invoiceData.items
								.reduce((sum: number, item: any) => {
									const amount = Number(item.amount) * Number(item.quantity)

									const gst = (amount * (Number(item.gst) || 0)) / 100

									return sum + gst
								}, 0)
								.toFixed(2)}`}
						/>

						{hasDiscount && (
							<SummaryRow
								label='Discount'
								value={`- ₹ ${invoiceData.discount}`}
							/>
						)}

						<hr />

						<div
							style={{
								background: '#5b3127',
								color: '#fff',
								padding: '12px',
								borderRadius: '6px',
								marginBottom: '10px',
							}}>
							<SummaryRowWhite
								label='Grand Total'
								value={`₹ ${invoiceData.net_amount}`}
							/>
						</div>

						<SummaryRow
							label='Paid Amount'
							value={`₹ ${invoiceData.paid_amount}`}
						/>

						<SummaryRow
							label='Due Amount'
							value={`₹ ${dueAmount}`}
						/>
					</div>
				</div>
			</div>

			{/* ================= SIGNATURE ================= */}

			<div
				style={{
					marginTop: '10px',
					border: '1px solid #ddd',
					borderRadius: '8px',
					padding: '20px',
					background: '#fff',
				}}>
				<div className='row align-items-end'>
					<div className='col-6'>
						<h5
							style={{
								color: '#5b3127',
								fontWeight: 700,
							}}>
							Authorized Signature
						</h5>

						<img
							src='/media/sign/chirag-pandey-sign.webp'
							alt='Signature'
							style={{
								width: '180px',
							}}
						/>

						<div
							style={{
								borderTop: '1px solid #999',
								width: '220px',
								paddingTop: '6px',
								fontSize: '13px',
							}}>
							RAG Strength & Nutrition
						</div>
					</div>

					<div
						className='col-6'
						style={{
							textAlign: 'right',
							color: '#666',
							fontSize: '13px',
						}}>
						This is a computer generated invoice.
						<br />
						No signature required.
					</div>
				</div>
			</div>

			{/* ================= PAYMENT DETAILS ================= */}

			<div
				style={{
					marginTop: '10px',
					border: '1px solid #ddd',
					borderRadius: '8px',
					overflow: 'hidden',
					background: '#fff',
				}}>
				<div
					style={{
						background: '#5b3127',
						color: '#fff',
						padding: '10px 15px',
						fontWeight: 700,
						fontSize: '15px',
					}}>
					Payment Details
				</div>

				<div
					className='row align-items-center'
					style={{
						padding: '20px',
					}}>
					<div className='col-4 text-center'>
						<img
							src='/media/gomzi-nutrition/rag-qr-code.png'
							alt='QR'
							style={{
								width: '150px',
								border: '1px solid #ddd',
								padding: '6px',
								borderRadius: '6px',
							}}
						/>
					</div>

					<div
						className='col-8'
						style={{
							fontSize: '13px',
							lineHeight: '28px',
						}}>
						<div>
							<strong>UPI ID :</strong>
							bom260101328874@mahb
						</div>

						<div>
							<strong>Account Name :</strong>
							RAG STRENGTH & NUTRITION
						</div>

						<div>
							<strong>Bank :</strong>
							Bank of Maharashtra
						</div>

						<div>
							<strong>Account No :</strong>
							60546752758
						</div>

						<div>
							<strong>IFSC :</strong>
							MAHB0002533
						</div>

						<div>
							<strong>Account Type :</strong>
							Current Account
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default InvoiceFirstPage
