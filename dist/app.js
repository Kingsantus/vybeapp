"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const telegramConfig_1 = __importDefault(require("./utils/telegramConfig"));
const app = (0, express_1.default)();
telegramConfig_1.default.on('message', (msg) => {
    var _a, _b;
    var Hi = "hi";
    if (((_a = msg.text) === null || _a === void 0 ? void 0 : _a.toString().toLowerCase().indexOf(Hi)) === 0) {
        telegramConfig_1.default.sendMessage(msg.chat.id, "Hello dear user");
    }
    var bye = "bye";
    if (((_b = msg.text) === null || _b === void 0 ? void 0 : _b.toString().toLowerCase().indexOf(bye)) === 0) {
        telegramConfig_1.default.sendMessage(msg.chat.id, "Hope you found the app useful");
    }
});
exports.default = app;
