/* globals selectTool gradientTool RGBStrip container */
/* exported selectTool gradientTool RGBStrip container */

// global vars
var json;
var arrStrips = [];
var tools = [selectTool, gradientTool];
var activeTool = selectTool;
var activeStrip;
var displayStrip;

// global elements
const elLength = document.getElementById("stripLength");
const elLengthNum = document.getElementById("stripLengthNum");
const elFrameCount = document.getElementById("frameCount");
const elFrameDelay = document.getElementById("frameDelay");

function switchTool(newTool) {
	activeTool.cleanup();
	activeTool = newTool;
	activeTool.setup(activeStrip);
}

function constrain(numX, numMin, numMax) {
	return numX < numMin ? numMin : numX > numMax ? numMax : numX;
}

function switchActiveStrip(numIndex) {
	activeStrip.strip.classList.remove("activeStrip");
	activeStrip = arrStrips[numIndex];
	activeStrip.strip.classList.add("activeStrip");
	activeTool.switchStrip(activeStrip);
}

// add and remove nodes from strips
function resizeStrips(numLength) {
	elLength.value = constrain(numLength, 1, 148);
	activeTool.resize(elLength.value < arrStrips[0].length);
	displayStrip.resize(elLength.value);
	for (let strip of arrStrips) strip.resize(elLength.value);
}

// add and remove strips/frames
function resizeFrames(numLength) {
	let frameCount = numLength;
	let add = frameCount > arrStrips.length;
	let dif = Math.abs(frameCount - arrStrips.length);

	if (add) {
		for (let i = 0; i < dif; i++) {
			let tempEl = document.createElement("div");
			let tempStrip = new RGBStrip(tempEl, elLength.value);
			tempEl.classList.add("strip");

			arrStrips.push(tempStrip);
			displayStrip.frames.push(tempStrip.colors);
			
			tempEl.addEventListener("mousedown", _ => switchActiveStrip(arrStrips.indexOf(tempStrip)));
			container.append(tempEl);
		}
	} else {
		let startIndex = arrStrips.length - dif;
		let tempArr = arrStrips.slice(startIndex);

		if (tempArr.indexOf(activeStrip) > -1) switchActiveStrip(arrStrips.length - dif - 1);

		arrStrips.splice(startIndex, dif);
		displayStrip.frames.splice(startIndex, dif);

		for (let i of tempArr) i.strip.parentElement.removeChild(i.strip);
	}
}

function keyupHandler(e) {
	if (e.target.localName != "input") {
		let next = null;
		switch (e.key) {
			case "1":
			case "s":
				next = 0;
				break;
			case "2":
			case "g":
				next = 1;
				break;
			case "=":
				elFrameDelay.value = Number(elFrameDelay.value) + 10;
				elFrameDelay.dispatchEvent(new Event("input"));
				break;
			case "-":
				elFrameDelay.value = Number(elFrameDelay.value) - 10;
				elFrameDelay.dispatchEvent(new Event("input"));
				break;
			case "ArrowUp":
				resizeFrames(arrStrips.length - 1);
				break;
			case "ArrowDown":
				resizeFrames(arrStrips.length + 1);
				break;
			case "ArrowLeft":
				resizeStrips(Number(elLength.value) - 1);
				break;
			case "ArrowRight":
				resizeStrips(Number(elLength.value) + 1);
				break;
		}

		if (next !== null) {
			document.getElementById(`tool${next}`).checked = true;
			switchTool(tools[next]);
		}
	}
}

async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();

	displayStrip = new RGBStrip(document.getElementById("displayStrip"), elLength.value);
	arrStrips.push(new RGBStrip(document.getElementsByClassName("strip")[1], elLength.value));

	displayStrip.toggleDisabled();
	displayStrip.frames.push(arrStrips[0].colors);
	displayStrip.frameDelay = elFrameDelay.value;
	displayStrip.startAnimation();

	activeStrip = arrStrips[0];
	activeStrip.strip.addEventListener("mousedown", _ => switchActiveStrip(0));

	activeTool.setup(activeStrip);

	elLength.addEventListener("input", (_) => resizeStrips(elLength.value));

	elFrameCount.addEventListener("input", (_) => {
		elFrameCount.value = Math.ceil(elFrameCount.value < 1 ? 1 : elFrameCount.value);
		resizeFrames(elFrameCount.value);
	});

	elFrameDelay.addEventListener("input", (_) => {
		elFrameDelay.value = constrain(elFrameDelay.value, 16, 999);
		let delay = Math.floor(elFrameDelay.value);

		displayStrip.pauseAnimation();
		displayStrip.frameDelay = delay;
		displayStrip.resumeAnimation();
	});

	let elTools = Array.from(document.getElementsByName("tool"));
	for (let i of elTools) {
		i.addEventListener("change", (e) => {
			if (e.target.checked) switchTool(tools[e.target.value]);
		});
	}

	document.addEventListener("keyup", (e) => keyupHandler(e));

	document.addEventListener("stripModified", (e) => {
		let strip = e.detail.strip;
		let index = arrStrips.indexOf(strip);

		if (index > -1) displayStrip.frames[index] = strip.colors;
	});
}

loadAndInit();
