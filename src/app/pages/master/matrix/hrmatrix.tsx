import React, { useState, useEffect } from 'react';
import { PageTitle } from '../../../../_metronic/layout/core';
import { GetHRMatrixDataRaw } from '../../../Functions/FGGroup/HRMatrix';
import ApexCharts from 'apexcharts';
import { useThemeMode } from '../../../../_metronic/partials';
import { KTIcon } from '../../../../_metronic/helpers';

interface MonthlyData {
  month: string;
  year: number;
  month_year: string;
  total_salary: number;
  average_task_rating: number;
  employee_count: number;
  employees: any[];
}

interface PositionData {
  position: string;
  monthly_data: MonthlyData[];
  total_salary_all_months: number;
  total_employees_all_months: number;
  average_rating_all_months: number;
}

interface OverallTotals {
  total_positions: number;
  total_employees_all_months: number;
  total_salary_all_months: number;
  overall_average_rating: number;
}

interface FilterInfo {
  month: string | number;
  year: string | number;
  filtered: boolean;
  grouping: string;
}

interface HRMatrixResponse {
  matrix_data: PositionData[];
  overall_totals: OverallTotals;
  filter_info: FilterInfo;
}

const HrMatrix: React.FC = () => {
  const [data, setData] = useState<HRMatrixResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(null);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Set default to previous month
    const currentDate = new Date();
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return String(prevMonthDate.getMonth() + 1); // Month is 0-indexed, so add 1
  });
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    // Set default to previous month's year
    const currentDate = new Date();
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return String(prevMonthDate.getFullYear());
  });
  
  const { mode } = useThemeMode();
  
  // Handle position click to show employees
  const handlePositionClick = (position: PositionData) => {
    setSelectedPosition(position);
    setShowEmployeeModal(true);
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  
  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const query: { month?: string; year?: string } = {};
      if (selectedMonth) {
        // Convert month number to month name if needed
        const monthNumber = parseInt(selectedMonth);
        if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
          query.month = monthNames[monthNumber - 1]; // Convert number to month name
        } else {
          query.month = selectedMonth; // Use as is if already a month name
        }
      }
      if (selectedYear) query.year = selectedYear;
      
      const response: any = await GetHRMatrixDataRaw(query);
      
      if (response.status === 200 && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);
  
  // Initialize charts when data changes
  useEffect(() => {
    if (data && data.matrix_data && data.matrix_data.length > 0) {
      // Initialize salary chart after DOM updates
      setTimeout(() => {
        const salaryChartElement = document.getElementById('salary-chart');
        if (salaryChartElement) {
          // Destroy existing chart if it exists
          const existingChart = (window as any).__salaryChart;
          if (existingChart) {
            existingChart.destroy();
          }
          
          const positions = data.matrix_data.map(pos => pos.position);
          const salaries = data.matrix_data.map(pos => pos.total_salary_all_months);
          
          const chartData = {
            series: [{
              name: 'Total Salary',
              data: salaries
            }],
            chart: {
              height: 350,
              type: 'bar',
              toolbar: {
                show: false
              },
              dropShadow: {
                enabled: true,
                opacity: 0.2,
                blur: 5,
                left: -2,
                top: 2
              },
            },
            plotOptions: {
              bar: {
                borderRadius: 8,
                columnWidth: '70%',
                distributed: true,
                dataLabels: {
                  position: 'top',
                },
              }
            },
            dataLabels: {
              enabled: true,
              formatter: function (val: number) {
                return '₹' + val.toLocaleString();
              },
              offsetY: -20,
              style: {
                fontSize: '10px',
                colors: ["#304758"]
              }
            },
            xaxis: {
              categories: positions,
              position: 'bottom',
              axisBorder: {
                show: false
              },
              axisTicks: {
                show: false
              },
              crosshairs: {
                fill: {
                  type: 'gradient',
                  gradient: {
                    colorFrom: '#D8E3F0',
                    colorTo: '#BED1E6',
                    stops: [0, 100],
                    opacityFrom: 0.4,
                    opacityTo: 0.5,
                  }
                }
              },
              tooltip: {
                enabled: true,
              },
              labels: {
                style: {
                  fontSize: '11px',
                  fontWeight: 500,
                }
              }
            },
            yaxis: {
              opposite: false,
              labels: {
                style: {
                  fontSize: '10px',
                },
                formatter: function(val: number) {
                  return '₹' + (val / 1000).toFixed(0) + 'k';
                }
              }
            },
            legend: {
              position: 'top',
              horizontalAlign: 'right',
              offsetX: 40
            },
            tooltip: {
              theme: 'light',
              y: {
                formatter: function(val: number) {
                  return '₹' + val.toLocaleString();
                }
              }
            },
            grid: {
              show: true,
              borderColor: '#f0f0f0',
              strokeDashArray: 4,
            }
          };
          
          const chart = new ApexCharts(salaryChartElement, chartData);
          chart.render();
          (window as any).__salaryChart = chart;
        }
      }, 100);
      
      // Initialize rating chart after DOM updates
      setTimeout(() => {
        const ratingChartElement = document.getElementById('rating-chart');
        if (ratingChartElement) {
          // Destroy existing chart if it exists
          const existingChart = (window as any).__ratingChart;
          if (existingChart) {
            existingChart.destroy();
          }
          
          const positions = data.matrix_data.map(pos => pos.position);
          const ratings = data.matrix_data.map(pos => pos.average_rating_all_months);
          
          const chartData = {
            series: ratings,
            chart: {
              height: 350,
              type: 'radar',
              toolbar: {
                show: false
              },
              dropShadow: {
                enabled: true,
                blur: 5,
                opacity: 0.1
              }
            },
            title: {
              text: 'Position-wise Average Task Rating',
              align: 'center',
              margin: 20,
              offsetX: 0,
              offsetY: 0,
              floating: false,
              style: {
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#263238'
              }
            },
            xaxis: {
              categories: positions,
              labels: {
                style: {
                  fontSize: '11px',
                  fontWeight: 500,
                }
              }
            },
            yaxis: {
              min: 0,
              max: 100,
              labels: {
                show: true,
                style: {
                  fontSize: '10px',
                },
              },
              tickAmount: 5,
            },
            plotOptions: {
              radar: {
                size: 140,
                polygons: {
                  strokeColors: '#e8e8e8',
                  connectorColors: '#e8e8e8',
                  fill: {
                    colors: ['rgba(101, 163, 224, 0.1)']
                  }
                }
              }
            },
            tooltip: {
              theme: 'light',
              y: {
                formatter: function (val: number) {
                  return val.toFixed(2) + '%';
                }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.25,
                gradientToColors: ['#5D8AA8'],
                inverseColors: false,
                opacityFrom: 0.5,
                opacityTo: 0.1,
                stops: [0, 50, 100],
                colorStops: []
              }
            },
            stroke: {
              width: 2,
            },
            markers: {
              size: 4,
              colors: ['#5D8AA8'],
              strokeColors: '#fff',
              strokeWidth: 2,
            }
          };
          
          const chart = new ApexCharts(ratingChartElement, chartData);
          chart.render();
          (window as any).__ratingChart = chart;
        }
      }, 100);
    }
    
    // Cleanup function to destroy charts when component unmounts
    return () => {
      const existingSalaryChart = (window as any).__salaryChart;
      if (existingSalaryChart) {
        existingSalaryChart.destroy();
      }
      
      const existingRatingChart = (window as any).__ratingChart;
      if (existingRatingChart) {
        existingRatingChart.destroy();
      }
    };
  }, [data]);
  
  // Render salary chart
  const renderSalaryChart = () => {
    if (!data || !data.matrix_data || data.matrix_data.length === 0) return null;
    
    const positions = data.matrix_data.map(pos => pos.position);
    const salaries = data.matrix_data.map(pos => pos.total_salary_all_months);
    
    const chartData = {
      series: [{
        name: 'Total Salary',
        data: salaries
      }],
      chart: {
        height: 350,
        type: 'bar',
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          dataLabels: {
            position: 'top', // top, center, bottom
          },
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return '₹' + val.toLocaleString();
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["#304758"]
        }
      },
      xaxis: {
        categories: positions,
        position: 'top',
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        crosshairs: {
          fill: {
            type: 'gradient',
            gradient: {
              colorFrom: '#D8E3F0',
              colorTo: '#BED1E6',
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5,
            }
          }
        },
        tooltip: {
          enabled: true,
        }
      },
      yaxis: {
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: false,
        }
      },
      title: {
        text: 'Position-wise Total Salary',
        floating: true,
        offsetY: 330,
        align: 'center',
        style: {
          color: '#444'
        }
      }
    };
    
    return <div id="salary-chart"></div>;
  };
  
  // Render rating chart
  const renderRatingChart = () => {
    if (!data || !data.matrix_data || data.matrix_data.length === 0) return null;
    
    const positions = data.matrix_data.map(pos => pos.position);
    const ratings = data.matrix_data.map(pos => pos.average_rating_all_months);
    
    const chartData = {
      series: ratings,
      chart: {
        height: 350,
        type: 'radar',
      },
      title: {
        text: 'Position-wise Average Task Rating'
      },
      xaxis: {
        categories: positions
      },
      yaxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Rating (%)'
        }
      },
      plotOptions: {
        radar: {
          polygons: {
            fill: {
              colors: ['rgba(238, 0, 255, 0.2)', 'transparent'] // alternate polygon fill
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(2) + '%';
          }
        }
      }
    };
    
    return <div id="rating-chart"></div>;
  };
  
  // Render salary table
  const renderSalaryTable = () => {
    if (!data || !data.matrix_data || data.matrix_data.length === 0) return null;
    
    return (
      <div className="card shadow-sm mb-5">
        <div className="card-header border-0 pt-5 pb-0">
          <div className="d-flex flex-wrap flex-stack">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-40px me-4">
                <div className="symbol-label fs-1 bg-light-success text-success">
                  <KTIcon iconName="chart-line" className="fs-2x" />
                </div>
              </div>
              <div className="d-flex flex-column">
                <h3 className="card-title align-items-start flex-column mb-0">
                  <span className="card-label fw-bold fs-2">Position-wise Salary Data</span>
                  <span className="text-muted fw-semibold fs-6">Detailed salary information by position</span>
                </h3>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body py-3">
          <div className="table-responsive">
            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
              <thead>
                <tr className="fw-bold text-muted text-uppercase fs-7">
                  <th className="min-w-200px">Position</th>
                  <th className="min-w-150px">Total Employees</th>
                  <th className="min-w-200px">Total Salary</th>
                  <th className="min-w-150px">Average Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.matrix_data.map((position, index) => (
                  <tr key={index} className="border-bottom border-gray-200">
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="symbol symbol-40px symbol-circle me-3">
                          <div className="symbol-label bg-light-primary text-primary fw-bold fs-4">
                            {position.position.charAt(0)}
                          </div>
                        </div>
                        <div className="d-flex justify-content-start flex-column">
                          <a 
                            href="#" 
                            className="text-dark fw-bold text-hover-primary fs-6" 
                            onClick={(e) => {
                              e.preventDefault();
                              handlePositionClick(position);
                            }}
                          >
                            {position.position}
                          </a>
                          <span className="text-muted fw-semibold text-muted d-block fs-7">Position</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="text-dark fw-bold d-block fs-6">
                          {position.total_employees_all_months}
                        </span>
                        <span className="text-muted fw-semibold text-muted d-block fs-7">Employees</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="text-dark fw-bold d-block fs-6">
                          ₹{position.total_salary_all_months.toLocaleString()}
                        </span>
                        <span className="text-muted fw-semibold text-muted d-block fs-7">Total Salary</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="text-dark fw-bold d-block fs-6">
                          {position.average_rating_all_months.toFixed(2)}%
                        </span>
                        <span className="text-muted fw-semibold text-muted d-block fs-7">Avg Rating</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render monthly breakdown table
  const renderMonthlyBreakdown = () => {
    if (!data || !data.matrix_data || data.matrix_data.length === 0) return null;
    
    return (
      <div className="card shadow-sm">
        <div className="card-header border-0 pt-5 pb-0">
          <div className="d-flex flex-wrap flex-stack">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-40px me-4">
                <div className="symbol-label fs-1 bg-light-info text-info">
                  <KTIcon iconName="calendar" className="fs-2x" />
                </div>
              </div>
              <div className="d-flex flex-column">
                <h3 className="card-title align-items-start flex-column mb-0">
                  <span className="card-label fw-bold fs-2">Monthly Breakdown by Position</span>
                  <span className="text-muted fw-semibold fs-6">Detailed monthly salary and performance data</span>
                </h3>
              </div>
            </div>
          </div>
        </div>
        <div className="card-body py-3">
          <div className="table-responsive">
            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
              <thead>
                <tr className="fw-bold text-muted text-uppercase fs-7">
                  <th className="min-w-150px">Position</th>
                  <th className="min-w-150px">Month/Year</th>
                  <th className="min-w-100px">Employees</th>
                  <th className="min-w-150px">Total Salary</th>
                  <th className="min-w-100px">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.matrix_data.map((position, posIndex) => (
                  position.monthly_data.map((monthData, monthIndex) => (
                    <tr key={`${posIndex}-${monthIndex}`} className="border-bottom border-gray-200">
                      {monthIndex === 0 ? (
                        <td rowSpan={position.monthly_data.length}>
                          <div className="d-flex align-items-center">
                            <div className="symbol symbol-40px symbol-circle me-3">
                              <div className="symbol-label bg-light-primary text-primary fw-bold fs-4">
                                {position.position.charAt(0)}
                              </div>
                            </div>
                            <div className="d-flex flex-column">
                              <span className="text-dark fw-bold d-block fs-6">
                                {position.position}
                              </span>
                              <span className="text-muted fw-semibold text-muted d-block fs-7">Position</span>
                            </div>
                          </div>
                        </td>
                      ) : null}
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-dark fw-bold d-block fs-6">
                            {monthData.month_year}
                          </span>
                          <span className="text-muted fw-semibold text-muted d-block fs-7">Month/Year</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-dark fw-bold d-block fs-6">
                            {monthData.employee_count}
                          </span>
                          <span className="text-muted fw-semibold text-muted d-block fs-7">Employees</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-dark fw-bold d-block fs-6">
                            ₹{monthData.total_salary.toLocaleString()}
                          </span>
                          <span className="text-muted fw-semibold text-muted d-block fs-7">Total Salary</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-dark fw-bold d-block fs-6">
                            {monthData.average_task_rating.toFixed(2)}%
                          </span>
                          <span className="text-muted fw-semibold text-muted d-block fs-7">Avg Rating</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <PageTitle breadcrumbs={[]}>HR Matrix Dashboard</PageTitle>
      
      <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0 pt-5 pb-0">
          <div className="d-flex flex-wrap flex-stack justify-content-between w-100">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-40px me-4">
                <div className="symbol-label fs-1 bg-light-primary text-primary">
                  <KTIcon iconName="chart-line" className="fs-2x" />
                </div>
              </div>
              <div className="d-flex flex-column">
                <h3 className="card-title align-items-start flex-column mb-0">
                  <span className="card-label fw-bold fs-2">HR Matrix Dashboard</span>
                  <span className="text-muted fw-semibold fs-6">Employee salary and performance data by position</span>
                </h3>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-3 mt-5 mt-md-0">
              <div className="fv-row">
                <select 
                  className="form-select form-select-solid"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {monthNames.map((month, index) => (
                    <option key={index} value={String(index + 1)}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fv-row">
                <select 
                  className="form-select form-select-solid"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body py-3">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-10">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger d-flex align-items-center p-5 mb-5">
              <KTIcon iconName="information-5" className="fs-2qx text-danger me-4" />
              <div className="d-flex flex-column">
                <h5 className="mb-1">Error Occurred</h5>
                <span>{error}</span>
              </div>
            </div>
          ) : data ? (
            <>
              <div className="row g-5 g-xl-8 mb-5">
                <div className="col-sm-6 col-xl-3 mb-5 mb-xl-0">
                  <div className="card shadow-sm hover-elevate-up overflow-hidden">
                    <div className="card-body d-flex flex-column align-items-center text-center">
                      <div className="d-flex align-items-center mb-2">
                        <span className="fs-4 fw-semibold text-gray-400 me-1">#</span>
                        <span className="fs-2hx fw-bold text-gray-800">{data.overall_totals.total_positions}</span>
                      </div>
                      <span className="text-gray-600 fw-semibold fs-6">Positions</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-sm-6 col-xl-3 mb-5 mb-xl-0">
                  <div className="card shadow-sm hover-elevate-up overflow-hidden">
                    <div className="card-body d-flex flex-column align-items-center text-center">
                      <div className="d-flex align-items-center mb-2">
                        <span className="fs-4 fw-semibold text-gray-400 me-1">#</span>
                        <span className="fs-2hx fw-bold text-gray-800">{data.overall_totals.total_employees_all_months}</span>
                      </div>
                      <span className="text-gray-600 fw-semibold fs-6">Employees</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-sm-6 col-xl-3 mb-5 mb-xl-0">
                  <div className="card shadow-sm hover-elevate-up overflow-hidden">
                    <div className="card-body d-flex flex-column align-items-center text-center">
                      <div className="d-flex align-items-center mb-2">
                        <span className="fs-4 fw-semibold text-gray-400 me-1">₹</span>
                        <span className="fs-2hx fw-bold text-gray-800">{data.overall_totals.total_salary_all_months.toLocaleString()}</span>
                      </div>
                      <span className="text-gray-600 fw-semibold fs-6">Total Salary</span>
                    </div>
                  </div>
                </div>
                
                <div className="col-sm-6 col-xl-3 mb-5 mb-xl-0">
                  <div className="card shadow-sm hover-elevate-up overflow-hidden">
                    <div className="card-body d-flex flex-column align-items-center text-center">
                      <div className="d-flex align-items-center mb-2">
                        <span className="fs-4 fw-semibold text-gray-400 me-1">Avg</span>
                        <span className="fs-2hx fw-bold text-gray-800">{data.overall_totals.overall_average_rating.toFixed(2)}%</span>
                      </div>
                      <span className="text-gray-600 fw-semibold fs-6">Performance Rating</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row g-5 g-xl-8 mb-5">
                <div className="col-xxl-12">
                  <div className="card shadow-sm">
                    <div className="card-header border-0 pt-5">
                      <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold fs-3">Position-wise Salary Distribution</span>
                        <span className="text-muted mt-2 fw-semibold fs-6">Total salary by position</span>
                      </h3>
                      <div className="card-toolbar">
                        <KTIcon iconName="chart-pie-3" className="text-primary fs-1" />
                      </div>
                    </div>
                    <div className="card-body pt-0">
                      {renderSalaryChart()}
                    </div>
                  </div>
                </div>
                {/* <div className="col-xxl-12">
                  <div className="card shadow-sm">
                    <div className="card-header border-0 pt-5">
                      <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold fs-3">Position-wise Performance Rating</span>
                        <span className="text-muted mt-2 fw-semibold fs-6">Average rating by position</span>
                      </h3>
                      <div className="card-toolbar">
                        <KTIcon iconName="chart-simple" className="text-primary fs-1" />
                      </div>
                    </div>
                    <div className="card-body pt-0">
                      {renderRatingChart()}
                    </div>
                  </div>
                </div> */}
              </div>
              
              {renderSalaryTable()}
              {renderMonthlyBreakdown()}
              
              {/* Employee Modal */}
              {showEmployeeModal && selectedPosition && (
                <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h3 className="modal-title">
                          <span className="fw-bold text-primary">{selectedPosition.position}</span> - Employees
                        </h3>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => {
                            setShowEmployeeModal(false);
                            setSelectedPosition(null);
                          }}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <div className="row mb-5">
                          <div className="col-md-4">
                            <div className="card bg-light-primary border-primary border-2">
                              <div className="card-body text-center">
                                <div className="fs-1 fw-bold text-primary mb-2">
                                  {selectedPosition.total_employees_all_months}
                                </div>
                                <div className="fs-6 text-muted">Total Employees</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card bg-light-success border-success border-2">
                              <div className="card-body text-center">
                                <div className="fs-1 fw-bold text-success mb-2">
                                  ₹{selectedPosition.total_salary_all_months.toLocaleString()}
                                </div>
                                <div className="fs-6 text-muted">Total Salary</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card bg-light-info border-info border-2">
                              <div className="card-body text-center">
                                <div className="fs-1 fw-bold text-info mb-2">
                                  {selectedPosition.average_rating_all_months.toFixed(2)}%
                                </div>
                                <div className="fs-6 text-muted">Average Rating</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="card shadow-sm">
                          <div className="card-header">
                            <h4 className="card-title">Employee Details</h4>
                          </div>
                          <div className="card-body">
                            {selectedPosition.monthly_data && selectedPosition.monthly_data.length > 0 ? (
                              <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                  <thead>
                                    <tr className="fw-bold text-muted">
                                      <th className="min-w-150px">Employee Name</th>
                                      <th className="min-w-120px">Month/Year</th>
                                      <th className="min-w-100px">Salary</th>
                                      <th className="min-w-100px">Rating</th>
                                      <th className="min-w-150px">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedPosition.monthly_data.flatMap((monthData, monthIndex) => 
                                      monthData.employees && monthData.employees.length > 0 ? 
                                        monthData.employees.map((employee: any, empIndex: number) => (
                                          <tr key={`${monthIndex}-${empIndex}`}>
                                            <td>
                                              <div className="d-flex align-items-center">
                                                <div className="symbol symbol-40px symbol-circle me-3">
                                                  <div className="symbol-label bg-light-primary text-primary fw-bold">
                                                    {employee.employee_name ? employee.employee_name.charAt(0).toUpperCase() : 'U'}
                                                  </div>
                                                </div>
                                                <div className="d-flex flex-column">
                                                  <span className="text-dark fw-bold fs-6">
                                                    {employee.employee_name || 'Unknown Employee'}
                                                  </span>
                                                  <span className="text-muted fs-7">
                                                    ID: {employee.employee_id || 'N/A'}
                                                  </span>
                                                </div>
                                              </div>
                                            </td>
                                            <td>
                                              <span className="fw-bold text-dark">
                                                {monthData.month_year}
                                              </span>
                                            </td>
                                            <td>
                                              <span className="fw-bold text-success">
                                                ₹{(employee.final_salary || 0).toLocaleString()}
                                              </span>
                                            </td>
                                            <td>
                                              <div className="d-flex align-items-center">
                                                <div className="bullet bullet-dot bg-success me-2"></div>
                                                <span className="fw-bold text-dark">
                                                  {employee.task_rating ? employee.task_rating.toFixed(2) : 'N/A'}%
                                                </span>
                                              </div>
                                            </td>
                                            <td>
                                              <span className={`badge badge-light-success fs-7 fw-semibold`}>
                                                Active
                                              </span>
                                            </td>
                                          </tr>
                                        )) : (
                                          <tr>
                                            <td colSpan={5} className="text-center py-5">
                                              <div className="text-muted">No employee data available for this position</div>
                                            </td>
                                          </tr>
                                        )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-10">
                                <KTIcon iconName="folder-open" className="text-gray-500 fs-2qx mb-5" />
                                <h4 className="text-gray-700">No Employee Data</h4>
                                <p className="text-gray-500">No employee records found for this position.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-light" 
                          onClick={() => {
                            setShowEmployeeModal(false);
                            setSelectedPosition(null);
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center py-10">
              <div className="mb-7">
                <KTIcon iconName="folder-open" className="text-gray-600 fs-2qx" />
              </div>
              <h3 className="text-gray-600 fs-4 mb-2">No data available</h3>
              <span className="text-gray-400 fs-6">Try adjusting your filters or check back later</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HrMatrix
