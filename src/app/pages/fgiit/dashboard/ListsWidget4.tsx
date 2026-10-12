/* eslint-disable jsx-a11y/anchor-is-valid */
import { faBookMedical, faClipboardList, faTableColumns } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
	className: string
	items?: number
	dashboardData?: any
}

const ListsWidget4: React.FC<Props> = ({ className, items = 6, dashboardData }) => {
	return (
		<div className='card card-xl-stretch mb-xl-8'>
			<div>
				<div className='card-header border-0 pt-5'>
					<h3 className='card-title align-items-start flex-column'>
						<span className='card-label fw-bold text-dark'>FWG</span>
					</h3>
				</div>

				<div className='card-body pt-5'>
					<Link to='/fgiit/fitness-plan'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faBookMedical}
										className='text-primary fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>Fitness Plan</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/free-session'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faClipboardList}
										className='text-danger fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										Free Session Registration
									</div>
								</div>
							</div>
						</div>
					</Link>

					<Link to='/fgiit/rtp-consultancy'>
						<div className='d-flex align-items-sm-center mb-7'>
							<div className='symbol symbol-50px me-5'>
								<span className='symbol-label'>
									<FontAwesomeIcon
										icon={faTableColumns}
										className='text-info fs-3'
									/>
								</span>
							</div>
							<div className='d-flex align-items-center flex-row-fluid flex-wrap'>
								<div className='flex-grow-1 me-2'>
									<div className='text-gray-800  fs-6 fw-bold'>
										RTP Consultancy
									</div>
								</div>
							</div>
						</div>
					</Link>

					{/* <Link to='/fgiit/'>
          <div className='d-flex align-items-sm-center mb-7'>
            <div className='symbol symbol-50px me-5'>
              <span className='symbol-label'>
                <FontAwesomeIcon
                  icon={faUpRightFromSquare}
                  className='text-warning fs-3'
                />
              </span>
            </div>
            <div className='d-flex align-items-center flex-row-fluid flex-wrap'>
              <div className='flex-grow-1 me-2'>
                <a href='#' className='text-gray-800  fs-6 fw-bold'>
                  Old Admin Panel
                </a>
              </div>
            </div>
          </div>
          </Link>

          <Link to='/fgiit/'>
          <div className='d-flex align-items-sm-center mb-7'>
            <div className='symbol symbol-50px me-5'>
              <span className='symbol-label'>
                <FontAwesomeIcon
                  icon={faUsersViewfinder}
                  className='text-dark fs-3'
                />
              </span>
            </div>
            <div className='d-flex align-items-center flex-row-fluid flex-wrap'>
              <div className='flex-grow-1 me-2'>
                <a href='#' className='text-gray-800  fs-6 fw-bold'>
                  Admin To Team Member
                </a>
              </div>
            </div>
          </div>
          </Link> */}
				</div>
			</div>
		</div>
	)
}

export { ListsWidget4 }
