/* globals selectTool gradientTool fillTool rearrangeTool RGBStrip container */
/* exported selectTool gradientTool fillTool rearrangeTool RGBStrip container */

// global vars
var json;
var arrStrips = [];
var tools = [selectTool, gradientTool, fillTool, rearrangeTool];
var activeTool = selectTool;
var activeStrip;
var displayStrip;

// global elements
const elLength = document.getElementById("stripLength");
const elLengthNum = document.getElementById("stripLengthNum");
const elLoadStrip = document.getElementById("loadStrip");
const elFrameCount = document.getElementById("frameCount");
const elFrameDelay = document.getElementById("frameDelay");
const elExportStrip = document.getElementById("exportStrip");

function switchTool(newTool) {
	activeTool.cleanup();
	activeTool = newTool;
	activeTool.setup(activeStrip, arrStrips);
}

function constrain(numX, numMin, numMax) {
	return numX < numMin ? numMin : numX > numMax ? numMax : numX;
}

function switchActiveStrip(numIndex) {
	activeStrip.strip.classList.remove("activeStrip");
	activeStrip = arrStrips[numIndex];
	activeStrip.strip.classList.add("activeStrip");
	activeTool.update(activeStrip, arrStrips);
}

function createStrip() {
	let tempEl = document.createElement("div");
	let tempStrip = new RGBStrip(tempEl, elLength.value);
	tempEl.classList.add("strip");
	tempEl.addEventListener("mousedown", (_) => switchActiveStrip(arrStrips.indexOf(tempStrip)));
	container.append(tempEl);

	arrStrips.push(tempStrip);
	displayStrip.frames.push(tempStrip.colors);
	elFrameCount.value = arrStrips.length;
	activeTool.update(activeStrip, arrStrips);

	return tempStrip;
}

function duplicateStrip(strip) {
	let index = arrStrips.indexOf(strip);
	if (index > -1) {
		let tempStrip = createStrip();
		tempStrip.setStrip(strip.colors);
	}
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
	elFrameCount.value = numLength;
	let frameCount = numLength;
	let add = frameCount > arrStrips.length;
	let dif = Math.abs(frameCount - arrStrips.length);

	if (add) {
		for (let i = 0; i < dif; i++) createStrip();
	} else {
		let startIndex = arrStrips.length - dif;
		let tempArr = arrStrips.slice(startIndex);

		if (tempArr.indexOf(activeStrip) > -1) switchActiveStrip(arrStrips.length - dif - 1);

		arrStrips.splice(startIndex, dif);
		displayStrip.frames.splice(startIndex, dif);

		for (let i of tempArr) i.strip.parentElement.removeChild(i.strip);

		activeTool.update(activeStrip, arrStrips);
	}
}

function keyupHandler(e) {
	if (e.target.localName != "input") {
		e.preventDefault();
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
			case "3":
			case "f":
				next = 2;
				break;
			case "q":
				activeStrip.setStrip(activeStrip.cycleFrame(activeStrip.colors, false));
				break;
			case "e":
				activeStrip.setStrip(activeStrip.cycleFrame(activeStrip.colors, true));
				break;
			case "d":
				duplicateStrip(activeStrip);
				break;
			case "r":
				next = 3;
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
				resizeFrames(Math.max(arrStrips.length - 1, 1));
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

function loadStrip(strJson) {
	let obj = JSON.parse(strJson);
	let { length, frames, frameDelay } = obj;

	resizeStrips(length);

	resizeFrames(frames.length);
	for (let i in frames) {
		if (frames[i].length == length) arrStrips[i].setStrip(frames[i]);
		else console.log("ignoring frame", i);
	}

	elFrameDelay.value = frameDelay;
	elFrameDelay.dispatchEvent(new Event("input"));
}

async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();
	displayStrip = new RGBStrip(document.getElementById("displayStrip"), elLength.value);

	activeStrip = createStrip();
	activeStrip.strip.classList.add("activeStrip");
	activeTool.setup(activeStrip, arrStrips);

	displayStrip.toggleDisabled();
	displayStrip.frameDelay = elFrameDelay.value;
	displayStrip.startAnimation();

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
			if (e.target.checked) switchTool(tools[elTools.indexOf(e.target)]);
		});
	}

	document.addEventListener("keyup", (e) => keyupHandler(e));

	document.addEventListener("stripModified", (e) => {
		let strip = e.detail.strip;
		let index = arrStrips.indexOf(strip);

		if (index > -1) displayStrip.frames[index] = strip.colors;
	});

	document.getElementById("loadStrip").addEventListener("change", (_) => {
		let file = elLoadStrip.files[0];
		let fr = new FileReader();
		if (file) {
			fr.addEventListener("load", (_) => {
				loadStrip(fr.result);
			});

			fr.addEventListener("error", console.log);

			fr.readAsText(file);
		}
	});

	document.getElementById("loadStripButton").addEventListener("mousedown", (_) => elLoadStrip.click());

	document.getElementById("exportStripButton").addEventListener("mousedown", (_) => {
		elExportStrip.download = "rgb.strip";
		elExportStrip.href = `data:text/plain;charset=utf-8,${encodeURIComponent(displayStrip.toJSON())}`;
		elExportStrip.click();
	});
}

loadAndInit();
