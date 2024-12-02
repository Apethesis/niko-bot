require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const { Streamer, streamLivestreamVideo } = require('@dank074/discord-video-stream')
const { spawn } = require('child_process');
const process = require('node:process')
const fs = require('fs');
const path = require('node:path');
const client = new Client();
const streamer = new Streamer(client)
let streamercon
let volume = 0.5
let currentpos = 0
let song
let vid
let playlist = []
let quitit = false
const auth = {
    channel: [
        '662095345366335518',
        '949506704926728202'
    ],
    user: [
        '939920548484497451',
        '1168868176189198418',
        '665113328577806336',
        '825476927284445254',
        '591647452247883806',
        '476057232186933274'
    ]
}
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
    console.log(playlist[currentpos])
    song = client.voice.connection.playAudio(playlist[currentpos], { volume: volume })
    client.user.setPresence({ activities: [{ name: path.basename(playlist[currentpos]), type: 'PLAYING' }]})
    currentpos = currentpos + 1;
    if (currentpos > playlist.length) {
        shuffle()
    }
    if (!quitit) {
        song.on('speaking', (which) => {
            if (which == false) {
                playnew()
            }
        })
    }
}
shuffle()
client.once('ready', (cl) => {
    cl.voice.joinChannel('616089055532417044').then((con) => {
        song = con.playAudio(playlist[0], { volume: volume })
        client.user.setPresence({ activities: [{ name: path.basename(playlist[0]), type: 'PLAYING' }]})
        currentpos = currentpos + 1
        if (!quitit) {
            song.on('speaking', (which) => {
                if (which == false && !quitit) {
                    playnew()
                }
            })
        }
    })
})
client.on('messageCreate', (msg) => {
    if (auth.user.includes(msg.author.id) && auth.channel.includes(msg.channel.id)) {
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
        } else if (msg.content == ">pause") {
            quitit = true
            song.pause()
            msg.reply('This song will not continue the playlist after it.')
        } else if (msg.content == ">resume") {
            quitit = false
            playnew()
            msg.reply('Resumed.')
        } else if (msg.content.startsWith(">playvideo")) {
            if (!quitit) {
                msg.reply('This feature requires the playlist to be paused.')
            } else {
                try {
                    if (client.voice.connection) { client.voice.connection.disconnect(); }
                    streamer.joinVoice('616089055532417036','616089055532417044').then((rudp) => {
                        streamercon = rudp
                        streamer.createStream({ width: 1920, height: 1080, bitrateKbps: 4000, maxBitrateKbps: 4000, videoCodec: "H264", h26xPreset: 'veryfast' }).then((udp) => {
                            udp.mediaConnection.setSpeaking(true)
                            udp.mediaConnection.setVideoStatus(true)
                            streamLivestreamVideo(msg.content.substring(11),udp,true).then(() => {
                                udp.mediaConnection.setSpeaking(false)
                                udp.mediaConnection.setVideoStatus(false)
                                streamer.leaveVoice()
                                msg.channel.send('Left voice channel due to end of video, use >connect to add me back.')
                            })
                        })
                    })
                    msg.reply("Attempted to play video, please wait...")
                } catch (error) {
                    msg.channel.send('Errored! Potentially an invalid link? (CHECK LOGS)')
                    console.log(error)
                }
            }
        } else if (msg.content == '>connect') {
            client.voice.joinChannel('616089055532417044')
            msg.reply('Reconnected to channel.')
        } else if (msg.content == ">killvideo") {
            streamer.stopStream()
            streamer.leaveVoice()
            msg.reply('Left voice channel due to killvideo command, use >connect to add me back.')
        } else if (msg.content == '>kill' && msg.author.id == '1168868176189198418') {
            msg.reply("Killing process, goodbye! (temporarily)").then(() => {
                process.exit()
            })
        } else if (msg.content == '>queue') {
            let ostr = "Current queue:\n"
            let incr = 1
            let vincr = 1
            for (const song in playlist) {
                if (incr < currentpos) {
                    incr = incr + 1
                } else if (vincr <= 10) {
                    ostr = ostr+`${vincr}. ${path.basename(playlist[song])}\n`
                    incr = incr + 1
                    vincr = vincr + 1
                }
            }
            msg.reply(ostr)
        } else if (msg.content.startsWith('>volume')) {
            const volu = Number(msg.content.substring(8))
            song.setVolume(volu)
            volume = volu
            msg.reply(`Set volume to ${volu}.`)
        }
    }
})
client.login(process.env.DTOK)