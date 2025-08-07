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
  let selectedAttribute = 'total_births'; // Default attribute for coloring
  
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

  // Available attributes for coloring
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
    { "Name":"Abby", "1976":256.0, "1977":142.0, "1978":312.0, "1979":791.0, "1980":467.5, "1981":608.5, "1982":653.0, "1983":657.5, "1984":1263.0, "1985":607.5, "x":8.6866903305, "y":3.9082963467, "total_births":5000, "is_male":false, "is_female":true, "is_unisex":false, "origin":"Hebrew", "etymology":"father's joy" },
    { "Name":"Abel", "1976":395.0, "1977":347.0, "1978":371.0, "1979":217.0, "1980":240.0, "1981":242.0, "1982":467.0, "1983":217.5, "1984":427.0, "1985":461.0, "x":6.3117189407, "y":2.1993675232, "total_births":3200, "is_male":true, "is_female":false, "is_unisex":false, "origin":"Hebrew", "etymology":"breath" },
    { "Name":"Abigail", "1976":417.5, "1977":795.0, "1978":1010.0, "1979":1225.0, "1980":793.0, "1981":911.0, "1982":946.5, "1983":961.0, "1984":924.5, "1985":930.5, "x":8.9767932892, "y":3.9221160412, "total_births":8500, "is_male":false, "is_female":true, "is_unisex":false, "origin":"Hebrew", "etymology":"father's joy" },
    { "Name":"Aaron", "1976":1205.0, "1977":1089.0, "1978":1052.0, "1979":1031.0, "1980":1012.0, "1981":995.0, "1982":982.0, "1983":975.0, "1984":968.0, "1985":962.0, "x":5.2345678901, "y":1.8765432109, "total_births":12000, "is_male":true, "is_female":false, "is_unisex":false, "origin":"Hebrew", "etymology":"high mountain" },
    { "Name":"Ada", "1976":45.0, "1977":52.0, "1978":48.0, "1979":51.0, "1980":49.0, "1981":53.0, "1982":56.0, "1983":58.0, "1984":62.0, "1985":65.0, "x":9.1234567890, "y":4.5678901234, "total_births":500, "is_male":false, "is_female":true, "is_unisex":false, "origin":"Germanic", "etymology":"noble" }
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
      // Numeric
      const values = data.map(d => getAttributeValue(d, attribute)).filter(v => v != null && !isNaN(v));
      if (values.length === 0) {
        return d3.scaleOrdinal(d3.schemeCategory10);
      }
      return d3.scaleSequential(d3.interpolateViridis).domain(d3.extent(values));
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
  const adjustPointPositionsSimple = (transformedData, zoomScale, pointRadius = 4) => {
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

  const adjustPointPositions = (data, transform, xScale, yScale) => {
    const nodes = data.map(d => ({
      ...d,
      x: transform.rescaleX(xScale)(d.x),
      y: transform.rescaleY(yScale)(d.y),
      originalX: d.x,
      originalY: d.y,
      fx: null,
      fy: null
    }));

    // Calculate minimum distance based on zoom level
    const minDistance = Math.max(8, 12 / transform.k);
    
    // Check for overlaps and apply force simulation if needed
    const overlaps = checkForOverlaps(nodes, minDistance);
    
    if (overlaps.length === 0) {
      return nodes; // No overlaps, return original positions
    }

    // Create force simulation for overlapping points only
    const overlappingNodes = new Set();
    overlaps.forEach(([i, j]) => {
      overlappingNodes.add(nodes[i]);
      overlappingNodes.add(nodes[j]);
    });

    if (overlappingNodes.size === 0) return nodes;

    const simulationNodes = Array.from(overlappingNodes);
    
    // Run a quick force simulation
    const forceSimulation = d3.forceSimulation(simulationNodes)
      .force("collision", d3.forceCollide().radius(minDistance / 2))
      .force("center", d3.forceCenter().strength(0.1))
      .alphaDecay(0.3)
      .stop();

    // Run simulation for a fixed number of iterations
    for (let i = 0; i < 50; ++i) forceSimulation.tick();

    // Update positions in the main nodes array
    simulationNodes.forEach(simNode => {
      const originalNode = nodes.find(n => n.Name === simNode.Name);
      if (originalNode) {
        originalNode.x = simNode.x;
        originalNode.y = simNode.y;
      }
    });

    return nodes;
  };

  const checkForOverlaps = (nodes, minDistance) => {
    const overlaps = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          overlaps.push([i, j]);
        }
      }
    }
    return overlaps;
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
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`UMAP Embeddings - Colored by ${selectedAttrLabel}`);

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
      .attr("r", 4)
      .attr("fill", d => colorScale(getAttributeValue(d, selectedAttribute)))
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .style("cursor", "pointer");

    // Add hover effects and tooltips
    points
      .on("mouseenter", function(event, d) {
        // Calculate current scaled radius based on zoom
        const baseRadius = 4;
        const scaledRadius = Math.max(1, baseRadius / Math.sqrt(currentTransform.k));
        
        // Set hover radius to 2x the current scaled size
        d3.select(this).attr("r", scaledRadius * 2);
        
        // Create tooltip
        const tooltip = svg.append("g")
          .attr("class", "tooltip")
          .style("pointer-events", "none");
        
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        
        // Create enhanced tooltip text with name, coordinates, gender, and selected attribute
        const gender = getGenderDisplay(d);
        const attrValue = getAttributeValue(d, selectedAttribute);
        const attrLabel = availableAttributes.find(attr => attr.value === selectedAttribute)?.label || selectedAttribute;
        
        let formattedAttrValue = attrValue;
        if (typeof attrValue === 'number') {
          formattedAttrValue = attrValue.toLocaleString();
        }
        
        const tooltipLines = [
          d.Name,
          `Gender: ${gender}`,
          `${attrLabel}: ${formattedAttrValue}`,
          `Origin: ${d.origin || 'Unknown'}`,
          `Etymology: ${d.etymology || 'Unknown'}`,
          `(${d.x.toFixed(2)}, ${d.y.toFixed(2)})`
        ];
        
        // Add background first
        const textGroup = tooltip.append("g");
        
        // Add text lines
        const textElements = tooltipLines.map((line, i) => {
          return textGroup.append("text")
            .attr("x", mouseX)
            .attr("y", mouseY - 15 + (i * 16))
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
        // Calculate current scaled radius based on zoom
        const baseRadius = 4;
        const scaledRadius = Math.max(1, baseRadius / Math.sqrt(currentTransform.k));
        
        // Reset radius based on selection state and current zoom
        const isSelected = selectedPoints.includes(d);
        const newRadius = isSelected ? scaledRadius * 1.5 : scaledRadius;
        d3.select(this).attr("r", newRadius);
        
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
        
        // Calculate scaled point size (inverse relationship with zoom)
        const baseRadius = 4;
        const scaledRadius = Math.max(1, baseRadius / Math.sqrt(currentTransform.k));
        
        // Position points according to their rescaled coordinates (not transform the group)
        pointsGroup.selectAll(".point")
          .attr("cx", d => newXScale(d.x)) // Use rescaled position
          .attr("cy", d => newYScale(d.y)) // Use rescaled position
          .each(function(d) {
            const isSelected = selectedPoints.includes(d);
            const currentRadius = parseFloat(d3.select(this).attr("r"));
            const isHovered = currentRadius > scaledRadius * 1.5; // Detect if currently hovered
            
            let newRadius;
            if (isHovered) {
              // Maintain hover effect (2x the current scaled size)
              newRadius = scaledRadius * 2;
            } else if (isSelected) {
              // Selected points are 1.5x the scaled size
              newRadius = scaledRadius * 1.5;
            } else {
              // Normal points use scaled size
              newRadius = scaledRadius;
            }
            
            d3.select(this).attr("r", newRadius);
          });
        
        // Apply collision detection for overlapping points at high zoom
        if (currentTransform.k > 3) {
          // Get current rescaled positions for collision detection
          const transformedData = data.map(d => ({
            ...d,
            x: newXScale(d.x),
            y: newYScale(d.y),
            originalX: d.x,
            originalY: d.y
          }));
          
          // Check for overlaps and adjust if needed (using scaled radius for collision detection)
          const adjustedPositions = adjustPointPositionsSimple(transformedData, currentTransform.k, scaledRadius);
          
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
      
      // Calculate current scaled radius for selection styling
      const baseRadius = 4;
      const scaledRadius = Math.max(1, baseRadius / Math.sqrt(currentTransform.k));
      
      pointsGroup.selectAll(".point")
        .attr("stroke", d => selected.includes(d) ? "#ff6b6b" : "#333")
        .attr("stroke-width", d => selected.includes(d) ? 3 : 1)
        .each(function(d) {
          // Update radius based on selection state and current zoom
          const currentRadius = parseFloat(d3.select(this).attr("r"));
          const isSelected = selected.includes(d);
          const isHovered = currentRadius > scaledRadius * 1.5;
          
          if (!isHovered) {
            const newRadius = isSelected ? scaledRadius * 1.5 : scaledRadius;
            d3.select(this).attr("r", newRadius);
          }
        });

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
          
          // Calculate current scaled radius based on zoom
          const baseRadius = 4;
          const scaledRadius = Math.max(1, baseRadius / Math.sqrt(currentTransform.k));
          
          pointsGroup.selectAll(".point")
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .each(function(d) {
              // Preserve hover state
              const currentRadius = parseFloat(d3.select(this).attr("r"));
              const isHovered = currentRadius > scaledRadius * 1.5;
              if (!isHovered) {
                d3.select(this).attr("r", scaledRadius);
              }
            });
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
      
      // Calculate current scaled radius based on zoom
      const baseRadius = 4;
      const scaledRadius = Math.max(1, baseRadius / Math.sqrt(currentTransform.k));
      
      pointsGroup.selectAll(".point")
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .each(function(d) {
          // Preserve hover state
          const currentRadius = parseFloat(d3.select(this).attr("r"));
          const isHovered = currentRadius > scaledRadius * 1.5;
          if (!isHovered) {
            d3.select(this).attr("r", scaledRadius);
          }
        });
      updateTrendPlot();
    }

    function resetZoom() {
      svg.transition()
         .duration(500)
         .call(zoomBehavior.transform, d3.zoomIdentity)
         .on("end", () => {
           // Reset point positions to original scale positions
           pointsGroup.selectAll(".point")
             .attr("cx", d => xScale(d.x))
             .attr("cy", d => yScale(d.y))
             .each(function(d) {
               // Reset to base radius and preserve selection state
               const isSelected = selectedPoints.includes(d);
               const isHovered = parseFloat(d3.select(this).attr("r")) > 6;
               
               if (!isHovered) {
                 d3.select(this).attr("r", isSelected ? 6 : 4);
               }
             });
         });
    }

    // Initialize in zoom mode
    setInteractionMode('zoom');
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
          
          currentTransform = d3.zoomIdentity;
          
          initializeUMAPPlot();
          updateTrendPlot();
        } else {
          console.error('Data does not have expected structure');
          data = sampleData;
          initializeUMAPPlot();
          updateTrendPlot();
        }
      } else {
        console.error('Data is not a valid array');
        data = sampleData;
        initializeUMAPPlot();
        updateTrendPlot();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Falling back to sample data');
      data = sampleData;
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
    
    <div class="instructions">
      <h3>Instructions:</h3>
      <ul>
        <li>Select a data file from the first dropdown above</li>
        <li>Choose an attribute to color the points by from the second dropdown</li>
        <li><strong>Mode Toggle:</strong> Click "🔍 Zoom/Pan" to zoom and pan, or "🎯 Lasso Select" to draw selections</li>
        <li><strong>Zoom Mode:</strong> Mouse wheel to zoom, click and drag to pan (points separate when zoomed in)</li>
        <li><strong>Lasso Mode:</strong> Click and drag to draw a lasso around points you want to select</li>
        <li>Hover over points to see detailed information including name, gender, origin, etymology, and selected attribute</li>
        <li>Selected names will show their birth trends in the right plot</li>
        <li>Click "Clear" to reset selection or "Reset Zoom" to return to original view</li>
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
              <span class="name-tag" title="{getGenderDisplay(point)} - {point.origin || 'Unknown origin'}">{point.Name}</span>
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

  .file-selector, .attribute-selector {
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

  .file-selector label, .attribute-selector label {
    display: block;
    margin-bottom: 8px;
    color: #333;
  }

  .file-selector select, .attribute-selector select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;
  }

  .file-info, .attribute-info {
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
    transition: all 0.2s ease;
  }

  :global(.point:hover) {
    r: 6;
  }

  :global(.legend text) {
    font-size: 12px;
  }

  .controls-panel {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    background: #f8f9fa;
    border-top: 1px solid #ddd;
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