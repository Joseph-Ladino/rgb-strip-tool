/* eslint-disable no-unused-vars */
let json, RGBStrip, strip;
async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();
	RGBStrip = (await import("../strip.js")).RGBStrip;
	handleStyle();
}

function handleStyle() {
	try {
		let s = json[json.selected];
		strip = new RGBStrip(
			document.getElementsByClassName("strip")[0],
			s.length
		);

		if (s.animated) {
			strip.updateFrames(s.frames);
			strip.frameDelay = s.frameDelay;
			strip.startAnimation();
		} else {
			if (s.fill) strip.fillColor(s.colors[0]);
			else strip.setStrip(s.colors);
		}
	} catch (e) {
		console.log(e);
	}
}

loadAndInit();
