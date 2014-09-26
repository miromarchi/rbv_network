
var distanceFromAge;
(function($) {
  Drupal.d3.network = function (select, settings) {
//    var width   = (settings.config.width || 300),
    var network_width = 	$("#graphapi-default").width();
//        height  = (settings.config.height || 300),
    var network_height  = Math.max($(window).height()*0.65,320);

    var now=new Date();
    
    function setStartEnd(object, timefield)
	{
		var s=object[timefield];
		if (s==null)
		{
			object.start=new Date(0,0,0,0,0,0);
			object.end=now;
		}
		else
		{
			var dateComponents=s.split(",");
			object.start=new Date(dateComponents[0]);
			object.end=new Date(dateComponents[1]);
		}
	}
 
	function setAge(object)
	{
		if (!dateValid(object.start) || !dateValid(object.end))
		{
			object.age=daysToMs(365);
		}
		else if (dateEquals(object.start,object.end) || object.end.getTime()>now.getTime())
		{
			object.age=1;
		}
		else 
		{
			object.age=now.getTime()-object.end.getTime();
		}
	}
 
    
    var maxDays=200;	
	var min=70;
	var max=300;
	var b=Math.E;
	var k=daysToMs(maxDays)/Math.log(max-min);

	distanceFromAge=function(age){
    	var v=Math.pow(b,age/k)+min;
    	v=Math.min(max,Math.max(min,v));
    	return v;
    };
    
    var distanceForLink=function(link){
    	return distanceFromAge(link.age);
    }
    
    var network_nodes   = settings.nodes,
        network_links   = settings.links;

    // Add an attribute to each node that is a source node so that we can
    // use that attribute to style them differently.
    network_links.map(function(d) { network_nodes[d.target].is_source = true; });

    var network_force = d3.layout.force()
      .size([network_width-200, network_height])
      .charge(-100)
      .distance(100)
      .friction(0.92)
      .gravity(0.01);

    for (var i=0;i<network_links.length;i++){
    	var link=network_links[i];
		setStartEnd(link,"color");
		setAge(link);
//		console.log("age:"+msToDays(link.age)+" distance:"+distanceFromAge(link.age))
	}
	
    network_force.linkDistance(distanceForLink)

	for (var i=0;i<network_nodes.length;i++){
		var node=network_nodes[i];
		setStartEnd(node,"content");
		setAge(node);		
		console.log("age:"+msToDays(node.age))
	}


    var network_svg = d3.select('#' + settings.id).append("svg")
        .attr("width", network_width)
        .attr("height", network_height);

    // guide per visualizzare il centro del div
    network_svg.append("line").attr("x1",network_width/2).attr("x2",network_width/2).attr("y1",0).attr("y2",network_height).attr("stroke", "red");
    network_svg.append("line").attr("y1",network_height/2).attr("y2",network_height/2).attr("x1",0).attr("x2",network_width).attr("stroke", "red");

    var network_graph = network_svg.append("g")
        .attr("class", "data");

    network_force
        .nodes(network_nodes)
        .links(network_links)
        .start();

    var network_link = network_graph.selectAll("line.link")
        .data(network_links)
      .enter().append("line")
        .attr("class", "link");

    var opacityMax=1;
    var opacityMin=0.4;
    
    function linearRelation(O,o,M,m)
    {
	    var a=M-o*(m-M)/(O-o);
    	var k=(m-M)/(O-o);
    	var op=k*d+a;
    	return op;	
    }
    
    var opacityForLinkAge=function(age)
    {
	    var o=opacityMin;
    	var O=opacityMax;
    	var m=min;
    	var M=max;
    	var d=distanceFromAge(age)
    	return linearRelation(O,o,M,m,d);
    }
    network_link.style("stroke-opacity",function(link){
    	return opacityForLinkAge(link.age);
    })


    var network_node = network_graph.selectAll("g.node")
        .data(network_nodes)
      .enter().append("svg:g")
        .attr("class", "node")
        .call(network_force.drag);

	var opacityForNodeAge(

    network_node.append("svg:circle")
      .attr("class", "node")
      .attr("r", function(d) { return (d.is_source) ? 9 : 9; })
      .style("fill", function (d) { return (d.is_source) ? d3.hsl('#378722') : d3.hsl('#ABDC0A'); })
      .style("stroke", function(d) { return (d.is_source) ? d3.hsl('#fff') : d3.hsl('#fff'); })
      .style("fill-opacity", function(node) { return opacityForNodeAge(node.age); })
      .style("stroke-opacity", function(node) { return opacityForNodeAge(node.age); });

    network_node.append("svg:a")
        .attr("xlink:href",function(d) { return d.uri })
        .append("svg:text")
        .attr("class", "nodetext")
        .attr("dx", 10)
        .attr("dy", "1")
        .text(function(d) { return (d.name).substring(0,20)+"..."/*+d.content */});

    network_force.on("tick", function() {
      network_link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      network_node.attr("cx", function(d) { return d.x; })
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
          .attr("cy", function(d) { return d.y; });
    });
	function testDaysToMs()
	{
		assert(daysToMs(0)==0)
		assert(daysToMs(1)==8.64e+7)
		assert(msToDays(8.64e+7)==1)
		
	}
	function testOpacityForAge()
	{
		assert(opacityForAge(0)==opacityMax);
	}
	testOpacityForAge();
	testDaysToMs();
  }

})(jQuery);

function dateEquals(date1,date2)
{
	if (date1==null || date2==null)
	{
		return false;	
	}
	return !(date1>date2) && !(date1<date2);
};

function msToDays(ms)
{
	return ms/(1000.0*60.0*60.0*24.0);
}

function daysToMs(days)
{
	return days*1000.0*60.0*60.0*24.0;
}


function dateValid(d)
{
	return !isNaN(d.getTime());
};

function assert(condition, message) {
    if (condition) {
    	console.log("test passed");
    }
    else
    {
        throw message || "Assertion failed";
    }
    
}



