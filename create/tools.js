function toHex(arrColor) {
	let out = [];
	for (let i of arrColor) {
		let seg = i.toString(16);

		if (seg.length == 1) seg = `0${seg}`;

		out.push(seg);
	}
	return `#${out.join("")}`;
}

function fromHex(strHex) {
	return [parseInt(strHex.substr(1, 2), 16), parseInt(strHex.substr(3, 2), 16), parseInt(strHex.substr(5, 2), 16)];
}

var container = document.getElementById("stripsContainer");

class Tool {
	constructor() {}
	setup(strip) {}
	resize(boolShrinking) {}
	cleanup() {}
	update(strip, strips) {
		this.strip = strip;
		this.strips = strips;
	}
}

class SelectionTool extends Tool {
	constructor() {
		super();
		this.el = document.getElementById("selectBox");
		this.selected = [];
		this.vecSelectS = { x: 0, y: 0 };
		this.vecSelectE = { x: 0, y: 0 };
		this.boolMouseDown = false;
		this.boolSelecting = false;

		// event handlers have to be here to be removable while preserving scope;
		this.mousedown = (e) => {
			this.vecSelectS.x = e.pageX;
			this.vecSelectS.y = e.pageY;
			this.boolMouseDown = true;

			if ((e.ctrlKey || e.altKey) && e.target.classList.contains("node")) {
				e.preventDefault();
				this.toggleNode(e.target);
			}
		};

		this.mouseup = (_) => {
			this.boolMouseDown = false;
			this.boolSelecting = false;
			this.el.style.display = "none";
		};

		this.mousemove = (e) => {
			if ((this.boolMouseDown && Math.hypot(this.vecSelectS.x - e.pageX, this.vecSelectS.y - e.pageY) > 15) || this.boolSelecting) {
				this.boolSelecting = true;
				this.el.style.display = "block";

				this.vecSelectE.x = e.pageX;
				this.vecSelectE.y = e.pageY;

				this.updateSelectionBox();
				this.updateSelectedArray();
			}
		};

		this.keyup = (e) => {
			switch (e.key) {
				case "Backspace":
					this.clearSelection();
					break;
				case "Delete":
					this.strip.fillColor("#000000");
					break;
				case "a":
					this.clearSelection();
					for (let i of this.strip.nodes) {
						i.classList.add("selectedNode");
						this.selected.push(i);
					}
					break;
			}
		};
	}

	// moves and scales selection box based on mouse position
	updateSelectionBox() {
		let width = this.vecSelectE.x - this.vecSelectS.x;
		let height = this.vecSelectE.y - this.vecSelectS.y;

		this.el.style.left = `${width < 0 ? this.vecSelectE.x : this.vecSelectS.x}px`;
		this.el.style.top = `${height < 0 ? this.vecSelectE.y : this.vecSelectS.y}px`;

		this.el.style.width = `${Math.abs(width)}px`;
		this.el.style.height = `${Math.abs(height)}px`;
	}

	addNode(elNode) {
		elNode.classList.add("selectedNode");
		if (this.selected.indexOf(elNode) == -1) {
			let nodes = this.strip.nodes;
			this.selected.push(elNode);
			this.selected.sort((a, b) => nodes.indexOf(a) - nodes.indexOf(b));
		}
	}

	removeNode(elNode) {
		elNode.classList.remove("selectedNode");
		let nodeIndex = this.selected.indexOf(elNode);
		if (nodeIndex > -1) this.selected.splice(nodeIndex, 1);
	}

	toggleNode(elNode) {
		if (elNode.classList.contains("selectedNode")) this.removeNode(elNode);
		else this.addNode(elNode);
	}

	// returns element's corners in an object as x and y pairs
	grabElementCorners(el) {
		return {
			left: el.offsetLeft + el.offsetParent.offsetLeft,
			top: el.offsetTop + el.offsetParent.offsetTop,
			right: el.offsetLeft + el.offsetWidth + el.offsetParent.offsetLeft,
			bottom: el.offsetTop + el.offsetHeight + el.offsetParent.offsetTop,

			tl: {
				x: el.offsetLeft + el.offsetParent.offsetLeft,
				y: el.offsetTop + el.offsetParent.offsetTop,
			},
			br: {
				x: el.offsetLeft + el.offsetWidth + el.offsetParent.offsetLeft,
				y: el.offsetTop + el.offsetHeight + el.offsetParent.offsetTop,
			},
		};
	}

	// checks for rectangle overlap between selectbox and node
	isNodeSelected(elNode) {
		let b = this.grabElementCorners(this.el);
		let n = this.grabElementCorners(elNode);

		return !(n.br.x < b.tl.x || b.br.x < n.tl.x || n.br.y < b.tl.y || b.br.y < n.tl.y);
	}

	// checks strip for selected nodes
	updateSelectedArray() {
		this.clearSelection();

		for (let n of this.strip.nodes) {
			if (this.isNodeSelected(n)) {
				n.classList.add("selectedNode");
				this.selected.push(n);
			}
		}
	}

	clearSelection() {
		for (let n of this.selected) n.classList.remove("selectedNode");
		this.selected = [];
	}

	setup(strip) {
		this.strip = strip;
		document.addEventListener("mousedown", this.mousedown);
		document.addEventListener("mouseup", this.mouseup);
		document.addEventListener("mousemove", this.mousemove);
		document.addEventListener("keyup", this.keyup);
	}

	resize(boolShrinking) {
		if (boolShrinking) for (let i in this.selected) if (!document.contains(this.selected[i])) this.selected.splice(i, 1);
	}

	cleanup() {
		document.removeEventListener("mousedown", this.mousedown);
		document.removeEventListener("mouseup", this.mouseup);
		document.removeEventListener("mousemove", this.mousemove);
		document.removeEventListener("keyup", this.keyup);
	}
}

class GradientTool extends Tool {
	constructor() {
		super();
		this.anchors = [];

		this.nodeListener = (e) => {
			if (e.altKey) this.removeAnchor(e.target);
			else if (e.ctrlKey) this.toggleAnchor(e.target);
			else this.addAnchor(e.target);
		};

		// creates and sets gradients between all anchor nodes
		this.updateListener = (_) => {
			let length = this.anchors.length;
			if (length >= 2) {
				for (let i = 1; i < length; i++) {
					let node1 = this.anchors[i - 1];
					let node2 = this.anchors[i];
					let baseIndex = this.selected.indexOf(node1);
					let gradient = this.createGradient(fromHex(node1.value), fromHex(node2.value), this.selected.indexOf(node2) - baseIndex - 1);

					for (let i = 0; i < gradient.length; i++) this.selected[baseIndex + i].value = toHex(gradient[i]);

					this.strip.stripModified();
				}
			}
		};
	}

	addAnchor(elNode) {
		elNode.classList.add("nodeAnchor");
		if (this.anchors.indexOf(elNode) == -1) {
			this.anchors.push(elNode);
			this.anchors.sort((a, b) => this.selected.indexOf(a) - this.selected.indexOf(b));
		}
	}

	removeAnchor(elNode) {
		elNode.classList.remove("nodeAnchor");
		let nodeIndex = this.anchors.indexOf(elNode);
		if (nodeIndex > -1) this.anchors.splice(nodeIndex, 1);
	}

	toggleAnchor(elNode) {
		if (elNode.classList.contains("nodeAnchor")) this.removeAnchor(elNode);
		else this.addAnchor(elNode);
	}

	lerp(nStart, nEnd, fPos) {
		return (1 - fPos) * nStart + fPos * nEnd;
	}

	rgbLerp(arrColor1, arrColor2, fPos) {
		return [
			Math.floor(this.lerp(arrColor1[0], arrColor2[0], fPos)),
			Math.floor(this.lerp(arrColor1[1], arrColor2[1], fPos)),
			Math.floor(this.lerp(arrColor1[2], arrColor2[2], fPos)),
		];
	}

	createGradient(arrColor1, arrColor2, numNodesBetween) {
		let total = numNodesBetween + 1;
		let out = [];

		for (let i = 0; i <= total; i++) out.push(this.rgbLerp(arrColor1, arrColor2, i / total));

		return out;
	}

	setup(strip) {
		this.strip = strip;
		this.selected = selectTool.selected;

		for (let i of this.selected) {
			i.addEventListener("mousedown", this.nodeListener);
			i.addEventListener("input", this.updateListener);
		}
	}

	resize(boolShrinking) {
		if (boolShrinking) {
			selectTool.resize(true);
			this.selected = selectTool.selected;

			for (let i in this.anchors) if (!document.contains(this.anchors[i])) this.anchors.splice(i, 1);
		}
	}

	cleanup() {
		for (let i of this.anchors) i.classList.remove("nodeAnchor");

		this.anchors = [];

		for (let i of this.selected) {
			i.removeEventListener("mousedown", this.nodeListener);
			i.removeEventListener("input", this.updateListener);
		}
	}
}

class FillTool extends Tool {
	constructor() {
		super();
		this.length = 0;

		this.nodeChange = (e) => {
			this.strip.fillColor(e.target.value);
		};
	}

	setup(strip) {
		this.strip = strip;
		this.length = this.strip.length;

		for (let i of this.strip.nodes) i.addEventListener("input", this.nodeChange);
	}

	resize(boolShrinking) {
		if (!boolShrinking) {
			for (let i = this.length; i < this.strip.length; i++) this.strip.nodes[i].addEventListener("input", this.nodeChange);
			this.length = this.strip.length;
		}
	}

	cleanup() {}
}

class RearrangeTool extends Tool {
	constructor() {
		super();

		this.onDragStart = (e) => {
			let index = Array.from(document.getElementsByClassName("strip")).indexOf(e.target);
			e.dataTransfer.setData("text/plain", `${index}`);
			e.dataTransfer.effectAllowed = "move";
		};

		this.onDragOver = (e) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
		};

		this.onDrop = (e) => {
			e.preventDefault();
			e.stopPropagation();

			let fromIndex = Number(e.dataTransfer.getData("text/plain"));
			let toIndex = Array.from(document.getElementsByClassName("strip")).indexOf(e.target);

			if (toIndex > fromIndex) {
				toIndex += 1;
				fromIndex += 1;
				for (let i = fromIndex; i < toIndex; i++) {
					let tempColors = this.strips[i].colors;
					this.strips[i].setStrip(this.strips[i - 1].colors);
					this.strips[i - 1].setStrip(tempColors);
				}
			} else {
				toIndex -= 1;
				fromIndex -= 1;
				for (let i = fromIndex; i > toIndex; i--) {
					let tempColors = this.strips[i].colors;
					this.strips[i].setStrip(this.strips[i + 1].colors);
					this.strips[i + 1].setStrip(tempColors);
				}
			}
		};
	}

	setup(strip, strips) {
		this.strip = strip;
		this.strips = Array.from(strips);

		for (let i of strips) {
			i.strip.addEventListener("dragstart", this.onDragStart);
			i.strip.addEventListener("dragover", this.onDragOver);
			i.strip.addEventListener("drop", this.onDrop);
			i.strip.draggable = true;
		}
	}

	update(strip, strips) {
		this.strip = strip;

		if (this.strips.length < strips.length) {
			for (let i = this.strips.length; i < strips.length; i++) {
				let temp = strips[i].strip;
				temp.addEventListener("dragstart", this.onDragStart);
				temp.addEventListener("dragover", this.onDragOver);
				temp.addEventListener("drop", this.onDrop);
				temp.draggable = true;
			}
		}

		this.strips = Array.from(strips);
	}

	cleanup() {
		for (let i of this.strips) {
			i.strip.removeEventListener("dragstart", this.onDragStart);
			i.strip.removeEventListener("dragover", this.onDragOver);
			i.strip.removeEventListener("drop", this.onDrop);
			i.strip.draggable = false;
		}
	}
}

let selectTool = new SelectionTool();
let gradientTool = new GradientTool();
let fillTool = new FillTool();
let rearrangeTool = new RearrangeTool();
