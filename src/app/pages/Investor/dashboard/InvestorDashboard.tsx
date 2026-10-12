import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { KTCard } from '../../../../_metronic/helpers'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faMoneyBillTransfer, faCalendarCheck, faHandHoldingDollar, faTableCells, faArrowRight,
    faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { GetInvoice, GetInvoiceStats } from '../../../Functions/FWG'
import { getExpense } from '../../../Functions/FGGroup/Expense'
import { GetAdajanBranchAttendanceSummary } from '../../../Functions/FGGroup/AdajanBranchAttendance'

const InvestorDashboard: React.FC = () => {
    const navigate = useNavigate()
    const [insight, setInsight] = useState<any>({})
    const [totalClients, setTotalClients] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const fetchAll = async () => {
            try {
                const [statsRes, invRes, expRes, attRes]: any = await Promise.all([
                    GetInvoiceStats({ invoice_from_date: new Date('2026-01-01'), invoice_to_date: now, branch_name: 'Adajan' } as any),
                    GetInvoice({ limit: 5, branch_name: 'Adajan', sort: 'createdAt', sortOrder: 'desc' } as any),
                    getExpense({ expense_company: 'Adajan-Branch', limit: 5, sort: 'createdAt', sortOrder: 'desc' }),
                    GetAdajanBranchAttendanceSummary({ from_date: monthStart, to_date: now }),
                ])
                if (statsRes?.data?.[0]) setInsight(statsRes.data[0])
                setTotalClients(invRes?.metadata?.pagination?.totalDocs ?? 0)
                setInvoices(invRes?.data || [])
                setExpenses(expRes?.data || [])
                setAttendance(((attRes?.data || []).filter((a: any) => a.type === 'client')).slice(0, 5))
            } catch (e) { console.error(e) }
            setLoading(false)
        }
        fetchAll()
    }, [])

    const fmt = (v: any) => v != null && v !== '' ? `₹${Number(v).toLocaleString('en-IN')}` : '—'

    const navCards = [
        { title: 'Total Sales', to: '/investor/total-sales', icon: faMoneyBillTransfer, color: '#1B84FF', bg: '#EEF6FF' },
        { title: 'Attendance', to: '/investor/attendance/list', icon: faCalendarCheck, color: '#17C653', bg: '#EEFFF5' },
        { title: 'Expenses', to: '/investor/expense/list', icon: faHandHoldingDollar, color: '#F6C000', bg: '#FFFCEE' },
        { title: 'Matrix', to: '/investor/matrix/list', icon: faTableCells, color: '#7239EA', bg: '#F5EEFF' },
    ]

    const thStyle: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', padding: '6px 12px', color: '#99A1B7', fontWeight: 600 }
    const tdStyle: React.CSSProperties = { padding: '7px 12px', fontSize: '12px', verticalAlign: 'middle' }

    const TableCard = ({ title, subtitle, to, color, children }: any) => (
        <KTCard className='h-100'>
            <div className='card-header border-0 pt-5 pb-2'>
                <div className='d-flex align-items-center'>
                    <div className='me-3' style={{ width: '4px', height: '25px', background: color }} />
                    <div>
                        <h3 className='fw-bold fs-3 mb-0 text-gray-800'>{title}</h3>
                        <span className='text-muted fs-7'>{subtitle}</span>
                    </div>
                </div>
                <div className='card-toolbar'>
                    <a href={to} className='btn btn-sm btn-light-primary fs-8'>View All <FontAwesomeIcon icon={faArrowRight} className='ms-1' style={{ fontSize: '10px' }} /></a>
                </div>
            </div>
            {children}
        </KTCard>
    )

    return (
        <>
            <PageTitle breadcrumbs={[]}>Investor Dashboard</PageTitle>

            {/* Nav Cards */}
            <div className='row g-4 mb-7'>
                {navCards.map((c) => (
                    <div key={c.to} className='col-6 col-md-3'>
                        <div className='card border-0 shadow-sm cursor-pointer'
                            style={{ transition: 'transform .2s', cursor: 'pointer', minHeight: '120px' }}
                            onClick={() => navigate(c.to)}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
                            <div className='card-body p-6 d-flex align-items-center gap-3'>
                                <div className='rounded-3 d-flex align-items-center justify-content-center flex-shrink-0'
                                    style={{ width: '46px', height: '46px', background: c.bg }}>
                                    <FontAwesomeIcon icon={c.icon} style={{ color: c.color, fontSize: '20px' }} />
                                </div>
                                <div>
                                    <div className='fw-bold fs-5 text-gray-800'>{c.title}</div>
                                    <div className='fs-7' style={{ color: c.color }}>Open →</div>
                                </div>
                            </div>
                            <div style={{ height: '3px', borderRadius: '0 0 14px 14px', background: c.color }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className='row g-5'>

                {/* TABLE 1 — Sales Stats */}
                <div className='col-md-6'>
                    <TableCard title='Total Sales Summary' subtitle='Adajan Branch' to='/investor/total-sales' color='#1B84FF'>
                        <div className='card-body pt-2'>
                            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 mb-0'>
                                <thead>
                                    <tr ><th style={thStyle} className='fs-7'>Metric</th><th style={{ ...thStyle, textAlign: 'right' }} className='fs-7'>Value</th></tr>
                                </thead>
                                <tbody >
                                    {[
                                        { label: 'Total Clients', value: loading ? '...' : (totalClients ?? '—') },
                                        { label: 'Net Amount', value: loading ? '...' : fmt(insight.total_net_amount) },
                                        { label: 'Paid Amount', value: loading ? '...' : fmt(insight.total_paid_amount) },
                                        { label: 'Due Amount', value: loading ? '...' : fmt(insight.total_due_amount) },
                                        { label: 'Sales Average', value: loading ? '...' : fmt(insight.average_net_amount) },
                                    ].map((r) => (
                                        <tr key={r.label}>
                                            <td style={tdStyle} className='text-gray-600 fw-semibold fs-6'>{r.label}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }} className='text-dark fw-bold fs-6'>{r.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TableCard>
                </div>

                {/* TABLE 2 — Expenses */}
                <div className='col-md-6'>
                    <TableCard title='Recent Expenses' subtitle='Adajan-Branch — Last 5' to='/investor/expense/list' color='#F6C000'>
                        <div className='card-body pt-2'>
                            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 mb-0'>
                                <thead>
                                    <tr >
                                        <th style={thStyle} className='fs-7'>No</th>
                                        <th style={thStyle} className='fs-7'>Category</th>
                                        <th style={thStyle} className='fs-7'>Payment</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }} className='fs-7'>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className='text-center text-muted py-5'>Loading...</td></tr>
                                    ) : expenses.length === 0 ? (
                                        <tr><td colSpan={4} className='text-center text-muted py-5'>No records</td></tr>
                                    ) : expenses.map((e: any, i) => (
                                        <tr key={e._id} className='data-row' style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/investor/expense/view?expense_id=${e._id}`)}>
                                            <td style={tdStyle}>
                                                <FontAwesomeIcon icon={faPlusCircle} style={{ color: '#607D8B', fontSize: '16px' }} className='me-1' />
                                                <span className='text-dark fw-bold fs-7'>{i + 1}</span>
                                            </td>
                                            <td style={tdStyle} className='text-dark fw-bold fs-5'>{e.expense_category || '—'}</td>
                                            <td style={tdStyle} className='text-muted fs-5'>{e.payment_method || '—'}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }} className='text-dark fw-bold fs-5'>{fmt(e.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TableCard>
                </div>

                {/* TABLE 3 — Attendance */}
                <div className='col-md-6'>
                    <TableCard title='Client Attendance' subtitle='This Month — Top 5' to='/investor/attendance/list' color='#17C653'>
                        <div className='card-body pt-2'>
                            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 mb-0'>
                                <thead>
                                    <tr>
                                        <th style={thStyle} className='fs-7'>No</th>
                                        <th style={thStyle} className='fs-7'>Name</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }} className='fs-7'>Present</th>
                                        <th style={{ ...thStyle, textAlign: 'center' }} className='fs-7'>Absent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className='text-center text-muted py-5'>Loading...</td></tr>
                                    ) : attendance.length === 0 ? (
                                        <tr><td colSpan={4} className='text-center text-muted py-5'>No records</td></tr>
                                    ) : attendance.map((a: any, i) => (
                                        <tr key={a.employee_code || i} style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/investor/attendance/view?id=${a.employee_code}&type=${a.type}`)}>
                                            <td style={tdStyle}>
                                                <FontAwesomeIcon icon={faPlusCircle} style={{ color: '#607D8B', fontSize: '16px' }} className='me-1' />
                                                <span className='text-dark fw-bold fs-6'>{i + 1}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span className='text-dark fw-bold d-block fs-5'>{a.Name || '—'}</span>
                                                <span className='text-muted fs-7'>{a.mobile || ''}</span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }} className='text-dark fw-bold fs-5'>{a.total_present ?? 0}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }} className='text-dark fw-bold fs-5'>{a.total_absent ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TableCard>
                </div>

                {/* TABLE 4 — Recent Invoices */}
                <div className='col-md-6'>
                    <TableCard title='Recent Invoices' subtitle='Adajan Branch — Last 5' to='/investor/total-sales' color='#7239EA'>
                        <div className='card-body pt-2'>
                            <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 mb-0'>
                                <thead>
                                    <tr>
                                        <th style={thStyle} className='fs-7'>No</th>
                                        <th style={thStyle} className='fs-7'>Client</th>
                                        <th style={thStyle} className='fs-7'>Product</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }} className='fs-7'>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className='text-center text-muted py-5'>Loading...</td></tr>
                                    ) : invoices.length === 0 ? (
                                        <tr><td colSpan={4} className='text-center text-muted py-5'>No records</td></tr>
                                    ) : invoices.map((inv: any, i) => (
                                        <tr key={inv._id} style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/investor/sales-list/view-invoice?invoice_id=${inv._id}`)}>
                                            <td style={tdStyle}>
                                                <FontAwesomeIcon icon={faPlusCircle} style={{ color: '#607D8B', fontSize: '16px' }} className='me-1' />
                                                <span className='text-dark fw-bold fs-6'>{i + 1}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span className='text-dark fw-bold d-block fs-5'>{inv.fullName || '—'}</span>
                                                <span className='text-muted fs-7'>{inv.phoneNumber || ''}</span>
                                            </td>
                                            <td style={tdStyle} className='text-muted fs-7'>{inv.productName || '—'}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }} className='text-dark fw-bold fs-6'>{fmt(inv.totalPayment)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TableCard>
                </div>

            </div>
        </>
    )
}

export { InvestorDashboard }
