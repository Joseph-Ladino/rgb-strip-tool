class RGBStrip {
	constructor(elStrip, numInitialLength = 0) {
		this.strip = elStrip;
		this.animated = false;
		this.disabled = false;
		this.frames = [];
		this.frameDelay = 250;
		this.frameHandle = 0;
		this.frameIndex = 0;
		this.resize(numInitialLength);
	}

	get nodes() {
		return Array.from(this.strip.getElementsByClassName("node"));
	}

	get length() {
		return this.strip.getElementsByClassName("node").length;
	}

	get colors() {
		return this.nodes.reduce((acc, val) => acc.concat([val.value]), []);
	}

	stripModified() {
		if (!this.strip.disabled) {
			let event = new CustomEvent("stripModified", { detail: { strip: this } });
			document.dispatchEvent(event);
		}
	}

	toggleDisabled() {
		if (this.disabled) {
			this.strip.removeChild(this.strip.querySelector(".disabledShield"));
		} else {
			let temp = document.createElement("div");
			temp.classList.add("disabledShield");
			this.strip.prepend(temp);
		}
		this.disabled = !this.disabled;
	}

	fillColor(arrColor) {
		for (let node of this.nodes) node.value = arrColor;
		this.stripModified();
	}

	setNode(numNode, strColor) {
		this.nodes[numNode].value = strColor;
		this.stripModified();
	}

	setStrip(arrColors) {
		if (arrColors.length != this.length) {
			console.log(arrColors, this.length);
			console.log("lengths do not match, aborting");
			return;
		}

		for (let i in this.nodes) this.nodes[i].value = arrColors[i];
		this.stripModified();
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
				node.addEventListener("input", (_) => this.stripModified());
				this.strip.appendChild(node);
			} else {
				let node = this.strip.children[this.length - 1];
				this.strip.removeChild(node);
			}
		}

		if (curLength != numLength) {
			let temp = new Array(dif).fill("#000000");
			let frames = this.frames;

			frames = add ? frames.map((val) => val.concat(temp)) : frames.map((val) => val.slice(0, numLength));

			this.updateFrames(frames);
		}

		this.stripModified();
	}

	cycleFrame(arrFrame, boolClockwise = true) {
		let temp = Array.from(arrFrame);

		if (boolClockwise) temp.unshift(temp.pop());
		else temp.push(temp.shift());
		return Array.from(temp);
	}

	// creates a cycle of frames from one frame, e.g. RGB -> RGB, GBR, BRG
	lazyAnimate(arrFrame, numDelay) {
		let frames = [];
		let length = arrFrame.length;
		let temp = Array.from(arrFrame);

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
		this.frameHandle = setInterval((_) => this.nextFrame(), this.frameDelay);
	}

	stopAnimation() {
		clearInterval(this.frameHandle);
		this.frameIndex = 0;
	}

	pauseAnimation() {
		clearInterval(this.frameHandle);
	}

	resumeAnimation() {
		this.frameHandle = setInterval((_) => this.nextFrame(), this.frameDelay);
	}

	nextFrame() {
		this.frameIndex += 1;
		this.frameIndex %= this.frames.length;
		this.setStrip(this.frames[this.frameIndex]);
	}

	toJSON() {
		let tempObj = {
			length: this.length,
			frames: this.frames,
			frameDelay: this.frameDelay,
			frameCount: this.frames.length,
		};

		return JSON.stringify(tempObj, false, 4);
	}
}

// export { RGBStrip };
