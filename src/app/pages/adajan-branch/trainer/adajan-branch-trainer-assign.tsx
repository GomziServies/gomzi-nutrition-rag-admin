import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import {
  AssignAdajanBranchTrainer,
  GetAdajanBranchClient,
} from '../../../Functions/FGGroup/AdajanBranchClient'
import { GetAdajanBranchEmployees } from '../../../Functions/FGGroup/AdajanBranchEmployee'

// Interfaces
type Trainer = {
  _id: string
  name: string
  phone: string
  email: string
  timeSlotAssignments: { [key: string]: string[] }
}

type Client = {
  _id: string
  name: string
  phone: string
  email: string
  assignedTrainer?: string
  assignedDate?: Date
  timeSlot?: string
  timeSlotId?: string
}

type TimeSlot = {
  id: string
  time: string
  maxCapacity: number
}

// Location state interface
type LocationState = {
  client?: Client
}

const AdajanBranchTrainerAssign: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('id')

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])

  // Find selected client from ID
  const selectedClient = clients.find((c) => c._id === clientId) || null

  const [selectedTrainer, setSelectedTrainer] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  const fetchClients = async () => {
    try {
      const response: any = await GetAdajanBranchClient({
        page: 1,
        limit: 1000, // Fetch all for now to find the selected one
      })
      if (response.data) {
        const mappedClients = response.data.map((c: any) => ({
          _id: c._id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          assignedTrainer: c.assignedTrainer?._id || c.assignedTrainer, // Handle populated or ID
          timeSlotId: c.timeSlotId,
        }))
        setClients(mappedClients)
        return mappedClients
      }
      return []
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
      return []
    }
  }

  // Load Trainers (Employees)
  const fetchTrainers = async (loadedClients: Client[]) => {
    try {
      const response: any = await GetAdajanBranchEmployees({
        page: 1,
        limit: 1000, // Fetch all trainers
        position: 'Trainer',
        role: 'Trainer',
      })
      if (response.data) {
        // Initialize with empty assignments
        const loadedTrainers = response.data.map((t: any) => ({
          _id: t._id,
          name: t.name,
          phone: t.mobile, // Note: mobile in API -> phone in UI
          email: t.email,
          timeSlotAssignments: {},
        }))

        // Apply assignments from loaded clients
        applyAssignmentsToTrainers(loadedTrainers, loadedClients)
      }
    } catch (error) {
      console.error('Error fetching trainers:', error)
      toast.error('Failed to load trainers')
    }
  }

  const applyAssignmentsToTrainers = (initialTrainers: Trainer[], clients: Client[]) => {
    // Build trainer time slot assignments from client data
    const trainerAssignments: { [trainerId: string]: { [slotId: string]: string[] } } = {}

    // Initialize all trainers
    initialTrainers.forEach((trainer) => {
      trainerAssignments[trainer._id] = {}
    })

    // Populate from client data (API)
    clients.forEach((client) => {
      if (client.assignedTrainer && client.timeSlotId) {
        const tId = client.assignedTrainer
        const sId = client.timeSlotId

        // Only process if trainer exists in current list
        if (initialTrainers.some((t) => t._id === tId)) {
          if (!trainerAssignments[tId]) {
            trainerAssignments[tId] = {}
          }
          if (!trainerAssignments[tId][sId]) {
            trainerAssignments[tId][sId] = []
          }
          trainerAssignments[tId][sId].push(client._id)
        }
      }
    })

    // Update trainers with actual assignments
    const updatedTrainers = initialTrainers.map((trainer) => ({
      ...trainer,
      timeSlotAssignments: trainerAssignments[trainer._id] || {},
    }))

    setTrainers(updatedTrainers)
  }

  // Load data on mount
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedClients = await fetchClients()
      if (loadedClients) {
        fetchTrainers(loadedClients)
      }
    }
    loadData()
  }, [])

  // Time Slots
  const timeSlots: TimeSlot[] = [
    { id: '1', time: '06:00 AM - 07:00 AM', maxCapacity: 7 },
    { id: '2', time: '07:00 AM - 08:00 AM', maxCapacity: 7 },
    { id: '3', time: '08:00 AM - 09:00 AM', maxCapacity: 7 },
    { id: '4', time: '09:00 AM - 10:00 AM', maxCapacity: 7 },
    { id: '5', time: '10:00 AM - 11:00 AM', maxCapacity: 7 },
    { id: '6', time: '04:00 PM - 05:00 PM', maxCapacity: 7 },
    { id: '7', time: '05:00 PM - 06:00 PM', maxCapacity: 7 },
    { id: '8', time: '06:00 PM - 07:00 PM', maxCapacity: 7 },
    { id: '9', time: '07:00 PM - 08:00 PM', maxCapacity: 7 },
  ]

  const getTrainerSlotLoad = (trainerId: string, timeSlotId: string): number => {
    const trainer = trainers.find((t) => t._id === trainerId)
    if (!trainer || !trainer.timeSlotAssignments[timeSlotId]) return 0
    return trainer.timeSlotAssignments[timeSlotId].length
  }

  const getAvailableTrainersForSlot = (timeSlotId: string) => {
    const trainersWithCapacity = trainers.filter((trainer) => {
      const slotLoad = getTrainerSlotLoad(trainer._id, timeSlotId)
      return slotLoad < 7
    })

    if (trainersWithCapacity.length === 0) return []

    const minLoad = Math.min(
      ...trainersWithCapacity.map((t) => getTrainerSlotLoad(t._id, timeSlotId))
    )

    return trainersWithCapacity.filter((trainer) => {
      const slotLoad = getTrainerSlotLoad(trainer._id, timeSlotId)
      return slotLoad === minLoad
    })
  }

  const getTotalTrainerLoad = (trainerId: string): number => {
    const trainer = trainers.find((t) => t._id === trainerId)
    if (!trainer) return 0

    return Object.values(trainer.timeSlotAssignments).reduce(
      (total, clients) => total + clients.length,
      0
    )
  }

  const isTrainerDisabledForSlot = (trainerId: string, timeSlotId: string): boolean => {
    const availableTrainers = getAvailableTrainersForSlot(timeSlotId)
    return !availableTrainers.some((t) => t._id === trainerId)
  }

  const handleAssignTrainer = async () => {
    if (!selectedClient || !selectedTrainer || !selectedTimeSlot) {
      toast.error('Please select both trainer and time slot')
      return
    }

    if (isTrainerDisabledForSlot(selectedTrainer, selectedTimeSlot)) {
      toast.error('This trainer is not available. Please select an available trainer.')
      return
    }

    const slotLoad = getTrainerSlotLoad(selectedTrainer, selectedTimeSlot)
    if (slotLoad >= 7) {
      toast.error(
        'This trainer is full for the selected time slot. Please choose another trainer or time slot.'
      )
      return
    }

    // Get time slot details
    const selectedSlotData = timeSlots.find((s) => s.id === selectedTimeSlot)

    // Call API to assign trainer
    try {
      const response = await AssignAdajanBranchTrainer({
        clientId: selectedClient._id,
        trainerId: selectedTrainer,
        timeSlotId: selectedTimeSlot,
        timeSlot: selectedSlotData?.time || '',
      })

      if (response.status === 200) {
        toast.success('Trainer assigned successfully!')
        setTimeout(() => {
          navigate('/adajan-branch/trainer/list')
        }, 1000)
      } else {
        toast.error(response.message || 'Failed to assign trainer')
      }
    } catch (error: any) {
      console.error('Error assigning trainer:', error)
      toast.error(error.message || 'An error occurred while assigning trainer')
    }
  }

  if (!clientId) {
    return (
      <>
        <PageTitle breadcrumbs={ [] }>Assign Trainer</PageTitle>
        <KTCard>
          <div className='card-body text-center py-20'>
            <i className='bi bi-exclamation-triangle fs-1 text-warning mb-3'></i>
            <h3 className='text-muted'>Invalid URL: Missing Client ID</h3>
            <button
              className='btn btn-primary mt-4'
              onClick={ () => navigate(-1) }>
              <i className='bi bi-arrow-left me-2'></i>
              Go Back
            </button>
          </div>
        </KTCard>
      </>
    )
  }

  if (clients.length === 0 && !selectedClient) {
    // Loading state or empty state if fetch hasn't completed/succeeded yet
    // Ideally show a spinner here
    return (
      <>
        <PageTitle breadcrumbs={ [] }>Assign Trainer</PageTitle>
        <KTCard>
          <div className='card-body text-center py-20'>
            <div
              className='spinner-border text-primary'
              role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          </div>
        </KTCard>
      </>
    )
  }

  if (!selectedClient) {
    return (
      <>
        <PageTitle breadcrumbs={ [] }>Assign Trainer</PageTitle>
        <KTCard>
          <div className='card-body text-center py-20'>
            <i className='bi bi-exclamation-triangle fs-1 text-warning mb-3'></i>
            <h3 className='text-muted'>Client not found</h3>
            <button
              className='btn btn-primary mt-4'
              onClick={ () => navigate(-1) }>
              <i className='bi bi-arrow-left me-2'></i>
              Go Back
            </button>
          </div>
        </KTCard>
      </>
    )
  }

  return (
    <>
      <PageTitle breadcrumbs={ [] }>Assign Trainer</PageTitle>

      <KTCard>
        <div className='card-body p-8'>
          {/* Header */ }
          <div className='d-flex justify-content-between align-items-center mb-8'>
            <h2 className='fw-bolder text-gray-800 mb-0'>
              <i className='bi bi-person-plus-fill text-primary fs-2 me-3'></i>
              Assign Trainer to { selectedClient.name }
            </h2>
            <button
              className='btn btn-light-primary'
              onClick={ () => navigate(-1) }>
              <i className='bi bi-arrow-left me-2'></i>
              Back
            </button>
          </div>

          {/* Client Info */ }
          <div className='card bg-light-primary border-0 mb-8'>
            <div className='card-body p-6'>
              <h4 className='fw-bold text-gray-800 mb-4'>Client Information</h4>
              <div className='row'>
                <div className='col-md-4 mb-3'>
                  <span className='text-muted fs-7'>Name:</span>
                  <div className='fw-bold text-gray-800 fs-6'>{ selectedClient.name }</div>
                </div>
                <div className='col-md-4 mb-3'>
                  <span className='text-muted fs-7'>Phone:</span>
                  <div className='fw-bold text-gray-800 fs-6'>{ selectedClient.phone }</div>
                </div>
                <div className='col-md-4 mb-3'>
                  <span className='text-muted fs-7'>Email:</span>
                  <div className='fw-bold text-gray-800 fs-6'>{ selectedClient.email }</div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: Time Slot Selection */ }
          <div className='mb-10'>
            <label className='form-label fw-bold fs-4 text-gray-800 mb-5'>
              <span className='badge badge-circle badge-primary me-3'>1</span>
              <i className='bi bi-clock-fill text-primary me-2'></i>
              Select Time Slot
            </label>
            <div className='row g-4'>
              { timeSlots.map((slot) => {
                const availableTrainers = getAvailableTrainersForSlot(slot.id)
                const hasAvailability = availableTrainers.length > 0
                const isSelected = selectedTimeSlot === slot.id

                return (
                  <div
                    key={ slot.id }
                    className='col-md-4'>
                    <div
                      className={ `card cursor-pointer time-slot-card position-relative ${isSelected
                          ? 'border-3 border-primary shadow-sm bg-light-primary'
                          : hasAvailability
                            ? 'border-3 border-gray-300'
                            : 'border-3 border-gray-200 bg-light-danger'
                        }` }
                      onClick={ () => {
                        if (hasAvailability) {
                          setSelectedTimeSlot(slot.id)
                          setSelectedTrainer('')
                        }
                      } }
                      style={ {
                        cursor: hasAvailability ? 'pointer' : 'not-allowed',
                        opacity: hasAvailability ? 1 : 0.6,
                        height: '180px',
                      } }>
                      { isSelected && (
                        <div className='position-absolute top-0 end-0 m-3'>
                          <i className='bi bi-check-circle-fill text-info fs-2'></i>
                        </div>
                      ) }
                      <div className='card-body p-5 text-center position-relative d-flex flex-column justify-content-center'>
                        <i
                          className={ `bi bi-clock fs-2x mb-3 ${isSelected
                              ? 'text-info'
                              : hasAvailability
                                ? 'text-muted'
                                : 'text-danger'
                            }` }></i>
                        <div
                          className={ `fw-bold fs-6 mb-3 ${isSelected
                              ? 'text-info'
                              : hasAvailability
                                ? 'text-gray-800'
                                : 'text-danger'
                            }` }>
                          { slot.time }
                        </div>
                        <span
                          className={ `mx-auto badge ${hasAvailability ? 'badge-light-success' : 'badge-light-danger'
                            }` }>
                          { availableTrainers.length } Trainer
                          { availableTrainers.length !== 1 ? 's' : '' } Available
                        </span>

                        { !hasAvailability && (
                          <div className='position-absolute top-0 end-0 p-3'>
                            <span className='badge badge-danger'>Full</span>
                          </div>
                        ) }
                      </div>
                    </div>
                  </div>
                )
              }) }
            </div>
          </div>

          {/* STEP 2: Trainer Selection */ }
          { selectedTimeSlot && (
            <div className='mb-8'>
              <label className='form-label fw-bold fs-4 text-gray-800 mb-5'>
                <span className='badge badge-circle badge-primary me-3'>2</span>
                <i className='bi bi-people-fill text-primary me-2'></i>
                Select Available Trainer for{ ' ' }
                { timeSlots.find((s) => s.id === selectedTimeSlot)?.time }
              </label>

              <div className='alert alert-warning bg-light-warning text-warning border border-warning d-flex align-items-center mb-5'>
                <i className='bi bi-info-circle-fill text-warning fs-2 me-3'></i>
                <div>
                  <strong>Suggestion:</strong> Only trainers with the lowest client count in this
                  time slot are shown to ensure balanced workload.
                </div>
              </div>

              { getAvailableTrainersForSlot(selectedTimeSlot).length === 0 ? (
                <div className='alert alert-danger'>
                  <i className='bi bi-exclamation-triangle-fill me-2'></i>
                  All trainers are full for this time slot! Please select a different time slot.
                </div>
              ) : (
                <div
                  className='row g-4'
                  style={ { minHeight: '200px' } }>
                  { trainers.map((trainer) => {
                    const slotLoad = getTrainerSlotLoad(trainer._id, selectedTimeSlot)
                    const isDisabled = isTrainerDisabledForSlot(trainer._id, selectedTimeSlot)
                    const isSelected = selectedTrainer === trainer._id

                    return (
                      <div
                        key={ trainer._id }
                        className='col-xl-4 col-lg-6'
                        style={ { display: 'flex' } }>
                        <div
                          className={ `card trainer-card w-100 ${isDisabled
                              ? 'border-gray-200 border-1 bg-light-secondary opacity-50'
                              : isSelected
                                ? 'border-primary border-3 shadow-sm'
                                : 'border-gray-300 border-1'
                            }` }
                          onClick={ () => {
                            if (!isDisabled) {
                              setSelectedTrainer(trainer._id)
                            }
                          } }
                          style={ {
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            pointerEvents: isDisabled ? 'none' : 'auto',
                            minHeight: '200px',
                          } }>
                          <div className='card-body p-6 position-relative'>
                            { isDisabled && (
                              <div className='position-absolute top-0 end-0 m-4'>
                                <span className='badge badge-secondary'>
                                  <i className='bi bi-lock-fill me-1'></i>
                                  Unavailable
                                </span>
                              </div>
                            ) }

                            <div className='d-flex align-items-center mb-4'>
                              <div
                                className='symbol symbol-50px me-3'
                                style={ {
                                  background: isDisabled
                                    ? 'linear-gradient(135deg, #aaa 0%, #888 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                } }>
                                <span className='symbol-label text-white fw-bold fs-4'>
                                  { trainer.name.charAt(0) }
                                </span>
                              </div>
                              <div className='flex-grow-1'>
                                <h5
                                  className={ `mb-1 fw-bold ${isDisabled ? 'text-muted' : 'text-gray-800'
                                    }` }>
                                  { trainer.name }
                                </h5>
                                <span className='text-muted fs-7'>{ trainer.email }</span>
                              </div>
                              { isSelected && !isDisabled && (
                                <i className='bi bi-check-circle-fill text-primary fs-1'></i>
                              ) }
                            </div>

                            <div className='separator separator-dashed my-4'></div>

                            <div className='d-flex justify-content-between mb-3'>
                              <span className='text-muted fs-7'>Load in this time slot:</span>
                              <span
                                className={ `fw-bold ${isDisabled ? 'text-muted' : 'text-gray-800'
                                  }` }>
                                { slotLoad }/7
                              </span>
                            </div>
                            <div className='progress h-8px mb-3'>
                              <div
                                className={ `progress-bar ${isDisabled
                                    ? 'bg-secondary'
                                    : slotLoad >= 7
                                      ? 'bg-danger'
                                      : slotLoad >= 4
                                        ? 'bg-warning'
                                        : 'bg-success'
                                  }` }
                                style={ {
                                  width: `${(slotLoad / 7) * 100}%`,
                                } }></div>
                            </div>

                            <div className='d-flex justify-content-between'>
                              <span className='text-muted fs-7'>Total clients:</span>
                              <span className='fw-bold text-gray-800'>
                                { getTotalTrainerLoad(trainer._id) }
                              </span>
                            </div>

                            { isDisabled && (
                              <div className='mt-4 text-center'>
                                <small className='text-muted'>
                                  <i className='bi bi-info-circle me-1'></i>
                                  Other trainers need to be assigned first
                                </small>
                              </div>
                            ) }
                          </div>
                        </div>
                      </div>
                    )
                  }) }
                </div>
              ) }
            </div>
          ) }

          {/* Action Buttons */ }
          <div className='d-flex justify-content-end gap-3 mt-8 pt-5 border-top'>
            <button
              className='btn btn-danger px-8'
              onClick={ () => navigate(-1) }>
              <i className='bi bi-x-circle me-2'></i>
              Cancel
            </button>
            <button
              className='btn btn-primary px-8'
              onClick={ handleAssignTrainer }
              disabled={ !selectedTrainer || !selectedTimeSlot }>
              <i className='bi bi-check-circle me-2'></i>
              Assign Trainer
            </button>
          </div>
        </div>
      </KTCard>

      <style>{ `
        .trainer-card:not(.opacity-50):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
          transition: all 0.3s ease;
        }

        .time-slot-card:hover:not([style*="not-allowed"]) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
          transition: all 0.3s ease;
        }

        .progress {
          border-radius: 4px;
          overflow: hidden;
        }

        .badge {
          font-weight: 600;
          padding: 0.5rem 0.75rem;
        }

        .opacity-50 {
          opacity: 0.5 !important;
        }

        .bg-light-secondary {
          background-color: #f5f5f5 !important;
        }

        .bg-light-info {
          background-color: #d1ecf1 !important;
        }

        .border-3 {
          border-width: 3px !important;
        }

        .border-info {
          border-color: #0dcaf0 !important;
        }

        .text-info {
          color: #0dcaf0 !important;
        }
      `}</style>
    </>
  )
}

export default AdajanBranchTrainerAssign
