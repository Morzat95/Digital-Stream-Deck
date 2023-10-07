const keyMapping = {
	// Spanish keyboard
	"!": "1",
	'"': "2",
	"\u00B7": "3",
	$: "4",
	"%": "5",
	"&": "6",
	"/": "7",
	"(": "8",
	")": "9",
	"=": "0",
	// English keyboard
	1: "1",
	2: "2",
	3: "3",
	4: "4",
	5: "5",
	6: "6",
	7: "7",
	8: "8",
	9: "9",
	0: "0",
};

// Listening to keys combination
document.addEventListener("keydown", (e) => {
	// Key combination Shift + Num
	if (e.key != "Shift" && e.shiftKey) {
		getExtensionStatus().then((isOn) => {
			if (isOn) {
				const audioNumber = keyMapping[e.key];
				playMedia(audioNumber);
			}
		});
	}
});

function getExtensionStatus() {
	return new Promise((resolve) => {
		chrome.storage.local.get("extensionState", function (data) {
			resolve(!!data.extensionState);
		});
	});
}

function playMedia(audioNumber) {
	const keys = [
		`audio${audioNumber}`,
		`video${audioNumber}`,
		`image${audioNumber}`,
		`videoUrl${audioNumber}`,
	];

	chrome.storage.local.get(keys, (items) => {
		const {
			[keys[0]]: audioData,
			[keys[1]]: videoData,
			[keys[2]]: imageData,
			[keys[3]]: videoUrlData,
		} = items;

		if (videoData) {
			injectAndPlayLocalVideo(videoData);
		} else if (imageData) {
			injectAndPlayLocalImage(imageData);
		} else if (videoUrlData) {
			injectAndPlayVideoFromUrl(videoUrlData);
		} else if (audioData) {
			retrieveAndPlayAudio(audioData);
		}
	});
}

function injectAndPlayLocalVideo(videoData) {
	// Create a container for the video
	createMediaContainer().then((videoContainer) => {
		// Create the video element
		const videoElement = document.createElement("video");
		videoElement.src = videoData;
		videoElement.controls = false;
		videoElement.autoplay = true;
		videoElement.style.width = "100%";
		videoElement.style.height = "100%";
		videoElement.style.objectFit = "cover";

		// When the video ends, delete the container
		videoElement.onended = () => {
			videoContainer.remove();
		};

		// Add the video to the container and then to the body of the page
		videoContainer.appendChild(videoElement);
		document.body.appendChild(videoContainer);
	});
}

function injectAndPlayLocalImage(imageData) {
	// Create a container for the image
	createMediaContainer().then((imageContainer) => {
		// Create the image element
		const imageElement = document.createElement("img");
		imageElement.src = imageData;
		imageElement.controls = true;
		imageElement.autoplay = true;
		imageElement.style.width = "100%";
		imageElement.style.height = "100%";

		// Removes image after X milliseconds
		setTimeout(() => {
			imageContainer.remove();
		}, 5000);

		// Add the image to the container and then to the body of the page
		imageContainer.appendChild(imageElement);
		document.documentElement.appendChild(imageContainer);
	});
}

function injectAndPlayVideoFromUrl(videoData) {
	const videoId = getYoutubeVideoId(videoData);
	if (videoId) {
		// Create a container for the video
		createMediaContainer().then((videoContainer) => {
			// Create the close button
			const closeButton = document.createElement("div");
			closeButton.innerText = "X";
			closeButton.style.position = "absolute";
			closeButton.style.top = "10px";
			closeButton.style.right = "10px";
			closeButton.style.cursor = "pointer";
			closeButton.style.backgroundColor = "#fff";
			closeButton.style.padding = "5px";
			closeButton.style.borderRadius = "50%";

			// Click event for close button
			closeButton.onclick = function () {
				videoContainer.remove();
			};

			// Attach close button to video container
			videoContainer.appendChild(closeButton);

			// Create the iframe for the YouTube video
			const iframe = document.createElement("iframe");
			iframe.width = "100%";
			iframe.height = "100%";
			iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`; // Autoplay=1 will make the video start automatically
			iframe.allow =
				"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
			iframe.allowFullscreen = true;

			// Add the iframe to the container and then to the body of the page
			videoContainer.appendChild(iframe);
			document.body.appendChild(videoContainer);
		});
	}
}

function createMediaContainer() {
	const keys = [
		"screenContainerWidth",
		"screenContainerHeight",
		"mediaContainerPositionX",
		"mediaContainerPositionY",
		"mediaContainerWidth",
		"mediaContainerHeight",
	];

	return new Promise((resolve) => {
		chrome.storage.local.get(keys, (data) => {
			const {
				[keys[0]]: screenContainerWidth,
				[keys[1]]: screenContainerHeight,
				[keys[2]]: posX,
				[keys[3]]: posY,
				[keys[4]]: width,
				[keys[5]]: height,
			} = data;

			const container = document.createElement("div");
			container.style.zIndex = "9999";
			container.style.position = "fixed";
			container.style.width = "600px";
			container.style.height = "300px";
			container.style.top = "50%";
			container.style.left = "50%";
			container.style.transform = `translate(-50%, -50%)`;

			if (screenContainerWidth && screenContainerHeight) {
				const screenContainerRatioX =
					window.innerWidth / parsePixelValue(screenContainerWidth);
				const screenContainerRatioY =
					window.innerHeight / parsePixelValue(screenContainerHeight);

				if (posX && posY) {
					// Update position relative to the window
					const adjustedX =
						parseFloat(posX * screenContainerRatioX) + window.innerWidth / 2;
					const adjustedY =
						parseFloat(posY * screenContainerRatioY) + window.innerHeight / 2;
					container.style.transform = `translate(${adjustedX}px, ${adjustedY}px)`;
					container.style.top = 0;
					container.style.left = 0;
				}

				if (width && height) {
					// Update size relative to the window
					container.style.width = `${
						parsePixelValue(width) * screenContainerRatioX
					}px`;
					container.style.height = `${
						parsePixelValue(height) * screenContainerRatioY
					}px`;
				}

				container.setAttribute("default", false);
			} else {
				container.setAttribute("default", true);
			}

			resolve(container);
		});
	});
}

function parsePixelValue(pixelValue) {
	return parseFloat(pixelValue.replace("px", ""));
}

function getYoutubeVideoId(url) {
	const regExp =
		/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	const match = url.match(regExp);
	if (match && match[2].length == 11) {
		return match[2];
	} else {
		return null;
	}
}

function retrieveAndPlayAudio(audioData) {
	// This allows us to bypass Twitter's Content Security Policy and play audio on the page
	fetch(audioData)
		.then((response) => response.blob())
		.then((blob) => {
			let audio = new Audio();
			audio.src = URL.createObjectURL(blob);
			audio.play();
		});
}
