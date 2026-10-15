import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageTitle } from '../../../../../_metronic/layout/core'
import { GetGnClient } from '../../../../Functions/FGGroup/GnClients'
import { GetGnProcurement } from '../../../../Functions/FGGroup/GnProcurement'

/* ✅ Type Definitions */
interface ProductItem {
	_id: string
	item_name: string
	item_weight: number
	item_weight_type: string
	quantity: number
}

interface IngredientItem {
	_id: string
	ingredient: string
	qty: number
	rate: number
	gst: number
	price: number
}

interface PackingItem {
	_id: string
	material: string
	qty: number
	rate: number
	gst: number
	price: number
}

interface ProcurementRecord {
	_id: string
	clientId: string
	orderAmount: number
	ingredientItems: IngredientItem[]
	packingItems: PackingItem[]
	transportation: number
	labour: number
	totalQty: number
	totalCost: number
	grossMargin: number
}

const GNProcurementView: React.FC = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const contentRef = useRef<HTMLDivElement>(null)

	const [record, setRecord] = useState<ProcurementRecord | null>(null)
	const [client, setClient] = useState<any>(null)
	const [loading, setLoading] = useState(true)

	// ✅ Get procurement_id from URL
	const procurementId = searchParams.get('procurement_id') || searchParams.get('id')

	useEffect(() => {
		if (procurementId) {
			fetchData(procurementId)
		} else {
			setLoading(false)
		}
	}, [procurementId])

	const fetchData = async (id: string) => {
		setLoading(true)
		try {
			const res = await GetGnProcurement({ id })
			if (res.data) {
				const procurementData = Array.isArray(res.data) ? res.data[0] : res.data
				setRecord(procurementData)

				// Fetch client details
				if (procurementData.clientId) {
					const clientRes = await GetGnClient({ id: procurementData.clientId })
					if (clientRes.data) {
						setClient(Array.isArray(clientRes.data) ? clientRes.data[0] : clientRes.data)
					}
				}
			}
		} catch (error: any) {
			toast.error('Failed to fetch procurement data')
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div
				style={{
					minHeight: '100vh',
					background: '#f5f5f5',
					padding: '20px',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}>
				<div
					className='spinner-border text-primary'
					role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		)
	}

	if (!record) {
		return (
			<div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
				<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
					<div
						style={{
							background: 'white',
							padding: '24px',
							borderRadius: '6px',
							textAlign: 'center',
						}}>
						<h2>No procurement record found</h2>
						<p className='text-muted mt-2'>Please select a client process from the Inventory Dashboard to view procurement records.</p>
						<button
							onClick={() => navigate('/rag/inventory')}
							className='btn btn-primary'
							style={{ marginTop: '20px' }}>
							Go to Inventory Dashboard
						</button>
					</div>
				</div>
			</div>
		)
	}

	const ingredientSubtotal =
		record.ingredientItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
	const packingSubtotal =
		record.packingItems?.reduce((sum, item) => sum + (item.price || 0), 0) || 0
	const totalQty = record.totalQty || 0
	const totalCost = record.totalCost || 0
	const grossMargin = record.grossMargin || 0
	const orderAmount = record.orderAmount || 0

	const handleGeneratePDF = async () => {
		if (!contentRef.current) return

		try {
			const canvas = await html2canvas(contentRef.current, {
				scale: 2,
				useCORS: true,
				logging: false,
				ignoreElements: (element) => {
					return element.classList.contains('no-pdf')
				},
			})

			const imgData = canvas.toDataURL('image/png')
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
			})

			pdf.setFontSize(18)
			pdf.setFont('helvetica', 'bold')
			pdf.text(client?.name || 'GN Procurement', 105, 15, { align: 'center' })

			pdf.setFontSize(12)
			pdf.setFont('helvetica', 'normal')
			let yPos = 25
			if (client?.items && client.items.length > 0) {
				let orderPrefix = 'Order – '
				client.items.forEach((p: any, index: number) => {
					const text = `${index === 0 ? orderPrefix : ' '.repeat(orderPrefix.length - 2)}${
						p.item_name
					} (${p.item_weight} ${p.item_weight_type}): ${p.quantity}`
					pdf.text(text, 105, yPos, { align: 'center' })
					yPos += 6
				})
			}

			pdf.setLineWidth(0.1)
			pdf.line(15, yPos + 2, 195, yPos + 2)

			const imgWidth = 210
			const imgHeight = (canvas.height * imgWidth) / canvas.width

			pdf.addImage(imgData, 'PNG', 0, yPos + 5, imgWidth, imgHeight)
			pdf.save(`Procurement_${client?.name || 'Report'}_${record._id}.pdf`)
		} catch (error) {
			alert('Failed to generate PDF. Please try again.')
		}
	}

	return (
		<div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
			<PageTitle breadcrumbs={[]}>GN Procurement View</PageTitle>
			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				<div
					className='no-pdf'
					style={{
						background: 'white',
						borderRadius: '6px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						padding: '24px',
						marginBottom: '20px',
						border: '1px solid #e5e7eb',
					}}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'start',
							marginBottom: '16px',
						}}>
						<div>
							<h2
								style={{
									fontSize: '18px',
									fontWeight: '700',
									color: '#111827',
									marginBottom: '16px',
								}}>
								{client?.name}
							</h2>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
								<span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
									Order -
								</span>
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									{client?.items?.map((p: any, i: number) => (
										<div
											key={i}
											style={{
												fontSize: '14px',
												fontWeight: '500',
												color: '#374151',
												marginBottom: '4px',
											}}>
											{p.item_name} ({p.item_weight} {p.item_weight_type}): {p.quantity}
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div ref={contentRef}>
					<div
						style={{
							background: 'white',
							borderRadius: '6px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							padding: '24px',
							marginBottom: '20px',
							border: '1px solid #e5e7eb',
						}}>
						<h2
							style={{
								fontSize: '18px',
								fontWeight: '700',
								color: '#111827',
								marginBottom: '16px',
							}}>
							Total
						</h2>

						<div style={{ overflowX: 'auto' }}>
							<table
								style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
								<thead>
									<tr style={{ backgroundColor: 'rgb(225, 227, 234)', color: '#000' }}>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Ingredient
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Qty.
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Rate
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											GST
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Price (incl. GST)
										</th>
									</tr>
								</thead>
								<tbody>
									{record.ingredientItems?.map((item, idx) => (
										<tr key={idx}>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.ingredient}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.qty}</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.rate}</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.gst}%</td>
											<td
												style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '700' }}>
												₹ {item.price.toFixed(2)}
											</td>
										</tr>
									))}

									{/* Total Qty + Subtotal Row */}
									<tr style={{ background: '#f3f4f6' }}>
										<td style={{ border: '1px solid #d1d5db', padding: '10px' }}></td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											{totalQty.toFixed(2)}
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px' }}></td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px' }}></td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {ingredientSubtotal.toFixed(2)}
										</td>
									</tr>

									{/* Total Row */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Total
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {ingredientSubtotal.toFixed(2)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{/* ✅ Packing Table */}
					<div
						style={{
							background: 'white',
							borderRadius: '6px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							padding: '24px',
							marginBottom: '20px',
							border: '1px solid #e5e7eb',
						}}>
						<h2
							style={{
								fontSize: '18px',
								fontWeight: '700',
								color: '#111827',
								marginBottom: '16px',
							}}>
							Packing costing
						</h2>

						<div style={{ overflowX: 'auto' }}>
							<table
								style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
								<thead>
									<tr style={{ backgroundColor: 'rgb(225, 227, 234)', color: '#000' }}>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Material
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Qty
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Rate
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											GST
										</th>
										<th
											style={{
												border: '1px solid #d1d5db',
												padding: '12px',
												textAlign: 'left',
												fontWeight: '700',
											}}>
											Price (incl. GST)
										</th>
									</tr>
								</thead>
								<tbody>
									{record.packingItems?.map((item, idx) => (
										<tr key={idx}>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>
												{item.material}
											</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.qty}</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.rate}</td>
											<td style={{ border: '1px solid #d1d5db', padding: '10px' }}>{item.gst}%</td>
											<td
												style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '700' }}>
												₹ {item.price.toFixed(2)}
											</td>
										</tr>
									))}

									{/* Subtotal */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Subtotal
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {packingSubtotal.toFixed(2)}
										</td>
									</tr>

									{/* Transportation */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Transportation
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {(record.transportation || 0).toFixed(2)}
										</td>
									</tr>
									{/* Labour */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Labour
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {(record.labour || 0).toFixed(2)}
										</td>
									</tr>

									{/* Total Cost */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Total Cost
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {totalCost.toFixed(2)}
										</td>
									</tr>

									{/* Order Amount */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Order amount
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {orderAmount.toFixed(2)}
										</td>
									</tr>

									{/* Gross Margin */}
									<tr style={{ background: '#f3f4f6' }}>
										<td
											colSpan={4}
											style={{
												border: '1px solid #d1d5db',
												padding: '10px',
												textAlign: 'right',
												fontWeight: '900',
											}}>
											Profit
										</td>
										<td style={{ border: '1px solid #d1d5db', padding: '10px', fontWeight: '900' }}>
											₹ {grossMargin.toFixed(2)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
			<div
				style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}
				className='me-2 '>
				<button
					onClick={() => navigate(-1)}
					className='btn btn-light'>
					<i
						className='bi bi-arrow-left text-dark'
						style={{ marginRight: '8px' }}></i>
					Back
				</button>
				<button
					onClick={handleGeneratePDF}
					style={{
						background: '#009ef7',
						color: 'white',
						padding: '10px 20px',
						borderRadius: '6px',
						border: 'none',
						cursor: 'pointer',
						fontWeight: '600',
						fontSize: '14px',
					}}>
					<i
						className='bi bi-download text-white'
						style={{ fontSize: '16px', marginRight: '8px' }}></i>
					Generate PDF
				</button>
			</div>
		</div>
	)
}

export default GNProcurementView
