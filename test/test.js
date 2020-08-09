/* exported RGBStrip */
/* global RGBStrip */
let json, strip;
async function loadAndInit() {
	json = await (await fetch("../teststyle.json")).json();
	handleStyle();
}

function handleStyle() {
	try {
		let s = json[json.selected];
		strip = new RGBStrip(document.getElementsByClassName("strip")[0], s.length);

		strip.updateFrames(s.frames);
		strip.frameDelay = s.frameDelay;
		strip.startAnimation();
		
	} catch (e) {
		console.log(e);
	}
}

loadAndInit();
