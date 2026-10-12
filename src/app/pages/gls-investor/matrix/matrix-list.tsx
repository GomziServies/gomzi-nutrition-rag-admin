import React, { useEffect, useState } from 'react'
import { GetMatrixData } from '../../../Functions/FWG/Matrix'
import { KTCard } from '../../../../_metronic/helpers'
import GoogleMapReact from 'google-map-react'
import { PageTitle } from '../../../../_metronic/layout/core'

// Add this function to fetch coordinates from Nominatim API
const fetchCoordinates = async (city: string, state: string, country: string): Promise<{ lat: number, lng: number } | null> => {
    try {
        // Create a key for the coordinates array in localStorage
        const coordinatesArrayKey = 'fwgCoordinatesArray';

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

interface User {
    _id: string
    firstName: string
    lastName: string
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

interface Invoice {
    _id: string
    user_id?: string
    fullName?: string
    branch_name?: string
    createdAt: string
    totalPayment: string
    paidPayment: string
}

interface DietPlan {
    _id: string
    plan_name: string
    createdAt: string
    status: string
}

interface DashboardStats {
    total_users: number
    inactive_users: number
    user_assigned_plan: number
    active_diet_plan_users: number
}

interface UserWeight {
    _id: string
    user_id: string
    weight: number
    createdAt: string
}

// Add this interface for the chart data
interface ChartData {
    userId: string
    userName: string
    weights: { date: string; weight: number }[]
}

interface UserLocation {
    userId: string;
    userName: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
}

// Add this interface for map marker data
interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    info: string;
}

function InvestorMatrixList() {
    const [users, setUsers] = useState<User[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
    const [userWeights, setUserWeights] = useState<UserWeight[]>([])
    const [userLocations, setUserLocations] = useState<UserLocation[]>([])
    const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mapLoading, setMapLoading] = useState(false)
    const [mapError, setMapError] = useState<string | null>(null)

    // Pagination state for weight changes table
    const [weightChangesPage, setWeightChangesPage] = useState(1)
    const [weightChangesPerPage] = useState(10)

    // State for chart modal
    const [showChartModal, setShowChartModal] = useState(false)
    const [chartData, setChartData] = useState<ChartData | null>(null)

    // Function to show chart for a user
    const showUserChart = (userId: string) => {
        // Find user name
        const user = users.find(u => u._id === userId)
        const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User'

        // Get weights for this user
        const weightsByUser: { [userId: string]: UserWeight[] } = {}

        userWeights.forEach(weight => {
            if (!weightsByUser[weight.user_id]) {
                weightsByUser[weight.user_id] = []
            }
            weightsByUser[weight.user_id].push(weight)
        })

        // Sort weights by date
        Object.keys(weightsByUser).forEach(uid => {
            weightsByUser[uid].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        })

        // Prepare chart data
        const userWeightsData = weightsByUser[userId] || []
        const weights = userWeightsData.map(weight => ({
            date: new Date(weight.createdAt).toLocaleDateString(),
            weight: weight.weight
        }))

        setChartData({
            userId,
            userName,
            weights
        })

        setShowChartModal(true)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch all matrix data in a single optimized API call
                const matrixResponse: any = await GetMatrixData()

                if (matrixResponse && matrixResponse.data) {
                    const minDate = new Date('2024-06-05T00:00:00Z').getTime()

                    // Filter data to only include records after June 5, 2024
                    const filterByDate = (items: any[]) => items.filter((item: any) => new Date(item.createdAt).getTime() >= minDate)

                    const filteredUsers = filterByDate(matrixResponse.data.users || [])
                    const filteredInvoices = filterByDate(matrixResponse.data.invoices || [])
                    const filteredDietPlans = filterByDate(matrixResponse.data.dietPlans || [])
                    const filteredUserWeights = filterByDate(matrixResponse.data.userWeights || [])

                    setUsers(filteredUsers)
                    setInvoices(filteredInvoices)
                    setDietPlans(filteredDietPlans)
                    setUserWeights(filteredUserWeights)

                    // Calculate dashboard stats from the fetched data
                    const total_users = filteredUsers.length || 0
                    const inactive_users = filteredUsers.filter((user: User) => user.status === 'inactive').length || 0
                    const user_assigned_plan = filteredDietPlans.length || 0
                    const active_diet_plan_users = filteredUserWeights.length || 0

                    setDashboardStats({
                        total_users,
                        inactive_users,
                        user_assigned_plan,
                        active_diet_plan_users
                    })
                }

                // Check if we have cached map markers
                const cachedMapMarkers = localStorage.getItem('fwgMapMarkers');
                const cachedTimestamp = localStorage.getItem('fwgMapMarkersTimestamp');

                // If we have cached data that's less than 1 hour old, use it
                if (cachedMapMarkers && cachedTimestamp &&
                    Date.now() - parseInt(cachedTimestamp) < 60 * 60 * 1000) {
                    try {
                        const parsedMarkers = JSON.parse(cachedMapMarkers);
                        setMapMarkers(parsedMarkers);
                        setLoading(false);
                        return;
                    } catch (e) {
                        console.warn('Failed to parse cached map markers, fetching fresh data');
                    }
                }

                // Fetch user locations with coordinates
                setMapLoading(true)
                const locationData: UserLocation[] = []
                const markerData: MapMarker[] = []

                // Process users to get location data
                const usersWithLocations = (matrixResponse.data.users || []).filter(
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
                            const userLocation: UserLocation = {
                                userId: user._id,
                                userName: `${user.firstName} ${user.lastName}`,
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
                                title: `${user.firstName} ${user.lastName}`,
                                info: `${user.address!.city}, ${user.address!.state}, ${user.address!.country}`
                            }

                            markerData.push(marker)
                        }
                    } catch (err) {
                        console.warn(`Could not fetch coordinates for user ${user._id}:`, err)
                    }
                }

                // Store markers in localStorage
                localStorage.setItem('fwgMapMarkers', JSON.stringify(markerData));
                localStorage.setItem('fwgMapMarkersTimestamp', Date.now().toString());

                setUserLocations(locationData)
                setMapMarkers(markerData)
                setMapLoading(false)

                setError(null)
            } catch (err: any) {
                console.error('Error fetching data:', err)
                setError('Failed to fetch data. Please try again later.')
                setMapError('Failed to load map data.')
                setMapLoading(false)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Add this function to refresh user locations
    const refreshUserLocations = async () => {
        try {
            setMapLoading(true);
            setMapError(null);

            // Clear the localStorage cache
            localStorage.removeItem('fwgMapMarkers');
            localStorage.removeItem('fwgMapMarkersTimestamp');
            localStorage.removeItem('fwgCoordinatesArray');

            // Fetch fresh matrix data
            const matrixResponse: any = await GetMatrixData();

            // Fetch user locations with coordinates
            const locationData: UserLocation[] = [];
            const markerData: MapMarker[] = [];

            // Process users to get location data
            const usersWithLocations = (matrixResponse.data.users || []).filter(
                (user: User) => user.address?.city && user.address?.state && user.address?.country
            );

            // Limit to first 100 users to avoid too many API requests
            const limitedUsers = usersWithLocations.slice(0, 100);

            for (const user of limitedUsers) {
                try {
                    const coords = await fetchCoordinates(
                        user.address!.city!,
                        user.address!.state!,
                        user.address!.country!
                    );

                    if (coords) {
                        const userLocation: UserLocation = {
                            userId: user._id,
                            userName: `${user.firstName} ${user.lastName}`,
                            city: user.address!.city!,
                            state: user.address!.state!,
                            country: user.address!.country!,
                            lat: coords.lat,
                            lng: coords.lng
                        };

                        locationData.push(userLocation);

                        const marker: MapMarker = {
                            id: user._id,
                            lat: coords.lat,
                            lng: coords.lng,
                            title: `${user.firstName} ${user.lastName}`,
                            info: `${user.address!.city}, ${user.address!.state}, ${user.address!.country}`
                        };

                        markerData.push(marker);
                    }
                } catch (err) {
                    console.warn(`Could not fetch coordinates for user ${user._id}:`, err);
                }
            }

            // Store markers in localStorage
            localStorage.setItem('fwgMapMarkers', JSON.stringify(markerData));
            localStorage.setItem('fwgMapMarkersTimestamp', Date.now().toString());

            setUserLocations(locationData);
            setMapMarkers(markerData);
        } catch (err: any) {
            console.error('Error refreshing user locations:', err);
            setMapError('Failed to refresh map data.');
        } finally {
            setMapLoading(false);
        }
    };

    // Calculate statistics
    const totalUsers = users.length
    const activeUsers = dashboardStats ? totalUsers - dashboardStats.inactive_users : 0
    const totalDiets = dietPlans.length

    // For a more accurate calculation, we need to group weights by user and calculate their individual changes
    const calculateWeightChanges = () => {
        // Group weights by user
        const weightsByUser: { [userId: string]: UserWeight[] } = {}

        userWeights.forEach(weight => {
            if (!weightsByUser[weight.user_id]) {
                weightsByUser[weight.user_id] = []
            }
            weightsByUser[weight.user_id].push(weight)
        })

        // Sort each user's weights by date
        Object.keys(weightsByUser).forEach(userId => {
            weightsByUser[userId].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        })

        let totalLoss = 0
        let totalGain = 0

        // Calculate weight change for each user (last weight - first weight)
        Object.keys(weightsByUser).forEach(userId => {
            const userWeights = weightsByUser[userId]
            if (userWeights.length >= 2) {
                const firstWeight = userWeights[0].weight
                const lastWeight = userWeights[userWeights.length - 1].weight
                const change = lastWeight - firstWeight

                if (change < 0) {
                    totalLoss += Math.abs(change)
                } else if (change > 0) {
                    totalGain += change
                }
            }
        })

        return { totalWeightLoss: parseFloat(totalLoss.toFixed(2)), totalWeightGain: parseFloat(totalGain.toFixed(2)) }
    }

    const { totalWeightLoss, totalWeightGain } = calculateWeightChanges()

    // Extract branch information from invoices (only show Katargam, Vesu, Adajan)
    const branchWiseClients = invoices.reduce((acc: any, invoice) => {
        const branch = invoice.branch_name || 'Unknown'

        // Only include Katargam, Vesu, and Adajan branches
        if (branch === 'Katargam' || branch === 'Vesu' || branch === 'Adajan') {
            if (!acc[branch]) {
                acc[branch] = {
                    clients: new Set(), // Use Set to count unique clients
                    count: 0
                }
            }

            // Add client to branch (using user_id or fullName)
            if (invoice.user_id) {
                acc[branch].clients.add(invoice.user_id)
            } else if (invoice.fullName) {
                acc[branch].clients.add(invoice.fullName)
            }

            // Update count
            acc[branch].count = acc[branch].clients.size
        }

        return acc
    }, {})

    // Users by city (from user data)
    const usersByCity = users.reduce((acc: any, user) => {
        const city = (user.address?.city || 'Unknown')
        acc[city] = (acc[city] || 0) + 1
        return acc
    }, {})

    // Users by state (from user data)
    const usersByState = users.reduce((acc: any, user) => {
        const state = (user.address?.state || 'Unknown')
        acc[state] = (acc[state] || 0) + 1
        return acc
    }, {})

    // Users by country (from user data)
    const usersByCountry = users.reduce((acc: any, user) => {
        const country = (user.address?.country || 'Unknown')
        acc[country] = (acc[country] || 0) + 1
        return acc
    }, {})

    // International users (non-Indian users)
    const internationalUsers = Object.entries(usersByCountry)
        .filter(([country]) => country !== 'India' && country !== 'Unknown')
        .reduce((sum, [, count]) => sum + (count as number), 0)

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
        <div className='container-fluid'>
            <PageTitle breadcrumbs={[]}>Matrix List</PageTitle>
            {/* Summary Cards */}
            <div className='row g-5 mb-8'>
                <div className='col'>
                    <div className='card border border-2 border-primary shadow-sm hover-elevate-up'>
                        <div className='card-body d-flex flex-column align-items-center'>
                            <span className='fs-1 text-primary fw-bold'>{totalUsers}</span>
                            <span className='text-muted fw-semibold fs-7 mt-2'>Total Users</span>
                        </div>
                    </div>
                </div>
                <div className='col'>
                    <div className='card border border-2 border-success shadow-sm hover-elevate-up'>
                        <div className='card-body d-flex flex-column align-items-center'>
                            <span className='fs-1 text-success fw-bold'>{activeUsers}</span>
                            <span className='text-muted fw-semibold fs-7 mt-2'>Active Users</span>
                        </div>
                    </div>
                </div>
                <div className='col'>
                    <div className='card border border-2 border-info shadow-sm hover-elevate-up'>
                        <div className='card-body d-flex flex-column align-items-center'>
                            <span className='fs-1 text-info fw-bold'>{internationalUsers}</span>
                            <span className='text-muted fw-semibold fs-7 mt-2'>International Users</span>
                        </div>
                    </div>
                </div>
                <div className='col'>
                    <div className='card border border-2 border-warning shadow-sm hover-elevate-up'>
                        <div className='card-body d-flex flex-column align-items-center'>
                            <span className='fs-1 text-warning fw-bold'>{totalDiets}</span>
                            <span className='text-muted fw-semibold fs-7 mt-2'>Total Diets</span>
                        </div>
                    </div>
                </div>
                <div className='col'>
                    <div className='card border border-2 border-danger shadow-sm hover-elevate-up'>
                        <div className='card-body d-flex flex-column align-items-center'>
                            <span className='fs-1 text-danger fw-bold'>
                                {(totalWeightLoss + totalWeightGain).toFixed(2)}kg
                            </span>
                            <span className='text-muted fw-semibold fs-7 mt-2'>Total Weight Management</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className='row g-5 mb-8'>
                <div className='col-12'>
                    <KTCard className='hover-elevate-shadow'>
                        <div className='card-header border-0 pt-5'>
                            <h3 className='card-title align-items-start flex-column'>
                                <span className='card-label fw-bold fs-3 text-gray-800'>Branch-wise Clients</span>
                                <span className='text-muted mt-1 fw-semibold fs-7'>Katargam, Vesu, Adajan</span>
                            </h3>
                        </div>
                        <div className='card-body py-3'>
                            {Object.entries(branchWiseClients).length > 0 ? (
                                <div className='table-responsive'>
                                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                                        <thead>
                                            <tr className='fw-bold text-muted'>
                                                <th className='min-w-150px'>Branch</th>
                                                <th className='min-w-150px text-end'>Clients</th>
                                                <th className='min-w-200px text-end'>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(branchWiseClients)
                                                .sort(([, a], [, b]) => (b as any).count - (a as any).count)
                                                .map(([branch, data]) => (
                                                    <tr key={branch}>
                                                        <td>
                                                            <div className='d-flex align-items-center'>
                                                                <div className='symbol symbol-45px me-5'>
                                                                    <span
                                                                        className={`symbol-label bg-light-${branch === 'Katargam'
                                                                            ? 'primary'
                                                                            : branch === 'Vesu'
                                                                                ? 'success'
                                                                                : 'info'
                                                                            } rounded-circle`}>
                                                                        <i
                                                                            className={`bi bi-geo-alt-fill fs-3 text-${branch === 'Katargam'
                                                                                ? 'primary'
                                                                                : branch === 'Vesu'
                                                                                    ? 'success'
                                                                                    : 'info'
                                                                                }`}></i>
                                                                    </span>
                                                                </div>
                                                                <div className='d-flex justify-content-start flex-column'>
                                                                    <span className='text-dark fw-bold text-hover-primary fs-6'>
                                                                        {branch}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='text-end'>
                                                            <span className='text-dark fw-bold d-block fs-6'>
                                                                {(data as any).count}
                                                            </span>
                                                        </td>
                                                        <td className='text-end'>
                                                            <div className='d-flex justify-content-end flex-column'>
                                                                <div className='d-flex justify-content-end align-items-center'>
                                                                    <div className='progress w-100px w-xl-150px h-15px me-3'>
                                                                        <div
                                                                            className={`progress-bar bg-${branch === 'Katargam'
                                                                                ? 'primary'
                                                                                : branch === 'Vesu'
                                                                                    ? 'success'
                                                                                    : 'info'
                                                                                }`}
                                                                            role='progressbar'
                                                                            style={{
                                                                                width: `${Math.min(
                                                                                    100,
                                                                                    ((data as any).count / totalUsers) * 100
                                                                                )}%`,
                                                                            }}></div>
                                                                    </div>
                                                                    <span className='text-muted fw-semibold fs-7'>
                                                                        {Math.round(((data as any).count / totalUsers) * 100)}%
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
                                <div className='text-center py-10'>
                                    <div className='text-muted fw-semibold fs-6'>No branch data available</div>
                                </div>
                            )}
                        </div>
                    </KTCard>
                </div>
            </div>
            <div className='row g-5' style={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Users by Country */}
                <div className='col-md-6' style={{ display: 'flex', flexDirection: 'column' }}>
                    <KTCard className='hover-elevate-shadow' style={{ flex: 1 }}>
                        <div className='card-header border-0 pt-5'>
                            <h3 className='card-title align-items-start flex-column'>
                                <span className='card-label fw-bold fs-3 text-gray-800'>Users by Country</span>
                                <span className='text-muted mt-1 fw-semibold fs-7'>Geographic Distribution</span>
                            </h3>
                        </div>
                        <div className='card-body py-3'>
                            {Object.entries(usersByCountry).length > 0 ? (
                                <div className='table-responsive'>
                                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                                        <thead>
                                            <tr className='fw-bold text-muted'>
                                                <th className='min-w-150px'>Country</th>
                                                <th className='min-w-100px text-end'>Users</th>
                                                <th className='min-w-100px text-end'>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(usersByCountry)
                                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                                .map(([country, count]) => (
                                                    <tr key={country}>
                                                        <td>
                                                            <div className='d-flex align-items-center'>
                                                                <div className='symbol symbol-45px me-5'>
                                                                    <span className='symbol-label bg-light-primary rounded-circle'>
                                                                        <i className='bi bi-flag-fill fs-3 text-primary'></i>
                                                                    </span>
                                                                </div>
                                                                <div className='d-flex justify-content-start flex-column'>
                                                                    <span className='text-dark fw-bold text-hover-primary fs-6'>
                                                                        {country}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='text-end'>
                                                            <span className='text-dark fw-bold d-block fs-6'>
                                                                {count as number}
                                                            </span>
                                                        </td>
                                                        <td className='text-end'>
                                                            <span className='text-muted fw-semibold fs-7'>
                                                                {Math.round(((count as number) / totalUsers) * 100)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='text-center py-10'>
                                    <div className='text-muted fw-semibold fs-6'>No location data available</div>
                                </div>
                            )}
                        </div>
                    </KTCard>
                </div>

                {/* Users by State */}
                <div className='col-md-6' style={{ display: 'flex', flexDirection: 'column' }}>
                    <KTCard className='hover-elevate-shadow' style={{ flex: 1 }}>
                        <div className='card-header border-0 pt-5'>
                            <h3 className='card-title align-items-start flex-column'>
                                <span className='card-label fw-bold fs-3 text-gray-800'>Users by State</span>
                                <span className='text-muted mt-1 fw-semibold fs-7'>Regional Distribution</span>
                            </h3>
                        </div>
                        <div className='card-body py-3'>
                            {Object.entries(usersByState).length > 0 ? (
                                <div className='table-responsive'>
                                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                                        <thead>
                                            <tr className='fw-bold text-muted'>
                                                <th className='min-w-150px'>State</th>
                                                <th className='min-w-100px text-end'>Users</th>
                                                <th className='min-w-100px text-end'>Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(usersByState)
                                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                                .map(([state, count]) => (
                                                    <tr key={state}>
                                                        <td>
                                                            <div className='d-flex align-items-center'>
                                                                <div className='symbol symbol-45px me-5'>
                                                                    <span className='symbol-label bg-light-success rounded-circle'>
                                                                        <i className='bi bi-map-fill fs-3 text-success'></i>
                                                                    </span>
                                                                </div>
                                                                <div className='d-flex justify-content-start flex-column'>
                                                                    <span className='text-dark fw-bold text-hover-primary fs-6'>
                                                                        {state}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='text-end'>
                                                            <span className='text-dark fw-bold d-block fs-6'>
                                                                {count as number}
                                                            </span>
                                                        </td>
                                                        <td className='text-end'>
                                                            <span className='text-muted fw-semibold fs-7'>
                                                                {Math.round(((count as number) / totalUsers) * 100)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='text-center py-10'>
                                    <div className='text-muted fw-semibold fs-6'>No location data available</div>
                                </div>
                            )}
                        </div>
                    </KTCard>
                </div>
            </div>
        </div>
    )
}

export { InvestorMatrixList }
