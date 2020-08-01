/* eslint-disable no-unused-vars */

// global vars
var json,
	RGBStrip,
	strips = [];

// global elements
const elLength = document.getElementById("stripLength");
const elLengthNum = document.getElementById("stripLengthNum");
const elSelectBox = document.getElementById("selectBox");

// select tool vars
var vecSelectS = { x: 0, y: 0 };
var vecSelectE = { x: 0, y: 0 };
var arrSelectedNodes = [];
var boolMouseDown = false;
var boolSelecting = false;

// moves and scales selection box based on mouse position
function updateSelectionBox() {
	let width = vecSelectE.x - vecSelectS.x;
	let height = vecSelectE.y - vecSelectS.y;

	elSelectBox.style.left = `${width < 0 ? vecSelectE.x : vecSelectS.x}px`;
	elSelectBox.style.top = `${height < 0 ? vecSelectE.y : vecSelectS.y}px`;
	elSelectBox.style.width = `${Math.abs(vecSelectE.x - vecSelectS.x)}px`;
	elSelectBox.style.height = `${Math.abs(vecSelectE.y - vecSelectS.y)}px`;
}

// returns element's corners in an object as x and y pairs
function grabElementCorners(el) {
	return {
		tl: {
			x: el.offsetLeft,
			y: el.offsetTop,
		},
		tr: {
			x: el.offsetLeft + el.offsetWidth,
			y: el.offsetTop,
		},
		br: {
			x: el.offsetLeft + el.offsetWidth,
			y: el.offsetTop + el.offsetHeight,
		},
		bl: {
			x: el.offsetLeft,
			y: el.offsetTop + el.offsetHeight,
		},
	};
}

function isNodeSelected(elNode) {
	let b = grabElementCorners(elSelectBox);
	let n = grabElementCorners(elNode);

	return !(
		n.br.x < b.tl.x ||
		b.br.x < n.tl.x ||
		n.br.y < b.tl.y ||
		b.br.y < n.tl.y
	);
}

// checks strip for selected nodes
function updateSelectedArray(strip) {
	for (let n of arrSelectedNodes) n.classList.remove("selectedNode");

	let temp = [];
	let nodes = strip.nodes;

	for (let n of nodes) {
		if (isNodeSelected(n)) {
			n.classList.add("selectedNode");
			temp.push(n);
		}
	}

	arrSelectedNodes = temp;
}

async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();
	RGBStrip = (await import("../strip.js")).RGBStrip;

	strips.push(
		new RGBStrip(
			document.getElementsByClassName("strip")[0],
			elLength.value
		)
	);

	elLength.addEventListener("input", (_) => {
		elLengthNum.value = elLength.value;
		for (let strip of strips) strip.resize(elLength.value);
	});

	elLengthNum.addEventListener("input", (_) => {
		if (elLengthNum.value < 1) elLengthNum.value = 1;
		else if (elLengthNum.value > 148) elLengthNum.value = 148;

		elLength.value = elLengthNum.value;

		for (let strip of strips) strip.resize(elLengthNum.value);
	});

	document.addEventListener("mousedown", (e) => {
		vecSelectS.x = e.pageX;
		vecSelectS.y = e.pageY;
		boolMouseDown = true;
	});

	document.addEventListener("mouseup", (_) => {
		boolMouseDown = false;
		boolSelecting = false;
		elSelectBox.style.display = "none";
	});
	
	document.addEventListener("mousemove", (e) => {
		if (boolMouseDown) {
			boolSelecting = true;
			
			elSelectBox.style.display = "block";
			vecSelectE.x = e.pageX;
			vecSelectE.y = e.pageY;
			updateSelectionBox();
			updateSelectedArray(strips[0]);
		}
	});
}

loadAndInit();
