import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { DayJS } from '../../../../_metronic/helpers/Utils'
import { PageTitle } from '../../../../_metronic/layout/core'
import CopyableInput from '../../../components/CopyableInput'
import DateFilter from '../../../components/DateRangePicker'
import InputField from '../../../components/InputField'
import SelectField from '../../../components/SelectField'
import { GetAdajanBranchAttendance } from '../../../Functions/FGGroup/AdajanBranchAttendance'
import { GetAdajanBranchEmployees } from '../../../Functions/FGGroup/AdajanBranchEmployee'
import { GetAdajanBranchClient } from '../../../Functions/FGGroup/AdajanBranchClient'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'

const AdajanBranchAttendenceView = () => {
    const location = useLocation()
    const searchParams = new URLSearchParams(location.search)
    const employee_code: string = searchParams.get('id') || searchParams.get('employee_code') || ''
    const type: string = searchParams.get('type') || 'trainer'

    const [memberData, setMemberData] = useState<any>({})
    const [attendanceData, setAttendanceData] = useState<any>([])
    const [loading, setLoading] = useState(false)
    const [selectedDateRange, setSelectedDateRange] = useState<any>(() => {
        const stored = localStorage.getItem('selectedDateRange')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                return [new Date(parsed.from), new Date(parsed.to)]
            } catch {
                return null
            }
        }
        return null
    })
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')

    const fetchAttendanceViewData = async () => {
        setLoading(true)

        try {
            let startDate: any
            let endDate: any

            if (selectedDateRange) {
                startDate = new Date(
                    Array.isArray(selectedDateRange) ? selectedDateRange[0] : selectedDateRange.from
                )
                startDate.setHours(0, 0, 0, 0)

                endDate = new Date(
                    Array.isArray(selectedDateRange) ? selectedDateRange[1] : selectedDateRange.to
                )
                endDate.setHours(23, 59, 59, 999)
            } else {
                const now = new Date()
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date()
            }

            // Build query for attendance
            const attendanceQuery: any = {
                from_date: startDate,
                to_date: endDate,
            }

            if (type === 'client') {
                attendanceQuery.client_code = employee_code
            } else {
                attendanceQuery.employee_code = employee_code
            }

            // Fetch all records for the date range (high limit so pagination doesn't truncate stats)
            attendanceQuery.limit = 1000

            if (selectedSubject) {
                attendanceQuery.status = selectedSubject
            }

            const [userResponse, attendanceResponse]: [any, any] = await Promise.all([
                type === 'client'
                    ? GetAdajanBranchClient({ search: employee_code })
                    : GetAdajanBranchEmployees({ search: employee_code }),
                GetAdajanBranchAttendance(attendanceQuery),
            ])

            // Set member data from first matching user
            const users: any[] = userResponse?.data || []
            let matchedUser: any

            if (type === 'client') {
                matchedUser = users.find((u: any) => u.clientCode === employee_code) || users[0]
            } else {
                matchedUser = users.find((u: any) => u.employee_code === employee_code) || users[0]
            }

            if (matchedUser) {
                setMemberData({
                    _id: matchedUser._id,
                    employee_code: matchedUser.employee_code || matchedUser.clientCode,
                    full_name: matchedUser.name || matchedUser.full_name || '',
                    mobile: matchedUser.mobile || matchedUser.phone || '',
                    photo: matchedUser.photo || matchedUser.image || '',
                })
            }

            // Set attendance data
            let allData: any[] = attendanceResponse?.data || []

            // Sort data
            allData.sort((a: any, b: any) => {
                const aDate = new Date(a.DateString).getTime()
                const bDate = new Date(b.DateString).getTime()
                return aDate - bDate
            })

            setAttendanceData(allData)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchAttendanceViewData()
    }, [
        selectedDateRange,
        selectedSubject,
        employee_code,
    ])

    const handleDateRangeChange = (dateRange: [Date, Date] | null) => {
        setSelectedDateRange(dateRange)
    }

    const handleChangeStatus = (event: any) => {
        let value = event.target.value
        setSelectedStatus(value)
        if (value == 'Absent') {
            value = 'A'
        } else if (value == 'Present') {
            value = 'P'
        } else {
            value = ''
        }
        setSelectedSubject(value)
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Attendance Details</PageTitle>

            <div className='row mb-6'>
                <div className='col-12 mt-3'>
                    <div className='card py-5'>
                        <h3 className='ms-8'>{type === 'client' ? 'Client Detail:' : 'Employee Detail:'}</h3>
                        <div className='card-body'>
                            <div className='row'>
                                <div className='col-3 d-md-block d-none text-center'>
                                    <img
                                        src={
                                            memberData?.photo
                                                ? `https://files.fggroup.in/${memberData?.photo}`
                                                : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                        }
                                        alt={memberData?.full_name}
                                        style={{ borderRadius: '10px', width: '90%' }}
                                    />
                                </div>
                                <div className='col-12 d-md-none d-block mb-5 text-center'>
                                    <img
                                        src={
                                            memberData?.photo
                                                ? `https://files.fggroup.in/${memberData?.photo}`
                                                : toAbsoluteUrl('/media/logos/fgiit-logo.png')
                                        }
                                        alt={memberData?.full_name}
                                        style={{ borderRadius: '5px', width: '50%' }}
                                    />
                                </div>
                                <div className='col-md-9'>
                                    <div className='row'>
                                        <div className='col-md-6 fv-row'>
                                            <CopyableInput
                                                placeholder={type === 'client' ? 'Client Code' : 'Employee Code'}
                                                type='text'
                                                className='col-12 fv-row'
                                                name='employee_code'
                                                label={type === 'client' ? 'Client Code' : 'Employee Code'}
                                                htmlFor='employee_code'
                                                value={memberData?.employee_code}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-6 fv-row'>
                                            <InputField
                                                placeholder='Name'
                                                type='text'
                                                className='col-12 fv-row'
                                                name='full_name'
                                                label='Name'
                                                htmlFor='full_name'
                                                value={memberData?.full_name}
                                                disabled
                                            />
                                        </div>
                                        <div className='col-md-6 fv-row'>
                                            <InputField
                                                placeholder='Mobile'
                                                type='text'
                                                className='col-12 fv-row'
                                                name='mobile'
                                                label='Mobile'
                                                htmlFor='mobile'
                                                value={memberData?.mobile}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='card border-0 shadow-sm' style={{ borderRadius: '15px' }}>
                <div className='card-header border-0 pt-6 align-items-center'>
                    <h2 className='card-title align-items-start flex-column'>
                        <span className='card-label fw-bold text-dark fs-2'>Attendance :</span>
                    </h2>
                    <div className='card-toolbar d-flex align-items-center gap-3'>
                        <DateFilter onDateRangeChange={handleDateRangeChange} rightValue='0'/>
                        <div className='w-150px mt-5'>
                            <SelectField
                                className='col-12'
                                label='Status'
                                showLabel={false}
                                name='selectedStatus'
                                value={selectedStatus}
                                onChange={handleChangeStatus}
                                htmlFor='selectedStatus'
                                options={['Present', 'Absent']}
                            />
                        </div>
                    </div>
                </div>
                <div className='card-body py-8'>
                    <div className='calendar-wrapper'>
                        <div className='calendar-grid pb-5'>
                            {/* Day Headers */}
                            <div className='d-grid mb-6 bg-light py-4 rounded-3' style={{ gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className='fw-bold fs-8 text-uppercase ls-1 text-gray-500'>{day}</div>
                                ))}
                            </div>

                            <div className='d-grid gap-5' style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                {(() => {
                                    const baseDate = selectedDateRange ? DayJS(selectedDateRange[0]) : DayJS().startOf('month')
                                    const daysInMonth = baseDate.daysInMonth()
                                    const startDayOfWeek = baseDate.startOf('month').day()

                                    const calendarCells = []

                                    // Empty cells for alignment
                                    for (let i = 0; i < startDayOfWeek; i++) {
                                        calendarCells.push(<div key={`empty-${i}`} className='calendar-day-empty opacity-50 bg-light rounded-3' style={{ height: '120px', border: '1px dashed #e4e6ef' }}></div>)
                                    }

                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const currentDate = baseDate.date(i).format('YYYY-MM-DD')
                                        const record = attendanceData.find((r: any) => DayJS(r.DateString).format('YYYY-MM-DD') === currentDate)

                                        const isPresent = record?.Status === 'P'
                                        const isAbsent = record?.Status === 'A'
                                        const isHalfDay = record?.halfDay
                                        const isSunday = DayJS(currentDate).day() === 0

                                        const tooltip = (
                                            <Tooltip id={`tooltip-${currentDate}`} className='custom-premium-tooltip'>
                                                <div className='p-4' style={{ minWidth: '220px', borderRadius: '12px', background: '#1e1e2d' }}>
                                                    <div className='d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary'>
                                                        <span className='fw-bold text-white fs-6'>
                                                            {DayJS(currentDate).format('DD MMM YYYY')}
                                                        </span>
                                                        <span className={`badge badge-sm ${isPresent ? 'badge-light-success' : isAbsent ? 'badge-light-danger' : 'badge-light-dark'}`}>
                                                            {record?.Status || (isSunday ? 'Sunday' : 'N/A')}
                                                        </span>
                                                    </div>
                                                    {record ? (
                                                        <div className='d-flex flex-column gap-3'>
                                                            <div className='mb-2 border-bottom border-secondary pb-1'>
                                                                <div className='text-white fw-bold fs-7 mb-1'>{memberData?.full_name || 'N/A'}</div>
                                                                <div className='text-gray-500 fs-9'>{memberData?.employee_code || '---'} | {memberData?.mobile || '---'}</div>
                                                            </div>
                                                            <div className='d-flex justify-content-between'>
                                                                <span className='text-gray-500 fs-8'>In Time:</span>
                                                                <span className='text-white fw-bold fs-8'>{record.INTime || record.InTime || record.in_time || '--:--'}</span>
                                                            </div>
                                                            <div className='d-flex justify-content-between'>
                                                                <span className='text-gray-500 fs-8'>Out Time:</span>
                                                                <span className='text-white fw-bold fs-8'>{record.OUTTime || record.OutTime || record.out_time || '--:--'}</span>
                                                            </div>
                                                            {isHalfDay && (
                                                                <div className='mt-2'>
                                                                    <span className='badge badge-light-warning w-100 fs-9'>Half Day</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className='text-center py-2'>
                                                            <span className='text-gray-600 fs-8'>{isSunday ? 'Weekly Off' : 'No Data'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Tooltip>
                                        )

                                        calendarCells.push(
                                            <OverlayTrigger
                                                key={currentDate}
                                                placement='top'
                                                overlay={tooltip}
                                                delay={{ show: 200, hide: 200 }}
                                            >
                                                <div
                                                    className={`calendar-day d-flex flex-column align-items-center justify-content-center p-4 rounded-3 border-2 transition-all shadow-hover ${record ? (isPresent ? 'bg-light-success border-success text-success' : 'bg-light-danger border-danger text-danger') : (isSunday ? 'bg-light-info border-info opacity-75 text-info' : 'bg-light border-gray-300 text-gray-400')}`}
                                                    style={{
                                                        height: '120px',
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        backgroundColor: record ? (isPresent ? '#e8fff3' : '#fff5f8') : (isSunday ? '#f1faff' : '#f9f9f9'),
                                                        borderWidth: '2px',
                                                        borderStyle: 'solid'
                                                    }}
                                                >
                                                    <span className='fs-2 fw-bolder mb-1' style={{ zIndex: 2 }}>
                                                        {i}
                                                    </span>
                                                    {record && (
                                                        <div className='mt-1' style={{ zIndex: 2 }}>
                                                            <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'} fs-9 px-3 py-1 rounded-pill shadow-sm`}>
                                                                {isPresent ? 'PRESENT' : 'ABSENT'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {isSunday && !record && (
                                                        <span className='fs-10 fw-bold mt-1 text-uppercase' style={{ zIndex: 2, letterSpacing: '1px' }}>WEEKEND</span>
                                                    )}

                                                    {/* Subtle Background Icon */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '-10px',
                                                            right: '-5px',
                                                            opacity: 0.1,
                                                            fontSize: '3rem',
                                                            fontWeight: 'bold',
                                                            transform: 'rotate(-15deg)',
                                                            pointerEvents: 'none'
                                                        }}
                                                    >
                                                        {i}
                                                    </div>
                                                </div>
                                            </OverlayTrigger>
                                        )
                                    }
                                    return calendarCells
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .shadow-hover:hover {
                    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1) !important;
                    transform: translateY(-5px);
                }
                .calendar-grid {
                    display: grid;
                    gap: 1.25rem;
                }
                .custom-premium-tooltip .tooltip-inner {
                    max-width: none !important;
                    padding: 0 !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.2) !important;
                }
                .object-fit-cover {
                    object-fit: cover;
                }
                .w-150px { width: 150px; }
            `}</style>
        </>
    )
}

export default AdajanBranchAttendenceView