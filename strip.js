/* eslint-disable no-unused-vars */

class RGBStrip {
	constructor(
		elStrip,
		numInitialLength = 0,
		arrColors = [],
		boolFill = false,
		boolAnimated = false,
		arrFrames = [],
		numFrameDelay = 50
	) {
		this.strip = elStrip;
		this.animated = boolAnimated;
		this.frames = arrFrames;
		this.frameDelay = numFrameDelay;

		this.frameHandle = 0;
		this.frameIndex = 0;

		this.resize(numInitialLength);

		if (arrColors.length > 0)
			if (boolFill) this.fillColor(arrColors[0]);
			else this.setStrip(arrColors);
		else if (this.animated) this.startAnimation();
	}

	get nodes() {
		return Array.from(this.strip.children);
	}

	get length() {
		return this.strip.children.length;
	}

	get colors() {
		let nodes = this.nodes;
		return nodes.reduce(
			(acc, val) => acc.concat([this.fromHex(val.value)]),
			[]
		);
	}

	toHex(arrColor) {
		let out = [];
		for (let i of arrColor) {
			let seg = i.toString(16);

			if (seg.length == 1) seg = `0${seg}`;

			out.push(seg);
		}
		return `#${out.join("")}`;
	}

	fromHex(strHex) {
		return [
			parseInt(strHex.substr(1, 2), 16),
			parseInt(strHex.substr(3, 2), 16),
			parseInt(strHex.substr(5, 2), 16),
		];
	}

	fillColor(arrColor) {
		let nodes = this.nodes;

		for (let node of nodes) node.value = this.toHex(arrColor);
	}

	setNode(numNode, arrColor) {
		this.nodes[numNode].value = this.toHex(arrColor);
	}

	setStrip(arrColors) {
		let nodes = this.nodes;

		if (arrColors.length != this.length) {
			console.log("lengths do not match, aborting");
			return;
		}

		for (let i in nodes) nodes[i].value = this.toHex(arrColors[i]);
	}

	resize(numLength) {
		if(numLength < 1){
			console.log("can't resize to less than 1 node");	
			return;
		}

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
			let temp = new Array(dif).fill([0, 0, 0]);
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

export { RGBStrip };
