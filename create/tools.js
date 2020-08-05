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
	return [
		parseInt(strHex.substr(1, 2), 16),
		parseInt(strHex.substr(3, 2), 16),
		parseInt(strHex.substr(5, 2), 16),
	];
}

class Tool {
	constructor() {}
	setup() {}
	cleanup() {}
}

class SelectionTool extends Tool {
	constructor() {
		super();
		this.el = document.getElementById("selectBox");
		this.selectedNodes = [];
		this.vecSelectS = { x: 0, y: 0 };
		this.vecSelectE = { x: 0, y: 0 };
		this.boolMouseDown = false;

		// event handlers have to be here to be removable while preserving scope;
		this.mousedown = (e) => {
			this.vecSelectS.x = e.pageX;
			this.vecSelectS.y = e.pageY;
			this.boolMouseDown = true;
		};

		this.mouseup = (_) => {
			this.boolMouseDown = false;
			this.el.style.display = "none";
		};

		this.mousemove = (e) => {
			if (this.boolMouseDown) {
				this.el.style.display = "block";

				this.vecSelectE.x = e.pageX;
				this.vecSelectE.y = e.pageY;

				this.updateSelectionBox();
				this.updateSelectedArray(this.strips[0]);
			}
		};
	}

	// moves and scales selection box based on mouse position
	updateSelectionBox() {
		let width = this.vecSelectE.x - this.vecSelectS.x;
		let height = this.vecSelectE.y - this.vecSelectS.y;

		this.el.style.left = `${
			width < 0 ? this.vecSelectE.x : this.vecSelectS.x
		}px`;

		this.el.style.top = `${
			height < 0 ? this.vecSelectE.y : this.vecSelectS.y
		}px`;

		this.el.style.width = `${Math.abs(width)}px`;
		this.el.style.height = `${Math.abs(height)}px`;
	}

	// returns element's corners in an object as x and y pairs
	grabElementCorners(el) {
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

	// checks for rectangle overlap between select box and node
	isNodeSelected(elNode) {
		let b = this.grabElementCorners(this.el);
		let n = this.grabElementCorners(elNode);

		return !(
			n.br.x < b.tl.x ||
			b.br.x < n.tl.x ||
			n.br.y < b.tl.y ||
			b.br.y < n.tl.y
		);
	}

	// checks strip for selected nodes
	updateSelectedArray(strip) {
		for (let n of this.selectedNodes) n.classList.remove("selectedNode");

		let temp = [];
		let nodes = strip.nodes;

		for (let n of nodes) {
			if (this.isNodeSelected(n)) {
				n.classList.add("selectedNode");
				temp.push(n);
			}
		}

		this.selectedNodes = temp;
	}

	setup(arrStrips) {
		this.strips = arrStrips;
		document.addEventListener("mousedown", this.mousedown);
		document.addEventListener("mouseup", this.mouseup);
		document.addEventListener("mousemove", this.mousemove);
	}

	cleanup() {
		document.removeEventListener("mousedown", this.mousedown);
		document.removeEventListener("mouseup", this.mouseup);
		document.removeEventListener("mousemove", this.mousemove);
	}
}

class GradientTool extends Tool {
	constructor() {
		super();
		this.anchors = [];

		this.nodeListener = (e) => {
			if (this.anchors.indexOf(e.target) == -1) {
				this.anchors.push(e.target);
				this.anchors.sort(
					(a, b) =>
						this.selected.indexOf(a) - this.selected.indexOf(b)
				);
			}
		};

		this.updateListener = (e) => {
			let length = this.anchors.length;
			if (length >= 2) {
				for (let i = 1; i < length; i++) {
					let node1 = this.anchors[i - 1];
					let node2 = this.anchors[i];
					let baseIndex = this.selected.indexOf(node1);
					let gradient = this.createGradient(
						fromHex(node1.value),
						fromHex(node2.value),
						this.selected.indexOf(node2) - baseIndex - 1
					);

					for (let i = 0; i < gradient.length; i++)
						this.selected[baseIndex + i].value = toHex(gradient[i]);
				}
			}
		};
	}

	lerp(nStart, nEnd, fPos) {
		return (1 - fPos) * nStart + fPos * nEnd;
	}

	rgbLerp(arrColor1, arrColor2, fPos) {
		return [
			Math.round(this.lerp(arrColor1[0], arrColor2[0], fPos)),
			Math.round(this.lerp(arrColor1[1], arrColor2[1], fPos)),
			Math.round(this.lerp(arrColor1[2], arrColor2[2], fPos)),
		];
	}

	createGradient(arrColor1, arrColor2, numNodesBetween) {
		let total = numNodesBetween + 1;
		let out = [];

		for (let i = 0; i <= total; i++)
			out.push(this.rgbLerp(arrColor1, arrColor2, i / total));

		return out;
	}

	setup(arrStrips) {
		this.strips = arrStrips;
		this.selected = selectTool.selectedNodes;

		for (let i of this.selected) {
			i.addEventListener("mousedown", this.nodeListener);
			i.addEventListener("input", this.updateListener);
		}
	}

	cleanup() {
		this.anchors = [];

		for (let i of this.selected) {
			i.removeEventListener("mousedown", this.nodeListener);
			i.removeEventListener("input", this.updateListener);
		}
	}
}

let selectTool = new SelectionTool();
let gradientTool = new GradientTool();
