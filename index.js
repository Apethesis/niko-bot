require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('node:path');
const client = new Client();
const playlist = []
const playfiles = fs.readdirSync(path.join(__dirname,'playlist'))
let currentpos = 0
let song
for (const file of playfiles) {
    playlist[currentpos] = path.join(path.join(__dirname,'playlist'),file)
    currentpos = currentpos + 1;
}
currentpos = 0
function oshuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }
function shuffle() {
    currentpos = 0;
    oshuffle(playlist)
}
function playnew() {
    song = client.voice.connection.playAudio(playlist[currentpos], { volume: 0.25 })
    client.user.setPresence({ activities: [{ name: path.basename(playlist[currentpos]), type: 'PLAYING' }]})
    currentpos = currentpos + 1;
    if (currentpos > playlist.length) {
        shuffle()
    }
    song.on('speaking', (which) => {
        if (which == false) {
            playnew()
        }
    })
}
shuffle()
client.on('ready', (cl) => {
    cl.voice.joinChannel('616089055532417044').then((con) => {
        song = con.playAudio(playlist[0], { volume: 0.25 })
        client.user.setPresence({ activities: [{ name: path.basename(playlist[0]), type: 'PLAYING' }]})
        currentpos = currentpos + 1
        song.on('speaking', (which) => {
            if (which == false) {
                playnew()
            }
        })
    })
})
client.login(process.env.DTOK)