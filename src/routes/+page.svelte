<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let mainSvg;
  let trendSvg;
  let selectedPoints = [];
  let isLassoing = false;
  let data = [];
  let selectedFile = 'umap-name-etymology.json';

  // Available data files based on your directory structure
  const availableFiles = [
    'umap-etymology-origin-active-years.json',
    'umap-etymology-origin-peak-decade.json', 
    'umap-etymology-origin.json',
    'umap-etymology.json',
    'umap-name-etymology-active-years.json',
    'umap-name-etymology-origin-active-years.json',
    'umap-name-etymology-origin-peak-decade.json',
    'umap-name-etymology-origin.json',
    'umap-name-etymology.json',
    'umap-name-origin-active-years.json',
    'umap-name-origin-peak-decade.json', 
    'umap-name-origin.json',
    'umap-name.json',
    'umap-origin.json'
  ];

  // Sample data - replace with your actual JSON data
  const sampleData = [
    { "Name":"Abby", "1976":256.0, "1977":142.0, "1978":312.0, "1979":791.0, "1980":467.5, "1981":608.5, "1982":653.0, "1983":657.5, "1984":1263.0, "1985":607.5, "x":8.6866903305, "y":3.9082963467 },
    { "Name":"Abel", "1976":395.0, "1977":347.0, "1978":371.0, "1979":217.0, "1980":240.0, "1981":242.0, "1982":467.0, "1983":217.5, "1984":427.0, "1985":461.0, "x":6.3117189407, "y":2.1993675232 },
    { "Name":"Abigail", "1976":417.5, "1977":795.0, "1978":1010.0, "1979":1225.0, "1980":793.0, "1981":911.0, "1982":946.5, "1983":961.0, "1984":924.5, "1985":930.5, "x":8.9767932892, "y":3.9221160412 },
    { "Name":"Aaron", "1976":1205.0, "1977":1089.0, "1978":1052.0, "1979":1031.0, "1980":1012.0, "1981":995.0, "1982":982.0, "1983":975.0, "1984":968.0, "1985":962.0, "x":5.2345678901, "y":1.8765432109 },
    { "Name":"Ada", "1976":45.0, "1977":52.0, "1978":48.0, "1979":51.0, "1980":49.0, "1981":53.0, "1982":56.0, "1983":58.0, "1984":62.0, "1985":65.0, "x":9.1234567890, "y":4.5678901234 }
  ];

  // Extract year columns from data
  const getYearColumns = (dataPoint) => {
    const years = [];
    Object.keys(dataPoint).forEach(key => {
      if (key.match(/^\d{4}$/)) { // Match 4-digit years
        years.push(key);
      }
    });
    return years.sort();
  };

  // Point-in-polygon test for lasso selection
  const pointInPolygon = (point, polygon) => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  const initializeUMAPPlot = () => {
    const svg = d3.select(mainSvg);
    const width = 500;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 40, left: 40 };

    svg.selectAll("*").remove();

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x))
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y))
      .range([height - margin.bottom, margin.top]);

    // Color scale based on total births across all years (excluding -1.0 values)
    const totalBirths = data.map(d => {
      const years = getYearColumns(d);
      return years.reduce((sum, year) => {
        const births = d[year];
        return births !== -1.0 && births > 0 ? sum + births : sum;
      }, 0);
    });

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(totalBirths));

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("UMAP X");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("UMAP Y");

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("UMAP Embeddings - Draw Lasso to Select Names");

    // Create points
    const points = svg.selectAll(".point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 4)
      .attr("fill", (d, i) => colorScale(totalBirths[i]))
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .append("title")
      .text(d => d.Name);

    // Create lasso path element
    const lassoPathElement = svg.append("path")
      .attr("class", "lasso-path")
      .attr("fill", "none")
      .attr("stroke", "#ff6b6b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .style("opacity", 0);

    // Lasso interaction
    let drawing = false;
    let currentPath = [];

    const startLasso = (event) => {
      drawing = true;
      isLassoing = true;
      currentPath = [];
      const [x, y] = d3.pointer(event, svg.node());
      currentPath.push([x, y]);
      lassoPathElement.style("opacity", 1);
    };

    const continueLasso = (event) => {
      if (!drawing) return;
      const [x, y] = d3.pointer(event, svg.node());
      currentPath.push([x, y]);
      
      const pathString = d3.line()(currentPath);
      lassoPathElement.attr("d", pathString);
    };

    const endLasso = () => {
      if (!drawing) return;
      drawing = false;
      isLassoing = false;
      
      // Close the path
      if (currentPath.length > 2) {
        currentPath.push(currentPath[0]);
      }

      // Find selected points
      const selected = data.filter(d => {
        const point = [xScale(d.x), yScale(d.y)];
        return pointInPolygon(point, currentPath);
      });

      selectedPoints = selected;
      
      // Update point styles
      svg.selectAll(".point")
        .attr("stroke", d => selected.includes(d) ? "#ff6b6b" : "#333")
        .attr("stroke-width", d => selected.includes(d) ? 3 : 1)
        .attr("r", d => selected.includes(d) ? 6 : 4);

      // Update trend plot
      updateTrendPlot();

      // Hide lasso path
      lassoPathElement.style("opacity", 0);
      currentPath = [];
    };

    // Add event listeners
    svg.on("mousedown", startLasso)
       .on("mousemove", continueLasso)
       .on("mouseup", endLasso);

    // Clear selection button
    svg.append("rect")
      .attr("x", width - 100)
      .attr("y", 50)
      .attr("width", 80)
      .attr("height", 25)
      .attr("fill", "#007bff")
      .attr("stroke", "#0056b3")
      .attr("rx", 3)
      .style("cursor", "pointer")
      .on("click", clearSelection);

    svg.append("text")
      .attr("x", width - 60)
      .attr("y", 67)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "12px")
      .style("cursor", "pointer")
      .text("Clear")
      .on("click", clearSelection);

    function clearSelection() {
      selectedPoints = [];
      svg.selectAll(".point")
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("r", 4);
      updateTrendPlot();
    }
  };

  const updateTrendPlot = () => {
    const svg = d3.select(trendSvg);
    const width = 500;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };

    svg.selectAll("*").remove();

    if (selectedPoints.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("Select points to view birth trends");
      return;
    }

    // Get all year columns
    const years = getYearColumns(selectedPoints[0]);
    
    // Filter out years with -1.0 values and prepare data for line chart
    const trendData = years.map(year => {
      const yearData = {
        year: +year,
        values: selectedPoints.map(d => ({
          name: d.Name,
          births: d[year] || 0
        })).filter(d => d.births !== -1.0) // Filter out -1.0 values
      };
      return yearData;
    }).filter(yearData => yearData.values.length > 0); // Only keep years that have at least some valid data

    // Create scales
    const validYears = trendData.map(d => d.year);
    const xScale = d3.scaleLinear()
      .domain(d3.extent(validYears))
      .range([margin.left, width - margin.right]);

    // Get all valid birth values (excluding -1.0)
    const allValidBirths = selectedPoints.flatMap(d => 
      years.map(year => d[year]).filter(births => births !== -1.0 && births > 0)
    );
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allValidBirths)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Births");

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Birth Trends (${selectedPoints.length} names selected)`);

    // Line generator
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.births))
      .curve(d3.curveMonotoneX);

    // Draw lines for each selected name
    selectedPoints.forEach((person, i) => {
      // Filter out years with -1.0 values for this person
      const personData = years.map(year => ({
        year: +year,
        births: person[year]
      })).filter(d => d.births !== -1.0 && d.births > 0); // Only include valid data points

      if (personData.length > 0) { // Only draw if there's valid data
        svg.append("path")
          .datum(personData)
          .attr("fill", "none")
          .attr("stroke", colorScale(i))
          .attr("stroke-width", 2)
          .attr("d", line)
          .style("opacity", 0.7);

        // Add dots for valid data points only
        svg.selectAll(`.dot-${i}`)
          .data(personData)
          .enter()
          .append("circle")
          .attr("class", `dot-${i}`)
          .attr("cx", d => xScale(d.year))
          .attr("cy", d => yScale(d.births))
          .attr("r", 3)
          .attr("fill", colorScale(i))
          .append("title")
          .text(d => `${person.Name}: ${d.births} births in ${d.year}`);
      }
    });

    // Add legend if there are multiple names
    if (selectedPoints.length > 1 && selectedPoints.length <= 10) {
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, ${margin.top + 20})`);

      selectedPoints.forEach((person, i) => {
        const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("line")
          .attr("x1", 0)
          .attr("x2", 15)
          .attr("stroke", colorScale(i))
          .attr("stroke-width", 2);

        legendRow.append("text")
          .attr("x", 20)
          .attr("y", 0)
          .attr("dy", "0.35em")
          .style("font-size", "12px")
          .text(person.Name);
      });
    }
  };

  // Function to load data from your JSON files
  const loadData = async (filename = selectedFile) => {
    try {
      // Load from your static/data directory
      const response = await fetch(`/data/${filename}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      // Validate that the data has the expected structure
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const firstItem = jsonData[0];
        if (firstItem.hasOwnProperty('x') && firstItem.hasOwnProperty('y') && firstItem.hasOwnProperty('Name')) {
          data = jsonData;
          console.log(`Loaded ${data.length} data points from ${filename}`);
          
          // Reinitialize plots with new data
          initializeUMAPPlot();
          updateTrendPlot();
        } else {
          console.error('Data does not have expected structure (missing x, y, or Name fields)');
          data = sampleData; // Fallback to sample data
        }
      } else {
        console.error('Data is not a valid array');
        data = sampleData; // Fallback to sample data
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Falling back to sample data');
      data = sampleData; // Fallback to sample data
    }
  };

  // Handle file selection change
  const handleFileChange = async (event) => {
    selectedFile = event.target.value;
    selectedPoints = []; // Clear selection when changing files
    await loadData(selectedFile);
  };

  onMount(async () => {
    await loadData();
    initializeUMAPPlot();
    updateTrendPlot();
  });
</script>

<div class="container">
  <div class="plots-container">
    <div class="plot-container">
      <svg bind:this={mainSvg} width="500" height="400"></svg>
    </div>
    
    <div class="plot-container">
      <svg bind:this={trendSvg} width="500" height="400"></svg>
    </div>
  </div>
  
  <div class="info-panel">
    <div class="file-selector">
      <label for="file-select"><strong>Select Data File:</strong></label>
      <select id="file-select" bind:value={selectedFile} on:change={handleFileChange}>
        {#each availableFiles as file}
          <option value={file}>{file}</option>
        {/each}
      </select>
      <p class="file-info">Currently loaded: {data.length} data points</p>
    </div>
    
    <div class="instructions">
      <h3>Instructions:</h3>
      <ul>
        <li>Select a data file from the dropdown above</li>
        <li>Click and drag on the UMAP plot to draw a lasso around name clusters</li>
        <li>Release the mouse to complete the selection</li>
        <li>Selected names will show their birth trends in the right plot</li>
        <li>Click "Clear" to reset the selection</li>
      </ul>
    </div>
    
    <div class="stats">
      <p><strong>Selected Names:</strong> {selectedPoints.length}</p>
      {#if isLassoing}
        <p class="status">Drawing lasso...</p>
      {/if}
      {#if selectedPoints.length > 0}
        <div class="selected-names">
          <strong>Names:</strong>
          <div class="names-list">
            {#each selectedPoints as point}
              <span class="name-tag">{point.Name}</span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    max-width: 1200px;
    margin: 0 auto;
  }

  .plots-container {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .plot-container {
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .file-selector {
    width: 100%;
    padding: 15px;
    background: #e8f4fd;
    border-radius: 8px;
    border-left: 4px solid #17a2b8;
    margin-bottom: 20px;
  }

  .file-selector label {
    display: block;
    margin-bottom: 8px;
    color: #333;
  }

  .file-selector select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
  }

  .file-info {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    font-style: italic;
  }

  .info-panel {
    margin-top: 20px;
  }

  .instructions, .stats {
    display: inline-block;
    vertical-align: top;
    width: calc(50% - 10px);
    margin: 0 5px;
  }

  .instructions {
    flex: 1;
    min-width: 300px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  }

  .instructions h3 {
    margin-top: 0;
    color: #333;
  }

  .instructions ul {
    margin: 10px 0;
  }

  .instructions li {
    margin: 5px 0;
  }

  .stats {
    flex: 1;
    min-width: 300px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #28a745;
  }

  .status {
    color: #ff6b6b;
    font-weight: bold;
  }

  .selected-names {
    margin-top: 10px;
  }

  .names-list {
    margin-top: 5px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .name-tag {
    background: #007bff;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  :global(.point) {
    transition: all 0.2s ease;
  }

  :global(.point:hover) {
    r: 6;
  }

  :global(.legend text) {
    font-size: 12px;
  }
</style>
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
