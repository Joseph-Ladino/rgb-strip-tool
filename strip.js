/* eslint-disable no-unused-vars */

class RGBStrip {
	constructor(elStrip, numInitialLength = 0) {
		this.strip = elStrip;
		this.animated = false;
		this.frames = [];
		this.frameDelay = 250;

		this.frameHandle = 0;
		this.frameIndex = 0;

		this.resize(numInitialLength);
	}

	get nodes() {
		return Array.from(this.strip.children);
	}

	get length() {
		return this.strip.children.length;
	}

	get colors() {
		let nodes = this.nodes;
		return nodes.reduce((acc, val) => acc.concat([val.value]), []);
	}

	fillColor(arrColor) {
		let nodes = this.nodes;

		for (let node of nodes) node.value = arrColor;
	}

	setNode(numNode, arrColor) {
		this.nodes[numNode].value = arrColor;
	}

	setStrip(arrColors) {
		let nodes = this.nodes;

		if (arrColors.length != this.length) {
			console.log("lengths do not match, aborting");
			return;
		}

		for (let i in nodes) nodes[i].value = arrColors[i];
	}

	resize(numLength) {
		let curLength = this.length;
		let add = numLength > curLength;
		let dif = Math.abs(numLength - curLength);

		for (let i = 0; i < dif; i++) {
			if (add) {
				let node = document.createElement("input");
				node.type = "color";
				node.className = "node";
				this.strip.appendChild(node);
			} else {
				let node = this.strip.children[this.length - 1];
				this.strip.removeChild(node);
			}
		}

		if (this.animated && curLength != numLength) {
			let temp = new Array(dif).fill("#000000");
			let frames = this.frames;

			frames = add
				? frames.map((val) => val.concat(temp))
				: frames.map((val) => val.slice(0, numLength));

			this.updateFrames(frames);
		}
	}

	// creates a cycle of frames from one frame, e.g. RGB -> RGB, GBR, BRG
	lazyAnimate(arrFrame, numDelay) {
		this.animated = true;

		let frames = [];
		let length = arrFrame.length;
		let temp = arrFrame;

		for (let i = 0; i < length; i++) {
			temp.unshift(temp.pop());
			frames.push(Array.from(temp));
		}

		this.updateFrames(frames);
		this.frameDelay = numDelay;
	}

	updateFrames(arrFrames) {
		this.frameIndex = 0;
		this.frames = arrFrames;
	}

	startAnimation() {
		this.setStrip(this.frames[0]);
		this.frameIndex = 1;
		this.frameHandle = setInterval(
			(_) => this.nextFrame(),
			this.frameDelay
		);
	}

	stopAnimation() {
		clearInterval(this.frameHandle);
		this.frameIndex = 0;
	}

	nextFrame() {
		this.frameIndex += 1;
		this.frameIndex %= this.frames.length;
		this.setStrip(this.frames[this.frameIndex]);
	}

	toJSON() {
		let tempObj = {
			length: this.length,
			colors: this.colors,
			animate: this.animated,
			frames: this.frames,
			frameDelay: this.frameDelay,
		};

		return JSON.stringify(tempObj, false, 4);
	}
}

// export { RGBStrip };
