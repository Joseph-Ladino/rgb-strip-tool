/* eslint-disable no-unused-vars */

// global vars
var json;
var arrStrips = [];
var tools = [selectTool, gradientTool];
var activeTool = selectTool;
var activeStrip;

// global elements
const elLength = document.getElementById("stripLength");
const elLengthNum = document.getElementById("stripLengthNum");
const elFrameCount = document.getElementById("frameCount");
const elFrameDelay = document.getElementById("frameDelay");

function switchTool(newTool) {
	activeTool.cleanup();
	activeTool = newTool;
	activeTool.setup(arrStrips);
}

function constrain(numX, numMin, numMax) {
	if (numX < numMin) return numMin;
	else if (numX > numMax) return numMax;
	else return numX;
}

function switchActiveStrip(numIndex) {
	activeStrip.strip.classList.remove("activeStrip");
	activeStrip = arrStrips[numIndex];
	activeStrip.strip.classList.add("activeStrip");
}

async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();

	arrStrips.push(new RGBStrip(document.getElementsByClassName("strip")[0], elLength.value));

	activeStrip = arrStrips[0];
	activeTool.setup(arrStrips);

	elLength.addEventListener("input", (_) => {
		elLengthNum.value = elLength.value;

		for (let strip of arrStrips) strip.resize(elLength.value);

		activeTool.resize(elLength.value);
	});

	elLengthNum.addEventListener("input", (_) => {
		elLengthNum.value = constrain(elLengthNum.value, 1, 148);

		elLength.value = elLengthNum.value;

		activeTool.resize(elLength.value < arrStrips[0].length);

		for (let strip of arrStrips) strip.resize(elLengthNum.value);
	});

	elFrameCount.addEventListener("input", (_) => {
		elFrameCount.value = Math.ceil(elFrameCount.value < 1 ? 1 : elFrameCount.value);
		let frameCount = elFrameCount.value;
		let add = frameCount > arrStrips.length;
		let dif = Math.abs(frameCount - arrStrips.length);

		if (add) {
			for (let i = 0; i < dif; i++) {
				let tempStrip = document.createElement("div");
				tempStrip.classList.add("strip");
				arrStrips.push(new RGBStrip(tempStrip, elLength.value));
				container.append(tempStrip);
			}
		} else {
			let startIndex = arrStrips.length - dif;
			let tempArr = arrStrips.slice(startIndex);

			if (tempArr.indexOf(activeStrip) > -1) switchActiveStrip(arrStrips.length - dif - 1);

			arrStrips.splice(startIndex);

			for (let i of tempArr) i.strip.parentElement.removeChild(i.strip);
		}
	});

	elFrameDelay.addEventListener("input", (_) => {
		elFrameDelay.value = constrain(elFrameDelay.value, 1, 1000);
		let delay = Math.floor(elFrameDelay.value);
	});

	let elTools = Array.from(document.getElementsByName("tool"));
	for (let i of elTools) {
		i.addEventListener("change", (e) => {
			if (e.target.checked) switchTool(tools[e.target.value]);
		});
	}

	document.addEventListener("keyup", (e) => {
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

				case "ArrowUp":
				case "ArrowDown":
					let index = arrStrips.indexOf(activeStrip);
					index += arrStrips.length + (e.key == "ArrowUp" ? -1 : 1);
					index %= arrStrips.length;

					switchActiveStrip(index);
					break;
			}

			if (next !== null) {
				document.getElementById(`tool${next}`).checked = true;
				switchTool(tools[next]);
			}
		}
	});
}

loadAndInit();
