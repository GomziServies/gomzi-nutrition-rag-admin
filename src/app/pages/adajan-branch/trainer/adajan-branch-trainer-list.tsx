import { faCircleXmark, faPlusCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import DateFilter from '../../../components/DateRangePicker'
import LengthMenu from '../../../components/LengthMenu'
import SearchFilter from '../../../components/SearchFilter'
import Table from '../../../components/Table'
import UsersListPagination from '../../../components/TablePagination'
import {
  GetAdajanBranchClient,
  UpdateAdajanBranchClient,
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

const AdajanBranchTrainerList: React.FC = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 10,
  })
  const [sort, setSort] = useState('name')
  const [sortOrder, setSortOrder] = useState<QuerySortOptions>('asc')
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null)

  // FILTER STATES
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Fetch Data
  const fetchTrainers = async () => {
    try {
      const response: any = await GetAdajanBranchEmployees({
        page: 1,
        limit: 1000,
        position: 'Trainer',
      })
      if (response.data) {
        return response.data.map((t: any) => ({
          _id: t._id,
          name: t.name,
          phone: t.mobile,
          email: t.email,
          timeSlotAssignments: {},
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching trainers:', error)
      toast.error('Failed to load trainers')
      return []
    }
  }

  const fetchClients = async () => {
    try {
      const response: any = await GetAdajanBranchClient({
        page: 1,
        limit: 1000,
      })
      if (response.data) {
        return response.data.map((c: any) => ({
          _id: c._id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          assignedTrainer: c.assignedTrainer?._id || c.assignedTrainer,
          timeSlotId: c.timeSlotId,
          timeSlot: c.timeSlot,
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
      return []
    }
  }

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const loadedClients = await fetchClients()
      const loadedTrainers = await fetchTrainers()

      // Build timeSlotAssignments from loadedClients (API Data)
      const byTrainer: { [trainerId: string]: { [slotId: string]: string[] } } = {}

      // Initialize for all trainers
      loadedTrainers.forEach((t: Trainer) => {
        byTrainer[t._id] = {}
      })

      loadedClients.forEach((client: Client) => {
        if (client.assignedTrainer && client.timeSlotId) {
          const tId = client.assignedTrainer
          const sId = client.timeSlotId

          if (byTrainer[tId]) {
            if (!byTrainer[tId][sId]) byTrainer[tId][sId] = []
            byTrainer[tId][sId].push(client._id)
          }
        }
      })

      const updatedTrainers = loadedTrainers.map((t: Trainer) => ({
        ...t,
        timeSlotAssignments: byTrainer[t._id] || {},
      }))

      setClients(loadedClients)
      setTrainers(updatedTrainers)
      setLoading(false)
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

  const handleAssignClick = (client: Client) => {
    // Navigate to assign page with client ID
    navigate(`/adajan-branch/trainer/assign?id=${client._id}`)
  }

  // ... existing code ...

  const handleUnassignTrainer = async (client: Client) => {
    if (!client.assignedTrainer || !client.timeSlotId) return

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to unassign the trainer from ${client.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, unassign it!',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const response: any = await UpdateAdajanBranchClient({
        id: client._id,
        assignedTrainer: null,
        timeSlot: null,
        timeSlotId: null,
      })

      if (response.status === 200) {
        // Update local state to reflect changes immediately
        const trainerId = client.assignedTrainer
        const timeSlotId = client.timeSlotId

        setClients((prevClients) =>
          prevClients.map((c) =>
            c._id === client._id
              ? {
                ...c,
                assignedTrainer: undefined,
                assignedDate: undefined,
                timeSlot: undefined,
                timeSlotId: undefined,
              }
              : c
          )
        )

        setTrainers((prevTrainers) =>
          prevTrainers.map((trainer) => {
            if (trainer._id === trainerId) {
              const updatedAssignments = { ...trainer.timeSlotAssignments }
              if (updatedAssignments[timeSlotId]) {
                updatedAssignments[timeSlotId] = updatedAssignments[timeSlotId].filter(
                  (id) => id !== client._id
                )
                if (updatedAssignments[timeSlotId].length === 0) {
                  delete updatedAssignments[timeSlotId]
                }
              }
              return {
                ...trainer,
                timeSlotAssignments: updatedAssignments,
              }
            }
            return trainer
          })
        )

        Swal.fire('Unassigned!', `Trainer has been unassigned from ${client.name}.`, 'success')
      } else {
        toast.error('Failed to unassign trainer')
      }
    } catch (error) {
      console.error('Error unassigning trainer:', error)
      toast.error('An error occurred while unassigning trainer')
    }
  }

  const handleDateRangeChange = (range: [Date, Date] | null) => {
    setSelectedDateRange(range)
    /* date j change thay tyare pagination/table na badlavo - Assigned Trainer, Status UI same j rahe */
  }

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value })
  }

  const getTrainerName = (trainerId: string) => {
    const trainer = trainers.find((t) => t._id === trainerId)
    return trainer ? trainer.name : 'Unknown'
  }

  const sortableFields = [
    { title: 'Client Name', field: 'name' },
    { title: 'Phone', field: 'phone' },
    { title: 'Email', field: 'email' },
    { title: 'Assigned Trainer', field: 'assignedTrainer' },
    { title: 'Status', field: 'status' },
  ]

  const handleSortChange = (newSort: string, newSortOrder: QuerySortOptions) => {
    setSort(newSort)
    setSortOrder(newSortOrder)
  }

  const handleRowClick = (id: string) => {
    if (window.innerWidth <= 1024) {
      setVisibleDetails(visibleDetails === id ? null : id)
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'assigned' && client.assignedTrainer) ||
      (filterStatus === 'pending' && !client.assignedTrainer)

    return matchesSearch && matchesStatus
  })

  const isFilterActive = filterStatus !== 'all' || searchTerm !== '' || selectedDateRange !== null

  return (
    <>
      <PageTitle breadcrumbs={ [] }>Trainer Assignment Management</PageTitle>

      {/* Trainer Overview Cards */ }
      <div className='row g-5 mb-5'>
        { trainers.map((trainer) => {
          const totalClients = getTotalTrainerLoad(trainer._id)
          const maxPossibleClients = timeSlots.length * 7

          return (
            <div
              key={ trainer._id }
              className='col-xl-4 col-md-6'>
              <div className='card card-custom shadow-sm border-0 h-100'>
                <div className='card-body p-6'>
                  <div className='d-flex align-items-center mb-4'>
                    <div
                      className='symbol symbol-50px me-4'
                      style={ {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      } }>
                      <span className='symbol-label text-white fw-bold fs-3'>
                        { trainer.name.charAt(0) }
                      </span>
                    </div>
                    <div className='flex-grow-1'>
                      <h3 className='mb-1 fw-bolder text-gray-800'>{ trainer.name }</h3>
                      <span className='text-muted fs-7'>{ trainer.email }</span>
                    </div>
                    <div>
                      <span
                        className={ `badge badge-lg ${totalClients >= maxPossibleClients
                            ? 'bg-danger text-white'
                            : totalClients >= maxPossibleClients * 0.7
                              ? 'bg-warning text-dark'
                              : 'bg-success text-white'
                          }` }>
                        { totalClients } Clients
                      </span>
                    </div>
                  </div>

                  <div className='separator separator-dashed my-4'></div>

                  <div className='mb-3'>
                    <h6 className='text-muted fs-8 mb-2'>Time Slot Usage:</h6>
                    <div className='d-flex flex-wrap gap-2'>
                      { timeSlots.map((slot) => {
                        const slotLoad = getTrainerSlotLoad(trainer._id, slot.id)
                        // Get client names for this trainer and slot
                        const clientNames = clients
                          .filter(
                            (c) => c.assignedTrainer === trainer._id && c.timeSlotId === slot.id
                          )
                          .map((c) => c.name)
                        const tooltip =
                          clientNames.length > 0 ? clientNames.join(', ') : 'No clients assigned'
                        return (
                          <span
                            key={ slot.id }
                            className={ `badge ${slotLoad >= 7
                                ? 'bg-danger text-white'
                                : slotLoad >= 4
                                  ? 'bg-light-warning text-warning'
                                  : 'bg-light-success text-success'
                              }` }
                            title={ tooltip }
                            style={ { cursor: 'pointer' } }>
                            { slot.time.split(' - ')[0] }: { slotLoad }/7
                          </span>
                        )
                      }) }
                    </div>
                  </div>

                  <div className='separator separator-dashed my-3'></div>

                  <div className='d-flex justify-content-between align-items-center'>
                    <span className='text-muted fs-7'>Total Clients:</span>
                    <span className='fw-bold text-gray-800'>{ totalClients }</span>
                  </div>
                  {/* <div className='mt-2'>
                    <span className='text-muted fs-8'>Phone: {trainer.phone}</span>
                  </div> */}
                </div>
              </div>
            </div>
          )
        }) }
      </div>

      {/* Main Table Card */ }
      <KTCard>
        <div className='row justify-content-between mt-7 mx-6'>
          <div className='col-md-9'>
            <h3 className='card-title align-items-start flex-column'>
              <span className='card-label fw-bold fs-3 mb-1'>Trainer Assignment Management</span>
            </h3>
          </div>
        </div>

        <div className='card-header row border-0 pt-6'>
          <div className='col-md-12 d-flex justify-content-between pe-md-10 flex-wrap gap-3'>
            <div className='d-flex align-items-center gap-3 flex-wrap'>
              <SearchFilter
                searchTerm={ searchTerm }
                setSearchTerm={ setSearchTerm }
              />
              <select
                className='form-select form-select-solid form-select-sm w-auto'
                value={ filterStatus }
                onChange={ (e) => {
                  setFilterStatus(e.target.value)
                  setPagination({ ...pagination, page: 1 })
                } }>
                <option value='all'>All Status</option>
                <option value='assigned'>Assigned</option>
                <option value='pending'>Pending</option>
              </select>
              <div className='d-md-block d-none'>
                <LengthMenu
                  expenseData={ filteredClients }
                  handleItemsPerPageChange={ handleItemsPerPageChange }
                />
              </div>
            </div>
            <div className='d-flex align-items-center gap-3'>
              <DateFilter onDateRangeChange={ handleDateRangeChange } />
            </div>
          </div>
          <div className='col-md-3 d-flex d-md-none justify-content-between p-0 mt-3'>
            <LengthMenu
              expenseData={ filteredClients }
              handleItemsPerPageChange={ handleItemsPerPageChange }
            />
          </div>
        </div>

        <div className='py-4 card-body'>
          <div className='table-responsive'>
            <Table
              data={ filteredClients.slice(
                (pagination.page - 1) * pagination.itemsPerPage,
                pagination.page * pagination.itemsPerPage
              ) }
              columns={ sortableFields }
              sort={ sort }
              sortOrder={ sortOrder }
              onSortChange={ handleSortChange }
              renderRow={ (
                client: Client,
                index: number,
                actualIndex: number,
                isVisible: boolean
              ) => {
                return (
                  <React.Fragment key={ client._id }>
                    <tr
                      onClick={ () => handleRowClick(client._id) }
                      className='data-row'>
                      <td className='text-center align-middle'>
                        <div className='d-flex align-items-center justify-content-center'>
                          <FontAwesomeIcon
                            icon={ faPlusCircle }
                            className='mx-2 mb-1 plus-icon'
                            style={ { color: '#607D8B', fontSize: '18px' } }
                          />
                          <span className='text-dark fw-bold d-block mb-1 fs-6'>{ actualIndex }</span>
                        </div>
                      </td>
                      <td className='text-start align-middle px-4'>
                        <span className='text-dark fw-bold fs-6'>{ client.name }</span>
                      </td>
                      <td className='text-start align-middle px-4'>
                        <span className='text-dark fw-bold d-block mb-1 fs-6'>{ client.phone }</span>
                      </td>
                      <td className='text-start align-middle px-4'>
                        <span className='text-dark fw-bold d-block mb-1 fs-6'>{ client.email }</span>
                      </td>
                      <td className='text-center align-middle'>
                        { client.assignedTrainer ? (
                          <div className='d-flex align-items-center justify-content-center'>
                            <div
                              className='symbol symbol-30px me-2'
                              style={ {
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              } }>
                              { getTrainerName(client.assignedTrainer) !== 'Unknown' && (
                                <span className='symbol-label text-white fw-bold fs-7'>
                                  { getTrainerName(client.assignedTrainer).charAt(0) }
                                </span>
                              ) }
                            </div>
                            <span className='text-dark fw-bold'>
                              { getTrainerName(client.assignedTrainer) }
                            </span>
                          </div>
                        ) : (
                          <span className='badge badge-light-warning'>Not Assigned</span>
                        ) }
                      </td>
                      <td className='text-center align-middle'>
                        { client.assignedTrainer ? (
                          <span className='badge badge-light-success'>Assigned</span>
                        ) : (
                          <span className='badge badge-light-danger'>Pending</span>
                        ) }
                      </td>
                      <td className='text-center align-middle'>
                        { client.assignedTrainer ? (
                          <button
                            className='btn btn-sm btn-light-danger d-flex align-items-center justify-content-center gap-2'
                            onClick={ (e) => {
                              e.stopPropagation()
                              handleUnassignTrainer(client)
                            } }>
                            <FontAwesomeIcon icon={ faCircleXmark } /> Unassign
                          </button>
                        ) : (
                          <button
                            className='btn btn-sm btn-light-primary d-flex align-items-center justify-content-center gap-2'
                            onClick={ (e) => {
                              e.stopPropagation()
                              handleAssignClick(client)
                            } }>
                            <FontAwesomeIcon icon={ faUserPlus } /> Assign
                          </button>
                        ) }
                      </td>
                    </tr>
                    { isVisible && (
                      <tr className={ `detail-row ${isVisible ? 'is-visible' : ''}` }>
                        <td colSpan={ 12 }>
                          <div>
                            <div className='mb-3'>
                              <span className='text-dark fw-bold fs-6'>{ client.name }</span>
                            </div>
                            <strong>Phone:</strong> { client.phone }
                            <br />
                            <strong>Email:</strong> { client.email }
                            <br />
                            <strong>Trainer:</strong>{ ' ' }
                            { client.assignedTrainer
                              ? getTrainerName(client.assignedTrainer)
                              : 'Not Assigned' }
                            <br />
                            <strong>Time Slot:</strong> { client.timeSlot || 'N/A' }
                          </div>
                        </td>
                      </tr>
                    ) }
                  </React.Fragment>
                )
              } }
              visibleDetails={ visibleDetails }
              pagination={ pagination }
              setPagination={ setPagination }
              loading={ loading }
            />
          </div>

          { filteredClients.length === 0 && !loading && (
            <div className='d-flex text-center w-100 align-content-center justify-content-center mt-5'>
              <div>
                <i className='bi bi-inbox fs-1 text-muted mb-3'></i>
                <h5 className='text-muted'>No records found</h5>
                { isFilterActive && <p className='text-muted fs-7'>Try adjusting your filters.</p> }
              </div>
            </div>
          ) }

          { filteredClients.length > 0 && (
            <UsersListPagination
              totalPages={ Math.ceil(filteredClients.length / pagination.itemsPerPage) }
              currentPage={ pagination.page }
              onPageChange={ handlePageChange }
            />
          ) }
        </div>
      </KTCard>

      <style>{ `
        /* Table - dark text only for No., Name, Phone, Email (Assigned Trainer & Status nu original UI revade) */
        .table tr.data-row td:nth-child(1),
        .table tr.data-row td:nth-child(2),
        .table tr.data-row td:nth-child(3),
        .table tr.data-row td:nth-child(4),
        .table tr.data-row td:nth-child(7) {
          color: #1e293b !important;
        }
        .table tr.data-row td:nth-child(1) span,
        .table tr.data-row td:nth-child(2) span,
        .table tr.data-row td:nth-child(3) span,
        .table tr.data-row td:nth-child(4) span {
          color: #1e293b !important;
        }

        /* Hover effect - khali mouse hover kare tyare j transform thay */
        .trainer-card:not(.opacity-50):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease;
        }

        .time-slot-card:hover:not([style*="not-allowed"]) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease;
        }

        /* Trainer overview cards */
        .card-custom {
          transition: all 0.3s ease;
        }

        .card-custom:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
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

        /* Fixed height for boxes - size na vadhe */
        .time-slot-card {
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .trainer-card {
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </>
  )
}

export default AdajanBranchTrainerList
