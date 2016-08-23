var notes =[
	'Cb', 
	'C', 
	'C#', 

	'Db', 
	'D', 
	'D#', 

	'Eb', 
	'E', 
	'E#', 

	'Fb', 
	'F', 
	'F#', 

	'Gb', 
	'G', 
	'G#', 

	'Ab', 
	'A', 
	'A#', 

	'Bb', 
	'B', 
	'B#', 
];

var s = d3.scaleThreshold()
			.domain([0, 100])
			.range(notes);

