import React, { useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import TableButton from '../../../components/TableButton'
import UsersListPagination from '../../../components/TablePagination'
import LengthMenu from '../../../components/LengthMenu'

interface TrainerRow {
  _id: string
  name: string
  phone: string
  email: string
  totalClients: number
  image?: string
}

const DUMMY_TRAINERS: TrainerRow[] = [
  { _id: '1', name: 'Virat', phone: '9876543210', email: 'virat@gym.com', totalClients: 5, image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=300&auto=format&fit=crop' },
  { _id: '2', name: 'Ram', phone: '9123456789', email: 'ram@gym.com', totalClients: 3, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=300&auto=format&fit=crop' },
  { _id: '3', name: 'Gopal', phone: '9988776655', email: 'gopal@gym.com', totalClients: 4, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300&auto=format&fit=crop' },
  { _id: '4', name: 'Suresh', phone: '9876543211', email: 'suresh@gym.com', totalClients: 2, image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=300&auto=format&fit=crop' },
  { _id: '5', name: 'Mahesh', phone: '9876543212', email: 'mahesh@gym.com', totalClients: 6, image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=300&auto=format&fit=crop' },
  { _id: '6', name: 'Ramesh', phone: '9876543213', email: 'ramesh@gym.com', totalClients: 1, image: 'https://images.unsplash.com/photo-1597347343908-2937e7dcc560?q=80&w=300&auto=format&fit=crop' },
]

const DashboardTrainerTable: React.FC = () => {
  const [trainers] = useState<TrainerRow[]>(DUMMY_TRAINERS)
  const [pagination, setPagination] = useState({
    page: 1,
    itemsPerPage: 5,
  })

  // Pagination logic
  const totalPages = Math.ceil(trainers.length / pagination.itemsPerPage)
  const paginatedTrainers = trainers.slice(
    (pagination.page - 1) * pagination.itemsPerPage,
    pagination.page * pagination.itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleItemsPerPageChange = (value: number) => {
    setPagination({ ...pagination, itemsPerPage: value, page: 1 })
  }

  return (
    <KTCard>
      <div className='card-header border-0 pt-6'>
        <div className='d-flex flex-wrap align-items-center justify-content-between w-100'>
          <h3 className='card-title fw-bold'>Adajan-Branch Trainers</h3>
          <LengthMenu expenseData={trainers} handleItemsPerPageChange={handleItemsPerPageChange} />
        </div>
      </div>
      <div className='py-4 card-body'>
        <div className='table-responsive'>
          <table className='table align-middle table-row-dashed gy-5'>
            <thead>
              <tr className='text-start text-muted fw-bold text-uppercase gs-0'>
                <th className='min-w-50px text-center'>No.</th>
                <th className='min-w-150px text-center'>Name</th>
                <th className='min-w-125px text-center'>Phone</th>
                <th className='min-w-200px text-center'>Email</th>
                <th className='min-w-100px text-center'>Total Members</th>
                <th className='min-w-100px text-center'>Action</th>
              </tr>
            </thead>
            <tbody className='fw-semibold'>
              {paginatedTrainers.map((trainer, index) => (
                <tr key={trainer._id}>
                  <td className='text-center'>
                    <span className='text-dark fw-bold fs-6'>
                      {(pagination.page - 1) * pagination.itemsPerPage + index + 1}
                    </span>
                  </td>
                  <td><span className='text-dark fw-bold fs-6'>{trainer.name}</span></td>
                  <td><span className='text-dark fs-6'>{trainer.phone}</span></td>
                  <td><span className='text-dark fs-6'>{trainer.email}</span></td>
                  <td className='text-center'>
                    <span className='text-dark fw-bold fs-6'>{trainer.totalClients}</span>
                  </td>
                  <td className='text-center align-middle'>
                    <TableButton action='view' to='/adajan-branch/trainer/list' />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {trainers.length > 0 && (
          <div className='mt-5'>
            <UsersListPagination
              totalPages={totalPages}
              currentPage={pagination.page}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </KTCard>
  )
}

export { DashboardTrainerTable }
