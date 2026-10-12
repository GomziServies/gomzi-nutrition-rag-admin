import React, { useEffect, useState } from 'react'
import { KTCard } from '../../../../_metronic/helpers'
import GoogleMapReact from 'google-map-react'
import Chart from 'react-apexcharts' // Add this import for charts

// Add this new import for the consolidated API function
import { GetFGIITMatrixData } from '../../../Functions/FGGroup'

interface Student {
  _id: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  createdAt: string
  course_category?: string
  address?: {
    country?: string
    city?: string
  }
}

interface Course {
  _id: string
  course_name: string
  course_category: string
  coaching_mode: string
  createdAt: string
  status: boolean
  studentCount?: number
}

interface PlacementRequest {
  _id: string
  user_id: string
  status: string
  company_name?: string
  position?: string
  createdAt: string
}

interface JobPlacement {
  _id: string
  company_name: string
  title: string
  vacancies: number
  createdAt: string
  start_date: string
  end_date: string
}

interface User {
  _id: string
  first_name: string
  last_name: string
  email: string
  mobile: string
  createdAt: string
  address?: {
    city?: string
    state?: string
    country?: string
    address_line_1?: string
    address_line_2?: string
  }
  status?: string
}

interface UserLocation {
  userId: string
  userName: string
  city: string
  state: string
  country: string
  lat: number
  lng: number
}

interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  info: string
}

// Pagination helper functions
const paginate = (items: any[], currentPage: number, itemsPerPage: number) => {
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  return items.slice(indexOfFirstItem, indexOfLastItem)
}

const getTotalPages = (items: any[], itemsPerPage: number) => {
  return Math.ceil(items.length / itemsPerPage)
}

// Add this function to fetch coordinates from Nominatim API
const fetchCoordinates = async (city: string, state: string, country: string): Promise<{lat: number, lng: number} | null> => {
  try {
    // Create a key for the coordinates array in localStorage
    const coordinatesArrayKey = 'fgiitCoordinatesArray';
    
    // Get existing coordinates array from localStorage
    const cachedArrayString = localStorage.getItem(coordinatesArrayKey);
    let coordinatesArray: { key: string; lat: number; lng: number; timestamp: number }[] = [];
    
    if (cachedArrayString) {
      try {
        coordinatesArray = JSON.parse(cachedArrayString);
      } catch (parseError) {
        console.warn('Failed to parse coordinates array, starting fresh');
        coordinatesArray = [];
      }
    }
    
    // Create a cache key for this specific location
    const cacheKey = `${city}-${state}-${country}`;
    
    // Look for existing coordinates in the array
    const existingEntry = coordinatesArray.find(entry => entry.key === cacheKey);
    
    // Check if we have a recent cache (less than 7 days old)
    if (existingEntry && Date.now() - existingEntry.timestamp < 7 * 24 * 60 * 60 * 1000) {
      return { lat: existingEntry.lat, lng: existingEntry.lng };
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}&format=json&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      // Update or add to the coordinates array
      if (existingEntry) {
        existingEntry.lat = result.lat;
        existingEntry.lng = result.lng;
        existingEntry.timestamp = Date.now();
      } else {
        coordinatesArray.push({
          key: cacheKey,
          ...result,
          timestamp: Date.now()
        });
      }
      
      // Save the updated array back to localStorage
      localStorage.setItem(coordinatesArrayKey, JSON.stringify(coordinatesArray));
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
};

function FgiitMatrix() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [placementRequests, setPlacementRequests] = useState<PlacementRequest[]>([])
  const [jobPlacements, setJobPlacements] = useState<JobPlacement[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  
  // Pagination state for courses
  const [coursesPage, setCoursesPage] = useState(1)
  const [coursesPerPage] = useState(10)
  
  // Pagination state for job placements
  const [jobPlacementsPage, setJobPlacementsPage] = useState(1)
  const [jobPlacementsPerPage] = useState(10)
  
  // Pagination state for placement requests
  const [placementRequestsPage, setPlacementRequestsPage] = useState(1)
  const [placementRequestsPerPage] = useState(10)

  // Chart data states
  const [courseCategoryChartData, setCourseCategoryChartData] = useState<any>({})
  const [countryDistributionChartData, setCountryDistributionChartData] = useState<any>({})
  const [placementStatusChartData, setPlacementStatusChartData] = useState<any>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Use the consolidated API endpoint instead of multiple separate calls
        const response: any = await GetFGIITMatrixData()
        
        // Check if the response is successful based on status code
        if (response && response.status === 200) {
          // Ensure we have arrays even if data is missing
          setStudents(Array.isArray(response.data?.students) ? response.data.students : [])
          setCourses(Array.isArray(response.data?.courses) ? response.data.courses : [])
          setPlacementRequests(Array.isArray(response.data?.placementRequests) ? response.data.placementRequests : [])
          setJobPlacements(Array.isArray(response.data?.jobPlacements) ? response.data.jobPlacements : [])
          setUsers(Array.isArray(response.data?.users) ? response.data.users : [])
          
          // Process user locations for map
          processUserLocations(Array.isArray(response.data?.users) ? response.data.users : [])
        } else {
          throw new Error(response?.message || 'Failed to fetch FGIIT Matrix data')
        }
        
        setError(null)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError('Failed to fetch data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Process user locations for map display
  const processUserLocations = async (usersData: User[]) => {
    try {
      setMapLoading(true)
      setMapError(null)
      
      // Check if we have cached map markers
      const cachedMapMarkers = localStorage.getItem('fgiitMapMarkers')
      const cachedTimestamp = localStorage.getItem('fgiitMapMarkersTimestamp')
      
      // If we have cached data that's less than 1 hour old, use it
      if (cachedMapMarkers && cachedTimestamp && 
          Date.now() - parseInt(cachedTimestamp) < 60 * 60 * 1000) {
        try {
          const parsedMarkers = JSON.parse(cachedMapMarkers)
          setMapMarkers(parsedMarkers)
          setMapLoading(false)
          return
        } catch (e) {
          console.warn('Failed to parse cached map markers, fetching fresh data')
        }
      }
      
      const locationData: UserLocation[] = []
      const markerData: MapMarker[] = []
      
      // Process users to get location data
      const usersWithLocations = usersData.filter(
        (user: User) => user.address?.city && user.address?.state && user.address?.country
      )
      
      // Limit to first 100 users to avoid too many API requests
      const limitedUsers = usersWithLocations.slice(0, 100)
      
      for (const user of limitedUsers) {
        try {
          const coords = await fetchCoordinates(
            user.address!.city!,
            user.address!.state!,
            user.address!.country!
          )
          
          if (coords) {
            // Create a proper user name, handling cases where first_name or last_name might be missing
            const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User'
            
            const userLocation: UserLocation = {
              userId: user._id,
              userName: userName,
              city: user.address!.city!,
              state: user.address!.state!,
              country: user.address!.country!,
              lat: coords.lat,
              lng: coords.lng
            }
            
            locationData.push(userLocation)
            
            const marker: MapMarker = {
              id: user._id,
              lat: coords.lat,
              lng: coords.lng,
              title: userName,
              info: `${user.address!.city}, ${user.address!.state}, ${user.address!.country}`
            }
            
            markerData.push(marker)
          }
        } catch (err) {
          console.warn(`Could not fetch coordinates for user ${user._id}:`, err)
        }
      }
      
      // Store markers in localStorage
      localStorage.setItem('fgiitMapMarkers', JSON.stringify(markerData))
      localStorage.setItem('fgiitMapMarkersTimestamp', Date.now().toString())
      
      setUserLocations(locationData)
      setMapMarkers(markerData)
    } catch (err: any) {
      console.error('Error processing user locations:', err)
      setMapError('Failed to load map data.')
    } finally {
      setMapLoading(false)
    }
  }

  // Add this function to refresh user locations
  const refreshUserLocations = async () => {
    try {
      setMapLoading(true)
      setMapError(null)
      
      // Clear the localStorage cache
      localStorage.removeItem('fgiitMapMarkers')
      localStorage.removeItem('fgiitMapMarkersTimestamp')
      localStorage.removeItem('fgiitCoordinatesArray')
      
      // Fetch fresh user location data using the consolidated API
      const response: any = await GetFGIITMatrixData()
      
      // Check if the response is successful based on status code
      if (response && response.status === 200) {
        // Ensure we have arrays even if data is missing
        setUsers(Array.isArray(response.data?.users) ? response.data.users : [])
        
        // Process user locations
        await processUserLocations(Array.isArray(response.data?.users) ? response.data.users : [])
      } else {
        throw new Error(response?.message || 'Failed to fetch FGIIT Matrix data')
      }
    } catch (err: any) {
      console.error('Error refreshing user locations:', err)
      setMapError('Failed to refresh map data.')
    } finally {
      setMapLoading(false)
    }
  }

  // Calculate statistics
  const totalStudents = students.length
  
  // Group students by course category
  // Handle cases where students might have multiple course categories (comma-separated)
  // This now correctly uses the course_category field populated from actual course enrollments
  const studentsByCourseCategory: Record<string, number> = {}
  students.forEach(student => {
    if (student.course_category) {
      // Split comma-separated categories and count each one
      const categories = student.course_category.split(',').map(cat => cat.trim())
      categories.forEach(category => {
        if (category) { // Only count non-empty categories
          studentsByCourseCategory[category] = (studentsByCourseCategory[category] || 0) + 1
        }
      })
    } else {
      // Count students with no course category as "Unknown"
      studentsByCourseCategory['Unknown'] = (studentsByCourseCategory['Unknown'] || 0) + 1
    }
  })
  
  // Group students by course
  // Since we now have proper course-student mapping from the backend,
  // we can improve this implementation if needed in the future
  const studentsByCourse: Record<string, Student[]> = {}
  students.forEach(student => {
    // In a real implementation, we would need to link students to specific courses
    // For now, we'll use a placeholder
    const courseId = 'Unknown Course'
    if (!studentsByCourse[courseId]) {
      studentsByCourse[courseId] = []
    }
    studentsByCourse[courseId].push(student)
  })
  
  // Group students by country
  const studentsByCountry: Record<string, number> = students.reduce((acc: Record<string, number>, student) => {
    const country = student.address?.country || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {})
  
  // Group students by city
  const studentsByCity: Record<string, number> = students.reduce((acc: Record<string, number>, student) => {
    const city = student.address?.city || 'Unknown'
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {})
  
  // Group placement requests by status
  const placementRequestsByStatus: Record<string, number> = placementRequests.reduce((acc: Record<string, number>, request) => {
    const status = request.status || 'Unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Prepare chart data
  useEffect(() => {
    // Course category chart data
    const categories = Object.keys(studentsByCourseCategory)
    const counts = Object.values(studentsByCourseCategory)
    
    setCourseCategoryChartData({
      options: {
        chart: {
          type: 'donut' as const,
          height: 350
        },
        labels: categories,
        legend: {
          position: 'bottom' as const
        },
        colors: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#f5576c', '#00f2fe', '#38f9d7'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom' as const
            }
          }
        }]
      },
      series: counts
    })

    // Country distribution chart data
    const countries = Object.keys(studentsByCountry)
    const countryCounts = Object.values(studentsByCountry)
    
    setCountryDistributionChartData({
      options: {
        chart: {
          type: 'bar' as const,
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          },
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: countries,
        },
        yaxis: {
          title: {
            text: 'Number of Students'
          }
        },
        fill: {
          opacity: 1
        },
        colors: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#f5576c', '#00f2fe', '#38f9d7'],
        tooltip: {
          y: {
            formatter: function (val: number) {
              return val + " students"
            }
          }
        }
      },
      series: [{
        name: 'Students',
        data: countryCounts
      }]
    })

    // Placement status chart data
    const statuses = Object.keys(placementRequestsByStatus)
    const statusCounts = Object.values(placementRequestsByStatus)
    
    setPlacementStatusChartData({
      options: {
        chart: {
          type: 'pie' as const,
          height: 350
        },
        labels: statuses,
        legend: {
          position: 'bottom' as const
        },
        colors: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#f5576c', '#00f2fe', '#38f9d7'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom' as const
            }
          }
        }]
      },
      series: statusCounts
    })
  }, [students, courses, placementRequests, jobPlacements, studentsByCourseCategory, studentsByCountry, placementRequestsByStatus])



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <KTCard>
        <div className="card-body">
          <div className="alert alert-danger">
            <h4 className="alert-heading">Error!</h4>
            <p>{error}</p>
          </div>
        </div>
      </KTCard>
    )
  }

  return (
    <div className="container-fluid">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(54, 153, 255, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(54, 153, 255, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(54, 153, 255, 0);
            }
          }
          
          .hover-elevate-up:hover {
            transform: translateY(-5px);
            transition: transform 0.3s ease;
          }
          
          .hover-elevate-shadow:hover {
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15) !important;
            transition: box-shadow 0.3s ease;
          }
        `
      }} />
      <div className="d-flex align-items-center mb-6">
        <h1 className="text-gray-800 fw-bolder me-2">FGIIT Dashboard</h1>
        <span className="text-muted fw-semibold fs-7">Student Analytics Overview</span>
      </div>
      
      {/* Enhanced Summary Cards with Gradient Backgrounds */}
      <div className="row g-5 mb-8">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm hover-elevate-up bg-primary text-white rounded-3" 
               style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body d-flex flex-column align-items-center">
              <span className="fs-1 fw-bold">{totalStudents}</span>
              <span className="fw-semibold fs-7 mt-2 opacity-75"><strong>Total Students</strong></span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm hover-elevate-up bg-success text-white rounded-3"
               style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="card-body d-flex flex-column align-items-center">
              <span className="fs-1 fw-bold">{courses.length}</span>
              <span className="fw-semibold fs-7 mt-2 opacity-75"><strong>Total Courses</strong></span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm hover-elevate-up bg-info text-white rounded-3"
               style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="card-body d-flex flex-column align-items-center">
              <span className="fs-1 fw-bold">{placementRequests.length}</span>
              <span className="fw-semibold fs-7 mt-2 opacity-75"><strong>Placement Requests</strong></span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm hover-elevate-up bg-warning text-white rounded-3"
               style={{ background: 'linear-gradient(135deg,rgb(55, 201, 104) 0%, #38f9d7 100%)' }}>
            <div className="card-body d-flex flex-column align-items-center">
              <span className="fs-1 fw-bold">{jobPlacements.length}</span>
              <span className="fw-semibold fs-7 mt-2 opacity-75"><strong>Job Placements</strong></span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="row g-5 mb-8">

        <div className="col-xl-12">
          <KTCard className="hover-elevate-shadow rounded-3">
            <div className="card-header border-0 pt-5">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold fs-3 text-gray-800">Students by Country</span>
                <span className="text-muted mt-1 fw-semibold fs-7">Geographic distribution of students</span>
              </h3>
            </div>
            <div className="card-body py-3">
              {countryDistributionChartData.series && countryDistributionChartData.series[0]?.data?.length > 0 ? (
                <Chart 
                  options={countryDistributionChartData.options} 
                  series={countryDistributionChartData.series} 
                  type="bar" 
                  height={350} 
                />
              ) : (
                <div className="text-center py-10">
                  <div className="text-muted fw-semibold fs-6">No country data available</div>
                </div>
              )}
            </div>
          </KTCard>
        </div>
      </div>
      {/* Courses List with Pagination */}
      <div className="row g-5 mb-8">
        <div className="col-12">
          <KTCard className="hover-elevate-shadow rounded-3 border-0" style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)', background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)' }}>
            <div className="card-header border-0 pt-5 pb-3" style={{ borderBottom: '1px solid #eff2f5' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap w-100">
                <div className="d-flex flex-column">
                  <h3 className="card-label fw-bold fs-2 text-gray-900 mb-1">
                    <i className="bi bi-journal-text text-primary me-2"></i>Courses
                  </h3>
                  <span className="text-muted fw-semibold fs-7">List of all available courses</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="symbol-group symbol-hover flex-nowrap">
                    <div className="symbol symbol-35px symbol-circle" data-bs-toggle="tooltip" title="Total Courses">
                      <span className="symbol-label bg-info text-white fw-bold">{courses.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body py-4">
              {courses.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                      <thead>
                        <tr className="fw-bold text-uppercase text-muted fs-7 gs-0">
                          <th className="min-w-175px">Course Name</th>
                          <th className="min-w-150px">Category</th>
                          <th className="min-w-125px">Mode</th>
                          <th className="min-w-100px text-center">Students</th>
                          <th className="min-w-100px text-end">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginate(courses, coursesPage, coursesPerPage).map(course => {
                          // Use the studentCount from the API instead of calculating it
                          // This is now correctly calculated on the backend using user_fitness_courses collection
                          const studentCount = course.studentCount || 0;
                          return (
                            <tr key={course._id} className="hover-elevate-up">
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="symbol symbol-45px me-5">
                                    <span className="symbol-label bg-light-primary rounded-circle">
                                      <i className="bi bi-journal fs-2 text-primary"></i>
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-start flex-column">
                                    <span className="text-dark fw-bold text-hover-primary fs-6">{course.course_name}</span>
                                    <span className="text-muted fw-semibold text-muted d-block fs-8">ID: {course._id.substring(0, 8)}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column w-100">
                                  <span className="text-dark fw-bold fs-6">{course.course_category}</span>
                                  <span className="text-muted fw-semibold d-block fs-8">Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge fs-7 fw-bold py-2 px-3 ${course.coaching_mode === 'VIRTUAL' ? 'badge-light-primary' : 'badge-light-success'}`}>
                                  <i className={`bi ${course.coaching_mode === 'VIRTUAL' ? 'bi-laptop' : 'bi-person-fill'} me-1`}></i>
                                  {course.coaching_mode}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="badge badge-light-info fs-7 fw-bold py-2 px-3">
                                  <i className="bi bi-people-fill me-1"></i>{studentCount}
                                </span>
                              </td>
                              <td className="text-end">
                                <span className={`badge fs-7 fw-bold py-2 px-3 ${course.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                                  <i className={`bi ${course.status ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                  {course.status ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls for Courses */}
                  {(() => {
                    const totalPages = getTotalPages(courses, coursesPerPage)
                    
                    // Only show pagination if there are more than 10 items
                    if (totalPages > 1) {
                      return (
                        <div className="row mt-5">
                          <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                            <div className="dataTables_info text-muted fs-7">
                              Showing {Math.min((coursesPage - 1) * coursesPerPage + 1, courses.length)} to {Math.min(coursesPage * coursesPerPage, courses.length)} of {courses.length} entries
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                            <div className="dataTables_paginate paging_simple_numbers">
                              <ul className="pagination">
                                <li className={`page-item ${coursesPage === 1 ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link btn btn-sm btn-light-primary me-2" 
                                    onClick={() => setCoursesPage(prev => Math.max(prev - 1, 1))}
                                    disabled={coursesPage === 1}
                                  >
                                    <i className="bi bi-chevron-left"></i> Previous
                                  </button>
                                </li>
                                
                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let startPage = 1
                                  if (totalPages > 5) {
                                    if (coursesPage <= 3) {
                                      startPage = 1
                                    } else if (coursesPage >= totalPages - 2) {
                                      startPage = totalPages - 4
                                    } else {
                                      startPage = coursesPage - 2
                                    }
                                  }
                                  
                                  const page = startPage + i
                                  return (
                                    <li key={page} className={`page-item ${coursesPage === page ? 'active' : ''}`}>
                                      <button 
                                        className={`page-link btn btn-sm me-1 ${coursesPage === page ? 'btn-primary text-white' : 'btn-light'}`} 
                                        onClick={() => setCoursesPage(page)}
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  )
                                })}
                                
                                <li className={`page-item ${coursesPage === totalPages ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link btn btn-sm btn-light-primary ms-2" 
                                    onClick={() => setCoursesPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={coursesPage === totalPages}
                                  >
                                    Next <i className="bi bi-chevron-right"></i>
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="symbol symbol-80px mx-auto mb-5">
                    <span className="symbol-label bg-light-info">
                      <i className="bi bi-journal-text text-info fs-3x"></i>
                    </span>
                  </div>
                  <h4 className="text-gray-800 fw-bold mb-2">No Courses Available</h4>
                  <p className="text-muted fw-semibold fs-6">There are currently no courses in the system.</p>
                </div>
              )}
            </div>
          </KTCard>
        </div>
      </div>

      {/* Job Placements with Pagination */}
      <div className="row g-5 mb-8">
        <div className="col-12">
          <KTCard className="hover-elevate-shadow rounded-3 border-0" style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)', background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)' }}>
            <div className="card-header border-0 pt-5 pb-3" style={{ borderBottom: '1px solid #eff2f5' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap w-100">
                <div className="d-flex flex-column">
                  <h3 className="card-label fw-bold fs-2 text-gray-900 mb-1">
                    <i className="bi bi-building text-primary me-2"></i>Job Placements
                  </h3>
                  <span className="text-muted fw-semibold fs-7">Available job placements for students</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="symbol-group symbol-hover flex-nowrap">
                    <div className="symbol symbol-35px symbol-circle" data-bs-toggle="tooltip" title="Active Placements">
                      <span className="symbol-label bg-success text-white fw-bold">{jobPlacements.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body py-4">
              {jobPlacements.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                      <thead>
                        <tr className="fw-bold text-uppercase text-muted fs-7 gs-0">
                          <th className="min-w-175px">Company</th>
                          <th className="min-w-150px">Position</th>
                          <th className="min-w-100px text-center">Vacancies</th>
                          <th className="min-w-150px">Date Range</th>
                          <th className="min-w-100px text-end">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginate(jobPlacements, jobPlacementsPage, jobPlacementsPerPage).map(placement => {
                          const isExpired = new Date(placement.end_date) < new Date();
                          const isActive = !isExpired;
                          return (
                            <tr key={placement._id} className="hover-elevate-up">
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="symbol symbol-45px me-5">
                                    <span className="symbol-label bg-light-primary rounded-circle">
                                      <i className="bi bi-building fs-2 text-primary"></i>
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-start flex-column">
                                    <span className="text-dark fw-bold text-hover-primary fs-6">{placement.company_name}</span>
                                    <span className="text-muted fw-semibold text-muted d-block fs-8">ID: {placement._id.substring(0, 8)}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-column w-100">
                                  <span className="text-dark fw-bold fs-6">{placement.title}</span>
                                  <span className="text-muted fw-semibold d-block fs-8">Posted: {new Date(placement.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td className="text-center">
                                <span className="badge badge-light-primary fs-7 fw-bold py-2 px-3">
                                  <i className="bi bi-people-fill me-1"></i>{placement.vacancies}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex flex-column">
                                  <div className="d-flex align-items-center mb-1">
                                    <i className="bi bi-calendar-event text-muted me-2 fs-7"></i>
                                    <span className="text-dark fw-bold fs-7">
                                      {new Date(placement.start_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-calendar-check text-muted me-2 fs-7"></i>
                                    <span className="text-dark fw-bold fs-7">
                                      {new Date(placement.end_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="text-end">
                                <span className={`badge fs-7 fw-bold py-2 px-3 ${isActive ? 'badge-light-success' : 'badge-light-danger'}`}>
                                  <i className={`bi ${isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                  {isActive ? 'Active' : 'Expired'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls for Job Placements */}
                  {(() => {
                    const totalPages = getTotalPages(jobPlacements, jobPlacementsPerPage)
                    
                    // Only show pagination if there are more than 10 items
                    if (totalPages > 1) {
                      return (
                        <div className="row mt-5">
                          <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                            <div className="dataTables_info text-muted fs-7">
                              Showing {Math.min((jobPlacementsPage - 1) * jobPlacementsPerPage + 1, jobPlacements.length)} to {Math.min(jobPlacementsPage * jobPlacementsPerPage, jobPlacements.length)} of {jobPlacements.length} entries
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                            <div className="dataTables_paginate paging_simple_numbers">
                              <ul className="pagination">
                                <li className={`page-item ${jobPlacementsPage === 1 ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link btn btn-sm btn-light-primary me-2" 
                                    onClick={() => setJobPlacementsPage(prev => Math.max(prev - 1, 1))}
                                    disabled={jobPlacementsPage === 1}
                                  >
                                    <i className="bi bi-chevron-left"></i> Previous
                                  </button>
                                </li>
                                
                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let startPage = 1
                                  if (totalPages > 5) {
                                    if (jobPlacementsPage <= 3) {
                                      startPage = 1
                                    } else if (jobPlacementsPage >= totalPages - 2) {
                                      startPage = totalPages - 4
                                    } else {
                                      startPage = jobPlacementsPage - 2
                                    }
                                  }
                                  
                                  const page = startPage + i
                                  return (
                                    <li key={page} className={`page-item ${jobPlacementsPage === page ? 'active' : ''}`}>
                                      <button 
                                        className={`page-link btn btn-sm me-1 ${jobPlacementsPage === page ? 'btn-primary text-white' : 'btn-light'}`} 
                                        onClick={() => setJobPlacementsPage(page)}
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  )
                                })}
                                
                                <li className={`page-item ${jobPlacementsPage === totalPages ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link btn btn-sm btn-light-primary ms-2" 
                                    onClick={() => setJobPlacementsPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={jobPlacementsPage === totalPages}
                                  >
                                    Next <i className="bi bi-chevron-right"></i>
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="symbol symbol-80px mx-auto mb-5">
                    <span className="symbol-label bg-light-warning">
                      <i className="bi bi-building text-warning fs-3x"></i>
                    </span>
                  </div>
                  <h4 className="text-gray-800 fw-bold mb-2">No Job Placements Available</h4>
                  <p className="text-muted fw-semibold fs-6">There are currently no job placements posted.</p>
                </div>
              )}
            </div>
          </KTCard>
        </div>
      </div>
      
      {/* Students by Course Category Table */}
      <div className="row g-5 mb-8">
        <div className="col-12">
          <KTCard className="hover-elevate-shadow rounded-3">
            <div className="card-header border-0 pt-5">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold fs-3 text-gray-800">Students by Course Category</span>
                <span className="text-muted mt-1 fw-semibold fs-7">Distribution of students across course categories</span>
              </h3>
            </div>
            <div className="card-body py-3">
              {Object.entries(studentsByCourseCategory).length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                    <thead>
                      <tr className="fw-bold text-muted bg-light">
                        <th className="min-w-150px">Course Category</th>
                        <th className="min-w-150px text-end">Students</th>
                        <th className="min-w-200px text-end">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(studentsByCourseCategory)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .map(([category, count]) => (
                          <tr key={category} className="hover-elevate-up">
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="symbol symbol-45px me-5">
                                  <span className={`symbol-label bg-light-${category === 'Online Course' ? 'primary' : category === 'Offline Course' ? 'success' : 'info'} rounded-circle`}>
                                    <i className={`bi bi-book fs-3 text-${category === 'Online Course' ? 'primary' : category === 'Offline Course' ? 'success' : 'info'}`}></i>
                                  </span>
                                </div>
                                <div className="d-flex justify-content-start flex-column">
                                  <span className="text-dark fw-bold text-hover-primary fs-6">{category}</span>
                                </div>
                              </div>
                            </td>
                            <td className="text-end">
                              <span className="text-dark fw-bold d-block fs-6">{count as number}</span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end flex-column">
                                <div className="d-flex justify-content-end align-items-center">
                                  <div className="progress w-100px w-xl-150px h-15px me-3">
                                    <div 
                                      className={`progress-bar bg-${category === 'Online Course' ? 'primary' : category === 'Offline Course' ? 'success' : 'info'}`} 
                                      role="progressbar" 
                                      style={{ width: `${Math.min(100, ((count as number) / totalStudents) * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-muted fw-semibold fs-7">
                                    {totalStudents > 0 ? Math.round(((count as number) / totalStudents) * 100) : 0}%
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-muted fw-semibold fs-6">No student data available</div>
                </div>
              )}
            </div>
          </KTCard>
        </div>
      </div>
      
      {/* Placement Requests by Status with Pagination */}
      <div className="row g-5 mb-8">
        <div className="col-12">
          <KTCard className="hover-elevate-shadow rounded-3 border-0" style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)', background: 'linear-gradient(to bottom right, #ffffff, #f8f9fa)' }}>
            <div className="card-header border-0 pt-5 pb-3" style={{ borderBottom: '1px solid #eff2f5' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap w-100">
                <div className="d-flex flex-column">
                  <h3 className="card-label fw-bold fs-2 text-gray-900 mb-1">
                    <i className="bi bi-briefcase text-primary me-2"></i>Placement Requests
                  </h3>
                  <span className="text-muted fw-semibold fs-7">Distribution of placement requests by status</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="symbol-group symbol-hover flex-nowrap">
                    <div className="symbol symbol-35px symbol-circle" data-bs-toggle="tooltip" title="Total Requests">
                      <span className="symbol-label bg-warning text-white fw-bold">{placementRequests.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body py-4">
              {Object.entries(placementRequestsByStatus).length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                      <thead>
                        <tr className="fw-bold text-uppercase text-muted fs-7 gs-0">
                          <th className="min-w-175px">Status</th>
                          <th className="min-w-125px text-center">Requests</th>
                          <th className="min-w-200px text-center">Progress</th>
                          <th className="min-w-100px text-end">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(placementRequestsByStatus)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .map(([status, count]) => {
                            const percentage = placementRequests.length > 0 ? Math.round(((count as number) / placementRequests.length) * 100) : 0;
                            let statusColor = 'bg-warning';
                            let statusIcon = 'bi-question-circle';
                            
                            // Assign colors and icons based on status
                            if (status.toLowerCase().includes('pending')) {
                              statusColor = 'bg-warning';
                              statusIcon = 'bi-clock-history';
                            } else if (status.toLowerCase().includes('approved')) {
                              statusColor = 'bg-success';
                              statusIcon = 'bi-check-circle';
                            } else if (status.toLowerCase().includes('rejected')) {
                              statusColor = 'bg-danger';
                              statusIcon = 'bi-x-circle';
                            } else if (status.toLowerCase().includes('processing')) {
                              statusColor = 'bg-info';
                              statusIcon = 'bi-arrow-repeat';
                            }
                            
                            return (
                              <tr key={status} className="hover-elevate-up">
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="symbol symbol-45px me-5">
                                      <span className={`symbol-label ${statusColor.replace('bg-', 'bg-light-')} rounded-circle`}>
                                        <i className={`bi ${statusIcon} fs-2 ${statusColor.replace('bg-', 'text-')}`}></i>
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-start flex-column">
                                      <span className="text-dark fw-bold text-hover-primary fs-6">{status}</span>
                                      <span className="text-muted fw-semibold text-muted d-block fs-8">Request Type</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <span className={`badge ${statusColor.replace('bg-', 'badge-light-')} fs-7 fw-bold py-2 px-3`}>
                                    <i className="bi bi-clipboard-data me-1"></i>{count as number}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex justify-content-center align-items-center">
                                    <div className="progress w-100px w-xl-150px h-15px">
                                      <div 
                                        className={`progress-bar ${statusColor}`} 
                                        role="progressbar" 
                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end">
                                  <span className="text-dark fw-bold fs-6">{percentage}%</span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls for Placement Requests */}
                  {(() => {
                    const totalPages = getTotalPages(Object.entries(placementRequestsByStatus), placementRequestsPerPage)
                    
                    // Only show pagination if there are more than 10 items
                    if (totalPages > 1) {
                      return (
                        <div className="row mt-5">
                          <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                            <div className="dataTables_info text-muted fs-7">
                              Showing {Math.min((placementRequestsPage - 1) * placementRequestsPerPage + 1, Object.entries(placementRequestsByStatus).length)} to {Math.min(placementRequestsPage * placementRequestsPerPage, Object.entries(placementRequestsByStatus).length)} of {Object.entries(placementRequestsByStatus).length} entries
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                            <div className="dataTables_paginate paging_simple_numbers">
                              <ul className="pagination">
                                <li className={`page-item ${placementRequestsPage === 1 ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link btn btn-sm btn-light-primary me-2" 
                                    onClick={() => setPlacementRequestsPage(prev => Math.max(prev - 1, 1))}
                                    disabled={placementRequestsPage === 1}
                                  >
                                    <i className="bi bi-chevron-left"></i> Previous
                                  </button>
                                </li>
                                
                                {/* Page numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let startPage = 1
                                  if (totalPages > 5) {
                                    if (placementRequestsPage <= 3) {
                                      startPage = 1
                                    } else if (placementRequestsPage >= totalPages - 2) {
                                      startPage = totalPages - 4
                                    } else {
                                      startPage = placementRequestsPage - 2
                                    }
                                  }
                                  
                                  const page = startPage + i
                                  return (
                                    <li key={page} className={`page-item ${placementRequestsPage === page ? 'active' : ''}`}>
                                      <button 
                                        className={`page-link btn btn-sm me-1 ${placementRequestsPage === page ? 'btn-primary text-white' : 'btn-light'}`} 
                                        onClick={() => setPlacementRequestsPage(page)}
                                      >
                                        {page}
                                      </button>
                                    </li>
                                  )
                                })}
                                
                                <li className={`page-item ${placementRequestsPage === totalPages ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link btn btn-sm btn-light-primary ms-2" 
                                    onClick={() => setPlacementRequestsPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={placementRequestsPage === totalPages}
                                  >
                                    Next <i className="bi bi-chevron-right"></i>
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="symbol symbol-80px mx-auto mb-5">
                    <span className="symbol-label bg-light-warning">
                      <i className="bi bi-briefcase text-warning fs-3x"></i>
                    </span>
                  </div>
                  <h4 className="text-gray-800 fw-bold mb-2">No Placement Requests</h4>
                  <p className="text-muted fw-semibold fs-6">There are currently no placement requests in the system.</p>
                </div>
              )}
            </div>
          </KTCard>
        </div>
      </div>
      
      {/* User Location Map */}
      <div className="row g-5 mt-2">
        <div className="col-12">
          <KTCard className="hover-elevate-shadow">
            <div className="card-header border-0 pt-5">
              <div className="d-flex align-items-center justify-content-between">
                <h3 className="card-title align-items-start flex-column mb-0">
                  <span className="card-label fw-bold fs-3 text-gray-800">User Locations Map</span>
                  <span className="text-muted mt-1 fw-semibold fs-7">Geographic distribution of users</span>
                </h3>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={refreshUserLocations}
                  disabled={mapLoading}
                >
                  <i className={`bi ${mapLoading ? 'bi-arrow-repeat spin' : 'bi-arrow-repeat'} me-1`}></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body py-3">
              {mapLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading map...</span>
                  </div>
                </div>
              ) : mapError ? (
                <div className="alert alert-danger">
                  <h4 className="alert-heading">Map Error!</h4>
                  <p>{mapError}</p>
                </div>
              ) : mapMarkers.length > 0 ? (
                <div style={{ height: '400px', width: '100%' }}>
                  <GoogleMapReact
                    bootstrapURLKeys={{ key: '' }} // Add your Google Maps API key here if needed
                    defaultCenter={{ lat: 20, lng: 0 }}
                    defaultZoom={2}
                    options={{
                      fullscreenControl: true,
                      zoomControl: true,
                      mapTypeControl: true,
                      streetViewControl: true
                    }}
                  >
                    {mapMarkers.map(marker => (
                      <MapMarker
                        key={marker.id}
                        lat={marker.lat}
                        lng={marker.lng}
                        title={marker.title}
                        info={marker.info}
                      />
                    ))}
                  </GoogleMapReact>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-muted fw-semibold fs-6">No location data available</div>
                </div>
              )}
            </div>
          </KTCard>
        </div>
      </div>
    </div>
  )
}

// Map marker component for Google Maps
const MapMarker: React.FC<{ 
  lat: number
  lng: number
  title: string 
  info: string
}> = ({ title, info }) => {
  const [showInfo, setShowInfo] = useState(false)
  
  // Handle cases where title might be undefined or empty
  const displayTitle = title && title.trim() !== '' && title !== 'undefined undefined' ? title : 'Unknown User'
  
  return (
    <div 
      style={{
        position: 'relative',
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
      }}
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
      onClick={() => setShowInfo(!showInfo)}
    >
      <div 
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#3699FF',
          border: '3px solid white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          animation: showInfo ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      {showInfo && (
        <div 
          style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: showInfo ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(5px)',
            backgroundColor: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            minWidth: '140px',
            textAlign: 'center',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            opacity: showInfo ? 1 : 0,
          }}
        >
          <div style={{ color: '#181C32', fontWeight: '600', marginBottom: '2px' }}>{displayTitle}</div>
          <div style={{ color: '#7E8299', fontSize: '12px' }}>{info}</div>
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid white',
          }} />
        </div>
      )}
    </div>
  )
}

export default FgiitMatrix
