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
        console.log("constructed");
    }

    setup() {
        console.log("set up")
    }

    cleanup() {
        console.log("clean up")
    }
}

let selectTool = new SelectionTool();
let gradientTool = new GradientTool();