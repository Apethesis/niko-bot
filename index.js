require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('node:path');
const client = new Client();
let currentpos = 0
let song
let playlist = []
function readfiles() {
    const playfiles = fs.readdirSync(path.join(__dirname,'playlist'))
    playlist = []
    for (const file of playfiles) {
        playlist[currentpos] = path.join(path.join(__dirname,'playlist'),file)
        currentpos = currentpos + 1;
    }
    currentpos = 0
}
readfiles()
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
client.once('ready', (cl) => {
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
client.on('messageCreate', (msg) => {
    if (msg.author.id == '939920548484497451' || msg.author.id == '1168868176189198418' || msg.author.id == '665113328577806336' || msg.author.id == '825476927284445254' || msg.author.id == '591647452247883806') {
        if (msg.content == '>skipsong') {
            song.pause()
            msg.reply('Skipped song.')
        } else if (msg.content == '>refreshlist') {
            readfiles()
            msg.reply('Refreshed file list.')
        } else if (msg.content == '>shuffle') {
            shuffle()
            song.pause()
            msg.reply('Shuffled list and skipped current song.')
        } else if (msg.content == '>restartsong') {
            currentpos--
            song.pause()
            msg.reply('Restarted current song.')
        } else if (msg.content == '>gitrefresh') {
            const git = spawn('git', ['pull'])
            git.on('close', (code) => {
                readfiles()
                msg.reply('Pulled from github and read new files. Consider shuffling.')
            })
        }
    }
})
client.login(process.env.DTOK)