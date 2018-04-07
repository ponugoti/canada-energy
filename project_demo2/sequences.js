// Dimensions of sunburst.
var width = 1965;
var height = 1200;
var radius = Math.min(width, height) / 2.25;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 250,
  h: 50,
  s: 2,
  t: 10
};

// Get the hex of a color for a given string
var colors = function(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var color = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

var totalSize = 0,
  json = null,
  year = 1995,
  province = null;

function replaceText(){
  document.getElementById("headingId").innerHTML = ("Energy Supply and Consumption Trends in "+ province + " in "+ year);
  document.getElementById("headingId").style.fontSize = "xx-large";
};


var vis = d3.select("#chart").append("svg:svg")
  .attr("width", width)
  .attr("height", height)
  .append("svg:g")
  .attr("id", "container")
  .attr("transform", "translate(" + width / 1.8 + "," + height / 2 + ")");

var partition = d3.partition().size([2 * Math.PI, radius * radius]);

var arc = d3.arc().startAngle(d => {
    return d.x0;
  })
  .endAngle(d => {
    return d.x1;
  })
  .innerRadius(d => {
    return Math.sqrt(d.y0);
  })
  .outerRadius(d => {
    return Math.sqrt(d.y1);
  });

// Use d3.text and d3.csvParseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("visit-sequences.csv", function(text) {
  var csv = d3.csvParseRows(text);
  json = buildHierarchy(csv);
  province = "Canada";
  createVisualization(provinceData());
});

var margin = {
    top: 1,
    left: 1,
    bottom: 0,
    right: 1
  },
  width1 = 350,
  width1 = width1 - margin.left - margin.right,
  mapRatio = 1,
  height1 = width1 * mapRatio,
  mapRatioAdjuster = .15;
  center = [5, 20];

var projection = d3.geoAzimuthalEqualArea()
  .rotate([100, -45])
  .center(center)
  .translate([width1 / 2, height1 / 2])
  .scale(width1 * [mapRatio + mapRatioAdjuster]);

var geoPath = d3.geoPath().projection(projection);

var features = d3.select("#viz")
  .append("svg")
  .attr("width", width1)
  .attr("height", height1)
  .append("g");

function drawmap() {
  //Load TopoJSON data
  d3.json("canada-topojson.json", function(error, can) {

    if (error) return console.error(error);
    var subunits = topojson.feature(can, can.objects.canada);
    //Bind data and create one path per TopoJSON feature
    features.selectAll("path")
      .data(topojson.feature(can, can.objects.canada).features)
      .enter()
      .append("path")
      .attr("d", geoPath)
      .attr("fill", "#e8d8c3")
      .attr("stroke", "#404040")
      .attr("stroke-width", .45)

    .on("mouseover", d => {
        d3.select("#tooltip")
          .transition()
          .style("top", (d3.event.pageY) + 20 + "px")
          .style("left", (d3.event.pageX) + 20 + "px")
          .select('#province-name-tooltip')
          .text(d.properties.name);
        d3.select('#province-name')
        .text(d.properties.NAME);
        d3.select("#tooltip").classed("hidden", false);
      })
      .on("mouseleave", function() {
        d3.select("#tooltip").classed("hidden", true);
      })
      .on("click", d => {
        province = d.properties.NAME;
        console.log(d.properties.NAME);
        createVisualization(provinceData());
      })
      .exit().remove();
  });
};

function yearData() {
  for (year_idx in json.children) {
    if (json.children[year_idx].name == year) {
      return json.children[year_idx];
    }
  }
};

function provinceData() {
  if (province) {
    var years = json.children;
    for (year_idx in years) {
      if (years[year_idx].name == year) {
        var provinces = years[year_idx].children;
        for (province_idx in provinces) {
          if (provinces[province_idx].name == province) {
            return provinces[province_idx];
          }
        }
      }
    }
  }
};

function sliderChanged(value) {
  document.querySelector('#yearSlider').value = value;
  year = document.querySelector('#yearSlider').value;
  createVisualization(provinceData());

}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(jsonData) {

  replaceText();

  d3.selectAll('svg > g > *').remove();

  // Basic setup of page elements.
  initializeBreadcrumbTrail();

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
    .attr("r", radius)
    .style("opacity", 0);

  // Turn the data into a d3 hierarchy and calculate the sums.
  var root = d3.hierarchy(jsonData)
    .sum(d => {
      return d.size;
    })
    .sort((a, b) => {
      return b.value - a.value;
    });

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition(root).descendants().filter(d => {
    return (d.x1 - d.x0 > 0.005); // 0.005 radians = 0.29 degrees
  });

  var path = vis.data([jsonData]).selectAll("path")
    .data(nodes)
    .enter().append("svg:path")
    .attr("display", d => {
      return d.depth ? null : "none";
    })
    .attr("d", arc)
    .attr("fill-rule", "evenodd")
    .style("fill", d => {
      return colors(d.data.name);
    })
    .style("opacity", 1)
    .on("mouseover", mouseover);

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);
  drawmap();
};

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
  var value = Math.floor(d.value);
  var valueString = value + " kilotonnes";

  d3.select("#value").text(valueString);

  d3.select("#explanation").style("visibility", "");

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array
  updateBreadcrumbs(sequenceArray, valueString);

  // Fade all the segments.
  d3.selectAll("path").style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path").filter(function(node) {
    return (sequenceArray.indexOf(node) >= 0);
  }).style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {
  // Hide the breadcrumb trail
  d3.select("#trail").style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
    .transition()
    .duration(1000)
    .style("opacity", 1)
    .on("end", function() {
      d3.select(this).on("mouseover", mouseover);
    });

  d3.select("#explanation").style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
    .attr("width", width)
    .attr("height", 50)
    .attr("id", "trail");
  // Add the label at the end, for the value.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and value.
function updateBreadcrumbs(nodeArray, valueString) {

  // Data join; key function combines name and depth (= position in sequence).
  var trail = d3.select("#trail")
    .selectAll("g")
    .data(nodeArray, d => {
      return d.data.name + d.depth;
    });

  // Remove exiting nodes.
  trail.exit().remove();

  // Add breadcrumb and label for entering nodes.
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
    .attr("points", breadcrumbPoints)
    .style("fill", d => {
      return colors[d.data.name];
    });

  entering.append("svg:text").attr("x", (b.w + b.t) / 2)
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(d => {
      return d.data.name;
    });

  // Merge enter and update selections; set position for all nodes.
  entering.merge(trail).attr("transform", (d, i) => {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Now move and update the value at the end.
  d3.select("#trail").select("#endlabel")
    .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(valueString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail").style("visibility", "");
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how
// often that sequence occurred.
function buildHierarchy(csv) {
  var root = {
    "name": "root",
    "children": []
  };
  for (var i = 0; i < csv.length; i++) {
    var sequence = csv[i][0];
    var size = +csv[i][1];
    if (isNaN(size)) {
      continue;
    }

    var parts = sequence.split("-");
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree.
        var foundChild = false;
        for (var k = 0; k < children.length; k++) {
          if (children[k]["name"] == nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If no child node for this branch, create it.
        if (!foundChild) {
          childNode = {
            "name": nodeName,
            "children": []
          };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = {
          "name": nodeName,
          "size": size
        };
        children.push(childNode);
      }
    }
  }
  return root;
};
