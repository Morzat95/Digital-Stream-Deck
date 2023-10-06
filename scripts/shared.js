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
	const videoContainer = createMediaContainer();

	// Create the video element
	const videoElement = document.createElement("video");
	videoElement.src = videoData;
	videoElement.controls = true;
	videoElement.autoplay = true;

	// When the video ends, delete the container
	videoElement.onended = () => {
		videoContainer.remove();
	};

	// Add the video to the container and then to the body of the page
	videoContainer.appendChild(videoElement);
	document.body.appendChild(videoContainer);
}

function injectAndPlayLocalImage(imageData) {
	// Create a container for the image
	const imageContainer = createMediaContainer();

	// Create the image element
	const imageElement = document.createElement("img");
	imageElement.src = imageData;
	imageElement.controls = true;
	imageElement.autoplay = true;

	// Removes image after X milliseconds
	setTimeout(() => {
		imageContainer.remove();
	}, 5000);

	// Add the image to the container and then to the body of the page
	imageContainer.appendChild(imageElement);
	document.body.appendChild(imageContainer);
}

function injectAndPlayVideoFromUrl(videoData) {
	const videoId = getYoutubeVideoId(videoData);
	if (videoId) {
		// Create a container for the video
		const videoContainer = createMediaContainer();

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
		iframe.width = "560";
		iframe.height = "315";
		iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`; // Autoplay=1 will make the video start automatically
		iframe.allow =
			"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
		iframe.allowFullscreen = true;

		// Add the iframe to the container and then to the body of the page
		videoContainer.appendChild(iframe);
		document.body.appendChild(videoContainer);
	}
}

function createMediaContainer() {
	const container = document.createElement("div");
	container.style.position = "fixed";
	container.style.top = "50%";
	container.style.left = "50%";
	container.style.transform = "translate(-50%, -50%)";
	container.style.zIndex = "9999";
	return container;
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
