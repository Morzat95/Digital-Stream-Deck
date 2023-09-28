const IconType = {
	UPLOAD: "UPLOAD",
	PLAY: "PLAY",
	DELETE: "DELETE",
};

document.addEventListener("DOMContentLoaded", function () {
	generateAudioBoxes();
});

document.getElementById("openInTab").addEventListener("click", function () {
	chrome.tabs.create({ url: "/popup/popup.html" });
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
	audioInput.onchange = () => updateIcon(index);

	// Create controls row
	const controlsRow = document.createElement("div");
	controlsRow.className = "row";

	// Create controls
	const uploadControl = generateFormControl(audioInput.id, IconType.UPLOAD);
	const playControl = generateFormControl(audioInput.id, IconType.PLAY, () =>
		retrieveAndPlay(keyMapping[index])
	);
	const deleteControl = generateFormControl(
		audioInput.id,
		IconType.DELETE,
		() => deleteAudioConfiguration(keyMapping[index])
	);

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
	cardBody.appendChild(controlsRow);
	controlsRow.appendChild(uploadControl);
	controlsRow.appendChild(playControl);
	controlsRow.appendChild(deleteControl);
	cardBody.appendChild(formButton);

	return gridItem;
}

function generateFormControl(inputId, iconType, callback) {
	const formItem = document.createElement("div");
	formItem.className = "col";

	const label = document.createElement("label");
	label.className = "d-block mb-1 text-center audio-icon";

	const icon = document.createElement("i");

	switch (iconType) {
		case IconType.UPLOAD:
			label.htmlFor = inputId;
			icon.id = `iconUploadFor${inputId}`;
			icon.className = "fas fa-upload fa-solid fa-1x";
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
	const descriptionInput = document.getElementById(`audioDescription${number}`);
	const audioFile = audioInput.files[0];
	const description = descriptionInput.value;

	// Object to store in chrome.storage
	let storageObject = {};

	if (audioFile) {
		const reader = new FileReader();
		reader.onload = function () {
			const audioData = reader.result;
			storageObject[`audio${number}`] = audioData;

			// If there is a description, we add it to the object.
			if (description) {
				storageObject[`description${number}`] = description;
			}

			chrome.storage.local.set(storageObject);
		};
		reader.readAsDataURL(audioFile);
	} else if (description) {
		// If there is no audio file but there is a description, we save it.
		storageObject[`description${number}`] = description;
		chrome.storage.local.set(storageObject);
	}
}

function loadDescription(number) {
	chrome.storage.local.get([`description${number}`], function (result) {
		const description = result[`description${number}`];
		if (description) {
			document.getElementById(`audioDescription${number}`).value = description;
		}
	});
}

function updateIcon(index) {
	const audioInput = document.getElementById(`audioInput${index}`);
	const iconElement = document.getElementById(`iconUploadFor${audioInput.id}`);
	if (audioInput.files && audioInput.files.length > 0) {
		iconElement.classList.remove("fa-upload");
		iconElement.classList.add("fa-check-circle");
	} else {
		iconElement.classList.remove("fa-check-circle");
		iconElement.classList.add("fa-upload");
	}
}

function deleteAudioConfiguration(audioNumber) {
	chrome.storage.local.remove(
		[`audio${audioNumber}`, `description${audioNumber}`],
		function () {
			// Update the user interface
			const audioInput = document.getElementById(`audioInput${audioNumber}`);
			const descriptionInput = document.getElementById(
				`audioDescription${audioNumber}`
			);

			audioInput.value = ""; // Clears the audio input value
			descriptionInput.value = ""; // Clear the value of the textarea

			updateIcon(audioNumber);

			// We show a message to the user
			alert("Audio y descripción eliminados correctamente.");
		}
	);
}
