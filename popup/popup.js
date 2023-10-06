const IconType = {
	UPLOAD_AUDIO: "UPLOAD_AUDIO",
	UPLOAD_VIDEO: "UPLOAD_VIDEO",
	UPLOAD_IMAGE: "UPLOAD_IMAGE",
	PLAY: "PLAY",
	DELETE: "DELETE",
};

document.addEventListener("DOMContentLoaded", function () {
	generateAudioBoxes();
});

document.getElementById("openInTab").addEventListener("click", function () {
	chrome.tabs.create({ url: "/popup/popup.html" });
});

// Configure switch status
const switchElement = document.getElementById("flexSwitchCheckChecked");
switchElement.addEventListener("change", function () {
	chrome.storage.local.set({ extensionState: this.checked });
});
getExtensionStatus().then((isOn) => {
	switchElement.checked = isOn;
});

// ==================== DOM Elements Generation ====================

function generateAudioBoxes() {
	const indexes = [...new Set(Object.values(keyMapping))];
	const grid = document.getElementById("grid");

	indexes.forEach((i) => {
		const newAudioBox = generateAudioBox(i);
		grid.appendChild(newAudioBox);
	});
}

function generateAudioBox(index) {
	// Create the grid item
	const gridItem = document.createElement("div");
	gridItem.className = "col-6 mb-4";

	// Create grid card
	const gridCard = document.createElement("div");
	gridCard.className = "card";

	// Create card header container
	const headerContainer = document.createElement("div");
	headerContainer.className = "card-header text-center";

	// Create card header
	const cardHeader = document.createElement("h5");
	cardHeader.className = "card-title";
	cardHeader.innerHTML = `Shift + ${index}`;

	// Create card body
	const cardBody = document.createElement("div");
	cardBody.className = "card-body text-center";

	// Create audio description
	const audioDescription = document.createElement("textarea");
	audioDescription.type = "text";
	audioDescription.id = `audioDescription${index}`;
	audioDescription.placeholder =
		"Add a description to identify your audio file";
	audioDescription.className = "form-control form-control-sm mb-1";
	loadDescription(index);

	// Create audio input
	const audioInput = document.createElement("input");
	audioInput.type = "file";
	audioInput.id = `audioInput${index}`;
	audioInput.className = "d-none";
	audioInput.onchange = () => updateAudioUploadIcon(index);

	// Create video input
	const videoInput = document.createElement("input");
	videoInput.type = "file";
	videoInput.id = `videoInput${index}`;
	videoInput.className = "d-none";
	videoInput.onchange = () => updateVideoUploadIcon(index);

	// Create video form
	const videoUrlInput = document.createElement("input");
	videoUrlInput.type = "text";
	videoUrlInput.id = `videoUrl${index}`;
	videoUrlInput.className = "input-video";
	videoUrlInput.placeholder = "Paste the YouTube URL here";
	loadVideoUrl(index);

	// Create image input
	const imageInput = document.createElement("input");
	imageInput.type = "file";
	imageInput.id = `imageInput${index}`;
	imageInput.className = "d-none";
	imageInput.accept = "image/*";

	// Create controls row
	const controlsRow = document.createElement("div");
	controlsRow.className = "row";

	// Create controls
	const uploadAudioControl = generateFormControl(
		audioInput.id,
		IconType.UPLOAD_AUDIO
	);
	const uploadVideoControl = generateFormControl(
		videoInput.id,
		IconType.UPLOAD_VIDEO
	);
	const uploadImageControl = generateFormControl(
		imageInput.id,
		IconType.UPLOAD_IMAGE
	);
	const playControl = generateFormControl(audioInput.id, IconType.PLAY, () =>
		playMedia(keyMapping[index])
	);
	const deleteControl = generateFormControl(
		audioInput.id,
		IconType.DELETE,
		() => deleteConfiguration(keyMapping[index])
	);

	// Create button row
	const buttonRow = document.createElement("div");
	buttonRow.className = "row";

	// Create form button
	const formButton = document.createElement("button");
	formButton.className = "btn btn-block btn-primary";
	formButton.innerHTML = "Save";

	formButton.addEventListener("click", function () {
		saveAudio(index);
	});

	// Append elements
	gridItem.appendChild(gridCard);
	gridCard.appendChild(headerContainer);
	headerContainer.appendChild(cardHeader);
	gridCard.appendChild(cardBody);
	cardBody.appendChild(audioDescription);
	cardBody.appendChild(audioInput);
	cardBody.appendChild(videoInput);
	cardBody.appendChild(imageInput);
	cardBody.appendChild(videoUrlInput);
	cardBody.appendChild(controlsRow);
	controlsRow.appendChild(uploadAudioControl);
	controlsRow.appendChild(uploadVideoControl);
	controlsRow.appendChild(uploadImageControl);
	controlsRow.appendChild(playControl);
	controlsRow.appendChild(deleteControl);
	cardBody.appendChild(buttonRow);
	buttonRow.appendChild(formButton);

	return gridItem;
}

function generateFormControl(inputId, iconType, callback) {
	const formItem = document.createElement("div");
	formItem.className = "col";

	const label = document.createElement("label");
	label.className = "d-block mb-1 text-center audio-icon";

	const icon = document.createElement("i");

	switch (iconType) {
		case IconType.UPLOAD_AUDIO:
			label.htmlFor = inputId;
			icon.id = `iconAudioUploadFor${inputId}`;
			icon.className = "fas fa-file-audio fa-solid fa-1x"; // fa-file-audio looks very similar to the video icon. If I make them bigger they look good
			break;
		case IconType.UPLOAD_VIDEO:
			label.htmlFor = inputId;
			icon.id = `iconVideoUploadFor${inputId}`;
			icon.className = "fas fa-file-video fa-solid fa-1x";
			break;
		case IconType.UPLOAD_IMAGE:
			label.htmlFor = inputId;
			icon.id = `iconImageUploadFor${inputId}`;
			icon.className = "fas fa-file-image fa-solid fa-1x";
			break;
		case IconType.PLAY:
			label.onclick = callback;
			icon.id = `iconPlayFor${inputId}`;
			icon.className = "fas fa-volume-up fa-1x";
			break;
		case IconType.DELETE:
			label.onclick = callback;
			icon.id = `iconDeleteFor${inputId}`;
			icon.className = "fas fa-trash fa-solid fa-1x";
			break;
	}

	formItem.appendChild(label);
	label.appendChild(icon);

	return formItem;
}

function saveAudio(number) {
	const audioInput = document.getElementById(`audioInput${number}`);
	const videoInput = document.getElementById(`videoInput${number}`);
	const imageInput = document.getElementById(`imageInput${number}`);
	const descriptionInput = document.getElementById(`audioDescription${number}`);
	const videoUrlInput = document.getElementById(`videoUrl${number}`);
	const audioFile = audioInput.files[0];
	const videoFile = videoInput.files[0];
	const imageFile = imageInput.files[0];
	const description = descriptionInput.value;
	const videoUrl = videoUrlInput.value;

	// Object to store in chrome.storage
	let storageObject = {};

	storageObject[`description${number}`] = description;
	storageObject[`videoUrl${number}`] = videoUrl;

	let tasks = [];

	// for the video
	if (videoFile) {
		tasks.push(
			readFileAsDataURL(videoFile).then((data) => {
				storageObject[`video${number}`] = data;
			})
		);
	}

	// for the image
	if (imageFile) {
		tasks.push(
			readFileAsDataURL(imageFile).then((data) => {
				storageObject[`image${number}`] = data;
			})
		);
	}

	// for audio
	if (audioFile) {
		tasks.push(
			readFileAsDataURL(audioFile).then((data) => {
				storageObject[`audio${number}`] = data;
			})
		);
	}

	// When all tasks (promises) have been completed, we save to chrome.storage
	Promise.all(tasks)
		.then(() => {
			chrome.storage.local.set(storageObject);
		})
		.catch((error) => {
			console.error("There was an error reading the files:", error);
		});
}

// This function returns a promise that resolves when the FileReader has finished reading.
function readFileAsDataURL(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function loadDescription(number) {
	chrome.storage.local.get([`description${number}`], function (result) {
		const description = result[`description${number}`];
		if (description) {
			document.getElementById(`audioDescription${number}`).value = description;
		}
	});
}

function loadVideoUrl(number) {
	chrome.storage.local.get([`videoUrl${number}`], function (result) {
		const description = result[`videoUrl${number}`];
		if (description) {
			document.getElementById(`videoUrl${number}`).value = description;
		}
	});
}

function updateAudioUploadIcon(index) {
	updateIcon("audioInput", "iconAudioUploadFor", "fa-upload", index);
}

function updateVideoUploadIcon(index) {
	updateIcon("videoInput", "iconVideoUploadFor", "fa-file-video", index);
}

function updateImageUploadIcon(index) {
	updateIcon("imageInput", "iconImageUploadFor", "fa-file-image", index);
}

function updateIcon(fileInputPrefixId, iconElementPrefixId, iconClass, index) {
	const fileInput = document.getElementById(`${fileInputPrefixId + index}`);
	const iconElement = document.getElementById(
		`${iconElementPrefixId + fileInput.id}`
	);
	if (fileInput.files && fileInput.files.length > 0) {
		iconElement.classList.remove(iconClass);
		iconElement.classList.add("fa-check-circle");
	} else {
		iconElement.classList.remove("fa-check-circle");
		iconElement.classList.add(iconClass);
	}
}

function deleteConfiguration(audioNumber) {
	chrome.storage.local.remove(
		[
			`audio${audioNumber}`,
			`description${audioNumber}`,
			`videoUrl${audioNumber}`,
			`video${audioNumber}`,
			`image${audioNumber}`,
		],
		function () {
			// Update the user interface
			const audioInput = document.getElementById(`audioInput${audioNumber}`);
			const videoInput = document.getElementById(`videoInput${audioNumber}`);
			const imageInput = document.getElementById(`imageInput${audioNumber}`);
			const descriptionInput = document.getElementById(
				`audioDescription${audioNumber}`
			);
			const videoUrlInput = document.getElementById(`videoUrl${audioNumber}`);

			audioInput.value = ""; // Clears the audio input value
			videoInput.value = ""; // Clears the video input value
			imageInput.value = ""; // Clears the video input value
			descriptionInput.value = ""; // Clear the value of the textarea
			videoUrlInput.value = ""; // Clear the value of the input

			updateAudioUploadIcon(audioNumber);
			updateVideoUploadIcon(audioNumber);
			updateImageUploadIcon(audioNumber);

			// We show a message to the user
			alert("Configuración eliminada correctamente.");
		}
	);
}
