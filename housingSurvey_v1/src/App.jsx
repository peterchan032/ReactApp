import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

// --- Icons (imported from separate files) ---
import HousingDensityIcon from './assets/HousingDensityIcon.svg';
import DollarIcon from './assets/HouseholdIncome.svg';
import UsersIcon from './assets/Population.svg';
import BuildingIcon from './assets/HouseInterest.svg';
import AMIIcon from './assets/threshold.svg';
import HouseValueIcon from './assets/HouseValue.svg';
import PlacerLogo from './assets/PlacerLogo.svg';

// --- Mock Data based on the provided PNG ---
const infographicData = {
  header: {
    title: "Housing Survey",
    subtitle: "Downtown Chicago • 101 Michigan Ave, Chicago IL",
  },
  tradeArea: {
    area: "78.54 sq/mi",
    center: {
        lng: -87.6233, // Mock longitude for Chicago
        lat: 41.8827   // Mock latitude for Chicago
    }
  },
  keyMetrics: [
    { title: "Housing Density", value: "1,111", subValue: "Units/Sq Mi", icon: HousingDensityIcon },
    { title: "Median HH Inc", value: "$111K", subValue: "2028: 1.1%", icon: DollarIcon },
    { title: "Avg Household Size", value: "2.42", subValue: "2028: 1.1%", icon: UsersIcon },
    { title: "Mortgage Interest Yr", value: "$6.6K", subValue: "", icon: BuildingIcon },
    { title: "30% AMI HHI Thresh", value: "$71.6K", subValue: "", icon: AMIIcon },
    { title: "Median Home Value", value: "$77.7K", subValue: "", icon: HouseValueIcon },
  ],
  housingVsEmployment: [
    { year: '2019', "Housing Units": -2, "Employed Population": -1.5 },
    { year: '2020', "Housing Units": 1, "Employed Population": 0.5 },
    { year: '2021', "Housing Units": 2, "Employed Population": 1.5 },
    { year: '2022', "Housing Units": 4, "Employed Population": 3 },
    { year: '2023', "Housing Units": 5, "Employed Population": 4 },
  ],
  monthlyRent: {
    median: { rent: "$1,810", benchmark: "129" },
    breakdown: [
      { range: "$1K & Below", value: "20.0%", benchmark: "130" },
      { range: "$1K - 2K", value: "20.0%", benchmark: "400" },
      { range: "$2K - 3K", value: "20.0%", benchmark: "130" },
      { range: "$3K & Above", value: "20.0%", benchmark: "400" },
    ]
  },
  housingUnits: {
    total: 86972,
    owned: 41195,
    rented: 38000,
    vacant: 7777,
  },
  yearBuilt: [
    { name: '<1939', "Housing Units": 5000, percentage: 11 },
    { name: '1940-49', "Housing Units": 7000, percentage: 15 },
    { name: '1950-59', "Housing Units": 5000, percentage: 11 },
    { name: '1960-69', "Housing Units": 2500, percentage: 5 },
    { name: '1970-79', "Housing Units": 7000, percentage: 15 },
    { name: '1980-89', "Housing Units": 5000, percentage: 11 },
    { name: '1990-99', "Housing Units": 8000, percentage: 18 },
    { name: '2000-09', "Housing Units": 7000, percentage: 15 },
    { name: '>2010', "Housing Units": 1000, percentage: 2 },
  ],
  ownerOccupiedValue: [
    { name: '<$100K', "Housing Units": 5000, percentage: 11 },
    { name: '$100K-200K', "Housing Units": 7000, percentage: 15 },
    { name: '$200K-300K', "Housing Units": 5000, percentage: 11 },
    { name: '$300K-400K', "Housing Units": 2500, percentage: 5 },
    { name: '$400K-500K', "Housing Units": 7000, percentage: 15 },
    { name: '$500K-1M', "Housing Units": 5000, percentage: 11 },
    { name: '>$1M', "Housing Units": 8000, percentage: 18 },
  ],
};

// --- Reusable Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md h-full flex flex-col ${className}`}>
    <div className="p-3 border-b border-gray-200">
        {children[0]}
    </div>
    <div className="p-3 flex-grow min-h-0">
        {children[1]}
    </div>
  </div>
);

const ChartTitle = ({ children }) => (
  <h3 className="text-sm font-bold text-gray-700">{children}</h3>
);

// --- Main Components ---
const Header = ({ title, subtitle }) => (
  <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-t-xl" style={{backgroundColor: '#5E63E5'}}>
    <div>
      <h1 className="text-2xl md:text-4xl font-bold text-white">{title}</h1>
      <p className="text-sm md:text-base text-white/90">{subtitle}</p>
    </div>
    <div className="flex flex-col items-end mt-4 sm:mt-0">
        <div className="flex items-center gap-4">
            <img src={PlacerLogo} alt="Placer.ai Logo" className="h-7" />
        </div>
        <p className="text-xs text-white/80 mt-1 text-right">This infographic contains Placer.ai data</p>
    </div>
  </header>
);

const TradeAreaMap = ({ area, center }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        const handleMapboxLoaded = () => {
            setMapLoaded(true);
        };
        if (window.mapboxgl) {
            setMapLoaded(true);
        } else {
            window.addEventListener('mapboxgl-loaded', handleMapboxLoaded);
        }
        return () => {
            window.removeEventListener('mapboxgl-loaded', handleMapboxLoaded);
        };
    }, []);

    useEffect(() => {
        if (!mapLoaded || map.current) return; // initialize map only once

        const lng = center.lng;
        const lat = center.lat;
        const zoom = 10;
        window.mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        map.current = new window.mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/placermapteam/cm72gi2bm008501s833pccde9',
            center: [lng, lat],
            zoom: zoom
        });

        const createGeoJSONCircle = (center, radiusInMiles, points = 64) => {
            const coords = { latitude: center[1], longitude: center[0] };
            const km = radiusInMiles * 1.60934;
            const ret = [];
            const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
            const distanceY = km / 110.574;
            for (let i = 0; i < points; i++) {
                let theta = (i / points) * (2 * Math.PI);
                let x = distanceX * Math.cos(theta);
                let y = distanceY * Math.sin(theta);
                ret.push([coords.longitude + x, coords.latitude + y]);
            }
            ret.push(ret[0]);
            return {
                "type": "geojson",
                "data": { "type": "FeatureCollection", "features": [{ "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [ret] } }] }
            };
        };

        map.current.on('load', () => {
            // Custom SVG marker with #5E63E5 color
            const markerEl = document.createElement('div');
            markerEl.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="#5E63E5" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>`;
            markerEl.style.width = '32px';
            markerEl.style.height = '32px';
            markerEl.style.display = 'flex';
            markerEl.style.alignItems = 'center';
            markerEl.style.justifyContent = 'center';
            new window.mapboxgl.Marker(markerEl).setLngLat([lng, lat]).addTo(map.current);

            const fiveMileRadius = createGeoJSONCircle([lng, lat], 5);
            map.current.addSource('trade-area', fiveMileRadius);
            map.current.addLayer({
                'id': 'trade-area-fill', 'type': 'fill', 'source': 'trade-area', 'layout': {},
                'paint': { 'fill-color': '#5E63E5', 'fill-opacity': 0.3 }
            });
            map.current.addLayer({
                'id': 'trade-area-outline', 'type': 'line', 'source': 'trade-area', 'layout': {},
                'paint': { 'line-color': '#5E63E5', 'line-width': 2 }
            });
        });
    }, [mapLoaded, center]);

    return (
      <div className="bg-white rounded-xl shadow-md h-full flex flex-col">
        <div className="p-3 border-b border-gray-200">
            <ChartTitle>Trade Area ({area})</ChartTitle>
        </div>
        <div className="p-2 flex-grow min-h-[250px] rounded-lg">
            {mapLoaded ? 
                <div ref={mapContainer} className="w-full h-full rounded-lg" /> :
                <div>Loading map...</div>
            }
        </div>
      </div>
    );
};


const KeyMetricCard = ({ metric }) => (
  <div className="bg-white rounded-xl shadow-md flex items-center p-3">
    <div className="w-16 h-16 bg-[#E1E2FF] rounded-lg flex items-center justify-center p-3 mr-4">
        <img src={metric.icon} alt={metric.title + ' icon'} className="w-full h-full object-contain" />
    </div>
    <div>
      <p className="text-sm text-gray-600 font-semibold">{metric.title}</p>
      <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
      <p className="text-sm text-gray-500">{metric.subValue}</p>
    </div>
  </div>
);

const HousingEmploymentChart = ({ data }) => (
  <Card>
    <ChartTitle>Housing vs Employment Trend</ChartTitle>
    <div className="w-full h-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} style={{ fontSize: '12px' }}/>
                <YAxis unit="%" label={{ value: '% Change From 2019', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '12px', textAnchor: 'middle' } }} axisLine={false} tickLine={false} style={{ fontSize: '12px' }}/>
                <Tooltip contentStyle={{ fontSize: '12px' }}/>
                <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                <Line type="monotone" dataKey="Housing Units" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Employed Population" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  </Card>
);

const RentAnalysis = ({ data }) => (
    <Card>
        <ChartTitle>Monthly Housing Rent</ChartTitle>
        <div className="flex-grow flex flex-col justify-center">
            <table className="w-full text-sm text-gray-800">
                <thead>
                    <tr className="border-b">
                        <th className="text-left font-semibold p-2"></th>
                        <th className="text-right font-semibold p-2"></th>
                        <th className="text-right font-semibold p-2 text-gray-500">Benchmark</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b">
                        <td className="p-2 font-medium">Median Rent</td>
                        <td className="text-right p-2 font-bold">{data.median.rent}</td>
                        <td className="text-right p-2 text-gray-500">{data.median.benchmark}</td>
                    </tr>
                    {data.breakdown.map(item => (
                        <tr key={item.range} className="border-b border-gray-100 last:border-b-0">
                            <td className="p-2">{item.range}</td>
                            <td className="text-right p-2 font-medium">{item.value}</td>
                            <td className="text-right p-2 text-gray-500">{item.benchmark}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

const HousingUnits = ({ data }) => {
    const pieData = [
        { name: 'Owned', value: data.owned, percentage: 52 },
        { name: 'Rented', value: data.rented, percentage: 41 },
        { name: 'Vacant', value: data.vacant, percentage: 9 },
    ];
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
    return (
        <Card>
            <ChartTitle>Housing Units</ChartTitle>
            <div className="flex-grow flex flex-col md:flex-row items-center gap-4 min-h-[250px]">
                <div className="w-full md:w-1/2 h-full flex flex-col justify-center">
                    <table className="w-full text-sm">
                        <tbody className="text-gray-800">
                            <tr className="border-b"><td className="py-3 px-2">Total</td><td className="py-3 px-2 text-right font-bold">{data.total.toLocaleString()}</td></tr>
                            <tr className="border-b">
                                <td className="py-3 px-2 flex items-center">
                                    <span className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: COLORS[0] }}></span>
                                    Owned
                                </td>
                                <td className="py-3 px-2 text-right font-bold">{data.owned.toLocaleString()}</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-3 px-2 flex items-center">
                                    <span className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: COLORS[1] }}></span>
                                    Rented
                                </td>
                                <td className="py-3 px-2 text-right font-bold">{data.rented.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-2 flex items-center">
                                    <span className="w-4 h-4 rounded-sm mr-2" style={{ backgroundColor: COLORS[2] }}></span>
                                    Vacant
                                </td>
                                <td className="py-3 px-2 text-right font-bold">{data.vacant.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="w-full md:w-1/2 h-[150px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" fill="#8884d8" paddingAngle={5}>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: '12px' }} formatter={(value, name, props) => `${props.payload.percentage}%`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
};

const CustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  return (
    <text x={x + width / 2} y={y} fill="#6b7280" textAnchor="middle" dy={-4} style={{fontSize: '12px'}}>
      {`${value}%`}
    </text>
  );
};

const StructureBarChart = ({ data, title, yAxisLabel }) => (
  <Card>
    <ChartTitle>{title}</ChartTitle>
    <div className="w-full h-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={0} />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="Housing Units" fill="#5E63E5">
                    <LabelList dataKey="percentage" content={<CustomBarLabel />} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  </Card>
);

const Footer = () => (
    <div className="text-center text-xs text-gray-500 p-4 border-t bg-white rounded-b-xl">
        Ring Radius (5 miles) | Potential Market | Jan 1st, 2023 - Dec 31st, 2023 | Data Source: STI: Popstats; AGS: Demographic Dimensions
    </div>
);

// --- Main App Component ---
export default function App() {
  const data = infographicData;

  useEffect(() => {
    const mapboxScriptId = 'mapbox-gl-js';
    const mapboxCssId = 'mapbox-gl-css';

    if (!window._mapboxScriptLoaded) {
      if (!document.getElementById(mapboxScriptId)) {
        const mapboxScript = document.createElement('script');
        mapboxScript.id = mapboxScriptId;
        mapboxScript.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
        mapboxScript.async = true;
        mapboxScript.onload = () => {
          window._mapboxScriptLoaded = true;
          window.dispatchEvent(new Event('mapboxgl-loaded'));
        };
        document.body.appendChild(mapboxScript);
      }
      if (!document.getElementById(mapboxCssId)) {
        const mapboxCss = document.createElement('link');
        mapboxCss.id = mapboxCssId;
        mapboxCss.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
        mapboxCss.rel = 'stylesheet';
        document.head.appendChild(mapboxCss);
      }
    } else {
      window.dispatchEvent(new Event('mapboxgl-loaded'));
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F0F3F7] font-sans p-4">
      <div className="w-full max-w-[1320px] mx-auto">
        <div className="bg-white rounded-xl shadow-lg">
            <Header title={data.header.title} subtitle={data.header.subtitle} />
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-1">
                <TradeAreaMap area={data.tradeArea.area} center={data.tradeArea.center} />
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {data.keyMetrics.map(metric => <KeyMetricCard key={metric.title} metric={metric} />)}
            </div>

            <div className="lg:col-span-1">
                <HousingEmploymentChart data={data.housingVsEmployment} />
            </div>
            <div className="lg:col-span-1">
                <RentAnalysis data={data.monthlyRent} />
            </div>
            <div className="lg:col-span-1">
                <HousingUnits data={data.housingUnits} />
            </div>

            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <StructureBarChart data={data.yearBuilt} title="Year Structure Built" yAxisLabel="Housing Units" />
                 <StructureBarChart data={data.ownerOccupiedValue} title="Value of Owner-Occupied Housing Units" yAxisLabel="Housing Units" />
            </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
