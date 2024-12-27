require('dotenv').config();
const { Client, MessageEmbed } = require('discord.js-selfbot-v13');
const { Streamer, streamLivestreamVideo } = require('@dank074/discord-video-stream')
const { spawn } = require('child_process');
const { open } = require('node:fs/promises');
const YTDlpWrap = require('yt-dlp-wrap').default;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
const ytDlpWrap = new YTDlpWrap('yt-dlp');
const { createReadableStreamFromReadable } = require('@remix-run/node');
const stream = require('stream')
const process = require('node:process')
const fs = require('fs');
const path = require('node:path');
const client = new Client();
const streamer = new Streamer(client)
// const partjson = JSON.parse(fs.readFileSync("partdata.json"))
let streamercon
let volume = 0.5
let currentpos = 0
let stats = { guild: '1060949240546857000', channel: '1317254569314484315', res: [1280,720], bitrate: 2000 }
let song
let vid
let playlist = []
let quitit = false
let queueing = false 
let loop = false
let type = "webm"
let queue = []
const auth = {
    channel: [
        '662095345366335518',
        '949506704926728202',
        '616089055532417044',
        '1188519853221478460',
        '1195908724456444037',
	'1176719479158341633'
    ],
    user: [
        '939920548484497451',
        '1168868176189198418',
        '665113328577806336',
        '825476927284445254',
        '604725422017740803',
        '882086491105419285',
        '476057232186933274',
        '887112909782671380',
        '554717539935060028'
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
    if (client && client.voice && client.voice.connection && client.voice.connection.playAudio) {
        playnew()
    }
}
function convert(file,to,msg) {
    console.log(file,to)
    const ffmpeg = spawn('ffmpeg', ["-i",file,'-vcodec','libx264',to])
    msg.channel.send('Converting video, this may take a while.')
    ffmpeg.on('error', (err) => {
        console.log(err)
        msg.channel.send('Failed to convert video to webm. (CHECK LOGS)')
    })
    ffmpeg.stdout.on('data', (data) => {
        console.log(data.toString())
    });
    ffmpeg.stderr.on('data', (data) => {
        console.log(data.toString()) 
    });
    return ffmpeg
}
function ytdlp(link, msg) {
    fs.rm(path.join(__dirname,'ytdltemp.webm'), (err) => {
        console.log(err);
    })
    fs.rm(path.join(__dirname,'ytdltemp.webm.mp4'), (err) => {
        console.log(err);
    })
    const ytdlp = spawn('yt-dlp', ['-S','vcodec:h264','-f','bestvideo[height<=720][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]',link,'-o',path.join(__dirname,'ytdltemp.webm')])
    ytdlp.on('error', (err) => {
        console.log(err)
        msg.channel.send('Failed to download video. (CHECK LOGS)')
    });
    ytdlp.stdout.on('data', (data) => {
        if (data.includes('mp4')) { type = "webm.mp4" }
        console.log(data.toString())
    });
    ytdlp.stderr.on('data', (data) => {
        if (data.includes('mp4')) { type = "webm.mp4" }
        console.log(data.toString()) 
    });
    return ytdlp
}
function playnew() {
    console.log(currentpos)
    if (currentpos < playlist.length) {
        song = client.voice.connection.playAudio(playlist[currentpos], { volume: volume })
        client.user.setPresence({ activities: [{ name: path.basename(playlist[currentpos]), type: 'PLAYING' }]})
    }
    currentpos = currentpos + 1;
    if (currentpos > playlist.length) {
        shuffle()
    }
    if (!quitit) {
        song.on('speaking', (which) => {
            if (loop && !which && !quitit) {
                currentpos = currentpos - 1
                playnew()
            } else if (which == false && !quitit) {
                playnew()
            }
        })
    }
}
shuffle()
const rdata = JSON.parse(fs.readFileSync(path.join(__dirname,'niko_relations.json')))
const outputobj = []
for (const dat in rdata) {
    outputobj.push({ "role": "user", "content": rdata[dat].question })
    outputobj.push({ "role": "assistant", "content": rdata[dat].response })
}
fs.writeFileSync(path.join(__dirname,'finedata.json'),JSON.stringify(outputobj))
client.once('ready', (cl) => {
    cl.voice.joinChannel(stats.channel).then((con) => {
        song = con.playAudio(playlist[0], { volume: volume })
        client.user.setPresence({ activities: [{ name: path.basename(playlist[0]), type: 'PLAYING' }]})
        currentpos = currentpos + 1
        if (!quitit) {
            song.on('speaking', (which) => {
                if (loop && !which && !quitit) {
                    currentpos = currentpos - 1
                    playnew()
                } else if (which == false && !quitit) {
                    playnew()
                }
            })
        }
    })
})
client.on('messageCreate', (msg) => {
    if (auth.user.includes(msg.author.id) && auth.channel.includes(msg.channel.id)) {
        if (msg.content.startsWith('>skipsong')) {
            const smsg = msg.content.split(" ")
            let skipby = 0
            if (smsg[1]) {
                skipby = Number(smsg[1])
            }
            if (!isNaN(skipby) && isFinite(skipby)) { skipby = clamp(skipby,-2,30); skipby = Math.round(skipby) }
            if (!isNaN(skipby) && isFinite(skipby) && !isNaN(currentpos) && isFinite(currentpos)) { currentpos = currentpos + skipby }
            if (currentpos > playlist.length || currentpos < 0) { shuffle();  }
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
            } else if (queueing) {
                msg.reply('This command is disabled while stream queueing is active, use >add instead.')
            } else {
                try {
                    let output = path.join(__dirname,"ytdltemp."+type)
                    if (client.voice.connection) { client.voice.connection.disconnect(); }
                    streamer.joinVoice(stats.guild,stats.channel).then((rudp) => {
                        streamercon = rudp
                        let yt = false
                        function stram(output) {
                            console.log('hello?')
                            console.log(output)
                            streamer.createStream({ hardwareAcceleratedDecoding: true, width: stats.res[0], height: stats.res[1], bitrateKbps: stats.bitrate, videoCodec: "H264", h26xPreset: 'ultrafast', audioBitrate: stats.audioBitrate }).then((udp) => {
                                console.log('are you still there?')
                                udp.mediaConnection.setSpeaking(true)
                                udp.mediaConnection.setVideoStatus(true)
                                streamLivestreamVideo(output,udp,true).then(() => {
                                    if (yt) {
                                        fs.rm(path.join(__dirname,'ytdltemp.'+type), (err) => {
                                            console.log(err);
                                        })
                                        type = "webm"
                                    }
                                    if (queue[0]) {
                                        if (!queueing) {
                                            queueing = true
                                            msg.channel.send("Stream queue is now active.")
                                        }
                                        const qu = queue.reverse()
                                        setTimeout(() => {
                                            stram(qu.pop(),udp)
                                            queue = qu.reverse()
                                        },2000)
                                    } else {
                                        queueing = false
                                        msg.channel.send('Left voice channel due to end of video, use >connect to add me back.')
                                    }
                                }).catch((reson) => {
                                    console.log(reson)
                                })
                            })
                        }
                        if (msg.content.substring(11).includes('youtube') || msg.content.substring(11).includes('youtu.be')) {
                            msg.channel.send('Attempting to download video...'); yt = true
                            const ytdlpd = ytdlp(msg.content.substring(18),msg)
                            ytdlpd.on('exit', () => {
                                console.log(type); console.log(output)
                                if (type == "webm.mp4") {
                                    fs.cp(path.join(__dirname,'ytdltemp.'+type),path.join(__dirname,'ytdltemp.mp4'), (err) => {
                                        console.log(err)
                                        fs.rm(path.join(__dirname,'ytdltemp.'+type), (err) => {
                                            console.log(err);
                                        })
                                        type = "mp4"
                                        output = path.join(__dirname,'ytdltemp.'+type); console.log(output, path.join(__dirname,'ytdltemp.'+type))
                                        stram(output,rudp)
                                        /*convert(path.join(__dirname,'ytdltemp.'+type),path.join(__dirname,'ytdltemp.webm'),msg).on('exit', () => {
                                            fs.rm(path.join(__dirname,'ytdltemp.'+type), (err) => {
                                                console.log(err);
                                            })
                                            type = 'webm'; output = path.join(__dirname,'ytdltemp.'+type)
                                            stram(output,rudp)
                                        })*/
                                    })
                                } else {
                                    console.log(output)
                                    stram(output,rudp)
                                }
                            })
                        } else {
                            output = msg.content.substring(11)
                            stram(output,rudp)
                        }
                    })
                } catch (e) {
                    console.log(e)
                }
                msg.reply("Attempted to play video, please wait...")
            }
        } else if (msg.content == '>connect') {
            client.voice.joinChannel(stats.channel)
            msg.reply('Reconnected to channel.')
        } else if (msg.content == ">killvideo") {
            streamer.stopStream()
            streamer.leaveVoice()
            msg.reply('Left voice channel due to killvideo command, use >connect to add me back.')
        } else if (msg.content == '>kill' && msg.author.id == '1168868176189198418') {
            msg.reply("Killing process, goodbye! (temporarily)").then(() => {
                process.exit()
            })
        } else if (msg.content.startsWith('>queue') && !msg.content.startsWith('>queuelength')) {
            let ostr = "Current queue:\n"
            const args = msg.content.split(' ')
            let incr = 1
            let vincr = 1
            let limit = 10
            if (args[1]) {
                limit = Number(args[1])
                if (isFinite(limit) && !isNaN(limit)) {
                    limit = clamp(limit,1,30)
                } else {
                    msg.reply('Invalid number.')
                }
            }
            for (const song in playlist) {
                if (incr < currentpos) {
                    incr = incr + 1
                } else if (vincr <= limit) {
                    ostr = ostr+`${vincr}. ${path.basename(playlist[song])}\n`
                    incr = incr + 1
                    vincr = vincr + 1
                }
            }
            msg.reply(ostr)
        } else if (msg.content.startsWith('>volume')) {
            let volu = Number(msg.content.substring(8))
            if (isFinite(volu) && !isNaN(volu)) { 
                volu = clamp(volu,0,2)
                song.setVolume(volu)
                volume = volu
                msg.reply(`Set volume to ${volu}.`)
            } else {
                msg.reply('Invalid number.')
            }
        } else if (msg.content.startsWith('>setchannel')) {
            const msgout = msg.content.split(" ")
            stats.guild = msgout[1]
            stats.channel = msgout[2]
            msg.reply('Set channel and guild.')
        } else if (msg.content.startsWith('>joinserver')) {
            client.acceptInvite(msg.content.substring(11))
            msg.reply('Attempted to join server.')
        } else if (msg.content.startsWith('>changeres')) {
            const msgout = msg.content.split(" ")
            stats.res[0] = msgout[1]
            stats.res[1] = msgout[2]
            stats.bitrate = msgout[3]
            stats.audioBitrate = msgout[4]
            msg.reply('Set resolution and bitrate.')
        } else if (msg.content.startsWith('>add')) {
            queue.push(msg.content.substring(5))
            msg.reply('Added to stream queue, i will break your life if thats an invalid video.')
        } else if (msg.content == '>loop') {
            if (loop) {
                loop = false
            } else {
                loop = true
            }
            msg.reply('Toggled loop.')
        } else if (msg.content == ">queuelength") {
            msg.reply(`Total: ${playlist.length}\nRemaining: ${playlist.length-(currentpos-1)}`)
        } else if (msg.content == ">playing") {
            msg.reply("Playing song: "+path.basename(playlist[currentpos-1]))
        }
    } else if (msg.content == '>authorizeChannel') {
        auth.channel.push(msg.channel.id)
        msg.reply('Added channel to authorized channel list, this is valid for only this session.')
    } else if (msg.content == ">pingtciformeihatethisstupidfuckingemote") {
        msg.channel.send("<@427111069866000386>")
    }
})
client.on('messageReactionAdd',(reaction,user) => {

})
client.login(process.env.DTOK)
