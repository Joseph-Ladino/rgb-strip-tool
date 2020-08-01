/* eslint-disable no-unused-vars */
require("dotenv").config();
const disc = require("discord.js");
const client = new disc.Client();

var me;

async function fetchMe() {
    me = await client.users.fetch("694555572695072769");
	client.setInterval(_ => console.log(me.presence.status), 5000);
}


client.setTimeout(fetchMe, 5000);

client.login(process.env.rgb_sync_token);