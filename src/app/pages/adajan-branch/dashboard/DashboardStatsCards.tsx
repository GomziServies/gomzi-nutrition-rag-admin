import React, { useState, useEffect } from 'react'
import { KTIcon } from '../../../../_metronic/helpers'
import { fetchTrainers, DashboardTrainer, DASHBOARD_TIME_SLOTS, getTrainerSlotLoad } from './adajan-branch-dashboard-api'

const MAX_CLIENTS_PER_SLOT = 3

// Attendance Modal
const AttendanceModal: React.FC<{ show: boolean; onClose: () => void }> = ({ show, onClose }) => {
  const [trainers, setTrainers] = useState<DashboardTrainer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (show) {
      fetchTrainers().then((res) => {
        setTrainers(res.list)
        setLoading(false)
      })
    }
  }, [show])

  if (!show) return null

  // Calculate stats based on real trainer assignments
  const totalTrainers = trainers.length
  const totalAttendance = trainers.reduce((acc, trainer) => {
    return acc + Object.values(trainer.timeSlotAssignments).reduce((sum, clients) => sum + clients.length, 0)
  }, 0)

  return (
    <>
      <div className='modal fade show d-block' tabIndex={-1} style={{ zIndex: 1055 }}>
        <div className='modal-dialog modal-dialog-centered modal-xl'>
          <div className='modal-content border-0 shadow-lg' style={{ borderRadius: '12px' }}>
            <div className='modal-header border-0 pb-0 pt-6 px-6'>
              <h5 className='modal-title fw-bold text-gray-800 fs-2'>Time Slot Attendance & Trainer Load</h5>
              <button
                type='button'
                className='btn btn-icon btn-sm btn-active-light-primary ms-auto'
                onClick={onClose}
                aria-label='Close'
              >
                <KTIcon iconName='cross' className='fs-1' />
              </button>
            </div>
            <div className='modal-body pt-4 px-6 pb-6' style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {loading ? (
                <div className='d-flex justify-content-center py-10'>
                  <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table table-row-bordered table-row-gray-200 align-middle gs-0 gy-4'>
                    <thead>
                      <tr className='fw-bold text-muted text-uppercase fs-7'>
                        <th className='min-w-150px ps-4'>Time Slot</th>
                        {trainers.map(trainer => (
                          <th key={trainer._id} className='min-w-120px text-center'>
                            {trainer.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DASHBOARD_TIME_SLOTS.map((slot) => {
                        return (
                          <tr key={slot.id}>
                            <td className='ps-4'>
                              <div className='d-flex flex-column'>
                                <span className='text-gray-800 fw-bold fs-6'>{slot.time}</span>
                                <span className='text-muted fs-7'>Capacity: {slot.maxCapacity}</span>
                              </div>
                            </td>
                            {trainers.map(trainer => {
                              const load = getTrainerSlotLoad(trainer, slot.id)
                              const isFull = load >= slot.maxCapacity
                              const isWarning = load === slot.maxCapacity - 1 && slot.maxCapacity > 1

                              return (
                                <td key={trainer._id} className='text-center'>
                                  <div 
                                    className={`badge py-3 px-4 fs-7 w-100 ${
                                      isFull 
                                        ? 'badge-light-danger text-danger' 
                                        : isWarning 
                                          ? 'badge-light-warning text-warning' 
                                          : 'badge-light-success text-success'
                                    }`}
                                    style={{ border: isFull ? '1px solid #f1416c' : isWarning ? '1px solid #ffc700' : 'none' }}
                                  >
                                    <span className='fw-bolder'>{load}/{slot.maxCapacity}</span>
                                    {isFull && <span className='ms-1 d-block d-md-inline'>(FULL)</span>}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Modal stats cards */}
              <div className='separator separator-dashed my-5'></div>
              <div className='row g-4'>
                <div className='col-md-4'>
                  <div className='card bg-light-primary border-0 h-100'>
                    <div className='card-body text-center py-5'>
                      <KTIcon iconName='calendar-tick' className='fs-2x text-primary mb-2' />
                      <div className='fw-bold fs-2 text-gray-800'>{totalAttendance}</div>
                      <div className='text-muted fs-7'>Total Attendance</div>
                    </div>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='card bg-light-success border-0 h-100'>
                    <div className='card-body text-center py-5'>
                      <KTIcon iconName='people' className='fs-2x text-success mb-2' />
                      <div className='fw-bold fs-2 text-gray-800'>{totalAttendance}</div>
                      <div className='text-muted fs-7'>Total Members</div>
                    </div>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='card bg-light-info border-0 h-100'>
                    <div className='card-body text-center py-5'>
                      <KTIcon iconName='profile-user' className='fs-2x text-info mb-2' />
                      <div className='fw-bold fs-2 text-gray-800'>{totalTrainers}</div>
                      <div className='text-muted fs-7'>Total Trainers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='modal-footer border-0 pt-0 px-6 pb-6'>
              <button type='button' className='btn btn-light-danger' onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className='modal-backdrop fade show'
        onClick={onClose}
        style={{ zIndex: 1050 }}
        aria-hidden='true'
      />
    </>
  )
}

const DashboardStatsCards: React.FC = () => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [trainers, setTrainers] = useState<DashboardTrainer[]>([])

  useEffect(() => {
    fetchTrainers().then(res => setTrainers(res.list))
  }, [])

  const totalClients = 45
  const totalTrainers = trainers.length
  const todayAttendance = trainers.reduce((acc, t) => {
    return acc + Object.values(t.timeSlotAssignments).reduce((sum, c) => sum + c.length, 0)
  }, 0)

  return (
    <>
      <div className='row g-5 g-xl-8 mb-5 mb-xl-8 align-items-stretch'>
        {/* Total Clients - same height */}
        <div className='col-xl-4 col-md-6 d-flex'>
          <div className='card card-xl-stretch w-100 h-100' style={{ minHeight: '140px' }}>
            <div className='card-body d-flex align-items-center py-8'>
              <div className='symbol symbol-60px me-5'>
                <span className='symbol-label bg-light-primary'>
                  <KTIcon iconName='people' className='fs-2x text-primary' />
                </span>
              </div>
              <div className='flex-grow-1'>
                <span className='text-muted fw-semibold d-block fs-7 mb-1'>Total Clients</span>
                <span className='text-dark fw-bold fs-2x'>{totalClients}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Trainers - same height */}
        <div className='col-xl-4 col-md-6 d-flex'>
          <div className='card card-xl-stretch w-100 h-100' style={{ minHeight: '140px' }}>
            <div className='card-body d-flex align-items-center py-8'>
              <div className='symbol symbol-60px me-5'>
                <span className='symbol-label bg-light-success'>
                  <KTIcon iconName='profile-user' className='fs-2x text-success' />
                </span>
              </div>
              <div className='flex-grow-1'>
                <span className='text-muted fw-semibold d-block fs-7 mb-1'>Total Trainers</span>
                <span className='text-dark fw-bold fs-2x'>{totalTrainers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Attendance - same as other cards, no batch full strip */}
        <div className='col-xl-4 col-md-6 d-flex'>
          <div
            className='card card-xl-stretch w-100 h-100 cursor-pointer'
            onClick={() => setShowAttendanceModal(true)}
            style={{ minHeight: '140px', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <div className='card-body d-flex align-items-center py-8'>
              <div className='symbol symbol-60px me-5'>
                <span className='symbol-label bg-light-warning'>
                  <KTIcon iconName='calendar-tick' className='fs-2x text-warning' />
                </span>
              </div>
              <div className='flex-grow-1'>
                <span className='text-muted fw-semibold d-block fs-7 mb-1'>
                  Today&apos;s Attendance
                </span>
                <span className='text-dark fw-bold fs-2x'>{todayAttendance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AttendanceModal
        show={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />
    </>
  )
}

export { DashboardStatsCards }
