interact(".resizable")
	.resizable({
		edges: { left: true, right: true, bottom: true, top: true },
		restrictEdges: {
			outer: "parent",
			endOnly: true,
		},
		restrictSize: {
			min: { width: 50, height: 50 }, // minimum values for size
		},
	})
	.on("resizemove", function (event) {
		var target = event.target;

		// Set size
		target.style.width = event.rect.width + "px";
		target.style.height = event.rect.height + "px";

		// Update drag position on resize
		var x =
			(parseFloat(target.getAttribute("data-x")) || 0) + event.deltaRect.left;
		var y =
			(parseFloat(target.getAttribute("data-y")) || 0) + event.deltaRect.top;

		target.style.webkitTransform = target.style.transform =
			"translate(" + x + "px," + y + "px)";

		target.setAttribute("data-x", x);
		target.setAttribute("data-y", y);
	})
	.on("resizeend", function (event) {
		var target = event.target;

		chrome.storage.local.set({
			mediaContainerWidth: target.style.width,
			mediaContainerHeight: target.style.height,
		});
	});

const restrictToParent = interact.modifiers.restrict({
	restriction: "parent",
	elementRect: { left: 0, right: 1, top: 0, bottom: 1 },
	endOnly: false,
});

interact(".draggable")
	.draggable({
		modifiers: [restrictToParent],
		onmove: function (event) {
			var target = event.target;
			var x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
			var y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

			target.style.webkitTransform = target.style.transform =
				"translate(" + x + "px, " + y + "px)";

			target.setAttribute("data-x", x);
			target.setAttribute("data-y", y);
		},
	})
	.on("dragend", function (event) {
		var target = event.target;

		chrome.storage.local.set({
			mediaContainerPositionX: target.getAttribute("data-x"),
			mediaContainerPositionY: target.getAttribute("data-y"),
		});
	});

window.onload = function () {
	// Store configuration screen size
	var screenContainer = document.querySelector(".screen-container");

	const screenContainerWidth = 95;
	const screenContainerHeight = 95;

	screenContainer.style.width = `${screenContainerWidth}vw`;
	screenContainer.style.height = `${screenContainerHeight}vh`;
	chrome.storage.local.set({
		screenContainerWidth: `${convertToPixels(screenContainerWidth, "vw")}px`,
		screenContainerHeight: `${convertToPixels(screenContainerHeight, "vh")}px`,
	});

	const keys = [
		"mediaContainerPositionX",
		"mediaContainerPositionY",
		"mediaContainerWidth",
		"mediaContainerHeight",
	];

	chrome.storage.local.get(keys, (items) => {
		const {
			[keys[0]]: posX,
			[keys[1]]: posY,
			[keys[2]]: width,
			[keys[3]]: height,
		} = items;

		var rectangle = document.querySelector(".draggable");

		// Set position
		if (posX && posY) {
			rectangle.style.transform = "translate(" + posX + "px," + posY + "px)";
			rectangle.setAttribute("data-x", posX);
			rectangle.setAttribute("data-y", posY);
		}

		// Set size
		if (width && height) {
			rectangle.style.width = width;
			rectangle.style.height = height;
		}
	});
};

function convertToPixels(value, unit) {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	if (unit === "vw") {
		return (viewportWidth * value) / 100;
	}

	if (unit === "vh") {
		return (viewportHeight * value) / 100;
	}

	throw new Error('Unsupported unit. Please use "vw" or "vh".');
}
