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
		const audioNumber = keyMapping[e.key];
		retrieveAndPlay(audioNumber);
	}
});

function retrieveAndPlay(audioNumber) {
	chrome.storage.local.get([`audio${audioNumber}`], (items) => {
		const audioData = items[`audio${audioNumber}`];
		if (audioData) {
			// This allows us to bypass Twitter's Content Security Policy and play audio on the page
			fetch(audioData)
				.then((response) => response.blob())
				.then((blob) => {
					let audio = new Audio();
					audio.src = URL.createObjectURL(blob);
					audio.play();
				});
		}
	});
}
