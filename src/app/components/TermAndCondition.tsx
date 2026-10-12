import React from 'react'

function TermAndCondition() {
	const terms = [
		'Goods once sold will not be taken back or exchanged unless the product is damaged, defective, or incorrectly supplied by the company.',
		'Any claim regarding shortages, damages, or wrong products must be reported within 24 hours of receiving the goods.',
		'Courier, transportation, and delivery charges shall be borne by the customer only.',
		'Bulk and wholesale orders are processed specifically as per customer requirements; therefore, cancellation of confirmed orders may not be accepted.',
		'Advance payments made for special, bulk, or pre-booked orders are non-refundable.',
		'The customer is responsible for verifying the product name, quantity, flavor, batch number, and expiry date at the time of delivery.',
		'The company shall not be responsible for any delay caused by courier companies, transport agencies, natural disasters, strikes, or any circumstances beyond its control.',
		'Delivery charges, courier charges, or transportation charges, if applicable, shall be borne by the customer unless otherwise agreed in writing.',
		'Ownership of the goods remains with the company until full payment is received.',
		'Products sold are intended for personal consumption and resale only through legally permitted channels. The company shall not be responsible for misuse or unauthorized resale of products.',
		'Customers are advised to consult a qualified healthcare professional before consuming dietary supplements, especially if pregnant, nursing, under medication, or suffering from any medical condition.',
		'Invoices generated for bulk orders and retail purchases shall be deemed accepted if no discrepancy is reported within 24 hours of receipt.',
		'All disputes and claims are subject to Surat, Gujarat jurisdiction only.',
	]

	return (
		<div
			id='invoiceTermAndCondition'
			style={{
				pageBreakBefore: 'always',
				fontFamily: 'Arial, sans-serif',
				background: '#fff',
				color: '#222',
			}}>
			{/* Header */}
			<div
				style={{
					background: '#5b3127',
					color: '#fff',
					padding: '14px',
					textAlign: 'center',
					fontSize: '22px',
					fontWeight: 700,
					letterSpacing: '1px',
					borderRadius: '6px 6px 0 0',
				}}>
				TERMS & CONDITIONS
			</div>

			{/* Body */}
			<div
				style={{
					border: '2px solid #5b3127',
					borderTop: 'none',
					padding: '18px',
				}}>
				{terms.map((term, index) => (
					<div
						key={index}
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							padding: '10px 12px',
							background: index % 2 === 0 ? '#fafafa' : '#ffffff',
							borderBottom: index !== terms.length - 1 ? '1px solid #ececec' : 'none',
						}}>
						<div
							style={{
								minWidth: '28px',
								height: '28px',
								background: '#5b3127',
								color: '#fff',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '12px',
								fontWeight: 'bold',
								marginRight: '12px',
								marginTop: '2px',
							}}>
							{index + 1}
						</div>

						<div
							style={{
								fontSize: '12px',
								lineHeight: '20px',
								textAlign: 'justify',
							}}>
							{term}
						</div>
					</div>
				))}
				{/* Footer */}
				<div
					style={{
						marginTop: '25px',
						paddingTop: '15px',
						borderTop: '2px dashed #999',
						textAlign: 'center',
						fontSize: '12px',
						lineHeight: '22px',
					}}>
					<div
						style={{
							fontSize: '16px',
							fontWeight: 'bold',
							color: '#5b3127',
							marginBottom: '6px',
						}}>
						Thank You For Your Business!
					</div>
					<div
						style={{
							marginTop: '8px',
							fontStyle: 'italic',
							color: '#666',
						}}>
						"We Appreciate Your Trust & Look Forward To Serving You Again."
					</div>
				</div>
			</div>
		</div>
	)
}

export default TermAndCondition
