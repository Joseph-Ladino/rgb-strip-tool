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
		strip = new RGBStrip(document.getElementsByClassName("strip")[0], s.length, s.colors, s.fill, s.animate, s.frames, s.frameDelay);
		
	} catch (e) {
		console.log(e);
	}
}

loadAndInit();