/* eslint-disable no-unused-vars */

// global vars
var json;
var arrStrips = [];
var tools = [selectTool, gradientTool];
var activeTool = selectTool;

// global elements
const elLength = document.getElementById("stripLength");
const elLengthNum = document.getElementById("stripLengthNum");

function switchTool(newTool) {
	activeTool.cleanup();
	activeTool = newTool;
	activeTool.setup(arrStrips);
}

function lerp(nStart, nEnd, fPos) {
	return (1 - fPos) * nStart + fPos * nEnd;
}

function rgbLerp(arrColor1, arrColor2, fPos) {
	return [
		Math.round(lerp(arrColor1[0], arrColor2[0], fPos)),
		Math.round(lerp(arrColor1[1], arrColor2[1], fPos)),
		Math.round(lerp(arrColor1[2], arrColor2[2], fPos)),
	];
}

function createGradient(arrColor1, arrColor2, numNodesBetween) {
	let total = numNodesBetween + 1;
	let out = [];

	for (let i = 0; i <= total; i++)
		out.push(rgbLerp(arrColor1, arrColor2, i / total));

	return out;
}

async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();

	arrStrips.push(
		new RGBStrip(
			document.getElementsByClassName("strip")[0],
			elLength.value
		)
	);

	activeTool.setup(arrStrips);

	elLength.addEventListener("input", (_) => {
		elLengthNum.value = elLength.value;
		for (let strip of arrStrips) strip.resize(elLength.value);
	});

	elLengthNum.addEventListener("input", (_) => {
		if (elLengthNum.value < 1) elLengthNum.value = 1;
		else if (elLengthNum.value > 148) elLengthNum.value = 148;

		elLength.value = elLengthNum.value;

		for (let strip of arrStrips) strip.resize(elLengthNum.value);
	});

	let elTools = Array.from(document.getElementsByName("tool"));
	for (let i of elTools) {
		i.addEventListener("change", (e) => {
			if (e.target.checked) switchTool(tools[e.target.value]);
		});
	}

	document.addEventListener("keyup", e => {
		let next = null;
		switch(e.key) {
			case '1':
			case 's':
				next = 0;
				break;

			case '2':
			case 'g':
				next = 1;
				break;
		};

		if(next !== null) {
			document.getElementById(`tool${next}`).checked = true;
			switchTool(tools[next]);
		}
	});
}

loadAndInit();
