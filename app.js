// Initialize the Leaflet map centered at coordinates (20, 0) with a global view
var map = L.map('map').setView([20, 0], 2); 

// Define the boundaries for the map to prevent excessive zooming out
var bounds = [
    [-90, -180], // Southwest corner
    [90, 180]    // Northeast corner
];

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    noWrap: true // Prevent map tiles from repeating
}).addTo(map);

// Set maximum bounds for the map to restrict panning outside the world view
map.setMaxBounds(bounds);

// Initialize arrays to store earthquake data and last updated time
let earthquakeData = [];
let lastUpdated = '';

// Function to determine color based on earthquake magnitude
function getColor(magnitude) {
    if (magnitude > 6) return '#FF0000'; // Red for severe
    if (magnitude > 5) return '#FF8000'; // Orange for strong
    if (magnitude > 4) return '#FFFF00'; // Yellow for moderate
    if (magnitude > 3) return '#90EE90'; // Light Green for light
    return '#00FF00'; // Green for minor
}

// Function to calculate radius based on earthquake magnitude
function getRadius(magnitude) {
    return Math.pow(2, magnitude) * 1000; // Exponential scaling of radius
}

// Fetch real-time earthquake data from the USGS API
async function fetchEarthquakeData() {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=100&orderby=time`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Log fetched data to the console
        console.log(data);
       
        earthquakeData = data.features; // Store earthquake data globally
        lastUpdated = new Date(data.metadata.time).toLocaleString('en-US', { timeZone: 'UTC' }); // Format last updated time
        updateMap(data); // Update map markers with new data
        updateD3Chart(data); // Update D3 chart with new data
        updateLastUpdated(); // Update last updated display on the UI
    } catch (error) {
        console.error('Error fetching earthquake data:', error); // Log errors
    }
}

// Function to display last updated time on the map
function updateLastUpdated() {
    document.getElementById('last-updated').innerText = `Last Updated: ${lastUpdated}`;
}

// Function to refresh the map with new earthquake markers
function updateMap(data) {
    // Clear existing markers from the map
    map.eachLayer(layer => {
        if (layer instanceof L.Circle) {
            map.removeLayer(layer);
        }
    });

    // Add markers for each earthquake
    data.features.forEach(d => {
        var coords = d.geometry.coordinates;
        var magnitude = d.properties.mag;

        // Create a circle for each earthquake marker
        var circle = L.circle([coords[1], coords[0]], {
            color: getColor(magnitude), // Color based on magnitude
            fillColor: getColor(magnitude),
            fillOpacity: 0.5,
            radius: getRadius(magnitude) // Radius based on magnitude
        }).addTo(map);

        // Bind a popup with earthquake details
        circle.bindPopup(`
            <b>Location:</b> ${d.properties.place}<br/>
            <b>Magnitude:</b> ${magnitude}<br/>
            <b>Time:</b> ${new Date(d.properties.time).toLocaleString()}
        `);

        // Store magnitude for interactivity
        circle.magnitude = magnitude;
    });
}

// Function to update the D3 chart with earthquake magnitudes
function updateD3Chart(data) {
    // Prepare data for the chart
    const magnitudeCounts = {};

    // Count occurrences of each magnitude range
    data.features.forEach(d => {
        const magnitude = d.properties.mag;
        const range = Math.floor(magnitude; // Group by magnitude range
        magnitudeCounts[range] = (magnitudeCounts[range] || 0) + 1; // Count occurrences
    });

    const chartData = Object.keys(magnitudeCounts).map(range => ({
        magnitude: parseFloat(range), // Convert key to float
        count: magnitudeCounts[range]
    }));

    // Set chart dimensions and margins
    const margin = { top: 20, right: 30, bottom: 40, left: 40 },
          width = 300 - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;

    // Remove existing chart if present
    d3.select("#chart").select("svg").remove();

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define scales for the chart
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.magnitude))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.count)])
        .range([height, 0]);

    // Add X and Y axes
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format(".1f"))); // Format ticks

    svg.append("g")
        .call(d3.axisLeft(y));

    // Create bars for the chart
    svg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.magnitude))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.count))
        .attr("height", d => height - y(d.count))
        .attr("fill", d => getColor(d.magnitude)) // Color based on magnitude
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#FF6347"); // Change color on hover
            highlightMarkers(d.magnitude); // Highlight corresponding markers
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("fill", getColor(d.magnitude)); // Reset color
            resetMarkers(); // Reset markers
        })
        .on("click", function(event, d) {
            alert(`Magnitude: ${d.magnitude}\nCount: ${d.count}\nLast Updated: ${lastUpdated}`); // Show details in alert
        });

    // Function to highlight markers based on magnitude range
    function highlightMarkers(magnitude) {
        const lowerBound = magnitude; // Lower bound
        const upperBound = magnitude + 1; // Upper bound

        // Reset previous highlights
        resetMarkers();

        // Highlight markers in the specified range
        map.eachLayer(layer => {
            if (layer instanceof L.Circle) {
                const layerMagnitude = layer.magnitude;
                if (layerMagnitude >= lowerBound && layerMagnitude < upperBound) {
                    layer.setStyle({ weight: 5, color: '#0000FF' }); // Highlight style
                }
            }
        });
    }

    // Function to reset marker styles to default
    function resetMarkers() {
        map.eachLayer(layer => {
            if (layer instanceof L.Circle) {
                layer.setStyle({ weight: 1, color: layer.options.color }); // Reset to original style
            }
        });
    }

    // Add title to the chart
    svg.append("text")
        .attr("x", (width / 2))            
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")
        .text("Earthquake Magnitude Counts");
}

// Fetch data initially when the script runs
fetchEarthquakeData();

// Set an interval to refresh data every minute
setInterval(fetchEarthquakeData, 60000); // Refresh every minute
