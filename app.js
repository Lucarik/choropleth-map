const  margin = {top: 50, right: 30, bottom: 80, left: 70};
const w = 1000 - margin.left - margin.right;
const h = 700 - margin.top - margin.bottom;
// Initialize svg, set width, height 
const svg = d3.select(".plot")
    .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var path = d3.geoPath();

// Function to get data
async function getData(link) {
    try {
        return fetch(link)
            .then(async (response) => await response.json())
    } catch(e) {
        return e;
    }
}

(async function(){
    // Get data, set titles
    let datasetEducation = await getData("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json");
    let datasetCounty = await getData("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json");
    let title = "United States College Education";

    // Arrays for determining heatmap color
    let percentArray = [2.6,9.9,17.1,24.4,31.6,38.9,46.1,53.4,60.6,67.9,75.1];
    let colorArray = ["rgba(10,255,10,.8)","rgba(50,250,50,.8)", "rgba(70,250,70,.8)", "rgba(90,250,90,.8)", "rgba(110,250,110,.8)", "rgba(130,250,130,.8)"
    , "rgba(150,250,150,.8)", "rgba(170,250,170,.8)", "rgba(190,250,190,.8)", "rgba(210,250,210,.8)", "rgba(230,250,230,.8)"].reverse();
    
    // Set title
    svg.append('text')
        .attr("class", "text")
        .attr("id", "title")
        .style("font-size", "35px")
        .attr('x', 350)
        .attr('y', 10)
        .text(title);

    // Tooltip
    const tooltip = d3.select(".plot")
        .append("g")
            .attr("id", "tooltip")
            .attr("data-year", "")
            .attr("data-xvalue", 0)
            .style("left", "0px")
            .style("visibility", "hidden");
    
    tooltip.append("div")
            .attr("class", "tooltip-text")
            .text("hidden");

    // Set color for data points based on data present
    const initializeColor = function(data) {
        let degree = matchById(data).bachelorsOrHigher;
        for (let i = 1; i < percentArray.length; i++) {
            if (degree <= percentArray[i]) return colorArray[i-1];
        }
    }
    // Return object where id matched
    const matchById = function(data) {
        let match =  datasetEducation.filter(d => d.fips === data.id);
        if (match[0]) return match[0];
        else return 0;
    }


    // Function called when moving mouse out of bar 
    const mouseout = function(data) {
        d3.select(this).style("fill", initializeColor(data));
        tooltip.style("visibility", "hidden");
    } 

    // Function called when moving mouse into bar
    const mouseover = function() {
        d3.select(this).style("fill", "rgba(200,250,250,.7)");
        tooltip.style("visibility", "visible");
    }

    // Function called when mouse moves on bar
    // Sets tooltip text and changes location
    const mousemove = function(data) {
        let raw = matchById(data);
        let state = raw.state;
        let county = raw.area_name;
        let degree = raw.bachelorsOrHigher;
        tooltip.attr("data-education", degree);
        const text = d3.select('.tooltip-text');
        text.html(`Location: ${county}, ${state}<br/>Degree(%): ${degree}`);
        const [x, y] = d3.mouse(this);
        tooltip.style("left", `${x+80}px`)
            .style("top", `${y-690}px`)
    };
    
    // Create counties, fill data points of chart
    svg.selectAll("path")
        .data(topojson.feature(datasetCounty, datasetCounty.objects.counties).features)
        .enter()
        .append("path")
            .attr("d", path)
            .attr("data-fips", d => d.id)
            .attr("data-education", d => matchById(d).bachelorsOrHigher)
            .attr("class", "county")
            .attr("fill", initializeColor)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove);

    // State outlines
    svg.append('path')
        .datum(
            topojson.mesh(datasetCounty, datasetCounty.objects.states, function (a, b) {
            return a !== b;
            })
        )
        .attr("fill", "none")
        .attr('d', path);

    // Create and append legend
    var threshold = d3.scaleThreshold()
        .domain(percentArray)
        .range(colorArray);

    var legendScale = d3.scaleLinear()
        .domain([2.6, 75.1])
        .range([0, 350]);
    var legendAxis = d3.axisBottom(legendScale)
        .tickSize(13)
        .tickValues(threshold.domain())
        .tickFormat(d => d.toFixed(1));
        
    var g = svg.append("g");

    // Data text at bottom of legend
    g.call(legendAxis)
        .attr("transform", "translate(490,610)")
        .attr("id", "legend")
        .selectAll("text")
            .text(d => d+"%")
            .style("fill", "white");
    
    // Colors in legend
    g.selectAll("rect")
        .data(threshold.range().map(function(color) {
            var d = threshold.invertExtent(color);
            if (d[0] == null) d[0] = legendScale.domain()[0];
            if (d[1] == null) d[1] = legendScale.domain()[1];
            return d;
        }))
        .enter()
        .append("rect")
            .attr("height", 8)
            .attr("x", function(d) { return legendScale(d[0]); })
            .attr("width", function(d) { return legendScale(d[1]) - legendScale(d[0]); })
            .attr("fill", function(d) { return threshold(d[0]); });

    // Legend description
    g.append("text")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .attr("id", "description")
        .attr("y", -6)
        .text("Bachelor degree+ percentage per county")
        .style("fill", "white");
            
})();