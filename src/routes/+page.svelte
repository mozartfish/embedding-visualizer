<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import * as d3 from 'd3';

  let mainSvg;
  let trendSvg;
  let selectedPoints = [];
  let isLassoing = false;
  let data = [];
  let selectedFile = 'umap-name-etymology.json';
  let selectedAttribute = 'peak_decade'; // Default attribute for coloring
  let selectedSizeAttribute = 'total_births'; // Default attribute for sizing
  let selectedTooltipAttribute = 'total_births'; // Default tooltip attribute
  
  // Decade slider variables
  let selectedDecade = 'all'; // 'all' or specific decade
  let availableDecades = [];
  let minDecade = 1880;
  let maxDecade = 2020;
  let sliderValue = 0; // 0 = 'all', 1+ = index in availableDecades array
  
  // Zoom and interaction variables
  let zoomBehavior;
  let currentTransform = d3.zoomIdentity;
  let adjustedData = [];
  let interactionMode = 'zoom'; // 'zoom' or 'lasso'

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

  // Available attributes for coloring and tooltips
  const availableAttributes = [
    { value: 'total_births', label: 'Total Births', type: 'numeric' },
    { value: 'avg_births_per_year', label: 'Avg Births per Year', type: 'numeric' },
    { value: 'births_std', label: 'Birth Standard Deviation', type: 'numeric' },
    { value: 'peak_births', label: 'Peak Births', type: 'numeric' },
    { value: 'first_year', label: 'First Year', type: 'numeric' },
    { value: 'last_year', label: 'Last Year', type: 'numeric' },
    { value: 'total_active_years', label: 'Total Active Years', type: 'numeric' },
    { value: 'year_span', label: 'Year Span', type: 'numeric' },
    { value: 'avg_popularity_pct', label: 'Avg Popularity %', type: 'numeric' },
    { value: 'peak_popularity_pct', label: 'Peak Popularity %', type: 'numeric' },
    { value: 'peak_decade', label: 'Peak Decade', type: 'numeric' },
    { value: 'name_length', label: 'Name Length', type: 'numeric' },
    { value: 'vowel_count', label: 'Vowel Count', type: 'numeric' },
    { value: 'etymology', label: 'Etymology', type: 'categorical' },
    { value: 'origin', label: 'Origin', type: 'categorical' },
    { value: 'gender', label: 'Gender', type: 'categorical' }
  ];

  // Sample data - replace with your actual JSON data
  const sampleData = [
    { "Name":"Abby", "1976":256.0, "1977":142.0, "1978":312.0, "1979":791.0, "1980":467.5, "1981":608.5, "1982":653.0, "1983":657.5, "1984":1263.0, "1985":607.5, "x":8.6866903305, "y":3.9082963467, "total_births":5000, "avg_births_per_year":125.0, "births_std":400.5, "peak_births":1263, "first_year":1976, "last_year":1985, "total_active_years":10, "year_span":9, "avg_popularity_pct":0.05, "peak_popularity_pct":0.15, "is_male":false, "is_female":true, "is_unisex":false, "origin":"Hebrew", "etymology":"father's joy", "peak_decade":1980, "name_length":4, "vowel_count":2 },
    { "Name":"Abel", "1976":395.0, "1977":347.0, "1978":371.0, "1979":217.0, "1980":240.0, "1981":242.0, "1982":467.0, "1983":217.5, "1984":427.0, "1985":461.0, "x":6.3117189407, "y":2.1993675232, "total_births":3200, "avg_births_per_year":80.0, "births_std":150.2, "peak_births":467, "first_year":1976, "last_year":1985, "total_active_years":10, "year_span":9, "avg_popularity_pct":0.03, "peak_popularity_pct":0.08, "is_male":true, "is_female":false, "is_unisex":false, "origin":"Hebrew", "etymology":"breath", "peak_decade":1980, "name_length":4, "vowel_count":2 },
    { "Name":"Abigail", "1976":417.5, "1977":795.0, "1978":1010.0, "1979":1225.0, "1980":793.0, "1981":911.0, "1982":946.5, "1983":961.0, "1984":924.5, "1985":930.5, "x":8.9767932892, "y":3.9221160412, "total_births":8500, "avg_births_per_year":212.5, "births_std":250.8, "peak_births":1225, "first_year":1976, "last_year":1985, "total_active_years":10, "year_span":9, "avg_popularity_pct":0.09, "peak_popularity_pct":0.25, "is_male":false, "is_female":true, "is_unisex":false, "origin":"Hebrew", "etymology":"father's joy", "peak_decade":1980, "name_length":7, "vowel_count":4 },
    { "Name":"Aaron", "1976":1205.0, "1977":1089.0, "1978":1052.0, "1979":1031.0, "1980":1012.0, "1981":995.0, "1982":982.0, "1983":975.0, "1984":968.0, "1985":962.0, "x":5.2345678901, "y":1.8765432109, "total_births":12000, "avg_births_per_year":300.0, "births_std":100.5, "peak_births":1205, "first_year":1976, "last_year":1985, "total_active_years":10, "year_span":9, "avg_popularity_pct":0.12, "peak_popularity_pct":0.30, "is_male":true, "is_female":false, "is_unisex":false, "origin":"Hebrew", "etymology":"high mountain", "peak_decade":1980, "name_length":5, "vowel_count":3 },
    { "Name":"Ada", "1976":45.0, "1977":52.0, "1978":48.0, "1979":51.0, "1980":49.0, "1981":53.0, "1982":56.0, "1983":58.0, "1984":62.0, "1985":65.0, "x":9.1234567890, "y":4.5678901234, "total_births":500, "avg_births_per_year":12.5, "births_std":5.8, "peak_births":65, "first_year":1976, "last_year":1985, "total_active_years":10, "year_span":9, "avg_popularity_pct":0.005, "peak_popularity_pct":0.01, "is_male":false, "is_female":true, "is_unisex":false, "origin":"Germanic", "etymology":"noble", "peak_decade":1980, "name_length":3, "vowel_count":2 }
  ];

  // Helper function to determine gender display
  const getGenderDisplay = (d) => {
    if (d.is_unisex) return 'Unisex';
    if (d.is_male && d.is_female) return 'Unisex';
    if (d.is_male) return 'Male';
    if (d.is_female) return 'Female';
    return 'Unknown';
  };

  // Helper function to get attribute value for coloring
  const getAttributeValue = (d, attribute) => {
    if (attribute === 'gender') {
      return getGenderDisplay(d);
    }
    return d[attribute];
  };

  // Function to calculate decades from data
  const calculateDecades = (data) => {
    if (!data || data.length === 0) return [];
    
    const decades = new Set();
    data.forEach(d => {
      if (d.peak_decade && d.peak_decade !== -1) {
        decades.add(d.peak_decade);
      }
    });
    
    return Array.from(decades).sort((a, b) => a - b);
  };

  // Function to get point radius based on decade selection and size attribute
  const getPointRadius = (d, baseRadius = 2.67) => {
    // Get size based on selected size attribute
    let sizeValue = getAttributeValue(d, selectedSizeAttribute);
    if (typeof sizeValue !== 'number' || isNaN(sizeValue)) {
      sizeValue = 1; // Default size for invalid values
    }
    
    // Scale the size value to a reasonable range (similar to Python's MinMaxScaler)
    const allSizeValues = data.map(item => {
      const val = getAttributeValue(item, selectedSizeAttribute);
      return typeof val === 'number' && !isNaN(val) ? val : 0;
    }).filter(val => val > 0);
    
    if (allSizeValues.length === 0) {
      baseRadius = 2.67;
    } else {
      const minSize = Math.min(...allSizeValues);
      const maxSize = Math.max(...allSizeValues);
      
      // Normalize to range [0.5, 3] for base radius multiplier
      const normalizedSize = maxSize > minSize ? 
        0.5 + 2.5 * ((sizeValue - minSize) / (maxSize - minSize)) : 1;
      baseRadius = baseRadius * normalizedSize;
    }
    
    // Apply decade highlighting (3x size if decade matches)
    if (selectedDecade !== 'all' && d.peak_decade === parseInt(selectedDecade)) {
      return baseRadius * 3;
    }
    
    return baseRadius;
  };

  // Create color scale based on selected attribute
  const createColorScale = (data, attribute) => {
    const attributeInfo = availableAttributes.find(attr => attr.value === attribute);
    
    if (!attributeInfo || data.length === 0) {
      return d3.scaleOrdinal(d3.schemeCategory10);
    }

    if (attributeInfo.type === 'categorical') {
      const values = [...new Set(data.map(d => getAttributeValue(d, attribute)).filter(v => v != null))];
      return d3.scaleOrdinal(d3.schemeCategory10).domain(values);
    } else {
      // Numeric - use YlGnBu_r color scheme like Python (reversed YlGnBu)
      const values = data.map(d => getAttributeValue(d, attribute)).filter(v => v != null && !isNaN(v));
      if (values.length === 0) {
        return d3.scaleOrdinal(d3.schemeCategory10);
      }
      // Use YlGnBu but reversed (from light yellow to dark blue, but we want dark blue to light yellow)
      const domain = d3.extent(values);
      return d3.scaleSequential(t => d3.interpolateYlGnBu(1 - t)).domain(domain);
    }
  };

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

  // Simplified collision detection for high zoom levels
  const adjustPointPositionsSimple = (transformedData, zoomScale, pointRadius = 2.67) => {
    const minDistance = Math.max(pointRadius * 2, (pointRadius * 2) / Math.sqrt(zoomScale));
    const nodes = transformedData.map(d => ({ ...d }));
    
    // Simple collision detection and resolution
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance && distance > 0) {
          // Push points apart
          const pushDistance = (minDistance - distance) / 2;
          const pushX = (dx / distance) * pushDistance;
          const pushY = (dy / distance) * pushDistance;
          
          nodes[i].x += pushX;
          nodes[i].y += pushY;
          nodes[j].x -= pushX;
          nodes[j].y -= pushY;
        }
      }
    }
    
    return nodes;
  };

  const initializeUMAPPlot = () => {
    const svg = d3.select(mainSvg);
    const width = 500;
    const height = 400;
    const margin = { top: 40, right: 20, bottom: 40, left: 40 };

    svg.selectAll("*").remove();

    // Calculate data bounds for proper zoom extents
    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);
    
    // Add padding to the data bounds (10% on each side)
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    
    const xBounds = [xExtent[0] - xPadding, xExtent[1] + xPadding];
    const yBounds = [yExtent[0] - yPadding, yExtent[1] + yPadding];

    // Create scales based on actual data extent
    const xScale = d3.scaleLinear()
      .domain(xBounds)
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(yBounds)
      .range([height - margin.bottom, margin.top]);

    // Calculate proper zoom extents based on data
    const dataWidth = xExtent[1] - xExtent[0];
    const dataHeight = yExtent[1] - yExtent[0];
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    // Calculate translate extents to keep data visible
    const translateExtentX0 = margin.left - (xScale(xExtent[1]) - margin.left);
    const translateExtentY0 = margin.top - (yScale(yExtent[0]) - margin.top);
    const translateExtentX1 = width - margin.right - (xScale(xExtent[0]) - (width - margin.right));
    const translateExtentY1 = height - margin.bottom - (yScale(yExtent[1]) - (height - margin.bottom));

    // Color scale based on selected attribute
    const colorScale = createColorScale(data, selectedAttribute);

    // Add axes
    const xAxisGroup = svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    const yAxisGroup = svg.append("g")
      .attr("class", "y-axis")
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
    const selectedAttrLabel = availableAttributes.find(attr => attr.value === selectedAttribute)?.label || selectedAttribute;
    const decadeText = selectedDecade === 'all' ? 'All Decades' : `${selectedDecade}s Highlighted (3x size)`;
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`UMAP Embeddings - ${selectedAttrLabel}`);

    // Add subtitle with size/color info
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(`Size: ${availableAttributes.find(attr => attr.value === selectedSizeAttribute)?.label || selectedSizeAttribute} | Color: ${selectedAttrLabel} | Use slider to highlight decades (3x size)`);

    // Add color legend for all attributes (both numeric and categorical)
    addColorLegend(svg, colorScale, selectedAttrLabel, width, height, selectedAttribute);

    // Create a clipping path to constrain zoom area
    svg.append("defs")
      .append("clipPath")
      .attr("id", "plot-area")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    // Create main group that will be transformed by zoom
    const mainGroup = svg.append("g")
      .attr("class", "main-group");

    // Create points with clipping inside the main group
    const pointsGroup = mainGroup.append("g")
      .attr("class", "points-group")
      .attr("clip-path", "url(#plot-area)");

    const points = pointsGroup.selectAll(".point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", d => getPointRadius(d)) // Use decade-based radius
      .attr("fill", d => {
        const value = getAttributeValue(d, selectedAttribute);
        return colorScale(value);
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 0.3) // Thinner stroke like Python plot
      .style("cursor", "pointer");

    // Add hover effects and tooltips
    points
      .on("mouseenter", function(event, d) {
        // Store reference to this point for tooltip stability
        d3.select(this).attr("data-hovering", "true");
        
        // Calculate current scaled radius based on zoom (keep size consistent)
        const baseRadius = getPointRadius(d); // Use decade-based radius
        const scaledRadius = Math.max(baseRadius, baseRadius * Math.sqrt(currentTransform.k));
        
        // Don't change radius on hover - just add visual feedback through stroke
        d3.select(this)
          .attr("stroke-width", 3)
          .style("stroke", "#ff6b6b");
        
        // Remove any existing tooltips first
        svg.selectAll(".tooltip").remove();
        
        // Create tooltip
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .style("pointer-events", "none");
        
        // Use the current position of the circle for tooltip positioning
        const circleX = parseFloat(d3.select(this).attr("cx"));
        const circleY = parseFloat(d3.select(this).attr("cy"));
        
        // Offset tooltip to avoid covering the point
        const tooltipX = circleX;
        const tooltipY = circleY - scaledRadius * 2 - 10;
        
        // Create enhanced tooltip text with name, coordinates, and selected tooltip attribute
        const tooltipAttrValue = getAttributeValue(d, selectedTooltipAttribute);
        const tooltipAttrLabel = availableAttributes.find(attr => attr.value === selectedTooltipAttribute)?.label || selectedTooltipAttribute;
        
        let formattedTooltipValue = tooltipAttrValue;
        if (typeof tooltipAttrValue === 'number') {
          // Format percentages differently
          if (selectedTooltipAttribute.includes('pct')) {
            formattedTooltipValue = (tooltipAttrValue * 100).toFixed(2) + '%';
          } else {
            formattedTooltipValue = tooltipAttrValue.toLocaleString();
          }
        }
        
        const tooltipLines = [
          d.Name,
          `${tooltipAttrLabel}: ${formattedTooltipValue}`,
          `Size (${availableAttributes.find(attr => attr.value === selectedSizeAttribute)?.label}): ${getAttributeValue(d, selectedSizeAttribute)}`,
          `Color (${selectedAttrLabel}): ${getAttributeValue(d, selectedAttribute)}`,
          `Peak Decade: ${d.peak_decade || 'Unknown'}`,
          `(${d.x.toFixed(2)}, ${d.y.toFixed(2)})`
        ];
        
        // Add background first
        const textGroup = tooltip.append("g");
        
        // Add text lines
        const textElements = tooltipLines.map((line, i) => {
          return textGroup.append("text")
            .attr("x", tooltipX)
            .attr("y", tooltipY + (i * 16))
            .attr("text-anchor", "middle")
            .style("font-size", i === 0 ? "14px" : "12px")
            .style("font-weight", i === 0 ? "bold" : "normal")
            .style("fill", "#333")
            .text(line);
        });
        
        // Calculate combined bounding box
        let combinedBBox = null;
        textElements.forEach(textEl => {
          const bbox = textEl.node().getBBox();
          if (!combinedBBox) {
            combinedBBox = bbox;
          } else {
            const minX = Math.min(combinedBBox.x, bbox.x);
            const minY = Math.min(combinedBBox.y, bbox.y);
            const maxX = Math.max(combinedBBox.x + combinedBBox.width, bbox.x + bbox.width);
            const maxY = Math.max(combinedBBox.y + combinedBBox.height, bbox.y + bbox.height);
            combinedBBox = {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            };
          }
        });
        
        // Insert background rectangle
        tooltip.insert("rect", "g")
          .attr("x", combinedBBox.x - 6)
          .attr("y", combinedBBox.y - 3)
          .attr("width", combinedBBox.width + 12)
          .attr("height", combinedBBox.height + 6)
          .attr("fill", "rgba(255, 255, 255, 0.95)")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 1)
          .attr("rx", 4);
      })
      .on("mouseleave", function(event, d) {
        // Remove hover flag
        d3.select(this).attr("data-hovering", null);
        
        // Reset stroke to original values based on selection state
        const isSelected = selectedPoints.includes(d);
        d3.select(this)
          .attr("stroke-width", isSelected ? 3 : 1)
          .style("stroke", isSelected ? "#ff6b6b" : "#333");
        
        // Remove tooltip
        svg.select(".tooltip").remove();
      });

    // Create lasso path element with clipping inside main group
    const lassoPathElement = mainGroup.append("path")
      .attr("class", "lasso-path")
      .attr("fill", "none")
      .attr("stroke", "#ff6b6b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("clip-path", "url(#plot-area)")
      .style("opacity", 0);

    // Initialize adjusted data
    adjustedData = data.map(d => ({
      ...d,
      x: xScale(d.x),
      y: yScale(d.y),
      originalX: d.x,
      originalY: d.y
    }));

    // Zoom behavior with data-driven extents
    zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 20]) // Allow more zoom range
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .translateExtent([
        [translateExtentX0, translateExtentY0],
        [translateExtentX1, translateExtentY1]
      ])
      .on("zoom", (event) => {
        currentTransform = event.transform;
        
        // Update axes with rescaled domains
        const newXScale = currentTransform.rescaleX(xScale);
        const newYScale = currentTransform.rescaleY(yScale);
        
        xAxisGroup.call(d3.axisBottom(newXScale));
        yAxisGroup.call(d3.axisLeft(newYScale));
        
        // Position points according to their rescaled coordinates (not transform the group)
        pointsGroup.selectAll(".point")
          .attr("cx", d => newXScale(d.x)) // Use rescaled position
          .attr("cy", d => newYScale(d.y)) // Use rescaled position
          .attr("r", d => {
            // Calculate scaled point size (direct relationship with zoom - bigger when zoomed in)
            const baseRadius = getPointRadius(d); // Use decade-based radius
            return Math.max(baseRadius, baseRadius * Math.sqrt(currentTransform.k));
          });
        
        // Apply collision detection for overlapping points at high zoom
        if (currentTransform.k > 2) {
          // Get current rescaled positions for collision detection
          const transformedData = data.map(d => ({
            ...d,
            x: newXScale(d.x),
            y: newYScale(d.y),
            originalX: d.x,
            originalY: d.y
          }));
          
          // Use max radius for collision detection
          const maxRadius = Math.max(...data.map(d => getPointRadius(d) * Math.sqrt(currentTransform.k)));
          
          // Check for overlaps and adjust if needed (using scaled radius for collision detection)
          const adjustedPositions = adjustPointPositionsSimple(transformedData, currentTransform.k, maxRadius);
          
          // Apply adjusted positions
          pointsGroup.selectAll(".point")
            .attr("cx", (d, i) => adjustedPositions[i].x)
            .attr("cy", (d, i) => adjustedPositions[i].y);
        }
      });

    // Store reference to zoom handler for mode switching
    const zoomHandler = zoomBehavior.on("zoom");

    // Interaction variables
    let drawing = false;
    let currentPath = [];

    const startInteraction = (event) => {
      // Only allow interactions within the plot area
      const [x, y] = d3.pointer(event, svg.node());
      if (x < margin.left || x > width - margin.right || 
          y < margin.top || y > height - margin.bottom) {
        return; // Don't start interaction if outside plot area
      }
      
      if (interactionMode === 'lasso') {
        startLasso(event);
      }
    };

    const continueInteraction = (event) => {
      if (interactionMode === 'lasso' && drawing) {
        continueLasso(event);
      }
    };

    const endInteraction = (event) => {
      if (interactionMode === 'lasso' && drawing) {
        endLasso(event);
      }
    };

    const startLasso = (event) => {
      drawing = true;
      isLassoing = true;
      currentPath = [];
      
      // Get coordinates relative to the SVG (since we're not transforming the main group anymore)
      const [x, y] = d3.pointer(event, svg.node());
      currentPath.push([x, y]);
      lassoPathElement.style("opacity", 1);
      
      event.stopPropagation();
      event.preventDefault();
    };

    const continueLasso = (event) => {
      if (!drawing) return;
      
      // Get coordinates relative to the SVG
      const [x, y] = d3.pointer(event, svg.node());
      currentPath.push([x, y]);
      
      const pathString = d3.line()(currentPath);
      lassoPathElement.attr("d", pathString);
      
      event.stopPropagation();
      event.preventDefault();
    };

    const endLasso = (event) => {
      if (!drawing) return;
      drawing = false;
      isLassoing = false;
      
      if (currentPath.length > 2) {
        currentPath.push(currentPath[0]);
      }

      // Find selected points using current rescaled positions
      const newXScale = currentTransform.rescaleX(xScale);
      const newYScale = currentTransform.rescaleY(yScale);
      
      const selected = data.filter(d => {
        // Use the current rescaled coordinates for selection
        const point = [newXScale(d.x), newYScale(d.y)];
        return pointInPolygon(point, currentPath);
      });

      selectedPoints = selected;
      
      // Update stroke to show selection (don't change radius)
      pointsGroup.selectAll(".point")
        .attr("stroke", d => selected.includes(d) ? "#ff6b6b" : "#333")
        .attr("stroke-width", d => selected.includes(d) ? 3 : 1);

      updateTrendPlot();

      lassoPathElement.style("opacity", 0);
      currentPath = [];
      
      event.stopPropagation();
      event.preventDefault();
    };

    // Set interaction mode function (clear selection when switching from lasso to zoom)
    const setInteractionMode = (mode) => {
      const previousMode = interactionMode;
      interactionMode = mode;
      
      if (mode === 'zoom') {
        // Clear selection when switching from lasso to zoom
        if (previousMode === 'lasso') {
          selectedPoints = [];
          
          // Reset stroke to default (don't change radius)
          pointsGroup.selectAll(".point")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);
          updateTrendPlot();
        }
        
        // Re-enable zoom behavior
        svg.call(zoomBehavior);
        svg.style("cursor", "grab");
        
        // Immediately refresh the zoom state to ensure points are positioned correctly
        if (currentTransform && (currentTransform.k !== 1 || currentTransform.x !== 0 || currentTransform.y !== 0)) {
          // Update axes and point positions with current transform
          const newXScale = currentTransform.rescaleX(xScale);
          const newYScale = currentTransform.rescaleY(yScale);
          
          xAxisGroup.call(d3.axisBottom(newXScale));
          yAxisGroup.call(d3.axisLeft(newYScale));
          
          // Position points according to rescaled coordinates
          pointsGroup.selectAll(".point")
            .attr("cx", d => newXScale(d.x))
            .attr("cy", d => newYScale(d.y));
        }
      } else if (mode === 'lasso') {
        // Disable zoom behavior
        svg.on(".zoom", null);
        svg.style("cursor", "crosshair");
      }
      
      updateModeButtons();
    };

    const updateModeButtons = () => {
      // Update HTML button styles instead of SVG elements
      const zoomBtn = document.querySelector('.zoom-mode-btn');
      const lassoBtn = document.querySelector('.lasso-mode-btn');
      
      if (zoomBtn && lassoBtn) {
        if (interactionMode === 'zoom') {
          zoomBtn.classList.add('active');
          lassoBtn.classList.remove('active');
        } else {
          zoomBtn.classList.remove('active');
          lassoBtn.classList.add('active');
        }
      }
    };

    // Add event listeners
    svg.on("mousedown", startInteraction)
       .on("mousemove", continueInteraction)
       .on("mouseup", endInteraction);

    // Functions for external button controls
    window.setInteractionMode = setInteractionMode;
    window.clearSelection = clearSelection;
    window.resetZoom = resetZoom;

    function clearSelection() {
      selectedPoints = [];
      
      // Reset stroke to default (don't change radius)
      pointsGroup.selectAll(".point")
        .attr("stroke", "#333")
        .attr("stroke-width", 1);
      updateTrendPlot();
    }

    function resetZoom() {
      svg.transition()
         .duration(500)
         .call(zoomBehavior.transform, d3.zoomIdentity)
         .on("end", () => {
           // Reset point positions to original scale positions and decade-based radius
           pointsGroup.selectAll(".point")
             .attr("cx", d => xScale(d.x))
             .attr("cy", d => yScale(d.y))
             .attr("r", d => getPointRadius(d)); // Use decade-based radius
         });
    }

    // Initialize in zoom mode
    setInteractionMode('zoom');
  };

  // Function to add color legend for both numeric and categorical attributes
  const addColorLegend = (svg, colorScale, attributeLabel, width, height, attributeType) => {
    const legendX = width - 120;
    const legendY = 70;

    // Remove any existing legend
    svg.selectAll(".color-legend").remove();

    // Create legend group
    const legendGroup = svg.append("g").attr("class", "color-legend");

    // Add legend title
    legendGroup.append("text")
      .attr("x", legendX + 50)
      .attr("y", legendY - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(attributeLabel);

    const attributeInfo = availableAttributes.find(attr => attr.value === attributeType);
    
    if (attributeInfo && attributeInfo.type === 'numeric') {
      // Numeric legend (gradient bar)
      const legendWidth = 20;
      const legendHeight = 150;

      // Create gradient definition
      const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
      
      // Remove existing gradient
      defs.select("#color-legend-gradient").remove();
      
      const gradient = defs.append("linearGradient")
        .attr("id", "color-legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

      const domain = colorScale.domain();
      const numStops = 10;
      for (let i = 0; i <= numStops; i++) {
        const value = domain[0] + (domain[1] - domain[0]) * (i / numStops);
        gradient.append("stop")
          .attr("offset", `${(i / numStops) * 100}%`)
          .attr("stop-color", colorScale(value));
      }

      // Add legend rectangle
      legendGroup.append("rect")
        .attr("x", legendX + 40)
        .attr("y", legendY)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#color-legend-gradient)")
        .style("stroke", "#333")
        .style("stroke-width", 0.5);

      // Add legend scale
      const legendScale = d3.scaleLinear()
        .domain(domain)
        .range([legendY + legendHeight, legendY]);

      const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d => {
          if (attributeLabel.toLowerCase().includes('decade')) {
            return d3.format(".0f")(d) + 's';
          } else if (attributeLabel.toLowerCase().includes('pct') || attributeLabel.toLowerCase().includes('percentage')) {
            return d3.format(".1%")(d);
          }
          return d3.format(".0f")(d);
        });

      legendGroup.append("g")
        .attr("transform", `translate(${legendX + 40 + legendWidth}, 0)`)
        .call(legendAxis)
        .style("font-size", "10px");

    } else {
      // Categorical legend (color swatches with labels)
      const uniqueValues = [...new Set(data.map(d => getAttributeValue(d, attributeType)).filter(v => v != null))];
      const maxItems = 8; // Limit number of legend items to prevent overcrowding
      const displayValues = uniqueValues.slice(0, maxItems);
      
      const itemHeight = 18;
      const swatchSize = 12;

      displayValues.forEach((value, i) => {
        const y = legendY + (i * itemHeight);
        
        // Add color swatch
        legendGroup.append("rect")
          .attr("x", legendX)
          .attr("y", y - swatchSize/2)
          .attr("width", swatchSize)
          .attr("height", swatchSize)
          .attr("fill", colorScale(value))
          .attr("stroke", "#333")
          .attr("stroke-width", 0.5);

        // Add label
        let displayText = String(value);
        if (displayText.length > 12) {
          displayText = displayText.substring(0, 10) + '...';
        }
        
        legendGroup.append("text")
          .attr("x", legendX + swatchSize + 6)
          .attr("y", y)
          .attr("dy", "0.35em")
          .style("font-size", "11px")
          .style("fill", "#333")
          .text(displayText);
      });

      // Add "..." if there are more items
      if (uniqueValues.length > maxItems) {
        const y = legendY + (maxItems * itemHeight);
        legendGroup.append("text")
          .attr("x", legendX)
          .attr("y", y)
          .attr("dy", "0.35em")
          .style("font-size", "11px")
          .style("fill", "#666")
          .style("font-style", "italic")
          .text(`... and ${uniqueValues.length - maxItems} more`);
      }
    }
  };

  // Function to update point sizes based on decade selection
  const updatePointSizes = () => {
    const svg = d3.select(mainSvg);
    const pointsGroup = svg.select('.points-group');
    
    if (pointsGroup.empty()) return;
    
    // Update point radii based on current decade selection
    pointsGroup.selectAll(".point")
      .transition()
      .duration(300)
      .attr("r", d => {
        const baseRadius = getPointRadius(d);
        // Apply zoom scaling if currently zoomed
        return Math.max(baseRadius, baseRadius * Math.sqrt(currentTransform.k));
      });
    
    // Don't update title anymore - keep it simple without decade info
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

    const years = getYearColumns(selectedPoints[0]);
    
    const trendData = years.map(year => {
      const yearData = {
        year: +year,
        values: selectedPoints.map(d => ({
          name: d.Name,
          births: d[year] || 0
        })).filter(d => d.births !== -1.0)
      };
      return yearData;
    }).filter(yearData => yearData.values.length > 0);

    const validYears = trendData.map(d => d.year);
    const xScale = d3.scaleLinear()
      .domain(d3.extent(validYears))
      .range([margin.left, width - margin.right]);

    const allValidBirths = selectedPoints.flatMap(d => 
      years.map(year => d[year]).filter(births => births !== -1.0 && births > 0)
    );
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allValidBirths)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create clipping path for the plot area
    svg.append("defs")
      .append("clipPath")
      .attr("id", "trend-plot-area")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    // Add axes groups
    const xAxisGroup = svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    const yAxisGroup = svg.append("g")
      .attr("class", "y-axis")
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
      .text(`Birth Trends (${selectedPoints.length} names selected) - Scroll to zoom`);

    // Create main group for lines and dots that will be clipped
    const plotGroup = svg.append("g")
      .attr("class", "trend-plot-group")
      .attr("clip-path", "url(#trend-plot-area)");

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.births))
      .curve(d3.curveMonotoneX);

    // Set up zoom behavior for the trend plot
    const trendZoom = d3.zoom()
      .scaleExtent([1, 10])
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .on("zoom", (event) => {
        const { transform } = event;
        
        // Create new rescaled scales
        const newXScale = transform.rescaleX(xScale);
        const newYScale = transform.rescaleY(yScale);
        
        // Update axes
        xAxisGroup.call(d3.axisBottom(newXScale).tickFormat(d3.format("d")));
        yAxisGroup.call(d3.axisLeft(newYScale));
        
        // Create new line generator with rescaled scales
        const newLine = d3.line()
          .x(d => newXScale(d.year))
          .y(d => newYScale(d.births))
          .curve(d3.curveMonotoneX);
        
        // Update all lines
        plotGroup.selectAll(".trend-line")
          .attr("d", d => newLine(d));
        
        // Update all visible lines for hover detection
        plotGroup.selectAll(".trend-line-hover")
          .attr("d", d => newLine(d));
        
        // Update all dots
        plotGroup.selectAll(".trend-dot")
          .attr("cx", d => newXScale(d.year))
          .attr("cy", d => newYScale(d.births));
      });

    // Apply zoom to the main SVG with constraint to plot area
    svg.call(trendZoom);

    selectedPoints.forEach((person, i) => {
      const personData = years.map(year => ({
        year: +year,
        births: person[year]
      })).filter(d => d.births !== -1.0 && d.births > 0);

      if (personData.length > 0) {
        // Create the main line path
        const linePath = plotGroup.append("path")
          .datum(personData)
          .attr("class", "trend-line")
          .attr("fill", "none")
          .attr("stroke", colorScale(i))
          .attr("stroke-width", 2)
          .attr("d", line)
          .style("opacity", 0.7)
          .style("cursor", "pointer")
          .on("mouseenter", function(event) {
            // Highlight the hovered line
            d3.select(this)
              .attr("stroke-width", 4)
              .style("opacity", 1);
            
            // Create tooltip for the line
            const tooltip = svg.append("g")
              .attr("class", "line-tooltip")
              .style("pointer-events", "none");
            
            const [mouseX, mouseY] = d3.pointer(event, svg.node());
            
            // Add tooltip background and text
            const tooltipText = tooltip.append("text")
              .attr("x", mouseX)
              .attr("y", mouseY - 10)
              .attr("text-anchor", "middle")
              .style("font-size", "14px")
              .style("font-weight", "bold")
              .style("fill", "#333")
              .text(person.Name);
            
            // Get text bounding box for background
            const bbox = tooltipText.node().getBBox();
            
            // Insert background rectangle
            tooltip.insert("rect", "text")
              .attr("x", bbox.x - 6)
              .attr("y", bbox.y - 3)
              .attr("width", bbox.width + 12)
              .attr("height", bbox.height + 6)
              .attr("fill", "rgba(255, 255, 255, 0.95)")
              .attr("stroke", colorScale(i))
              .attr("stroke-width", 2)
              .attr("rx", 4);
          })
          .on("mouseleave", function(event) {
            // Reset line appearance
            d3.select(this)
              .attr("stroke-width", 2)
              .style("opacity", 0.7);
            
            // Remove tooltip
            svg.select(".line-tooltip").remove();
          });

        // Create invisible wider path for easier hover targeting
        plotGroup.append("path")
          .datum(personData)
          .attr("class", "trend-line-hover")
          .attr("fill", "none")
          .attr("stroke", "transparent")
          .attr("stroke-width", 10)
          .attr("d", line)
          .style("cursor", "pointer")
          .on("mouseenter", function(event) {
            // Trigger the same hover effect on the visible line
            linePath.dispatch("mouseenter", { detail: event });
          })
          .on("mouseleave", function(event) {
            // Trigger the same leave effect on the visible line
            linePath.dispatch("mouseleave", { detail: event });
          });

        // Add data points (dots) with enhanced tooltips
        plotGroup.selectAll(`.dot-${i}`)
          .data(personData)
          .enter()
          .append("circle")
          .attr("class", `trend-dot dot-${i}`)
          .attr("cx", d => xScale(d.year))
          .attr("cy", d => yScale(d.births))
          .attr("r", 3)
          .attr("fill", colorScale(i))
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mouseenter", function(event, d) {
            // Highlight the dot
            d3.select(this)
              .attr("r", 5)
              .attr("stroke-width", 2);
            
            // Create detailed tooltip for the dot
            const tooltip = svg.append("g")
              .attr("class", "dot-tooltip")
              .style("pointer-events", "none");
            
            const [mouseX, mouseY] = d3.pointer(event, svg.node());
            
            const tooltipLines = [
              person.Name,
              `${d.births.toLocaleString()} births`,
              `Year: ${d.year}`
            ];
            
            const textGroup = tooltip.append("g");
            
            const textElements = tooltipLines.map((line, idx) => {
              return textGroup.append("text")
                .attr("x", mouseX)
                .attr("y", mouseY - 15 + (idx * 16))
                .attr("text-anchor", "middle")
                .style("font-size", idx === 0 ? "14px" : "12px")
                .style("font-weight", idx === 0 ? "bold" : "normal")
                .style("fill", "#333")
                .text(line);
            });
            
            // Calculate combined bounding box
            let combinedBBox = null;
            textElements.forEach(textEl => {
              const bbox = textEl.node().getBBox();
              if (!combinedBBox) {
                combinedBBox = bbox;
              } else {
                const minX = Math.min(combinedBBox.x, bbox.x);
                const minY = Math.min(combinedBBox.y, bbox.y);
                const maxX = Math.max(combinedBBox.x + combinedBBox.width, bbox.x + bbox.width);
                const maxY = Math.max(combinedBBox.y + combinedBBox.height, bbox.y + bbox.height);
                combinedBBox = {
                  x: minX,
                  y: minY,
                  width: maxX - minX,
                  height: maxY - minY
                };
              }
            });
            
            // Insert background rectangle
            tooltip.insert("rect", "g")
              .attr("x", combinedBBox.x - 6)
              .attr("y", combinedBBox.y - 3)
              .attr("width", combinedBBox.width + 12)
              .attr("height", combinedBBox.height + 6)
              .attr("fill", "rgba(255, 255, 255, 0.95)")
              .attr("stroke", colorScale(i))
              .attr("stroke-width", 1)
              .attr("rx", 4);
          })
          .on("mouseleave", function(event, d) {
            // Reset dot appearance
            d3.select(this)
              .attr("r", 3)
              .attr("stroke-width", 1);
            
            // Remove tooltip
            svg.select(".dot-tooltip").remove();
          });
      }
    });

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

    // Add reset zoom button for trend chart
    const resetButton = svg.append("g")
      .attr("class", "trend-reset-button")
      .attr("transform", `translate(${width - 80}, ${height - 30})`)
      .style("cursor", "pointer")
      .on("click", function() {
        svg.transition()
           .duration(500)
           .call(trendZoom.transform, d3.zoomIdentity);
      });

    resetButton.append("rect")
      .attr("x", -5)
      .attr("y", -12)
      .attr("width", 70)
      .attr("height", 18)
      .attr("fill", "#28a745")
      .attr("stroke", "#1e7e34")
      .attr("stroke-width", 1)
      .attr("rx", 3)
      .style("opacity", 0.8);

    resetButton.append("text")
      .attr("x", 30)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text("Reset Zoom");

    resetButton.on("mouseenter", function() {
      d3.select(this).select("rect").style("opacity", 1);
    }).on("mouseleave", function() {
      d3.select(this).select("rect").style("opacity", 0.8);
    });
  };

  // Function to load data from your JSON files
  const loadData = async (filename = selectedFile) => {
    try {
      const url = `${base}/data/${filename}`;
      console.log('Attempting to fetch from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const firstItem = jsonData[0];
        if (firstItem.hasOwnProperty('x') && firstItem.hasOwnProperty('y') && firstItem.hasOwnProperty('Name')) {
          data = jsonData;
          console.log(`Loaded ${data.length} data points from ${filename}`);
          
          // Calculate available decades from the loaded data
          availableDecades = calculateDecades(data);
          
          // Set min and max decades for slider
          if (availableDecades.length > 0) {
            minDecade = Math.min(...availableDecades);
            maxDecade = Math.max(...availableDecades);
          }
          
          // Reset decade selection when loading new data
          selectedDecade = 'all';
          sliderValue = 0;
          
          currentTransform = d3.zoomIdentity;
          
          initializeUMAPPlot();
          updateTrendPlot();
        } else {
          console.error('Data does not have expected structure');
          data = sampleData;
          availableDecades = calculateDecades(data);
          if (availableDecades.length > 0) {
            minDecade = Math.min(...availableDecades);
            maxDecade = Math.max(...availableDecades);
          }
          initializeUMAPPlot();
          updateTrendPlot();
        }
      } else {
        console.error('Data is not a valid array');
        data = sampleData;
        availableDecades = calculateDecades(data);
        if (availableDecades.length > 0) {
          minDecade = Math.min(...availableDecades);
          maxDecade = Math.max(...availableDecades);
        }
        initializeUMAPPlot();
        updateTrendPlot();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Falling back to sample data');
      data = sampleData;
      availableDecades = calculateDecades(data);
      if (availableDecades.length > 0) {
        minDecade = Math.min(...availableDecades);
        maxDecade = Math.max(...availableDecades);
      }
      initializeUMAPPlot();
      updateTrendPlot();
    }
  };

  // Handle file selection change
  const handleFileChange = async (event) => {
    selectedFile = event.target.value;
    selectedPoints = [];
    await loadData(selectedFile);
  };

  // Handle attribute selection change
  const handleAttributeChange = async (event) => {
    selectedAttribute = event.target.value;
    selectedPoints = [];
    initializeUMAPPlot();
    updateTrendPlot();
  };

  // Handle size attribute selection change
  const handleSizeAttributeChange = async (event) => {
    selectedSizeAttribute = event.target.value;
    selectedPoints = [];
    initializeUMAPPlot();
    updateTrendPlot();
  };

  // Handle tooltip attribute selection change
  const handleTooltipAttributeChange = async (event) => {
    selectedTooltipAttribute = event.target.value;
    // No need to reinitialize the plot, tooltips will use the new attribute on next hover
  };

  // Handle decade slider change
  const handleSliderChange = (event) => {
    sliderValue = parseInt(event.target.value);
    if (sliderValue === 0) {
      selectedDecade = 'all';
    } else {
      selectedDecade = availableDecades[sliderValue - 1];
    }
    updatePointSizes();
  };

  onMount(async () => {
    await loadData();
  });
</script>

<div class="container">
  <div class="plots-container">
    <div class="plot-container">
      <svg bind:this={mainSvg} width="500" height="400"></svg>
      
      <!-- Control buttons below the visualization -->
      <div class="controls-panel">
        <div class="control-row">
          <button 
            class="control-btn zoom-mode-btn active" 
            on:click={() => window.setInteractionMode && window.setInteractionMode('zoom')}>
            🔍 Zoom/Pan
          </button>
          <button 
            class="control-btn lasso-mode-btn" 
            on:click={() => window.setInteractionMode && window.setInteractionMode('lasso')}>
            🎯 Lasso Select
          </button>
          <button 
            class="control-btn clear-btn" 
            on:click={() => window.clearSelection && window.clearSelection()}>
            Clear Selection
          </button>
          <button 
            class="control-btn reset-btn" 
            on:click={() => window.resetZoom && window.resetZoom()}>
            Reset Zoom
          </button>
        </div>
        
        <!-- Decade Slider in Control Panel -->
        <div class="slider-row">
          <label for="decade-slider-control" class="slider-control-label">
            <strong>Highlight Decade (3x size):</strong>
          </label>
          <div class="slider-control-container">
            <span class="decade-display">
              {#if selectedDecade === 'all'}
                All Decades
              {:else}
                {selectedDecade}s
              {/if}
            </span>
            <input 
              type="range" 
              id="decade-slider-control"
              class="decade-slider-control"
              min="0" 
              max={availableDecades.length} 
              step="1"
              bind:value={sliderValue}
              on:input={handleSliderChange}
            />
          </div>
        </div>
      </div>
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

    <div class="attribute-selector">
      <label for="attribute-select"><strong>Color Points By:</strong></label>
      <select id="attribute-select" bind:value={selectedAttribute} on:change={handleAttributeChange}>
        {#each availableAttributes as attr}
          <option value={attr.value}>{attr.label}</option>
        {/each}
      </select>
      <p class="attribute-info">Points colored by: {availableAttributes.find(attr => attr.value === selectedAttribute)?.label || selectedAttribute}</p>
    </div>

    <div class="size-selector">
      <label for="size-select"><strong>Size Points By:</strong></label>
      <select id="size-select" bind:value={selectedSizeAttribute} on:change={handleSizeAttributeChange}>
        {#each availableAttributes as attr}
          <option value={attr.value}>{attr.label}</option>
        {/each}
      </select>
      <p class="size-info">Point sizes based on: {availableAttributes.find(attr => attr.value === selectedSizeAttribute)?.label || selectedSizeAttribute}</p>
    </div>

    <div class="tooltip-selector">
      <label for="tooltip-select"><strong>Tooltip Attribute:</strong></label>
      <select id="tooltip-select" bind:value={selectedTooltipAttribute} on:change={handleTooltipAttributeChange}>
        {#each availableAttributes as attr}
          <option value={attr.value}>{attr.label}</option>
        {/each}
      </select>
      <p class="tooltip-info">Tooltip shows: {availableAttributes.find(attr => attr.value === selectedTooltipAttribute)?.label || selectedTooltipAttribute}</p>
    </div>
    
    <div class="instructions">
      <h3>Instructions:</h3>
      <ul>
        <li>Select a data file from the first dropdown above</li>
        <li>Choose an attribute to color the points by from the second dropdown</li>
        <li>Choose an attribute to size the points by from the third dropdown</li>
        <li>Choose what additional attribute to show in tooltips from the fourth dropdown</li>
        <li><strong>New:</strong> Use the decade slider in the control panel to highlight names that peaked in specific decades (makes points 3x larger)</li>
        <li><strong>Mode Toggle:</strong> Click "🔍 Zoom/Pan" to zoom and pan, or "🎯 Lasso Select" to draw selections</li>
        <li><strong>Zoom Mode:</strong> Mouse wheel to zoom, click and drag to pan (points get larger when zoomed in)</li>
        <li><strong>Lasso Mode:</strong> Click and drag to draw a lasso around points you want to select</li>
        <li>Hover over points to see name, coordinates, peak decade, and the selected tooltip attribute</li>
        <li>Selected names will show their birth trends in the right plot</li>
        <li>Click "Clear" to reset selection or "Reset Zoom" to return to original view</li>
      </ul>
    </div>
    
    <div class="stats">
      <p><strong>Selected Names:</strong> {selectedPoints.length}</p>
      <p><strong>Decade Highlighting:</strong> {selectedDecade === 'all' ? 'None' : selectedDecade + 's'}</p>
      {#if selectedDecade !== 'all'}
        <p><strong>Highlighted Points:</strong> {data.filter(d => d.peak_decade === parseInt(selectedDecade)).length}</p>
      {/if}
      {#if isLassoing}
        <p class="status">Drawing lasso...</p>
      {/if}
      {#if selectedPoints.length > 0}
        <div class="selected-names">
          <strong>Names:</strong>
          <div class="names-list">
            {#each selectedPoints as point}
              <span class="name-tag" title="{getGenderDisplay(point)} - {point.origin || 'Unknown origin'} - Peak: {point.peak_decade || 'Unknown'}s">{point.Name}</span>
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

  .file-selector, .attribute-selector, .tooltip-selector, .decade-selector {
    width: 100%;
    padding: 15px;
    background: #e8f4fd;
    border-radius: 8px;
    border-left: 4px solid #17a2b8;
    margin-bottom: 20px;
  }

  .attribute-selector {
    background: #f8f9fa;
    border-left: 4px solid #6f42c1;
  }

  .tooltip-selector {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
  }

  .decade-selector {
    background: #d1ecf1;
    border-left: 4px solid #0c5460;
  }

  .file-selector label, .attribute-selector label, .tooltip-selector label, .decade-selector label {
    display: block;
    margin-bottom: 8px;
    color: #333;
  }

  .decade-selector select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
  }

  /* Decade Slider Styles */
  .slider-container {
    position: relative;
    margin: 10px 0;
  }

  .decade-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #ddd;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }

  .decade-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #0c5460;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .decade-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #0c5460;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .decade-slider::-webkit-slider-track {
    height: 8px;
    border-radius: 4px;
    background: #ddd;
  }

  .decade-slider::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: #ddd;
    border: none;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 12px;
    color: #666;
  }

  .slider-label {
    font-weight: 500;
  }

  .slider-ticks {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    font-size: 10px;
    color: #999;
    padding: 0 10px;
  }

  .tick {
    position: relative;
  }

  .file-info, .attribute-info, .tooltip-info, .decade-info, .decade-range {
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
    cursor: help;
  }

  :global(.point) {
    transition: stroke 0.2s ease, stroke-width 0.2s ease;
  }

  :global(.legend text) {
    font-size: 12px;
  }

  .controls-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: #f8f9fa;
    border-top: 1px solid #ddd;
  }

  .control-row {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .slider-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
  }

  .slider-control-label {
    font-size: 12px;
    color: #333;
    margin-bottom: 5px;
  }

  .slider-control-container {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    max-width: 400px;
  }

  .decade-display {
    font-size: 12px;
    font-weight: bold;
    color: #0c5460;
    min-width: 80px;
    text-align: center;
  }

  .decade-slider-control {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #ddd;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }

  .decade-slider-control::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0c5460;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .decade-slider-control::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0c5460;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .control-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
  }

  .zoom-mode-btn {
    background: #6c757d;
    color: white;
  }

  .zoom-mode-btn.active {
    background: #007bff;
    color: white;
  }

  .lasso-mode-btn {
    background: #6c757d;
    color: white;
  }

  .lasso-mode-btn.active {
    background: #dc3545;
    color: white;
  }

  .clear-btn {
    background: #17a2b8;
    color: white;
  }

  .clear-btn:hover {
    background: #138496;
  }

  .reset-btn {
    background: #28a745;
    color: white;
  }

  .reset-btn:hover {
    background: #1e7e34;
  }

  .control-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .control-btn:active {
    transform: translateY(0);
  }
</style>