var panelLayout;

$(document).ready(function () {
	var options = {
		north: {
			resizable: false,
			closable: false,
			spacing_open: 0
		},
		west: {
			livePaneResizing: true,
			closable: false,
			size: 400
		},
		east: {
			livePaneResizing: true,
			closable: false,
			size: 400
		}
	};

	panelLayout = $("body").layout(options);
});
