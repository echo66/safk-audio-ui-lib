var data = [
	{ id: 'i1', time: 0, duration: 2, color: 'red' }, 
	{ id: 'i2', time: 4, duration: 1, color: 'yellow' }, 
	{ id: 'i3', time: 5, duration: 4, color: 'green' }
];

var accessors = {
	x: function(d, v) {

	}, 
	width: function(d, v) {

	}, 
	color: function(d, v) {

	}
};

var domain = [0, 20];
var range = [0, 1000];

var scale = d3.scaleLinear();

var layers = d3.select('body').append('layers-container');

var layer1 = layers.append('layer');

var layerHeight = 100;


function dragstarted(d) {
  // console.log('dragstarted');
  // console.log(this);
}

function dragged(d) {
	// console.log('dragged');
	// console.log(this);
	d3.select(this)
		.attr("left", (d) => {
			var timeInPixels = scale(d.time) + d3.event.dx;
			d.time = scale.invert(timeInPixels);
			// console.log([d3.event.dx, timeInPixels, d.time]);
			return timeInPixels + 'px';
		});
	d3.select(this).call(_apply, 'select')
	console.log(d3.select(this).attr("left"));
}

function dragended(d) {
  // console.log('dragended');
  // console.log(this);
}


function update() {

	scale.domain(domain).range(range);

	var segments = layer1.style('height', layerHeight + 'px')
						 .style('width', range[1] + 'px')
						 .style('position', 'absolute')
						 .selectAll('segment')
						 .data(data, (d) => { return d.id; });

	// UPDATE EXISTING ELEMENTS
	segments.call(_apply, 'selectAll');

	// CREATING NEW ELEMENTS FOR THE NEW DATUMS
	segments.enter().append('segment').call(_apply, 'append');

	// REMOVE DOM ELEMENTS WITH NO REFERENCE TO ANY DATUMS
	segments.exit().remove();
}

function _apply(selection, op) {
	selection
			.attr('id', (d) => { return d.id; })
			.style('left', (d) => { return scale(d.time) + 'px'; })
			.style('width', (d) => { return scale(d.duration + domain[0]) + 'px'; })
			.style('position', 'absolute')
			.style('height', '100%')
			.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended))
			[op]('svg')
				.style('width', (d) => { return scale(d.duration + domain[0]) + 'px'; })
				.style('height', '100%')
				[op]('rect')
					.style('width', (d) => { return scale(d.duration + domain[0]) + 'px'; })
					.style('height', '100%')
					.style('fill', (d) => { return d.color; });
}

update()