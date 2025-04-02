import express from "express";
import bot from './utils/telegramConfig';

const app = express();

bot.on('message', (msg) => {

var Hi = "hi";
if (msg.text?.toString().toLowerCase().indexOf(Hi) === 0) {
bot.sendMessage(msg.chat.id,"Hello dear user");
}

var bye = "bye";
if (msg.text?.toString().toLowerCase().indexOf(bye) === 0) {
bot.sendMessage(msg.chat.id,"Hope you found the app useful");
}

});


export default app;